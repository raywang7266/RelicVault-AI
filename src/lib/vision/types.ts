/**
 * 文物识图打标 —— 统一视觉分析接口。
 *
 * 设计目标：把"具体用哪家大模型"从业务路由里解耦。
 * 通过环境变量 AI_PROVIDER 选择实现（默认 zhipu / 智谱 GLM，
 * 国内直连、永久免费、OpenAI 兼容）；后续可平滑接入 siliconflow / gemini。
 */

export interface VisionAnalysisResult {
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

/** 所有视觉 provider 必须实现的能力 */
export interface VisionProvider {
  /** 人类可读名称，用于错误提示 */
  readonly name: string;
  /**
   * 对单张文物图片做识图打标。
   * @param dataUrl 形如 `data:<mime>;base64,<data>` 的图片 data URL
   * @param mimeType 图片 MIME（image/jpeg|png|webp）
   * @param lang 输出语言指令（简体中文/繁體中文/English），让 AI 文本跟随界面语言
   */
  analyzeArtifact(
    dataUrl: string,
    mimeType: string,
    lang?: string
  ): Promise<VisionAnalysisResult>;
}
