"""Firebase initialization helpers and Firestore client factory."""

from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from .config import get_settings
from typing import Any


def get_storage_bucket() -> Any:
    """Return a google-cloud storage Bucket using the service account."""
    settings = get_settings()
    bucket_name = settings.firebase_storage_bucket
    if not bucket_name:
        raise FileNotFoundError(
            "FIREBASE_STORAGE_BUCKET no esta configurado. Define la variable de entorno FIREBASE_STORAGE_BUCKET"
        )

    try:
        from google.cloud import storage
    except Exception as e:  # pragma: no cover - environment dep
        raise RuntimeError("google-cloud-storage no está disponible en el entorno del backend") from e

    # Create client from the service account file
    client = storage.Client.from_service_account_json(str(settings.firebase_service_account_path))
    bucket = client.bucket(bucket_name)
    return bucket


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
