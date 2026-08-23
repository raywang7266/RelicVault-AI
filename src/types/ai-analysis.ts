/**
 * POST /api/analyze-artifact 的请求与响应类型。
 *
 * 前端 ArtifactUploadForm.handleAIAnalyze 发送：
 *   { image: "data:<mime>;base64,..." }
 * 接收（response.analysis）扁平字段，直接回填表单：
 *   { title, era, category, preservationStatus, description, tags }
 */

export interface AnalyzeArtifactRequest {
  image: string; // base64 data URL
}

/** 识图打标结果（字段与上传表单回填一一对应） */
export interface ArtifactVisionAnalysis {
  title: string;
  era: string;
  category: string;
  preservationStatus:
    | "Intact"
    | "Minor Damage"
    | "Severe Degradation"
    | "Ruin"
    | string;
  description: string;
  tags: string[];
}

export interface AnalyzeArtifactResponse {
  analysis: ArtifactVisionAnalysis;
}

export interface AnalyzeArtifactError {
  error: string;
  details?: string;
}
