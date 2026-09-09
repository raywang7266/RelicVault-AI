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

/** 交给视觉模型的一张图片 */
export interface VisionImage {
  /** 形如 `data:<mime>;base64,<data>` */
  dataUrl: string;
  /** 图片 MIME（image/jpeg|png|webp） */
  mimeType: string;
}

/** 所有视觉 provider 必须实现的能力 */
export interface VisionProvider {
  /** 人类可读名称，用于错误提示 */
  readonly name: string;
  /**
   * 对文物图片做识图打标。
   *
   * 支持一次传入多张（已实测智谱 glm-4v-flash 可接收多张 image_url，
   * 模型会综合多角度信息判断，比单张更准确）。传单张时数组长度即为 1。
   *
   * @param images 图片数组，第一张视为封面/主图
   * @param lang 输出语言指令（简体中文/繁體中文/English），让 AI 文本跟随界面语言
   */
  analyzeArtifact(
    images: VisionImage[],
    lang?: string
  ): Promise<VisionAnalysisResult>;
}
