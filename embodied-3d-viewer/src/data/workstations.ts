import { ActionType } from '../types';

/**
 * BiGym 2.0 专属工位 (Workstation) 注册表
 *
 * 真实 BiGym 2.0 基准里，每个任务是一个干净的专属工位 (cell)：
 * 1. 目标定位 (Reaching): 纯空旷地面，无台面，只有红色实心标定球悬浮在前方。
 * 2. 沥水架 (Move Plate): 白色台面，只有金属丝梳齿沥水架与餐盘，无水槽/无灶台/无洗碗机。
 * 3. 精密桌面 (Blocks / Cutlery / Flip Cup): 干净的操作台，只有对应的操作道具。
 * 4. 洗碗机 (Dishwasher): 专属洗碗机机体与向地翻开的重型门板。
 * 5. 顶层抽屉 (Drawer): 专属带滑轨抽屉橱柜。
 * 6. 电磁灶台 (Hob): 专属黑色微晶电磁炉加热圈与平底锅。
 * 7. 上壁吊柜 (Cupboard): 高位大号双门壁柜悬挂于工作台上方 (Y=1.42m~2.12m)。
 * 8. 备餐盒与托盘 (Box / Sandwich / Cups): 干净岛台配合对应容器。
 * 9. 水龙头 (Faucet): 仅在 turn_faucet 任务中展示水槽与龙头。
 */

export type WorkstationId =
  | 'open_arena'        // 空旷无台面：空间触达类任务
  | 'rack_table'         // 沥水架操作桌：白色独腿桌 + 金属丝梳齿沥水架
  | 'tabletop_clean'     // 极简操作台：积木、餐叉、翻杯
  | 'dishwasher_unit'    // 洗碗机专属工位：下沉式机体 + 翻折门板 + 内胆碗篮
  | 'drawer_unit'        // 抽屉专属工位：顶层抽屉 + 实木滑轨
  | 'hob_island'         // 灶台工位：电磁炉面板
  | 'cupboard_island'    // 吊柜工位：悬挂于上方的大号壁挂橱柜
  | 'prep_island'        // 备餐岛台：纸箱、水杯、三明治
  | 'faucet_island';     // 水龙头岛台：水槽 + 龙头

export interface Workstation {
  id: WorkstationId;
  name: string;
  description: string;
  hasWorkSurface: boolean;
  counterTop: 'wood' | 'white' | 'none';
  showSink: boolean;
  showHob: boolean;
  showDishwasher: boolean;
  showWallCabinet: boolean;
  showDrawer: boolean;
  showFaucet: boolean;
}

const WORKSTATIONS: Record<WorkstationId, Workstation> = {
  open_arena: {
    id: 'open_arena',
    name: '空旷标定场',
    description: '目标定位专属工位：地面空旷无台面，纯净空间悬浮红色实心标定球。',
    hasWorkSurface: false,
    counterTop: 'none',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  rack_table: {
    id: 'rack_table',
    name: '沥水架操作桌',
    description: '餐盘移位专属工位：白色操作桌，桌上仅有金属丝梳齿沥水架与陶瓷餐盘。',
    hasWorkSurface: true,
    counterTop: 'white',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  tabletop_clean: {
    id: 'tabletop_clean',
    name: '极简操作台',
    description: '桌面精密操作工位：整洁台面，仅保留待测刚体道具（积木/餐叉/倒扣水杯）。',
    hasWorkSurface: true,
    counterTop: 'white',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  dishwasher_unit: {
    id: 'dishwasher_unit',
    name: '洗碗机专属工位',
    description: '洗碗机操作专属工位：下沉式机体与向地翻开的重型门板，内部滑轨碗篮清晰可见。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: false,
    showHob: false,
    showDishwasher: true,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  drawer_unit: {
    id: 'drawer_unit',
    name: '抽屉专属工位',
    description: '抽屉开合专属工位：橱柜基座与滑动顶层抽屉，无其他多余厨电。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: true,
    showFaucet: false
  },
  hob_island: {
    id: 'hob_island',
    name: '电磁炉岛台',
    description: '平底锅搬运专属工位：木色台面 + 嵌入式黑色电磁炉加热圈。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: false,
    showHob: true,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  cupboard_island: {
    id: 'cupboard_island',
    name: '高位吊柜工位',
    description: '吊柜操作专属工位：基座工作台 + 上方悬挂的大号双门吊柜。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: true,
    showDrawer: false,
    showFaucet: false
  },
  prep_island: {
    id: 'prep_island',
    name: '备餐与包装岛台',
    description: '物料搬运与包装专属工位：整洁工作台配合对应搬运目标物（瓦楞纸箱/托盘/餐盒）。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: false,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: false
  },
  faucet_island: {
    id: 'faucet_island',
    name: '水龙头调测台',
    description: '铰链阀门操作专属工位：下沉式不锈钢水槽与鹅颈出水龙头。',
    hasWorkSurface: true,
    counterTop: 'wood',
    showSink: true,
    showHob: false,
    showDishwasher: false,
    showWallCabinet: false,
    showDrawer: false,
    showFaucet: true
  }
};

/**
 * 任务 → 专属工位严格一一映射
 */
const TASK_WORKSTATION: Record<string, WorkstationId> = {
  // ── 目标定位 (3)：纯空旷场地 ──
  reach_target_single: 'open_arena',
  reach_target_multi_modal: 'open_arena',
  reach_target_dual: 'open_arena',
  reach_target: 'open_arena',

  // ── 桌面沥水架 (2)：白色沥水架专用桌 ──
  move_plate: 'rack_table',
  move_two_plates: 'rack_table',

  // ── 桌面细长/积木/翻杯 (3)：纯净操作台 ──
  flip_cutlery: 'tabletop_clean',
  stack_blocks: 'tabletop_clean',
  flip_cup: 'tabletop_clean',

  // ── 洗碗机 (4)：洗碗机机体与门板 ──
  dishwasher_close: 'dishwasher_unit',
  dishwasher_load_cups: 'dishwasher_unit',
  dishwasher_load_cutlery: 'dishwasher_unit',
  dishwasher_load_plates: 'dishwasher_unit',

  // ── 抽屉 (2)：仅抽屉橱柜 ──
  drawer_top_open: 'drawer_unit',
  drawer_top_close: 'drawer_unit',

  // ── 电磁灶台 (1)：仅电磁炉与锅 ──
  saucepan_to_hob: 'hob_island',

  // ── 上壁吊柜 (2)：上方悬挂大号吊柜 ──
  wall_cupboard_open: 'cupboard_island',
  wall_cupboard_close: 'cupboard_island',

  // ── 备餐取放 (3)：纸箱、双杯、三明治 ──
  pick_box: 'prep_island',
  pick_object: 'prep_island',
  put_cups: 'prep_island',
  sandwich_remove: 'prep_island',

  // ── 水龙头阀门 (1)：仅水槽与水龙头 ──
  turn_faucet: 'faucet_island',

  // ── 默认兜底 ──
  idle: 'prep_island',
  place_object: 'prep_island',
  raise_arm: 'prep_island'
};

export const getWorkstation = (action: ActionType): Workstation => {
  const id = TASK_WORKSTATION[action] ?? 'prep_island';
  return WORKSTATIONS[id];
};

export const ALL_WORKSTATIONS: Workstation[] = Object.values(WORKSTATIONS);
