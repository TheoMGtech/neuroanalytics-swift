from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import bcrypt
from app.api.deps import get_current_user_email
from app.db.database import db

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: str
    company: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/profile")
async def update_profile(data: ProfileUpdate, email: str = Depends(get_current_user_email)):
    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    updated_user = await db.user.update(
        where={"id": user.id},
        data={"name": data.name, "company": data.company}
    )
    
    return {"id": updated_user.id, "name": updated_user.name, "email": updated_user.email, "company": updated_user.company}

@router.put("/password")
async def update_password(data: PasswordUpdate, email: str = Depends(get_current_user_email)):
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter no mínimo 6 caracteres")

    user = await db.user.find_unique(where={"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
    if not bcrypt.checkpw(data.current_password.encode('utf-8'), user.password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data.new_password.encode('utf-8'), salt).decode('utf-8')
    
    await db.user.update(
        where={"id": user.id},
        data={"password": hashed_password}
    )
    
    return {"message": "Senha atualizada com sucesso"}
