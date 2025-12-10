from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Schemas de Request
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    password: str = Field(..., min_length=6, max_length=100)

class TokenData(BaseModel):
    email: Optional[str] = None

# Schemas de Response
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str] = None
    is_email_verified: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AuthResponse(BaseModel):
    success: bool
    message: str
    token: str
    user: UserResponse

class MessageResponse(BaseModel):
    success: bool
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: Optional[str] = None
