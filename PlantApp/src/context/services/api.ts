import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import {
  CareTypesArraySchema,
  CategoriesArraySchema,
  ISODateStringSchema,
  PestsArraySchema,
  PlantSchema,
  PlantsArraySchema,
  WateringCalendarResponseSchema,
} from './schemas';

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured;

  const renderFallback = 'https://plantapp-7iyo.onrender.com';

  if (!__DEV__) return renderFallback;

  // Android emulator cannot reach localhost directly; 10.0.2.2 maps to host machine.
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  if (Platform.OS === 'ios' || Platform.OS === 'web') return 'http://localhost:8000';
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();
console.log("Conectando con la API en:", API_BASE_URL);

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class ApiValidationError extends Error {
  issues: z.ZodIssue[];
  body?: unknown;

  constructor(message: string, issues: z.ZodIssue[], body?: unknown) {
    super(message);
    this.issues = issues;
    this.body = body;
  }
}

export type User = {
  id: string;
  authUid?: string;
  email: string;
  code?: string;
  name: string;
  lastName?: string;
  secondLastName?: string;
  nickname?: string;
  profilePicture?: string | null;
  description?: string;
  bibliography?: string;
  plantCount?: number;
  streak?: number;
  streakDays?: number;
  achievements?: string[];
  registrationDate?: string;
  birthDate?: string;
  publicProfile?: boolean;
  isPrivate?: boolean;
};

export type UserProfileStats = {
  plantsCount: number;
  favoritePlantsCount: number;
  friendsCount: number;
};

export type Plant = {
  id: string;
  userId: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  categoryIds?: string[];
  category?: Category | null;
  age?: string;
  price?: number;
  growthTime?: string;
  height?: string;
  isFavorite?: boolean;
  toxic?: boolean;
  toxicTo?: string | null;
  flowering?: string;
  status?: string;
  lightPreference?: string;
  originLocality?: string;
  temperature?: string;
  // Backend can return IDs or populated objects.
  careTypeIds?: string[];
  careTypes?: Array<string | CareType>;
  lastWatered?: string;
  wateringIntervalDays?: number | null;
  nextWateringDate?: string | null;
  fertilizerType?: string;
  lastFertilized?: string;
  pestIds?: string[];
  pests?: Array<string | Pest>;
  image?: string | null;
  imageUrl?: string | null;
  photo?: string | null;
  source?: 'manual' | 'detection';
  detectionConfidence?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type CareType = {
  id: string;
  name: string;
  description?: string;
};

export type Pest = {
  id: string;
  name: string;
  scientificName?: string;
  dangerLevel?: string;
  description?: string;
  treatment?: string;
};

export type IdentifyResult = {
    name: string;
    scientific_name?: string;
    category: string;
    age: string;
    growthTime: string;
    height: string;
    toxic: boolean;
    toxicTo: string | null;
    flowering: string;
    status: string;
    lightPreference: string;
    originLocality: string;
    temperature: string;
    fertilizerType: string;
    description?: string;
};

const normalizeUser = (raw: unknown): User => {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      email: '',
      name: '',
    };
  }

  const record = raw as Record<string, unknown>;
  const nestedUser =
    record.user && typeof record.user === 'object'
      ? (record.user as Record<string, unknown>)
      : null;

  const id =
    (typeof record.id === 'string' && record.id) ||
    (typeof nestedUser?.id === 'string' && nestedUser.id) ||
    (typeof record.authUid === 'string' && record.authUid) ||
    (typeof nestedUser?.authUid === 'string' && nestedUser.authUid) ||
    '';

  const email =
    (typeof record.email === 'string' && record.email) ||
    (typeof nestedUser?.email === 'string' && nestedUser.email) ||
    '';

  const name =
    (typeof record.name === 'string' && record.name) ||
    (typeof nestedUser?.name === 'string' && nestedUser.name) ||
    '';

  const lastName =
    (typeof record.lastName === 'string' && record.lastName) ||
    (typeof nestedUser?.lastName === 'string' && nestedUser.lastName) ||
    (typeof record.last_name === 'string' && record.last_name) ||
    (typeof nestedUser?.last_name === 'string' && nestedUser.last_name) ||
    undefined;

  const secondLastName =
    (typeof record.secondLastName === 'string' && record.secondLastName) ||
    (typeof nestedUser?.secondLastName === 'string' && nestedUser.secondLastName) ||
    (typeof record.second_last_name === 'string' && record.second_last_name) ||
    (typeof nestedUser?.second_last_name === 'string' && nestedUser.second_last_name) ||
    undefined;

  const nickname =
    (typeof record.nickname === 'string' && record.nickname) ||
    (typeof nestedUser?.nickname === 'string' && nestedUser.nickname) ||
    (typeof record.apodo === 'string' && record.apodo) ||
    (typeof nestedUser?.apodo === 'string' && nestedUser.apodo) ||
    undefined;

  const profilePicture =
    (typeof record.profilePicture === 'string' && record.profilePicture) ||
    (typeof nestedUser?.profilePicture === 'string' && nestedUser.profilePicture) ||
    (typeof record.profile_picture === 'string' && record.profile_picture) ||
    (typeof nestedUser?.profile_picture === 'string' && nestedUser.profile_picture) ||
    (typeof record.profilePicture === 'object' && record.profilePicture === null
      ? null
      : typeof nestedUser?.profilePicture === 'object' && nestedUser.profilePicture === null
        ? null
        : undefined);

  const bibliography =
    (typeof record.bibliography === 'string' && record.bibliography) ||
    (typeof nestedUser?.bibliography === 'string' && nestedUser.bibliography) ||
    (typeof record.bibliografia === 'string' && record.bibliografia) ||
    (typeof nestedUser?.bibliografia === 'string' && nestedUser.bibliografia) ||
    undefined;

  const descriptionRaw =
    (typeof record.description === 'string' && record.description) ||
    (typeof nestedUser?.description === 'string' && nestedUser.description) ||
    (typeof record.descripcion === 'string' && record.descripcion) ||
    (typeof nestedUser?.descripcion === 'string' && nestedUser.descripcion) ||
    (typeof record.bio === 'string' && record.bio) ||
    (typeof nestedUser?.bio === 'string' && nestedUser.bio) ||
    undefined;

  const description = descriptionRaw ?? bibliography;

  const birthDate =
    (typeof record.birthDate === 'string' && record.birthDate) ||
    (typeof nestedUser?.birthDate === 'string' && nestedUser.birthDate) ||
    (typeof record.birth_date === 'string' && record.birth_date) ||
    (typeof nestedUser?.birth_date === 'string' && nestedUser.birth_date) ||
    undefined;

  const publicProfile =
    typeof record.publicProfile === 'boolean'
      ? record.publicProfile
      : typeof nestedUser?.publicProfile === 'boolean'
        ? nestedUser.publicProfile
      : typeof record.public_profile === 'boolean'
        ? record.public_profile
        : typeof nestedUser?.public_profile === 'boolean'
          ? nestedUser.public_profile
        : undefined;

  const isPrivate =
    typeof record.isPrivate === 'boolean'
      ? record.isPrivate
      : typeof nestedUser?.isPrivate === 'boolean'
        ? nestedUser.isPrivate
      : typeof record.is_private === 'boolean'
        ? record.is_private
        : typeof nestedUser?.is_private === 'boolean'
          ? nestedUser.is_private
        : undefined;

  const code =
    (typeof record.code === 'string' && record.code) ||
    (typeof nestedUser?.code === 'string' && nestedUser.code) ||
    undefined;

  const plantCount =
    typeof record.plantCount === 'number'
      ? record.plantCount
      : typeof nestedUser?.plantCount === 'number'
        ? nestedUser.plantCount
      : typeof record.plant_count === 'number'
        ? record.plant_count
        : typeof nestedUser?.plant_count === 'number'
          ? nestedUser.plant_count
        : undefined;

  const streak =
    typeof record.streak === 'number'
      ? record.streak
      : typeof nestedUser?.streak === 'number'
        ? nestedUser.streak
        : undefined;

  const streakDays =
    typeof record.streakDays === 'number'
      ? record.streakDays
      : typeof nestedUser?.streakDays === 'number'
        ? nestedUser.streakDays
      : typeof record.streak_days === 'number'
        ? record.streak_days
        : typeof nestedUser?.streak_days === 'number'
          ? nestedUser.streak_days
        : undefined;

  return {
    id,
    email,
    code,
    name,
    lastName,
    secondLastName,
    nickname,
    profilePicture,
    description,
    bibliography,
    plantCount,
    streak,
    streakDays,
    birthDate,
    publicProfile,
    isPrivate,
  };
};

const normalizePest = (raw: unknown): Pest | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  if (!id) return null;

  const name =
    (typeof record.name === 'string' && record.name) ||
    (typeof record.nombre === 'string' && record.nombre) ||
    id;

  const scientificName =
    (typeof record.scientificName === 'string' && record.scientificName) ||
    (typeof record.scientific_name === 'string' && record.scientific_name) ||
    undefined;

  const dangerLevel =
    (typeof record.dangerLevel === 'string' && record.dangerLevel) ||
    (typeof record.danger_level === 'string' && record.danger_level) ||
    undefined;

  const description =
    (typeof record.description === 'string' && record.description) ||
    (typeof record.descripcion === 'string' && record.descripcion) ||
    undefined;

  const treatment =
    (typeof record.treatment === 'string' && record.treatment) ||
    (typeof record.tratamiento === 'string' && record.tratamiento) ||
    undefined;

  return {
    id,
    name,
    scientificName,
    dangerLevel,
    description,
    treatment,
  };
};

let careTypesCache: CareType[] | null = null;
let pestsCache: Pest[] | null = null;
let categoriesCache: Category[] | null = null;

export type Friend = {
  id: string;
  userIdA: string;
  userIdB: string;
  createdAt?: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  obtainedWhen?: string;
  emoji?: string;
  plantId?: string;
};

export type WateringReminderPlant = {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryName?: string | null;
  lastWatered?: string | null;
  wateringIntervalDays?: number | null;
  nextWateringDate?: string | null;
  isOverdue?: boolean;
};

export type WateringReminderDay = {
  date: string;
  plants: WateringReminderPlant[];
};

export type WateringCalendarResponse = {
  month: string;
  days: WateringReminderDay[];
  pendingPlants: WateringReminderPlant[];
};

export type UserProfileResponse = {
  user: User;
  stats: UserProfileStats;
  categories: Category[];
  favoritePlants: Plant[];
  plants: Plant[];
  friends: Friend[];
  achievements: Achievement[];
};

export type UpdateUserProfilePayload = {
  name?: string;
  lastName?: string;
  secondLastName?: string;
  nickname?: string;
  description?: string;
  profilePicture?: string | null;
  birthDate?: string;
  publicProfile?: boolean;
  isPrivate?: boolean;
};

export type CreateUserProfilePayload = {
  authUid: string;
  email: string;
  name: string;
  lastName?: string;
  secondLastName?: string;
  nickname?: string;
  profilePicture?: string | null;
  birthDate?: string;
  description?: string;
  publicProfile?: boolean;
  isPrivate?: boolean;
};

export type CreatePlantPayload = Omit<Plant, 'id'>;

export type UpdatePlantPayload = Partial<Omit<Plant, 'id'>>;

async function getAuthToken(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Firebase Auth nativo no esta disponible en Web.');
  }

  // Prefer a server-issued token if present (backend session token stored after
  // exchanging Google server auth code). This allows calling backend endpoints
  // authenticated with the server token instead of Firebase ID token.
  try {
    const serverToken = await AsyncStorage.getItem('SERVER_TOKEN');
    if (serverToken) return serverToken;
  } catch {
    // ignore storage errors and fallback to Firebase token
  }

  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return getIdToken(user, true);
}

function isZodSchema(value: unknown): value is z.ZodTypeAny {
  return Boolean(value) && typeof (value as z.ZodTypeAny).safeParse === 'function';
}

async function apiRequest<T>(path: string, options?: ApiOptions): Promise<T>;
async function apiRequest<T>(path: string, schema?: z.ZodType<T>): Promise<T>;
async function apiRequest<T>(path: string, options: ApiOptions, schema: z.ZodType<T>): Promise<T>;
async function apiRequest<T>(
  path: string,
  optionsOrSchema: ApiOptions | z.ZodType<T> = {},
  maybeSchema?: z.ZodType<T>,
): Promise<T> {
  const options: ApiOptions = isZodSchema(optionsOrSchema) ? {} : (optionsOrSchema as ApiOptions);
  const schema: z.ZodType<T> | undefined = isZodSchema(optionsOrSchema)
    ? (optionsOrSchema as z.ZodType<T>)
    : maybeSchema;

  const token = await getAuthToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_BASE_URL}. Verifica que el backend este encendido o define EXPO_PUBLIC_API_BASE_URL.`);
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    let body: unknown;
    try {
      body = await response.json();
      if ((body as { detail?: string })?.detail) {
        message = (body as { detail: string }).detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, response.status, body);
  }

  const body = (await response.json()) as unknown;
  if (!schema) return body as T;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiValidationError('Respuesta inválida de la API.', parsed.error.issues, body);
  }
  return parsed.data;
}

export async function getUserProfile(
  userUid: string,
): Promise<UserProfileResponse> {
  const raw = await apiRequest<UserProfileResponse>(`/api/users/${userUid}/profile`);
  return {
    ...raw,
    user: normalizeUser(raw.user),
  };
}

export async function getUserByUid(userUid: string): Promise<User> {
  const raw = await apiRequest<User>(`/api/users/${userUid}`);
  return normalizeUser(raw);
}

export async function createUserProfile(
  payload: CreateUserProfilePayload,
): Promise<User> {
  if (typeof payload.birthDate === 'string' && payload.birthDate.trim().length > 0) {
    const parsed = ISODateStringSchema.safeParse(payload.birthDate.trim());
    if (!parsed.success) {
      throw new ApiValidationError('Fecha de nacimiento inválida.', parsed.error.issues, payload);
    }
  }
  const raw = await apiRequest<User>(`/api/users`, {
    method: 'POST',
    body: payload,
  });
  return normalizeUser(raw);
}

export async function updateUserProfile(
  userUid: string,
  payload: UpdateUserProfilePayload,
): Promise<User> {
  if (typeof payload.birthDate === 'string' && payload.birthDate.trim().length > 0) {
    const parsed = ISODateStringSchema.safeParse(payload.birthDate.trim());
    if (!parsed.success) {
      throw new ApiValidationError('Fecha de nacimiento inválida.', parsed.error.issues, payload);
    }
  }
  const raw = await apiRequest<User>(`/api/users/${userUid}`, {
    method: 'PATCH',
    body: payload,
  });
  return normalizeUser(raw);
}

export async function uploadUserPhoto(userUid: string, filename: string, base64content: string): Promise<string> {
  const raw = await apiRequest<{ url: string }>(`/api/users/${userUid}/photo`, {
    method: 'POST',
    body: { filename, content: `data:image/jpeg;base64,${base64content}` },
  });
  return raw.url;
}

export async function getPlants(): Promise<Plant[]> {
  return apiRequest(`/api/plants`, PlantsArraySchema);
}

export async function getUserPlants(userUid: string): Promise<Plant[]> {
  return apiRequest(`/api/users/${userUid}/plants`, PlantsArraySchema);
}

export async function getWateringCalendar(userUid: string, month?: string): Promise<WateringCalendarResponse> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  return apiRequest(`/api/users/${userUid}/watering-calendar${query}`, WateringCalendarResponseSchema);
}

export async function createPlant(payload: CreatePlantPayload): Promise<Plant> {
  return apiRequest(`/api/plants`, {
    method: 'POST',
    body: payload,
  }, PlantSchema);
}

export async function updatePlant(
  plantId: string,
  payload: UpdatePlantPayload,
): Promise<Plant> {
  return apiRequest(`/api/plants/${plantId}`, {
    method: 'PATCH',
    body: payload,
  }, PlantSchema);
}

export async function getCategories(options?: { forceRefresh?: boolean }): Promise<Category[]> {
  if (!options?.forceRefresh && Array.isArray(categoriesCache)) {
    return categoriesCache;
  }

  const result = await apiRequest(`/api/categories`, CategoriesArraySchema);
  categoriesCache = Array.isArray(result) ? result : [];
  return categoriesCache;
}

export async function getCareTypes(options?: { forceRefresh?: boolean }): Promise<CareType[]> {
  if (!options?.forceRefresh && Array.isArray(careTypesCache)) {
    return careTypesCache;
  }

  try {
    const result = await apiRequest(`/api/care-types`, CareTypesArraySchema);
    careTypesCache = Array.isArray(result) ? result : [];
    return careTypesCache;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      try {
        const result = await apiRequest(`/api/careTypes`, CareTypesArraySchema);
        careTypesCache = Array.isArray(result) ? result : [];
        return careTypesCache;
      } catch (fallbackError) {
        if (fallbackError instanceof ApiError && fallbackError.status === 404) {
          const result = await apiRequest(`/api/caretypes`, CareTypesArraySchema);
          careTypesCache = Array.isArray(result) ? result : [];
          return careTypesCache;
        }
        throw fallbackError;
      }
    }
    throw error;
  }
}

export async function getPests(options?: { forceRefresh?: boolean }): Promise<Pest[]> {
  if (!options?.forceRefresh && Array.isArray(pestsCache)) {
    return pestsCache;
  }

  try {
    const result = await apiRequest<unknown[]>(`/api/pests`);
    const normalized = Array.isArray(result)
      ? result.map((item) => normalizePest(item)).filter((item): item is Pest => Boolean(item))
      : [];

    const parsed = PestsArraySchema.safeParse(normalized);
    if (!parsed.success) {
      throw new ApiValidationError('Respuesta inválida de la API.', parsed.error.issues, result);
    }

    pestsCache = parsed.data;
    return pestsCache;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // Fallback for older routes if any
      const result = await apiRequest<unknown[]>(`/api/pest`);
      const normalized = Array.isArray(result)
        ? result.map((item) => normalizePest(item)).filter((item): item is Pest => Boolean(item))
        : [];

      const parsed = PestsArraySchema.safeParse(normalized);
      if (!parsed.success) {
        throw new ApiValidationError('Respuesta inválida de la API.', parsed.error.issues, result);
      }

      pestsCache = parsed.data;
      return pestsCache;
    }
    throw error;
  }
}

export async function prefetchPlantCatalogs(): Promise<void> {
  await Promise.all([
    getCategories().catch(() => null),
    getCareTypes().catch(() => null),
    getPests().catch(() => null),
  ]);
}

export async function getCategoryById(categoryId: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((cat) => cat.id === categoryId) ?? null;
}

export async function getCareTypeById(careTypeId: string): Promise<CareType | null> {
  const careTypes = await getCareTypes();
  return careTypes.find((item) => item.id === careTypeId) ?? null;
}

export async function getPestById(pestId: string): Promise<Pest | null> {
  const pests = await getPests();
  return pests.find((item) => item.id === pestId) ?? null;
}

export async function getPestDocument(pestId: string): Promise<Pest> {
  const raw = await apiRequest<unknown>(`/api/pests/${pestId}`);
  const normalized = normalizePest(raw);
  if (!normalized) {
    throw new Error(`Invalid pest payload for id '${pestId}'`);
  }
  return normalized;
}

export async function identifyPlant(base64Image: string): Promise<IdentifyResult> {
    return apiRequest<IdentifyResult>('/api/identify', {
        method: 'POST',
        body: { image: base64Image },
    });
}
