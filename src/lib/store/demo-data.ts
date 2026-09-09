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

// ---------------------------------------------------------------------------
// 演示社交账号
//
// 用途：本项目没有统一服务器，新克隆的库里只有 1 个 curator 账号，
// 无法体验「互相关注 / 关注流 / 红点通知 / 评论互动」。
// 这里额外准备 6 个风格各异的收藏者账号，各自带若干文物与评论，
// 让用户一登录就有「可以关注的人」和「可以互动的内容」。
//
// 幂等：以 email 是否齐全为判断依据，缺谁补谁，绝不重复插入。
// ---------------------------------------------------------------------------

/** 所有演示账号统一密码（与 DEMO_CURATOR 一致，方便记忆） */
export const DEMO_SOCIAL_PASSWORD = "RelicVault@2026";

export interface DemoSocialUser {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  /** 头像走原生 <img>（UserAvatar），加载失败自动回退昵称首字母 */
  avatarUrl: string;
  createdAt: Date;
  /** 该账号关注谁（填 email；自动去重、跳过自己与不存在的账号） */
  follows: string[];
}

/** 6 位演示收藏者 */
export const DEMO_SOCIAL_USERS: DemoSocialUser[] = [
  {
    email: "demo.qingci@relicvault.app",
    username: "qingci_shen",
    displayName: "青瓷客·沈砚",
    bio: "专注宋元青瓷，跑遍龙泉与景德镇的老窑址。",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
    createdAt: new Date("2026-01-12T08:00:00.000Z"),
    follows: [
      "demo.jinshi@relicvault.app",
      "demo.hanmo@relicvault.app",
      "demo.tongxiang@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.jinshi@relicvault.app",
    username: "jinshi_lu",
    displayName: "金石生·陆铭",
    bio: "青铜铭文爱好者，拓片收藏十年。",
    avatarUrl: "https://i.pravatar.cc/200?img=33",
    createdAt: new Date("2026-01-15T08:00:00.000Z"),
    follows: [
      "demo.hanmo@relicvault.app",
      "demo.yuyun@relicvault.app",
      "demo.cixiu@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.hanmo@relicvault.app",
    username: "hanmo_su",
    displayName: "翰墨斋·苏蕙",
    bio: "明清书画与扇面，偶作题跋考证。",
    avatarUrl: "https://i.pravatar.cc/200?img=45",
    createdAt: new Date("2026-01-18T08:00:00.000Z"),
    follows: [
      "demo.yuyun@relicvault.app",
      "demo.silu@relicvault.app",
      "demo.yinzhang@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.yuyun@relicvault.app",
    username: "yuyun_he",
    displayName: "玉韫山房·何玉",
    bio: "和田玉与良渚玉器，喜欢上手看工痕。",
    avatarUrl: "https://i.pravatar.cc/200?img=26",
    createdAt: new Date("2026-01-21T08:00:00.000Z"),
    follows: [
      "demo.silu@relicvault.app",
      "demo.minjian@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.silu@relicvault.app",
    username: "silu_kang",
    displayName: "丝路拾遗·康宁",
    bio: "沿着丝路捡拾织物残片与古钱币。",
    avatarUrl: "https://i.pravatar.cc/200?img=51",
    createdAt: new Date("2026-01-24T08:00:00.000Z"),
    follows: [
      "demo.minjian@relicvault.app",
      "demo.qingci@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.minjian@relicvault.app",
    username: "minjian_zhou",
    displayName: "民间守艺·周阿婆",
    bio: "记录乡间老手艺，物件不贵，故事很贵。",
    avatarUrl: "https://i.pravatar.cc/200?img=60",
    createdAt: new Date("2026-01-27T08:00:00.000Z"),
    follows: [
      "demo.qingci@relicvault.app",
      "demo.jinshi@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.tongxiang@relicvault.app",
    username: "tongxiang_tong",
    displayName: "铜香炉·童乡",
    bio: "玩铜炉与香事，喜欢看皮壳的包浆层次。",
    avatarUrl: "https://i.pravatar.cc/200?img=5",
    createdAt: new Date("2026-01-30T08:00:00.000Z"),
    follows: [
      "demo.qingci@relicvault.app",
      "demo.silu@relicvault.app",
      "demo.muyu@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.cixiu@relicvault.app",
    username: "cixiu_wei",
    displayName: "苏绣坊·卫红",
    bio: "做苏绣二十年，也收老绣片。",
    avatarUrl: "https://i.pravatar.cc/200?img=8",
    createdAt: new Date("2026-02-03T08:00:00.000Z"),
    follows: [
      "demo.hanmo@relicvault.app",
      "demo.minjian@relicvault.app",
      "demo.qiqi@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.qiqi@relicvault.app",
    username: "qiqi_qi",
    displayName: "髹漆斋·齐修",
    bio: "大漆与剔红，讲究一层一层髹出来。",
    avatarUrl: "https://i.pravatar.cc/200?img=14",
    createdAt: new Date("2026-02-07T08:00:00.000Z"),
    follows: [
      "demo.cixiu@relicvault.app",
      "demo.yuyun@relicvault.app",
      "demo.beiwei@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.beiwei@relicvault.app",
    username: "beiwei_wei",
    displayName: "碑帖阁·魏之",
    bio: "藏拓片，也自己捶拓，偏爱汉魏碑。",
    avatarUrl: "https://i.pravatar.cc/200?img=20",
    createdAt: new Date("2026-02-11T08:00:00.000Z"),
    follows: [
      "demo.jinshi@relicvault.app",
      "demo.hanmo@relicvault.app",
      "demo.yinzhang@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.muyu@relicvault.app",
    username: "muyu_yu",
    displayName: "木鱼庵·鱼幼",
    bio: "刻木雕小像，也修老佛龛。",
    avatarUrl: "https://i.pravatar.cc/200?img=25",
    createdAt: new Date("2026-02-15T08:00:00.000Z"),
    follows: [
      "demo.minjian@relicvault.app",
      "demo.tongxiang@relicvault.app",
      "curator@relicvault.app",
    ],
  },
  {
    email: "demo.yinzhang@relicvault.app",
    username: "yinzhang_zhang",
    displayName: "篆刻铺·章明",
    bio: "刻闲章与名号印，石料挑寿山青田。",
    avatarUrl: "https://i.pravatar.cc/200?img=37",
    createdAt: new Date("2026-02-19T08:00:00.000Z"),
    follows: [
      "demo.beiwei@relicvault.app",
      "demo.jinshi@relicvault.app",
      "curator@relicvault.app",
    ],
  },
];

export interface DemoSocialArtifact {
  /** 归属账号 email */
  owner: string;
  title: string;
  description: string;
  era: string;
  category: string;
  preservationStatus: "excellent" | "good" | "fair" | "poor" | "critical";
  tags: string[];
  locationName: string;
  lat: number | null;
  lng: number | null;
  isProtected: boolean;
  createdAt: Date;
  /** 点赞该文物的演示账号 email */
  likedBy?: string[];
}

/** 演示账号的文物（15 件，覆盖陶瓷 / 金属 / 书画 / 玉石 / 织物 / 民俗） */
export const DEMO_SOCIAL_ARTIFACTS: DemoSocialArtifact[] = [
  {
    owner: "demo.qingci@relicvault.app",
    title: "南宋·龙泉窑青釉双鱼洗",
    era: "南宋",
    category: "陶瓷器",
    preservationStatus: "good",
    tags: ["龙泉窑", "青瓷", "洗"],
    locationName: "浙江·龙泉（大窑枫洞岩窑址）",
    lat: 28.0731,
    lng: 119.1412,
    isProtected: false,
    description:
      "洗心贴塑双鱼，釉色粉青带梅子青调。器壁有细微冲线，为南宋龙泉窑典型文房器。",
    createdAt: new Date("2026-02-01T09:00:00.000Z"),
    likedBy: ["demo.jinshi@relicvault.app", "demo.minjian@relicvault.app"],
  },
  {
    owner: "demo.qingci@relicvault.app",
    title: "明永乐·青花缠枝莲纹梅瓶",
    era: "明永乐",
    category: "陶瓷器",
    preservationStatus: "excellent",
    tags: ["青花", "梅瓶", "景德镇"],
    locationName: "江西·景德镇（珠山御窑厂）",
    lat: 29.2921,
    lng: 117.2108,
    isProtected: false,
    description:
      "青花发色浓艳带铁锈斑，缠枝莲纹布局疏朗。胎质细白，为永乐官窑标准器。",
    createdAt: new Date("2026-02-12T09:00:00.000Z"),
    likedBy: ["demo.hanmo@relicvault.app"],
  },
  {
    owner: "demo.qingci@relicvault.app",
    title: "宋·建窑兔毫盏（残）",
    era: "宋",
    category: "陶瓷器",
    preservationStatus: "fair",
    tags: ["建窑", "兔毫", "茶器"],
    locationName: "福建·建阳（水吉窑址）",
    lat: 27.3312,
    lng: 118.1213,
    isProtected: false,
    description:
      "兔毫纹清晰，口沿有磕缺、底足残缺约三分之一。虽残，釉面析晶依然漂亮。",
    createdAt: new Date("2026-03-02T09:00:00.000Z"),
  },
  {
    owner: "demo.jinshi@relicvault.app",
    title: "商晚期·饕餮纹青铜爵",
    era: "商晚期",
    category: "金属器",
    preservationStatus: "fair",
    tags: ["青铜", "爵", "饕餮纹"],
    locationName: "河南·安阳（殷墟）",
    lat: 36.1036,
    lng: 114.3516,
    isProtected: true,
    description:
      "流尾上翘，腹部饰饕餮纹，鋬内铸有族徽铭文。三足之一后配，通体绿锈。",
    createdAt: new Date("2026-02-05T09:00:00.000Z"),
    likedBy: ["demo.qingci@relicvault.app"],
  },
  {
    owner: "demo.jinshi@relicvault.app",
    title: "战国·错金银铜带钩",
    era: "战国",
    category: "金属器",
    preservationStatus: "good",
    tags: ["错金银", "带钩"],
    locationName: "河南·洛阳（东周王城）",
    lat: 34.6197,
    lng: 112.454,
    isProtected: false,
    description:
      "钩身错金银云雷纹，金银丝保存约八成。背面铆钉完整，可正常佩戴使用。",
    createdAt: new Date("2026-02-20T09:00:00.000Z"),
    likedBy: ["demo.yuyun@relicvault.app", "demo.silu@relicvault.app"],
  },
  {
    owner: "demo.jinshi@relicvault.app",
    title: "明宣德·铜冲耳三足炉",
    era: "明宣德",
    category: "金属器",
    preservationStatus: "excellent",
    tags: ["宣德炉", "香炉"],
    locationName: "北京",
    lat: 39.9042,
    lng: 116.4074,
    isProtected: false,
    description:
      "皮壳栗壳色，底款「大明宣德年制」楷书。手感压手，铜质精炼，为传世熟坑。",
    createdAt: new Date("2026-03-08T09:00:00.000Z"),
  },
  {
    owner: "demo.hanmo@relicvault.app",
    title: "清乾隆·水墨山水扇面",
    era: "清乾隆",
    category: "书画",
    preservationStatus: "good",
    tags: ["扇面", "水墨"],
    locationName: "江苏·苏州",
    lat: 31.2989,
    lng: 120.6216,
    isProtected: false,
    description:
      "仿元人笔意，墨色层次分明。扇骨后配，画面有轻微折痕与虫蛀小孔。",
    createdAt: new Date("2026-02-08T09:00:00.000Z"),
    likedBy: ["demo.minjian@relicvault.app"],
  },
  {
    owner: "demo.hanmo@relicvault.app",
    title: "明末·行书七言诗轴",
    era: "明末",
    category: "书画",
    preservationStatus: "excellent",
    tags: ["行书", "立轴"],
    locationName: "浙江·绍兴",
    lat: 30.0306,
    lng: 120.5806,
    isProtected: false,
    description:
      "纸本行书，笔势连绵洒脱，为晚明典型浪漫书风。原装旧裱，保存状态难得。",
    createdAt: new Date("2026-03-11T09:00:00.000Z"),
    likedBy: ["demo.qingci@relicvault.app", "demo.jinshi@relicvault.app"],
  },
  {
    owner: "demo.yuyun@relicvault.app",
    title: "新石器·良渚玉琮（小件）",
    era: "新石器",
    category: "玉石",
    preservationStatus: "fair",
    tags: ["良渚", "玉琮"],
    locationName: "浙江·杭州（良渚古城）",
    lat: 30.2741,
    lng: 120.1551,
    isProtected: true,
    description:
      "矮方柱体，四角琢刻神人兽面纹，线条已模糊。边角有土沁与绺裂。",
    createdAt: new Date("2026-02-15T09:00:00.000Z"),
    likedBy: ["demo.hanmo@relicvault.app"],
  },
  {
    owner: "demo.yuyun@relicvault.app",
    title: "清·和田白玉带钩",
    era: "清",
    category: "玉石",
    preservationStatus: "excellent",
    tags: ["和田玉", "带钩"],
    locationName: "新疆·和田",
    lat: 37.1136,
    lng: 79.9221,
    isProtected: false,
    description:
      "玉质细腻油润，带淡淡洒金皮。雕工简洁利落，为清代仿古风格玉带钩。",
    createdAt: new Date("2026-03-05T09:00:00.000Z"),
    likedBy: ["demo.silu@relicvault.app"],
  },
  {
    owner: "demo.silu@relicvault.app",
    title: "唐·联珠对鹿纹锦残片",
    era: "唐",
    category: "织物",
    preservationStatus: "fair",
    tags: ["联珠纹", "锦", "丝路"],
    locationName: "甘肃·敦煌（莫高窟北区）",
    lat: 40.1421,
    lng: 94.6619,
    isProtected: false,
    description:
      "纬锦残片，联珠圈内为对鹿纹，属粟特系统样式。边缘炭化脆化，已做加固。",
    createdAt: new Date("2026-02-18T09:00:00.000Z"),
    likedBy: ["demo.hanmo@relicvault.app", "demo.yuyun@relicvault.app"],
  },
  {
    owner: "demo.silu@relicvault.app",
    title: "明·缂丝花卉册页",
    era: "明",
    category: "织物",
    preservationStatus: "good",
    tags: ["缂丝", "册页"],
    locationName: "江苏·南京",
    lat: 32.0603,
    lng: 118.7969,
    isProtected: false,
    description:
      "通经断纬织就，花色过渡自然，所谓「一寸缂丝一寸金」。册页装裱完整。",
    createdAt: new Date("2026-03-14T09:00:00.000Z"),
    likedBy: ["demo.minjian@relicvault.app"],
  },
  {
    owner: "demo.silu@relicvault.app",
    title: "唐·开元通宝钱串",
    era: "唐",
    category: "金属器",
    preservationStatus: "good",
    tags: ["钱币", "开元通宝"],
    locationName: "陕西·西安",
    lat: 34.3416,
    lng: 108.9398,
    isProtected: false,
    description:
      "四十二枚麻绳穿系，钱文清晰、锈色统一。原坑未清理，保持出土状态。",
    createdAt: new Date("2026-03-18T09:00:00.000Z"),
  },
  {
    owner: "demo.minjian@relicvault.app",
    title: "清末民初·木质雕花饼模",
    era: "清末民初",
    category: "其他",
    preservationStatus: "good",
    tags: ["木雕", "民俗", "模具"],
    locationName: "山东·潍坊",
    lat: 36.7063,
    lng: 119.1615,
    isProtected: false,
    description:
      "枣木刻就，内雕福字与缠枝花纹。是外婆做巧果用的老物件，边角已磨圆。",
    createdAt: new Date("2026-02-22T09:00:00.000Z"),
    likedBy: ["demo.qingci@relicvault.app", "demo.silu@relicvault.app"],
  },
  {
    owner: "demo.minjian@relicvault.app",
    title: "民国·蓝印花布包袱皮",
    era: "民国",
    category: "织物",
    preservationStatus: "good",
    tags: ["蓝印花布", "印染"],
    locationName: "江苏·南通",
    lat: 31.9802,
    lng: 120.8943,
    isProtected: false,
    description:
      "手工刻板刮浆印染，白蓝分明。有一处小补丁，是当年补过的痕迹。",
    createdAt: new Date("2026-03-20T09:00:00.000Z"),
    likedBy: ["demo.hanmo@relicvault.app"],
  },
  {
    owner: "demo.tongxiang@relicvault.app",
    title: "明·铜蚰龙耳炉",
    era: "明",
    category: "金属器",
    preservationStatus: "good",
    tags: ["铜炉", "蚰龙耳", "香器"],
    locationName: "江苏·苏州",
    lat: 31.2989,
    lng: 120.5853,
    isProtected: false,
    description:
      "铜质精炼，皮壳呈蜡茶色，双耳若蚰虫曲转。手感压手，焚香后余韵绵长。",
    createdAt: new Date("2026-04-01T09:00:00.000Z"),
    likedBy: ["demo.qingci@relicvault.app", "demo.silu@relicvault.app"],
  },
  {
    owner: "demo.tongxiang@relicvault.app",
    title: "清·竹雕香筒",
    era: "清",
    category: "其他",
    preservationStatus: "good",
    tags: ["竹雕", "香筒", "文房"],
    locationName: "上海·嘉定",
    lat: 31.374,
    lng: 121.265,
    isProtected: false,
    description:
      "通体深雕山水楼阁，竹肌泛红润。筒口有旧裂，以铜箍加固，仍可用。",
    createdAt: new Date("2026-04-12T09:00:00.000Z"),
  },
  {
    owner: "demo.cixiu@relicvault.app",
    title: "清·苏绣猫蝶图",
    era: "清",
    category: "织物",
    preservationStatus: "good",
    tags: ["苏绣", "猫蝶", "绣片"],
    locationName: "江苏·苏州",
    lat: 31.2989,
    lng: 120.5853,
    isProtected: false,
    description:
      "双面绣，猫睛以一丝劈成多丝晕色，蝶翅薄透。配旧红木镜框。",
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    likedBy: ["demo.hanmo@relicvault.app"],
  },
  {
    owner: "demo.cixiu@relicvault.app",
    title: "民国·顾绣花鸟屏",
    era: "民国",
    category: "织物",
    preservationStatus: "fair",
    tags: ["顾绣", "花鸟", "屏风"],
    locationName: "上海",
    lat: 31.2304,
    lng: 121.4737,
    isProtected: false,
    description:
      "四扇屏之一，绣孔雀牡丹。边绫有潮渍与虫眼，绣面尚完好。",
    createdAt: new Date("2026-04-16T09:00:00.000Z"),
  },
  {
    owner: "demo.qiqi@relicvault.app",
    title: "明·剔红牡丹纹漆盒",
    era: "明",
    category: "其他",
    preservationStatus: "good",
    tags: ["剔红", "漆器", "漆盒"],
    locationName: "北京",
    lat: 39.9042,
    lng: 116.4074,
    isProtected: false,
    description:
      "百层大漆剔刻牡丹，刀口断面见层叠漆色。盒内有旧锦囊，漆面温润。",
    createdAt: new Date("2026-04-07T09:00:00.000Z"),
    likedBy: ["demo.cixiu@relicvault.app"],
  },
  {
    owner: "demo.qiqi@relicvault.app",
    title: "战国·彩绘漆耳杯",
    era: "战国",
    category: "其他",
    preservationStatus: "fair",
    tags: ["漆器", "耳杯", "彩绘"],
    locationName: "湖北·荆州",
    lat: 30.349,
    lng: 112.191,
    isProtected: false,
    description:
      "木胎髹黑漆，内朱绘云气纹。一耳略残，漆色剥落处可见木胎。",
    createdAt: new Date("2026-04-19T09:00:00.000Z"),
  },
  {
    owner: "demo.beiwei@relicvault.app",
    title: "北魏·石门铭拓本",
    era: "北魏",
    category: "书画",
    preservationStatus: "good",
    tags: ["碑帖", "拓片", "石门铭"],
    locationName: "陕西·汉中",
    lat: 33.0677,
    lng: 107.025,
    isProtected: false,
    description:
      "旧捶乌金拓，字口清晰，笔画方峻。纸有自然老化黄斑，托裱平整。",
    createdAt: new Date("2026-04-10T09:00:00.000Z"),
    likedBy: ["demo.jinshi@relicvault.app"],
  },
  {
    owner: "demo.beiwei@relicvault.app",
    title: "汉·曹全碑拓片",
    era: "汉",
    category: "书画",
    preservationStatus: "good",
    tags: ["碑帖", "曹全碑", "拓片"],
    locationName: "陕西·西安",
    lat: 34.3416,
    lng: 108.9398,
    isProtected: false,
    description:
      "秀美隶书，存字完好。淡墨轻拓，便于临习，配旧轴可悬。",
    createdAt: new Date("2026-04-22T09:00:00.000Z"),
  },
  {
    owner: "demo.muyu@relicvault.app",
    title: "明·黄杨木雕罗汉",
    era: "明",
    category: "其他",
    preservationStatus: "good",
    tags: ["黄杨木", "木雕", "罗汉"],
    locationName: "浙江·东阳",
    lat: 29.269,
    lng: 120.229,
    isProtected: false,
    description:
      "黄杨木质密色黄，罗汉开脸慈和，衣纹流转。底座后配，包浆自然。",
    createdAt: new Date("2026-04-13T09:00:00.000Z"),
    likedBy: ["demo.minjian@relicvault.app"],
  },
  {
    owner: "demo.muyu@relicvault.app",
    title: "清·楠木佛龛",
    era: "清",
    category: "其他",
    preservationStatus: "good",
    tags: ["楠木", "佛龛", "木作"],
    locationName: "福建·莆田",
    lat: 25.431,
    lng: 119.006,
    isProtected: false,
    description:
      "楠木雕螭龙小龛，透雕繁复。背光处有小虫眼，整体结构稳当。",
    createdAt: new Date("2026-04-25T09:00:00.000Z"),
  },
  {
    owner: "demo.yinzhang@relicvault.app",
    title: "清·寿山石闲章",
    era: "清",
    category: "其他",
    preservationStatus: "excellent",
    tags: ["寿山石", "印章", "篆刻"],
    locationName: "福建·福州",
    lat: 26.0745,
    lng: 119.2963,
    isProtected: false,
    description:
      "芙蓉石温润如脂，印面刻「闲看庭前花」六字。钮工简洁，石色匀净。",
    createdAt: new Date("2026-04-16T09:00:00.000Z"),
    likedBy: ["demo.beiwei@relicvault.app"],
  },
  {
    owner: "demo.yinzhang@relicvault.app",
    title: "汉·铜套印",
    era: "汉",
    category: "金属器",
    preservationStatus: "good",
    tags: ["铜印", "套印", "印章"],
    locationName: "陕西·西安",
    lat: 34.3416,
    lng: 108.9398,
    isProtected: false,
    description:
      "子母二印相套，母印钮为龟。印文规整，绿锈入骨，是实用官印形制。",
    createdAt: new Date("2026-04-28T09:00:00.000Z"),
  },
];

export interface DemoSocialComment {
  /** 所属文物标题（需在 DEMO_SOCIAL_ARTIFACTS 中存在） */
  artifact: string;
  /** 评论者 email */
  author: string;
  text: string;
  createdAt: Date;
  /** 父评论在 DEMO_SOCIAL_COMMENTS 数组中的下标（用于演示一层嵌套「回复」） */
  replyToIndex?: number;
  /** 点赞该评论的演示账号 email */
  likedBy?: string[];
}

/** 演示评论（含 2 组「回复」嵌套，用于体验评论互动） */
export const DEMO_SOCIAL_COMMENTS: DemoSocialComment[] = [
  {
    artifact: "南宋·龙泉窑青釉双鱼洗",
    author: "demo.jinshi@relicvault.app",
    text: "釉色真漂亮，这是粉青还是梅子青？",
    createdAt: new Date("2026-02-02T10:00:00.000Z"),
    likedBy: ["demo.qingci@relicvault.app"],
  },
  {
    artifact: "南宋·龙泉窑青釉双鱼洗",
    author: "demo.qingci@relicvault.app",
    text: "偏粉青，光线足的时候会泛一点梅子青。",
    createdAt: new Date("2026-02-02T11:00:00.000Z"),
    replyToIndex: 0,
    likedBy: ["demo.jinshi@relicvault.app"],
  },
  {
    artifact: "商晚期·饕餮纹青铜爵",
    author: "demo.hanmo@relicvault.app",
    text: "鋬内的族徽铭文还能看清几个字吗？",
    createdAt: new Date("2026-02-06T10:00:00.000Z"),
  },
  {
    artifact: "唐·联珠对鹿纹锦残片",
    author: "demo.minjian@relicvault.app",
    text: "这种联珠纹在中原织物里很少见。",
    createdAt: new Date("2026-02-19T10:00:00.000Z"),
    likedBy: ["demo.silu@relicvault.app"],
  },
  {
    artifact: "唐·联珠对鹿纹锦残片",
    author: "demo.silu@relicvault.app",
    text: "对，典型的粟特系统纹样，丝路上很流行。",
    createdAt: new Date("2026-02-19T12:00:00.000Z"),
    replyToIndex: 3,
  },
  {
    artifact: "清乾隆·水墨山水扇面",
    author: "demo.yuyun@relicvault.app",
    text: "款识看着像后添的，纸的年份会更早吗？",
    createdAt: new Date("2026-02-09T10:00:00.000Z"),
  },
  {
    artifact: "明宣德·铜冲耳三足炉",
    author: "demo.tongxiang@relicvault.app",
    text: "皮色养得真润，是经常盘的吗？",
    createdAt: new Date("2026-04-02T10:00:00.000Z"),
  },
  {
    artifact: "清乾隆·水墨山水扇面",
    author: "demo.cixiu@relicvault.app",
    text: "这设色淡雅，跟绣品配色是一个路数。",
    createdAt: new Date("2026-04-05T10:00:00.000Z"),
  },
  {
    artifact: "明·缂丝花卉册页",
    author: "demo.qiqi@relicvault.app",
    text: "一寸缂丝一寸金，这配色真静气。",
    createdAt: new Date("2026-04-08T10:00:00.000Z"),
  },
  {
    artifact: "商晚期·饕餮纹青铜爵",
    author: "demo.beiwei@relicvault.app",
    text: "鋬内铭文有兴趣可以捶张拓看看。",
    createdAt: new Date("2026-04-11T10:00:00.000Z"),
  },
  {
    artifact: "清末民初·木质雕花饼模",
    author: "demo.muyu@relicvault.app",
    text: "枣木的吧，纹样是福字缠枝？",
    createdAt: new Date("2026-04-14T10:00:00.000Z"),
  },
  {
    artifact: "战国·错金银铜带钩",
    author: "demo.yinzhang@relicvault.app",
    text: "错金银的丝还这么清楚，难得。",
    createdAt: new Date("2026-04-17T10:00:00.000Z"),
  },
];
