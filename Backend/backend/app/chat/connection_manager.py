"""ConnectionManager: central hub for WebSocket connections, presence and message store."""

from __future__ import annotations

import asyncio
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any

from fastapi import WebSocket

from ..models import ChatMessage, ChatUser

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

# Maximum messages kept in the in-memory store per scope.
_MAX_GROUP = 200
_MAX_DM = 100


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _expires_iso(ttl_seconds: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).isoformat()


class ConnectionManager:
    """Manages WebSocket connections, presence, message storage and TTL expiry."""

    def __init__(self) -> None:
        # token → ChatUser
        self._tokens: dict[str, ChatUser] = {}
        # user_id → WebSocket
        self._connections: dict[str, WebSocket] = {}
        # Group message list
        self._group_messages: list[ChatMessage] = []
        # DM messages: frozenset({id_a, id_b}) → list[ChatMessage]
        self._dm_messages: dict[frozenset[str], list[ChatMessage]] = {}
        # TTL tasks
        self._ttl_tasks: dict[str, asyncio.Task[None]] = {}

    # ------------------------------------------------------------------ tokens

    def create_token(self, user: ChatUser) -> str:
        token = secrets.token_urlsafe(32)
        self._tokens[token] = user
        return token

    def revoke_token(self, token: str) -> ChatUser | None:
        return self._tokens.pop(token, None)

    def get_user_by_token(self, token: str) -> ChatUser | None:
        return self._tokens.get(token)

    # ---------------------------------------------------------------- presence

    def all_users(self) -> list[ChatUser]:
        return list(self._tokens.values())

    def online_users(self) -> list[ChatUser]:
        return [u for u in self._tokens.values() if u.is_online]

    def _find_user(self, user_id: str) -> ChatUser | None:
        for user in self._tokens.values():
            if user.id == user_id:
                return user
        return None

    # ----------------------------------------------------- WebSocket lifecycle

    async def connect(self, websocket: WebSocket, token: str) -> ChatUser | None:
        user = self.get_user_by_token(token)
        if user is None:
            await websocket.close(code=4001)
            return None

        await websocket.accept()
        user.is_online = True
        self._connections[user.id] = websocket
        logger.info("WS connected: %s (%s)", user.nickname, user.id)

        # Broadcast join event to everyone else
        join_event = {"type": "user_joined", "user": user.model_dump()}
        await self._broadcast(join_event, exclude_id=user.id)

        # Send the current online users list to the newcomer
        await self._send_to(user.id, {
            "type": "users_list",
            "users": [u.model_dump() for u in self.all_users()],
        })

        # Send group history to the newcomer
        await self._send_to(user.id, {
            "type": "group_history",
            "messages": [m.model_dump() for m in self._group_messages],
        })

        return user

    async def disconnect(self, user_id: str) -> None:
        user = self._find_user(user_id)
        if user:
            user.is_online = False

        self._connections.pop(user_id, None)
        if user:
            await self._broadcast({"type": "user_left", "user_id": user_id})
        logger.info("WS disconnected: %s", user_id)

    # ----------------------------------------------------------- broadcasting

    async def _send_to(self, user_id: str, payload: dict[str, Any]) -> None:
        ws = self._connections.get(user_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception:
                pass

    async def _broadcast(self, payload: dict[str, Any], *, exclude_id: str | None = None) -> None:
        dead: list[str] = []
        for uid, ws in list(self._connections.items()):
            if uid == exclude_id:
                continue
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(uid)
        for uid in dead:
            await self.disconnect(uid)

    # ------------------------------------------------------- message handling

    def _schedule_ttl(self, message: ChatMessage, store: list[ChatMessage]) -> None:
        if not message.ttl:
            return
        task_id = message.id

        async def _expire() -> None:
            try:
                delay = (
                    datetime.fromisoformat(message.expires_at) - datetime.now(timezone.utc)
                ).total_seconds()
                if delay > 0:
                    await asyncio.sleep(delay)
                try:
                    store.remove(message)
                except ValueError:
                    pass
                logger.debug("TTL expired: %s", task_id)
            finally:
                self._ttl_tasks.pop(task_id, None)

        self._ttl_tasks[task_id] = asyncio.create_task(_expire())

    async def handle_group_message(
        self,
        sender: ChatUser,
        content: str,
        ttl: int | None = None,
        allow_read_receipt: bool = True,
        media: Any = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            id=str(uuid.uuid4()),
            sender_id=sender.id,
            sender_nickname=sender.nickname,
            content=content,
            type="group",
            recipient_id=None,
            timestamp=_now_iso(),
            ttl=ttl,
            expires_at=_expires_iso(ttl) if ttl else None,
            allow_read_receipt=allow_read_receipt,
            media=media,
        )
        self._group_messages.append(msg)
        # Trim history
        if len(self._group_messages) > _MAX_GROUP:
            self._group_messages = self._group_messages[-_MAX_GROUP:]
        if ttl:
            self._schedule_ttl(msg, self._group_messages)
        # Broadcast to all
        await self._broadcast({"type": "group_message", "message": msg.model_dump()})
        return msg

    async def handle_dm_message(
        self,
        sender: ChatUser,
        recipient_id: str,
        content: str,
        ttl: int | None = None,
        allow_read_receipt: bool = True,
        media: Any = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            id=str(uuid.uuid4()),
            sender_id=sender.id,
            sender_nickname=sender.nickname,
            content=content,
            type="dm",
            recipient_id=recipient_id,
            timestamp=_now_iso(),
            ttl=ttl,
            expires_at=_expires_iso(ttl) if ttl else None,
            allow_read_receipt=allow_read_receipt,
            media=media,
        )
        key: frozenset[str] = frozenset({sender.id, recipient_id})
        bucket = self._dm_messages.setdefault(key, [])
        bucket.append(msg)
        if len(bucket) > _MAX_DM:
            self._dm_messages[key] = bucket[-_MAX_DM:]
        if ttl:
            self._schedule_ttl(msg, bucket)
        # Deliver to sender and recipient
        payload = {"type": "dm_message", "message": msg.model_dump()}
        await self._send_to(sender.id, payload)
        if recipient_id != sender.id:
            await self._send_to(recipient_id, payload)
        return msg

    # ------------------------------------------------------- history helpers

    def group_history(self, limit: int = 100) -> list[ChatMessage]:
        return self._group_messages[-limit:]

    def dm_history(self, user_a: str, user_b: str, limit: int = 50) -> list[ChatMessage]:
        key: frozenset[str] = frozenset({user_a, user_b})
        return self._dm_messages.get(key, [])[-limit:]

    # --------------------------------------------------- public key registry

    def set_public_key(self, user_id: str, public_key: str) -> bool:
        user = self._find_user(user_id)
        if user is None:
            return False
        user.public_key = public_key
        return True

    # ------------------------------------------------------- read receipts

    async def send_read_receipt(self, reader_id: str, message_id: str) -> None:
        # Find message and notify sender if they allow receipts
        for msg in self._group_messages:
            if msg.id == message_id and msg.allow_read_receipt:
                await self._send_to(msg.sender_id, {
                    "type": "read_receipt",
                    "message_id": message_id,
                    "reader_id": reader_id,
                })
                return
        for bucket in self._dm_messages.values():
            for msg in bucket:
                if msg.id == message_id and msg.allow_read_receipt:
                    await self._send_to(msg.sender_id, {
                        "type": "read_receipt",
                        "message_id": message_id,
                        "reader_id": reader_id,
                    })
                    return


# Singleton instance
manager = ConnectionManager()
