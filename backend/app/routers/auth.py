from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.database import get_db
from app.models import User
from app.schemas import Token
from app.utils.security import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES


router = APIRouter()

@router.post("/token")
async def get_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)) -> Token:
    raise NotImplementedError()