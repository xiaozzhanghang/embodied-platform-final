export type SceneId = 'kitchen_bigym' | 'industrial_bench' | 'standard_arena';

export type RobotModelType = 'spline_robot' | 'unitree_g1' | 'robot_expressive' | 'placeholder_geom';

export type TaskCategory = 'target_reaching' | 'tabletop' | 'dishwasher' | 'kitchen';

export type ExecutionMode = 'replay' | 'simulation';

export type BiGymTaskId =
  // 目标定位 (3)
  | 'reach_target_single'
  | 'reach_target_multi_modal'
  | 'reach_target_dual'
  // 桌面操作 (5)
  | 'move_plate'
  | 'move_two_plates'
  | 'flip_cup'
  | 'flip_cutlery'
  | 'stack_blocks'
  // 洗碗机操作 (4)
  | 'dishwasher_close'
  | 'dishwasher_load_cups'
  | 'dishwasher_load_cutlery'
  | 'dishwasher_load_plates'
  // 厨房操作 (8)
  | 'drawer_top_open'
  | 'drawer_top_close'
  | 'pick_box'
  | 'put_cups'
  | 'saucepan_to_hob'
  | 'sandwich_remove'
  | 'wall_cupboard_open'
  | 'wall_cupboard_close';

export type ActionType = BiGymTaskId | 'idle' | 'place_object' | 'raise_arm' | 'reach_target' | 'turn_faucet' | 'pick_object';

export interface BiGymTask {
  id: BiGymTaskId;
  name: string;
  category: TaskCategory;
  categoryName: string;
  description: string;
  sceneObjects: string[];
  goalState: string;
  successCriteria: string;
  actionSteps: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  officialBaselineSuccess: number;
  simulationSupported: boolean;
  isMvp: boolean;
}

export interface ObjectTelemetry {
  jointState?: string;
  temperature?: string;
  batteryLevel?: number;
  payloadCapacity?: string;
  torque?: string;
  confidence?: number;
  lastUpdate?: string;
}

export interface SelectableObject {
  id: string;
  name: string;
  category: 'robot' | 'furniture' | 'manipulable' | 'sensor' | 'structural';
  status: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  dimensions: [number, number, number];
  weight?: string;
  material?: string;
  isPlaceholder: boolean;
  modelSource?: string;
  description: string;
  telemetry?: ObjectTelemetry;
}

export interface CameraPreset {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface SimStateUpdate {
  connected: boolean;
  mode: ExecutionMode;
  taskId: string;
  simTime: number;
  stepCount: number;
  physicsHz: number;
  qpos?: number[];
  qvel?: number[];
  isSuccess: boolean;
  errorMetric: number; // in mm or m
  statusText: string;
  contactForce?: number;
}
