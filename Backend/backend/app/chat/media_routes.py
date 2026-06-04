"""Media upload route for the chat sub-system (Cloudinary integration)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile

from ..models import ChatUser, MediaAttachment
from ..services import cloudinary_service
from .http_routes import _resolve_user

router = APIRouter(prefix="/api/chat/media", tags=["chat-media"])

# Maximum upload size: 10 MB
_MAX_BYTES = 10 * 1024 * 1024


@router.post("/upload", response_model=MediaAttachment, status_code=201)
async def upload_media(
    file: UploadFile,
    user: ChatUser = Depends(_resolve_user),
) -> MediaAttachment:
    """Upload an image/video to Cloudinary and return the MediaAttachment metadata."""
    raw = await file.read()
    if len(raw) > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo supera el límite de {_MAX_BYTES // (1024 * 1024)} MB.",
        )

    filename = file.filename or "upload"
    mime_type = file.content_type or cloudinary_service.guess_mime(filename)

    try:
        attachment = cloudinary_service.upload_file(
            file_bytes=raw,
            filename=filename,
            mime_type=mime_type,
            user_id=user.id,
        )
    except cloudinary_service.UploadError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return attachment
