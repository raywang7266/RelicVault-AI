import { z } from "zod";
import { ARTIFACT_CATEGORIES } from "@/lib/constants";

export const artifactSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  category: z.enum(ARTIFACT_CATEGORIES),
  era: z.string().max(100).optional(),
  origin: z.string().max(200).optional(),
  imageUrl: z.string().url(),
});

export type ArtifactFormValues = z.infer<typeof artifactSchema>;
