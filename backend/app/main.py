from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings, validate_required_settings
from app.api.router import api_router
from app.db.session import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_settings()
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Finroq API",
    description="Personal finance management API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": "Finroq API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.app_host, port=settings.app_port, reload=settings.is_development)