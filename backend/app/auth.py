# backend/app/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User
from app.utils import verify_password, hash_password
from app.db import get_db
import os

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# JWT setup
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 5
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    payload = verify_access_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(401, "Invalid token payload")
    q = await db.execute(select(User).where(User.username == username))
    user = q.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")
    return {"id": user.id, "username": user.username, "role": user.role}


def require_admin(current_user = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(User).where(User.username == form_data.username))
    user = q.scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "temp_password": user.temp_password,
    }


@router.post("/change_password")
async def change_password(
    body: dict = Body(...),
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_pw = body.get("new_password")
    current_pw = body.get("current_password")
    if not new_pw or len(new_pw) < 16:
        raise HTTPException(400, "Password must be 16+ characters")

    q = await db.execute(select(User).where(User.id == current_user["id"]))
    user = q.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")

    if not user.temp_password and not verify_password(current_pw, user.password_hash):
        raise HTTPException(401, "Incorrect current password")

    user.password_hash = hash_password(new_pw)
    user.temp_password = False
    await db.commit()
    return {"status": "ok", "message": "Password changed"}
