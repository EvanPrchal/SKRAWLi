"""Badge endpoints for listing and awarding achievements."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.database import get_db
from app.models import Badge, User, UserBadge
from app.utils.auth0 import get_current_user

router = APIRouter()


class BadgeResponse(BaseModel):
    code: str
    name: str
    description: str | None = None


class AwardBadgeResponse(BaseModel):
    status: Literal["awarded", "exists"]
    code: str


@router.get("/badges", response_model=list[BadgeResponse])
async def list_badges(db: Session = Depends(get_db)) -> list[BadgeResponse]:
    """Get all available badge definitions."""
    badges = db.exec(select(Badge).order_by(Badge.name)).all()
    return [BadgeResponse(code=b.code, name=b.name, description=b.description) for b in badges]


@router.get("/users/me/badges", response_model=list[BadgeResponse])
async def list_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BadgeResponse]:
    """Get all badges earned by the current user."""
    stmt = (
        select(UserBadge)
        .where(UserBadge.user_id == current_user.id)
        .options(selectinload(UserBadge.badge))
        .order_by(UserBadge.earned_at)
    )
    records = db.exec(stmt).all()
    return [
        BadgeResponse(code=record.badge.code, name=record.badge.name, description=record.badge.description)
        for record in records
    ]


@router.post("/users/me/badges/{badge_code}", response_model=AwardBadgeResponse, status_code=status.HTTP_200_OK)
async def award_badge(
    badge_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AwardBadgeResponse:
    """Award a badge to the current user."""
    badge = db.exec(select(Badge).where(Badge.code == badge_code)).first()
    if badge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Badge not found")

    existing = db.exec(
        select(UserBadge).where(
            UserBadge.user_id == current_user.id,
            UserBadge.badge_id == badge.id,
        )
    ).first()
    if existing:
        return AwardBadgeResponse(status="exists", code=badge.code)

    user_badge = UserBadge(user_id=current_user.id, badge_id=badge.id)
    db.add(user_badge)
    db.commit()
    return AwardBadgeResponse(status="awarded", code=badge.code)
