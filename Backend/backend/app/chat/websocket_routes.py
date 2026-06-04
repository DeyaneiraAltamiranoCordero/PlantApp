"""WebSocket route for the real-time chat sub-system."""

from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .connection_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat-ws"])


@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str) -> None:
    """
    Persistent WebSocket connection identified by the session token obtained via POST /api/chat/join.

    Client → Server events (JSON):
      { "type": "ping" }
      { "type": "mark_read", "message_id": "<id>" }

    Server → Client events (JSON):
      { "type": "pong" }
      { "type": "group_history",  "messages": [...] }
      { "type": "users_list",     "users": [...] }
      { "type": "group_message",  "message": {...} }
      { "type": "dm_message",     "message": {...} }
      { "type": "user_joined",    "user": {...} }
      { "type": "user_left",      "user_id": "..." }
      { "type": "read_receipt",   "message_id": "...", "reader_id": "..." }
      { "type": "error",          "message": "..." }
    """
    user = await manager.connect(websocket, token)
    if user is None:
        # connect() already closed the socket with code 4001
        return

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif event_type == "mark_read":
                message_id = data.get("message_id", "")
                if message_id:
                    await manager.send_read_receipt(user.id, message_id)

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Tipo de evento desconocido: '{event_type}'.",
                })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.exception("Error inesperado en WS de %s: %s", user.id, exc)
    finally:
        await manager.disconnect(user.id)
