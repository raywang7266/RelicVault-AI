export type ArtifactStatus = "draft" | "pending" | "published" | "rejected";

export interface Artifact {
  id: string;
  title: string;
  description: string | null;
  category: string;
  era: string | null;
  origin: string | null;
  image_url: string;
  image_urls: string[];
  status: ArtifactStatus;
  contributor_id: string;
  ai_analysis: AIAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  summary: string;
  estimated_era: string | null;
  material: string | null;
  cultural_context: string | null;
  confidence: number;
  suggested_tags: string[];
}
