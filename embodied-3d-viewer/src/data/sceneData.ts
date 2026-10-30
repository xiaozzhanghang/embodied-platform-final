import { SelectableObject, CameraPreset } from '../types';

export const SCENE_OBJECTS: Record<string, SelectableObject[]> = {
  kitchen_bigym: [
    {
      id: 'robot_g1',
      name: 'Unitree G1 人形具身机器人',
      category: 'robot',
      status: '伺服在线 · WBC全身控制',
      position: [0, 0, -0.14],
      rotation: [0, 0, 0],
      dimensions: [0.55, 1.32, 0.4],
      weight: '35.0 kg',
      material: '航空铝合金 + 碳纤维轻量壳体',
      isPlaceholder: false,
      modelSource: 'BiGym 2.0 规格 (Unitree G1 29-DOF + Dex1-1 灵巧双臂)',
      description: '搭载 Unitree 双臂 Dex1-1 灵巧夹爪手与 WBC 全身平衡控制器的具身智能人形机器人，专为家庭多任务操纵优化。',
      telemetry: {
        jointState: '29 关节伺服使能 · 零位锁相',
        temperature: '38.4 °C',
        batteryLevel: 94,
        payloadCapacity: '3.0 kg (单臂)',
        torque: '12.8 N·m (均值)',
        confidence: 0.998,
        lastUpdate: '实时 (60Hz)'
      }
    },
    {
      id: 'kitchen_table',
      name: '多功能厨房实验操作台',
      category: 'furniture',
      status: '就绪 · 静态刚体',
      position: [0, 0.38, -0.75],
      dimensions: [1.8, 0.76, 0.9],
      weight: '48.5 kg',
      material: '防静电木纹台面 + 铝型材支架',
      isPlaceholder: false,
      description: '提供平整稳定的机器人操作平面，表面具备高摩擦系数防滑涂层，便于物体抓取与视觉标定。',
      telemetry: {
        lastUpdate: '静态刚体'
      }
    },
    {
      id: 'dish_plate',
      name: '双排沥水架与餐盘 (Draining Rack & Plate)',
      category: 'manipulable',
      status: '可交互 · Move Plate 任务',
      position: [-0.04, 0.83, -0.38],
      dimensions: [0.22, 0.14, 0.16],
      weight: '0.45 kg',
      material: '实木餐架 + 强化陶瓷餐盘',
      isPlaceholder: false,
      modelSource: 'NVIDIA SimReady Central (OpenUSD)',
      description: 'BiGym 2.0 经典基准任务（Move Plate）：Unitree G1 人形机器人双臂协同从沥水架取盘并插放至相邻排位。',
      telemetry: {
        jointState: '双架位标定就绪',
        confidence: 0.996,
        lastUpdate: '视觉伺服就绪'
      },
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
        sourceImageMatchScore: 0.982,
        usdFormat: 'OpenUSD (.usdc)',
        author: 'NVIDIA Omniverse SimReady Central'
      }
    },
    {
      id: 'coffee_mug',
      name: '陶瓷把手马克杯 (Ceramic Mug)',
      category: 'manipulable',
      status: '可交互 · Flip Cup 任务',
      position: [0.12, 0.82, -0.36],
      dimensions: [0.09, 0.11, 0.09],
      weight: '0.32 kg',
      material: '光滑釉面陶瓷',
      isPlaceholder: false,
      modelSource: 'NVIDIA SimReady Central (OpenUSD)',
      description: 'BiGym 2.0 翻转水杯基准（Flip Cup）：将倒放的杯子翻正到直立状态，验证灵巧手侧向夹持与受力反馈。',
      telemetry: {
        jointState: '倒置待翻正',
        confidence: 0.985,
        lastUpdate: '视觉位姿跟踪'
      },
      simReady: {
        usdAssetId: 'nvidia/simready:household_coffee_mug_ceramic_v1',
        foundationCertified: true,
        category: 'Household / Drinkware',
        massKg: 0.32,
        centerOfMass: [0, -0.015, 0],
        friction: { static: 0.65, dynamic: 0.50 },
        collisionType: 'CompoundBox',
        restitution: 0.04,
        hfHubUrl: 'https://huggingface.co/datasets/nvidia/simready-assets',
        sourceImageMatchScore: 0.991,
        usdFormat: 'OpenUSD (.usdc)',
        author: 'NVIDIA Omniverse SimReady Central'
      }
    },
    {
      id: 'pick_box',
      name: '智能装配搬运箱 (Cardboard Box)',
      category: 'manipulable',
      status: '可交互 · Pick Box 任务',
      position: [-0.10, 0.83, -0.30],
      dimensions: [0.16, 0.14, 0.16],
      weight: '0.45 kg',
      material: '强化瓦楞纸板 / 封箱胶带',
      isPlaceholder: false,
      modelSource: 'NVIDIA SimReady Central (OpenUSD)',
      description: 'BiGym 2.0 经典基准（Pick Box）：双臂紧密贴合抱取瓦楞纸箱，腰部回旋平移放置到主柜台目标托盘。',
      telemetry: {
        jointState: '台面就绪待抓取',
        confidence: 0.998,
        lastUpdate: '双目空间定位'
      },
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
        sourceImageMatchScore: 0.996,
        usdFormat: 'OpenUSD (.usdc)',
        author: 'NVIDIA Omniverse SimReady Central'
      }
    },
    {
      id: 'target_tray',
      name: '目标放置托盘区 (Target Place Area)',
      category: 'manipulable',
      status: '放置目标区 · 待接收',
      position: [0.14, 0.77, -0.30],
      dimensions: [0.22, 0.02, 0.22],
      weight: '0.8 kg',
      material: '高对比度磨砂亚克力',
      isPlaceholder: false,
      modelSource: 'NVIDIA SimReady Central (OpenUSD)',
      description: '任务目标放置终点（Goal Region），搭载红绿激光位姿视觉标记，校验放置精度与稳定性。',
      telemetry: {
        jointState: '待接收物体',
        lastUpdate: '传感器锁相'
      },
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
        sourceImageMatchScore: 0.978,
        usdFormat: 'OpenUSD (.usdc)',
        author: 'NVIDIA Omniverse SimReady Central'
      }
    },
    {
      id: 'head_camera',
      name: '头部广角 RGB-D 传感器 (Head Cam)',
      category: 'sensor',
      status: '工作正常 · 84×84 深度流',
      position: [0, 1.28, -0.05],
      dimensions: [0.14, 0.06, 0.08],
      material: 'Intel RealSense 结构光传感器组',
      isPlaceholder: false,
      description: 'BiGym 2.0 策略核心主视觉输入视角（FOV 60°），提供场景全局俯瞰与点云重构。',
      telemetry: {
        jointState: '30 FPS · 硬件时钟对齐',
        temperature: '34.2 °C',
        confidence: 1.0,
        lastUpdate: '0.02ms 抖动'
      }
    },
    {
      id: 'wrist_camera',
      name: '右腕特写眼在手上相机 (Wrist Cam)',
      category: 'sensor',
      status: '工作正常 · 84×84 局部流',
      position: [0.32, 0.85, -0.3],
      dimensions: [0.08, 0.05, 0.05],
      material: '微型工业全局快门相机',
      isPlaceholder: false,
      description: '末端执行器近距视角（Eye-in-Hand），在闭环视觉伺服（Visual Servoing）中精准纠偏夹爪距离。',
      telemetry: {
        jointState: '60 FPS 局部高频流',
        confidence: 0.999,
        lastUpdate: '无时钟漂移'
      }
    },
    {
      id: 'reach_target',
      name: '动态标定追踪球 (Reach Target)',
      category: 'manipulable',
      status: '可交互 · Reach Target 任务',
      position: [-0.12, 0.96, -0.35],
      dimensions: [0.06, 0.06, 0.06],
      weight: '0.1 kg',
      material: '红色高对比哑光涂层',
      isPlaceholder: false,
      description: 'BiGym 2.0 基础控制基准（Reaching）：验证末端执行器（Wrist）对动态空间坐标的 3D 追踪到达精度。',
      telemetry: {
        jointState: '空间悬浮标定点',
        confidence: 0.999,
        lastUpdate: '高精定位'
      }
    },
    {
      id: 'kitchen_faucet',
      name: '厨房水龙头 (Kitchen Faucet)',
      category: 'manipulable',
      status: '可交互 · Turn Faucet 任务',
      position: [0.22, 0.81, -0.42],
      dimensions: [0.08, 0.25, 0.15],
      weight: '1.2 kg',
      material: '不锈钢 / 陶瓷阀芯',
      isPlaceholder: false,
      description: 'BiGym 2.0 厨房台面基准（Kitchen Counter）：机器人识别并旋开水龙头，测试复杂铰链机构操作。',
      telemetry: {
        jointState: '阀门闭合',
        confidence: 0.985,
        lastUpdate: '位姿锁定'
      }
    },
    {
      id: 'metal_cutlery',
      name: '不锈钢餐叉 (Metal Fork)',
      category: 'manipulable',
      status: '可交互 · Flip Cutlery 任务',
      position: [0.06, 0.79, -0.38],
      dimensions: [0.02, 0.015, 0.18],
      weight: '0.05 kg',
      material: '18/10 不锈钢',
      isPlaceholder: false,
      description: 'BiGym 2.0 翻转餐具基准（Flip Cutlery）：将平放的餐叉翻转为正确朝向，验证精密细长物体操控。',
      telemetry: {
        jointState: '平放待翻转',
        confidence: 0.988,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'stack_block_a',
      name: '红色堆叠积木 A (Block A)',
      category: 'manipulable',
      status: '可交互 · Stack Blocks 任务',
      position: [-0.08, 0.80, -0.40],
      dimensions: [0.06, 0.06, 0.06],
      weight: '0.12 kg',
      material: '高密度阳极氧化铝',
      isPlaceholder: false,
      description: 'BiGym 2.0 积木堆叠基准（Stack Blocks）：依次抓取多色标准块精确堆叠。',
      telemetry: {
        jointState: '6-DOF 自由浮动刚体',
        confidence: 0.995,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'stack_block_b',
      name: '蓝色堆叠积木 B (Block B)',
      category: 'manipulable',
      status: '可交互 · Stack Blocks 任务',
      position: [0.04, 0.80, -0.42],
      dimensions: [0.06, 0.06, 0.06],
      weight: '0.12 kg',
      material: '高密度阳极氧化铝',
      isPlaceholder: false,
      description: 'BiGym 2.0 积木堆叠基准（Stack Blocks）：需精确堆叠到红色积木 A 上方。',
      telemetry: {
        jointState: '6-DOF 自由浮动刚体',
        confidence: 0.995,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'saucepan',
      name: '不锈钢平底锅 (Saucepan)',
      category: 'manipulable',
      status: '可交互 · Saucepan to Hob 任务',
      position: [-0.14, 0.80, -0.38],
      dimensions: [0.22, 0.08, 0.22],
      weight: '0.95 kg',
      material: '三层复合不锈钢 + 电木手柄',
      isPlaceholder: false,
      description: 'BiGym 2.0 厨房操作基准（Saucepan to Hob）：抓握手柄将平底锅搬运至灶台加热位。',
      telemetry: {
        jointState: '台面放置',
        confidence: 0.992,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'stove_hob',
      name: '灶台加热位 (Stove Hob)',
      category: 'manipulable',
      status: '放置目标区 · 待接收',
      position: [0.20, 0.77, -0.42],
      dimensions: [0.24, 0.02, 0.24],
      weight: '固定',
      material: '黑色陶瓷面板',
      isPlaceholder: false,
      description: '平底锅任务的放置目标区域（灶台加热环）。',
      telemetry: {
        jointState: '待接收锅具',
        lastUpdate: '位置锁定'
      }
    },
    {
      id: 'sandwich',
      name: '三明治食品 (Sandwich)',
      category: 'manipulable',
      status: '可交互 · Sandwich Remove 任务',
      position: [-0.06, 0.79, -0.38],
      dimensions: [0.12, 0.05, 0.12],
      weight: '0.18 kg',
      material: '仿真食品级多层硅胶 (吐司/生菜/奶酪/火腿)',
      isPlaceholder: false,
      description: 'BiGym 2.0 柔性易损物体操作基准（Sandwich Remove）：力控抓取三明治移入外卖餐盒。',
      telemetry: {
        jointState: '餐盘内放置',
        confidence: 0.985,
        lastUpdate: '柔性接触力闭环'
      }
    },
    {
      id: 'meal_container',
      name: '打包保鲜盒 (Meal Prep Box)',
      category: 'manipulable',
      status: '放置目标区 · 待接收',
      position: [0.14, 0.78, -0.38],
      dimensions: [0.16, 0.05, 0.16],
      weight: '0.08 kg',
      material: '环保可降解纸质餐盒',
      isPlaceholder: false,
      description: '三明治转移任务的目标落点纸盒。',
      telemetry: {
        jointState: '餐盒开启待放入',
        lastUpdate: '位置锁定'
      }
    },
    {
      id: 'reach_target_right',
      name: '右侧协同标定球 (Right Target)',
      category: 'manipulable',
      status: '可交互 · Dual Reach 任务',
      position: [0.22, 0.96, -0.35],
      dimensions: [0.06, 0.06, 0.06],
      weight: '0.1 kg',
      material: '高对比度光学标定涂层',
      isPlaceholder: false,
      description: 'BiGym 2.0 双臂协同任务：右臂末端空间标定目标球。',
      telemetry: {
        jointState: '空间悬浮标定点',
        confidence: 0.998,
        lastUpdate: '高精定位'
      }
    },
    {
      id: 'dish_plate_2',
      name: '强化陶瓷副餐盘 (Second Plate)',
      category: 'manipulable',
      status: '可交互 · Move Two Plates 任务',
      position: [0.04, 0.83, -0.38],
      dimensions: [0.22, 0.03, 0.22],
      weight: '0.45 kg',
      material: '强化炻瓷',
      isPlaceholder: false,
      description: 'BiGym 2.0 双餐盘移位任务的第二块餐盘。',
      telemetry: {
        jointState: '沥水槽插置',
        confidence: 0.991,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'coffee_mug_2',
      name: '第二只咖啡杯 (Second Mug)',
      category: 'manipulable',
      status: '可交互 · Put Cups 任务',
      position: [-0.02, 0.82, -0.36],
      dimensions: [0.09, 0.12, 0.09],
      weight: '0.35 kg',
      material: '白瓷耐热陶瓷',
      isPlaceholder: false,
      description: 'BiGym 2.0 双杯收纳任务的第二只待收纳水杯。',
      telemetry: {
        jointState: '台面直立放置',
        confidence: 0.989,
        lastUpdate: '视觉位姿跟踪'
      }
    },
    {
      id: 'cups_tray',
      name: '双孔杯具木质托架 (Cups Tray)',
      category: 'manipulable',
      status: '放置目标区 · 待接收',
      position: [0.16, 0.77, -0.36],
      dimensions: [0.22, 0.03, 0.12],
      weight: '0.4 kg',
      material: '实木双孔卡槽托盘',
      isPlaceholder: false,
      description: 'BiGym 2.0 连续取放任务的双孔收纳托盘。',
      telemetry: {
        jointState: '双槽位就绪',
        lastUpdate: '位置锁定'
      }
    },
    {
      id: 'wall_cupboard',
      name: '厨房上部吊柜 (Wall Cupboard)',
      category: 'furniture',
      status: '可交互 · Cupboard 任务',
      position: [0.35, 1.35, -0.72],
      dimensions: [0.60, 0.45, 0.32],
      weight: '18.0 kg',
      material: '防潮实木板材 + 铝合金长把手',
      isPlaceholder: false,
      description: 'BiGym 2.0 高位操作基准（Wall Cupboard）：吊柜门装有阻尼合页与底部横置拉手。',
      telemetry: {
        jointState: '铰链合页就绪',
        confidence: 0.999,
        lastUpdate: '位姿锁定'
      }
    }
  ],

  industrial_bench: [
    {
      id: 'robot_g1',
      name: 'Unitree G1 工业调测版',
      category: 'robot',
      status: '产线协同 · 循环装配',
      position: [0, 0, 0],
      dimensions: [0.55, 1.32, 0.4],
      weight: '35.0 kg',
      material: '抗电磁干扰工业涂层',
      isPlaceholder: false,
      description: '部署于工业精密装配工作站的双臂机器人，执行四宫格料盒上料与缺陷物料分选。',
      telemetry: {
        jointState: '轨迹插值规划中',
        temperature: '41.1 °C',
        batteryLevel: 88,
        confidence: 0.995,
        lastUpdate: 'EtherCAT 1kHz'
      }
    },
    {
      id: 'industrial_table',
      name: '重型工业四宫格装配台',
      category: 'furniture',
      status: '刚体固定',
      position: [0, 0.45, -0.75],
      dimensions: [2.0, 0.9, 1.0],
      weight: '90 kg',
      material: '国标铸铁减震台',
      isPlaceholder: false,
      description: '带有标准化机械夹具接口和气动吸盘管路的工业级高刚性装配台。',
      telemetry: { lastUpdate: '静态刚体' }
    },
    {
      id: 'parts_box',
      name: '工业四宫格精密物料箱',
      category: 'manipulable',
      status: '物料就绪 (12/12)',
      position: [-0.3, 0.96, -0.7],
      dimensions: [0.3, 0.08, 0.25],
      weight: '1.8 kg',
      material: '防静电导电 PP',
      isPlaceholder: false,
      description: '装配标准螺栓与精密轴承套筒的模块化料盒。',
      telemetry: { confidence: 0.998, lastUpdate: 'RFID 识别' }
    },
    {
      id: 'sorting_bin',
      name: '合格品落料滑槽',
      category: 'manipulable',
      status: '待接收',
      position: [0.4, 0.92, -0.68],
      dimensions: [0.25, 0.2, 0.25],
      weight: '2.1 kg',
      material: '聚氨酯缓冲槽',
      isPlaceholder: false,
      description: '装配完成工件的自滑落检测通道。',
      telemetry: { lastUpdate: '红外光幕就绪' }
    }
  ],

  standard_arena: [
    {
      id: 'robot_g1',
      name: 'Unitree G1 基础评测机 (Baseline)',
      category: 'robot',
      status: '运动学标定完成',
      position: [0, 0, 0],
      dimensions: [0.55, 1.32, 0.4],
      weight: '35.0 kg',
      material: '标准合金标定件',
      isPlaceholder: false,
      description: '用于 BiGym 标准算法评测（ACT / DP / RL / Coding Agent）的零偏离基准人形机器人。',
      telemetry: {
        jointState: '零偏标定 PASS',
        batteryLevel: 99,
        confidence: 1.0,
        lastUpdate: '高精基准'
      }
    },
    {
      id: 'calibration_bench',
      name: '光学运动捕捉标定操作台',
      category: 'furniture',
      status: '光学标记阵列就绪',
      position: [0, 0.45, -0.75],
      dimensions: [1.6, 0.9, 0.8],
      weight: '35 kg',
      material: '低反光碳化纤维板',
      isPlaceholder: false,
      description: '贴附毫米级刻度与 Vicon 动捕反光球的精度评估工作台。',
      telemetry: { lastUpdate: '动捕对齐 < 0.1mm' }
    },
    {
      id: 'test_cube',
      name: '标准六面抓取标定块 (50mm)',
      category: 'manipulable',
      status: '待测量',
      position: [-0.15, 0.95, -0.7],
      dimensions: [0.12, 0.12, 0.12],
      weight: '0.25 kg',
      material: '阳极氧化铝',
      isPlaceholder: false,
      description: '标准测试刚体，用于末端执行器定位误差极限测试。',
      telemetry: { confidence: 1.0, lastUpdate: '激光测距' }
    }
  ]
};

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'overview',
    label: '三维全景 (3D Overview)',
    position: [1.20, 1.40, 0.90],
    target: [-0.05, 0.90, -0.30]
  },
  {
    id: 'robot_focus',
    label: '机器人正视 (Robot Front)',
    position: [0.0, 1.30, 1.55],
    target: [0, 1.00, -0.15]
  },
  {
    id: 'table_focus',
    label: '操作台俯角 (Workbench)',
    position: [0.2, 1.65, 0.45],
    target: [0.08, 0.85, -0.42]
  },
  {
    id: 'head_cam',
    label: '头部第一人称 (Head Cam)',
    position: [0.0, 1.28, 0.04],
    target: [0, 0.85, -0.55]
  },
  {
    id: 'top_down',
    label: '垂直俯视 (Top-Down)',
    position: [0.0, 2.45, -0.35],
    target: [0, 0.76, -0.40]
  },
  {
    id: 'side_view',
    label: '侧视防穿模 (Side Check)',
    position: [1.65, 1.15, -0.30],
    target: [0, 0.90, -0.30]
  }
];
