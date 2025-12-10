from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
import secrets
from authlib.integrations.starlette_client import OAuth
from app.database import get_db
from app.models import User
from app.schemas import (
    UserRegister, UserLogin, ForgotPassword, ResetPassword,
    AuthResponse, MessageResponse, UserResponse
)
from app.auth_utils import create_access_token, get_current_user
from app.email_utils import reset_password_email, verify_email_template
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Configuração OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registra novo usuário"""
    # Verifica se email já existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado"
        )
    
    # Cria usuário
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=User.hash_password(user_data.password)
    )
    
    # Gera token de verificação
    verification_token = secrets.token_urlsafe(32)
    new_user.email_verification_token = hashlib.sha256(
        verification_token.encode()
    ).hexdigest()
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Envia email de verificação
    verify_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
    verify_email_template(new_user.email, verify_url, new_user.name)
    
    # Gera token JWT
    access_token = create_access_token(data={"sub": new_user.email})
    
    return AuthResponse(
        success=True,
        message="Usuário cadastrado com sucesso! Verifique seu email.",
        token=access_token,
        user=UserResponse.from_orm(new_user)
    )

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login de usuário"""
    # Busca usuário
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Verifica se é login social
    if not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta conta usa login social. Por favor, use Google ou Apple."
        )
    
    # Verifica senha
    if not user.verify_password(credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Atualiza último login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Gera token
    access_token = create_access_token(data={"sub": user.email})
    
    return AuthResponse(
        success=True,
        message="Login realizado com sucesso!",
        token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retorna dados do usuário atual"""
    return UserResponse.from_orm(current_user)

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    """Solicita redefinição de senha"""
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Não existe usuário com este email"
        )
    
    # Gera token de reset
    reset_token = secrets.token_urlsafe(32)
    user.reset_password_token = hashlib.sha256(reset_token.encode()).hexdigest()
    user.reset_password_expire = datetime.utcnow() + timedelta(minutes=10)
    
    db.commit()
    
    # Envia email
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
    reset_password_email(user.email, reset_url, user.name)
    
    return MessageResponse(
        success=True,
        message="Email de redefinição enviado com sucesso!"
    )

@router.put("/reset-password/{token}", response_model=AuthResponse)
async def reset_password(
    token: str,
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    """Redefine senha"""
    # Hash do token
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Busca usuário
    user = db.query(User).filter(
        User.reset_password_token == token_hash,
        User.reset_password_expire > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado"
        )
    
    # Atualiza senha
    user.password = User.hash_password(data.password)
    user.reset_password_token = None
    user.reset_password_expire = None
    
    db.commit()
    
    # Gera novo token
    access_token = create_access_token(data={"sub": user.email})
    
    return AuthResponse(
        success=True,
        message="Senha redefinida com sucesso!",
        token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.get("/verify-email/{token}", response_model=MessageResponse)
async def verify_email(token: str, db: Session = Depends(get_db)):
    """Verifica email"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    user = db.query(User).filter(
        User.email_verification_token == token_hash
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificação inválido"
        )
    
    user.is_email_verified = True
    user.email_verification_token = None
    db.commit()
    
    return MessageResponse(
        success=True,
        message="Email verificado com sucesso!"
    )

@router.get("/google")
async def google_login(request):
    """Inicia login com Google"""
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request, db: Session = Depends(get_db)):
    """Callback do Google OAuth"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Falha ao obter informações do Google"
            )
        
        # Busca ou cria usuário
        user = db.query(User).filter(User.google_id == user_info['sub']).first()
        
        if not user:
            # Verifica se existe usuário com o mesmo email
            user = db.query(User).filter(User.email == user_info['email']).first()
            
            if user:
                # Vincula conta Google
                user.google_id = user_info['sub']
                user.avatar = user_info.get('picture')
                user.is_email_verified = True
            else:
                # Cria novo usuário
                user = User(
                    google_id=user_info['sub'],
                    name=user_info['name'],
                    email=user_info['email'],
                    avatar=user_info.get('picture'),
                    is_email_verified=True
                )
                db.add(user)
        
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        # Gera token JWT
        access_token = create_access_token(data={"sub": user.email})
        
        # Redireciona para frontend com token
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}"
        )
        
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed"
        )

@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_user)):
    """Logout (invalidar token no frontend)"""
    return MessageResponse(
        success=True,
        message="Logout realizado com sucesso!"
    )
