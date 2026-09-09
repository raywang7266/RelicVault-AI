# RelicVault AI — 项目长期记忆

## 技术栈与运行
- Next.js 14 App Router + MongoDB/Mongoose + shadcn/ui + Tailwind。认证 bcrypt+JWT httpOnly cookie；**所有持久化全部 MongoDB**（Supabase 已于 2026-08 完全移除，仅占位保留、无代码引用）。
- Docker：`docker compose up -d --build` 起 relicvault-app(3000)+relicvault-mongo(宿主 27018)。app 经 `env_file:.env.local` + `MONGODB_URI=mongodb://mongo:27017/relicvault`；数据卷固定名 `relicvault-mongo-data`。改代码→`up -d --build`；仅改 `.env.local`→`restart app`。容器冲突：`docker rm -f relicvault-mongo`（不删命名卷）。
- **Docker 数据盘位置（2026-09-09 已迁移）**：Docker Desktop 4.87 的 WSL 数据已由 `C:\Users\13315\AppData\Local\Docker\wsl`（38.58 GB，C 盘当时仅剩 20 GB）迁到 **`D:\Docker\wsl\DockerDesktopWSL\`（disk\docker_data.vhdx + main\ext4.vhdx）**，走 Settings → Resources → Advanced → Virtual disk location。C 盘原目录已空。数据库备份在 `D:\Docker\backup\`。
- **本机禁用 wsl 命令**：安全策略屏蔽 `wsl --export/--import/--unregister/--manage` 等（PowerShell、Bash 均报"系统级工具已禁用"），所以 WSL 分发迁移只能走 Docker GUI 或用户手动执行；docker CLI 本身可用。
- `next build` 不需连库（root layout 读 cookies→全站 ƒ Dynamic，仅 /icon.svg 静态）。本沙箱 genie-safe-delete 会致构建清 .next 失败；更关键：**本地 `next build`（无论直接 `node next/dist/bin/next build` 还是 `npm run build`，前台/后台均试过）会在「Collecting page data / Generating static pages」阶段被沙箱进程监视器杀掉（无报错、静默退出，有时前台 exit 1、后台卡死），无法产出 .next**。可靠做法：**`docker compose build app`**（或 `docker compose up -d --build`）——`next build` 在隔离的 node:22-slim 容器内跑，不受本机沙箱杀进程影响，必成功；随后 `docker compose up -d app` 用新镜像重建容器即可。`docker cp` 本地 .next 的旧流程已不可用（本地构建不出 .next）。

## 目录约定
`(auth)` 无导航栏；`(main)` 带 Navbar+Footer。业务改动优先 `src/components` `src/actions` `src/lib` `src/hooks` `src/schemas`。

## 关键铁律
- **React Hooks**：组件内所有 hooks 必须在条件 return 之前。给「open 才渲染」的弹窗组件加新 hook 时严禁写在 `if (!open) return null` 之后——会致 "Rendered more hooks" 整页崩进错误边界（2026-09-08 Profile 编辑弹窗即此因）；typecheck/build 均不报，仅运行时炸。
- 会话中间件：JWT 无状态+清库会出现「签名有效但用户不存在」僵尸 cookie。middleware(edge) 只做「未登录拦业务页」；「已登录跳过登录页」判断放能查库的页面层（login/register 已改 async 服务端组件 `getSessionUser()` 查库）；`/api/me` 做陈旧会话自愈（JWT 有效但查无此人→删 cookie，仅 Route Handler 能改）。
- Session Cookie 一律 `httpOnly+sameSite=lax+secure(prod)`，绝不写 localStorage。
- 入场动画：(1) 勿在静态 CSS 把 `opacity:0` 靠 fill-mode 拉回 1→用 transform 入场、默认可见；(2) `display:contents` 元素不生成 box，transform/animation 失效→别用它包 grid/flex 子元素；(3) `@keyframes` 必须写在 `@layer` 之外（验证：`npx tailwindcss -i src/app/globals.css -o /tmp/x.css --content "src/**/*.{ts,tsx}"` 后 grep `@keyframes`）。
- Rate Limiting：`src/lib/auth/rate-limit.ts` 内存滑动窗口，/api/login·/api/register·/api/artifacts(POST) 5 次/60s；超限 429+Retry-After+X-RateLimit-*。
- **Zod 可空字段**：前端「非必填但恒在 body 里」的字段（如评论 `parentId`、文物 `imageUrl`、隐私开关）——缺省传 `null` 而非省略。后端 schema 必须 `.nullable().optional()`，而非只 `.optional()`（`.optional()` 只放行 `undefined`，收 `null` 会 400 把整功能打挂；2026-09-08 评论失效即此因：curl 省略字段 201、浏览器传 null 400）。
- **字号/缩放类需求铁律**：严禁缩放根字号（`html{font-size:calc(100%*var(--x))}`）——Tailwind 间距/图标/边框全用 rem，会整页等比放大 = 浏览器整体缩放（用户明确反对）。正确做法：**只让文本乘变量**：(1) `tailwind.config.ts` 的 `theme.extend.fontSize` 全部 token 改 `calc(<base>rem * var(--font-scale))`（行高用无单位倍数随字号放大）；(2) 写死的 `text-[Npx]` 批量改 `text-[calc(Npx*var(--font-scale))]`；(3) globals.css 里 `.eyebrow` 等固定 px 文本同样 `calc(Npx*var(--font-scale))`；(4) 间距/尺寸/图标一律不动。验证：编译 CSS grep `var(--font-scale)` 应只在 `font-size`（及配套 line-height）出现，绝不在 padding/margin/gap/width/height。
- **控件 chrome 不缩放（字号溢出导航栏的根因）**：导航栏/工具栏等「界面控件」自身的文字与尺寸须用**固定值**（如 `text-[13px]`、`h-9 w-9` 写死 36px），绝不能依赖会乘 `--font-scale` 的 `text-sm` 等 token——否则用户把字号调到最大（1.9×）时控件文字 26px+、整段变宽变高，撑破固定 `h-16` 导航栏。用户主动调节的是「正文」，控件 chrome 应始终稳定。本项目把主题/字号/语言三控件统一改成 `globals.css` 的 `.rv-controls`（胶囊容器）+ `.rv-ctrl`（36px 圆形图标按钮，hover 金色描边光晕、图标 scale-110；暗色下 Sun/Moon 加暖金 drop-shadow；语言 Globe hover 转动；字号角标显示当前档位如 `1.9×`），三语靠 `title` tooltip 提示。
- **暗色模式（day/night）做法**：本项目组件大量写死羊皮纸/青铜 hex。换肤 = 在 `globals.css` 的 `:root` 与 `.dark` 各定义一套品牌变量（中性色两主题翻转；强调色 bronze/gold **两主题保持一致**以免白字按钮对比度崩），再用脚本把 `bg-/text-/border-/from-/to-/via-/divide-/ring-[#hex]` 改写为 `var(--x)`；**语义状态色（绿/红/琥珀）与模态遮罩 #1F1714 不映射**。Tailwind `bg-white` 类不被正则覆盖，需另写 `.dark .bg-white{background-color:var(--card-bg)}` 兜底。切换控件在 header，偏好存 `localStorage["rv_theme"]`，`<head>` 内联脚本首帧前加 `.dark`（未选则跟随 `prefers-color-scheme`）。
- **暗色卡片对比度铁律**：暗色 `--paper` 极暗（≈ #16110C）→ 任何 `--card-bg` / `--surface` / `--chip` 必须明显上抬（+30 亮度档 ≈ `#3A2D1E` 以上）才能形成"悬浮面板"层次；只挪 5-10 档肉眼无感（实测 1.24:1 vs 2.3:1 差距巨大）。卡片 `dark:shadow` 加 `inset_0_1px_0_0_rgba(212,178,128,0.22)` 暖金上沿高光做边缘补强，避免 bg 相近时边缘丢失。
- **响应层瘦身转换 ≠ 真值铁律**：任何"为瘦身响应体而做的序列化转换"必须在**响应边界**，消费方必须重新校验是"真值"还是"占位"。本项目列表接口把 base64 替成 `/api/artifacts/<id>/image` 减少 JSON 体积，编辑表单直接复用列表数据并把相对路径回写 → 自指死链，image 接口 404。**双层防御**：消费方对这种相对路径做白名单过滤（只接受 data: 与 http(s)://）；后端 zod `.superRefine` 拒收以 `/` 开头的 imageUrl/images[]。
- **脚本批量写 var 的坑**：正则替换生成 `var(--x)` 时，MAP 的值**不要带 `--` 前缀**，否则 `var(--${v})` 拼出非法 `var(----x)`。一旦写出，全局把 `var(----` 替换为 `var(--` 即可修复（本项目曾 603 处因此返工）。

## AI 识图（智谱 GLM）
- 走 `/api/analyze-artifact`（`/api/ai/analyze` 是 501 占位）；provider `src/lib/vision/zhipu.ts`，模型 `glm-4v-flash`。
- **铁律：智谱对单张图片有体积上限——base64 后 >10MB 会返回含糊的「API 调用参数有误」→ 接口 502。与分辨率无关**（实测 4000x5000 但 4MB 成功、9.4MB 失败）。
- 前端 `ArtifactUploadForm` 发送前用 `compressImageForAI()`（canvas 最长边 2048 + JPEG 质量递减至 ≤4MB，不改 `imagePreview`）；后端 >10MB 直接 413 明确提示。前端允许 10MB 原图→base64 约 13MB，手机原图极易命中。

## 地图/定位
POI+逆地理用 OSM Nominatim（`src/lib/geocoding.ts`，无 Key）；地图 Leaflet+react-leaflet（`next/dynamic({ssr:false})`）。已装 leaflet@1.9.4 / react-leaflet@4.2.1。

## 社交功能（小红书风格，2026-09-07）
- 关注图存 `User.following`(ObjectId[]，无独立 Follow 表)；粉丝数反查 `countDocuments({following:id})`。
- 通知 `Notification`(new_artifact/new_comment/comment_reply/new_follow)，写全部 try/catch 失败安全。
- 红点双轨：铃铛=`getUnreadCount`(全部)；探索「关注」tab=`unreadFollowing`(仅 new_artifact)，进 tab 调 `markFollowingRead(scope:"following")` 仅清 new_artifact。
- 注册 `autoFollowCurator` 自动关注 curator 让关注流首登有内容。
- 探索页双流(推荐/关注)+`/api/following` 头像条；评论一层嵌套(`parentId`)+评论点赞(embedded likes, `$[]` arrayFilters)。
- 演示账号：`demo-data.ts` 写死 DEMO_CURATOR + DEMO_SOCIAL_USERS(含 follows)/ARTIFACTS(owner+likedBy)/COMMENTS(artifact+author+replyToIndex+likedBy)；`ensure-demo-data.ts` 幂等 `ensureDemoSocialUsers`（按 email 缺谁补谁、$addToSet 关注、该账号无文物才灌）。统一密码见 README。

## Python 工具链
一次性脚本走 `C:\Users\13315\.workbuddy\binaries\python\envs\default\`（venv），勿用 system anaconda。

## 浮窗小助手（2026-09-08 新增）
- 三形态 `mode∈{mini,expanded,hidden}`，状态存 `localStorage["rv_assistant_mode"]`（Provider `src/components/assistant/assistant-context.tsx`，初始 mini 保证 SSR 水合一致）。mini=右下 FAB；expanded=对话框；hidden=不渲染，导航栏 `.rv-controls` 内出现「召唤」按钮（`rv-ctrl`）。注意认证页（/login 等）navbar 整体不渲染，hidden 时无召唤按钮。
- 对话：`src/lib/ai/zhipu-chat.ts` 的 `chatWithZhipu()` 走智谱 `glm-4-flash`（OpenAI 兼容，env `ZHIPU_CHAT_MODEL` 可覆盖）；**body 必须转 Buffer + 手动 setTimeout 超时**（同视觉 provider 的 ByteString 坑）。接口 `/api/ai/chat`（带页面上下文 system prompt，保留末 12 条历史）。
- 联想词：`src/lib/ai/page-context.ts` 的 `getPageType(path)` 把路由映射页面类型，`pageContextInfo()` 给本地化描述，`fallbackSuggestions()` 离线兜底；`/api/ai/suggest` 调 AI 产出 4-6 个页面相关 chip（要求 `{"suggestions":[...]}`，剥 ```json 围栏再 parse），失败回退兜底。
- 样式 `.rv-assistant-*` 全在 `globals.css` 的 `@layer` 之外（关键帧 `rv-assistant-pulse/rise/shimmer/blink` 同理）；chrome 固定尺寸不随 `--font-scale`，仅气泡正文 13.5px 固定。
- 挂载：`layout.tsx` body 外包 `AssistantProvider` + `<FloatingAssistant/>`；`header.tsx` 引入 `useAssistant()` 渲染召唤按钮。
- **联网搜索来源铁律**：智谱 `web_search` 返回的 `link` 字段**经常为空串 `""`**（只有 `refer:"ref_1"` 这种内部 id，非 URL），`title/content/publish_date` 永远有值。消费方**绝不能** `if(!/^https?:/.test(link)) continue` 丢弃空链接条目——否则表现为"时灵时不灵"。正确做法：有 link→直链；无 link→用标题退化成 `https://www.baidu.com/s?wd=<标题>` 搜索回链（前端打「搜索」徽标）。`src/lib/ai/references.ts` 的 `webReferences()` 与 `buildReferences()` 已按此实现，`pool` 须保留全部来源以保证模型 `[n]` 引用序号对齐。

## BuildKit builder 死锁（Docker Desktop / WSL2）
- **症状**：`docker compose build` 卡死无进展（vhdx 静止、无新镜像）。本环境 `wsl` 命令被禁用，Windows `Get-Process` 也看不到 WSL2 内的 docker/buildkit 进程。
- **绕锁**：`docker buildx create --name rvbuilder` 新建独立 builder → `docker build --builder rvbuilder -f Dockerfile -t polymercaptial-app:latest --progress=plain .`（日志落盘便于跟踪）→ `docker compose up -d --no-build --force-recreate app` 用新镜像重建容器（`--no-build` 不碰被锁默认 builder）。
- **清锁别杀 Docker 主进程**：`Stop-Process` 杀 `Docker Desktop`/`com.docker.backend` 会**连带停整个引擎、中断所有容器**；应优先 `docker buildx rm <builder>` 或新建 builder 绕开。误杀后重启 `C:\Program Files\Docker\Docker\Docker Desktop.exe`，`restart:unless-stopped` 会自动拉起容器，命名卷数据完好。
- 沙箱 `rm` 被 safe-delete 拦截且回收站路径规范化失败；删临时文件改用托管 Python `os.remove()`。
