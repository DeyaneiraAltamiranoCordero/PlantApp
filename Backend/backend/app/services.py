"""Helpers para leer y escribir datos en Firestore."""

from datetime import datetime
from typing import Any
import os
import httpx
from fastapi import HTTPException
from firebase_admin import auth

from .firebase import get_firestore_client


def _serialize_value(value: Any) -> Any:
    """Convierte valores Firestore a tipos JSON seguros."""

    if hasattr(value, "isoformat"):
        return value.isoformat()

    if isinstance(value, list):
        return [_serialize_value(item) for item in value]

    if isinstance(value, dict):
        return {
            nested_key: _serialize_value(nested_value)
            for nested_key, nested_value in value.items()
        }

    return value


def _serialize_document(document) -> dict[str, Any]:
    """Agrega el ID al payload serializado de Firestore."""

    payload = {
        key: _serialize_value(value) for key, value in document.to_dict().items()
    }
    payload["id"] = document.id
    return payload


def get_document(collection_name: str, document_id: str) -> dict[str, Any]:
    """Obtiene un documento e informa 404 cuando no existe."""

    db = get_firestore_client()
    snapshot = db.collection(collection_name).document(document_id).get()

    if not snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontro el documento '{document_id}' en '{collection_name}'.",
        )

    return _serialize_document(snapshot)


def get_collection(
    collection_name: str,
    *,
    filters: list[tuple[str, str, Any]] | None = None,
    order_by: str | None = None,
) -> list[dict[str, Any]]:
    """Lista documentos con filtros y orden opcional."""

    db = get_firestore_client()
    query = db.collection(collection_name)

    for field_name, operator, value in filters or []:
        query = query.where(field_name, operator, value)

    if order_by:
        query = query.order_by(order_by)

    return [_serialize_document(document) for document in query.stream()]


def create_document(
    collection_name: str,
    payload: dict[str, Any],
    *,
    document_id: str | None = None,
) -> dict[str, Any]:
    """Crea un documento nuevo o usa el ID proporcionado."""

    db = get_firestore_client()
    collection = db.collection(collection_name)
    doc_ref = collection.document(document_id) if document_id else collection.document()
    doc_ref.set(payload, merge=False)
    snapshot = doc_ref.get()
    return _serialize_document(snapshot)


def update_document(
    collection_name: str,
    document_id: str,
    payload: dict[str, Any],
    *,
    merge: bool,
) -> dict[str, Any]:
    """Actualiza un documento por ID, con merge opcional."""

    db = get_firestore_client()
    doc_ref = db.collection(collection_name).document(document_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No se encontro el documento '{document_id}' en '{collection_name}' "
                "para actualizar."
            ),
        )

    doc_ref.set(payload, merge=merge)
    return _serialize_document(doc_ref.get())


def prepare_user_document_payload(
    payload: dict[str, Any],
    *,
    user_id: str,
    auth_user: Any | None = None,
    generate_code: bool = False,
) -> dict[str, Any]:
    """Normalize a user payload into the shape expected by Firestore and the API."""

    normalized = payload.copy()

    name = str(normalized.get("name") or getattr(auth_user, "display_name", "") or "").strip()
    email = str(normalized.get("email") or getattr(auth_user, "email", "") or "").strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="El nombre es obligatorio para crear el usuario.",
        )
    if not email:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico es obligatorio para crear el usuario.",
        )

    nickname = str(normalized.get("nickname") or "").strip()
    if not nickname:
        nickname = email.split("@", maxsplit=1)[0].strip()
    if not nickname:
        nickname = f"plantLover_{user_id[:4]}"

    profile_picture = normalized.get("profilePicture")
    if profile_picture in (None, ""):
        profile_picture = getattr(auth_user, "photo_url", "") or ""

    public_profile = normalized.get("publicProfile")
    if public_profile is None:
        public_profile = True

    is_private = normalized.get("isPrivate")
    if is_private is None:
        is_private = not bool(public_profile)

    normalized_payload: dict[str, Any] = {
        "authUid": user_id,
        "email": email,
        "name": name,
        "lastName": str(normalized.get("lastName") or "").strip(),
        "secondLastName": str(normalized.get("secondLastName") or "").strip(),
        "nickname": nickname,
        "profilePicture": profile_picture or "",
        "plantCount": int(normalized.get("plantCount") or 0),
        "birthDate": str(normalized.get("birthDate") or "").strip(),
        "registrationDate": str(normalized.get("registrationDate") or datetime.utcnow().isoformat()),
        "streak": int(normalized.get("streak") or 0),
        "description": str(normalized.get("description") or "").strip(),
        "bibliography": str(normalized.get("bibliography") or "").strip(),
        "achievements": normalized.get("achievements") if isinstance(normalized.get("achievements"), list) else [],
        "publicProfile": bool(public_profile),
        "isPrivate": bool(is_private),
    }

    if generate_code:
        normalized_payload["code"] = str(normalized.get("code") or _generate_next_user_code(get_firestore_client()))
    else:
        normalized_payload["code"] = str(normalized.get("code") or "")

    return normalized_payload


def delete_document(collection_name: str, document_id: str) -> dict[str, str]:
    """Elimina un documento existente y confirma el resultado."""

    db = get_firestore_client()
    doc_ref = db.collection(collection_name).document(document_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No se encontro el documento '{document_id}' en '{collection_name}' "
                "para eliminar."
            ),
        )

    doc_ref.delete()
    return {"status": "deleted", "collection": collection_name, "id": document_id}


def ensure_user_document(user_id: str) -> dict[str, Any]:
    """Devuelve el usuario o lo crea usando los datos de Firebase Auth."""

    try:
        user = get_document("users", user_id)
    except HTTPException as exc:
        if exc.status_code != 404:
            raise
        user = None

    auth_user = None
    try:
        auth_user = auth.get_user(user_id)
    except auth.UserNotFoundError:
        auth_user = None

    if user is not None:
        normalized_user = prepare_user_document_payload(
            user,
            user_id=user_id,
            auth_user=auth_user,
            generate_code=True,
        )
        if normalized_user != user:
            user = update_document("users", user_id, normalized_user, merge=True)
        return user

    try:
        if auth_user is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "No se encontro el usuario solicitado en Firestore y tampoco en Firebase Auth."
                ),
            )

        payload = prepare_user_document_payload(
            {},
            user_id=user_id,
            auth_user=auth_user,
            generate_code=True,
        )
        return create_document("users", payload, document_id=user_id)
    except HTTPException:
        raise


def _generate_next_user_code(db) -> str:
    """Calcula el siguiente identificador secuencial con formato 'usr-N'."""

    max_number = 0
    for document in db.collection("users").stream():
        data = document.to_dict() or {}
        code = data.get("code", "")
        if isinstance(code, str) and code.startswith("usr-"):
            try:
                number = int(code.split("-", maxsplit=1)[1])
            except (IndexError, ValueError):
                continue
            max_number = max(max_number, number)

    return f"usr-{max_number + 1}"


async def identify_plant_mock(images: list[str]) -> dict[str, Any]:
    """Identifica una planta usando la API real de Plant.id."""
    print(f"DEBUG: Iniciando identificación para {len(images)} imágenes")
    api_key = os.getenv("PLANT_ID_API_KEY")
    
    if not api_key:
        return {
            "name": "Error: API Key no configurada",
            "scientific_name": "N/A",
            "category": "Error",
            "description": "Por favor configura PLANT_ID_API_KEY en el panel de Render.",
            "status": "error",
            "age": "N/A",
            "growthTime": "N/A",
            "height": "N/A",
            "lightPreference": "N/A",
            "originLocality": "N/A",
            "flowering": "N/A",
            "temperature": "N/A",
            "toxic": False,
            "fertilizerType": "N/A",
        }

    try:
        if not images:
            return {
                "name": "Error: No hay imagen",
                "scientific_name": "N/A",
                "category": "Error",
                "status": "error",
                "description": "El servidor no recibió ninguna imagen para procesar.",
                "age": "N/A",
                "growthTime": "N/A",
                "height": "N/A",
                "lightPreference": "N/A",
                "originLocality": "N/A",
                "flowering": "N/A",
                "temperature": "N/A",
                "toxic": False,
                "fertilizerType": "N/A",
            }

        cleaned_images = []
        for img in images:
            if "," in img:
                cleaned_images.append(img.split(",")[1])
            else:
                cleaned_images.append(img)

        url = "https://plant.id/api/v3/identification"
        headers = {"Api-Key": api_key, "Content-Type": "application/json"}
        payload = {
            "images": cleaned_images, 
            "similar_images": True,
        }
        # Parámetros mínimos para evitar errores 400
        params = {
            "language": "es"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, params=params, headers=headers, timeout=30.0)
            
            if response.status_code != 201:
                print(f"DEBUG: Error API {response.status_code} - {response.text}")
                return {
                    "name": f"Error API ({response.status_code})",
                    "scientific_name": "N/A",
                    "category": "Error",
                    "status": "error",
                    "description": f"Error de Plant.id: {response.text[:100]}",
                    "age": "N/A",
                    "growthTime": "N/A",
                    "height": "N/A",
                    "lightPreference": "N/A",
                    "originLocality": "N/A",
                    "flowering": "N/A",
                    "temperature": "N/A",
                    "toxic": False,
                    "fertilizerType": "N/A",
                }

            data = response.json()
            result = data.get("result", {})
            classification = result.get("classification", {})
            suggestions = classification.get("suggestions", [])

            if not suggestions:
                return {
                    "name": "No identificada",
                    "scientific_name": "N/A",
                    "category": "N/A",
                    "status": "unknown",
                    "description": "No se encontraron resultados para esta imagen.",
                    "age": "N/A",
                    "growthTime": "N/A",
                    "height": "N/A",
                    "lightPreference": "N/A",
                    "originLocality": "N/A",
                    "flowering": "N/A",
                    "temperature": "N/A",
                    "toxic": False,
                    "fertilizerType": "N/A",
                }

            best = suggestions[0]
            details = best.get("details", {})
            common_names = details.get("common_names", [])
            
            name = common_names[0] if common_names else best.get("name", "Desconocido")

            return {
                "name": name.capitalize(),
                "scientific_name": best.get("name", "Desconocido"),
                "category": classification.get("taxonomy", {}).get("class", "Desconocida"),
                "description": details.get("description", {}).get("value", "Sin descripción."),
                "status": "saludable" if result.get("is_healthy", {}).get("binary", True) else "con problemas",
                "age": "Recién identificada",
                "growthTime": "Variable",
                "height": "Variable",
                "lightPreference": (details.get("sunlight") or "Variable").capitalize(),
                "originLocality": "Nativa",
                "flowering": (details.get("flowering") or "Variable").capitalize(),
                "temperature": "15-25°C",
                "toxic": details.get("toxicity") is not None,
                "toxicTo": "Mascotas/Niños" if details.get("toxicity") else None,
                "fertilizerType": "Equilibrado",
            }

    except Exception as e:
        print(f"DEBUG: Excepción en identify_plant_mock: {str(e)}")
        return {
            "name": "Error del Sistema",
            "scientific_name": "N/A",
            "category": "Error",
            "status": "error",
            "description": f"Error interno: {str(e)}",
            "age": "N/A",
            "growthTime": "N/A",
            "height": "N/A",
            "lightPreference": "N/A",
            "originLocality": "N/A",
            "flowering": "N/A",
            "temperature": "N/A",
            "toxic": False,
            "fertilizerType": "N/A",
        }


import mimetypes

class CloudinaryService:
    class UploadError(Exception):
        def __init__(self, status_code: int, code: str, message: str):
            self.status_code = status_code
            self.code = code
            self.message = message

    def guess_mime(self, filename: str, fallback: str | None = None) -> str:
        mime, _ = mimetypes.guess_type(filename)
        return mime or fallback or "application/octet-stream"

    def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        mime_type: str,
        user_id: str,
    ):
        from .firebase import _parse_cloudinary_url
        from .models import MediaAttachment
        import hashlib
        import time
        import httpx

        try:
            api_key, api_secret, cloud_name = _parse_cloudinary_url()
        except Exception as e:
            raise self.UploadError(500, "CLOUDINARY_CONFIG_ERROR", str(e))

        folder_name = f"plantapp/chat/{user_id}"
        timestamp = str(int(time.time()))

        upload_params = {
            "timestamp": timestamp,
            "folder": folder_name,
        }
        signature_base = "&".join(
            f"{key}={value}" for key, value in sorted(upload_params.items())
        )
        signature = hashlib.sha1(f"{signature_base}{api_secret}".encode("utf-8")).hexdigest()

        upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
        files = {"file": (filename, file_bytes, mime_type)}
        form_data = {
            **upload_params,
            "api_key": api_key,
            "signature": signature,
        }

        try:
            response = httpx.post(upload_url, data=form_data, files=files, timeout=60.0)
        except Exception as e:
            raise self.UploadError(500, "CLOUDINARY_REQUEST_ERROR", f"Fallo la conexion con Cloudinary: {str(e)}")

        if response.status_code >= 400:
            detail = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = detail.get("error", {}).get("message", "Error desconocido de Cloudinary.")
            raise self.UploadError(response.status_code, "CLOUDINARY_UPLOAD_FAILED", error_msg)

        payload = response.json()
        secure_url = payload.get("secure_url")
        if not secure_url:
            raise self.UploadError(500, "CLOUDINARY_RESPONSE_ERROR", "Cloudinary no devolvio una URL segura.")

        return MediaAttachment(
            url=secure_url,
            public_id=payload.get("public_id", ""),
            resource_type=payload.get("resource_type", "raw"),
            format=payload.get("format", ""),
            size_bytes=payload.get("bytes", len(file_bytes)),
            original_filename=payload.get("original_filename", filename),
            width=payload.get("width"),
            height=payload.get("height"),
            duration=payload.get("duration"),
        )

cloudinary_service = CloudinaryService()
