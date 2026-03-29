import { z } from 'zod';

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
