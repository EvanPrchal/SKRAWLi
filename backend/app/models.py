from sqlmodel import Field, SQLModel, Relationship
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    auth0_sub: str = Field(unique=True, index=True)
    coins: int = Field(default=0)
    bio: Optional[str] = Field(default=None, max_length=500)
    display_name: Optional[str] = Field(default=None, max_length=50)
    profile_background: Optional[str] = Field(default="bg-skrawl-black", max_length=50)
    showcased_badges: Optional[str] = Field(default=None, max_length=200)  # Comma-separated badge codes
    
    badges: list["UserBadge"] = Relationship(back_populates="user")

class OwnedItem(SQLModel, table=True):
    __tablename__ = "owned_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    item_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Badge(SQLModel, table=True):
    __tablename__ = "badges"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True, max_length=64)
    name: str = Field(max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    
    owners: list["UserBadge"] = Relationship(back_populates="badge")


class UserBadge(SQLModel, table=True):
    __tablename__ = "user_badges"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    badge_id: int = Field(foreign_key="badges.id")
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="badges")
    badge: "Badge" = Relationship(back_populates="owners")