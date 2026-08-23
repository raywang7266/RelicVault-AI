import "server-only";

/**
 * 内置演示数据（demo seed）。
 *
 * 目标：任何人克隆本项目、启动一个全新的空 MongoDB 后，第一次访问应用
 * 就能看到一组统一的示范文物——因为目前没有统一服务器，每位用户跑的
 * 都是自己的本地库，所以这里把演示数据**全部写死在代码里**：
 *   - 标题 / 描述 / 标签 / 年代 / 门类 / 坐标 → 固定值
 *   - 图片 URL 用 picsum 固定 seed（按标题取 hash，同一标题永远同一张图）
 *   - createdAt 用固定日期 → 所有安装上的列表排序完全一致
 * 这样无论谁安装，看到的占位符内容与顺序都一模一样。
 *
 * 由 `ensure-demo-data.ts` 在应用首次读取数据时自动灌入（幂等）。
 * 与 `scripts/seed-artifacts-mongo.js`（手动版脚本）数据同源。
 */

/** 演示 curator 账号（每个本地库各自创建一份，凭据一致） */
export const DEMO_CURATOR = {
  email: "curator@relicvault.app",
  username: "relicvault_curator",
  displayName: "RelicVault 文库",
  bio: "由 RelicVault 团队维护的示范文物收藏，用于展示众包数字典藏能力。",
  password: "RelicVault@2026",
  /** 固定注册时间 */
  createdAt: new Date("2026-01-05T08:00:00.000Z"),
};

export interface DemoArtifact {
  title: string;
  description: string;
  era: string;
  category: string;
  preservationStatus:
    | "excellent"
    | "good"
    | "fair"
    | "poor"
    | "critical";
  tags: string[];
  locationName: string;
  lat: number | null;
  lng: number | null;
  isProtected: boolean;
  /** 固定创建时间（保证跨安装的排序一致；按数组顺序递增 → 列表按新→旧展示时倒序） */
  createdAt: Date;
}

/** 12 件示范文物（内容与手动 seed 脚本保持一致） */
export const DEMO_ARTIFACTS: DemoArtifact[] = [
  {
    title: "南宋·龙泉窑青瓷莲瓣碗",
    era: "南宋",
    category: "陶瓷器",
    preservationStatus: "excellent",
    tags: ["龙泉窑", "青瓷", "茶器"],
    locationName: "浙江·龙泉（大窑枫洞岩窑址）",
    lat: 28.0731,
    lng: 119.1412,
    isProtected: false,
    description:
      "粉青釉色如玉，外壁刻莲瓣纹，内壁素净。胎薄釉厚，为龙泉窑鼎盛期典型器，曾由家族旧藏流转。",
    createdAt: new Date("2026-01-05T09:00:00.000Z"),
  },
  {
    title: "唐·瑞兽葡萄纹铜镜",
    era: "唐",
    category: "金属器",
    preservationStatus: "excellent",
    tags: ["铜镜", "海兽葡萄", "青铜"],
    locationName: "陕西·西安（唐长安城遗址）",
    lat: 34.3416,
    lng: 108.9398,
    isProtected: true,
    description:
      "背面高浮雕瑞兽与葡萄缠枝，纹饰繁密饱满，镜体厚重，绿锈自然。盛唐铜镜工艺的代表作。",
    createdAt: new Date("2026-01-06T09:00:00.000Z"),
  },
  {
    title: "明永乐·青花缠枝莲纹罐",
    era: "明永乐",
    category: "陶瓷器",
    preservationStatus: "good",
    tags: ["青花", "景德镇", "瓷罐"],
    locationName: "江西·景德镇（珠山御窑厂）",
    lat: 29.2921,
    lng: 117.1794,
    isProtected: false,
    description:
      "胎白釉润，青花发色浓艳带铁锈斑。缠枝莲纹布局疏朗，为永乐官窑青花的典型风格。",
    createdAt: new Date("2026-01-07T09:00:00.000Z"),
  },
  {
    title: "清乾隆·缂丝花鸟册页",
    era: "清乾隆",
    category: "织物",
    preservationStatus: "fair",
    tags: ["缂丝", "织绣", "花鸟"],
    locationName: "北京·故宫博物院",
    lat: 39.9151,
    lng: 116.3972,
    isProtected: false,
    description:
      "以通经断纬技法织就花鸟小品，色彩典雅。局部有虫蛀与褪色，已作保护性装裱。",
    createdAt: new Date("2026-01-08T09:00:00.000Z"),
  },
  {
    title: "战国·谷纹玉璧",
    era: "战国",
    category: "玉石",
    preservationStatus: "good",
    tags: ["玉璧", "礼器", "谷纹"],
    locationName: "河南·洛阳（周王城遗址）",
    lat: 34.617,
    lng: 112.4536,
    isProtected: false,
    description:
      "青玉质，表面满布规整谷纹，边缘有微小磕口。谷纹象征生机，为战国玉礼器的重要形制。",
    createdAt: new Date("2026-01-09T09:00:00.000Z"),
  },
  {
    title: "元·青花鬼谷子下山图罐",
    era: "元",
    category: "陶瓷器",
    preservationStatus: "poor",
    tags: ["青花", "元青花", "人物"],
    locationName: "江西·景德镇",
    lat: 29.2921,
    lng: 117.1794,
    isProtected: false,
    description:
      "腹部通景绘鬼谷子下山故事，人物生动，青花浓翠。口沿与底足有剥釉，圈足略残。",
    createdAt: new Date("2026-01-10T09:00:00.000Z"),
  },
  {
    title: "北宋·汝窑天青釉洗",
    era: "北宋",
    category: "陶瓷器",
    preservationStatus: "excellent",
    tags: ["汝窑", "天青", "文房"],
    locationName: "河南·宝丰（清凉寺汝窑遗址）",
    lat: 33.8826,
    lng: 113.0643,
    isProtected: false,
    description:
      "天青釉色温润如玉，开片细密，裹足支烧留有细小芝麻钉痕。为宋代五大名窑之首的代表作。",
    createdAt: new Date("2026-01-11T09:00:00.000Z"),
  },
  {
    title: "汉·四神兽玉佩",
    era: "汉",
    category: "玉石",
    preservationStatus: "good",
    tags: ["玉佩", "四神", "汉代"],
    locationName: "陕西·西安（汉长安城遗址）",
    lat: 34.3416,
    lng: 108.9398,
    isProtected: false,
    description:
      "白玉雕四神兽纹，线条流转，局部沁色入骨。为汉代佩玉中寓含方位与守护之意的精品。",
    createdAt: new Date("2026-01-12T09:00:00.000Z"),
  },
  {
    title: "唐·鎏金银壶",
    era: "唐",
    category: "金属器",
    preservationStatus: "fair",
    tags: ["鎏金", "银器", "胡风"],
    locationName: "陕西·西安（何家村窖藏）",
    lat: 34.2583,
    lng: 108.9286,
    isProtected: false,
    description:
      "银胎鎏金，壶身锤揲出胡人乐舞纹，带联珠装饰。融汇粟特与中原工艺，再现盛唐气象。",
    createdAt: new Date("2026-01-13T09:00:00.000Z"),
  },
  {
    title: "明·黄花梨四出头官帽椅",
    era: "明",
    category: "其他",
    preservationStatus: "good",
    tags: ["明式家具", "黄花梨", "木作"],
    locationName: "江苏·苏州（明式家具作坊）",
    lat: 31.2989,
    lng: 120.5853,
    isProtected: false,
    description:
      "搭脑两端出头，靠背板独板呈 S 形曲线贴合人体。扶手处有旧裂修复痕迹，仍不失明式简约气韵。",
    createdAt: new Date("2026-01-14T09:00:00.000Z"),
  },
  {
    title: "清·粉彩百花不落地瓶",
    era: "清乾隆",
    category: "陶瓷器",
    preservationStatus: "excellent",
    tags: ["粉彩", "景德镇", "陈设"],
    locationName: "江西·景德镇（御窑厂）",
    lat: 29.2921,
    lng: 117.1794,
    isProtected: false,
    description:
      "通体粉彩绘百花，不留空隙，色彩缤纷而层次分明。为乾隆时期宫廷陈设瓷的炫技之作。",
    createdAt: new Date("2026-01-15T09:00:00.000Z"),
  },
  {
    title: "新石器·红山文化玉龙",
    era: "新石器",
    category: "玉石",
    preservationStatus: "critical",
    tags: ["红山文化", "玉龙", "C形龙"],
    locationName: "内蒙古·赤峰（红山遗址）",
    lat: 42.2579,
    lng: 118.8914,
    isProtected: true,
    description:
      "墨绿玉雕 C 形龙，鬃毛细密，吻部前噘。龙身有旧裂与钙化，为中华龙图腾的早期实证。",
    createdAt: new Date("2026-01-16T09:00:00.000Z"),
  },
];

/** 演示图片 URL：picsum 固定 seed → 同一标题在任何安装上都得到同一张占位图 */
export function demoImageUrl(title: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(title)}/600/800`;
}
