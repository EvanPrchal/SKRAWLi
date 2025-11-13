from sqlmodel import Field, SQLModel
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

class OwnedItem(SQLModel, table=True):
    __tablename__ = "owned_items"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    item_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)