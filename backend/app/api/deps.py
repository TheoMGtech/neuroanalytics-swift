from fastapi import Header, HTTPException
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-neuroanalytics-swift-2026")
ALGORITHM = "HS256"

async def get_current_user_email(authorization: str | None = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token não fornecido ou inválido")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")
