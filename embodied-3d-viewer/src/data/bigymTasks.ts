import { BiGymTask, BiGymTaskId } from '../types';

export const BIGYM_TASKS: BiGymTask[] = [
  // ── 目标定位 (Target Reaching, 3 tasks) ───────────────────────────────────
  {
    id: 'reach_target_single',
    name: '单目标空间精准触达',
    category: 'target_reaching',
    categoryName: '目标定位',
    description: 'BiGym 2.0 基础空间运动学评测：Unitree G1 左臂末端执行器由就绪姿态出发，快速平滑地触达桌面空域中的单点标定目标球。',
    sceneObjects: ['动态标定球 (Target Sphere)', 'G1 左臂 Dex1 夹爪'],
    goalState: '末端指尖触及目标球球心，停留时间 >= 0.5s',
    successCriteria: '末端中心距目标球心空间欧氏距离 <= 15mm',
    actionSteps: [
      '1. 双目相机捕捉目标点 3D 坐标',
      '2. WBC 全身控制器解算关节角度',
      '3. 左臂平滑伸展接近标定球',
      '4. 末端高精对齐并保持零位锁相'
    ],
    difficulty: 'Easy',
    officialBaselineSuccess: 100,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'reach_target_multi_modal',
    name: '多模态空间动态追踪',
    category: 'target_reaching',
    categoryName: '目标定位',
    description: 'BiGym 2.0 核心 MVP 任务：融合头部双目视觉与腕部手眼微距相机，自适应追踪空间中动态变轨的多模态目标球，验证抗扰动到达精度。',
    sceneObjects: ['多模态浮动目标球', '双目立体感知光斑', '手眼微距定位相框'],
    goalState: '空间动态变位连续 3 帧微距锁定并完成稳定触达',
    successCriteria: '空间跟踪残差 <= 10mm，持续追踪触达判定成功',
    actionSteps: [
      '1. 视觉伺服感知多模态浮动光标',
      '2. 手眼微距相机动态位姿补偿',
      '3. 躯干协同小幅俯仰优化工作空间',
      '4. 灵巧手触点接触完成判定'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 98,
    simulationSupported: true,
    isMvp: true
  },
  {
    id: 'reach_target_dual',
    name: '双臂协同双目标定点到达',
    category: 'target_reaching',
    categoryName: '目标定位',
    description: 'BiGym 2.0 双臂协同基准：左右臂分别向左右不同象限的目标点同步展开，检验左右半身对称动力学解耦与动态平衡。',
    sceneObjects: ['双向对称目标球', '双臂 Dex1-1 灵巧执行器'],
    goalState: '左右手腕同时到达双向目标球并保持全身重心配重平衡',
    successCriteria: '双侧末端到位时间差 <= 0.2s，双目标距离 <= 15mm',
    actionSteps: [
      '1. 双侧视场目标点联合标定',
      '2. 双臂协同逆运动学轨迹规划',
      '3. 左右臂对称展开前伸',
      '4. 双目标同步触碰达成'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 96,
    simulationSupported: true,
    isMvp: false
  },

  // ── 桌面操作 (Tabletop Manipulation, 5 tasks) ────────────────────────────
  {
    id: 'move_plate',
    name: '两架间移动餐盘 (Move Plate)',
    category: 'tabletop',
    categoryName: '桌面操作',
    description: 'BiGym 2.0 官方基准：在两个排水架之间移动托盘（Move the plate between two draining racks）。从左侧金属丝梳齿沥水架垂直抽出白色强化陶瓷餐盘，空中平移插放到右侧沥水架对应槽位。',
    sceneObjects: ['2x 金属丝梳齿沥水架 (Draining Racks)', '白色强化陶瓷餐盘 (Plate)', 'Unitree G1 Dex1 灵巧手'],
    goalState: '餐盘从左侧沥水架完全抽出，平移并插入右侧沥水架卡槽内稳定立置',
    successCriteria: '餐盘底部滑入目标沥水架卡槽，姿态倾角变化 <= 4°',
    actionSteps: [
      '1. 机械臂前伸对准左侧沥水架餐盘上边缘',
      '2. 指尖夹紧餐盘并竖直提升移出原卡槽',
      '3. 水平空中平移跨越至右侧沥水架上方',
      '4. 对准右侧卡槽平稳插入并脱开夹爪'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 88,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'move_two_plates',
    name: '双盘跨架同步转移 (Move Two Plates)',
    category: 'tabletop',
    categoryName: '桌面操作',
    description: 'BiGym 2.0 官方基准：同时移动两个盘子，从一个排水架转移到另一个排水架（Move two plates simultaneously from one draining rack to the other）。',
    sceneObjects: ['2x 金属丝梳齿沥水架', '2x 白色强化陶瓷餐盘', '双臂协同 Dex1-1 夹爪'],
    goalState: '两个餐盘从左侧沥水架同时/依序转移并插入右侧沥水架卡槽内',
    successCriteria: '双盘均正向就位在目标沥水架且无相互碰撞干涉',
    actionSteps: [
      '1. 双手分别对齐左侧沥水架相邻两个餐盘',
      '2. 双臂协同提取餐盘脱离左侧槽位',
      '3. 同步水平平移跨越至右侧目标沥水架',
      '4. 依次对准卡槽插入并闭环验证'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 76,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'flip_cup',
    name: '倒置陶瓷马克杯翻正 (Flip Cup)',
    category: 'tabletop',
    categoryName: '桌面操作',
    description: 'BiGym 2.0 官方基准：将杯子倒过来，使其处于直立状态（Flip the upside-down cup to an upright position）。右手侧向夹持倒扣马克杯，提起后手腕 Roll 关节 180° 反转，直立放回桌面。',
    sceneObjects: ['倒置陶瓷把手马克杯', '防滑工作台面', 'Dex1 右臂手腕'],
    goalState: '马克杯由倒置(180°)状态翻正为直立(0°)，杯口朝上',
    successCriteria: '杯底平稳贴合桌面，轴线垂直度偏差 <= 5°',
    actionSteps: [
      '1. 右手接近倒置水杯杯身',
      '2. 夹指闭合抱紧杯身外壁',
      '3. 提升 12cm 同时腕关节旋转 180°',
      '4. 垂直平稳降落台面，松指脱开'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 84,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'flip_cutlery',
    name: '托架餐具取出翻转放回 (Flip Cutlery)',
    category: 'tabletop',
    categoryName: '桌面操作',
    description: 'BiGym 2.0 官方基准：从托盘中取出餐具，将其翻转过来，然后放回原处（Take the cutlery from the holder, flip it, and place it back）。',
    sceneObjects: ['不锈钢餐叉 (Cutlery)', '餐具收纳托架 (Cutlery Holder)', '高精触觉指尖'],
    goalState: '餐叉从收纳托架内取出，手腕旋转 180° 完成翻转，平放归回托架内',
    successCriteria: '翻面法向量反转，平稳落回托架槽内，偏摆角 <= 10°',
    actionSteps: [
      '1. 机械臂接近收纳托架内的餐叉柄部',
      '2. 指尖夹取餐叉提升脱离托架',
      '3. 手腕 Roll 轴旋转 180° 完成餐具翻转',
      '4. 垂直对准托架落位放回'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 79,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'stack_blocks',
    name: '双立方体方块对准堆叠',
    category: 'tabletop',
    categoryName: '桌面操作',
    description: '高精装配基准：抓取上方绿色立方体，精确移至蓝色基础立方体正上方并对准放下，测试接触力传感与对位误差容忍度。',
    sceneObjects: ['绿色目标积木', '蓝色底座积木', '对准十字线'],
    goalState: '绿色积木垂直叠放在蓝色积木正上方且不倾倒',
    successCriteria: '顶块底面与底块顶面完全接触，中心水平对齐偏离 <= 10mm',
    actionSteps: [
      '1. 夹取绿色方块上升脱离桌面',
      '2. 水平对准底座方块中心',
      '3. 垂直下落至触碰受力反馈',
      '4. 轻柔脱开保持平衡'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 82,
    simulationSupported: true,
    isMvp: false
  },

  // ── 洗碗机操作 (Dishwasher Tasks, 4 tasks) ──────────────────────────────
  {
    id: 'dishwasher_close',
    name: '洗碗机仓门推合闭锁',
    category: 'dishwasher',
    categoryName: '洗碗机操作',
    description: '面对向下 80° 翻开的洗碗机重型门体，机器人双手或单手紧贴外表面向上推顶，顺应铰链弧度完成关门闭锁。',
    sceneObjects: ['洗碗机重型门体', '下沉阻尼铰链', '门把手组件'],
    goalState: '洗碗机门板由翻开状态旋转至 0° 垂直闭合状态',
    successCriteria: '门体闭合角度偏差 <= 2°，锁舌落锁反馈触发',
    actionSteps: [
      '1. 手臂伸向门体上沿接触点',
      '2. 躯干下蹲借力向上施推力',
      '3. 顺应圆弧轨迹推举门板上升',
      '4. 最终推压锁紧门扣'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 92,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'dishwasher_load_cups',
    name: '杯具装载入洗碗机上层',
    category: 'dishwasher',
    categoryName: '洗碗机操作',
    description: '从操作台拾取水杯，俯身探入洗碗机上层碗篮，将水杯倒插在碗架立柱上完成餐具清洗装载。',
    sceneObjects: ['马克杯', '洗碗机上层滑轨碗篮', '碗篮定位立柱'],
    goalState: '水杯稳固倒扣在上层碗篮支架内',
    successCriteria: '水杯落入网格槽内，无滑脱坠落',
    actionSteps: [
      '1. 桌面抓取水杯并微幅翻转',
      '2. 人形机器人侧身接近洗碗机',
      '3. 避开门框伸入手臂装载',
      '4. 确认稳固释放'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 75,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'dishwasher_load_cutlery',
    name: '餐具精准插入洗碗机筷笼',
    category: 'dishwasher',
    categoryName: '洗碗机操作',
    description: '拾取金属刀叉并倾斜伸入洗碗机餐具收纳篮（筷笼）细长孔隙，验证高深径比孔洞插入控制能力。',
    sceneObjects: ['餐具叉', '洗碗机塑料餐具蓝', '细孔收纳网'],
    goalState: '餐具柄朝下或朝上完全插入收纳格',
    successCriteria: '插入深度 >= 8cm，未卡在格栅边缘',
    actionSteps: [
      '1. 稳定夹持餐具后段',
      '2. 视觉对准筷笼开口格',
      '3. 倾斜对位顺滑插入',
      '4. 放手确认到位'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 71,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'dishwasher_load_plates',
    name: '餐盘对位装载入洗碗机下架',
    category: 'dishwasher',
    categoryName: '洗碗机操作',
    description: '双臂持盘俯身对准洗碗机下层大型碗篮齿状排位，将大直径餐盘斜向插入卡槽内。',
    sceneObjects: ['大号强化餐盘', '洗碗机下层滑架', '深部排架'],
    goalState: '餐盘倾斜卡入下层排架齿槽内且不碰撞内壁',
    successCriteria: '餐盘稳定立于两齿之间，重心稳固',
    actionSteps: [
      '1. 双手抱持大餐盘边缘',
      '2. 俯身深入洗碗机下层空腔',
      '3. 倾斜 15° 对齐排位间隙插下',
      '4. 释放双手平稳退出'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 78,
    simulationSupported: true,
    isMvp: false
  },

  // ── 厨房操作 (Kitchen Manipulation, 8 tasks) ────────────────────────────
  {
    id: 'drawer_top_open',
    name: '厨房顶层抽屉拉开',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: 'BiGym 2.0 核心 MVP 任务：右手接近厨房台面下方顶层抽屉的银色拉手，闭合抓握后沿导轨方向后拉，将抽屉平顺抽出。',
    sceneObjects: ['滑动顶层抽屉', '实木滑轨机构', '铝合金横置把手'],
    goalState: '顶层抽屉滑移拉出距离 >= 18cm',
    successCriteria: '抽屉位移 >= 180mm，末端未脱把手且无机械卡死',
    actionSteps: [
      '1. 右臂俯身伸向顶层抽屉把手',
      '2. 夹爪勾握住金属横杆',
      '3. 上身微后仰，沿 +Z 方向平拉导轨',
      '4. 抽出到位保持开启状态'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 94,
    simulationSupported: true,
    isMvp: true
  },
  {
    id: 'drawer_top_close',
    name: '开放抽屉推合归位',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: '针对拉开的厨房顶层抽屉，机器人利用掌心或指端正面推压抽屉面板，顺滑推回至闭合状态。',
    sceneObjects: ['开启状态抽屉', '阻尼滑轨', '防撞限位器'],
    goalState: '抽屉完全推合进入橱柜框架',
    successCriteria: '抽屉露出缝隙 <= 3mm，闭锁归位',
    actionSteps: [
      '1. 手掌面朝向抽屉外立面',
      '2. 接触面板施加水平推力',
      '3. 推压滑入直至碰到机械限位',
      '4. 回撤手臂'
    ],
    difficulty: 'Easy',
    officialBaselineSuccess: 95,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'pick_box',
    name: '侧桌纸箱搬至主台 (Pick Box)',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: 'BiGym 2.0 经典核心基准：从侧桌上拿起那个盒子，然后把它放在柜台上（Pick up the box from the side table and place it on the counter）。腰部由左侧侧桌大角度回旋平移，将瓦楞纸箱安放至主柜台目标托盘。',
    sceneObjects: ['瓦楞纸箱 (Box)', '侧桌 (Side Table)', '主操作柜台 (Counter)', '目标放置托盘 (Tray)'],
    goalState: '纸箱从侧桌安全拾起，腰部回旋平移，平稳居中放置在主柜台目标托盘上',
    successCriteria: '箱体底面平放于柜台托盘，与托盘中心偏离 <= 25mm，零碰撞穿模',
    actionSteps: [
      '1. 躯干前倾，腰部偏航左转对准侧桌上的纸箱',
      '2. 左右臂对称张开贴合纸箱侧壁抱起',
      '3. 躯干提拉，腰部由左向右平滑回旋转移至主柜台上方',
      '4. 垂直平稳放下至目标托盘并脱开夹爪'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 91,
    simulationSupported: true,
    isMvp: true
  },
  {
    id: 'put_cups',
    name: '双杯装箱配对收纳 (Put Cups)',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: 'BiGym 2.0 官方基准：把杯子从桌子上拿走，放入已经关闭的壁柜里（Pick up the cups from the table and put them into the closed wall cabinet）。连续依序拾取台面上的水杯放入储物单元。',
    sceneObjects: ['2x 陶瓷水杯 (Mugs)', '收纳储物柜 (Cabinet)'],
    goalState: '水杯从台面拾起并归入收纳柜指定储位',
    successCriteria: '水杯稳固置于柜格内且无碰撞倾倒',
    actionSteps: [
      '1. 拾取台面 1 号水杯并转运就位',
      '2. 转移手臂抓取 2 号水杯',
      '3. 平稳送入柜体对应储位',
      '4. 收手复位'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 80,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'saucepan_to_hob',
    name: '锅具搬运至电磁灶 (Saucepan to Hob)',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: 'BiGym 2.0 官方基准：把锅从封闭的柜子里取出来，然后放在炉子上（Take the saucepan from the closed cabinet and place it on the hob）。握持长柄平底锅平稳提升，横跨台面精准放置在电磁炉加热圈正中心。',
    sceneObjects: ['长柄平底锅 (Saucepan)', '嵌入式电磁炉 (Hob)', '环形加热指示圈'],
    goalState: '锅底平贴电磁炉，中心对齐加热圈',
    successCriteria: '锅底与加热圈中心偏差 <= 15mm，平稳无晃动',
    actionSteps: [
      '1. 右手掌心合拢扣紧锅柄中段',
      '2. 考虑力矩平衡平稳端起离台',
      '3. 水平平移至电磁炉加热圈正上方',
      '4. 垂直居中放下脱离'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 85,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'sandwich_remove',
    name: '从煎锅取出三明治 (Sandwich Remove)',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: 'BiGym 2.0 官方基准：将三明治从平底煎锅中取出（Remove the sandwich from the frying pan）。柔性力控夹取煎锅内的三明治，垂直提升越过锅壁后平移放置到备餐平盘上。',
    sceneObjects: ['多层三明治 (Sandwich)', '黑色平底煎锅 (Frying Pan)', '白色备餐平盘 (Plate)'],
    goalState: '三明治完全移出平底煎锅并平稳放置在备餐平盘上，压溃形变 <= 5%',
    successCriteria: '法向抓握力 <= 4.5N，成功转移且无掉落损坏',
    actionSteps: [
      '1. 视觉定位平底煎锅内三明治轮廓',
      '2. 柔性接触控制轻握三明治两侧',
      '3. 垂直提升 14cm 越过平底煎锅锅壁',
      '4. 水平平移至备餐平盘轻柔释放'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 89,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'wall_cupboard_open',
    name: '厨房上壁吊柜对开门开启',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: '高位操作基准：机器人向上举臂，勾住上方吊柜门底部拉手向外推转，展开柜门暴露内部储物格。',
    sceneObjects: ['壁挂式上吊柜', '双向磁吸合页', '高位下拉手'],
    goalState: '吊柜门旋转展开角度 >= 60°',
    successCriteria: '门板开度 >= 60°，脱离磁吸吸附',
    actionSteps: [
      '1. 右臂高位上扬触及吊柜把手',
      '2. 指钩勾住门拉手',
      '3. 沿铰链法向拉拽克服磁吸',
      '4. 持续外展直至开启 60°'
    ],
    difficulty: 'Hard',
    officialBaselineSuccess: 83,
    simulationSupported: true,
    isMvp: false
  },
  {
    id: 'wall_cupboard_close',
    name: '开放吊柜门合拢关紧',
    category: 'kitchen',
    categoryName: '厨房操作',
    description: '针对已处于展开状态的上方吊柜门，手臂推压柜门外缘反向回旋，直至吸附闭合。',
    sceneObjects: ['展开状态吊柜门', '门框磁吸片'],
    goalState: '吊柜门恢复垂直贴紧柜体',
    successCriteria: '门开度归零，磁吸声反馈就绪',
    actionSteps: [
      '1. 手指触碰开启门板边缘',
      '2. 施加向前弧形推力',
      '3. 压紧至吸附限位',
      '4. 回落手臂'
    ],
    difficulty: 'Medium',
    officialBaselineSuccess: 88,
    simulationSupported: true,
    isMvp: false
  }
];

export const TASK_CATEGORY_NAMES: Record<string, string> = {
  target_reaching: '🎯 目标定位 (3)',
  tabletop: '🍽️ 桌面操作 (5)',
  dishwasher: '🧼 洗碗机操作 (4)',
  kitchen: '🍳 厨房操作 (8)'
};
