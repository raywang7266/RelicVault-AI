/** Request body for POST /api/analyze-artifact (multipart form field name: "image") */
export interface AnalyzeArtifactRequest {
  image: File;
}

/** Structured output returned by GPT-4o Vision */
export interface ArtifactVisionAnalysis {
  suggested_title: string;
  era_estimation: string;
  category: string;
  ai_tags: string[];
  preservation_status:
    | "Intact"
    | "Minor Damage"
    | "Severe Degradation"
    | "Ruin"
    | string;
  short_description: string;
}

export interface AnalyzeArtifactResponse {
  analysis: ArtifactVisionAnalysis;
}

export interface AnalyzeArtifactError {
  error: string;
  details?: string;
}
