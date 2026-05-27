"""Endpoints REST que exponen datos Firestore."""

from calendar import monthrange
from datetime import date, datetime, timedelta
from typing import Any, Literal, Sequence

from fastapi import APIRouter, Body, HTTPException, Query

from .models import (
    ApiCollectionResponse,
    FriendModel,
    PlantDetailResponse,
    PlantWithRelationsModel,
    WateringCalendarResponse,
    UserModel,
    UserProfileResponse,
    IdentifyResponse,
)
from .services import (
    ensure_user_document,
    create_document,
    delete_document,
    get_collection,
    get_document,
    prepare_user_document_payload,
    update_document,
    identify_plant_mock,
)
from .firebase import upload_image_to_cloudinary

CollectionName = Literal[
    "users",
    "friends",
    "plants",
    "pests",
    "categories",
    "careTypes",
    "achievements",
]


router = APIRouter()


def _convert_filter_value(raw_value: str) -> Any:
    """Cast raw query value to pythonic type (bool/int/float/None)."""

    lowered = raw_value.lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    if lowered == "null":
        return None

    try:
        return int(raw_value)
    except ValueError:
        pass

    try:
        return float(raw_value)
    except ValueError:
        return raw_value


def _parse_filter_expression(expression: str) -> tuple[str, str, Any]:
    """Split filter strings of form field:operator:value into components."""

    parts = expression.split(":", 2)
    if len(parts) != 3:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cada filtro debe seguir el formato campo:operador:valor. "
                f"Recibido: '{expression}'."
            ),
        )

    field_name, operator, raw_value = parts
    if not field_name or not operator:
        raise HTTPException(
            status_code=400,
            detail=f"Filtro invalido: '{expression}'.",
        )

    return field_name, operator, _convert_filter_value(raw_value)


def _load_documents_by_ids(collection: str, identifiers: Sequence[str]) -> list[dict[str, Any]]:
    """Fetch documents by ID while ignoring duplicates and missing entries."""

    seen: set[str] = set()
    results: list[dict[str, Any]] = []

    for identifier in identifiers:
        if not identifier or identifier in seen:
            continue
        try:
            results.append(get_document(collection, identifier))
            seen.add(identifier)
        except HTTPException as exc:  # pragma: no cover - defensive guard
            if exc.status_code != 404:
                raise
    return results


def _get_user_friends(user_id: str) -> list[dict[str, Any]]:
    """Return consolidated friend relationships for the provided user."""

    friends_a = get_collection("friends", filters=[("userIdA", "==", user_id)])
    friends_b = get_collection("friends", filters=[("userIdB", "==", user_id)])

    merged: dict[str, dict[str, Any]] = {}
    for friend in friends_a + friends_b:
        merged[friend["id"]] = friend
    return list(merged.values())


def _parse_date_value(raw_value: Any) -> date | None:
    """Parse a stored date or ISO datetime string into a date object."""

    if not isinstance(raw_value, str):
        return None

    cleaned = raw_value.strip()
    if not cleaned:
        return None

    candidates = [cleaned, cleaned[:10]]
    for candidate in candidates:
        try:
            return datetime.fromisoformat(candidate.replace("Z", "+00:00")).date()
        except ValueError:
            try:
                return date.fromisoformat(candidate)
            except ValueError:
                continue
    return None


def _format_date_value(raw_value: date | None) -> str | None:
    """Serialize a date value using the YYYY-MM-DD format."""

    if raw_value is None:
        return None
    return raw_value.isoformat()


def _normalize_watering_frequency(raw_value: Any) -> int | None:
    """Validate and convert the watering frequency into a positive integer."""

    if raw_value in (None, ""):
        return None

    if isinstance(raw_value, bool):
        raise HTTPException(
            status_code=400,
            detail="La frecuencia de riego debe ser un número entero positivo.",
        )

    try:
        frequency = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="La frecuencia de riego debe ser un número entero positivo.",
        ) from exc

    if frequency < 1:
        raise HTTPException(status_code=400, detail="La frecuencia de riego debe ser mayor que cero.")

    return frequency


def _normalize_watering_notes(raw_value: Any) -> str | None:
    """Normalize optional watering notes into a trimmed string."""

    if raw_value in (None, ""):
        return None

    notes = str(raw_value).strip()
    return notes or None


def _calculate_next_watering_date(last_watered: Any, watering_frequency_days: Any) -> str | None:
    """Derive the next watering date from the last watering and interval."""

    frequency = _normalize_watering_frequency(watering_frequency_days)
    watered_on = _parse_date_value(last_watered)

    if frequency is None or watered_on is None:
        return None

    next_date = watered_on + timedelta(days=frequency)
    return _format_date_value(next_date)


def _normalize_plant_document(plant: dict[str, Any]) -> dict[str, Any]:
    """Return a normalized copy of a plant document for API responses."""

    plant_copy = plant.copy()

    # Keep response model-compatible defaults even when old/incomplete docs exist.
    plant_copy.setdefault("userId", "")
    plant_copy.setdefault("name", "")
    plant_copy.setdefault("categoryId", "")
    plant_copy.setdefault("age", "")
    plant_copy.setdefault("price", 0.0)
    plant_copy.setdefault("growthTime", "")
    plant_copy.setdefault("height", "")
    plant_copy.setdefault("isFavorite", False)
    plant_copy.setdefault("toxic", False)
    plant_copy.setdefault("flowering", "")
    plant_copy.setdefault("status", "")
    plant_copy.setdefault("lightPreference", "")
    plant_copy.setdefault("originLocality", "")
    plant_copy.setdefault("temperature", "")
    plant_copy.setdefault("fertilizerType", "")
    plant_copy.setdefault("lastFertilized", "")
    plant_copy.setdefault("lastWatered", "")

    if not isinstance(plant_copy.get("careTypes"), list):
        plant_copy["careTypes"] = []
    if not isinstance(plant_copy.get("pests"), list):
        plant_copy["pests"] = []

    frequency_value = plant_copy.get("wateringFrequencyDays")
    if frequency_value in (None, ""):
        frequency_value = plant_copy.get("wateringIntervalDays")

    normalized_frequency = _normalize_watering_frequency(frequency_value)
    plant_copy["wateringFrequencyDays"] = normalized_frequency
    plant_copy["wateringIntervalDays"] = normalized_frequency
    plant_copy["wateringNotes"] = _normalize_watering_notes(plant_copy.get("wateringNotes"))
    plant_copy["nextWateringDate"] = _calculate_next_watering_date(
        plant_copy.get("lastWatered"),
        normalized_frequency,
    )
    return plant_copy


def _extract_relation_ids(raw_values: Any) -> list[str]:
    """Normalize relation lists that may contain IDs or embedded objects."""

    if not isinstance(raw_values, list):
        return []

    ids: list[str] = []
    for item in raw_values:
        if isinstance(item, str) and item.strip():
            ids.append(item.strip())
            continue
        if isinstance(item, dict):
            nested_id = item.get("id")
            if isinstance(nested_id, str) and nested_id.strip():
                ids.append(nested_id.strip())
    return ids


def _extract_category_id(raw_category: Any) -> str:
    """Normalize category relation from either string ID or embedded object."""

    if isinstance(raw_category, str):
        return raw_category.strip()
    if isinstance(raw_category, dict):
        nested_id = raw_category.get("id")
        if isinstance(nested_id, str):
            return nested_id.strip()
    return ""


def _prepare_plant_payload(payload: dict[str, Any], *, merge: bool, existing: dict[str, Any] | None = None) -> dict[str, Any]:
    """Normalize reminder fields before persisting a plant document."""

    merged_payload = (existing or {}).copy() if merge else {}
    merged_payload.update(payload)

    normalized_payload = payload.copy()

    if "wateringFrequencyDays" in merged_payload or "wateringIntervalDays" in merged_payload:
        normalized_frequency = _normalize_watering_frequency(
            merged_payload.get("wateringFrequencyDays", merged_payload.get("wateringIntervalDays"))
        )
        normalized_payload["wateringFrequencyDays"] = normalized_frequency
        normalized_payload["wateringIntervalDays"] = normalized_frequency

    if "wateringNotes" in merged_payload:
        normalized_payload["wateringNotes"] = _normalize_watering_notes(
            merged_payload.get("wateringNotes")
        )

    if (
        "lastWatered" in merged_payload
        or "wateringFrequencyDays" in merged_payload
        or "wateringIntervalDays" in merged_payload
    ):
        normalized_payload["nextWateringDate"] = _calculate_next_watering_date(
            merged_payload.get("lastWatered"),
            merged_payload.get("wateringFrequencyDays", merged_payload.get("wateringIntervalDays")),
        )

    return normalized_payload


def _decorate_plant_for_reminders(plant: dict[str, Any], *, today: date | None = None) -> dict[str, Any]:
    """Add derived reminder fields to a plant document copy."""

    plant_copy = _normalize_plant_document(plant)
    next_watering_date = plant_copy.get("nextWateringDate")

    due_date = _parse_date_value(next_watering_date)
    if today is None:
        today = date.today()
    plant_copy["isOverdue"] = bool(due_date and due_date <= today)
    return plant_copy


def _build_watering_calendar(plants: list[dict[str, Any]], month_key: str) -> dict[str, Any]:
    """Group watering reminders by date for a given month."""

    year_str, month_str = month_key.split("-", maxsplit=1)
    year = int(year_str)
    month = int(month_str)
    _, last_day = monthrange(year, month)

    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)
    today = date.today()

    reminders_by_date: dict[str, list[dict[str, Any]]] = {}
    pending_plants: list[dict[str, Any]] = []

    for plant in plants:
        decorated = _decorate_plant_for_reminders(plant, today=today)
        due_date = _parse_date_value(decorated.get("nextWateringDate"))
        if due_date is None:
            continue

        if month_start <= due_date <= month_end:
            reminders_by_date.setdefault(_format_date_value(due_date) or "", []).append(decorated)

        if due_date <= today:
            pending_plants.append(decorated)

    days: list[dict[str, Any]] = []
    for current_day in range(1, last_day + 1):
        day_date = date(year, month, current_day)
        day_key = _format_date_value(day_date) or ""
        day_plants = reminders_by_date.get(day_key, [])
        if not day_plants:
            continue
        days.append({"date": day_key, "plants": day_plants})

    pending_plants.sort(
        key=lambda item: (
            item.get("nextWateringDate") or "9999-12-31",
            item.get("name") or "",
        )
    )

    return {
        "month": month_key,
        "days": days,
        "pendingPlants": pending_plants,
    }


@router.post("/api/users/{user_id}/photo")
def upload_user_photo(user_id: str, body: dict[str, str] = Body(...)) -> dict[str, str]:
    """Upload a profile photo (base64) for the user to Cloudinary and update the user profile.

    Expects JSON: { "filename": "profile.jpg", "content": "data:image/jpeg;base64,..." }
    Returns: { "url": "https://..." }
    """
    filename = body.get("filename") or f"profile_{user_id}.jpg"
    content = body.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Se requiere el campo 'content' con la imagen en base64.")

    try:
        public_url = upload_image_to_cloudinary(
            folder=f"plantapp/profiles/{user_id}",
            filename=filename,
            content=content,
            public_id="profile",
            overwrite=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # Update user profile
    try:
        update_document("users", user_id, {"profilePicture": public_url}, merge=True)
    except HTTPException:
        # If updating fails, still return URL but inform in logs
        print(f"Warning: no se pudo actualizar el perfil del usuario {user_id} con la imagen")

    return {"url": public_url}


@router.post("/api/users/{user_id}/plants/photo")
def upload_plant_photo(user_id: str, body: dict[str, str] = Body(...)) -> dict[str, str]:
    """Upload a plant photo (base64) to Cloudinary and return its public URL.

    Expects JSON: { "filename": "plant.jpg", "content": "data:image/jpeg;base64,..." }
    Returns: { "url": "https://..." }
    """
    filename = body.get("filename") or f"plant_{user_id}.jpg"
    content = body.get("content")
    if not content:
        raise HTTPException(status_code=400, detail="Se requiere el campo 'content' con la imagen en base64.")

    try:
        public_url = upload_image_to_cloudinary(
            folder=f"plantapp/plants/{user_id}",
            filename=filename,
            content=content,
            public_id=filename.rsplit('.', maxsplit=1)[0],
            overwrite=True,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"url": public_url}


def _populate_plants_with_relations(plants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Attach category, care types and pests to every plant document."""

    if not plants:
        return []

    care_type_ids: set[str] = set()
    pest_ids: set[str] = set()
    category_ids: set[str] = set()

    for plant in plants:
        normalized_plant = _normalize_plant_document(plant)
        plant_care_type_ids = _extract_relation_ids(normalized_plant.get("careTypes"))
        plant_pest_ids = _extract_relation_ids(normalized_plant.get("pests"))
        care_type_ids.update(plant_care_type_ids)
        pest_ids.update(plant_pest_ids)

        category_id = _extract_category_id(normalized_plant.get("categoryId"))
        if category_id:
            category_ids.add(category_id)

    care_types = _load_documents_by_ids("careTypes", list(care_type_ids))
    pests = _load_documents_by_ids("pests", list(pest_ids))
    categories = _load_documents_by_ids("categories", list(category_ids))

    care_type_map = {item["id"]: item for item in care_types}
    pest_map = {item["id"]: item for item in pests}
    category_map = {item["id"]: item for item in categories}

    enriched: list[dict[str, Any]] = []
    for plant in plants:
        plant_copy = _normalize_plant_document(plant)
        care_type_id_list = _extract_relation_ids(plant_copy.get("careTypes"))
        pest_id_list = _extract_relation_ids(plant_copy.get("pests"))

        care_type_refs = [
            care_type_map[identifier]
            for identifier in care_type_id_list
            if identifier in care_type_map
        ]
        pest_refs = [
            pest_map[identifier]
            for identifier in pest_id_list
            if identifier in pest_map
        ]

        plant_copy["careTypeIds"] = care_type_id_list
        plant_copy["pestIds"] = pest_id_list
        plant_copy["careTypes"] = care_type_refs
        plant_copy["pests"] = pest_refs
        normalized_category_id = _extract_category_id(plant_copy.get("categoryId"))
        plant_copy["categoryId"] = normalized_category_id
        plant_copy["category"] = category_map.get(normalized_category_id)

        enriched.append(plant_copy)

    return enriched


@router.get("/health")
def healthcheck() -> dict[str, str]:
    """Simple readiness probe used by monitoring and tests."""

    return {"status": "ok"}


@router.get("/api/users/{user_id}", response_model=UserModel)
def read_user(user_id: str) -> dict[str, Any]:
    """Return an existing user or create it on-the-fly from Firebase Auth."""

    return ensure_user_document(user_id)


@router.get("/api/users/{user_id}/profile", response_model=UserProfileResponse)
def read_user_profile(user_id: str) -> dict[str, Any]:
    """Aggregate the full profile for a user, including relations."""

    user = ensure_user_document(user_id)
    friends = _get_user_friends(user_id)
    plants = get_collection("plants", filters=[("userId", "==", user_id)])
    plants = _populate_plants_with_relations(plants)
    categories = get_collection("categories")
    achievements_ids = user.get("achievements", []) if isinstance(user, dict) else []
    achievements = _load_documents_by_ids("achievements", achievements_ids)

    return {
        "user": user,
        "friends": friends,
        "plants": plants,
        "categories": categories,
        "achievements": achievements,
    }


@router.get("/api/users/{user_id}/friends", response_model=list[FriendModel])
def read_user_friends(user_id: str) -> list[dict[str, Any]]:
    """List every friendship involving the user."""

    return _get_user_friends(user_id)


@router.get("/api/users/{user_id}/plants", response_model=list[PlantWithRelationsModel])
def read_user_plants(user_id: str) -> list[dict[str, Any]]:
    """Retrieve plants enriched with category and care metadata."""

    plants = get_collection("plants", filters=[("userId", "==", user_id)])
    return _populate_plants_with_relations(plants)


@router.get("/api/users/{user_id}/watering-calendar", response_model=WateringCalendarResponse)
def read_user_watering_calendar(user_id: str, month: str | None = Query(default=None)) -> dict[str, Any]:
    """Return the watering reminders for a given month."""

    if month is None:
        month = date.today().strftime("%Y-%m")

    if not month or not isinstance(month, str):
        raise HTTPException(status_code=400, detail="Debes enviar el mes con formato YYYY-MM.")

    if not month or len(month) != 7 or month[4] != "-":
        raise HTTPException(status_code=400, detail="Debes enviar el mes con formato YYYY-MM.")

    try:
        year = int(month[:4])
        month_number = int(month[5:])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Debes enviar el mes con formato YYYY-MM.") from exc

    if year < 1 or month_number < 1 or month_number > 12:
        raise HTTPException(status_code=400, detail="Debes enviar el mes con formato YYYY-MM.")

    plants = get_collection("plants", filters=[("userId", "==", user_id)])
    return _build_watering_calendar(plants, month)


@router.get("/api/plants/{plant_id}/details", response_model=PlantDetailResponse)
def read_plant_detail(plant_id: str) -> dict[str, Any]:
    """Return one plant together with care types and pests."""

    plant = _normalize_plant_document(get_document("plants", plant_id))
    care_types = _load_documents_by_ids("careTypes", plant.get("careTypes", []))
    pests = _load_documents_by_ids("pests", plant.get("pests", []))
    return {"plant": plant, "careTypes": care_types, "pests": pests}


@router.get("/api/care-types", response_model=list[dict[str, Any]])
def list_care_types_slug() -> list[dict[str, Any]]:
    """Alias that serves care types when clients use kebab-case endpoints."""

    return get_collection("careTypes")


@router.post("/api/identify", response_model=IdentifyResponse)
async def identify_plant_endpoint(payload: dict[str, Any] = Body(..., embed=False)) -> dict[str, Any]:
    """Identifica una planta a partir de una imagen."""
    # Aceptamos tanto 'image' como 'images' para mayor compatibilidad
    images = payload.get("images", [])
    single_image = payload.get("image")
    
    if not images and single_image:
        images = [single_image]
        
    if not images:
            raise HTTPException(
                status_code=400,
                detail="Se requiere al menos una imagen para el análisis.",
            )
    
    # Ahora llamamos con await porque la función es async
    return await identify_plant_mock(images)


@router.get("/api/{collection_name}", response_model=list[dict[str, Any]])
def list_collection(
    collection_name: CollectionName,
    filters: list[str] | None = Query(default=None, alias="filter"),
    order_by: str | None = Query(default=None, alias="orderBy"),
) -> list[dict[str, Any]]:
    """Generic collection listing with optional filters and ordering."""

    parsed_filters = [_parse_filter_expression(item) for item in (filters or [])]
    items = get_collection(collection_name, filters=parsed_filters, order_by=order_by)
    if collection_name == "plants":
        return [_normalize_plant_document(item) for item in items]
    return items


@router.post(
    "/api/{collection_name}",
    response_model=dict[str, Any],
    status_code=201,
)
def create_collection_document(
    collection_name: CollectionName,
    payload: dict[str, Any] = Body(..., embed=False),
) -> dict[str, Any]:
    """Create a Firestore document, honoring custom IDs when provided."""

    body = payload.copy()
    document_id = body.get("authUid") or body.pop("id", None)
    if collection_name == "users":
        if not document_id:
            raise HTTPException(
                status_code=400,
                detail="Se requiere authUid para crear el usuario.",
            )
        body = prepare_user_document_payload(
            body,
            user_id=document_id,
            generate_code=True,
        )
    if collection_name == "plants":
        body = _prepare_plant_payload(body, merge=False)
    return create_document(collection_name, body, document_id=document_id)


@router.get("/api/{collection_name}/{document_id}", response_model=dict[str, Any])
def read_collection_document(
    collection_name: CollectionName,
    document_id: str,
) -> dict[str, Any]:
    """Fetch a single document by ID from the given collection."""

    document = get_document(collection_name, document_id)
    if collection_name == "plants":
        return _normalize_plant_document(document)
    return document


@router.put(
    "/api/{collection_name}/{document_id}",
    response_model=dict[str, Any],
)
def replace_collection_document(
    collection_name: CollectionName,
    document_id: str,
    payload: dict[str, Any] = Body(..., embed=False),
) -> dict[str, Any]:
    """Replace a document entirely (no merge)."""

    body = payload.copy()
    if collection_name == "users":
        existing = get_document(collection_name, document_id)
        incoming_email = str(body.get("email") or "").strip()
        current_email = str(existing.get("email") or "").strip()
        if incoming_email and incoming_email != current_email:
            raise HTTPException(
                status_code=400,
                detail="El correo electrónico no se puede modificar desde el perfil.",
            )
        body.pop("email", None)
        body.pop("id", None)
        body.pop("authUid", None)
    if collection_name == "plants":
        body = _prepare_plant_payload(body, merge=False)
    return update_document(collection_name, document_id, body, merge=False)


@router.patch(
    "/api/{collection_name}/{document_id}",
    response_model=dict[str, Any],
)
def patch_collection_document(
    collection_name: CollectionName,
    document_id: str,
    payload: dict[str, Any] = Body(..., embed=False),
) -> dict[str, Any]:
    """Apply a partial update to a document (merge semantics)."""

    body = payload.copy()
    if collection_name == "users":
        existing = get_document(collection_name, document_id)
        incoming_email = str(body.get("email") or "").strip()
        current_email = str(existing.get("email") or "").strip()
        if incoming_email and incoming_email != current_email:
            raise HTTPException(
                status_code=400,
                detail="El correo electrónico no se puede modificar desde el perfil.",
            )
        body.pop("email", None)
        body.pop("id", None)
        body.pop("authUid", None)
    if collection_name == "plants":
        existing = get_document(collection_name, document_id)
        body = _prepare_plant_payload(body, merge=True, existing=existing)
    return update_document(collection_name, document_id, body, merge=True)


@router.delete(
    "/api/{collection_name}/{document_id}",
    response_model=dict[str, str],
)
def delete_collection_document(
    collection_name: CollectionName,
    document_id: str,
) -> dict[str, str]:
    """Delete a document and confirm the operation."""

    return delete_document(collection_name, document_id)


@router.get("/api/collections/{collection_name}", response_model=ApiCollectionResponse)
def read_collection_legacy(collection_name: CollectionName) -> dict[str, Any]:
    """Legacy endpoint that wraps list_collection with metadata."""
    items = list_collection(collection_name)
    return {
        "collection": collection_name,
        "count": len(items),
        "items": items,
    }
