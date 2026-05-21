import { z } from 'zod';

export const ISODateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá el formato YYYY-MM-DD.')
  .refine((value) => {
    const [yRaw, mRaw, dRaw] = value.split('-');
    const year = Number(yRaw);
    const month = Number(mRaw);
    const day = Number(dRaw);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return false;
    }
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Validate that the date exists (e.g. rejects 2026-02-31).
    const dt = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(dt.getTime())) return false;
    const dtYear = dt.getUTCFullYear();
    const dtMonth = dt.getUTCMonth() + 1;
    const dtDay = dt.getUTCDate();
    return dtYear === year && dtMonth === month && dtDay === day;
  }, 'Fecha inválida.');

export const PlantCareDateInputSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => {
    if (!value) return true;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmY = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmY) {
      const day = Number(dmY[1]);
      const month = Number(dmY[2]);
      const year = Number(dmY[3]);
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
      if (month < 1 || month > 12 || day < 1 || day > 31) return false;
      const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      return (
        dt.getUTCFullYear() === year &&
        dt.getUTCMonth() + 1 === month &&
        dt.getUTCDate() === day
      );
    }

    // YYYY-MM-DD
    const yMd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yMd) {
      const year = Number(yMd[1]);
      const month = Number(yMd[2]);
      const day = Number(yMd[3]);
      if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
      if (month < 1 || month > 12 || day < 1 || day > 31) return false;
      const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      return (
        dt.getUTCFullYear() === year &&
        dt.getUTCMonth() + 1 === month &&
        dt.getUTCDate() === day
      );
    }

    // Otherwise accept any parseable ISO/date string.
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }, 'Fecha inválida. Usá DD/MM/AAAA o YYYY-MM-DD.')
  .transform((value) => value);

export const PlantPriceInputSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => {
    if (!value) return true;
    // Accept integers or decimals (dot/comma).
    if (!/^(\d+)([\.,]\d+)?$/.test(value)) return false;
    const normalized = value.replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num);
  }, 'Precio inválido. Usá solo números (ej. 15 o 15.50).')
  .transform((value) => value.replace(',', '.'));

export const CategorySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })
  .passthrough();

export const CareTypeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  })
  .passthrough();

export const PestSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    scientificName: z.string().optional(),
    dangerLevel: z.string().optional(),
    description: z.string().optional(),
    treatment: z.string().optional(),
  })
  .passthrough();

// Keep this schema permissive (backend may add fields).
export const PlantSchema = z
  .object({
    id: z.string(),
    userId: z.string().optional().default(''),
    name: z.string().optional().default(''),
    categoryId: z.string().optional().default(''),
    categoryName: z.string().optional(),
    categoryIds: z.array(z.string()).optional(),
    toxic: z.boolean().optional(),
    toxicTo: z.string().nullable().optional(),
    isFavorite: z.boolean().optional(),
    status: z.string().optional(),
    careTypeIds: z.array(z.string()).optional(),
    careTypes: z.array(z.union([z.string(), CareTypeSchema] as const)).optional(),
    pestIds: z.array(z.string()).optional(),
    pests: z.array(z.union([z.string(), PestSchema] as const)).optional(),
    imageUrl: z.string().nullable().optional(),
    photo: z.string().nullable().optional(),
    notes: z.string().optional(),
    description: z.string().optional(),
    wateringIntervalDays: z.number().int().positive().nullable().optional(),
    nextWateringDate: z.string().nullable().optional(),
  })
  .passthrough();

export const WateringReminderPlantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string().nullable().optional(),
    categoryName: z.string().nullable().optional(),
    lastWatered: z.string().nullable().optional(),
    wateringIntervalDays: z.number().int().positive().nullable().optional(),
    nextWateringDate: z.string().nullable().optional(),
    isOverdue: z.boolean().optional(),
  })
  .passthrough();

export const WateringReminderDaySchema = z
  .object({
    date: z.string(),
    plants: z.array(WateringReminderPlantSchema),
  })
  .passthrough();

export const WateringCalendarResponseSchema = z
  .object({
    month: z.string(),
    days: z.array(WateringReminderDaySchema),
    pendingPlants: z.array(WateringReminderPlantSchema),
  })
  .passthrough();

export const CategoriesArraySchema = z.array(CategorySchema);
export const CareTypesArraySchema = z.array(CareTypeSchema);
export const PestsArraySchema = z.array(PestSchema);
export const PlantsArraySchema = z.array(PlantSchema);
