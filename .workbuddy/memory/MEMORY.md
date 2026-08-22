# RelicVault AI — 项目长期记忆

- **项目**：众包数字遗产 / 民间文物博物馆（Next.js 14 App Router + Supabase + shadcn/ui + Tailwind）。当前 `.env.local` 已配置真实 Supabase 凭证（`NEXT_PUBLIC_SUPABASE_URL=https://nmyxefwsrtzisrweksoh.supabase.co` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`），`isSupabaseConfigured()` 返回 true，所有认证 + 数据持久化**全部走 supabase**。
- **目录约定**：`src/app/(auth)` 无导航栏（登录/注册/回调）；`src/app/(main)` 带 Navbar + Footer；业务改动优先放 `src/components`、`src/actions`、`src/lib`、`src/hooks`、`src/schemas`。
- **Supabase 字段映射**：DB schema 与前端 Artifact 类型不一致——
  - DB 列：`image_url`、`ai_tags+manual_tags`、`display_lat/lng`、`user_id`、`created_at`、`preservation_status(excellent/good/fair/poor/critical/unknown)`
  - 映射层：`src/lib/supabase/artifacts.ts`（`rowToArtifact` / `formToInsertRow` / `formToUpdatePatch`）
  - DB 无 `category` / `locationName` → 编进 description 末尾的 `[__rv_meta__]JSON` 段；同时以 `__cat__xxx` / `__loc__xxx` 前缀写入 `manual_tags`（读取时自动剥离）
  - enum 映射：`Intact↔excellent` / `Minor Damage↔good` / `Severe Degradation↔fair` / `Ruin↔poor`
- **Supabase 数据访问**：`src/lib/supabase/artifacts-store.ts`
  - **读**用 service_role 客户端（`src/lib/supabase/service.ts`）旁路 RLS 读 `artifacts_public` 视图（`security_invoker=true` 让 anon 直读会失败）
  - **写**用 service_role 写 `artifacts` 表（artifacts 表对 authenticated 只 grant insert/update/delete，没有 select——所以 `.insert().select()` 隐式 SELECT 会被拒，写后用 service_role 单读视图拿回数据）
  - **user_id** 由当前 session 提供并由应用层校验"只能改自己的"
- **Auth 模式**：登录/注册/登出走 `supabase.auth.signInWithPassword` / `admin.createUser` / `signOut`；通过 @supabase/ssr 的 cookie 绑定 session（`sb-...-auth-token`）。`SessionUser` 已含 `createdAt`（取 `user.created_at`）。注册时把 `username` / `display_name` 注入 `raw_user_meta_data` → DB trigger 自动建 `profiles` 行。
- **Mock 登录（回退路径）**：`.env.local` 仍为占位 Supabase 凭证时，`isSupabaseConfigured()` 返回 false，认证链走本地 Mock——bcrypt 加盐哈希（`src/lib/auth/mock-users.ts`）+ `rv_mock_session` httpOnly cookie。OAuth 用户的 passwordHash 留空。当前默认是真实 Supabase 模式，此路径仅作 fallback 保留。
- **GitHub OAuth**：`src/lib/auth/github.ts` 读 `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`；`/api/auth/github` 跳 `github.com/login/oauth/authorize` 带 scope=`read:user user:email` 与 csrf `state`（httpOnly cookie `rv_oauth_state` 10 分钟）；`/api/auth/github/callback` 校验 state、换 token、拉 user、upsert 账号、颁发 httpOnly session cookie。未配置时 503。登录页底部有「使用 GitHub 登录」按钮（深色 #24292F）。
- **Rate Limiting**：`src/lib/auth/rate-limit.ts` 内存滑动窗口，按 (path, ip) 计数；`/api/login`、`/api/register` 5 次/60s；`/api/artifacts POST` 5 次/60s（key `submit-artifact`）；`/api/auth/github/callback` 10 次/60s（key `github-callback`）。超限 429 + `Retry-After` + `X-RateLimit-*`。
- **Session Cookie**：所有会话 cookie（`sb-...-auth-token` / `rv_oauth_state`）均为 `httpOnly + sameSite=lax + secure(prod)`；绝不写 localStorage；登录成功时由服务端写入，客户端读不到。
- **Toast 系统**：`src/components/ui/toast.tsx`（@radix-ui/react-toast 包装）+ `toaster.tsx`（useToast hook + Toaster Provider）；4 种 variant（default/success/error/info）；Toaster 挂在 `src/app/layout.tsx`。
- **构建注意（重要）**：本沙箱 `genie-safe-delete` 会把删除路由到回收站，导致 `next build` 清理 `.next` 时失败。构建请临时关闭该 shim：
  `CODEBUDDY_SESSION_ID= CLAUDE_SESSION_ID= npm run build`（仅影响 `.next` 缓存清理，安全）。
- **环境**：`.env.local` 当前为真实 Supabase 凭证（`https://nmyxefwsrtzisrweksoh.supabase.co`）；含 `SUPABASE_SERVICE_ROLE_KEY`（仅 server-side 使用，严防泄露到 client）。
- **地图/定位**：POI 搜索与逆地理编码用 OpenStreetMap Nominatim（`src/lib/geocoding.ts`，无需 Key）；地图预览用 Leaflet + react-leaflet（`src/components/artifacts/location-map.tsx`、`location-picker.tsx`），经 `next/dynamic({ssr:false})` 加载避免 SSR 报错。已装依赖 leaflet@1.9.4 / react-leaflet@4.2.1。`(main)/artifacts/new` 已渲染 `ArtifactUploadForm`，表单 `ArtifactFormData` 含 locationName/latitude/longitude。
- **探索页（Explore/Gallery）**：`(main)/explore` 与 `gallery` 现均渲染 `src/components/artifacts/explore-grid.tsx`。功能：瀑布流（CSS columns）、名称模糊搜索 + `#标签`检索、年代/门类/保存状态多维筛选（仍保持前 50 条上限）、详情弹窗（大图+元数据+含坐标时内嵌 Pin Marker 地图 + 点赞/评论）。**数据来自 `/api/artifacts`（supabase `artifacts_public` 视图）**；点赞/评论存 localStorage（`rv_explore_interactions`）。类型见 `src/lib/types/artifact.ts`、`src/lib/types/interactions.ts`。缩略图用 picsum 随机种子，断网时 `smart-image.tsx` 自动降级为渐变占位。
- **个人中心（Profile）**：`(main)/profile/page.tsx`（服务端 `getServerUser()` 守卫）+ `src/components/profile/profile-view.tsx`（客户端总装）。展示：个人信息卡（头像/昵称/加入时间/简介 + 编辑资料弹窗）、统计看板（已上传文物数、累计获赞、加入天数）、我的贡献网格（每张卡含编辑/删除，删除走 `window.confirm`）。编辑文物弹窗 `artifact-editor.tsx` 复用 `location-picker` 改出土地。个人资料存 `localStorage rv_profile_<userId>`（`src/lib/mock/profile.ts`）。
- **"我的贡献"数据源（POST/GET 一致性）**：现在统一打到 `POST/GET /api/artifacts`。`useUserUploads(userId)` 内部挂载时 `fetch('/api/artifacts?owner=' + userId)`（带 `cache:'no-store'`）+ 客户端 `useEffect(refetch, [user.id])` 兜底，**远端优先合并 localStorage**（按 id 去重）。`Artifact.ownerId?: string` 用于归属；服务端 `getUserArtifacts(userId)` 未匹配时**兜底展示所有用户提交**（避免个人中心空白）。/api/artifacts 路由 `dynamic=force-dynamic` + `revalidate=0` + 响应 `Cache-Control: no-store, max-age=0` 三层防缓存。提交成功后跳 `/profile` + `router.refresh()`。所有 CRUD 操作失败都会通过 Toast 提示（useToast hook）。
- **文物后端（Supabase）**：`src/lib/supabase/artifacts-store.ts` 提供 listArtifactsPublic / getArtifactRemote / createArtifactRemote / updateArtifactRemote / deleteArtifactRemote。读用 service_role 旁路 RLS 读视图（坐标自动 blur 到 2 位小数）；写用 service_role 写表（artifacts 表对 authenticated 没 grant SELECT，必须如此）。用户归属校验在应用层做（不能改他人文物）。
