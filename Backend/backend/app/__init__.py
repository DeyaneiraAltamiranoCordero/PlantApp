"""App factory and API wiring for the plant backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import router
from .chat.http_routes import router as chat_http_router
from .chat.media_routes import router as chat_media_router
from .chat.websocket_routes import router as chat_ws_router


def create_app() -> FastAPI:
    """Build and configure the FastAPI instance with routers and middleware."""
    settings = get_settings()
    app = FastAPI(
        title="Plant Project API",
        version="1.0.0",
        description="API en FastAPI sobre Firebase Firestore para la app de plantas.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    app.include_router(chat_http_router)
    app.include_router(chat_media_router)
    app.include_router(chat_ws_router)
    return app
