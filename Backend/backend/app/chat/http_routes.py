"""HTTP routes for the chat sub-system."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from ..models import (
    ChatMessage,
    ChatUser,
    CreateMessageRequest,
    JoinRequest,
    JoinResponse,
    PublicKeyRequest,
)
from .connection_manager import manager

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ---------------------------------------------------------------------- helpers


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _resolve_user(request: Request) -> ChatUser:
    """Extract the chat token from the request and return the associated user."""
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.headers.get("X-User-Token", "")
    user = manager.get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Token inválido o sesión expirada.")
    return user


# ---------------------------------------------------------------------- routes


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/join", response_model=JoinResponse, status_code=201)
async def join_chat(body: JoinRequest) -> JoinResponse:
    """Register a nickname and obtain a session token."""
    nickname = body.nickname.strip()
    if not nickname:
        raise HTTPException(status_code=422, detail="El nickname no puede estar vacío.")

    user = ChatUser(
        id=str(uuid.uuid4()),
        nickname=nickname,
        joined_at=_now_iso(),
        is_online=False,
        public_key=None,
    )
    token = manager.create_token(user)
    return JoinResponse(user=user, token=token)


@router.post("/logout", status_code=200)
async def logout_chat(request: Request) -> dict[str, str]:
    """Revoke the current session token."""
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.headers.get("X-User-Token", "")
    if token:
        user = manager.revoke_token(token)
        if user:
            await manager.disconnect(user.id)
    return {"status": "logged_out"}


@router.get("/users", response_model=list[ChatUser])
async def list_users(
    online_only: bool = Query(False, description="Si es true, devuelve solo usuarios en línea."),
    _user: ChatUser = Depends(_resolve_user),
) -> list[ChatUser]:
    """Return connected users."""
    return manager.online_users() if online_only else manager.all_users()


@router.get("/messages", response_model=list[ChatMessage])
async def get_group_messages(
    limit: int = Query(100, ge=1, le=500),
    _user: ChatUser = Depends(_resolve_user),
) -> list[ChatMessage]:
    """Return recent group chat history."""
    return manager.group_history(limit=limit)


@router.get("/messages/dm/{other_id}", response_model=list[ChatMessage])
async def get_dm_messages(
    other_id: str,
    limit: int = Query(50, ge=1, le=200),
    user: ChatUser = Depends(_resolve_user),
) -> list[ChatMessage]:
    """Return DM history between the current user and other_id."""
    return manager.dm_history(user.id, other_id, limit=limit)


@router.post("/messages", response_model=ChatMessage, status_code=201)
async def post_message(
    body: CreateMessageRequest,
    user: ChatUser = Depends(_resolve_user),
) -> ChatMessage:
    """Save a group or DM message and push it via WebSocket."""
    if body.type == "dm":
        if not body.recipient_id:
            raise HTTPException(
                status_code=422,
                detail="Se requiere recipient_id para mensajes directos.",
            )
        return await manager.handle_dm_message(
            sender=user,
            recipient_id=body.recipient_id,
            content=body.content,
            ttl=body.ttl,
            allow_read_receipt=body.allow_read_receipt,
        )

    return await manager.handle_group_message(
        sender=user,
        content=body.content,
        ttl=body.ttl,
        allow_read_receipt=body.allow_read_receipt,
    )


@router.put("/users/me/public-key", status_code=200)
async def register_public_key(
    body: PublicKeyRequest,
    user: ChatUser = Depends(_resolve_user),
) -> dict[str, str]:
    """Register or update the Curve25519 public key for the current user."""
    ok = manager.set_public_key(user.id, body.public_key)
    if not ok:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return {"status": "ok", "user_id": user.id}
