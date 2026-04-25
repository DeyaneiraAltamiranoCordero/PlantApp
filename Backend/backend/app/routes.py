"""Endpoints REST que exponen datos Firestore."""

from typing import Any, Literal, Sequence

from fastapi import APIRouter, Body, HTTPException, Query

from .models import (
    ApiCollectionResponse,
    FriendModel,
    PlantDetailResponse,
    PlantWithRelationsModel,
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
    update_document,
    identify_plant_mock,
)

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


def _populate_plants_with_relations(plants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Attach category, care types and pests to every plant document."""

    if not plants:
        return []

    care_type_ids: set[str] = set()
    pest_ids: set[str] = set()
    category_ids: set[str] = set()

    for plant in plants:
        care_type_ids.update(filter(None, plant.get("careTypes", [])))
        pest_ids.update(filter(None, plant.get("pests", [])))
        category_id = plant.get("categoryId")
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
        plant_copy = plant.copy()
        care_type_refs = [
            care_type_map[identifier]
            for identifier in plant_copy.get("careTypes", [])
            if identifier in care_type_map
        ]
        pest_refs = [
            pest_map[identifier]
            for identifier in plant_copy.get("pests", [])
            if identifier in pest_map
        ]

        plant_copy["careTypeIds"] = plant_copy.get("careTypes", [])
        plant_copy["pestIds"] = plant_copy.get("pests", [])
        plant_copy["careTypes"] = care_type_refs
        plant_copy["pests"] = pest_refs
        plant_copy["category"] = category_map.get(plant_copy.get("categoryId"))

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


@router.get("/api/plants/{plant_id}/details", response_model=PlantDetailResponse)
def read_plant_detail(plant_id: str) -> dict[str, Any]:
    """Return one plant together with care types and pests."""

    plant = get_document("plants", plant_id)
    care_types = _load_documents_by_ids("careTypes", plant.get("careTypes", []))
    pests = _load_documents_by_ids("pests", plant.get("pests", []))
    return {"plant": plant, "careTypes": care_types, "pests": pests}


@router.get("/api/care-types", response_model=list[dict[str, Any]])
def list_care_types_slug() -> list[dict[str, Any]]:
    """Alias that serves care types when clients use kebab-case endpoints."""

    return get_collection("careTypes")


@router.post("/api/identify", response_model=IdentifyResponse)
def identify_plant_endpoint(payload: dict[str, Any] = Body(..., embed=False)) -> dict[str, Any]:
    """Identifica una planta a partir de una imagen."""
    image_data = payload.get("image", "")
    if not image_data:
        raise HTTPException(status_code=400, detail="Se requiere la imagen para el analisis.")
    
    return identify_plant_mock(image_data)


@router.get("/api/{collection_name}", response_model=list[dict[str, Any]])
def list_collection(
    collection_name: CollectionName,
    filters: list[str] | None = Query(default=None, alias="filter"),
    order_by: str | None = Query(default=None, alias="orderBy"),
) -> list[dict[str, Any]]:
    """Generic collection listing with optional filters and ordering."""

    parsed_filters = [_parse_filter_expression(item) for item in (filters or [])]
    return get_collection(collection_name, filters=parsed_filters, order_by=order_by)


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
    document_id = body.pop("id", None)
    return create_document(collection_name, body, document_id=document_id)


@router.get("/api/{collection_name}/{document_id}", response_model=dict[str, Any])
def read_collection_document(
    collection_name: CollectionName,
    document_id: str,
) -> dict[str, Any]:
    """Fetch a single document by ID from the given collection."""

    return get_document(collection_name, document_id)


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

    return update_document(collection_name, document_id, payload, merge=False)


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

    return update_document(collection_name, document_id, payload, merge=True)


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
    items = get_collection(collection_name)
    return {
        "collection": collection_name,
        "count": len(items),
        "items": items,
    }
