import { auth as firebaseAuth } from '../../config/firebase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.100.104:8000';

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

export type User = {
  id: string;
  email: string;
  code?: string;
  name: string;
  lastName?: string;
  secondLastName?: string;
  nickname?: string;
  profilePicture?: string | null;
  description?: string;
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
  careTypes?: string[];
  lastWatered?: string;
  fertilizerType?: string;
  lastFertilized?: string;
  pests?: string[];
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
  publicProfile?: boolean;
  isPrivate?: boolean;
};

export type CreatePlantPayload = Omit<Plant, 'id'>;

export type UpdatePlantPayload = Partial<Omit<Plant, 'id'>>;

async function getAuthToken(): Promise<string> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return user.getIdToken(true);
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

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

  return response.json() as Promise<T>;
}

export async function getUserProfile(
  userUid: string,
): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>(`/api/users/${userUid}/profile`);
}

export async function getUserByUid(userUid: string): Promise<User> {
  return apiRequest<User>(`/api/users/${userUid}`);
}

export async function createUserProfile(
  payload: CreateUserProfilePayload,
): Promise<User> {
  return apiRequest<User>(`/api/users`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateUserProfile(
  userUid: string,
  payload: UpdateUserProfilePayload,
): Promise<User> {
  return apiRequest<User>(`/api/users/${userUid}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function getPlants(): Promise<Plant[]> {
  return apiRequest<Plant[]>(`/api/plants`);
}

export async function getUserPlants(userUid: string): Promise<Plant[]> {
  return apiRequest<Plant[]>(`/api/users/${userUid}/plants`);
}

export async function createPlant(payload: CreatePlantPayload): Promise<Plant> {
  return apiRequest<Plant>(`/api/plants`, {
    method: 'POST',
    body: payload,
  });
}

export async function updatePlant(
  plantId: string,
  payload: UpdatePlantPayload,
): Promise<Plant> {
  return apiRequest<Plant>(`/api/plants/${plantId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>(`/api/categories`);
}
