import type { Artifact, Dynasty, Material, PreservationStatus } from "@/lib/types/artifact";

// 常见出土地/遗址坐标（WGS84），供带有定位信息的文物复用。
const GEO = {
  景德镇: { latitude: 29.2922, longitude: 117.1794, locationName: "江西·景德镇（御窑厂遗址）" },
  西安: { latitude: 34.3416, longitude: 108.9398, locationName: "陕西·西安（唐长安城遗址）" },
  洛阳: { latitude: 34.617, longitude: 112.4536, locationName: "河南·洛阳（邙山陵墓群）" },
  北京: { latitude: 39.9042, longitude: 116.4074, locationName: "北京·故宫博物院" },
  南京: { latitude: 32.0603, longitude: 118.7969, locationName: "江苏·南京（明孝陵）" },
  杭州: { latitude: 30.2741, longitude: 120.1551, locationName: "浙江·杭州（南宋临安城）" },
  成都: { latitude: 30.5728, longitude: 104.0668, locationName: "四川·成都（金沙遗址）" },
  敦煌: { latitude: 40.0356, longitude: 94.8091, locationName: "甘肃·敦煌（莫高窟）" },
  三星堆: { latitude: 30.9686, longitude: 104.199, locationName: "四川·广汉（三星堆遗址）" },
  殷墟: { latitude: 36.126, longitude: 114.391, locationName: "河南·安阳（殷墟）" },
  良渚: { latitude: 30.3975, longitude: 119.966, locationName: "浙江·杭州（良渚古城遗址）" },
  马王堆: { latitude: 28.2146, longitude: 112.9389, locationName: "湖南·长沙（马王堆汉墓）" },
  苏州: { latitude: 31.2989, longitude: 120.5853, locationName: "江苏·苏州（云岩寺塔）" },
  广州: { latitude: 23.1291, longitude: 113.2644, locationName: "广东·广州（南越王墓）" },
  曲阜: { latitude: 35.5789, longitude: 117.01, locationName: "山东·曲阜（孔庙）" },
  大同: { latitude: 40.1106, longitude: 113.1305, locationName: "山西·大同（云冈石窟）" },
  开封: { latitude: 34.7973, longitude: 114.3074, locationName: "河南·开封（北宋东京城）" },
  扬州: { latitude: 32.3941, longitude: 119.4129, locationName: "江苏·扬州（唐城遗址）" },
  泉州: { latitude: 24.8741, longitude: 118.6757, locationName: "福建·泉州（宋元港市）" },
  沈阳: { latitude: 41.8057, longitude: 123.4315, locationName: "辽宁·沈阳（清盛京故宫）" },
} as const;

type GeoKey = keyof typeof GEO;

type RawArtifact = {
  id: string;
  title: string;
  era: string;
  dynasty: Dynasty;
  category: Material;
  preservationStatus: PreservationStatus;
  tags: string[];
  description: string;
  imgSeed: string;
  /** 图片高度，制造瀑布流高低错落 */
  imgH: number;
  likes: number;
  geo?: GeoKey;
};

const RAW: RawArtifact[] = [
  {
    id: "a001", title: "青花缠枝莲纹赏瓶", era: "清乾隆", dynasty: "清", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "瓷器", "官窑"],
    description: "撇口长颈，通体青花装饰，腹部缠枝莲纹饱满流畅，底书青花六字篆款。釉面温润，为景德镇御窑典型陈设用瓷。",
    imgSeed: "qinghua-vase", imgH: 820, likes: 312, geo: "景德镇",
  },
  {
    id: "a002", title: "唐三彩骆驼载乐俑", era: "唐", dynasty: "唐", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["唐三彩", "陶俑", "丝路"],
    description: "黄、绿、白三彩釉色交融，骆驼昂首引颈，背部的胡乐俑生动再现盛唐丝路乐舞场景。左后腿有磕缺修复痕迹。",
    imgSeed: "sancai-camel", imgH: 760, likes: 421, geo: "西安",
  },
  {
    id: "a003", title: "良渚玉琮王", era: "新石器·良渚", dynasty: "其他", category: "玉石",
    preservationStatus: "Intact", tags: ["玉璧", "礼器", "良渚"],
    description: "外方内圆，四面以浅浮雕神人兽面纹装饰，刻线细如发丝，是史前玉作工艺的巅峰之作。",
    imgSeed: "liangzhu-cong", imgH: 640, likes: 503, geo: "良渚",
  },
  {
    id: "a004", title: "曾侯乙编钟（复原件）", era: "战国", dynasty: "其他", category: "金属器",
    preservationStatus: "Ruin", tags: ["青铜器", "礼乐", "青铜"],
    description: "青铜铸制，全套六十五件，一钟双音，音域宽广。原件出土时多已破碎，此为依原貌复原陈列之构件。",
    imgSeed: "bianzhong", imgH: 700, likes: 287, geo: "殷墟",
  },
  {
    id: "a005", title: "北宋汝窑天青釉洗", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青瓷", "汝窑", "文人雅器"],
    description: "釉色天青，开片如蝉翼，裹足支烧，香灰胎。存世稀少，为宋瓷素雅美学之代表。",
    imgSeed: "ruyao-xi", imgH: 560, likes: 388, geo: "开封",
  },
  {
    id: "a006", title: "明永乐青花压手杯", era: "明永乐", dynasty: "明", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "官窑", "饮茶器"],
    description: "撇口弧腹，握之妥帖，故称压手杯。青花发色浓艳带铁锈斑，为永乐甜白与青花并行期的名品。",
    imgSeed: "yashou-bei", imgH: 520, likes: 199, geo: "景德镇",
  },
  {
    id: "a007", title: "马王堆 T 形帛画", era: "西汉", dynasty: "其他", category: "书画",
    preservationStatus: "Severe Degradation", tags: ["帛画", "神话", "墓葬"],
    description: "覆盖于棺盖之上的 T 形绢帛，绘天上、人间、地府三界，设色浓重，是了解汉代宇宙观的珍稀图像。",
    imgSeed: "bohua", imgH: 900, likes: 256, geo: "马王堆",
  },
  {
    id: "a008", title: "三星堆青铜立人像", era: "商", dynasty: "其他", category: "金属器",
    preservationStatus: "Minor Damage", tags: ["青铜器", "祭祀", "古蜀"],
    description: "高冠长袍，双手环握中空，赤足立于座。造型奇崛，展现了与中原迥异的古蜀文明祭祀体系。",
    imgSeed: "bronze-figure", imgH: 820, likes: 467, geo: "三星堆",
  },
  {
    id: "a009", title: "隋代白瓷龙柄双联瓶", era: "隋", dynasty: "其他", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["白瓷", "北方窑", "实用器"],
    description: "两瓶相连，肩部塑龙形柄，胎质细白，是北方白瓷由青瓷体系中独立成系的重要实证。",
    imgSeed: "white-ping", imgH: 600, likes: 142, geo: "洛阳",
  },
  {
    id: "a010", title: "元代青花鬼谷子下山图罐", era: "元", dynasty: "元", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "人物故事", "外销瓷"],
    description: "腹部通景绘鬼谷子下山故事，构图繁密，发色幽蓝，是元青花人物罐中的传世名品。",
    imgSeed: "guiguzi", imgH: 700, likes: 354, geo: "景德镇",
  },
  {
    id: "a011", title: "明清缂丝牡丹团扇", era: "清", dynasty: "清", category: "织物",
    preservationStatus: "Minor Damage", tags: ["缂丝", "织锦", "闺阁"],
    description: "以通经断纬之法缂织牡丹，色丝细润，边角略有虫蛀。为江南织造进奉内廷之物。",
    imgSeed: "kesi-fan", imgH: 640, likes: 176, geo: "苏州",
  },
  {
    id: "a012", title: "汉代错金银博山炉", era: "汉", dynasty: "其他", category: "金属器",
    preservationStatus: "Intact", tags: ["金银错", "香具", "青铜器"],
    description: "炉盖镂雕成群山云气，通体错金银云气纹，焚香时烟气缭绕如仙山。工艺繁复至极。",
    imgSeed: "boshan-lu", imgH: 600, likes: 221, geo: "广州",
  },
  {
    id: "a013", title: "唐鎏金舞马衔杯银壶", era: "唐", dynasty: "唐", category: "金属器",
    preservationStatus: "Intact", tags: ["金银器", "鎏金", "马具"],
    description: "仿皮囊形银壶，壶身舞马衔杯捶揲成形，通体鎏金。印证了史载玄宗朝舞马祝寿之盛仪。",
    imgSeed: "silver-hu", imgH: 560, likes: 298, geo: "西安",
  },
  {
    id: "a014", title: "敦煌莫高窟飞天壁画（摹本）", era: "盛唐", dynasty: "唐", category: "书画",
    preservationStatus: "Severe Degradation", tags: ["壁画", "飞天", "佛教"],
    description: "摹自第 320 窟双飞天，衣带当风，线条流畅。原壁已有剥落，摹本忠实保留了赋彩与动势。",
    imgSeed: "feitian", imgH: 880, likes: 333, geo: "敦煌",
  },
  {
    id: "a015", title: "良渚玉璧", era: "新石器·良渚", dynasty: "其他", category: "玉石",
    preservationStatus: "Intact", tags: ["玉璧", "礼器", "良渚"],
    description: "素面大型玉璧，孔径规整，磨制光亮，是良渚文化中权力与祭祀的象征物。",
    imgSeed: "yubi", imgH: 520, likes: 187, geo: "良渚",
  },
  {
    id: "a016", title: "宋代钧窑玫瑰紫釉花盆", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["钧窑", "窑变", "陈设"],
    description: "釉色以玫瑰紫为主，间杂天蓝窑变，底部有数字款。釉面一处细裂已做专业加固。",
    imgSeed: "jun-pen", imgH: 620, likes: 209, geo: "开封",
  },
  {
    id: "a017", title: "明万历五彩人物盖罐", era: "明万历", dynasty: "明", category: "陶瓷器",
    preservationStatus: "Ruin", tags: ["五彩", "民窑", "人物"],
    description: "釉上红绿黄彩绘婴戏图，色彩浓烈。罐盖早年缺失，罐身釉彩亦有剥落，仍具典型万历风貌。",
    imgSeed: "wucai-guan", imgH: 700, likes: 134, geo: "景德镇",
  },
  {
    id: "a018", title: "战国谷纹玉璧", era: "战国", dynasty: "其他", category: "玉石",
    preservationStatus: "Intact", tags: ["玉器", "礼器", "谷纹"],
    description: "璧面满布去地浅浮雕谷纹，排列有序，琢工刚劲，为战国玉礼器标准器。",
    imgSeed: "guwen-bi", imgH: 540, likes: 156, geo: "殷墟",
  },
  {
    id: "a019", title: "清代翠玉白菜（仿件）", era: "清", dynasty: "清", category: "玉石",
    preservationStatus: "Intact", tags: ["玉器", "陈设", "写实"],
    description: "以整块翡翠雕成白菜，菜叶翻卷、虫蚀逼真，寓意清白。此为院藏名件的公开展示仿制。",
    imgSeed: "baicai", imgH: 660, likes: 412, geo: "北京",
  },
  {
    id: "a020", title: "唐长沙窑青釉褐绿彩执壶", era: "唐", dynasty: "唐", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青瓷", "外销瓷", "诗文"],
    description: "长沙窑典型外销器物，壶身以褐绿彩书诗句或绘山水，是唐代商业瓷与市民审美的缩影。",
    imgSeed: "changsha-hu", imgH: 640, likes: 121, geo: "扬州",
  },
  {
    id: "a021", title: "汉代玉蝉（含蝉）", era: "汉", dynasty: "其他", category: "玉石",
    preservationStatus: "Intact", tags: ["玉器", "丧葬", "谐音"],
    description: "以“蝉蜕于浊秽”之意置于逝者口中，阴线刻翅脉简练有力，是汉代玉殓葬的惯用器。",
    imgSeed: "yu-chan", imgH: 480, likes: 98, geo: "广州",
  },
  {
    id: "a022", title: "北宋磁州窑白地黑花牡丹纹梅瓶", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["磁州窑", "民窑", "黑白花"],
    description: "白化妆土上以黑彩绘折枝牡丹，笔意豪放。瓶口微磕，整体气韵生动，为北方民窑代表。",
    imgSeed: "cizhou-meiping", imgH: 760, likes: 178, geo: "开封",
  },
  {
    id: "a023", title: "明万历金丝翼善冠", era: "明", dynasty: "明", category: "金属器",
    preservationStatus: "Intact", tags: ["金银器", "冠服", "皇家"],
    description: "细金丝编织成二龙戏珠，工艺极尽精巧，为明代帝王常服冠，象征至高的织金技艺。",
    imgSeed: "jinsi-guan", imgH: 540, likes: 263, geo: "北京",
  },
  {
    id: "a024", title: "清乾隆粉彩百花不落地葫芦瓶", era: "清乾隆", dynasty: "清", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["粉彩", "官窑", "吉祥"],
    description: "通体绘各色花卉，密不露地，寓意百花呈瑞。粉彩柔润，为乾隆繁缛华美风格之代表。",
    imgSeed: "fenhua-ping", imgH: 720, likes: 301, geo: "景德镇",
  },
  {
    id: "a025", title: "殷墟甲骨卜辞（拓片）", era: "商", dynasty: "其他", category: "其他",
    preservationStatus: "Severe Degradation", tags: ["甲骨", "文字", "占卜"],
    description: "龟甲刻辞记录农事与祭祀占卜，是已知最早成系统的汉字实物。原甲风化严重，赖以拓片传世。",
    imgSeed: "jiagu", imgH: 600, likes: 244, geo: "殷墟",
  },
  {
    id: "a026", title: "元龙泉窑青瓷划花碗", era: "元", dynasty: "元", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青瓷", "龙泉", "素雅"],
    description: "釉色粉青肥厚，内壁划缠枝莲，圈足露胎处火石红自然。为外销与内用并重的龙泉名品。",
    imgSeed: "longquan-wan", imgH: 500, likes: 112, geo: "泉州",
  },
  {
    id: "a027", title: "唐鎏金银香囊", era: "唐", dynasty: "唐", category: "金属器",
    preservationStatus: "Intact", tags: ["金银器", "香具", "机关"],
    description: "球内以同心圆机环保持香盂水平，无论怎样转动香料不洒，是唐代小机械的杰作。",
    imgSeed: "silver-xiangnang", imgH: 520, likes: 207, geo: "西安",
  },
  {
    id: "a028", title: "北宋李公麟《五马图》摹本", era: "北宋", dynasty: "宋", category: "书画",
    preservationStatus: "Minor Damage", tags: ["白描", "名画", "鞍马"],
    description: "白描画五匹贡马及圉人，线条遒劲。现存为后世摹本，卷尾有乾隆题跋，边缘略有霉斑。",
    imgSeed: "wuma", imgH: 940, likes: 289, geo: "开封",
  },
  {
    id: "a029", title: "清掐丝珐琅缠枝莲纹香炉", era: "清", dynasty: "清", category: "金属器",
    preservationStatus: "Intact", tags: ["景泰蓝", "珐琅", "陈设"],
    description: "铜胎掐丝填珐琅，缠枝莲纹繁密规整，釉色明润，为宫廷御用香具之属。",
    imgSeed: "cloisonne-lu", imgH: 580, likes: 168, geo: "北京",
  },
  {
    id: "a030", title: "汉代陶说唱俑", era: "汉", dynasty: "其他", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["陶俑", "百戏", "俳优"],
    description: "俳优袒胸蹋坐，击鼓说唱，表情滑稽夸张，是汉代市井百戏与底层生活的生动写照。",
    imgSeed: "shuochang-yong", imgH: 680, likes: 233, geo: "成都",
  },
  {
    id: "a031", title: "明宣德青花海水龙纹罐", era: "明宣德", dynasty: "明", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "官窑", "龙纹"],
    description: "苏麻离青料发色浓艳晕散，海水江崖与行龙矫健。为宣青代表器，底有六字楷款。",
    imgSeed: "xuande-long", imgH: 700, likes: 276, geo: "景德镇",
  },
  {
    id: "a032", title: "清雍正斗彩缠枝花卉碗", era: "清雍正", dynasty: "清", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["斗彩", "官窑", "雅致"],
    description: "釉下青花与釉上彩相斗成纹，设色淡雅，层次分明，体现雍正御窑的文气与精工。",
    imgSeed: "doucai-wan", imgH: 520, likes: 154, geo: "景德镇",
  },
  {
    id: "a033", title: "战国错金鄂君启节", era: "战国", dynasty: "其他", category: "金属器",
    preservationStatus: "Intact", tags: ["青铜器", "符节", "铭文"],
    description: "青铜错金铭文，为楚国水陆通关符节，记载舟车通行规定，是珍贵的经济交通史物证。",
    imgSeed: "ejie", imgH: 540, likes: 119, geo: "殷墟",
  },
  {
    id: "a034", title: "唐《灵飞经》写经残卷", era: "唐", dynasty: "唐", category: "书画",
    preservationStatus: "Ruin", tags: ["写经", "小楷", "敦煌"],
    description: "墨书小楷精整秀美，为唐代写经代表作。残卷存数行，纸面有虫蛀与水渍。",
    imgSeed: "lingfeijing", imgH: 820, likes: 173, geo: "敦煌",
  },
  {
    id: "a035", title: "宋建窑兔毫盏", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["黑釉", "建窑", "茶器"],
    description: "束口深腹，内壁兔毫纹丝丝垂流，是宋代斗茶所用建盏之典型，胎厚宜保温。",
    imgSeed: "tuhao-zhan", imgH: 500, likes: 196, geo: "泉州",
  },
  {
    id: "a036", title: "清道光珊瑚红地描金喜字盖碗", era: "清道光", dynasty: "清", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["珊瑚红", "描金", "婚庆"],
    description: "珊瑚红地描金双喜字，为宫廷婚庆用瓷。盖钮一处金彩磨损，余皆完好。",
    imgSeed: "shanhuhong", imgH: 560, likes: 108, geo: "北京",
  },
  {
    id: "a037", title: "汉玉具剑饰（四件组）", era: "汉", dynasty: "其他", category: "玉石",
    preservationStatus: "Intact", tags: ["玉器", "剑饰", "高浮雕"],
    description: "含剑首、格、璏、珌四件，谷纹与兽面高浮雕，玉质温润，为汉代玉具剑之完整一套。",
    imgSeed: "jian-shi", imgH: 520, likes: 141, geo: "广州",
  },
  {
    id: "a038", title: "元青花萧何月下追韩信梅瓶", era: "元", dynasty: "元", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "人物故事", "梅瓶"],
    description: "腹部绘“萧何月下追韩信”故事，人物生动、布局疏密有致，为元青花人物梅瓶的传世孤品级。",
    imgSeed: "xiaomei-ping", imgH: 780, likes: 342, geo: "景德镇",
  },
  {
    id: "a039", title: "明剔红牡丹纹漆盒", era: "明", dynasty: "明", category: "其他",
    preservationStatus: "Intact", tags: ["雕漆", "剔红", "文房"],
    description: "多层朱漆雕剔牡丹，刀工圆熟，锦地细密，是明代果园厂剔红漆器的典范。",
    imgSeed: "tihong-he", imgH: 520, likes: 127, geo: "北京",
  },
  {
    id: "a040", title: "北魏云冈石窟佛龛造像（拓影）", era: "北魏", dynasty: "其他", category: "其他",
    preservationStatus: "Severe Degradation", tags: ["佛像", "石窟", "佛教"],
    description: "云冈中期佛龛拓影，褒衣博带，秀骨清像。原窟风化严重，拓影存其仪轨。",
    imgSeed: "yungang", imgH: 860, likes: 215, geo: "大同",
  },
  {
    id: "a041", title: "清乾隆田黄三联玺", era: "清乾隆", dynasty: "清", category: "玉石",
    preservationStatus: "Intact", tags: ["田黄", "印章", "御用"],
    description: "三枚田黄以石链相连，印文为乾隆御题，温润凝脂，乃宫廷玺印中的至宝。",
    imgSeed: "tianhuang", imgH: 480, likes: 268, geo: "北京",
  },
  {
    id: "a042", title: "唐蓝釉陶驴", era: "唐", dynasty: "唐", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["三彩", "低温釉", "动物"],
    description: "通体施蓝釉，低头负重，憨态可掬。蓝釉罕见，为唐代低温铅釉中的名贵色种。耳部有细补。",
    imgSeed: "lan-you-lv", imgH: 560, likes: 162, geo: "西安",
  },
  {
    id: "a043", title: "宋汝窑天蓝釉刻花鹅颈瓶", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["汝窑", "青瓷", "陈设"],
    description: "天蓝釉色幽静，瓶身刻莲瓣，线条含蓄。汝窑传世稀少，刻花器更为难得。",
    imgSeed: "ruyao-ping", imgH: 640, likes: 201, geo: "开封",
  },
  {
    id: "a044", title: "汉铜奔马（马踏飞燕）", era: "汉", dynasty: "其他", category: "金属器",
    preservationStatus: "Intact", tags: ["青铜器", "雕塑", "骏马"],
    description: "一足踏飞鸟，三足腾空，重心巧妙，是汉代青铜铸造与写实造型的巅峰。",
    imgSeed: "benma", imgH: 620, likes: 436, geo: "西安",
  },
  {
    id: "a045", title: "清缂丝加绣屏风《三国演义》", era: "清", dynasty: "清", category: "织物",
    preservationStatus: "Severe Degradation", tags: ["缂丝", "刺绣", "故事"],
    description: "以缂丝为地、加绣人物，分段表现三国故事。局部丝线脆化脱落，仍见昔日煌煌气派。",
    imgSeed: "kesi-sanguo", imgH: 900, likes: 134, geo: "苏州",
  },
  {
    id: "a046", title: "宋耀州窑青瓷刻花倒流壶", era: "北宋", dynasty: "宋", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青瓷", "耀州", "巧思"],
    description: "壶无壶口，酒自底部注水，构思奇巧；腹部刻缠枝牡丹，刀锋犀利，釉色青绿。",
    imgSeed: "yaozhou-hu", imgH: 600, likes: 158, geo: "西安",
  },
  {
    id: "a047", title: "明黄花梨四出头官帽椅", era: "明", dynasty: "明", category: "其他",
    preservationStatus: "Intact", tags: ["家具", "硬木", "明式"],
    description: "黄花梨木制，线条简练流畅，搭脑与扶手出头如官帽，是明式家具素工之代表。",
    imgSeed: "guanmaoyi", imgH: 760, likes: 188, geo: "北京",
  },
  {
    id: "a048", title: "清乾隆各类宝石盆景", era: "清乾隆", dynasty: "清", category: "其他",
    preservationStatus: "Minor Damage", tags: ["盆景", "宝石", "陈设"],
    description: "以碧玉、玛瑙、珊瑚等雕琢花果，植于掐丝珐琅盆中，极尽奢华。一两片玉叶有断粘。",
    imgSeed: "baoshi-penjing", imgH: 700, likes: 146, geo: "北京",
  },
  {
    id: "a049", title: "唐鎏金铁芯铜龙", era: "唐", dynasty: "唐", category: "金属器",
    preservationStatus: "Intact", tags: ["鎏金", "铜雕", "祥瑞"],
    description: "铁为芯、铜为体、通体鎏金，龙身蜿蜒腾跃，是盛唐金属圆雕的豪放之作。",
    imgSeed: "tong-long", imgH: 640, likes: 231, geo: "西安",
  },
  {
    id: "a050", title: "宋苏轼《黄州寒食帖》摹本", era: "北宋", dynasty: "宋", category: "书画",
    preservationStatus: "Intact", tags: ["行书", "名帖", "文人"],
    description: "苏轼被贬黄州所书，字势欹侧，情感沉郁，被誉为“天下第三行书”。此为精摹本。",
    imgSeed: "hanshi-tie", imgH: 920, likes: 312, geo: "开封",
  },
  {
    id: "a051", title: "清康熙青花十二月花卉杯（一组）", era: "清康熙", dynasty: "清", category: "陶瓷器",
    preservationStatus: "Intact", tags: ["青花瓷", "官窑", "诗意"],
    description: "十二只杯各绘一月令花卉并题诗句，青花分水层次清润，为康熙文人瓷酒具雅品。",
    imgSeed: "shierhua-bei", imgH: 560, likes: 173, geo: "景德镇",
  },
  {
    id: "a052", title: "良渚嵌玉冠状饰", era: "新石器·良渚", dynasty: "其他", category: "玉石",
    preservationStatus: "Minor Damage", tags: ["玉器", "冠状饰", "良渚"],
    description: "半圆形玉饰，正面雕神人兽面，背有隧孔可缀于冠。一侧边角有旧裂，已做稳定处理。",
    imgSeed: "guanzhuang", imgH: 500, likes: 102, geo: "良渚",
  },
  {
    id: "a053", title: "元釉里红缠枝牡丹纹罐", era: "元", dynasty: "元", category: "陶瓷器",
    preservationStatus: "Ruin", tags: ["釉里红", "高温釉下", "陈设"],
    description: "以铜红料绘缠枝牡丹，发色晕散斑驳，烧成极难。罐口残缺，难得一见其朱红韵味。",
    imgSeed: "youlihong", imgH: 700, likes: 119, geo: "景德镇",
  },
  {
    id: "a054", title: "汉错金银云纹犀尊", era: "汉", dynasty: "其他", category: "金属器",
    preservationStatus: "Intact", tags: ["金银错", "青铜", "写实"],
    description: "仿犀牛造型盛酒器，通体错金银流云纹，肌理毕现，是汉代写实青铜的代表作。",
    imgSeed: "xi-zun", imgH: 600, likes: 205, geo: "广州",
  },
  {
    id: "a055", title: "清沈振麟《百喜图》", era: "清", dynasty: "清", category: "书画",
    preservationStatus: "Intact", tags: ["工笔", "吉祥", "宫廷绘画"],
    description: "以百态“喜”字与花鸟组成长卷，设色明丽，为内廷节庆所用工笔吉庆画。",
    imgSeed: "baixi-tu", imgH: 880, likes: 167, geo: "北京",
  },
  {
    id: "a056", title: "唐三彩载乐骆驼（单驼）", era: "唐", dynasty: "唐", category: "陶瓷器",
    preservationStatus: "Minor Damage", tags: ["唐三彩", "陶俑", "丝路"],
    description: "骆驼引颈嘶鸣，仰首长啸，釉色流淌自然。前肢一处釉面磨蚀，不失盛唐气象。",
    imgSeed: "sancai-luotuo2", imgH: 740, likes: 198, geo: "西安",
  },
];

const BASE_TIME = Date.UTC(2026, 7, 19, 12, 0, 0); // 2026-08-19 最新

export const ARTIFACT_SEED: Artifact[] = RAW.map((r, i) => {
  const geo = r.geo ? GEO[r.geo] : undefined;
  const { geo: _g, imgSeed, imgH, ...rest } = r;
  return {
    ...rest,
    imageUrl: `https://picsum.photos/seed/${imgSeed}/600/${imgH}`,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
    locationName: geo?.locationName,
    // 按数组顺序递减，保证“最新”排序稳定且确定
    createdAt: new Date(BASE_TIME - i * 1000 * 60 * 60 * 19).toISOString(),
    favorites: 0,
    comments: [],
    likedByMe: false,
    favoritedByMe: false,
  };
});

/** 默认按最新时间排序，返回前 50 条（与探索页“加载前 50 条”约束一致） */
export function getLatestArtifacts(limit = 50): Artifact[] {
  return [...ARTIFACT_SEED]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}
