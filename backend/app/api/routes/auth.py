from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import bcrypt
from datetime import datetime, timedelta
import jwt
import os
from app.db.database import db
from app.api.deps import get_current_user_email

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-neuroanalytics-swift-2026")
ALGORITHM = "HS256"



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
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 6 caracteres")
        
    existing = await db.user.find_unique(where={"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = await db.user.create(
        data={
            "name": user.name,
            "email": user.email,
            "company": user.company,
            "password": hashed_password
        }
    )
    
    token = create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email, "company": new_user.company}}

@router.post("/login")
async def login(req: LoginRequest):
    user = await db.user.find_unique(where={"email": req.email})
    if not user or not bcrypt.checkpw(req.password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "name": user.name, "email": user.email, "company": user.company}}

@router.get("/me")
async def get_me(email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"id": user.id, "name": user.name, "email": user.email, "company": user.company}
