import { z } from "zod";

export const NODE_TYPES = [
  "ENTRANCE", "EXIT", "RECEPTION", "HALLWAY_POINT", "CORRIDOR_JUNCTION",
  "DOOR", "ROOM", "OFFICE", "LECTURE_HALL", "RESTROOM",
  "STAIRCASE", "ELEVATOR", "RAMP", "LANDMARK", "RESTRICTED_AREA", "EMERGENCY_EXIT",
] as const;

export const CreateNodeSchema = z.object({
  buildingId: z.string().cuid(),
  floorId: z.string().cuid(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(NODE_TYPES),
  description: z.string().optional(),
  x: z.number().optional().default(100),
  y: z.number().optional().default(100),
  photoUrl: z.string().url().optional().or(z.literal("")),
  searchable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  accessibilityFlags: z.array(z.string()).default([]),
  restricted: z.boolean().default(false),
});

export const UpdateNodeSchema = CreateNodeSchema.omit({ buildingId: true }).partial();

export type CreateNodeInput = z.infer<typeof CreateNodeSchema>;
export type UpdateNodeInput = z.infer<typeof UpdateNodeSchema>;
