import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

TIMESTAMP_FIELDS = {"createdAt", "updatedAt", "scheduledFor"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Carga colecciones iniciales en Firestore desde un archivo JSON."
    )
    parser.add_argument(
        "--credentials",
        required=True,
        help="Ruta al JSON de la service account de Firebase.",
    )
    parser.add_argument(
        "--data",
        help=(
            "Ruta al archivo JSON con las colecciones a cargar. "
            "Si se omite, primero intenta usar ../firebase-seed.json y luego seed_data.json."
        ),
    )
    parser.add_argument(
        "--merge",
        action="store_true",
        help="Usa merge=True al escribir documentos existentes.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra lo que se cargaria sin escribir en Firestore.",
    )
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def ensure_firebase_initialized(credentials_path: Path) -> firestore.Client:
    if not firebase_admin._apps:
        cred = credentials.Certificate(str(credentials_path))
        firebase_admin.initialize_app(cred)
    return firestore.client()


def convert_value(key: str, value: Any) -> Any:
    if isinstance(value, dict):
        return {nested_key: convert_value(nested_key, nested_value) for nested_key, nested_value in value.items()}

    if isinstance(value, list):
        return [convert_value(key, item) for item in value]

    if key in TIMESTAMP_FIELDS and isinstance(value, str):
        iso_value = value.replace("Z", "+00:00")
        return datetime.fromisoformat(iso_value).astimezone(timezone.utc)

    return value


def resolve_default_data_path(base_dir: Path) -> Path:
    candidates = (
        (base_dir.parent / "firebase-seed.json").resolve(),
        (base_dir / "seed_data.json").resolve(),
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "No se encontro un archivo de seed por defecto. "
        "Prueba con --data <ruta-al-json>."
    )


def extract_collections(seed_data: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    if "collections" in seed_data:
        collections = seed_data["collections"]
    else:
        collections = seed_data

    if not isinstance(collections, dict):
        raise ValueError(
            "El archivo de datos debe contener un objeto 'collections' o un objeto raiz "
            "con colecciones."
        )

    normalized_collections: dict[str, list[dict[str, Any]]] = {}

    for collection_name, documents in collections.items():
        if not isinstance(collection_name, str) or not collection_name.strip():
            raise ValueError("Se encontro una coleccion con nombre invalido.")

        if not isinstance(documents, list):
            raise ValueError(f"La coleccion '{collection_name}' debe ser una lista.")

        normalized_collections[collection_name] = documents

    if not normalized_collections:
        raise ValueError("No se encontraron colecciones para cargar.")

    return normalized_collections


def normalize_document(document: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    document_id = document.get("id")

    if not isinstance(document_id, str) or not document_id.strip():
        raise ValueError(f"Documento invalido sin id: {document}")

    if "data" in document:
        data = document.get("data")
        if not isinstance(data, dict):
            raise ValueError(f"Documento invalido sin data: {document}")
        payload = data
    else:
        payload = {key: value for key, value in document.items() if key != "id"}

    return document_id, convert_value("root", payload)


def validate_seed_data(collections: dict[str, list[dict[str, Any]]]) -> None:
    seen_document_paths: set[str] = set()

    for collection_name, documents in collections.items():
        for index, document in enumerate(documents):
            if not isinstance(document, dict):
                raise ValueError(
                    f"El documento #{index + 1} de la coleccion '{collection_name}' debe ser un objeto."
                )

            document_id, _ = normalize_document(document)
            document_path = f"{collection_name}/{document_id}"

            if document_path in seen_document_paths:
                raise ValueError(f"Documento duplicado detectado: {document_path}")

            seen_document_paths.add(document_path)

def write_seed_data(
    db: firestore.Client | None,
    collections: dict[str, list[dict[str, Any]]],
    merge: bool,
    dry_run: bool,
) -> None:
    total_documents = 0

    for collection_name, documents in collections.items():
        print(f"\nColeccion '{collection_name}': {len(documents)} documento(s)")

        for document in documents:
            document_id, payload = normalize_document(document)
            total_documents += 1

            if dry_run:
                print(f"  - [dry-run] {collection_name}/{document_id}")
                continue

            if db is None:
                raise RuntimeError("No hay una instancia de Firestore disponible para escribir datos.")

            db.collection(collection_name).document(document_id).set(payload, merge=merge)
            print(f"  - OK {collection_name}/{document_id}")

    print(f"\nProceso completado. Documentos procesados: {total_documents}")


def main() -> None:
    args = parse_args()
    base_dir = Path(__file__).resolve().parent
    credentials_path = Path(args.credentials).expanduser().resolve()
    data_path = (
        Path(args.data).expanduser().resolve()
        if args.data
        else resolve_default_data_path(base_dir)
    )

    if args.data and not Path(args.data).is_absolute():
        data_path = (base_dir / args.data).resolve()

    if not credentials_path.exists():
        raise FileNotFoundError(f"No existe el archivo de credenciales: {credentials_path}")

    if not data_path.exists():
        raise FileNotFoundError(f"No existe el archivo de datos: {data_path}")

    seed_data = load_json(data_path)
    collections = extract_collections(seed_data)
    validate_seed_data(collections)

    if args.dry_run:
        print("Modo simulacion activado. No se escribira nada en Firestore.")
        db = None
    else:
        db = ensure_firebase_initialized(credentials_path)
    print(f"Archivo de datos: {db}")
    write_seed_data(db, collections, merge=args.merge, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
