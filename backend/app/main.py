from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import badges, users
from app.services.badges import seed_default_badges

app = FastAPI(title="SKRAWLi")

# Configure CORS for Auth0
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, tags=["users"])
app.include_router(badges.router, tags=["badges"])


@app.on_event("startup")
def bootstrap_seed() -> None:
    """Seed default badges on startup."""
    seed_default_badges()