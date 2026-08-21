# Next.js 静态导出兼容改造设计

## 背景

当前项目使用 Next.js 16.1.6 App Router，生产构建仍是需要 Node.js 运行时的默认模式。仓库包含 19 个动态页面、两个读取本机文件系统的 Route Handler，以及一个指向开发者桌面目录的失效绝对软链接。直接在 `next.config.mjs` 中加入 `output: 'export'` 会因动态路由、请求期 API 和不可移植资源而失败。

本设计采用用户确认的方案 A：将运行时标识放入固定静态页面的查询参数，并把 Luming 真数据接口替换为可公开提交的脱敏静态演示数据。

## 目标

- `npm run build` 直接生成可部署到普通静态服务器的 `out/` 目录。
- 构建产物不依赖 Node.js 服务、本机目录、环境变量或请求期 API。
- 当前页面之间的主要导航保持可用，运行时在 `localStorage` 中新增的 ID 不因缺少预生成路径而 404。
- Luming 数据页和文件预览页使用确定、脱敏、可复现的静态演示数据，并明确标注为演示模式。
- 客户端页面在预渲染、首次水合和查询参数变化后的行为可预测，不访问服务端运行时 API。
- 新分支完成验证后提交并推送，不改写 `main` 历史。

## 非目标

- 不实现真实 Luming 数据后端、鉴权、对象存储或实时视频流。
- 不把本机 `session_028`、忽略的大体积视频或其他采集原始数据提交到 Git。
- 不承诺 GitHub Pages 项目子路径部署；本次产物按站点根路径部署，兼容当前 Netlify 根路径配置及普通根路径静态服务器。
- 不处理与静态导出无关的既有 UI 规范、工作簿依赖和文案断言失败，除非路由迁移直接影响相应检查。

## 总体架构

构建层使用 Next.js 原生 `output: 'export'`，并输出目录式页面。路由层不再保留 App Router 动态段；所有运行时 ID 通过固定页面的查询参数传递。每个读取查询参数的固定路由由静态 Server `page.js` 提供 Suspense 边界，原有交互逻辑迁移到同目录 Client 子组件，并继续使用 Next.js `useSearchParams`。数据层以 `public/demo/session_028/` 下的静态 fixture 代替 `/api/luming*`，并由纯函数清单生成资源 URL。

关键边界如下：

- `src/lib/staticRoutes.mjs`：提供查询参数编码和规范化静态 URL 构造，不访问浏览器 API。
- 各固定路由的 `page.js`：静态 Server wrapper，以 Suspense fallback 包裹同目录 Client 页面。
- 各固定路由的 Client 页面：保留原交互逻辑，通过 `useSearchParams` 读取 ID；同路径查询参数导航时由 Next.js 路由状态驱动更新。
- `src/lib/lumingStaticAssets.mjs`：把报告、轨迹和文本预览请求映射为固定公开资源路径。
- `public/demo/session_028/`：只保存小体积、脱敏的 JSON、CSV、LOG 和 TXT fixture。

## 路由设计

所有动态段迁移为固定页面，导航入口统一通过 `staticRoutes.mjs` 编码查询参数。

| 原路由 | 静态路由 |
| --- | --- |
| `/annotation/audit/[id]` | `/annotation/audit/detail?id=...` |
| `/annotation/audit/[id]/[episodeId]` | `/annotation/audit/workbench?id=...&episodeId=...` |
| `/annotation/editor/[type]` | `/annotation/editor?type=...` |
| `/collection/collect/detail/[taskId]` | `/collection/collect/detail?taskId=...` |
| `/collection/collect/connection/[taskId]` | `/collection/collect/connection?taskId=...` |
| `/collection/collect/data/[taskId]` | `/collection/collect/data?taskId=...` |
| `/collection/collect/status/[taskId]` | `/collection/collect/status?taskId=...` |
| `/collection/collect/video/[taskId]/[episodeId]` | `/collection/collect/video?taskId=...&episodeId=...` |
| `/collection/collect/workspace/[taskId]` | `/collection/collect/workspace?taskId=...` |
| `/collection/config/detail/[id]` | `/collection/config/detail?id=...` |
| `/collection/device-types/detail/[id]` | `/collection/device-types/detail?id=...` |
| `/collection/device-types/part-detail/[id]` | `/collection/device-types/part-detail?id=...` |
| `/collection/devices/detail/[id]` | `/collection/devices/detail?id=...` |
| `/collection/qa/[instanceId]` | `/collection/qa/detail?instanceId=...` |
| `/collection/qa/[instanceId]/[seqId]` | `/collection/qa/review?instanceId=...&seqId=...` |
| `/collection/taskbooks/detail/[id]` | `/collection/taskbooks/detail?id=...` |
| `/collection/tasks/[id]` | `/collection/tasks/detail?id=...` |
| `/collection/tasks/detail/[taskId]` | 合并到 `/collection/tasks/detail?id=...` |
| `/collection/templates/detail/[id]` | `/collection/templates/detail?id=...` |

`/collection/tasks/[id]` 作为较完整的任务详情实现迁移到规范路径；现有较简单的 `/collection/tasks/detail/[taskId]` 不再保留第二套页面。未知或新增 ID 延续当前原型的通用 mock/空状态，不触发服务器查找。

查询参数约束：

- 所有值均通过 `URLSearchParams` 编码，不拼接未经编码的用户输入。
- 缺少参数时页面使用当前默认值或显示明确空状态，不抛出构建期或水合期错误。
- 页面间跳转、预取和新窗口打开全部改用规范化静态 URL。
- 仓库内不再存在 `src/app/**/[segment]/page.js`。

## Luming 静态演示数据

删除以下运行时依赖：

- `src/app/api/luming/route.js`
- `src/app/api/luming/video/route.js`
- `public/session_028` 绝对软链接

新增脱敏 fixture：

- `quality-report.json`
- `trajectory-left.json`
- `trajectory-right.json`
- `check.log`
- `quality-report.txt`
- `timestamps-left.csv`
- `timestamps-right.csv`
- `queue-left.csv`
- `queue-right.csv`
- `transforms-left-to-right.txt`
- `transforms-right-to-left.txt`

数据页分别加载报告和左右轨迹，不再采用一个请求失败导致全部结果丢失的 `Promise.all` 语义。每个资源单独检查 `response.ok`，失败时展示对应演示数据错误和重试入口。

文件预览页通过 `lumingStaticAssets.mjs` 选择固定资源，JSON 以结构化文本显示，TXT/CSV/LOG 以 UTF-8 文本显示。页面和数据卡片明确标注“静态演示数据”。

真实采集视频不进入仓库。视频区域使用已有可提交图片作为静态演示占位，并显示“静态包未包含真实采集视频”；不得回退到忽略文件、本机绝对路径或 `/api/luming/video`。

## Next.js 与部署配置

`next.config.mjs` 使用：

- `output: 'export'`
- `trailingSlash: true`，使普通静态服务器生成并解析 `route/index.html`
- 不设置 `basePath` 或 `assetPrefix`，本次只支持根路径部署
- 不设置 `images.unoptimized`，因为项目当前没有使用 `next/image`

`package.json` 保留 `npm run build` 作为唯一构建入口，替换失效的 `next start`，增加固定版本静态服务器预览命令。`netlify.toml` 继续使用现有 Next.js 插件；该插件能识别 export 产物，因此不同时改为另一套 Netlify 发布机制。

交付文档更新为静态构建、`out/` 预览和部署流程，并明确 Luming 页面是演示数据模式。

## 客户端兼容性

- `'use client'` 页面继续保留；浏览器 API 只在 `useEffect` 或用户事件内执行。
- 动态页面中的 `useParams` 全部替换为 Client 子组件内的 `useSearchParams`。
- 每个使用 `useSearchParams` 的页面都必须位于静态 Server wrapper 提供的 Suspense 边界内，避免静态预渲染触发 CSR bailout 构建错误。
- `localStorage`、`window.open`、`window.close` 和语音 API 保留现有客户端语义，但不在模块求值或服务端预渲染阶段读取。
- 根绝对资源 URL 只指向确实会进入 Git 和 `out/` 的文件；不存在的图片显示组件内置占位。

## 错误处理

- 静态 fixture 请求先检查 HTTP 状态，再解析内容；错误信息区分报告、左轨迹、右轨迹和文件预览。
- 参数缺失或未知时不导航到 404，而是显示当前页面的默认原型数据或空状态。
- 静态视频缺失是预期状态，页面展示占位说明，不循环请求不存在资源。
- 构建测试发现动态页面、API Route Handler、失效软链接或 `/api/luming` 调用时直接失败。

## 测试与验收

采用测试驱动顺序：先新增失败的静态导出契约测试，确认它能捕获当前动态页面/API/软链接，再进行最小改造直至通过。

自动检查至少覆盖：

1. `next.config.mjs` 启用 `output: 'export'` 和 `trailingSlash: true`。
2. `src/app` 下没有动态 `page.js`，也没有运行时 API Route Handler。
3. 源码不再调用 `/api/luming`。
4. `public` 下不存在失效软链接。
5. 静态 URL 构造正确编码中文、空格和特殊字符。
6. Luming 资源清单只指向仓库内存在的 fixture。
7. `npm run build` 成功并生成 `out/index.html`、`out/404.html` 和关键固定页面。
8. 静态服务器可返回首页、采集详情、审核工作台、质检详情及演示数据资源；查询参数不影响页面文件命中。
9. `git diff --check` 和最终工作树状态符合提交范围。

现有测试在设计开始前已有 6 项失败，其中包括缺少 `@oai/artifact-tool` 和既有 UI/文案断言不一致。本改造不把这些既有失败描述为通过；只要求不新增与本次路由和静态导出相关的失败，并单独报告基线差异。

## 提交与推送

- 分支：`codex/nextjs-static-export`
- 设计文档先单独提交。
- 实施按静态契约、路由迁移、演示数据、部署文档的可验证单元提交。
- 推送使用普通非强制推送并建立上游分支。
- 推送后以 `git ls-remote` 比对本地 HEAD 与远端分支提交。
