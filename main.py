from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import router

# Cria tabelas no banco
Base.metadata.create_all(bind=engine)

# Inicializa FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    description="API de autenticação completa com login tradicional e OAuth",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra rotas
app.include_router(router)

# Rota raiz
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "API de Autenticação - Imóveis Prime",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login",
            "me": "GET /api/auth/me",
            "forgot_password": "POST /api/auth/forgot-password",
            "reset_password": "PUT /api/auth/reset-password/{token}",
            "verify_email": "GET /api/auth/verify-email/{token}",
            "google_auth": "GET /api/auth/google",
            "logout": "POST /api/auth/logout"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
