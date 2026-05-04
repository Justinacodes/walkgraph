import { z } from "zod";

export const CreateOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, alphanumeric, or hyphens").optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE", "ORG_ONLY"]).default("PUBLIC"),
});

export const UpdateOrgSchema = CreateOrgSchema.partial();

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;
export type UpdateOrgInput = z.infer<typeof UpdateOrgSchema>;
