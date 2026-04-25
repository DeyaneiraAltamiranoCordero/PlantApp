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
        missing_fields: dict[str, Any] = {}
        if "description" not in user:
            missing_fields["description"] = ""
        if "bibliography" not in user:
            missing_fields["bibliography"] = ""
        if missing_fields:
            user = update_document("users", user_id, missing_fields, merge=True)
        return user
    except HTTPException as exc:
        if exc.status_code != 404:
            raise

    try:
        auth_user = auth.get_user(user_id)
    except auth.UserNotFoundError as cause:
        raise HTTPException(
            status_code=404,
            detail=(
                "No se encontro el usuario solicitado en Firestore y tampoco en Firebase Auth."
            ),
        ) from cause

    name_parts = (auth_user.display_name or "").split()
    first_name = name_parts[0] if name_parts else "Usuario"
    remaining_names = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    db = get_firestore_client()
    payload = {
        "id": user_id,
        "code": _generate_next_user_code(db),
        "name": first_name,
        "lastName": remaining_names,
        "secondLastName": "",
        "nickname": auth_user.display_name or f"plantLover_{user_id[:4]}",
        "profilePicture": auth_user.photo_url or "",
        "plantCount": 0,
        "birthDate": "",
        "registrationDate": datetime.utcnow().isoformat(),
        "email": auth_user.email or "",
        "streak": 0,
        "description": "",
        "bibliography": "",
        "achievements": [],
    }

    return create_document("users", payload, document_id=user_id)


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
        # Los detalles se pueden pedir como parámetros de consulta en v3 para mayor compatibilidad
        params = {
            "details": "common_names,description,taxonomy,sunlight,watering",
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
            "description": f"Excepción: {str(e)[:100]}",
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
