import { SimReadyMeta } from '../types';

export interface SimReadyAssetItem {
  id: string;
  name: string;
  category: 'kitchenware' | 'appliances' | 'packaging' | 'cookware' | 'furniture' | 'optitrack' | 'industrial' | 'robotics';
  categoryLabel: string;
  usdAssetId: string;
  previewUrl: string;
  dimensions: [number, number, number]; // [width, height, depth] in meters
  weight: string;
  material: string;
  description: string;
  targetObjectId?: string;
  targetSceneId?: string;
  simReady: SimReadyMeta;
}

export const SIMREADY_CATEGORIES = [
  { id: 'all', label: '全部资产 (All)' },
  { id: 'kitchenware', label: '🍽️ 餐具器皿 (Tableware)' },
  { id: 'appliances', label: '🧼 厨房家电 (Appliances)' },
  { id: 'cookware', label: '🍳 烹饪食材 (Cookware & Food)' },
  { id: 'packaging', label: '📦 仓储包装 (Packaging)' },
  { id: 'furniture', label: '🪑 橱柜家具 (Furniture)' },
  { id: 'optitrack', label: '🎯 动捕标定 (OptiTrack)' },
  { id: 'industrial', label: '🏭 工业装配 (Industrial)' }
];

export const SIMREADY_CENTRAL_ASSETS: SimReadyAssetItem[] = [
  // ── 🍽️ 餐具器皿 (Tableware & Dishware) ───────────────────────────
  {
    id: 'simready_plate_02',
    name: '强化陶瓷西餐浅盘 (Ceramic Dinner Plate)',
    category: 'kitchenware',
    categoryLabel: '🍽️ 餐具器皿',
    usdAssetId: 'nvidia/simready:kitchen_ceramic_dinner_plate_02',
    previewUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.22, 0.024, 0.22],
    weight: '0.45 kg',
    material: '强化炻瓷 + 光滑白釉',
    description: 'BiGym 2.0 Move Plate 与 Move Two Plates 核心道具，严格标定碟沿倾斜角与碟底防滑圈。',
    targetObjectId: 'dish_plate',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_ceramic_dinner_plate_02',
      foundationCertified: true,
      category: 'Kitchenware / Tableware',
      massKg: 0.45,
      centerOfMass: [0, 0, 0.005],
      friction: { static: 0.58, dynamic: 0.42 },
      collisionType: 'ConvexHull',
      restitution: 0.03,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_wire_draining_rack_01',
    name: '双排立式金属丝沥水架 (Wire Draining Rack)',
    category: 'kitchenware',
    categoryLabel: '🍽️ 餐具器皿',
    usdAssetId: 'nvidia/simready:kitchen_stainless_wire_draining_rack_01',
    previewUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.26, 0.12, 0.16],
    weight: '0.65 kg',
    material: '304 不锈钢电镀铬金属丝',
    description: 'BiGym 2.0 经典双排梳齿沥水架，包含 6 组倒 U 型立杆插槽与 4 只抬升支脚。',
    targetObjectId: 'draining_rack_left',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_stainless_wire_draining_rack_01',
      foundationCertified: true,
      category: 'Kitchenware / Storage',
      massKg: 0.65,
      centerOfMass: [0, 0.04, 0],
      friction: { static: 0.45, dynamic: 0.35 },
      collisionType: 'CompoundBox',
      restitution: 0.05,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_coffee_mug_01',
    name: '陶瓷把手咖啡马克杯 (Ceramic Coffee Mug)',
    category: 'kitchenware',
    categoryLabel: '🍽️ 餐具器皿',
    usdAssetId: 'nvidia/simready:household_coffee_mug_ceramic_v1',
    previewUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.09, 0.11, 0.12],
    weight: '0.32 kg',
    material: '耐热高密度陶瓷 + 侧向弧形手柄',
    description: 'BiGym 2.0 Flip Cup（翻正杯子）及 Put Cups 核心道具，侧柄偏心质心力矩高精度校准。',
    targetObjectId: 'coffee_mug',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:household_coffee_mug_ceramic_v1',
      foundationCertified: true,
      category: 'Household / Drinkware',
      massKg: 0.32,
      centerOfMass: [0.015, -0.01, 0],
      friction: { static: 0.65, dynamic: 0.50 },
      collisionType: 'ConvexHull',
      restitution: 0.04,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_cutlery_fork_01',
    name: '不锈钢西餐精密餐叉 (Stainless Cutlery Fork)',
    category: 'kitchenware',
    categoryLabel: '🍽️ 餐具器皿',
    usdAssetId: 'nvidia/simready:kitchen_cutlery_fork_stainless_01',
    previewUrl: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.024, 0.012, 0.185],
    weight: '0.05 kg',
    material: '18/10 镜面抛光不锈钢',
    description: 'BiGym 2.0 Flip Cutlery 及 Dishwasher Load Cutlery 细长刚体抓取基准道具。',
    targetObjectId: 'metal_cutlery',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_cutlery_fork_stainless_01',
      foundationCertified: true,
      category: 'Kitchenware / Cutlery',
      massKg: 0.05,
      centerOfMass: [0, 0, -0.02],
      friction: { static: 0.42, dynamic: 0.30 },
      collisionType: 'ConvexHull',
      restitution: 0.08,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_cutlery_holder_01',
    name: '餐具收纳定位托架 (Cutlery Holder Tray)',
    category: 'kitchenware',
    categoryLabel: '🍽️ 餐具器皿',
    usdAssetId: 'nvidia/simready:kitchenware_cutlery_holder_tray_01',
    previewUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.07, 0.015, 0.20],
    weight: '0.18 kg',
    material: '工程级哑光 ABS 树脂',
    description: '为餐叉/餐勺提供防滚动精密卡槽定位，底座包含微吸盘防滑脚垫。',
    targetObjectId: 'cutlery_holder',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchenware_cutlery_holder_tray_01',
      foundationCertified: true,
      category: 'Kitchenware / Tray',
      massKg: 0.18,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.60, dynamic: 0.45 },
      collisionType: 'ConvexHull',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_stack_blocks_01',
    name: '标准六面装配积木对 (Precision Stacking Blocks)',
    category: 'industrial',
    categoryLabel: '🏭 工业装配',
    usdAssetId: 'nvidia/simready:industrial_calibration_cube_wood_01',
    previewUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.06, 0.06, 0.06],
    weight: '0.12 kg',
    material: '阳极氧化高刚性轻合金 (红/蓝两色标定)',
    description: 'BiGym 2.0 Stack Blocks 任务道具，验证末端执行器毫米级对位对准与堆叠平衡性。',
    targetObjectId: 'stack_block_a',
    targetSceneId: 'bigym_tabletop',
    simReady: {
      usdAssetId: 'nvidia/simready:industrial_calibration_cube_wood_01',
      foundationCertified: true,
      category: 'Industrial / Assembly',
      massKg: 0.12,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.60, dynamic: 0.48 },
      collisionType: 'ConvexHull',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },

  // ── 🧼 厨房家电 (Kitchen Appliances & Dishwasher) ────────────────
  {
    id: 'simready_dishwasher_02',
    name: '嵌入式重型智能洗碗机 (Dishwasher Appliance V2)',
    category: 'appliances',
    categoryLabel: '🧼 厨房家电',
    usdAssetId: 'nvidia/simready:kitchen_dishwasher_appliance_v2',
    previewUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.60, 0.82, 0.62],
    weight: '42.0 kg',
    material: '拉丝不锈钢内胆 + 阻尼下翻门板 + 上下双滑轨',
    description: 'BiGym 2.0 洗碗机四大基准任务专属机体，支持门板向地 0°~80° 连续推拉旋转闭锁。',
    targetObjectId: 'dishwasher_main',
    targetSceneId: 'bigym_dishwasher',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_dishwasher_appliance_v2',
      foundationCertified: true,
      category: 'Appliances / Dishwasher',
      massKg: 42.0,
      centerOfMass: [0, 0.38, -0.05],
      friction: { static: 0.50, dynamic: 0.40 },
      collisionType: 'CompoundBox',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_dishwasher_upper_basket',
    name: '洗碗机上层滑轨水杯碗篮 (Upper Cup Basket)',
    category: 'appliances',
    categoryLabel: '🧼 厨房家电',
    usdAssetId: 'nvidia/simready:dishwasher_upper_cup_basket_wire_01',
    previewUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.52, 0.08, 0.44],
    weight: '1.2 kg',
    material: '浸塑尼龙不锈钢丝架 + 滚轮滑轨',
    description: 'BiGym 2.0 Dishwasher Load Cups 任务载体，带有水杯倒插立柱阵列。',
    targetObjectId: 'dishwasher_upper_basket',
    targetSceneId: 'bigym_dishwasher',
    simReady: {
      usdAssetId: 'nvidia/simready:dishwasher_upper_cup_basket_wire_01',
      foundationCertified: true,
      category: 'Appliances / Accessories',
      massKg: 1.2,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.40, dynamic: 0.30 },
      collisionType: 'CompoundBox',
      restitution: 0.05,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_dishwasher_lower_rack',
    name: '洗碗机下层深槽餐盘架 (Lower Plate Rack)',
    category: 'appliances',
    categoryLabel: '🧼 厨房家电',
    usdAssetId: 'nvidia/simready:dishwasher_lower_plate_rack_wire_01',
    previewUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.54, 0.09, 0.46],
    weight: '1.6 kg',
    material: '重型加固镀镍钢丝',
    description: 'BiGym 2.0 Dishwasher Load Plates 任务载体，专供大直径陶瓷餐盘竖直斜插。',
    targetObjectId: 'dishwasher_lower_rack',
    targetSceneId: 'bigym_dishwasher',
    simReady: {
      usdAssetId: 'nvidia/simready:dishwasher_lower_plate_rack_wire_01',
      foundationCertified: true,
      category: 'Appliances / Accessories',
      massKg: 1.6,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.42, dynamic: 0.32 },
      collisionType: 'CompoundBox',
      restitution: 0.05,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_dishwasher_cutlery_caddy',
    name: '洗碗机网格筷笼收纳篮 (Cutlery Caddy Basket)',
    category: 'appliances',
    categoryLabel: '🧼 厨房家电',
    usdAssetId: 'nvidia/simready:dishwasher_cutlery_caddy_mesh_01',
    previewUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.08, 0.12, 0.14],
    weight: '0.22 kg',
    material: '耐温食品级聚丙烯 (PP)',
    description: 'BiGym 2.0 Dishwasher Load Cutlery 任务目标，验证机器人对高深径比狭长孔隙的精准插入。',
    targetObjectId: 'dishwasher_cutlery_caddy',
    targetSceneId: 'bigym_dishwasher',
    simReady: {
      usdAssetId: 'nvidia/simready:dishwasher_cutlery_caddy_mesh_01',
      foundationCertified: true,
      category: 'Appliances / Accessories',
      massKg: 0.22,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.55, dynamic: 0.40 },
      collisionType: 'ConvexHull',
      restitution: 0.03,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },

  // ── 🍳 烹饪食材 (Cookware & Food) ───────────────────────────────
  {
    id: 'simready_saucepan_01',
    name: '长柄不锈钢平底奶锅 (Stainless Steel Saucepan)',
    category: 'cookware',
    categoryLabel: '🍳 烹饪用具',
    usdAssetId: 'nvidia/simready:kitchenware_saucepan_stainless_01',
    previewUrl: 'https://images.unsplash.com/photo-1584990347449-39922c262a46?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.22, 0.08, 0.38],
    weight: '0.95 kg',
    material: '三层复合导磁不锈钢 + 防烫电木把手',
    description: 'BiGym 2.0 Saucepan to Hob 专属基准道具，测试握持偏心长臂力矩平稳度。',
    targetObjectId: 'saucepan',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchenware_saucepan_stainless_01',
      foundationCertified: true,
      category: 'Kitchenware / Cookware',
      massKg: 0.95,
      centerOfMass: [0, 0.02, 0.08],
      friction: { static: 0.52, dynamic: 0.38 },
      collisionType: 'ConvexHull',
      restitution: 0.04,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_frying_pan_01',
    name: '不粘涂层重型平底煎锅 (Heavy Frying Pan)',
    category: 'cookware',
    categoryLabel: '🍳 烹饪用具',
    usdAssetId: 'nvidia/simready:kitchenware_frying_pan_castiron_01',
    previewUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.24, 0.05, 0.42],
    weight: '1.40 kg',
    material: '压铸铝合金 + 麦饭石不粘陶瓷',
    description: 'BiGym 2.0 Sandwich Remove 任务容器，内部盛放待取出三明治。',
    targetObjectId: 'frying_pan',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchenware_frying_pan_castiron_01',
      foundationCertified: true,
      category: 'Kitchenware / Cookware',
      massKg: 1.40,
      centerOfMass: [0, 0.015, 0.09],
      friction: { static: 0.48, dynamic: 0.35 },
      collisionType: 'ConvexHull',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_sandwich_01',
    name: '多层食材多体接触三明治 (Multi-segment Sandwich)',
    category: 'cookware',
    categoryLabel: '🍳 烹饪食材',
    usdAssetId: 'nvidia/simready:food_sandwich_multisegment_01',
    previewUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.12, 0.05, 0.12],
    weight: '0.18 kg',
    material: '多层柔性硅胶复合 (吐司/熟火腿/切达干酪/生菜叶)',
    description: 'BiGym 2.0 柔性易损物体操作代表（Sandwich Remove），要求夹爪法向力 <= 4.5N。',
    targetObjectId: 'sandwich',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:food_sandwich_multisegment_01',
      foundationCertified: true,
      category: 'Food / Perishable',
      massKg: 0.18,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.70, dynamic: 0.50 },
      collisionType: 'ConvexHull',
      restitution: 0.01,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },

  // ── 📦 仓储包装 (Packaging & Logistics) ─────────────────────────
  {
    id: 'simready_carton_box_01',
    name: '标准瓦楞包装运输纸箱 (Corrugated Cardboard Box)',
    category: 'packaging',
    categoryLabel: '📦 仓储包装',
    usdAssetId: 'nvidia/simready:warehouse_carton_box_medium_01',
    previewUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.16, 0.14, 0.16],
    weight: '0.45 kg',
    material: '强化瓦楞纸板 (B-Flute) + 面单胶带',
    description: 'BiGym 2.0 核心 MVP 任务（Pick Box）专属道具，双臂协调抱持及侧桌向主台大角度回旋平移。',
    targetObjectId: 'pick_box',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:warehouse_carton_box_medium_01',
      foundationCertified: true,
      category: 'Warehouse / Packaging',
      massKg: 0.45,
      centerOfMass: [0, 0, 0.01],
      friction: { static: 0.72, dynamic: 0.55 },
      collisionType: 'ConvexHull',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_acrylic_tray_01',
    name: '目标落点视觉定位托盘 (Target Acrylic Tray)',
    category: 'packaging',
    categoryLabel: '📦 仓储包装',
    usdAssetId: 'nvidia/simready:industrial_steel_tray_square_01',
    previewUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.22, 0.02, 0.22],
    weight: '0.80 kg',
    material: '高对比度磨砂亚克力 + 激光视觉靶标',
    description: '放置终点目标区（Goal Region），搭载红绿激光位姿视觉标记，校验放置精度与偏摆角度。',
    targetObjectId: 'target_tray',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:industrial_steel_tray_square_01',
      foundationCertified: true,
      category: 'Industrial / Tray & Pallet',
      massKg: 0.80,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.45, dynamic: 0.35 },
      collisionType: 'ConvexHull',
      restitution: 0.06,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },

  // ── 🪑 橱柜家具 (Furniture & Cabinets) ──────────────────────────
  {
    id: 'simready_kitchen_island_01',
    name: '双色现代厨房料理岛台 (Kitchen Island Counter)',
    category: 'furniture',
    categoryLabel: '🪑 橱柜家具',
    usdAssetId: 'nvidia/simready:kitchen_island_counter_workbench_01',
    previewUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
    dimensions: [1.80, 0.76, 0.90],
    weight: '52.0 kg',
    material: '防静电木质饰面台面 + 极简白漆柜身',
    description: 'BiGym 2.0 台面标准高度严格标定为 Y = 0.760m，防穿模铁律边界基准。',
    targetObjectId: 'kitchen_island',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_island_counter_workbench_01',
      foundationCertified: true,
      category: 'Furniture / Kitchen Island',
      massKg: 52.0,
      centerOfMass: [0, 0.35, 0],
      friction: { static: 0.55, dynamic: 0.45 },
      collisionType: 'CompoundBox',
      restitution: 0.01,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_sliding_drawer_01',
    name: '滑动顶层导轨抽屉组件 (Sliding Top Drawer)',
    category: 'furniture',
    categoryLabel: '🪑 橱柜家具',
    usdAssetId: 'nvidia/simready:kitchen_cabinet_top_drawer_01',
    previewUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.55, 0.22, 0.42],
    weight: '3.8 kg',
    material: '三节阻尼钢珠滑轨 + 铝合金拉手',
    description: 'BiGym 2.0 Drawer Top Open/Close 核心道具，行程限位 180mm，拉脱力与推合力精准建模。',
    targetObjectId: 'sliding_drawer',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_cabinet_top_drawer_01',
      foundationCertified: true,
      category: 'Furniture / Cabinet Drawer',
      massKg: 3.8,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.25, dynamic: 0.15 },
      collisionType: 'CompoundBox',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },
  {
    id: 'simready_wall_cupboard_01',
    name: '厨房高位双开门吊柜 (Overhead Wall Cupboard)',
    category: 'furniture',
    categoryLabel: '🪑 橱柜家具',
    usdAssetId: 'nvidia/simready:kitchen_wall_cupboard_double_01',
    previewUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.90, 0.68, 0.36],
    weight: '18.5 kg',
    material: '防潮实木板材 + 磁吸阻尼铰链',
    description: 'BiGym 2.0 Wall Cupboard Open/Close 高位操作专属吊柜，悬空高度 Y = 1.40m ~ 2.10m。',
    targetObjectId: 'wall_cupboard',
    targetSceneId: 'bigym_kitchen_counter',
    simReady: {
      usdAssetId: 'nvidia/simready:kitchen_wall_cupboard_double_01',
      foundationCertified: true,
      category: 'Furniture / Wall Cabinet',
      massKg: 18.5,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.30, dynamic: 0.20 },
      collisionType: 'CompoundBox',
      restitution: 0.02,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  },

  // ── 🎯 动捕标定 (OptiTrack & Reaching) ───────────────────────────
  {
    id: 'simready_optitrack_sphere_01',
    name: '高反差空间动捕追踪标定球 (OptiTrack Target Sphere)',
    category: 'optitrack',
    categoryLabel: '🎯 动捕标定',
    usdAssetId: 'nvidia/simready:optitrack_motion_marker_sphere_01',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    dimensions: [0.06, 0.06, 0.06],
    weight: '0.10 kg',
    material: '光学哑光高反光复合物涂层 (红色)',
    description: 'BiGym 2.0 Target Reaching 空间运动学基准，测试末端执行器欧氏距离 <= 15mm 触达精度。',
    targetObjectId: 'reach_target',
    targetSceneId: 'bigym_reaching',
    simReady: {
      usdAssetId: 'nvidia/simready:optitrack_motion_marker_sphere_01',
      foundationCertified: true,
      category: 'Sensors / Calibration Target',
      massKg: 0.10,
      centerOfMass: [0, 0, 0],
      friction: { static: 0.80, dynamic: 0.60 },
      collisionType: 'ConvexHull',
      restitution: 0.05,
      hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
      usdFormat: 'OpenUSD (.usdc)',
      author: 'NVIDIA Omniverse SimReady Central'
    }
  }
];
