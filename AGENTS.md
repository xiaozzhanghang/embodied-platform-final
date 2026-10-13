# AGENTS.md - 具身智能 3D 任务仿真与可视化平台

## 项目概述
参考并复用 BiGym 2.0 开源项目（Unitree G1 29-DOF 双臂人形机器人、MuJoCo 物理仿真、20 种家庭/操作台基准任务），开发具备真实 3D 模型、任务场景、机器人动作控制、示范数据回放和物理仿真评测能力的 Web 平台。

## 开发原则与规范
1. **真实物理与渲染分离**：
   - 浏览器端（React + Three.js / React Three Fiber）负责交互、着色渲染、相机控制、HUD 遥测与时间轴操控。
   - 后端（Python + FastAPI + WebSocket + MuJoCo）负责真实刚体碰撞动力学计算与任务成功/失败评测。
   - 绝不将假动画伪装成真实仿真，提供明确的双模式切换：
     - **模式 A：示范回放模式（Demonstration Replay Mode）**
     - **模式 B：物理仿真模式（Physical Simulation Mode）**
2. **严禁杜撰**：
   - 严格遵循官方 BiGym 2.0 任务定义、场景物体与 Unitree G1 运动学关节定义（MJCF / URDF 映射）。
   - 未完全接入物理策略的任务明确标记状态（`ready` / `simulated` / `replay_only`）。
3. **坐标系与防穿模铁律**：
   - MuJoCo 坐标轴 (`+X` 前, `+Y` 左, `+Z` 上) 映射至 Three.js (`(0, 0, -1)` 前, `(-1, 0, 0)` 左, `(0, 1, 0)` 上)。
   - 工作台台面 $Y = 0.760\text{m}$，机械臂末端与指尖在任何动作中严格保持 $Y \ge 0.785\text{m}$，严禁侵入桌面。
   - 机器人基底距柜体留足安全间隙（$\ge 20\text{cm}$），杜绝腿部穿模。

## 架构拓扑
```
[React 18 + R3F + Vite 前端 (Port 3001)]
     │
     ├── WebSocket / REST API ──> [FastAPI + MuJoCo 后端服务 (Port 8765)]
     │                                 │
     │                                 ├── MuJoCo 3.x 物理仿真引擎
     │                                 ├── BiGym 2.0 任务注册表 (20 Tasks)
     │                                 └── 任务专家示范数据集 (Demonstrations)
     │
     └── 嵌入 Next.js 平台原型 (/screen 综合看板 Port 3000)
```
