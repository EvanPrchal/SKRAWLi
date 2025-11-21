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

class BioResponse(BaseModel):
    bio: str | None

class UpdateBioRequest(BaseModel):
    bio: str

class DisplayNameResponse(BaseModel):
    display_name: str | None

class UpdateDisplayNameRequest(BaseModel):
    display_name: str

class ProfileBackgroundResponse(BaseModel):
    profile_background: str | None

class UpdateProfileBackgroundRequest(BaseModel):
    profile_background: str

class ShowcasedBadgesResponse(BaseModel):
    showcased_badges: str | None

class UpdateShowcasedBadgesRequest(BaseModel):
    showcased_badges: str

class ProfileResponse(BaseModel):
    id: int
    display_name: str | None
    bio: str | None
    profile_background: str | None
    showcased_badges: str | None
    picture_url: str | None

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

@router.get("/users/me/bio", response_model=BioResponse)
async def get_bio(
    current_user: User = Depends(get_current_user),
) -> BioResponse:
    """Get the current user's bio."""
    return BioResponse(bio=current_user.bio)

@router.put("/users/me/bio", response_model=BioResponse)
async def update_bio(
    request: UpdateBioRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BioResponse:
    """Update the user's bio."""
    if len(request.bio) > 500:
        raise HTTPException(status_code=400, detail="Bio must be 500 characters or less")
    current_user.bio = request.bio
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return BioResponse(bio=current_user.bio)

@router.get("/users/me/display-name", response_model=DisplayNameResponse)
async def get_display_name(
    current_user: User = Depends(get_current_user),
) -> DisplayNameResponse:
    """Get the current user's display name."""
    return DisplayNameResponse(display_name=current_user.display_name)

@router.put("/users/me/display-name", response_model=DisplayNameResponse)
async def update_display_name(
    request: UpdateDisplayNameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> DisplayNameResponse:
    """Update the user's display name."""
    if len(request.display_name) > 50:
        raise HTTPException(status_code=400, detail="Display name must be 50 characters or less")
    if len(request.display_name.strip()) == 0:
        raise HTTPException(status_code=400, detail="Display name cannot be empty")
    current_user.display_name = request.display_name
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return DisplayNameResponse(display_name=current_user.display_name)

@router.get("/users/me/profile-background", response_model=ProfileBackgroundResponse)
async def get_profile_background(
    current_user: User = Depends(get_current_user),
) -> ProfileBackgroundResponse:
    """Get the current user's profile background."""
    return ProfileBackgroundResponse(profile_background=current_user.profile_background)

@router.put("/users/me/profile-background", response_model=ProfileBackgroundResponse)
async def update_profile_background(
    request: UpdateProfileBackgroundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ProfileBackgroundResponse:
    """Update the user's profile background."""
    current_user.profile_background = request.profile_background
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return ProfileBackgroundResponse(profile_background=current_user.profile_background)

@router.get("/users/me/showcased-badges", response_model=ShowcasedBadgesResponse)
async def get_showcased_badges(
    current_user: User = Depends(get_current_user),
) -> ShowcasedBadgesResponse:
    """Get the current user's showcased badges."""
    return ShowcasedBadgesResponse(showcased_badges=current_user.showcased_badges)

@router.put("/users/me/showcased-badges", response_model=ShowcasedBadgesResponse)
async def update_showcased_badges(
    request: UpdateShowcasedBadgesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ShowcasedBadgesResponse:
    """Update the user's showcased badges (up to 3, comma-separated codes)."""
    current_user.showcased_badges = request.showcased_badges
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return ShowcasedBadgesResponse(showcased_badges=current_user.showcased_badges)

@router.get("/users/{user_id}/profile", response_model=ProfileResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)) -> ProfileResponse:
    """Get public profile information for a user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileResponse(
        id=user.id,
        display_name=user.display_name,
        bio=user.bio,
        profile_background=user.profile_background,
        showcased_badges=user.showcased_badges,
        picture_url=user.picture_url,
    )
