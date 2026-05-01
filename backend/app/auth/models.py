from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    analyst = "analyst"
    viewer = "viewer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    role: UserRole = UserRole.viewer


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None