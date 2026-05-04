import { z } from "zod";

export const CreateEdgeSchema = z.object({
  buildingId: z.string().cuid(),
  fromNodeId: z.string().cuid(),
  toNodeId: z.string().cuid(),
  distanceEstimate: z.number().positive().optional(),
  walkTimeEstimate: z.number().positive().optional(),
  directionHint: z.string().optional(),
  accessible: z.boolean().default(true),
  requiresStairs: z.boolean().default(false),
  requiresElevator: z.boolean().default(false),
  requiresRamp: z.boolean().default(false),
  restricted: z.boolean().default(false),
  oneWay: z.boolean().default(false),
});

export const UpdateEdgeSchema = CreateEdgeSchema.omit({ buildingId: true }).partial();

export type CreateEdgeInput = z.infer<typeof CreateEdgeSchema>;
export type UpdateEdgeInput = z.infer<typeof UpdateEdgeSchema>;
