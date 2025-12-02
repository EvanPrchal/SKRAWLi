from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import User, FriendRequest
from app.utils.auth0 import get_current_user

router = APIRouter()

class UserSummary(BaseModel):
    id: int
    display_name: str | None
    bio: str | None
    profile_background: str | None
    picture_url: str | None
    showcased_badges: str | None

class FriendRequestResponse(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: str
    created_at: str
    responded_at: str | None

class FriendRequestsList(BaseModel):
    inbound: list[FriendRequestResponse]
    outbound: list[FriendRequestResponse]

def summarize_user(u: User) -> UserSummary:
    display_name = (u.display_name or "").strip() or None
    if not display_name:
        display_name = f"Player #{u.id}" if u.id is not None else None
    return UserSummary(
        id=u.id,
        display_name=display_name,
        bio=u.bio,
        profile_background=u.profile_background,
        picture_url=u.picture_url,
        showcased_badges=u.showcased_badges,
    )

@router.get("/users/browse", response_model=list[UserSummary])
def browse_users(
    query: str | None = None,
    offset: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Basic pagination with ordering by newest users first
    limit = max(1, min(limit, 50))
    stmt = select(User)
    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(or_(User.display_name.ilike(q), User.bio.ilike(q)))
    stmt = stmt.order_by(User.id.desc()).offset(offset).limit(limit)
    users = db.exec(stmt).all()
    return [summarize_user(u) for u in users if u.id != current_user.id]

@router.post("/users/friends/request/{target_user_id}", response_model=FriendRequestResponse)
def create_friend_request(target_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    target = db.get(User, target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
    # Check existing (either direction)
    existing_stmt = select(FriendRequest).where(
        or_(
            (FriendRequest.requester_id == current_user.id) & (FriendRequest.receiver_id == target_user_id),
            (FriendRequest.requester_id == target_user_id) & (FriendRequest.receiver_id == current_user.id),
        )
    )
    existing = db.exec(existing_stmt).first()
    if existing:
        raise HTTPException(status_code=409, detail="Friend request already exists or users already friends")
    fr = FriendRequest(requester_id=current_user.id, receiver_id=target_user_id, status="pending")
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FriendRequestResponse(
        id=fr.id,
        requester_id=fr.requester_id,
        receiver_id=fr.receiver_id,
        status=fr.status,
        created_at=fr.created_at.isoformat(),
        responded_at=fr.responded_at.isoformat() if fr.responded_at else None,
    )

@router.get("/users/me/friends/requests", response_model=FriendRequestsList)
def list_friend_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inbound_stmt = select(FriendRequest).where(FriendRequest.receiver_id == current_user.id, FriendRequest.status == "pending")
    outbound_stmt = select(FriendRequest).where(FriendRequest.requester_id == current_user.id, FriendRequest.status == "pending")
    inbound = db.exec(inbound_stmt).all()
    outbound = db.exec(outbound_stmt).all()
    def serialize(fr: FriendRequest) -> FriendRequestResponse:
        return FriendRequestResponse(
            id=fr.id,
            requester_id=fr.requester_id,
            receiver_id=fr.receiver_id,
            status=fr.status,
            created_at=fr.created_at.isoformat(),
            responded_at=fr.responded_at.isoformat() if fr.responded_at else None,
        )
    return FriendRequestsList(inbound=[serialize(fr) for fr in inbound], outbound=[serialize(fr) for fr in outbound])

@router.post("/users/friends/request/{request_id}/accept", response_model=FriendRequestResponse)
def accept_friend_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fr = db.get(FriendRequest, request_id)
    if not fr or fr.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if fr.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    fr.status = "accepted"
    fr.responded_at = datetime.utcnow()
    db.add(fr)
    db.commit()
    db.refresh(fr)
    return FriendRequestResponse(
        id=fr.id,
        requester_id=fr.requester_id,
        receiver_id=fr.receiver_id,
        status=fr.status,
        created_at=fr.created_at.isoformat(),
        responded_at=fr.responded_at.isoformat() if fr.responded_at else None,
    )

@router.post("/users/friends/request/{request_id}/decline")
def decline_friend_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fr = db.get(FriendRequest, request_id)
    if not fr or fr.receiver_id != current_user.id:
        raise HTTPException(status_code=404, detail="Friend request not found")
    if fr.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    db.delete(fr)
    db.commit()
    return {"status": "declined"}

@router.get("/users/me/friends", response_model=list[UserSummary])
def list_friends(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(FriendRequest).where(
        or_(FriendRequest.requester_id == current_user.id, FriendRequest.receiver_id == current_user.id),
        FriendRequest.status == "accepted"
    )
    rows = db.exec(stmt).all()
    friend_ids: set[int] = set()
    for fr in rows:
        other_id = fr.receiver_id if fr.requester_id == current_user.id else fr.requester_id
        friend_ids.add(other_id)
    if not friend_ids:
        return []
    users_stmt = select(User).where(User.id.in_(friend_ids))
    friends = db.exec(users_stmt).all()
    return [summarize_user(u) for u in friends]

@router.delete("/users/friends/{friend_user_id}")
def remove_friend(friend_user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(FriendRequest).where(
        or_(
            (FriendRequest.requester_id == current_user.id) & (FriendRequest.receiver_id == friend_user_id),
            (FriendRequest.requester_id == friend_user_id) & (FriendRequest.receiver_id == current_user.id),
        ),
        FriendRequest.status == "accepted"
    )
    fr = db.exec(stmt).first()
    if not fr:
        raise HTTPException(status_code=404, detail="Friend link not found")
    db.delete(fr)
    db.commit()
    return {"status": "removed"}