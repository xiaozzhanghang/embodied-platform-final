# TODO.md - 具身智能 3D 任务仿真与可视化平台待办清单

## 待办与执行规划

### 第一阶段：源码与环境验证 [100%]
- [x] 验证 Python 3.11 虚拟环境及依赖
- [x] 安装并跑通 MuJoCo 3.15.0 核心引擎
- [x] 安装并启动 FastAPI + Uvicorn + WebSockets 服务 (Port 8765)
- [x] 建立项目核心规范文档 `AGENTS.md`、`STATUS.md`、`TODO.md`

### 第二阶段：3D 可视化基础与操作台场景 [100%]
- [x] 加载 Unitree G1 29-DOF 真实组装模型 (`g1_assembled.glb`)
- [x] 搭建高质感厨房操作台、橱柜、抽屉、洗碗机与工作台场景
- [x] 修复桌面高度（$0.760\text{m}$）与机械臂穿模问题，设定全连杆防穿透约束 ($Y \ge 0.785\text{m}$)
- [x] 视角控制系统（三维全景、机器人正视、操作台俯角、头部第一人称、垂直俯视、侧视防穿模）

### 第三阶段：三大核心 MVP 任务打通 [100%]
- [x] **任务 1: `reach_target_multi_modal` (多模态空间标定球到达)**
  - [x] 空间浮动目标球多点位置与多模态视觉导引光斑
  - [x] 机械臂逆运动学/WBC 伺服到达目标容差检测与触达反馈
  - [x] 到达成功判定与光斑零位锁定
- [x] **任务 2: `drawer_top_open` (顶层抽屉拉开)**
  - [x] 顶部抽屉滑轨 3D 刚体及动态拉手交互点 ($0 \sim 19\text{cm}$)
  - [x] 机械臂末端触达拉手、抓握、后拉滑轨抽出
  - [x] 抽屉拉出距离与成功状态判定
- [x] **任务 3: `pick_box` (双臂搬运箱体)**
  - [x] 纸箱与放置托盘几何位置及材质标定
  - [x] 双臂同步伸展、夹持、提拉、腰部旋转与托盘放置
  - [x] 抓取动作零穿模校验

### 第四阶段：20 种 BiGym 2.0 任务注册表全量接入 [100%]
- [x] 1. 目标定位组 (3): `reach_target_single`, `reach_target_multi_modal`, `reach_target_dual`
- [x] 2. 桌面操作组 (5): `move_plate`, `move_two_plates`, `flip_cup`, `flip_cutlery`, `stack_blocks`
- [x] 3. 洗碗机操作组 (4): `dishwasher_close`, `dishwasher_load_cups`, `dishwasher_load_cutlery`, `dishwasher_load_plates`
- [x] 4. 厨房操作组 (8): `drawer_top_open`, `drawer_top_close`, `pick_box`, `put_cups`, `saucepan_to_hob`, `sandwich_remove`, `wall_cupboard_open`, `wall_cupboard_close`
- [x] 左侧任务列表分类标签、实时搜索、MVP 徽章与官方成功率展示
- [x] 右侧任务详情面板（目标状态、操作对象、执行步骤、成功准则、关节遥测）

### 第五阶段：双模式执行与 MuJoCo 物理服务端闭环 [100%]
- [x] 模式 A：官方专家示范轨迹回放 (Replay Mode)
- [x] 模式 B：FastAPI + WebSocket MuJoCo 后端 60Hz 实时仿真流 (Sim Mode)
- [x] 底部全功能播放控制器（播放/暂停、进度滑动条、重置、倍速调节、时间轴循环、视角预设）
- [x] 评测结果（成功/失败状态指示灯、末端对齐误差、法向接触力矩）
- [x] 动作轨迹 JSON 数据导出
- [x] 生产打包部署至 `public/embodied-3d` 并完成 Next.js `/screen` 综合看板集成验证
