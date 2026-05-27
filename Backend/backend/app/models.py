"""Pydantic models that represent the Firestore documents the API exposes."""

from typing import Any

from pydantic import BaseModel, Field


class FirestoreDocument(BaseModel):
    """Common Firestore metadata shared by all documents."""

    id: str
    createdAt: str | None = None
    updatedAt: str | None = None


class UserModel(FirestoreDocument):
    """User profile persisted in the `users` collection."""

    authUid: str | None = None
    code: str
    name: str
    lastName: str
    secondLastName: str | None = None
    nickname: str
    profilePicture: str
    plantCount: int
    birthDate: str
    registrationDate: str
    email: str
    streak: int
    description: str | None = None
    bibliography: str | None = None
    publicProfile: bool | None = None
    isPrivate: bool | None = None
    achievements: list[str] = Field(default_factory=list)


class FriendModel(FirestoreDocument):
    """Represents the friendship relationship between two users."""

    userIdA: str
    userIdB: str
    createdAt: str


class PlantModel(FirestoreDocument):
    """Base model for plants owned by a user."""

    userId: str
    image: str | None = None
    imageUrl: str | None = None
    name: str
    categoryId: str
    age: str
    price: float
    growthTime: str
    height: str
    isFavorite: bool
    toxic: bool
    toxicTo: str | None = None
    flowering: str
    status: str
    lightPreference: str
    originLocality: str
    temperature: str
    careTypes: list[str] = Field(default_factory=list)
    lastWatered: str
    wateringFrequencyDays: int | None = None
    wateringIntervalDays: int | None = None
    wateringNotes: str | None = None
    nextWateringDate: str | None = None
    fertilizerType: str
    lastFertilized: str
    pests: list[str] = Field(default_factory=list)


class CategoryModel(FirestoreDocument):
    """Describes the taxonomic or thematic category for a plant."""

    name: str
    description: str | None = ""


class CareTypeModel(FirestoreDocument):
    """Represents a recurring care task (riego, poda, etc.)."""

    name: str
    description: str


class PestModel(FirestoreDocument):
    """Pests that may affect plants and their treatment notes."""

    imageUrl: str | None = None
    name: str
    scientificName: str | None = ""
    treatment: str | None = ""
    description: str | None = ""
    dangerLevel: str | None = ""


class PlantWithRelationsModel(PlantModel):
    """Plant enriched with its category, care types and pests."""

    careTypeIds: list[str] = Field(default_factory=list)
    pestIds: list[str] = Field(default_factory=list)
    careTypes: list[CareTypeModel] = Field(default_factory=list)
    pests: list[PestModel] = Field(default_factory=list)
    category: CategoryModel | None = None


class AchievementModel(FirestoreDocument):
    """Achievements unlocked by completing plant-care milestones."""

    name: str
    description: str
    obtainedWhen: str
    emoji: str
    plantId: str


class UserProfileResponse(BaseModel):
    """Response payload for the consolidated user profile endpoint."""

    user: UserModel
    friends: list[FriendModel] = Field(default_factory=list)
    plants: list[PlantWithRelationsModel] = Field(default_factory=list)
    categories: list[CategoryModel] = Field(default_factory=list)
    achievements: list[AchievementModel] = Field(default_factory=list)


class PlantDetailResponse(BaseModel):
    """Detailed representation of a plant plus auxiliary catalogs."""

    plant: PlantModel
    careTypes: list[CareTypeModel] = Field(default_factory=list)
    pests: list[PestModel] = Field(default_factory=list)


class WateringReminderPlantModel(FirestoreDocument):
    """Plant entry rendered inside the monthly watering calendar."""

    name: str
    image: str | None = None
    imageUrl: str | None = None
    categoryName: str | None = None
    lastWatered: str | None = None
    wateringFrequencyDays: int | None = None
    wateringIntervalDays: int | None = None
    wateringNotes: str | None = None
    nextWateringDate: str | None = None
    isOverdue: bool = False


class WateringReminderDayModel(BaseModel):
    """Single day in the watering calendar with all due plants."""

    date: str
    plants: list[WateringReminderPlantModel] = Field(default_factory=list)


class WateringCalendarResponse(BaseModel):
    """Monthly watering calendar for the home screen."""

    month: str
    days: list[WateringReminderDayModel] = Field(default_factory=list)
    pendingPlants: list[WateringReminderPlantModel] = Field(default_factory=list)


class ApiCollectionResponse(BaseModel):
    """Envelope used by legacy collection endpoints."""

    collection: str
    count: int
    items: list[dict[str, Any]]


class IdentifyResponse(BaseModel):
    """Result of AI plant identification analysis."""

    name: str = "Desconocido"
    scientific_name: str | None = "N/A"
    category: str = "Desconocida"
    age: str = "N/A"
    growthTime: str = "N/A"
    height: str = "N/A"
    toxic: bool = False
    toxicTo: str | None = None
    flowering: str = "N/A"
    status: str = "saludable"
    lightPreference: str = "N/A"
    originLocality: str = "N/A"
    temperature: str = "N/A"
    fertilizerType: str = "N/A"
    description: str | None = "Sin descripción disponible."
