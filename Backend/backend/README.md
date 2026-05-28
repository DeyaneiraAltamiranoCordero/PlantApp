# Backend API

Backend API en FastAPI conectada a Firestore.

## Estructura

- `main.py`: punto de entrada de FastAPI
- `app/config.py`: variables de entorno
- `app/firebase.py`: inicializacion de Firebase Admin
- `app/services.py`: acceso generico a Firestore
- `app/models.py`: modelos Pydantic de respuesta
- `app/routes.py`: endpoints REST

## Variables de entorno

Copia `.env.example` a `.env` dentro de `backend` y ajusta:

```env
API_HOST=127.0.0.1
API_PORT=8000
API_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=../serviceAccountKey.json
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
PORT=8002
ALLOWED_ORIGINS=*
MAX_GROUP_MESSAGES=100
MAX_DM_MESSAGES=50
```

Notas:

- `PORT` y `ALLOWED_ORIGINS` son aliases compatibles con el ejemplo del profe.
- Las variables `EXPO_PUBLIC_CHAT_APP` y `EXPO_PUBLIC_CHAT_WS_APP` van en el `.env` del frontend Expo, no en el backend.
- `MAX_GROUP_MESSAGES` y `MAX_DM_MESSAGES` preparan el backend para limitar memoria cuando se agregue el chat real.

## Instalacion
Dentro de nuestro ambiente de python
```powershell
pip install -r .\requirements.txt
```

Si ya tienes otro entorno virtual para backend, puedes usarlo sin problema.

## Ejecutar

Desde la raiz del proyecto:

```powershell
 uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Endpoints principales

- `GET /health`
- `GET /api/users/{userId}`
- `GET /api/users/{userId}/profile`
- `GET /api/users/{userId}/friends`
- `GET /api/users/{userId}/plants`
- `GET /api/plants/{plantId}/details`
- `GET|POST|PUT|PATCH|DELETE /api/{collection}` para `users`, `friends`, `plants`, `pests`, `categories`, `careTypes`, `achievements`
- `GET /api/{collection}/{documentId}`
- `GET /api/collections/{collection}` (atajo legacy que incluye `count`)

### Filtros dinamicos

`GET /api/{collection}?filter=campo:operador:valor` permite encadenar filtros Firestore (`==`, `array_contains`, etc.). Admite multiples `filter=` y convierte automaticamente `true/false/null` y numeros. Ejemplo: `/api/plants?filter=userId:==:usr-1&filter=isFavorite:==:true`.

## Notas

- Usa Firebase Admin, asi que consulta Firestore del lado servidor (no expone credenciales al cliente).
- Si la service account no tiene permisos, la API devolvera errores al consultar Firestore.
- El endpoint `GET /api/collections/{collection}` es util para desarrollo interno; cuando saques esta API del proyecto conviene restringirlo o eliminarlo.
- Todas las operaciones de escritura (`POST/PUT/PATCH/DELETE`) esperan/retornan JSON plano; si el body incluye `id`, se respeta, de lo contrario se genera uno nuevo.
- En `plants`, el campo canónico de riego es `wateringFrequencyDays`; el backend sigue aceptando `wateringIntervalDays` como alias de compatibilidad y calcula `nextWateringDate` automaticamente a partir de `lastWatered`.
- `wateringNotes` es opcional y se guarda tal cual para observaciones como ajustes estacionales.
