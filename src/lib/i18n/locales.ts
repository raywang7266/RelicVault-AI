/**
 * 多语言字典（i18n）。
 *
 * 仅收录「网站结构与界面」相关文案。以下类别 **不属于** 翻译范围，保持原样：
 *  - 用户上传的文物档案内容：标题 / 年代 / 门类 / 标签 / 描述 / 出土地 / 评论正文 / 作者名
 *  - 用户资料：昵称 / 个人简介
 *  - 领域分类取值 **作为数据/查询 key 时** 保持原样（唐/宋/陶瓷器/完整…），
 *    否则会破坏过滤逻辑；但 **展示层** 通过 `opt.*` 系列 key 提供三语翻译
 *    （切换语言时筛选下拉、卡片、详情页的分类标签随之切换）。
 *  - 示例文物（SAMPLE_DATA）的标题与描述（属演示内容，保持中文原貌）
 */

export type Locale = "zh-CN" | "zh-TW" | "en";

export const LOCALES: Locale[] = ["zh-CN", "zh-TW", "en"];

export const DEFAULT_LOCALE: Locale = "zh-CN";

/** 各语言在切换器中的展示名 */
export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
};

/** 各语言对应的 <html lang> 属性 */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
};

type Dict = Record<string, string>;

const zhCN: Dict = {
  // ---------- 通用 ----------
  "common.unknownUser": "未知用户",
  "common.loading": "加载中…",
  "common.close": "关闭",
  "common.cancel": "取消",
  "common.save": "保存",
  "common.saving": "保存中…",
  "common.clear": "清空",
  "common.retry": "请稍后重试",
  "common.all": "全部",
  "common.other": "其他",

  // ---------- 通知 ----------
  "notif.bell": "通知",
  "notif.title": "通知",
  "notif.empty": "还没有新通知",
  "notif.postedArtifact": "{name} 发布了新文物《{title}》",
  "notif.commented": "{name} 评论了《{title}》",
  "notif.replied": "{name} 回复了你在《{title}》中的评论",
  "notif.followed": "{name} 关注了你",

  // ---------- 社交 ----------
  "social.loginToFollow": "登录后即可关注",
  "social.followFailed": "关注操作失败，请重试",
  "social.userNotFound": "用户不存在",
  "social.curator": "官方策展人",
  "social.followers": "粉丝",
  "social.following": "关注",
  "social.artifacts": "藏品",
  "social.thisIsYou": "这是你",
  "social.follow": "关注",
  "social.uploadsOf": "{name} 的藏品",
  "social.noUploads": "TA 还没有上传文物",

  // ---------- 关注 / 粉丝列表 ----------
  "connections.title": "关注与粉丝",
  "connections.following": "关注",
  "connections.followers": "粉丝",
  "connections.backToProfile": "返回主页",
  "connections.searchPlaceholder": "搜索用户",
  "connections.emptyFollowing": "还没有关注任何人",
  "connections.emptyFollowers": "还没有粉丝",
  "connections.privateFollowing": "TA 未公开关注列表",
  "connections.privateFollowers": "TA 未公开粉丝列表",
  "connections.privateHint": "对方已设置隐私，仅本人可见",
  "connections.notFound": "用户不存在",
  "connections.mutual": "互相关注",
  "connections.followsYou": "关注了你",
  "connections.you": "你",
  "connections.viewProfile": "查看主页",
  "connections.artifacts": "{n} 件藏品",
  "connections.loadMore": "加载更多",
  "connections.privacyTitle": "隐私设置",
  "connections.privacyShowFollowing": "公开我的关注列表",
  "connections.privacyShowFollowers": "公开我的粉丝列表",
  "connections.privacyHint": "关闭后，他人将无法查看你的关注 / 粉丝列表（你自己始终可看）。",
  "connections.privacySaved": "隐私设置已保存",

  // ---------- 领域分类（展示层三语；value 仍为原始枚举）----------
  "opt.其他": "其他",
  "opt.唐": "唐",
  "opt.宋": "宋",
  "opt.元": "元",
  "opt.明": "明",
  "opt.清": "清",
  "opt.陶瓷器": "陶瓷器",
  "opt.金属器": "金属器",
  "opt.玉石": "玉石",
  "opt.书画": "书画",
  "opt.织物": "织物",
  "opt.完整": "完整",
  "opt.微损": "微损",
  "opt.残损": "残损",

  // ---------- 导航栏 ----------
  "nav.upload": "上传",
  "nav.explore": "探索",
  "nav.profile": "个人中心",
  "nav.login": "登录",
  "nav.logout": "退出登录",
  "nav.loggingOut": "退出中…",

  // ---------- 页脚 ----------
  "footer.tagline": "众包数字遗产与民间文物博物馆",
  "footer.explore": "探索",
  "footer.about": "关于",
  "footer.aboutText": "RelicVault AI 用人工智能助力每一个人记录、鉴定与传承身边的民间文物。",

  // ---------- 语言切换 ----------
  "lang.label": "语言",

  // ---------- 字号调节（无障碍） ----------
  "a11y.fontSize": "字号",
  "a11y.fontSize.small": "小",
  "a11y.fontSize.default": "标准",
  "a11y.fontSize.large": "大",
  "a11y.fontSize.xl": "特大",
  "a11y.fontSize.xxl": "超大",
  "a11y.fontSize.xxxl": "极大",
  "a11y.theme": "主题",
  "a11y.theme.dark": "夜间",
  "a11y.theme.light": "白天",

  // ---------- 浮窗小助手 ----------
  "assistant.title": "文遗小助手",
  "assistant.open": "打开小助手",
  "assistant.minimize": "收起",
  "assistant.hide": "隐藏小助手",
  "assistant.summon": "召唤小助手",
  "assistant.relatedQueries": "你可能想问",
  "assistant.inputPlaceholder": "问我关于文物或这个页面的问题…",
  "assistant.send": "发送",
  "assistant.greeting": "你好！我是文遗小助手。可以问我文物、历史、文化遗产，或当前页面的用法。点上面的联想词，我能直接为你讲解～",
  "assistant.error": "小助手暂时无法回复，请稍后再试。",
  "assistant.errorTimeout": "联网检索耗时较长被中断，请换个问法或稍后再试。",
  "assistant.errorRateLimit": "请求太频繁了，请稍等几秒再试。",
  "assistant.errorNetwork": "网络连接异常，请检查网络后重试。",
  "assistant.resetNotice": "已切换到新页面，对话已重置，现在围绕当前内容回答",
  "assistant.currentPage": "当前：{title}",
  "assistant.references": "参考资料",
  "assistant.refOnSite": "站内",
  "assistant.refSearch": "搜索",
  "assistant.referencesHint": "资料来源由 AI 联网检索生成，建议点击核对原文",

  // ---------- 登录 / 注册页 ----------
  "login.title": "登录账号",
  "login.subtitle": "使用邮箱与密码登录",
  "register.title": "注册账号",
  "register.subtitle": "创建账号，开始记录你的藏品",

  // ---------- 认证表单 ----------
  "auth.processing": "处理中…",
  "auth.login": "登录",
  "auth.register": "注册",
  "auth.email": "邮箱",
  "auth.emailPlaceholder": "you@example.com",
  "auth.username": "用户名（可选）",
  "auth.usernamePlaceholder": "3-30 位字母、数字、下划线或连字符（缺省时由邮箱生成）",
  "auth.password": "密码",
  "auth.passwordPlaceholder": "至少 6 位",
  "auth.confirmPassword": "确认密码",
  "auth.confirmPasswordPlaceholder": "再次输入密码",
  "auth.noAccount": "还没有账号？",
  "auth.signUpNow": "立即注册",
  "auth.hasAccount": "已有账号？",
  "auth.goLogin": "去登录",
  "auth.opFailed": "操作失败，请重试",
  "auth.requestFailed": "请求失败（HTTP {status}）",
  "auth.networkError": "网络异常，请检查连接后重试",

  // ---------- 探索页 ----------
  "explore.title": "探索藏品",
  "explore.eyebrow": "数字遗产 · 民间文物",
  "explore.subtitle": "浏览由社区贡献的文物与遗迹档案。支持名称搜索、#标签检索与多维筛选。",
  "explore.searchPlaceholder": "搜索文物名称，或输入 #标签 按标签过滤…",
  "explore.clearSearch": "清空搜索",
  "explore.filter": "筛选",
  "explore.filterDynasty": "年代",
  "explore.filterMaterial": "门类",
  "explore.filterStatus": "保存状态",
  "explore.clearFilters": "清除筛选",
  "explore.count": "共 {n} 件",
  "explore.maxShown": "（已展示前 50 条）",
  "explore.located": "{n} 件含出土地定位",
  "explore.grid": "网格",
  "explore.map": "地图",
  "explore.loading": "正在加载最新文物…",
  "explore.empty": "没有符合条件的文物，试试调整搜索词或筛选条件。",
  "explore.mapLoading": "地图加载中…",
  "explore.mapEmpty": "当前筛选条件下没有含出土地定位的文物。",
  "explore.mapEmptyHint": "调整搜索词或筛选条件后再试。",
  "explore.errorTitle": "加载失败",
  "explore.errorDesc": "加载典藏阁失败：{msg}",
  "explore.tabRecommended": "推荐",
  "explore.tabFollowing": "关注",
  "explore.emptyFollowing": "你关注的人的最新动态会显示在这里。",
  "explore.emptyFollowingOf": "{name} 还没有上传文物。",
  "explore.discoverPeople": "去发现更多收藏家",

  // ---------- 个人中心 ----------
  "profile.editProfile": "编辑资料",
  "profile.statUploads": "已上传文物",
  "profile.statLikes": "累计获赞",
  "profile.statDays": "加入天数",
  "profile.joinedOn": "加入于 {date}",
  "profile.tabUploads": "我的贡献",
  "profile.tabFavorites": "我的收藏",
  "profile.uploadNew": "上传新文物",
  "profile.emptyUploads": "你还没有上传任何文物。",
  "profile.emptyUploadsCta": "去上传",
  "profile.emptyFavorites": "你还没有收藏任何文物。",
  "profile.exploreCta": "去探索藏品",
  "profile.located": "定位",
  "profile.edit": "编辑",
  "profile.delete": "删除",
  "profile.like": "点赞",
  "profile.unlike": "取消点赞",
  "profile.favorite": "收藏",
  "profile.unfavorite": "取消收藏",
  "profile.deleteConfirm": "确定删除「{title}」吗？此操作不可撤销。",
  "profile.deleted": "已删除",
  "profile.deleteSuccessDesc": "文物档案已移除",
  "profile.deleteFailed": "删除失败",
  "profile.fetchFailed": "拉取贡献失败",
  "profile.profileSaved": "资料已保存",
  "profile.profileSavedDesc": "已更新到云端",
  "profile.saveFailed": "保存失败",
  "profile.artifactSaved": "保存成功",
  "profile.artifactSavedDesc": "「{title}」已更新到云端",
  "profile.savedLocally": "已暂存本地",
  "profile.savedLocallyDesc": "云端更新失败，仅在本地修改。可稍后刷新页面重试。",
  "profile.unfavorited": "已取消收藏",
  "profile.unfavoritedDesc": "「{title}」已移出我的收藏",
  "profile.viewAria": "查看 {title}",

  // ---------- 文物详情页 ----------
  "detail.back": "返回探索",
  "detail.preservation": "保存状态",
  "detail.location": "出土地",
  "detail.coords": "经纬度",
  "detail.contributor": "贡献者",
  "detail.openInMap": "在地图中打开",
  "detail.like": "点赞",
  "detail.liked": "已赞",
  "detail.favorite": "收藏",
  "detail.favorited": "已收藏",
  "detail.comments": "评论",
  "detail.noComments": "还没有评论，来做第一个留言的人吧。",
  "detail.deleteComment": "删除评论",
  "detail.commentPlaceholder": "留下你的见解…（⌘/Ctrl + Enter 发送）",
  "detail.publish": "发表",
  "detail.saveSuccess": "保存成功",
  "detail.saveSuccessDesc": "已更新到云端",
  "detail.saveFailed": "保存失败",
  "detail.deleteTitle": "已删除",
  "detail.deleteDesc": "文物档案已移除",
  "detail.deleteFailed": "删除失败",
  "detail.commentFailed": "评论失败",
  "detail.reply": "回复",
  "detail.replyPlaceholder": "回复 {name}…",
  "detail.likeComment": "赞这条评论",

  // ---------- 上传表单 ----------
  "upload.title": "数字文物建档登记",
  "upload.subtitle": "录入民间文化遗存，配合 AI 智能识图自动提取历史纪年、保存状态与深度标签。",
  "upload.errorTitle": "操作遇到问题",
  "upload.aiSuccessTitle": "智能鉴定完成",
  "upload.aiSuccessDesc": "✨ AI 鉴定成功！已自动填充相关特征字段与标签。",
  "upload.imageRequired": "文物图像上传",
  "upload.clickOrDrag": "点击选择文件，或将文物照片拖拽至此处",
  "upload.imageHint": "支持高清晰度 JPG, PNG, WebP 格式（文件大小不超过 10MB）",
  "upload.changePhoto": "点击或拖拽可更换照片",
  "upload.removeImage": "移除图片",
  "upload.addImage": "追加图片",
  "upload.cover": "封面",
  "upload.setCover": "设为封面",
  "upload.imageCount": "已选图片",
  "upload.errMaxImages": "最多上传 6 张图片（单张不超过 10MB）",
  "upload.aiEngine": "文物 AI 智绘引擎",
  "upload.aiEngineDesc": "一键分析图像并自动补充器物名称、年代、门类与分类标签",
  "upload.fillSample": "填充示例数据",
  "upload.analyzing": "AI 正在鉴定文物并生成标签…",
  "upload.aiButton": "✨ AI 智能识别与打标",
  "upload.name": "文物名称",
  "upload.namePlaceholder": "例如：青花缠枝莲纹赏瓶",
  "upload.era": "历史纪年 / 朝代",
  "upload.eraPlaceholder": "例如：清乾隆 / 宋代 / 19世纪末",
  "upload.category": "文物门类 / 材质",
  "upload.categoryPlaceholder": "例如：瓷器 / 玉石 / 青铜器 / 织锦",
  "upload.preservation": "保存状态 (Preservation Status)",
  "upload.presIntact": "完整 (Intact)",
  "upload.presMinor": "微损 (Minor Damage)",
  "upload.presSevere": "严重残损 (Severe Degradation)",
  "upload.presRuin": "遗址残片 (Ruin)",
  "upload.presIntactDesc": "品相完好，无明显破损或遗失",
  "upload.presMinorDesc": "表面有轻微划痕、风化或小面积剥落",
  "upload.presSevereDesc": "结构受损、开裂或有明显部件缺失",
  "upload.presRuinDesc": "残块、碎片或考古发掘残存体",
  "upload.tags": "特征标签 (点击可移除，亦可手动添加)",
  "upload.noTags": "暂无标签，点击 AI 鉴定自动生成或手动输入…",
  "upload.tagInputPlaceholder": "输入标签按回车确认…",
  "upload.addTag": "添加标签",
  "upload.description": "文物描述与背景叙事",
  "upload.descriptionPlaceholder": "填写文物的考据说明、工艺特征、出土/流传故事…",
  "upload.submitting": "正在提交存卷…",
  "upload.submit": "完成建档并保存",
  "upload.errImageFormat": "请上传标准图片格式 (JPEG, PNG, WebP)",
  "upload.errImageSize": "图片文件大小不得超过 10MB",
  "upload.errNoImageForAi": "请先上传文物影像，再发起 AI 智能鉴定",
  "upload.errAiFailed": "AI 鉴定接口调用失败，请检查网络或服务端日志",
  "upload.errAiUnknown": "AI 分析过程发生未知错误，请重试或手动输入",
  "upload.errNoImage": "请先上传文物图片",
  "upload.errNoTitle": "请填写文物名称",
  "upload.errSubmitFailed": "文物归档失败，请重试",

  // ---------- 出土地选择器 ----------
  "loc.label": "出土地 / 发现位置",
  "loc.placeholder": "输入地名 / 遗址 / 城市进行搜索（如：殷墟、西安、三星堆）",
  "loc.locate": "定位当前位置",
  "loc.locateTitle": "使用浏览器定位当前位置",
  "loc.geoUnsupported": "当前浏览器不支持定位功能",
  "loc.geoReverseFailed": "逆地理编码失败",
  "loc.geoDenied": "定位权限被拒绝，请在浏览器设置中允许定位后重试",
  "loc.geoUnavailable": "无法获取当前位置（信号弱或被拦截）",
  "loc.geoTimeout": "定位请求超时，请重试",
  "loc.coords": "经纬度",
  "loc.clearSelected": "清除所选位置",
  "loc.openOsm": "在 OpenStreetMap 中打开",
  "loc.hint": "提示：搜索选点后自动填充详细地址；也可点击「定位当前位置」获取当前坐标并逆解析地址。",

  // ---------- 编辑个人资料弹窗 ----------
  "editProfile.title": "编辑个人资料",
  "editProfile.avatar": "头像",
  "editProfile.avatarPreview": "头像预览",
  "editProfile.uploadAvatar": "从本地上传",
  "editProfile.removeAvatar": "移除头像（使用默认）",
  "editProfile.avatarErrFormat": "请选择图片文件",
  "editProfile.avatarErrSize": "图片过大，请控制在 1.5MB 以内",
  "editProfile.avatarErrRead": "读取失败，请重试",
  "editProfile.avatarHint": "支持 jpg/png/webp，最大 1.5MB。留空则使用默认头像。",
  "editProfile.nickname": "昵称",
  "editProfile.nicknamePlaceholder": "给自己起个名字",
  "editProfile.bio": "个人简介",
  "editProfile.bioPlaceholder": "一句话介绍你自己，或你的收藏志趣…",

  // ---------- 编辑文物弹窗 ----------
  "artifactEditor.title": "编辑文物信息",
  "artifactEditor.preview": "预览",
  "artifactEditor.name": "文物名称",
  "artifactEditor.eraDisplay": "年代（展示）",
  "artifactEditor.eraDisplayPlaceholder": "如 清乾隆",
  "artifactEditor.eraFilter": "年代（筛选）",
  "artifactEditor.category": "门类",
  "artifactEditor.preservation": "保存状态",
  "artifactEditor.tags": "标签（逗号分隔）",
  "artifactEditor.tagsPlaceholder": "青花瓷, 官窑",
  "artifactEditor.location": "出土地 / 发现位置",
  "artifactEditor.imageUrl": "图片链接",
  "artifactEditor.imageUrlPlaceholder": "https://…  留空则自动生成占位图",
  "artifactEditor.description": "描述与背景叙事",
  "artifactEditor.save": "保存修改",

  // ---------- 提交成功提示 ----------
  "submitSuccess.title": "文物建档成功",
  "submitSuccess.desc": "正在前往典藏阁浏览你的藏品…",

  // ---------- 首页 ----------
  "home.subtitle": "众包数字遗产与民间文物博物馆。上传照片，让多模态 AI 智能鉴定、自动打标并记录小众遗迹。",
  "home.uploadHeading": "上传新藏品 / 野外遗迹",

  // ---------- 文物卡片 ----------
  "card.view": "查看 {title} 详情",
  "card.located": "含定位",
};

const zhTW: Dict = {
  // ---------- 通用 ----------
  "common.unknownUser": "未知用戶",
  "common.loading": "載入中…",
  "common.close": "關閉",
  "common.cancel": "取消",
  "common.save": "儲存",
  "common.saving": "儲存中…",
  "common.clear": "清空",
  "common.retry": "請稍後重試",
  "common.all": "全部",
  "common.other": "其他",

  // ---------- 通知 ----------
  "notif.bell": "通知",
  "notif.title": "通知",
  "notif.empty": "還沒有新通知",
  "notif.postedArtifact": "{name} 發佈了新文物《{title}》",
  "notif.commented": "{name} 評論了《{title}》",
  "notif.replied": "{name} 回覆了你在《{title}》中的評論",
  "notif.followed": "{name} 關注了你",

  // ---------- 社交 ----------
  "social.loginToFollow": "登入後即可關注",
  "social.followFailed": "關注操作失敗，請重試",
  "social.userNotFound": "用戶不存在",
  "social.curator": "官方策展人",
  "social.followers": "粉絲",
  "social.following": "關注",
  "social.artifacts": "藏品",
  "social.thisIsYou": "這是你",
  "social.follow": "關注",
  "social.uploadsOf": "{name} 的藏品",
  "social.noUploads": "TA 還沒有上傳文物",

  // ---------- 關注 / 粉絲列表 ----------
  "connections.title": "關注與粉絲",
  "connections.following": "關注",
  "connections.followers": "粉絲",
  "connections.backToProfile": "返回主頁",
  "connections.searchPlaceholder": "搜尋用戶",
  "connections.emptyFollowing": "還沒有關注任何人",
  "connections.emptyFollowers": "還沒有粉絲",
  "connections.privateFollowing": "TA 未公開關注列表",
  "connections.privateFollowers": "TA 未公開粉絲列表",
  "connections.privateHint": "對方已設置隱私，僅本人可見",
  "connections.notFound": "用戶不存在",
  "connections.mutual": "互相關注",
  "connections.followsYou": "關注了你",
  "connections.you": "你",
  "connections.viewProfile": "查看主頁",
  "connections.artifacts": "{n} 件藏品",
  "connections.loadMore": "加載更多",
  "connections.privacyTitle": "隱私設置",
  "connections.privacyShowFollowing": "公開我的關注列表",
  "connections.privacyShowFollowers": "公開我的粉絲列表",
  "connections.privacyHint": "關閉後，他人將無法查看你的關注 / 粉絲列表（你自己始終可看）。",
  "connections.privacySaved": "隱私設置已保存",

  // ---------- 領域分類（展示層三語；value 仍為原始列舉）----------
  "opt.其他": "其他",
  "opt.唐": "唐",
  "opt.宋": "宋",
  "opt.元": "元",
  "opt.明": "明",
  "opt.清": "清",
  "opt.陶瓷器": "陶瓷器",
  "opt.金属器": "金屬器",
  "opt.玉石": "玉石",
  "opt.书画": "書畫",
  "opt.织物": "織物",
  "opt.完整": "完整",
  "opt.微损": "微損",
  "opt.残损": "殘損",

  // ---------- 導覽列 ----------
  "nav.upload": "上傳",
  "nav.explore": "探索",
  "nav.profile": "個人中心",
  "nav.login": "登入",
  "nav.logout": "退出登錄",
  "nav.loggingOut": "退出中…",

  // ---------- 頁腳 ----------
  "footer.tagline": "眾包數位遺產與民間文物博物館",
  "footer.explore": "探索",
  "footer.about": "關於",
  "footer.aboutText": "RelicVault AI 用人工智慧協助每個人記錄、鑑定與傳承身邊的民間文物。",

  // ---------- 語言切換 ----------
  "lang.label": "語言",

  // ---------- 字号调节（无障碍） ----------
  "a11y.fontSize": "字號",
  "a11y.fontSize.small": "小",
  "a11y.fontSize.default": "標準",
  "a11y.fontSize.large": "大",
  "a11y.fontSize.xl": "特大",
  "a11y.fontSize.xxl": "超大",
  "a11y.fontSize.xxxl": "極大",
  "a11y.theme": "主題",
  "a11y.theme.dark": "夜間",
  "a11y.theme.light": "白天",

  // ---------- 浮窗小助手 ----------
  "assistant.title": "文遺小助手",
  "assistant.open": "打開小助手",
  "assistant.minimize": "收起",
  "assistant.hide": "隱藏小助手",
  "assistant.summon": "召喚小助手",
  "assistant.relatedQueries": "你可能想問",
  "assistant.inputPlaceholder": "問我關於文物或這個頁面的問題…",
  "assistant.send": "傳送",
  "assistant.greeting": "你好！我是文遺小助手。可以問我文物、歷史、文化遺產，或目前頁面的用法。點上面的聯想詞，我能直接為你講解～",
  "assistant.error": "小助手暫時無法回覆，請稍後再試。",
  "assistant.errorTimeout": "聯網檢索耗時較長被中斷，請換個問法或稍後再試。",
  "assistant.errorRateLimit": "請求太頻繁了，請稍等幾秒再試。",
  "assistant.errorNetwork": "網路連線異常，請檢查網路後重試。",
  "assistant.resetNotice": "已切換到新頁面，對話已重置，現在圍繞目前內容回答",
  "assistant.currentPage": "目前：{title}",
  "assistant.references": "參考資料",
  "assistant.refOnSite": "站內",
  "assistant.refSearch": "搜尋",
  "assistant.referencesHint": "資料來源由 AI 聯網檢索生成，建議點擊核對原文",

  // ---------- 登入 / 註冊頁 ----------
  "login.title": "登入帳號",
  "login.subtitle": "使用信箱與密碼登入",
  "register.title": "註冊帳號",
  "register.subtitle": "建立帳號，開始記錄你的藏品",

  // ---------- 認證表單 ----------
  "auth.processing": "處理中…",
  "auth.login": "登入",
  "auth.register": "註冊",
  "auth.email": "信箱",
  "auth.emailPlaceholder": "you@example.com",
  "auth.username": "使用者名稱（選用）",
  "auth.usernamePlaceholder": "3-30 位字母、數字、底線或連字號（缺省時由信箱產生）",
  "auth.password": "密碼",
  "auth.passwordPlaceholder": "至少 6 位",
  "auth.confirmPassword": "確認密碼",
  "auth.confirmPasswordPlaceholder": "再次輸入密碼",
  "auth.noAccount": "還沒有帳號？",
  "auth.signUpNow": "立即註冊",
  "auth.hasAccount": "已有帳號？",
  "auth.goLogin": "去登入",
  "auth.opFailed": "操作失敗，請重試",
  "auth.requestFailed": "請求失敗（HTTP {status}）",
  "auth.networkError": "網路異常，請檢查連線後重試",

  // ---------- 探索頁 ----------
  "explore.title": "探索藏品",
  "explore.eyebrow": "數位遺產 · 民間文物",
  "explore.subtitle": "瀏覽由社群貢獻的文物與遺跡檔案。支援名稱搜尋、#標籤檢索與多維篩選。",
  "explore.searchPlaceholder": "搜尋文物名稱，或輸入 #標籤 按標籤過濾…",
  "explore.clearSearch": "清空搜尋",
  "explore.filter": "篩選",
  "explore.filterDynasty": "年代",
  "explore.filterMaterial": "門類",
  "explore.filterStatus": "保存狀態",
  "explore.clearFilters": "清除篩選",
  "explore.count": "共 {n} 件",
  "explore.maxShown": "（已展示前 50 筆）",
  "explore.located": "{n} 件含出土地定位",
  "explore.grid": "網格",
  "explore.map": "地圖",
  "explore.loading": "正在載入最新文物…",
  "explore.empty": "沒有符合條件的文物，試著調整搜尋詞或篩選條件。",
  "explore.mapLoading": "地圖載入中…",
  "explore.mapEmpty": "目前篩選條件下沒有含出土地定位的文物。",
  "explore.mapEmptyHint": "調整搜尋詞或篩選條件後再試。",
  "explore.errorTitle": "載入失敗",
  "explore.errorDesc": "載入典藏閣失敗：{msg}",
  "explore.tabRecommended": "推薦",
  "explore.tabFollowing": "關注",
  "explore.emptyFollowing": "你關注的人的最新動態會顯示在這裡。",
  "explore.emptyFollowingOf": "{name} 還沒有上傳文物。",
  "explore.discoverPeople": "去發現更多收藏家",

  // ---------- 個人中心 ----------
  "profile.editProfile": "編輯資料",
  "profile.statUploads": "已上傳文物",
  "profile.statLikes": "累計獲讚",
  "profile.statDays": "加入天數",
  "profile.joinedOn": "加入於 {date}",
  "profile.tabUploads": "我的貢獻",
  "profile.tabFavorites": "我的收藏",
  "profile.uploadNew": "上傳新文物",
  "profile.emptyUploads": "你還沒有上傳任何文物。",
  "profile.emptyUploadsCta": "去上傳",
  "profile.emptyFavorites": "你還沒有收藏任何文物。",
  "profile.exploreCta": "去探索藏品",
  "profile.located": "定位",
  "profile.edit": "編輯",
  "profile.delete": "刪除",
  "profile.like": "點讚",
  "profile.unlike": "取消點讚",
  "profile.favorite": "收藏",
  "profile.unfavorite": "取消收藏",
  "profile.deleteConfirm": "確定刪除「{title}」嗎？此操作不可撤銷。",
  "profile.deleted": "已刪除",
  "profile.deleteSuccessDesc": "文物檔案已移除",
  "profile.deleteFailed": "刪除失敗",
  "profile.fetchFailed": "拉取貢獻失敗",
  "profile.profileSaved": "資料已儲存",
  "profile.profileSavedDesc": "已更新到雲端",
  "profile.saveFailed": "儲存失敗",
  "profile.artifactSaved": "儲存成功",
  "profile.artifactSavedDesc": "「{title}」已更新到雲端",
  "profile.savedLocally": "已暫存本地",
  "profile.savedLocallyDesc": "雲端更新失敗，僅在本地修改。可稍後重新整理頁面重試。",
  "profile.unfavorited": "已取消收藏",
  "profile.unfavoritedDesc": "「{title}」已移出我的收藏",
  "profile.viewAria": "查看 {title}",

  // ---------- 文物詳情頁 ----------
  "detail.back": "返回探索",
  "detail.preservation": "保存狀態",
  "detail.location": "出土地",
  "detail.coords": "經緯度",
  "detail.contributor": "貢獻者",
  "detail.openInMap": "在地圖中打開",
  "detail.like": "點讚",
  "detail.liked": "已讚",
  "detail.favorite": "收藏",
  "detail.favorited": "已收藏",
  "detail.comments": "評論",
  "detail.noComments": "還沒有評論，來做第一個留言的人吧。",
  "detail.deleteComment": "刪除評論",
  "detail.commentPlaceholder": "留下你的見解…（⌘/Ctrl + Enter 傳送）",
  "detail.publish": "發表",
  "detail.saveSuccess": "儲存成功",
  "detail.saveSuccessDesc": "已更新到雲端",
  "detail.saveFailed": "儲存失敗",
  "detail.deleteTitle": "已刪除",
  "detail.deleteDesc": "文物檔案已移除",
  "detail.deleteFailed": "刪除失敗",
  "detail.commentFailed": "評論失敗",
  "detail.reply": "回覆",
  "detail.replyPlaceholder": "回覆 {name}…",
  "detail.likeComment": "讚這則評論",

  // ---------- 上傳表單 ----------
  "upload.title": "數位文物建檔登記",
  "upload.subtitle": "錄入民間文化遺存，配合 AI 智慧識圖自動擷取歷史紀年、保存狀態與深度標籤。",
  "upload.errorTitle": "操作遇到問題",
  "upload.aiSuccessTitle": "智慧鑑定完成",
  "upload.aiSuccessDesc": "✨ AI 鑑定成功！已自動填寫相關特徵欄位與標籤。",
  "upload.imageRequired": "文物影像上傳",
  "upload.clickOrDrag": "點擊選擇檔案，或將文物照片拖曳至此",
  "upload.imageHint": "支援高清晰度 JPG, PNG, WebP 格式（檔案大小不超過 10MB）",
  "upload.changePhoto": "點擊或拖曳可更換照片",
  "upload.removeImage": "移除圖片",
  "upload.addImage": "追加圖片",
  "upload.cover": "封面",
  "upload.setCover": "設為封面",
  "upload.imageCount": "已選圖片",
  "upload.errMaxImages": "最多上傳 6 張圖片（單張不超過 10MB）",
  "upload.aiEngine": "文物 AI 智繪引擎",
  "upload.aiEngineDesc": "一鍵分析影像並自動補充器物名稱、年代、門類與分類標籤",
  "upload.fillSample": "填充範例資料",
  "upload.analyzing": "AI 正在鑑定文物並產生標籤…",
  "upload.aiButton": "✨ AI 智慧識別與打標",
  "upload.name": "文物名稱",
  "upload.namePlaceholder": "例如：青花纏枝蓮紋賞瓶",
  "upload.era": "歷史紀年 / 朝代",
  "upload.eraPlaceholder": "例如：清乾隆 / 宋代 / 19世紀末",
  "upload.category": "文物門類 / 材質",
  "upload.categoryPlaceholder": "例如：瓷器 / 玉石 / 青銅器 / 織錦",
  "upload.preservation": "保存狀態 (Preservation Status)",
  "upload.presIntact": "完整 (Intact)",
  "upload.presMinor": "微損 (Minor Damage)",
  "upload.presSevere": "嚴重殘損 (Severe Degradation)",
  "upload.presRuin": "遺址殘片 (Ruin)",
  "upload.presIntactDesc": "品相完好，無明顯破損或遺失",
  "upload.presMinorDesc": "表面有輕微刮痕、風化或小面積剝落",
  "upload.presSevereDesc": "結構受損、開裂或有明顯部件缺失",
  "upload.presRuinDesc": "殘塊、碎片或考古發掘殘存體",
  "upload.tags": "特徵標籤（點擊可移除，亦可手動新增）",
  "upload.noTags": "暫無標籤，點擊 AI 鑑定自動產生或手動輸入…",
  "upload.tagInputPlaceholder": "輸入標籤按 Enter 確認…",
  "upload.addTag": "新增標籤",
  "upload.description": "文物描述與背景敘事",
  "upload.descriptionPlaceholder": "填寫文物的考據說明、工藝特徵、出土/流傳故事…",
  "upload.submitting": "正在提交存卷…",
  "upload.submit": "完成建檔並儲存",
  "upload.errImageFormat": "請上傳標準圖片格式 (JPEG, PNG, WebP)",
  "upload.errImageSize": "圖片檔案大小不得超過 10MB",
  "upload.errNoImageForAi": "請先上傳文物影像，再發起 AI 智慧鑑定",
  "upload.errAiFailed": "AI 鑑定介面呼叫失敗，請檢查網路或服務端日誌",
  "upload.errAiUnknown": "AI 分析過程發生未知錯誤，請重試或手動輸入",
  "upload.errNoImage": "請先上傳文物圖片",
  "upload.errNoTitle": "請填寫文物名稱",
  "upload.errSubmitFailed": "文物歸檔失敗，請重試",

  // ---------- 出土地選擇器 ----------
  "loc.label": "出土地 / 發現位置",
  "loc.placeholder": "輸入地名 / 遺址 / 城市進行搜尋（如：殷墟、西安、三星堆）",
  "loc.locate": "定位當前位置",
  "loc.locateTitle": "使用瀏覽器定位當前位置",
  "loc.geoUnsupported": "目前瀏覽器不支援定位功能",
  "loc.geoReverseFailed": "逆地理編碼失敗",
  "loc.geoDenied": "定位權限被拒絕，請在瀏覽器設定中允許定位後重試",
  "loc.geoUnavailable": "無法取得目前位置（訊號弱或被攔截）",
  "loc.geoTimeout": "定位請求逾時，請重試",
  "loc.coords": "經緯度",
  "loc.clearSelected": "清除所選位置",
  "loc.openOsm": "在 OpenStreetMap 中打開",
  "loc.hint": "提示：搜尋選點後自動填寫詳細地址；也可點擊「定位當前位置」取得目前座標並逆解析地址。",

  // ---------- 編輯個人資料彈窗 ----------
  "editProfile.title": "編輯個人資料",
  "editProfile.avatar": "頭像",
  "editProfile.avatarPreview": "頭像預覽",
  "editProfile.uploadAvatar": "從本機上傳",
  "editProfile.removeAvatar": "移除頭像（使用預設）",
  "editProfile.avatarErrFormat": "請選擇圖片檔案",
  "editProfile.avatarErrSize": "圖片過大，請控制在 1.5MB 以內",
  "editProfile.avatarErrRead": "讀取失敗，請重試",
  "editProfile.avatarHint": "支援 jpg/png/webp，最大 1.5MB。留空則使用預設頭像。",
  "editProfile.nickname": "暱稱",
  "editProfile.nicknamePlaceholder": "給自己起個名字",
  "editProfile.bio": "個人簡介",
  "editProfile.bioPlaceholder": "一句話介紹你自己，或你的收藏志趣…",

  // ---------- 編輯文物彈窗 ----------
  "artifactEditor.title": "編輯文物資訊",
  "artifactEditor.preview": "預覽",
  "artifactEditor.name": "文物名稱",
  "artifactEditor.eraDisplay": "年代（展示）",
  "artifactEditor.eraDisplayPlaceholder": "如 清乾隆",
  "artifactEditor.eraFilter": "年代（篩選）",
  "artifactEditor.category": "門類",
  "artifactEditor.preservation": "保存狀態",
  "artifactEditor.tags": "標籤（逗號分隔）",
  "artifactEditor.tagsPlaceholder": "青花瓷, 官窯",
  "artifactEditor.location": "出土地 / 發現位置",
  "artifactEditor.imageUrl": "圖片連結",
  "artifactEditor.imageUrlPlaceholder": "https://…  留空則自動產生佔位圖",
  "artifactEditor.description": "描述與背景敘事",
  "artifactEditor.save": "儲存修改",

  // ---------- 提交成功提示 ----------
  "submitSuccess.title": "文物建檔成功",
  "submitSuccess.desc": "正在前往典藏閣瀏覽你的藏品…",

  // ---------- 首頁 ----------
  "home.subtitle": "眾包數位遺產與民間文物博物館。上傳照片，讓多模態 AI 智慧鑑定、自動打標並記錄小眾遺跡。",
  "home.uploadHeading": "上傳新藏品 / 野外遺跡",

  // ---------- 文物卡片 ----------
  "card.view": "查看 {title} 詳情",
  "card.located": "含定位",
};

const en: Dict = {
  // ---------- Common ----------
  "common.unknownUser": "Unknown user",
  "common.loading": "Loading…",
  "common.close": "Close",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.clear": "Clear",
  "common.retry": "Please try again later",
  "common.all": "All",
  "common.other": "Other",

  // ---------- Notifications ----------
  "notif.bell": "Notifications",
  "notif.title": "Notifications",
  "notif.empty": "No notifications yet",
  "notif.postedArtifact": "{name} posted a new artifact \"{title}\"",
  "notif.commented": "{name} commented on \"{title}\"",
  "notif.replied": "{name} replied to your comment on \"{title}\"",
  "notif.followed": "{name} started following you",

  // ---------- Social ----------
  "social.loginToFollow": "Log in to follow",
  "social.followFailed": "Follow failed, please retry",
  "social.userNotFound": "User not found",
  "social.curator": "Official curator",
  "social.followers": "Followers",
  "social.following": "Following",
  "social.artifacts": "Artifacts",
  "social.thisIsYou": "This is you",
  "social.follow": "Follow",
  "social.uploadsOf": "{name}'s collection",
  "social.noUploads": "No artifacts uploaded yet",

  // ---------- Following / followers ----------
  "connections.title": "Following & Followers",
  "connections.following": "Following",
  "connections.followers": "Followers",
  "connections.backToProfile": "Back to profile",
  "connections.searchPlaceholder": "Search users",
  "connections.emptyFollowing": "Not following anyone yet",
  "connections.emptyFollowers": "No followers yet",
  "connections.privateFollowing": "This user keeps their following list private",
  "connections.privateFollowers": "This user keeps their followers list private",
  "connections.privateHint": "This list is private per the user's settings",
  "connections.notFound": "User not found",
  "connections.mutual": "Mutual",
  "connections.followsYou": "Follows you",
  "connections.you": "You",
  "connections.viewProfile": "View profile",
  "connections.artifacts": "{n} items",
  "connections.loadMore": "Load more",
  "connections.privacyTitle": "Privacy",
  "connections.privacyShowFollowing": "Show my following list",
  "connections.privacyShowFollowers": "Show my followers list",
  "connections.privacyHint": "When off, others cannot view your following / followers list (you can always see yours).",
  "connections.privacySaved": "Privacy settings saved",

  // ---------- Domain categories (display layer; value stays original) ----------
  "opt.其他": "Other",
  "opt.唐": "Tang",
  "opt.宋": "Song",
  "opt.元": "Yuan",
  "opt.明": "Ming",
  "opt.清": "Qing",
  "opt.陶瓷器": "Ceramics",
  "opt.金属器": "Metalwork",
  "opt.玉石": "Jade",
  "opt.书画": "Painting & Calligraphy",
  "opt.织物": "Textiles",
  "opt.完整": "Intact",
  "opt.微损": "Minor Damage",
  "opt.残损": "Severe Damage",

  // ---------- Navbar ----------
  "nav.upload": "Upload",
  "nav.explore": "Explore",
  "nav.profile": "Profile",
  "nav.login": "Log in",
  "nav.logout": "Log out",
  "nav.loggingOut": "Logging out…",

  // ---------- Footer ----------
  "footer.tagline": "Crowdsourced digital heritage & folk artifact museum",
  "footer.explore": "Explore",
  "footer.about": "About",
  "footer.aboutText": "RelicVault AI uses artificial intelligence to help everyone document, identify and pass on the folk artifacts around them.",

  // ---------- Language switcher ----------
  "lang.label": "Language",

  // ---------- Font size (accessibility) ----------
  "a11y.fontSize": "Text size",
  "a11y.fontSize.small": "Small",
  "a11y.fontSize.default": "Default",
  "a11y.fontSize.large": "Large",
  "a11y.fontSize.xl": "Extra large",
  "a11y.fontSize.xxl": "Huge",
  "a11y.fontSize.xxxl": "Largest",
  "a11y.theme": "Theme",
  "a11y.theme.dark": "Dark",
  "a11y.theme.light": "Light",

  // ---------- 浮窗小助手 ----------
  "assistant.title": "Heritage Assistant",
  "assistant.open": "Open assistant",
  "assistant.minimize": "Minimize",
  "assistant.hide": "Hide assistant",
  "assistant.summon": "Summon assistant",
  "assistant.relatedQueries": "You might ask",
  "assistant.inputPlaceholder": "Ask me about artifacts or this page…",
  "assistant.send": "Send",
  "assistant.greeting": "Hi! I'm your Heritage Assistant. Ask me about artifacts, history, cultural heritage, or how to use the current page. Tap a suggestion above and I'll explain it for you.",
  "assistant.error": "The assistant can't reply right now. Please try again later.",
  "assistant.errorTimeout": "Web search took too long and was interrupted. Try rephrasing or try again shortly.",
  "assistant.errorRateLimit": "Too many requests. Please wait a few seconds and try again.",
  "assistant.errorNetwork": "Network error. Please check your connection and try again.",
  "assistant.resetNotice": "Switched to a new page — conversation reset; now focusing on the current page.",
  "assistant.currentPage": "Current: {title}",
  "assistant.references": "References",
  "assistant.refOnSite": "On-site",
  "assistant.refSearch": "Search",
  "assistant.referencesHint": "Sources are retrieved by AI — tap to verify the originals",

  // ---------- Login / Register pages ----------
  "login.title": "Log in to your account",
  "login.subtitle": "Sign in with your email and password",
  "register.title": "Create an account",
  "register.subtitle": "Create an account to start recording your collection",

  // ---------- Auth form ----------
  "auth.processing": "Processing…",
  "auth.login": "Log in",
  "auth.register": "Sign up",
  "auth.email": "Email",
  "auth.emailPlaceholder": "you@example.com",
  "auth.username": "Username (optional)",
  "auth.usernamePlaceholder": "3-30 letters, digits, underscores or hyphens (defaults to an email-derived name)",
  "auth.password": "Password",
  "auth.passwordPlaceholder": "At least 6 characters",
  "auth.confirmPassword": "Confirm password",
  "auth.confirmPasswordPlaceholder": "Re-enter your password",
  "auth.noAccount": "No account yet?",
  "auth.signUpNow": "Sign up now",
  "auth.hasAccount": "Already have an account?",
  "auth.goLogin": "Go to log in",
  "auth.opFailed": "Operation failed, please retry",
  "auth.requestFailed": "Request failed (HTTP {status})",
  "auth.networkError": "Network error, please check your connection and retry",

  // ---------- Explore ----------
  "explore.title": "Explore Collections",
  "explore.eyebrow": "Digital Heritage · Folk Artifacts",
  "explore.subtitle": "Browse artifact and heritage archives contributed by the community. Search by name, #tag, or filter across multiple dimensions.",
  "explore.searchPlaceholder": "Search artifact names, or enter #tag to filter…",
  "explore.clearSearch": "Clear search",
  "explore.filter": "Filters",
  "explore.filterDynasty": "Dynasty",
  "explore.filterMaterial": "Category",
  "explore.filterStatus": "Preservation",
  "explore.clearFilters": "Clear filters",
  "explore.count": "{n} items",
  "explore.maxShown": "(showing first 50)",
  "explore.located": "{n} with location",
  "explore.grid": "Grid",
  "explore.map": "Map",
  "explore.loading": "Loading latest artifacts…",
  "explore.empty": "No artifacts match your criteria. Try adjusting your search or filters.",
  "explore.mapLoading": "Loading map…",
  "explore.mapEmpty": "No located artifacts under the current filters.",
  "explore.mapEmptyHint": "Adjust your search or filters and try again.",
  "explore.errorTitle": "Failed to load",
  "explore.errorDesc": "Failed to load collection: {msg}",
  "explore.tabRecommended": "Recommended",
  "explore.tabFollowing": "Following",
  "explore.emptyFollowing": "Latest updates from people you follow will appear here.",
  "explore.emptyFollowingOf": "{name} hasn't uploaded any artifacts yet.",
  "explore.discoverPeople": "Discover more collectors",

  // ---------- Profile ----------
  "profile.editProfile": "Edit profile",
  "profile.statUploads": "Artifacts uploaded",
  "profile.statLikes": "Total likes",
  "profile.statDays": "Days joined",
  "profile.joinedOn": "Joined {date}",
  "profile.tabUploads": "My contributions",
  "profile.tabFavorites": "My favorites",
  "profile.uploadNew": "Upload new artifact",
  "profile.emptyUploads": "You haven't uploaded any artifacts yet.",
  "profile.emptyUploadsCta": "Go upload",
  "profile.emptyFavorites": "You haven't favorited any artifacts yet.",
  "profile.exploreCta": "Explore collections",
  "profile.located": "Located",
  "profile.edit": "Edit",
  "profile.delete": "Delete",
  "profile.like": "Like",
  "profile.unlike": "Unlike",
  "profile.favorite": "Favorite",
  "profile.unfavorite": "Unfavorite",
  "profile.deleteConfirm": "Delete \"{title}\"? This cannot be undone.",
  "profile.deleted": "Deleted",
  "profile.deleteSuccessDesc": "Artifact archive removed",
  "profile.deleteFailed": "Delete failed",
  "profile.fetchFailed": "Failed to load contributions",
  "profile.profileSaved": "Profile saved",
  "profile.profileSavedDesc": "Updated to the cloud",
  "profile.saveFailed": "Save failed",
  "profile.artifactSaved": "Saved successfully",
  "profile.artifactSavedDesc": "\"{title}\" updated to the cloud",
  "profile.savedLocally": "Saved locally",
  "profile.savedLocallyDesc": "Cloud update failed; changes saved locally. Refresh later to retry.",
  "profile.unfavorited": "Removed from favorites",
  "profile.unfavoritedDesc": "\"{title}\" removed from your favorites",
  "profile.viewAria": "View {title}",

  // ---------- Artifact detail ----------
  "detail.back": "Back to explore",
  "detail.preservation": "Preservation",
  "detail.location": "Excavation site",
  "detail.coords": "Coordinates",
  "detail.contributor": "Contributor",
  "detail.openInMap": "Open in map",
  "detail.like": "Like",
  "detail.liked": "Liked",
  "detail.favorite": "Favorite",
  "detail.favorited": "Favorited",
  "detail.comments": "Comments",
  "detail.noComments": "No comments yet. Be the first to leave one.",
  "detail.deleteComment": "Delete comment",
  "detail.commentPlaceholder": "Share your insights… (⌘/Ctrl + Enter to send)",
  "detail.publish": "Post",
  "detail.saveSuccess": "Saved successfully",
  "detail.saveSuccessDesc": "Updated to the cloud",
  "detail.saveFailed": "Save failed",
  "detail.deleteTitle": "Deleted",
  "detail.deleteDesc": "Artifact archive removed",
  "detail.deleteFailed": "Delete failed",
  "detail.commentFailed": "Comment failed",
  "detail.reply": "Reply",
  "detail.replyPlaceholder": "Reply to {name}…",
  "detail.likeComment": "Like this comment",

  // ---------- Upload form ----------
  "upload.title": "Digital Artifact Registration",
  "upload.subtitle": "Record folk cultural relics; AI auto-extracts era, preservation status and deep tags from images.",
  "upload.errorTitle": "Something went wrong",
  "upload.aiSuccessTitle": "AI analysis complete",
  "upload.aiSuccessDesc": "✨ AI analysis succeeded! Relevant fields and tags auto-filled.",
  "upload.imageRequired": "Artifact image",
  "upload.clickOrDrag": "Click to choose a file, or drag a photo here",
  "upload.imageHint": "High-res JPG, PNG, WebP supported (max 10MB)",
  "upload.changePhoto": "Click or drag to replace photo",
  "upload.removeImage": "Remove image",
  "upload.addImage": "Add image",
  "upload.cover": "Cover",
  "upload.setCover": "Set as cover",
  "upload.imageCount": "Images selected",
  "upload.errMaxImages": "Up to 6 images (each under 10MB)",
  "upload.aiEngine": "Artifact AI engine",
  "upload.aiEngineDesc": "Analyze images in one click to auto-fill name, era, category and tags",
  "upload.fillSample": "Fill sample data",
  "upload.analyzing": "AI is analyzing the artifact and generating tags…",
  "upload.aiButton": "✨ AI identify & tag",
  "upload.name": "Artifact name",
  "upload.namePlaceholder": "e.g. Blue-and-white interlocked-lotus vase",
  "upload.era": "Historical era / dynasty",
  "upload.eraPlaceholder": "e.g. Qianlong / Song / late 19th c.",
  "upload.category": "Artifact category / material",
  "upload.categoryPlaceholder": "e.g. Porcelain / Jade / Bronze / Textile",
  "upload.preservation": "Preservation Status",
  "upload.presIntact": "Intact",
  "upload.presMinor": "Minor Damage",
  "upload.presSevere": "Severe Degradation",
  "upload.presRuin": "Ruin",
  "upload.presIntactDesc": "Pristine, no obvious damage or loss",
  "upload.presMinorDesc": "Slight scratches, weathering or small-area flaking",
  "upload.presSevereDesc": "Structural damage, cracks or obvious missing parts",
  "upload.presRuinDesc": "Fragments, shards or archaeological remains",
  "upload.tags": "Feature tags (click to remove, or add manually)",
  "upload.noTags": "No tags yet. Click AI to generate, or add manually…",
  "upload.tagInputPlaceholder": "Type a tag and press Enter…",
  "upload.addTag": "Add tag",
  "upload.description": "Description & background",
  "upload.descriptionPlaceholder": "Describe provenance, craftsmanship, discovery story…",
  "upload.submitting": "Submitting…",
  "upload.submit": "Complete & save",
  "upload.errImageFormat": "Please upload a standard image (JPEG, PNG, WebP)",
  "upload.errImageSize": "Image must be under 10MB",
  "upload.errNoImageForAi": "Upload an image before starting AI analysis",
  "upload.errAiFailed": "AI analysis failed; check network or server logs",
  "upload.errAiUnknown": "Unknown error during AI analysis; retry or enter manually",
  "upload.errNoImage": "Please upload an artifact image first",
  "upload.errNoTitle": "Please enter the artifact name",
  "upload.errSubmitFailed": "Archiving failed, please retry",

  // ---------- Location picker ----------
  "loc.label": "Excavation / discovery location",
  "loc.placeholder": "Search place / site / city (e.g. Yin Xu, Xi'an, Sanxingdui)",
  "loc.locate": "Use my location",
  "loc.locateTitle": "Locate via browser",
  "loc.geoUnsupported": "Browser doesn't support geolocation",
  "loc.geoReverseFailed": "Reverse geocoding failed",
  "loc.geoDenied": "Location permission denied; enable it in browser settings and retry",
  "loc.geoUnavailable": "Couldn't get current location (weak signal or blocked)",
  "loc.geoTimeout": "Location request timed out, please retry",
  "loc.coords": "Coordinates",
  "loc.clearSelected": "Clear selected location",
  "loc.openOsm": "Open in OpenStreetMap",
  "loc.hint": "Tip: searching auto-fills the address; or click \"Use my location\" to get coordinates and reverse-geocode.",

  // ---------- Edit profile modal ----------
  "editProfile.title": "Edit profile",
  "editProfile.avatar": "Avatar",
  "editProfile.avatarPreview": "Avatar preview",
  "editProfile.uploadAvatar": "Upload from device",
  "editProfile.removeAvatar": "Remove avatar (use default)",
  "editProfile.avatarErrFormat": "Please choose an image file",
  "editProfile.avatarErrSize": "Image too large; keep under 1.5MB",
  "editProfile.avatarErrRead": "Failed to read; please retry",
  "editProfile.avatarHint": "Supports jpg/png/webp, max 1.5MB. Blank uses the default avatar.",
  "editProfile.nickname": "Nickname",
  "editProfile.nicknamePlaceholder": "Give yourself a name",
  "editProfile.bio": "Bio",
  "editProfile.bioPlaceholder": "One line about you or your collection interests…",

  // ---------- Edit artifact modal ----------
  "artifactEditor.title": "Edit artifact info",
  "artifactEditor.preview": "Preview",
  "artifactEditor.name": "Artifact name",
  "artifactEditor.eraDisplay": "Era (display)",
  "artifactEditor.eraDisplayPlaceholder": "e.g. Qianlong",
  "artifactEditor.eraFilter": "Era (filter)",
  "artifactEditor.category": "Category",
  "artifactEditor.preservation": "Preservation",
  "artifactEditor.tags": "Tags (comma-separated)",
  "artifactEditor.tagsPlaceholder": "Blue-and-white, Imperial kiln",
  "artifactEditor.location": "Excavation / discovery location",
  "artifactEditor.imageUrl": "Image URL",
  "artifactEditor.imageUrlPlaceholder": "https://… leave blank for auto placeholder",
  "artifactEditor.description": "Description & background",
  "artifactEditor.save": "Save changes",

  // ---------- Submit success toast ----------
  "submitSuccess.title": "Artifact archived",
  "submitSuccess.desc": "Heading to your collection…",

  // ---------- Home ----------
  "home.subtitle": "Crowdsourced digital heritage and minor artifact museum. Upload photos and let multimodal AI identify, auto-tag and record obscure relics.",
  "home.uploadHeading": "Upload new collection / field relic",

  // ---------- Artifact card ----------
  "card.view": "View {title} details",
  "card.located": "Located",
};

export const dictionaries: Record<Locale, Dict> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  en,
};

type Vars = Record<string, string | number>;

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

/** 翻译核心函数：缺失 key 时回退到简体中文，再回退到 key 本身。 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Vars
): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const val = dict[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  return format(val, vars);
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "zh-CN" || value === "zh-TW" || value === "en";
}

/**
 * 领域分类值的展示层翻译：把数据枚举值（唐/陶瓷器/完整…）映射到当前语言的
 * 展示文案。底层 value 始终是原始枚举（保证筛选/存储逻辑不被破坏），仅在渲染
 * 时调用本函数。找不到翻译时回退到原始值，避免空白。
 */
export function translateOption(locale: Locale, value: string): string {
  if (!value) return value;
  return translate(locale, `opt.${value}`) || value;
}

/**
 * 将网站语言映射为 Nominatim 的 Accept-Language 请求头值，
 * 让地点搜索 / 逆地理编码返回的地点名称跟随用户当前语言。
 */
export function localeToAcceptLanguage(locale: Locale): string {
  switch (locale) {
    case "zh-TW":
      return "zh-TW";
    case "en":
      return "en";
    case "zh-CN":
    default:
      return "zh-CN";
  }
}

/**
 * 将网站语言映射为智谱 GLM 视觉分析的「输出语言」指令。
 * 让 AI 识图打标的文本（标题 / 描述 / 标签 / 年代）跟随用户当前界面语言，
 * 避免出现"英文界面却返回中文档案"的错位。
 * 注意：文物门类 category 始终要求中文枚举（陶瓷器/金属器/…），
 * 因其用于前端筛选与存储，不随语言变化；此处语言仅影响自由文本字段。
 */
export function localeToZhipuLanguage(locale: Locale): string {
  switch (locale) {
    case "zh-TW":
      return "繁體中文";
    case "en":
      return "English";
    case "zh-CN":
    default:
      return "简体中文";
  }
}
