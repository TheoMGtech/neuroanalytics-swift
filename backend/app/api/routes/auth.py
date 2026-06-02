from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from app.db.database import db

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-neuroanalytics-swift-2026")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    company: str
    password: str

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=1440))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
async def register(user: RegisterRequest):
    existing = await db.user.find_unique(where={"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
    hashed_password = pwd_context.hash(user.password)
    
    new_user = await db.user.create(
        data={
            "name": user.name,
            "email": user.email,
            "company": user.company,
            "password": hashed_password
        }
    )
    
    token = create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}}

@router.post("/login")
async def login(req: LoginRequest):
    user = await db.user.find_unique(where={"email": req.email})
    if not user or not pwd_context.verify(req.password, user.password):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email}}
