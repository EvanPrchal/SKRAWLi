from fastapi import FastAPI

from app.routers import ai, auth

app = FastAPI(title="SKRAWLi")

app.include_router(auth.router, prefix="/auth", tags=["auth"])