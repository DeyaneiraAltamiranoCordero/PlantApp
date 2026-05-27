"""Firebase initialization helpers, Cloudinary uploads and Firestore client factory."""

from functools import lru_cache
import base64
import hashlib
import time
from typing import Any

import httpx

import firebase_admin
from firebase_admin import credentials, firestore

from .config import get_settings


def _parse_cloudinary_url() -> tuple[str, str, str]:
    """Return the Cloudinary API credentials from CLOUDINARY_URL."""

    settings = get_settings()
    raw_url = settings.cloudinary_url
    if not raw_url:
        raise FileNotFoundError(
            "CLOUDINARY_URL no esta configurado. Define la variable de entorno CLOUDINARY_URL"
        )

    if not raw_url.startswith("cloudinary://"):
        raise ValueError("CLOUDINARY_URL tiene un formato invalido")

    try:
        credentials_part = raw_url.removeprefix("cloudinary://")
        api_pair, cloud_name = credentials_part.rsplit("@", maxsplit=1)
        api_key, api_secret = api_pair.split(":", maxsplit=1)
    except ValueError as exc:
        raise ValueError("CLOUDINARY_URL tiene un formato invalido") from exc

    if not api_key or not api_secret or not cloud_name:
        raise ValueError("CLOUDINARY_URL tiene un formato invalido")

    return api_key, api_secret, cloud_name


def _guess_mime_type(filename: str, content_type_hint: str | None = None) -> str:
    """Infer a MIME type for the image upload."""

    if content_type_hint and content_type_hint.startswith("image/"):
        return content_type_hint

    lowered = filename.lower()
    if lowered.endswith(".png"):
        return "image/png"
    if lowered.endswith(".webp"):
        return "image/webp"
    if lowered.endswith(".gif"):
        return "image/gif"
    return "image/jpeg"


def _decode_base64_payload(content: str) -> tuple[bytes, str | None]:
    """Decode a base64 payload and preserve an optional data URI MIME type."""

    mime_type: str | None = None
    payload = content.strip()

    if payload.startswith("data:") and "," in payload:
        header, payload = payload.split(",", maxsplit=1)
        mime_type = header[5:].split(";", maxsplit=1)[0] or None

    try:
        return base64.b64decode(payload), mime_type
    except Exception as exc:  # pragma: no cover - defensive guard
        raise ValueError("Contenido base64 invalido") from exc


def upload_image_to_cloudinary(
    *,
    folder: str,
    filename: str,
    content: str,
    public_id: str | None = None,
    overwrite: bool = True,
) -> str:
    """Upload a base64 image payload to Cloudinary and return the secure URL."""

    api_key, api_secret, cloud_name = _parse_cloudinary_url()
    data, content_type_hint = _decode_base64_payload(content)

    folder_name = folder.strip().strip("/")
    safe_filename = filename.strip().strip("/") or "image.jpg"
    inferred_mime = _guess_mime_type(safe_filename, content_type_hint)

    public_id_value = (public_id or safe_filename.rsplit(".", maxsplit=1)[0]).strip().strip("/")
    timestamp = str(int(time.time()))

    upload_params = {
        "timestamp": timestamp,
        "folder": folder_name,
        "public_id": public_id_value,
        "overwrite": "true" if overwrite else "false",
    }
    signature_base = "&".join(
        f"{key}={value}" for key, value in sorted(upload_params.items())
    )
    signature = hashlib.sha1(f"{signature_base}{api_secret}".encode("utf-8")).hexdigest()

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    files = {"file": (safe_filename, data, inferred_mime)}
    form_data = {
        **upload_params,
        "api_key": api_key,
        "signature": signature,
    }

    response = httpx.post(upload_url, data=form_data, files=files, timeout=60.0)
    if response.status_code >= 400:
        raise RuntimeError(
            f"Error subiendo a Cloudinary: {response.status_code} {response.text}"
        )

    payload = response.json()
    secure_url = payload.get("secure_url")
    if not isinstance(secure_url, str) or not secure_url:
        raise RuntimeError("Cloudinary no devolvio una secure_url valida")

    return secure_url


@lru_cache(maxsize=1)
def get_firestore_client() -> Any:
    """Return a cached Firestore client using the configured service account."""

    settings = get_settings()

    if not settings.firebase_service_account_path.exists():
        raise FileNotFoundError(
            "No se encontro el archivo de credenciales de Firebase en "
            f"{settings.firebase_service_account_path}"
        )

    try:
        firebase_admin.get_app()
    except ValueError:
        credential = credentials.Certificate(
            str(settings.firebase_service_account_path)
        )
        try:
            firebase_admin.initialize_app(credential)
        except ValueError:
            # Another thread might have initialized it just now.
            pass

    return firestore.client()
