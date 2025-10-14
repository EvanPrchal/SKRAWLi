from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from jwt.exceptions import InvalidTokenError
from decouple import config
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from passlib.context import CryptContext

from app.models import User
from app.database import get_db
from app.schemas import TokenData


SECRET_KEY = config("SECRET_KEY")
ALGORITHM = config("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(config("ACCESS_TOKEN_EXPIRE_MINUTES"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")
pwd_context = CryptContext(schemes=["bcrypt"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    raise NotImplementedError()

def hash_password(password: str) -> str:
    raise NotImplementedError()

def authenticate_user(username: str, password: str, db: Session) -> User | bool:
    raise NotImplementedError()

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    raise NotImplementedError()

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> User:
    raise NotImplementedError()