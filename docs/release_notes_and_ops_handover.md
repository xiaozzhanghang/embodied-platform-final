# 具身智能平台 - 发版说明书与运维交付物料清单

> **发布版本**：`v1.2.0-RELEASE`（具身智能平台质检审核与标注工作台重大升级）  
> **发布日期**：2026 年 8 月 21 日  
> **发布类型**：新功能上线 + 核心工作台功能优化修改  
> **影响范围**：数据质检系统、数据审核系统、数据标注系统、数据采集与标注工作台

---

# 第一部分：开发交付给运维的物料清单 (Dev to Ops Handover Checklist)

开发团队在提交上线工单时，需向运维团队完整交付以下 **7 大项标准化物料**：

### 1. 代码版本与构建物料 (Code & Artifacts)
- **代码仓库**：`git@github.com:xiaozzhanghang/embodied-platform-final.git`
- **发布分支**：`release/v1.2.0`（或 `main` 分支特定 Commit Tag，如 `tag: v1.2.0-20260821`）
- **Commit ID**：`99a8eae`（请锁定此最新稳定 Commit）
- **Docker 镜像标签**（如采用容器化交付）：
  - `registry.embodied.ai/platform/web-frontend:v1.2.0-20260821`
  - `registry.embodied.ai/platform/core-service:v1.2.0-20260821`

### 2. 运行时与环境依赖要求 (Runtime & System Requirements)
- **Node.js 运行时**：`Node.js >= 18.18.0`（推荐 `Node.js 20.x LTS`）
- **包管理器**：`npm >= 9.x` 或 `pnpm >= 8.x`
- **框架版本**：`Next.js 16.1.6`（内置 Turbopack 编译内核）
- **多媒体与存储依赖**：
  - 对象存储（S3 / MinIO）：用于多视角四相机视频（Top Head、Wrist L/R）切片与数据流读取；
  - 静态 CDN 缓存策略：需对 `/annotation_workbench_prototype.html` 及静态 JS Bundle 设置标准 `max-age`。

### 3. 配置文件与环境变量变更清单 (Environment Variables)
生产环境 `.env.production` 需核对并配置以下新增/变更参数：
```env
# 平台基础配置
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.embodied.example.com

# 具身智能多视角视频存储与标注服务
NEXT_PUBLIC_VIDEO_STORAGE_OSS_BUCKET=embodied-episodes-prod
NEXT_PUBLIC_VIDEO_STREAM_GATEWAY=https://stream.embodied.example.com

# 质检审核流与 Webhook 回调
QA_AUDIT_CALLBACK_WEBHOOK=https://api.embodied.example.com/v1/qa/callback
ANNOTATION_MAX_TOTAL_FRAMES=900
```

### 4. 数据库变更与数据迁移脚本 (Database Migration DDL/DML)
- **执行时机**：代码构建打包完成后、新服务拉起前执行。
- **数据库类型**：PostgreSQL 14+ / MySQL 8.0+
- **SQL 变更脚本文件**：`migrations/20260821_add_qa_audit_annotation.sql`
  - 1. 新增 `qa_inspection_records`（数据质检抽检记录表）；
  - 2. 新增 `audit_episodes`（数据审核工单流转表）；
  - 3. 修改 `annotation_steps` 表：新增 `color`（步骤专属色值）、`arm`（双手/单手）、`drag_order`（拖拽排序序号）字段；
- **回滚脚本**：`migrations/20260821_rollback_qa_audit.sql`。

### 5. 服务部署与构建命令 (Build & Run Commands)
```bash
# 1. 进入工程根目录
cd /data/apps/embodied-platform

# 2. 检出发布分支并拉取最新代码
git fetch origin && git checkout release/v1.2.0 && git pull origin release/v1.2.0

# 3. 安装依赖（严格使用 clean-install）
npm ci --legacy-peer-deps

# 4. 执行 Next.js 生产优化编译
npm run build

# 5. 重启 PM2 常驻服务守护进程（或 Docker 容器滚动更新）
pm2 reload embodied-web-app || pm2 start npm --name "embodied-web-app" -- start -- -p 3000
```

### 6. 健康检查与验证用例 (Health Check & Verification URLs)
运维部署完成后，需依次访问以下路径确认 HTTP 200 及页面渲染正常：
1. **数据质检首页**：`GET https://domain/collection/qa`
2. **数据审核列表**：`GET https://domain/annotation/audit`
3. **数据标注大厅**：`GET https://domain/annotation/projects`
4. **具身智能动作范围标注工作台**：
   `GET https://domain/annotation/workbench-solutions?instanceId=19884&episodeId=744108&type=范围标注&mode=annotate`
5. **PRD 文档抽屉验证**：在标注工作台右上角点击 `📋 功能需求说明书 (PRD)`，验证抽屉正常滑出且各 Tab 可切换。

### 7. 应急回滚方案 (Rollback Plan)
- **触发条件**：部署后出现核心工作台白屏、无法加载标注数据、API 500 报错超过 3 次。
- **回滚步骤**：
  1. 代码快速回滚：`git checkout v1.1.0-PREV && npm run build && pm2 reload embodied-web-app`
  2. 数据库回滚：执行 `migrations/20260821_rollback_qa_audit.sql`；
  3. 刷新 CDN 边缘缓存并通知业务方。

---

# 第二部分：本次发版说明书（给运维/测试/业务方的发布文档）

## 一、 发版概述
- **发布主题**：具身智能平台「数据质检、数据审核、数据标注」三大新系统上线 &「数据采集标注工作台」全面升级
- **停机需求**：**无需停机**（支持滚动平滑发布）
- **建议发版窗口**：2026-08-21 19:00 - 20:00（低峰期）

---

## 二、 本次发版功能清单 (Release Features)

### 🌟 模块一：【新功能】数据质检系统 (Data QA System)
1. **多视角双视监控与质检大盘**：支持采集数据多相机同步质检、抽检覆盖率统计；
2. **缺陷标记与不合格回退流**：质检员可快速标记异常动作帧，一键执行「质检不合格」打标并自动流转至返工池；
3. **质检合规性审计规则**：支持按动作完整度、帧时序连续性等规则自动化质检。

### 🌟 模块二：【新功能】数据审核系统 (Data Audit & Acceptance)
1. **多级数据审核工单流**：支持按项目、批次、采集任务多维度分配审核工单；
2. **抽检决策闭环**：审核员支持单条 Episode 的「抽检通过」与「抽检不通过」判定，自动触发工单流转与结算标记；
3. **批量验收与交付归档**：支持合格数据集一键打包归档与导出。

### 🌟 模块三：【新功能】数据标注系统 (Data Annotation Marketplace)
1. **标注项目与任务中心**：支持创建长视频切分、范围标注、关键点标注等各类具身智能任务；
2. **标注进度与统计面板**：实时追踪各标注员进度、平均每帧标注耗时与准确率。

### 🚀 模块四：【功能优化/修改】数据采集标注工作台 (Embodied Annotation Studio)
本次针对核心标注工作台进行了深度重构与体验升级：
1. **手柄录制状态机 (Q/R 快捷键)**：
   - 点击 `开始 [Q]`：自动将当前帧设为起始帧，视频 30FPS 流畅播放，时序色块向右实时动态拉伸延展；
   - 点击 `标记 [R]`：自动锁定结束帧并暂停播放；
2. **实时录制动态 HUD 横幅与视觉反馈**：
   - 录制中顶部浮现科技蓝发光 HUD 横幅，展示实时帧差与动作描述；
   - 时间轴对应步骤呈现**蓝白交替发光动态斜纹（Barber-pole Stripes）**；
3. **3px 鲜艳激光红游标与拖拽联动**：
   - 采用 3px 鲜艳激光红实线、纯红角标与倒三角指针，全屏发光投影；
   - 支持在时间轴任意位置按住鼠标左右拖拽平滑寻帧（Scrubbing），滑过步骤区间自动联动高亮右侧对应步骤；
4. **动作步骤拖拽换位与复制管理**：
   - 支持鼠标按住 `⠿` 手柄上下拖拽调换步骤先后顺序，系统自动重新顺延对齐时间轴；
   - 支持 `[复制单步]`（就地克隆+时长锁定+顺延对齐）与多选 `[📋 批量复制]`、`[🗑️ 批量删除]`；
   - 新增步骤自动平滑滚动定位（`scrollIntoView`）；
5. **集成交互式 PRD 需求规格说明书抽屉**：
   - 页面右上角新增 `[📋 功能需求说明书 (PRD)]` 按钮，点击一键展开全模块研发需求与数据接口规范。

---

## 三、 运维上线操作 SOP 清单

| 序号 | 步骤名称 | 操作内容 | 责任人 | 预期耗时 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **发版前备份** | 备份当前线上数据库与生产环境变量文件 | 运维 | 3 min |
| 2 | **拉取代码** | 切换至目标 Tag / Commit (`99a8eae`) | 运维 | 2 min |
| 3 | **依赖与编译** | 执行 `npm ci` 和 `npm run build` | 运维 | 5 min |
| 4 | **执行数据库变更** | 运行 `20260821_add_qa_audit_annotation.sql` | 运维/DBA | 2 min |
| 5 | **服务滚动重启** | PM2 reload 或 K8s Deployment 滚动更新 | 运维 | 3 min |
| 6 | **生产环境冒烟测试** | 验证质检、审核、标注工作台 4 路链接访问与 PRD 抽屉展示 | 测试/开发 | 5 min |
| 7 | **上线完成确认** | 观察监控系统 CPU / 内存及 API 响应指标 | 运维 | 5 min |
