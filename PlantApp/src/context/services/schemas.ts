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
  })
  .passthrough();

export const CategoriesArraySchema = z.array(CategorySchema);
export const CareTypesArraySchema = z.array(CareTypeSchema);
export const PestsArraySchema = z.array(PestSchema);
export const PlantsArraySchema = z.array(PlantSchema);
