import { z } from "zod";

export const CreateFloorSchema = z.object({
  buildingId: z.string().cuid(),
  name: z.string().min(1, "Name is required"),
  levelNumber: z.number().int(),
  description: z.string().optional(),
  floorPlanImageUrl: z.string().url().optional().or(z.literal("")),
  accessibilityNotes: z.string().optional(),
});

export const UpdateFloorSchema = CreateFloorSchema.omit({ buildingId: true }).partial();

export type CreateFloorInput = z.infer<typeof CreateFloorSchema>;
export type UpdateFloorInput = z.infer<typeof UpdateFloorSchema>;
