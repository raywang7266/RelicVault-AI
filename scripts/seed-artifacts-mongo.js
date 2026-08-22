// 将 ~12 件示范文物灌入本地 MongoDB（relicvault 库）。
// 取代旧的 Supabase 种子脚本。幂等：若 curator 已拥有文物则跳过。
//
// 运行（在仓库根目录）：
//   node scripts/seed-artifacts-mongo.js
//
// 说明：
//   - 复刻原 Supabase 种子中的 12 件文物，字段名对齐 Mongoose 模型
//     （title / description / imageUrl / aiTags / manualTags / era / category /
//      locationName / preservationStatus / exactLat / exactLng / isProtected / userId）
//   - 自动模糊 hook 在 pre('save') 内执行：普通文物 blurred 保留 2 位小数，
//     受保护文物（isProtected=true）保留 1 位小数。
//   - curator 账号密码哈希使用 bcryptjs。登录凭据打印在末尾。

const fs = require("fs");
const path = require("path");

// ---- 读取 .env.local，取出 MONGODB_URI ----
const envPath = path.join(__dirname, "..", ".env.local");
const envRaw = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envRaw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const MONGODB_URI = env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ---- 内联 Schema（含自动模糊 hook，确保落库前脱敏）----
const PRESERVATION_VALUES = [
  "excellent",
  "good",
  "fair",
  "poor",
  "critical",
  "unknown",
];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, sparse: true, index: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    githubId: { type: String, default: null, sparse: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const artifactSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    aiTags: { type: [String], default: [] },
    manualTags: { type: [String], default: [] },
    era: { type: String, default: "" },
    category: { type: String, default: "" },
    locationName: { type: String, default: "" },
    preservationStatus: {
      type: String,
      enum: PRESERVATION_VALUES,
      default: "unknown",
    },
    exactLat: { type: Number, default: null },
    exactLng: { type: Number, default: null },
    blurredLat: { type: Number, default: null },
    blurredLng: { type: Number, default: null },
    isProtected: { type: Boolean, default: false },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

artifactSchema.pre("save", async function () {
  const doc = this;
  if (
    typeof doc.exactLat === "number" &&
    typeof doc.exactLng === "number" &&
    Number.isFinite(doc.exactLat) &&
    Number.isFinite(doc.exactLng)
  ) {
    const decimals = doc.isProtected ? 1 : 2;
    const factor = Math.pow(10, decimals);
    doc.blurredLat = Math.round(doc.exactLat * factor) / factor;
    doc.blurredLng = Math.round(doc.exactLng * factor) / factor;
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Artifact =
  mongoose.models.Artifact || mongoose.model("Artifact", artifactSchema);

const CURATOR = {
  email: "curator@relicvault.app",
  username: "relicvault_curator",
  displayName: "RelicVault 文库",
  bio: "由 RelicVault 团队维护的示范文物收藏，用于展示众包数字典藏能力。",
  password: "RelicVault@2026",
};

const ARTIFACTS = [
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
  },
];

async function getOrCreateCurator() {
  let user = await User.findOne({ email: CURATOR.email }).lean();
  if (!user) {
    const passwordHash = await bcrypt.hash(CURATOR.password, 10);
    user = await User.create({
      username: CURATOR.username,
      displayName: CURATOR.displayName,
      email: CURATOR.email,
      password: passwordHash,
      role: "user",
      bio: CURATOR.bio,
      avatarUrl: "",
      githubId: null,
    });
    console.log("Created curator:", user._id);
  } else {
    console.log("Curator already exists:", user._id);
  }
  return user._id.toString();
}

async function main() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
  console.log("Connected to MongoDB:", MONGODB_URI);

  const userId = await getOrCreateCurator();

  const existing = await Artifact.countDocuments({ userId });
  if (existing > 0) {
    console.log(
      `Curator already has ${existing} artifacts — skipping seed.`
    );
    return;
  }

  const docs = ARTIFACTS.map((a) => ({
    title: a.title,
    description: a.description,
    imageUrl: `https://picsum.photos/seed/${encodeURIComponent(a.title)}/600/800`,
    aiTags: [],
    manualTags: a.tags || [],
    era: a.era,
    category: a.category,
    locationName: a.locationName,
    preservationStatus: a.preservationStatus,
    exactLat: a.lat ?? null,
    exactLng: a.lng ?? null,
    isProtected: !!a.isProtected,
    userId,
  }));

  // 使用 .save() 以便触发 pre('save') 自动模糊 hook
  let inserted = 0;
  for (const d of docs) {
    const doc = new Artifact(d);
    await doc.save();
    inserted++;
    console.log(
      `  + ${d.title}  [${d.isProtected ? "protected→1位" : "普通→2位"}] ` +
        `blurred=(${doc.blurredLat}, ${doc.blurredLng})`
    );
  }
  console.log(`\nSeeded ${inserted} artifacts.`);
  console.log("------------------------------------------------------");
  console.log(" curator 登录凭据（本地演示账号）：");
  console.log(`   username : ${CURATOR.username}`);
  console.log(`   password : ${CURATOR.password}`);
  console.log("------------------------------------------------------");
}

main()
  .then(() => mongoose.disconnect().then(() => process.exit(0)))
  .catch((e) => {
    console.error("SEED FAILED:", e.message);
    process.exit(1);
  });
