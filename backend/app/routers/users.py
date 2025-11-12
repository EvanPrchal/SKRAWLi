from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_db
from app.models import User, OwnedItem
from app.utils.auth0 import get_current_user

router = APIRouter()

class CoinsResponse(BaseModel):
    coins: int

class IncrementCoinsRequest(BaseModel):
    amount: int

class SetCoinsRequest(BaseModel):
    coins: int

class AddOwnedItemRequest(BaseModel):
    item_id: str

class OwnedItemResponse(BaseModel):
    item_id: str
    created_at: str

@router.get("/users/me/coins", response_model=CoinsResponse)
async def get_coins(
    current_user: User = Depends(get_current_user),
) -> CoinsResponse:
    """Get the current user's coin balance."""
    return CoinsResponse(coins=current_user.coins)

@router.post("/users/me/coins/increment", response_model=CoinsResponse)
async def increment_coins(
    request: IncrementCoinsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CoinsResponse:
    """Increment (or decrement if negative) the user's coins."""
    current_user.coins += request.amount
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return CoinsResponse(coins=current_user.coins)

@router.put("/users/me/coins", response_model=CoinsResponse)
async def set_coins(
    request: SetCoinsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> CoinsResponse:
    """Set the user's coins to a specific value."""
    current_user.coins = request.coins
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return CoinsResponse(coins=current_user.coins)

@router.get("/users/me/owned-items", response_model=list[OwnedItemResponse])
async def get_owned_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[OwnedItemResponse]:
    stmt = select(OwnedItem).where(OwnedItem.user_id == current_user.id)
    rows = db.exec(stmt).all()
    return [OwnedItemResponse(item_id=r.item_id, created_at=r.created_at.isoformat()) for r in rows]

@router.post("/users/me/owned-items", response_model=OwnedItemResponse)
async def add_owned_item(
    request: AddOwnedItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> OwnedItemResponse:
    # Prevent duplicates
    existing_stmt = select(OwnedItem).where(OwnedItem.user_id == current_user.id, OwnedItem.item_id == request.item_id)
    existing = db.exec(existing_stmt).first()
    if existing:
        return OwnedItemResponse(item_id=existing.item_id, created_at=existing.created_at.isoformat())

    owned = OwnedItem(user_id=current_user.id, item_id=request.item_id)
    db.add(owned)
    db.commit()
    db.refresh(owned)
    return OwnedItemResponse(item_id=owned.item_id, created_at=owned.created_at.isoformat())
