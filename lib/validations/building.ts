import { z } from "zod";

export const CreateBuildingSchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE", "ORG_ONLY"]).default("PUBLIC"),
});

export const UpdateBuildingSchema = CreateBuildingSchema.omit({ organizationId: true }).partial();

export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof UpdateBuildingSchema>;
