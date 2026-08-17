import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

export const COLUMNS = [
  "需求ID", "一级板块", "页面/功能域", "功能点", "需求描述",
  "前端与交互要求", "后端/API与数据要求", "业务规则与状态流",
  "异常、权限与边界", "验收标准", "依赖项", "优先级", "模块负责人",
  "预估工时(h)", "已投入工时(h)", "开发阶段", "开始日期",
  "计划完成日期", "实际完成日期", "测试结果", "对应页面/原型", "备注",
];

export const MODULES = [
  { name: "数据采集", prefix: "COL", owner: "数据采集负责人", table: "CollectionRequirements" },
  { name: "数据标注", prefix: "ANN", owner: "数据标注负责人", table: "AnnotationRequirements" },
  { name: "标注工作台", prefix: "WB", owner: "标注工作台负责人", table: "WorkbenchRequirements" },
  { name: "数据质检", prefix: "QA", owner: "数据质检负责人", table: "QualityRequirements" },
  { name: "模版中心", prefix: "TPL", owner: "模版中心负责人", table: "TemplateRequirements" },
];

const moduleMap = new Map(MODULES.map((module) => [module.name, module]));

function requirement(moduleName, index, config) {
  const module = moduleMap.get(moduleName);
  assert.ok(module, `unknown module ${moduleName}`);
  const id = `${module.prefix}-${String(index).padStart(3, "0")}`;
  return [
    id,
    moduleName,
    config.area,
    config.feature,
    config.description,
    config.front,
    config.back,
    config.rules,
    config.edge,
    config.accept,
    config.dep ?? "无",
    config.priority ?? "P1",
    module.owner,
    config.estimate,
    0,
    "待开始",
    null,
    null,
    null,
    "未测试",
    config.route,
    config.note ?? "按前端、后端、交互、联调和验收完整闭环交付。",
  ];
}

const collection = [
  requirement("数据采集", 1, {
    area: "采集任务列表", feature: "多维检索与重置", priority: "P0", estimate: 14,
    description: "支持按一级项目、二级项目、任务书、任务名称、任务ID、创建人、场景、用途、采集模式、遥操类型和设备类型组合查询采集任务。",
    front: "提供可清空筛选控件、查询和重置按钮；查询后保留条件，重置后恢复默认列表；加载、无结果和失败状态清晰可见。",
    back: "提供分页查询接口，支持全部筛选项组合、模糊匹配和稳定排序；返回总数、页码、任务摘要和状态。",
    rules: "筛选条件与分页共同生效；更改筛选项后回到第一页；返回详情后恢复原筛选和页码。",
    edge: "无权限项目不得出现在选项和结果中；非法枚举、超长关键词和接口超时需给出可恢复提示。",
    accept: "1. 任意单项和三项组合筛选结果正确。\n2. 重置后条件清空且列表恢复。\n3. 刷新或详情返回后筛选状态符合产品约定。\n4. 空结果、加载和失败均有明确反馈。",
    dep: "项目、任务书、设备和人员基础数据",
    route: "http://localhost:3000/collection/collection-tasks | src/app/collection/collection-tasks/page.js",
  }),
  requirement("数据采集", 2, {
    area: "采集任务列表", feature: "状态页签、分页与列配置", priority: "P0", estimate: 10,
    description: "列表按全部、进行中、已完成等状态页签切换，展示任务核心字段、采集进度并支持分页和列设置。",
    front: "页签数量与列表同步；进度、状态使用明确视觉编码；支持横向滚动、分页、刷新和列显隐配置。",
    back: "列表接口返回状态统计和分页数据；进度由目标采集数与完成采集数计算，避免前后端口径不一致。",
    rules: "页签状态与查询条件叠加；完成采集数不得大于目标数；刷新后保持当前页签。",
    edge: "总数为零时进度显示0%；字段为空显示统一占位；页码越界自动回到最后有效页。",
    accept: "1. 页签切换后状态和数量准确。\n2. 分页总数与接口一致。\n3. 进度计算及边界正确。\n4. 刷新和列设置不会造成错列或重复行。",
    dep: "COL-001",
    route: "http://localhost:3000/collection/collection-tasks | src/app/collection/collection-tasks/page.js",
  }),
  requirement("数据采集", 3, {
    area: "采集任务列表", feature: "查看、编辑、复制和删除", priority: "P0", estimate: 16,
    description: "每条采集任务提供查看详情、编辑、复制和删除入口，操作后列表和详情保持一致。",
    front: "查看进入详情；编辑回显现有数据；复制生成草稿并清除原ID；删除使用二次确认并展示影响提示。",
    back: "提供详情、更新、复制和删除接口；复制生成新任务ID；删除校验分包、采集数据、标注任务和质检引用。",
    rules: "进行中任务仅允许编辑安全字段；复制不继承执行进度；存在业务数据的任务禁止物理删除。",
    edge: "无权限、记录不存在、版本冲突和重复提交分别提示；删除失败不得从列表提前移除。",
    accept: "1. 四个入口均可达且权限正确。\n2. 编辑保存后刷新仍保留。\n3. 复制得到新ID且进度归零。\n4. 被引用任务删除被阻断并说明原因。",
    dep: "COL-001,COL-010,COL-015",
    route: "http://localhost:3000/collection/collection-tasks | src/app/collection/collection-tasks/page.js",
  }),
  requirement("数据采集", 4, {
    area: "新建采集任务", feature: "双模式创建向导", priority: "P0", estimate: 20,
    description: "新建任务支持“需要采集数据”和“关联数据资产/外部导入”两种模式，并按模式呈现对应配置。",
    front: "首屏选择创建模式；切换模式时保留共用字段、清理不兼容字段；向导显示当前步骤、返回、取消和提交状态。",
    back: "统一创建接口接收任务模式并执行不同校验；关联模式保存资产引用，采集模式保存设备和采集配置。",
    rules: "模式提交后不可随意切换；共用字段包括项目、任务书、名称、用途和场景；两模式生成统一任务主记录。",
    edge: "切换模式存在已填数据时二次确认；接口失败保留输入；防止重复点击生成两条任务。",
    accept: "1. 两种模式字段和校验不同且正确。\n2. 返回上一步不丢失有效输入。\n3. 提交只生成一条任务。\n4. 失败后可修改并重试。",
    dep: "项目、任务书、数据资产目录",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 5, {
    area: "新建采集任务", feature: "基础信息级联", priority: "P0", estimate: 14,
    description: "配置一级项目、二级项目、任务书、任务名称、英文名称、用途、场景和子场景，并保持上下级选项联动。",
    front: "父级改变后刷新并清空失效子级；必填、长度和命名格式即时提示；允许在授权范围内新增基础选项。",
    back: "提供项目、任务书、场景级联字典接口；校验任务名称、英文名称和业务标识唯一性。",
    rules: "二级项目属于所选一级项目；子场景属于所选场景；任务书必须适用于当前项目或设备。",
    edge: "字典加载失败可重试；失效选项不可提交；并发创建同名任务返回明确冲突。",
    accept: "1. 级联关系正确且无脏选项。\n2. 必填和格式校验定位到字段。\n3. 服务端再次校验非法组合。\n4. 保存后基础信息可正确回显。",
    dep: "COL-004、基础数据管理",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 6, {
    area: "新建采集任务", feature: "设备与采集参数配置", priority: "P0", estimate: 20,
    description: "配置采集模式、设备类型、实例SN、遥操类型、采集数量及设备部件的视频分辨率、帧率、质量、FOV和深度信息。",
    front: "设备类型改变后刷新部件表；参数支持受控编辑并展示单位；目标采集量为正整数。",
    back: "查询可用设备和部件能力；保存任务设备快照和参数；校验设备在线、未占用且能力范围匹配。",
    rules: "实例SN必须属于设备类型；参数不得超出设备能力；采集数量决定后续分包上限。",
    edge: "设备离线、占用冲突、参数越界和保存中设备状态变化时阻断提交。",
    accept: "1. 设备与实例级联正确。\n2. 部件参数按能力范围校验。\n3. 冲突设备不可提交。\n4. 保存后详情展示同一参数快照。",
    dep: "COL-005、设备管理",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 7, {
    area: "新建采集任务", feature: "关联数据资产与Episode选择", priority: "P1", estimate: 18,
    description: "关联模式支持选择已有数据资产包并勾选可用Episode，自动带出来源项目、设备、采集时间、帧数、大小和质检状态。",
    front: "选择数据源后加载Episode表格；支持勾选、全选、数量统计和已选摘要；不合格数据不可选择。",
    back: "提供可标注资产查询和Episode明细接口；提交时锁定选择并建立任务到资产的引用关系。",
    rules: "同一Episode在互斥任务中不可重复占用；仅已解析且质检通过的数据可进入后续流程。",
    edge: "数据已被其他任务抢占、资产下线或选择为空时阻断提交并刷新可用列表。",
    accept: "1. 数据源和Episode联动正确。\n2. 不可用数据禁选并说明原因。\n3. 并发占用冲突可识别。\n4. 保存后引用关系刷新仍存在。",
    dep: "COL-004、数据资产目录",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 8, {
    area: "SOP编排", feature: "导入动作模版", priority: "P1", estimate: 12,
    description: "新建或编辑采集任务时可选择动作模版，一键导入执行末端、原子技能、对象、目标和默认帧区间。",
    front: "展示可用模版、步骤数量和适配设备；导入前预览，已有步骤时确认覆盖或追加。",
    back: "提供动作模版详情接口；导入时复制模版版本快照到任务，避免后续模版修改影响已创建任务。",
    rules: "仅显示适配当前设备和任务类型的已启用模版；导入结果可继续编辑。",
    edge: "模版已停用、版本变化或步骤为空时阻断并提示重新选择。",
    accept: "1. 模版筛选与当前设备匹配。\n2. 覆盖和追加行为符合选择。\n3. 导入字段完整。\n4. 原模版变化不影响任务快照。",
    dep: "COL-006,TPL-006,TPL-007",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 9, {
    area: "SOP编排", feature: "动作步骤增删排序与帧推算", priority: "P0", estimate: 20,
    description: "支持新增、删除、拖拽排序SOP步骤，配置执行末端、原子技能、操作对象、目标及起止帧。",
    front: "步骤表格可编辑；新增步骤默认从上一步结束帧开始并增加300帧；排序后重算序号，删除需确认。",
    back: "保存有序步骤数组和稳定步骤ID；服务端校验必填、帧区间和步骤顺序并保存版本。",
    rules: "起始帧不得大于结束帧；步骤默认不重叠；自然语言解析结果也必须通过同一校验。",
    edge: "空步骤、重复步骤ID、负帧、越界帧和并发版本冲突需阻断。",
    accept: "1. 增删改排均可保存。\n2. 默认帧推算正确。\n3. 非法区间前后端均拦截。\n4. 刷新后顺序和帧值保持。",
    dep: "COL-008",
    route: "http://localhost:3000/collection/collection-tasks/create | src/app/collection/collection-tasks/create/page.js",
  }),
  requirement("数据采集", 10, {
    area: "任务详情", feature: "基础信息、统计卡片与进度", priority: "P0", estimate: 16,
    description: "详情展示任务基础信息、任务书、设备、目标量、完成量、整体进度、状态和更新时间。",
    front: "顶部统计卡片展示目标、完成、进行中和异常；信息分区清晰，支持返回并保留列表上下文。",
    back: "详情接口聚合任务、设备、分包、采集记录和进度；统计口径由服务端统一计算。",
    rules: "整体完成量由有效分包完成量汇总；异常或已删除数据不计入有效完成量。",
    edge: "任务不存在、无权限或部分关联数据缺失时展示友好错误与可用信息。",
    accept: "1. 详情字段与创建数据一致。\n2. 统计与分包汇总一致。\n3. 返回列表保留筛选页码。\n4. 刷新后数据不丢失。",
    dep: "COL-001,COL-011",
    route: "http://localhost:3000/collection/tasks/COLL-20260415-001 | src/app/collection/tasks/[id]/page.js",
  }),
  requirement("数据采集", 11, {
    area: "任务详情", feature: "分包新增、编辑与暂停", priority: "P0", estimate: 22,
    description: "在任务详情中新增或编辑分包，设置编号、负责人、计划采集量、交付时间、设备要求和备注，并支持暂停。",
    front: "独立分包区域展示编号、负责人、计划/完成量、进度和状态；新增编辑使用表单；暂停二次确认。",
    back: "提供分包增改查和状态变更接口；保证分包计划量汇总不超过任务目标；记录版本和操作日志。",
    rules: "有采集数据的分包不可删除；暂停后禁止继续录入但保留已采数据；恢复需权限。",
    edge: "计划量超限、负责人不可用、设备冲突和并发编辑时阻断并返回最新状态。",
    accept: "1. 分包增改后列表立即更新。\n2. 计划量汇总校验正确。\n3. 暂停后录入被阻断。\n4. 日志可追踪操作者和前后值。",
    dep: "COL-010、人员和设备管理",
    route: "http://localhost:3000/collection/tasks/COLL-20260415-001 | src/app/collection/tasks/[id]/page.js",
  }),
  requirement("数据采集", 12, {
    area: "任务详情", feature: "采集员、标注员、审核员和质检员配给", priority: "P0", estimate: 18,
    description: "支持按任务或分包配置采集员、标注员、审核员和质检员，并展示当前分配情况。",
    front: "分配弹窗显示选中对象数量、角色选择和人员可用状态；修改时回显已有人员。",
    back: "按角色和项目权限查询候选人员；保存任务/分包角色关系并发送待办或通知。",
    rules: "同一人员可否兼任按角色规则判断；停用人员不可新分配；修改不丢失历史记录。",
    edge: "无候选人员、人员被停用、重复分配和越权分配分别阻断并说明。",
    accept: "1. 候选列表符合角色和项目。\n2. 保存后列表详情一致。\n3. 修改记录保留历史。\n4. 越权接口调用被拒绝。",
    dep: "COL-011、用户权限",
    route: "http://localhost:3000/collection/tasks/COLL-20260415-001 | src/app/collection/tasks/[id]/page.js",
  }),
  requirement("数据采集", 13, {
    area: "任务详情", feature: "批量添加标注配置", priority: "P0", estimate: 18,
    description: "勾选一个或多个分包后批量配置点、框、范围或混合标注模式，并指派标注审核流。",
    front: "批量按钮仅在选中后启用；弹窗显示分包和数据量摘要，支持标注类型、模版和人员配置。",
    back: "校验分包数据可标注性，批量建立标注配置和人员关系，使用事务保证全部成功或全部回滚。",
    rules: "已存在标注任务时按产品规则合并或阻断；同批次配置保持一致且可追踪来源。",
    edge: "混入不可用分包、重复提交、部分失败和权限不足时不产生半完成数据。",
    accept: "1. 未选择时按钮禁用。\n2. 批量范围和数据量准确。\n3. 事务失败无残留。\n4. 生成配置可在数据标注模块追溯。",
    dep: "COL-011,COL-012,ANN-005",
    route: "http://localhost:3000/collection/tasks/COLL-20260415-001 | src/app/collection/tasks/[id]/page.js",
  }),
  requirement("数据采集", 14, {
    area: "任务详情", feature: "批量完成与不足量阻断", priority: "P0", estimate: 16,
    description: "批量完成分包时执行实际采集量前置校验；不足计划量必须填写原因，确认后才能完成并流转。",
    front: "完成弹窗展示计划量、实际量和差值；不足时原因必填并阻断提交；正常完成显示影响范围。",
    back: "服务端重新计算有效采集量，保存完成原因和操作者，更新分包与任务状态并触发后续流程。",
    rules: "实际量达到计划量可直接完成；不足量需具备例外权限或完整原因；完成操作幂等。",
    edge: "数据量在弹窗打开后变化、重复点击或后续任务已生成时返回最新结果，不重复流转。",
    accept: "1. 足量完成成功。\n2. 不足且无原因被阻断。\n3. 原因写入日志。\n4. 重复请求不重复生成后续任务。",
    dep: "COL-011,COL-016",
    route: "http://localhost:3000/collection/tasks/COLL-20260415-001 | src/app/collection/tasks/[id]/page.js",
  }),
  requirement("数据采集", 15, {
    area: "任务安全", feature: "删除与引用保护", priority: "P0", estimate: 12,
    description: "删除任务、分包或采集记录前校验分包、数据资产、质检和标注引用，防止误删有效业务数据。",
    front: "危险操作使用二次确认并说明引用影响；禁止删除时展示引用类型和处理建议。",
    back: "删除接口执行引用校验、权限校验和审计；优先软删除，业务引用存在时拒绝。",
    rules: "已产生有效数据或下游任务的记录不得物理删除；管理员也必须留下审计记录。",
    edge: "并发创建引用时以服务端事务结果为准；删除失败不改变前端状态。",
    accept: "1. 无引用草稿可删除。\n2. 有引用记录被阻断。\n3. 软删除不再出现在默认列表。\n4. 审计记录完整。",
    dep: "COL-003,COL-011,ANN-005",
    route: "http://localhost:3000/collection/collection-tasks | src/app/collection/collection-tasks/page.js",
  }),
  requirement("数据采集", 16, {
    area: "跨模块流转", feature: "采集完成生成数据标注任务", priority: "P0", estimate: 20,
    description: "采集任务或分包完成后，根据标注配置自动生成或关联数据标注任务，并保留来源关系。",
    front: "完成成功后提示生成的标注任务ID，可直接前往数据标注；详情展示下游任务状态。",
    back: "以幂等事件创建ANN任务和来源关联，复制项目、任务书、Episode、SOP和人员配置，记录流转日志。",
    rules: "同一来源和配置只生成一个有效标注任务；无需标注时明确记录跳过原因。",
    edge: "下游创建失败时采集完成状态与待重试事件可追踪；重试不得生成重复任务。",
    accept: "1. 完成后生成正确ANN任务。\n2. 来源与Episode关联完整。\n3. 失败可安全重试。\n4. 前后模块状态一致。",
    dep: "COL-013,COL-014,ANN-005",
    route: "http://localhost:3000/collection/collection-tasks | src/app/collection/collection-tasks/page.js",
  }),
  requirement("数据采集", 17, {
    area: "模块通用", feature: "权限、审计、幂等与刷新恢复", priority: "P0", estimate: 18,
    description: "数据采集模块所有读写操作统一执行项目权限、角色权限、幂等控制、审计记录和刷新恢复。",
    front: "无权限入口隐藏或禁用并解释原因；提交中防重复；刷新后从服务端恢复真实状态而非仅保留本地假数据。",
    back: "接口层强制鉴权；写操作接收幂等键；审计记录操作者、对象、前后值、时间和结果。",
    rules: "前端权限只改善体验，服务端权限是最终边界；本地缓存不得覆盖服务端较新版本。",
    edge: "登录过期、网络中断、重放请求和版本冲突都有明确恢复路径。",
    accept: "1. 越权接口返回拒绝。\n2. 重复提交只产生一次写入。\n3. 刷新后状态与服务端一致。\n4. 关键动作均可审计。",
    dep: "COL-001至COL-016、统一认证与审计",
    route: "src/app/collection/collection-tasks/page.js | src/app/collection/tasks/[id]/page.js",
  }),
];

const annotation = [
  requirement("数据标注", 1, {
    area: "标注任务列表", feature: "多维检索与重置", priority: "P0", estimate: 12,
    description: "支持按项目、任务书、任务名称、任务ID、标注员、审核员、场景和状态组合查询标注任务。",
    front: "查询控件可清空；保留条件；重置恢复默认；加载、空结果和失败状态完整。",
    back: "提供权限过滤的分页查询，返回任务摘要、来源采集任务、人员、数量、进度和状态。",
    rules: "筛选与状态页签叠加；条件变化回到第一页；详情返回恢复上下文。",
    edge: "非法条件、无权限项目和接口超时不泄露数据并可重试。",
    accept: "1. 单项和组合筛选正确。\n2. 重置恢复全部授权数据。\n3. 分页总数准确。\n4. 失败和空状态明确。",
    dep: "项目、任务书、用户权限",
    route: "http://localhost:3000/collection/annotation-tasks | src/app/collection/annotation-tasks/page.js",
  }),
  requirement("数据标注", 2, {
    area: "标注任务列表", feature: "状态页签、字段与进度", priority: "P0", estimate: 10,
    description: "按全部、进行中、已完成展示标注任务，显示来源任务、计划标注数、已完成数、状态和进度。",
    front: "状态标签、进度和数量可读；支持分页、刷新、列设置和横向滚动。",
    back: "服务端统一计算标注和审核进度，返回状态统计和分页数据。",
    rules: "标注完成不等于审核完成；任务最终完成需满足配置的审核规则。",
    edge: "计划数为零、进度数据延迟或部分Episode异常时使用明确口径。",
    accept: "1. 页签数量正确。\n2. 标注与审核进度不混用。\n3. 分页刷新稳定。\n4. 异常数据有可解释状态。",
    dep: "ANN-001",
    route: "http://localhost:3000/collection/annotation-tasks | src/app/collection/annotation-tasks/page.js",
  }),
  requirement("数据标注", 3, {
    area: "标注任务列表", feature: "查看、编辑、复制和删除", priority: "P1", estimate: 14,
    description: "提供查看详情、编辑、复制和删除操作，并按任务状态限制可修改字段和删除行为。",
    front: "编辑回显；复制清除原任务ID和执行进度；删除二次确认并展示影响。",
    back: "提供详情、更新、复制和删除接口；校验Episode、标注结果、审核记录和模版引用。",
    rules: "已开始标注的任务不可修改数据范围；复制生成独立任务；有结果任务不可物理删除。",
    edge: "版本冲突、无权限、记录不存在和重复操作分别处理。",
    accept: "1. 操作权限随状态变化。\n2. 编辑刷新后保留。\n3. 复制ID独立。\n4. 有结果任务删除被阻断。",
    dep: "ANN-001,ANN-010",
    route: "http://localhost:3000/collection/annotation-tasks | src/app/collection/annotation-tasks/page.js",
  }),
  requirement("数据标注", 4, {
    area: "标注任务列表", feature: "批量分派标注员和审核员", priority: "P0", estimate: 14,
    description: "勾选一个或多个标注任务后批量分派或修改标注员、审核员。",
    front: "未选择时按钮禁用；弹窗显示任务数量、人员角色和现有分配；提交结果逐项反馈。",
    back: "校验人员角色、项目权限和任务状态，事务保存人员关系并生成待办。",
    rules: "已完成任务不可重新分派；进行中修改需保留历史；审核员不可选择无审核权限人员。",
    edge: "部分任务不可分派时默认整体阻断并列出原因，避免不一致。",
    accept: "1. 批量范围准确。\n2. 候选人员符合权限。\n3. 保存后列表详情一致。\n4. 历史分配可追溯。",
    dep: "ANN-001、用户权限",
    route: "http://localhost:3000/collection/annotation-tasks | src/app/collection/annotation-tasks/page.js",
  }),
  requirement("数据标注", 5, {
    area: "新建标注任务", feature: "关联采集数据或数据资产", priority: "P0", estimate: 20,
    description: "从已完成采集任务、数据资产或外部导入数据创建标注任务，并保留数据来源。",
    front: "选择来源后自动带出项目、任务书、设备、数据量和SOP；展示来源状态和可用数量。",
    back: "提供可标注来源查询，建立任务、来源和Episode关系并锁定数据；支持COL流转事件幂等创建。",
    rules: "仅已解析且满足质检门槛的数据可选；同一数据按互斥规则防止重复占用。",
    edge: "来源下线、并发占用、无可用数据和重复流转时阻断或返回已有任务。",
    accept: "1. 三类来源可区分。\n2. 带出字段准确。\n3. 重复创建不产生重复占用。\n4. 来源链路可追溯。",
    dep: "COL-007,COL-016、数据资产目录",
    route: "http://localhost:3000/collection/annotation-tasks/create | src/app/collection/annotation-tasks/create/page.js",
  }),
  requirement("数据标注", 6, {
    area: "新建标注任务", feature: "基础信息、任务书和标注模版联动", priority: "P0", estimate: 14,
    description: "配置项目、标注任务名称、英文名称、用途、场景、子场景、任务书或标注模版。",
    front: "父子选项级联；必填和格式校验；任务书/标注模版显示适用范围并可清除重选。",
    back: "提供级联字典、任务书和标注模版查询；校验名称唯一和适配关系。",
    rules: "模版适用设备、场景和标注类型必须与任务一致；保存模版版本快照。",
    edge: "失效模版、非法组合和同名任务在前后端均阻断。",
    accept: "1. 级联选项正确。\n2. 适配过滤生效。\n3. 服务端拒绝非法组合。\n4. 保存后回显一致。",
    dep: "ANN-005,TPL-008,TPL-009",
    route: "http://localhost:3000/collection/annotation-tasks/create | src/app/collection/annotation-tasks/create/page.js",
  }),
  requirement("数据标注", 7, {
    area: "新建标注任务", feature: "Episode筛选与明细选择", priority: "P0", estimate: 16,
    description: "展示来源数据中的Episode明细，支持按状态、设备、时间和关键词筛选并勾选标注范围。",
    front: "表格展示Episode ID、名称、时间、帧数、大小和质检状态；支持分页、全选当前页和已选摘要。",
    back: "分页返回可标注Episode及可用原因；提交时校验选择集合仍可用并建立快照。",
    rules: "全选只作用于明确范围；禁选不合格、解析中或已互斥占用的Episode。",
    edge: "跨页选择、数据状态变化和选择项被移除时同步修正并提示。",
    accept: "1. 明细字段完整。\n2. 筛选和跨页选择正确。\n3. 禁选原因明确。\n4. 提交集合与已选摘要一致。",
    dep: "ANN-005",
    route: "http://localhost:3000/collection/annotation-tasks/create | src/app/collection/annotation-tasks/create/page.js",
  }),
  requirement("数据标注", 8, {
    area: "新建标注任务", feature: "数量输入与勾选双向联动", priority: "P1", estimate: 12,
    description: "计划标注数量与Episode勾选列表双向联动，输入数量自动选择，手动勾选同步更新数量。",
    front: "数量输入限制在可用数据范围；自动选择遵循稳定排序；手动取消后数量实时变化。",
    back: "提交仅信任Episode ID集合并重新计算数量，不接受前端孤立计数。",
    rules: "计划数量等于最终选择数量；自动选择默认从排序后的首条开始。",
    edge: "输入空、零、负数、超量或可用数据变化时校正并提示。",
    accept: "1. 两个方向联动无延迟。\n2. 超量被限制。\n3. 跨页选择计数正确。\n4. 服务端数量以集合为准。",
    dep: "ANN-007",
    route: "http://localhost:3000/collection/annotation-tasks/create | src/app/collection/annotation-tasks/create/page.js",
  }),
  requirement("数据标注", 9, {
    area: "新建标注任务", feature: "标注类型、SOP和动作模版", priority: "P0", estimate: 18,
    description: "配置点、框、范围、语义或混合标注类型，继承或导入SOP动作步骤并允许任务级调整。",
    front: "按标注类型展示相应配置；支持导入动作模版、预览步骤和帧范围；冲突配置即时提示。",
    back: "保存标注类型、工具配置和步骤版本快照；校验数据模态支持所选标注方式。",
    rules: "混合标注明确每种类型的适用视角和对象；任务创建后修改类型需评估已有结果。",
    edge: "数据无对应视角、模版失效或配置互斥时阻断提交。",
    accept: "1. 类型切换配置正确。\n2. 模版导入字段完整。\n3. 数据能力校验生效。\n4. 工作台读取同一配置。",
    dep: "ANN-006,ANN-007,TPL-006",
    route: "http://localhost:3000/collection/annotation-tasks/create | src/app/collection/annotation-tasks/create/page.js",
  }),
  requirement("数据标注", 10, {
    area: "标注任务详情", feature: "数据包、Episode和状态管理", priority: "P0", estimate: 20,
    description: "详情展示任务基础信息、来源、人员、数据包和Episode列表，以及待标注、标注中、待审核和已完成状态。",
    front: "统计卡片与状态页签联动；列表可进入工作台；返回后保持页签和分页。",
    back: "聚合任务、包、Episode、结果和审核状态；提供分页明细和状态统计。",
    rules: "Episode状态驱动包进度，包进度驱动任务进度；标注和审核状态分开记录。",
    edge: "部分结果损坏、人员失效和数据被撤回时展示异常并禁止错误流转。",
    accept: "1. 统计与明细一致。\n2. 状态流正确。\n3. 工作台跳转携带正确ID。\n4. 刷新后状态持久化。",
    dep: "ANN-005,ANN-009,WB-001",
    route: "http://localhost:3000/annotation/audit/ANNO-001 | src/app/annotation/audit/[id]/page.js",
  }),
  requirement("数据标注", 11, {
    area: "标注任务详情", feature: "人员与进度汇总", priority: "P1", estimate: 14,
    description: "按标注员、审核员、数据包和标注类型汇总分配数量、完成数量、审核数量和异常数量。",
    front: "以表格或统计卡展示个人和包级进度，支持查看未完成和异常明细。",
    back: "聚合分配和结果数据，提供稳定统计口径；大数据量使用分页或预聚合。",
    rules: "转派后历史工作量保留原人员，待办工作量归新人员；异常数据不计完成。",
    edge: "人员离职、重复结果和跨时区日期不影响统计一致性。",
    accept: "1. 汇总可回溯到明细。\n2. 转派前后统计正确。\n3. 异常量口径明确。\n4. 大数据量响应可接受。",
    dep: "ANN-004,ANN-010",
    route: "http://localhost:3000/annotation/audit/ANNO-001 | src/app/annotation/audit/[id]/page.js",
  }),
  requirement("数据标注", 12, {
    area: "模块通用", feature: "分派冲突、权限和持久化保护", priority: "P0", estimate: 16,
    description: "统一处理数据重复占用、人员分派冲突、越权访问、重复提交和刷新后的真实数据恢复。",
    front: "冲突提示说明对象和处理建议；无权限入口不可用；提交中锁定按钮；刷新读取服务端。",
    back: "使用唯一约束、事务、幂等键和接口鉴权；记录创建、转派、删除和状态变更审计。",
    rules: "前端状态不是完成证据；只有服务端写入并可重新查询才算成功。",
    edge: "网络中断、重放请求、并发编辑和登录失效均有可恢复路径。",
    accept: "1. 重复数据被识别。\n2. 越权接口被拒绝。\n3. 重复提交不重复写入。\n4. 刷新后关键数据仍存在。",
    dep: "ANN-001至ANN-011、统一认证与审计",
    route: "src/app/collection/annotation-tasks/page.js | src/app/annotation/audit/[id]/page.js",
  }),
];

const workbench = [
  requirement("标注工作台", 1, {
    area: "Episode明细", feature: "状态列表与进入工作台", priority: "P0", estimate: 14,
    description: "按待标注、标注中、待校验和已完成查看Episode，展示数据帧数、解析、标注和审核状态并进入工作台。",
    front: "状态页签、统计、分页和进入按钮联动；支持批量分配人员；返回保持列表上下文。",
    back: "提供权限过滤的Episode分页、状态统计和人员分配接口。",
    rules: "只有已解析且分配给当前用户或授权范围的数据可进入编辑态。",
    edge: "数据被他人锁定、已撤回或解析失败时按钮禁用并说明。",
    accept: "1. 状态统计与明细一致。\n2. 进入携带正确任务和Episode ID。\n3. 锁定冲突可见。\n4. 返回保持上下文。",
    dep: "ANN-010",
    route: "http://localhost:3000/annotation/audit/ANNO-001 | src/app/annotation/audit/[id]/page.js",
  }),
  requirement("标注工作台", 2, {
    area: "视频区", feature: "多视角同步与视角切换", priority: "P0", estimate: 22,
    description: "以多视角网格展示主视角、副视角、深度或仿真画面，并保持同一时间轴同步播放。",
    front: "每个网格可切换可用相机并支持全屏；显示加载、缺失和解析错误状态。",
    back: "返回Episode可用媒体轨道、帧率、时长、时间戳映射和签名访问地址。",
    rules: "所有视角按统一主时间轴对齐；缺失视角不阻断其他视角使用。",
    edge: "帧率不同、媒体断片、链接过期和视角缺失时明确降级。",
    accept: "1. 同帧多视角同步。\n2. 视角切换不重置标注状态。\n3. 缺失轨道可识别。\n4. 全屏返回后时间位置不变。",
    dep: "WB-001、媒体解析服务",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 3, {
    area: "标注画布", feature: "点、框、范围和语义标注模式", priority: "P0", estimate: 28,
    description: "支持在授权的媒体视角和时间范围内进行点标注、框标注、范围标注和语义时序标注。",
    front: "按任务类型加载对应工具；点和框可选手别/对象并删除；范围和语义模式编辑起止帧及描述。",
    back: "定义统一标注结果模型，按类型保存坐标、帧、轨迹、标签、步骤和版本。",
    rules: "坐标归一化到0至1；标注结果绑定视角和帧；查看模式不可编辑。",
    edge: "坐标越界、帧越界、重复对象和无工具权限时阻断。",
    accept: "1. 四类模式按配置可用。\n2. 保存的数据结构可重载。\n3. 查看态不能修改。\n4. 非法坐标与帧被拒绝。",
    dep: "ANN-009,WB-002",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 4, {
    area: "播放控制", feature: "播放、逐帧、倍速和首尾帧", priority: "P0", estimate: 16,
    description: "提供播放/暂停、上一帧/下一帧、首帧/末帧、0.5x/1x/2x倍速和进度定位。",
    front: "控制栏显示当前帧、总帧、时间和倍速；键盘与按钮状态一致。",
    back: "返回准确总帧、帧率和时间映射；保存时使用帧号而非浏览器浮点时间。",
    rules: "当前帧限制在0至总帧；切换倍速不改变标注游标。",
    edge: "媒体未就绪、到达边界和浏览器后台恢复时状态稳定。",
    accept: "1. 控制按钮定位准确。\n2. 倍速正确。\n3. 帧号与时间对应。\n4. 边界不越界。",
    dep: "WB-002",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 5, {
    area: "时间轴", feature: "播放轴与红线标注游标解耦", priority: "P0", estimate: 20,
    description: "视频播放轴控制画面播放，红线标注游标独立用于选择和校验标注帧，两者状态互不误覆盖。",
    front: "播放轴和红线使用不同视觉；暂停时移动红线不改变视频帧；点击播放时从红线位置开始。",
    back: "分别保存播放位置和标注游标；标注结果只引用红线或明确选定的帧。",
    rules: "开始播放会将播放位置对齐红线；播放推进不自动拖动红线，除非产品明确开启跟随。",
    edge: "快速点击、拖拽中播放和切换Episode时取消旧事件，避免状态串线。",
    accept: "1. 两条轴可独立操作。\n2. 播放从红线起点开始。\n3. 播放不误改标注帧。\n4. 切换数据无旧状态残留。",
    dep: "WB-004",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 6, {
    area: "时间轴", feature: "红线点击、拖拽与步骤定位", priority: "P0", estimate: 18,
    description: "支持点击时间轴或拖拽红线帽平滑定位；选择动作步骤时红线自动移动到步骤起始帧。",
    front: "点击和拖拽过程实时显示帧号；拖拽范围受边界限制；选中步骤高亮并定位。",
    back: "红线为编辑会话状态，可在暂存时保存最后位置但不作为业务结果。",
    rules: "像素位置按时间轴宽度换算帧并取整；选择步骤优先定位其startFrame。",
    edge: "窗口缩放、触控拖拽和鼠标移出区域时正确结束拖拽。",
    accept: "1. 点击定位误差不超过1帧。\n2. 拖拽连续无跳变。\n3. 选择步骤自动定位。\n4. 释放后不继续跟随鼠标。",
    dep: "WB-005",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 7, {
    area: "动作步骤", feature: "步骤卡片增删、选择和排序", priority: "P0", estimate: 18,
    description: "右侧步骤卡片支持新增、删除、选择和拖拽排序，展示动作名称、起止帧和帧时长。",
    front: "选中态明显；删除二次确认；排序时显示目标位置；新增后自动选中。",
    back: "保存稳定步骤ID和order字段；删除采用版本更新并记录审计。",
    rules: "至少保留一个有效步骤才可完成范围标注；排序不改变步骤ID。",
    edge: "删除正在编辑步骤、并发版本冲突和空步骤名称时阻断。",
    accept: "1. 增删排序可保存。\n2. 选中态与时间轴一致。\n3. 步骤ID稳定。\n4. 刷新后顺序保持。",
    dep: "WB-003",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 8, {
    area: "动作步骤", feature: "起止帧与时间轴双向联动", priority: "P0", estimate: 22,
    description: "在步骤卡片输入起止帧会重绘时间轴色块，拖动色块手柄也会实时更新卡片数值和帧时长。",
    front: "输入和拖拽均即时反馈；非法值显示字段错误；帧时长自动计算。",
    back: "保存前后端均校验区间；使用版本号避免旧编辑覆盖新结果。",
    rules: "0≤startFrame≤endFrame≤totalFrames；是否允许步骤重叠按任务配置执行。",
    edge: "输入空值、负数、反向区间、越界和快速连续拖拽时不产生无效状态。",
    accept: "1. 输入更新色块。\n2. 拖拽更新输入。\n3. 时长计算正确。\n4. 非法区间无法保存。",
    dep: "WB-006,WB-007",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 9, {
    area: "动作描述", feature: "结构化与自然语言动作", priority: "P1", estimate: 18,
    description: "动作步骤支持执行末端、技能、对象和目标的结构化拼装，也支持中英文自然语言描述。",
    front: "模式切换时保留可转换内容；结构化选择生成可读句子；自然语言支持逐行步骤。",
    back: "保存结构化字段、显示文本和语言；自然语言解析结果保留原文和解析版本。",
    rules: "结构化字段缺一不可；自然语言转结构化前需人工确认。",
    edge: "解析失败、未知词典项和中英文不一致时允许人工修正，不静默覆盖。",
    accept: "1. 两种模式可用。\n2. 转换不丢原文。\n3. 解析失败可编辑。\n4. 保存后重载一致。",
    dep: "WB-007、动作词典",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 10, {
    area: "动作步骤", feature: "导入动作模版", priority: "P1", estimate: 12,
    description: "从模版中心选择动作模版导入步骤和默认帧区间，并允许在线调整。",
    front: "选择器展示名称、设备和步骤数；导入前预览；已有步骤时选择覆盖或追加。",
    back: "读取已启用模版版本并复制步骤快照到当前标注结果。",
    rules: "只展示适配当前任务的模版；导入后必须校验实际视频帧范围。",
    edge: "模版停用、总帧不足和步骤为空时提示并阻断或要求调整。",
    accept: "1. 适配筛选正确。\n2. 导入步骤完整。\n3. 越界帧可识别。\n4. 后续编辑不影响原模版。",
    dep: "TPL-006,TPL-007,WB-008",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 11, {
    area: "保存与恢复", feature: "保存暂存、自动恢复和版本冲突", priority: "P0", estimate: 22,
    description: "支持手动保存暂存、定时草稿和刷新恢复，区分草稿、提交结果和审核结论。",
    front: "显示未保存、保存中、已保存和失败状态；失败保留本地编辑并提供重试。",
    back: "草稿接口按任务、Episode、用户和版本保存；提交使用乐观锁并返回新版本。",
    rules: "草稿不改变任务完成状态；正式提交前校验全部必填结果。",
    edge: "断网、登录过期、多窗口编辑和服务器版本更新时提示冲突并保护数据。",
    accept: "1. 暂存刷新后可恢复。\n2. 草稿不计完成。\n3. 冲突不会静默覆盖。\n4. 保存失败内容仍在。",
    dep: "WB-003至WB-010",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 12, {
    area: "标注模版", feature: "生成标注模版", priority: "P1", estimate: 16,
    description: "将当前已校验的动作步骤、帧区间比例、标注类型和适用信息保存为全局标注模版。",
    front: "生成弹窗填写名称和描述，预览步骤；提交成功后可前往模版中心。",
    back: "创建模版版本，保存步骤、帧比例、来源任务和创建人；名称和编码唯一。",
    rules: "只有有效且已保存的标注结果可生成；模版不复制原视频和敏感数据。",
    edge: "空步骤、非法区间、重复名称和无创建权限时阻断。",
    accept: "1. 预览与当前结果一致。\n2. 模版中心可查询。\n3. 不包含原媒体。\n4. 重复提交不重复创建。",
    dep: "WB-008,WB-011,TPL-008",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 13, {
    area: "标注模版", feature: "批量套用与人工校验", priority: "P1", estimate: 18,
    description: "选择标注模版一键套用动作步骤和帧区间映射，套用后由标注员针对当前视频校验调整。",
    front: "展示模版步骤、适用场景和版本；套用前确认覆盖或追加；标记所有待人工校验区间。",
    back: "按当前总帧映射模版帧比例并复制步骤；记录模版来源和套用版本。",
    rules: "套用结果仍是草稿，未经人工确认不可直接完成标注。",
    edge: "视频长度差异、模版失效和映射越界时自动裁剪需明确提示或阻断。",
    accept: "1. 映射结果可追溯。\n2. 套用不直接完成任务。\n3. 越界有提示。\n4. 人工调整可保存。",
    dep: "WB-011,TPL-009",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 14, {
    area: "作业效率", feature: "快捷键与连续下一条", priority: "P1", estimate: 14,
    description: "提供保存、完成、播放和帧标记快捷键，并在完成当前Episode后自动进入下一条待标注数据。",
    front: "显示快捷键提示；输入框聚焦时避免误触；切换下一条前显示保存结果。",
    back: "完成接口原子提交结果并返回下一条授权Episode，使用锁避免多人领取同一条。",
    rules: "只有提交成功才进入下一条；无下一条时返回列表并显示完成摘要。",
    edge: "网络失败、快捷键重复触发和下一条被抢占时停留当前页并提示。",
    accept: "1. 快捷键与按钮行为一致。\n2. 输入时不误触。\n3. 提交成功才跳转。\n4. 并发领取不重复。",
    dep: "WB-004,WB-011",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 15, {
    area: "标注提交", feature: "完成标注并提交质检", priority: "P0", estimate: 18,
    description: "标注员完成当前Episode的标注后提交结果，将数据流转到数据质检；工作台不直接给出最终质量结论。",
    front: "提交前展示标注摘要和自检结果，终态操作二次确认；提交成功后锁定当前版本并明确显示“待质检”。",
    back: "原子保存标注结果、结果版本、提交人和提交时间，并创建待质检记录；按状态机校验当前数据允许提交。",
    rules: "标注员只能提交标注结果；只有数据质检板块可以给出通过或不通过结论；返工后的结果必须生成新版本并重新提交质检。",
    edge: "结果为空、校验失败、重复提交、越权、旧版本或网络中断时拒绝流转且不得产生重复质检记录。",
    accept: "1. 有效结果提交后状态变为待质检。\n2. 工作台无最终质检结论入口。\n3. 重复提交只创建一条质检记录。\n4. 刷新后结果版本和状态保持。",
    dep: "WB-011、角色权限和状态机",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("标注工作台", 16, {
    area: "提交前自检", feature: "覆盖率、错误帧和操作记录", priority: "P1", estimate: 18,
    description: "提交前展示标注覆盖帧数、覆盖率、平均区间和错误帧，帮助标注员自检，并记录关键编辑与提交动作。",
    front: "自检面板可跳转到未覆盖区间和错误帧；阻断项与提醒项分级展示，但不替代最终数据质检。",
    back: "按结果计算覆盖率和结构错误，保存自检结果；审计记录增删改、套用模版和提交。",
    rules: "覆盖率使用区间并集避免重叠重复计数；错误帧不计有效覆盖；最终质量结论只能由数据质检产生。",
    edge: "空结果、重叠区间、超出总帧和大量错误帧时计算稳定。",
    accept: "1. 覆盖率与区间并集一致。\n2. 点击统计可定位。\n3. 阻断项未处理不能提交。\n4. 自检与最终质检结论明确区分。",
    dep: "WB-008,WB-015",
    route: "src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
];

const quality = [
  requirement("数据质检", 1, {
    area: "质检任务列表", feature: "多维检索与重置", priority: "P0", estimate: 14,
    description: "对已完成并提交的标注结果进行查询，支持按项目、任务书、标注任务、任务ID、实例ID、任务名称、标注类型、质检状态、质检员和标注员组合筛选。",
    front: "提供查询、重置、加载、空结果和失败反馈；从详情返回后保留筛选、页码和滚动位置。",
    back: "提供质检任务分页查询接口，仅返回已提交标注版本及权限范围内字段，并返回稳定排序和总数。",
    rules: "未完成标注或未提交质检的数据不得进入列表；筛选条件与分页共同生效。",
    edge: "无权限项目、非法枚举、记录不存在和接口超时需安全处理，不泄露标注内容。",
    accept: "1. 只有待质检及后续状态数据可见。\n2. 单项和组合筛选准确。\n3. 重置恢复默认列表。\n4. 返回列表后状态保持。",
    dep: "WB-015、项目与人员基础数据",
    route: "http://localhost:3000/collection/qa | src/app/collection/qa/page.js",
  }),
  requirement("数据质检", 2, {
    area: "质检任务列表", feature: "状态页签、进度与统计", priority: "P0", estimate: 12,
    description: "按待质检、质检中、已通过、未通过切换任务，展示质检进度、通过数、不通过数、数据量和标注类型。",
    front: "页签数量、进度和列表同步；状态使用清晰视觉编码；支持分页、刷新和列配置。",
    back: "返回各状态统计和任务进度，统一按Episode质检结论计算通过数、不通过数和完成比例。",
    rules: "质检进度=已给出结论Episode数/应质检Episode数；返工重提后重新计入待质检。",
    edge: "总数为零显示0%；并发结论和撤回时统计必须以服务端最新版本为准。",
    accept: "1. 四个页签数量准确。\n2. 进度与详情一致。\n3. 返工重提后状态回到待质检。\n4. 刷新不出现重复或错行。",
    dep: "QA-001",
    route: "http://localhost:3000/collection/qa | src/app/collection/qa/page.js",
  }),
  requirement("数据质检", 3, {
    area: "质检任务列表", feature: "分配与批量分配质检员", priority: "P0", estimate: 14,
    description: "支持为单个或多个待质检任务分配质检员，并记录分配人、分配时间和调整历史。",
    front: "单行与批量分配共用人员选择器；提交前显示影响数量，成功后即时更新质检员。",
    back: "批量分配接口校验人员角色、项目权限和任务状态，事务写入当前分配及变更日志。",
    rules: "只有待质检或质检中任务可调整；已通过和未通过记录变更需具备管理权限。",
    edge: "部分任务状态变化、人员停用、无权限和重复提交时返回逐项结果且不静默覆盖。",
    accept: "1. 单个和批量分配持久化。\n2. 非质检角色不可选择。\n3. 冲突项说明明确。\n4. 分配历史可追溯。",
    dep: "QA-001、统一认证与人员角色",
    route: "http://localhost:3000/collection/qa | src/app/collection/qa/page.js",
  }),
  requirement("数据质检", 4, {
    area: "质检任务详情", feature: "Episode清单与质量统计", priority: "P0", estimate: 16,
    description: "进入质检任务详情，按Episode展示标注类型、帧数、标注时长、解析状态、标注状态和质检状态，并汇总待检、通过和未通过数量。",
    front: "顶部统计卡与列表联动；支持筛选、勾选、分页和进入单条质检工作台。",
    back: "详情接口返回任务摘要、Episode标注结果版本和质检统计，只允许读取已提交版本。",
    rules: "质检结论必须绑定具体标注版本；返工重提后旧结论只作历史审计，不作为当前结论。",
    edge: "Episode删除、版本变化、媒体不可用或标注结果缺失时禁止进入质检并说明原因。",
    accept: "1. 统计卡与列表数量一致。\n2. 字段和状态准确。\n3. 仅加载当前提交版本。\n4. 异常Episode不可误判通过。",
    dep: "QA-001,QA-003",
    route: "src/app/collection/qa/[instanceId]/page.js",
  }),
  requirement("数据质检", 5, {
    area: "质检工作台", feature: "多视角播放与标注叠加检查", priority: "P0", estimate: 22,
    description: "在质检工作台播放多视角数据，叠加展示标注动作、标签、时间区间和关键帧，支持逐帧定位检查标注结果。",
    front: "提供播放、倍速、逐帧、时间轴缩放、区间跳转和视角切换；标注内容与当前帧同步高亮。",
    back: "按授权加载媒体与只读标注快照，返回帧率、总帧、步骤、标签、区间和版本信息。",
    rules: "质检默认不得直接修改标注结果；发现问题需记录问题并退回标注工作台返工。",
    edge: "媒体加载失败、帧率缺失、多视角不同步和标注越界时阻断结论或标记异常。",
    accept: "1. 播放与标注叠加同步。\n2. 可准确定位到区间边界。\n3. 质检员不能篡改原标注。\n4. 加载异常不得误提交。",
    dep: "QA-004,WB-011",
    route: "src/app/collection/qa/[instanceId]/[seqId]/page.js",
  }),
  requirement("数据质检", 6, {
    area: "质量检查", feature: "完整性、一致性与边界规则", priority: "P0", estimate: 18,
    description: "检查标注是否完整，动作/标签是否正确，时间区间与关键帧边界是否准确，多视角及任务规则是否一致。",
    front: "以检查项清单展示完整性、标签、顺序、边界、重叠、遗漏和一致性结果，支持定位问题帧并填写说明。",
    back: "执行可配置质量规则，保存规则版本、自动检查结果、人工确认项和问题位置。",
    rules: "自动规则只辅助判断；P0规则失败必须判定不通过，允许豁免时需管理权限和理由。",
    edge: "规则版本缺失、检测超时、结果冲突或无法定位帧时不得自动判定通过。",
    accept: "1. 核心质量项均可检查。\n2. 问题可定位到帧或区间。\n3. 规则版本可追溯。\n4. P0失败不能提交通过。",
    dep: "QA-005、标注规则与模版版本",
    route: "src/app/collection/qa/[instanceId]/[seqId]/page.js",
  }),
  requirement("数据质检", 7, {
    area: "质量结论", feature: "通过与不通过", priority: "P0", estimate: 18,
    description: "质检员对当前标注版本给出通过或不通过结论；不通过必须选择问题类型、填写原因并关联问题帧或区间。",
    front: "通过和不通过均二次确认；不通过表单校验原因、问题类型和定位；提交后显示结论、人员和时间。",
    back: "结论接口校验锁、权限、标注版本和必填信息，幂等写入结论及审计日志。",
    rules: "通过表示该标注版本完成最终质量门禁；不通过不得计为完成，并触发返工流程。",
    edge: "重复提交、旧版本、越权、并发质检和网络重试不能产生多个当前结论。",
    accept: "1. 通过后当前版本标记质检通过。\n2. 不通过原因和位置完整。\n3. 同一版本只有一个当前结论。\n4. 审计信息齐全。",
    dep: "QA-005,QA-006",
    route: "src/app/collection/qa/[instanceId]/[seqId]/page.js",
  }),
  requirement("数据质检", 8, {
    area: "返工闭环", feature: "不通过退回标注返工", priority: "P0", estimate: 20,
    description: "质检不通过后将问题退回原标注任务和标注工作台，标注员按问题修正、保存新版本并重新提交质检。",
    front: "标注任务和工作台显示退回原因、问题类型、问题帧、质检员和时间；修正后提供重新提交入口。",
    back: "创建返工单并关联质检结论、原标注版本和问题清单；新版本提交后创建新的待质检记录。",
    rules: "退回不覆盖历史结果；只有完成所有阻断问题后才可重提；重提必须重新质检，不能沿用旧通过结论。",
    edge: "原标注员离岗、任务锁定、问题已关闭和多人同时返工时需支持重新分配和版本冲突保护。",
    accept: "1. 不通过后标注侧可见完整问题。\n2. 返工保存为新版本。\n3. 重提后回到待质检。\n4. 历史版本与结论可追溯。",
    dep: "QA-007,WB-015、数据标注任务状态机",
    route: "src/app/collection/qa/[instanceId]/[seqId]/page.js | src/app/annotation/audit/[id]/[episodeId]/page.js",
  }),
  requirement("数据质检", 9, {
    area: "批量与效率", feature: "批量结论、抽检与连续下一条", priority: "P1", estimate: 18,
    description: "支持按质检策略选择全检或抽检，对符合条件的Episode批量通过/驳回，并在单条提交后连续进入下一条待质检数据。",
    front: "批量操作展示选择数量与风险提示；驳回必须逐条或统一填写可追溯原因；下一条跳转以提交成功为前提。",
    back: "策略服务返回抽样范围；批量接口逐项校验版本和锁并返回成功、失败明细；下一条按权限领取。",
    rules: "P0风险任务默认全检；批量通过仅适用于自动规则全部通过的数据；批量驳回仍需有效问题依据。",
    edge: "抽样不足、部分版本变化、下一条被抢占和批量部分失败时保留可重试清单。",
    accept: "1. 策略范围正确。\n2. 批量结果逐项可追溯。\n3. 提交成功才进入下一条。\n4. 部分失败不误改其他数据。",
    dep: "QA-004,QA-006,QA-007",
    route: "src/app/collection/qa/[instanceId]/page.js | src/app/collection/qa/[instanceId]/[seqId]/page.js",
  }),
  requirement("数据质检", 10, {
    area: "最终完成与审计", feature: "质量门禁、导出、权限和持久化", priority: "P0", estimate: 18,
    description: "全部应检标注结果通过后关闭质检任务并标记最终完成；支持导出质检结果、问题和返工记录，确保权限、幂等和审计完整。",
    front: "展示最终完成条件和未完成项；导出沿用当前筛选；所有提交以服务端成功结果为准，刷新后恢复真实状态。",
    back: "聚合当前有效版本结论，满足门禁后事务更新任务完成状态；导出权限范围内明细并记录操作日志。",
    rules: "通过质检才是标注流程最终完成；任一应检项未通过、待检或返工中都不得关闭任务或进入合格数据集。",
    edge: "重复关闭、导出超时、权限变化、结论撤销和任务统计延迟时需保持最终状态一致。",
    accept: "1. 全部应检项通过才最终完成。\n2. 未通过可追溯到返工闭环。\n3. 导出内容与筛选和权限一致。\n4. 刷新后状态、结论和审计保持。",
    dep: "QA-007,QA-008,QA-009、统一认证与审计",
    route: "http://localhost:3000/collection/qa | src/app/collection/qa/page.js",
  }),
];

const templates = [
  requirement("模版中心", 1, {
    area: "模版列表", feature: "任务、动作和标注模版页签", priority: "P0", estimate: 10,
    description: "模版中心按任务模版、动作模版和标注模版三个页签分类展示，并显示各类数量。",
    front: "页签切换保持各自筛选和滚动位置；数量、加载和空状态准确。",
    back: "按模版类型提供分页查询和状态统计，统一返回权限范围内数据。",
    rules: "不同类型使用独立数据结构但共享基础元数据；页签数量只统计可见有效模版。",
    edge: "无权限类型不展示；接口失败仅影响对应页签并可重试。",
    accept: "1. 三类页签可达。\n2. 数量与列表一致。\n3. 状态互不串扰。\n4. 权限过滤正确。",
    dep: "统一认证",
    route: "http://localhost:3000/collection/templates | src/app/collection/templates/page.js",
  }),
  requirement("模版中心", 2, {
    area: "模版列表", feature: "搜索、筛选、卡片和空状态", priority: "P1", estimate: 12,
    description: "支持按名称、类型、设备和创建人筛选模版，以卡片或列表展示名称、状态、说明、版本和操作。",
    front: "提供查询、重置、分页/加载更多；长文本省略可展开；空结果提供创建入口。",
    back: "分页查询支持关键词、类型、设备、创建人和状态，返回版本与引用统计。",
    rules: "筛选条件按页签分别保存；停用模版默认可筛选但不可新使用。",
    edge: "无结果、加载失败和图片缺失有统一占位。",
    accept: "1. 筛选组合正确。\n2. 重置恢复默认。\n3. 卡片字段完整。\n4. 空状态入口可用。",
    dep: "TPL-001",
    route: "http://localhost:3000/collection/templates | src/app/collection/templates/page.js",
  }),
  requirement("模版中心", 3, {
    area: "任务模版", feature: "卡片、详情和使用统计", priority: "P1", estimate: 14,
    description: "任务模版卡片和详情展示名称、编码、设备、控制模式、描述、创建信息、SOP步骤和使用统计。",
    front: "卡片提供查看和使用入口；详情分区展示基础信息、步骤表和引用任务。",
    back: "详情接口返回模版版本、步骤、引用计数和最近使用记录。",
    rules: "统计只计有效任务引用；查看旧版本时明确版本号和状态。",
    edge: "模版不存在、无权限或部分引用已归档时友好处理。",
    accept: "1. 卡片与详情一致。\n2. 步骤顺序正确。\n3. 使用统计可追溯。\n4. 旧版本标识清晰。",
    dep: "TPL-001,TPL-002",
    route: "src/app/collection/templates/detail/[id]/page.js",
  }),
  requirement("模版中心", 4, {
    area: "任务模版", feature: "新建与编辑", priority: "P0", estimate: 20,
    description: "新建或编辑任务模版，配置名称、编码、适配设备、默认采集模式、描述和SOP步骤。",
    front: "表单必填、编码格式和步骤校验；编辑正确回显；失败保留输入。",
    back: "创建新模版或新版本，校验编码唯一、设备适配和步骤完整性。",
    rules: "已被任务使用的模版修改生成新版本，不覆盖历史任务快照。",
    edge: "重复编码、并发编辑、无步骤和无权限时阻断。",
    accept: "1. 新建保存后列表可见。\n2. 编辑生成正确版本。\n3. 历史引用不变。\n4. 刷新后数据保留。",
    dep: "TPL-007、设备和动作词典",
    route: "http://localhost:3000/collection/templates/create | src/app/collection/templates/create/page.js",
  }),
  requirement("模版中心", 5, {
    area: "任务模版", feature: "克隆、删除和在任务中心使用", priority: "P0", estimate: 16,
    description: "支持克隆任务模版、删除未引用模版，并从模版直接进入新建采集任务且带出配置。",
    front: "克隆后要求新名称/编码；删除二次确认；使用按钮跳转并展示已带出内容。",
    back: "克隆复制当前版本；删除执行引用校验；使用接口或路由参数返回模版快照。",
    rules: "克隆不复制使用统计；被引用模版不可物理删除；任务创建后与模版解耦为快照。",
    edge: "模版停用、删除冲突和跳转时版本变化需提示。",
    accept: "1. 克隆得到独立编码。\n2. 引用模版删除被阻断。\n3. 创建页配置完整带出。\n4. 后续模版修改不改任务。",
    dep: "TPL-003,TPL-004,COL-004",
    route: "http://localhost:3000/collection/templates | src/app/collection/templates/page.js",
  }),
  requirement("模版中心", 6, {
    area: "动作模版", feature: "结构化与自然语言双模式", priority: "P0", estimate: 18,
    description: "动作模版支持结构化步骤编排和中英文自然语言逐行描述两种创建模式。",
    front: "结构化模式选择末端、技能、对象和目标；自然语言模式支持多行输入和解析预览。",
    back: "保存原始文本、结构化结果、解析版本和适配设备；提供词典选项。",
    rules: "自然语言解析结果必须人工确认；切换模式不静默丢失内容。",
    edge: "解析失败、未知词和中英文不一致时允许手动修正。",
    accept: "1. 两种模式均可创建。\n2. 原文保留。\n3. 解析失败可恢复。\n4. 保存重载一致。",
    dep: "动作词典、设备管理",
    route: "http://localhost:3000/collection/templates/action/create | src/app/collection/templates/action/create/page.js",
  }),
  requirement("模版中心", 7, {
    area: "动作模版", feature: "动作步骤、排序与默认帧推算", priority: "P0", estimate: 20,
    description: "配置动作步骤的末端、技能、对象、目标和默认帧区间，支持增删排序及按300帧步长推算。",
    front: "新增步骤以上一步结束帧为起点；可编辑起止帧、拖拽排序和删除。",
    back: "保存有序步骤、稳定ID和默认帧；校验区间与设备适配。",
    rules: "默认帧仅是模版建议，套用到实际数据后必须校验；步骤起止合法。",
    edge: "空步骤、负帧、越界默认值和重复ID时阻断。",
    accept: "1. 帧推算正确。\n2. 增删排序持久化。\n3. 非法区间被拒绝。\n4. 套用后可调整。",
    dep: "TPL-006",
    route: "http://localhost:3000/collection/templates/action/create | src/app/collection/templates/action/create/page.js",
  }),
  requirement("模版中心", 8, {
    area: "标注模版", feature: "从标注工作台生成", priority: "P1", estimate: 14,
    description: "接收标注工作台生成的标注模版，记录名称、描述、标注类型、步骤、帧比例、来源和版本。",
    front: "生成成功后在标注模版页签可见并显示创建时间、步骤数和适用信息。",
    back: "创建模版版本并保存来源结果摘要，不复制原始媒体；验证来源用户和数据权限。",
    rules: "只有有效已保存结果可生成；来源仅用于审计，不允许通过模版读取原数据。",
    edge: "重复名称、来源结果被撤回和无权限时阻断或标记不可用。",
    accept: "1. 工作台生成后可查询。\n2. 步骤和比例完整。\n3. 不暴露原媒体。\n4. 来源可审计。",
    dep: "WB-012",
    route: "http://localhost:3000/collection/templates | src/app/collection/templates/page.js",
  }),
  requirement("模版中心", 9, {
    area: "标注模版", feature: "预览、复用和删除", priority: "P1", estimate: 16,
    description: "集中预览标注模版步骤和帧映射，支持在工作台复用，并删除未引用模版。",
    front: "卡片展示步骤数、场景、版本和创建时间；预览步骤；复用跳转工作台或在工作台选择；删除二次确认。",
    back: "详情返回步骤和映射；复用记录使用关系；删除校验任务和结果引用。",
    rules: "复用产生草稿并要求人工核验；已引用模版只能停用或新版本替代。",
    edge: "模版失效、映射不适配和并发删除时提示并阻断。",
    accept: "1. 预览字段完整。\n2. 复用可追溯。\n3. 复用不自动完成标注。\n4. 引用模版删除被阻断。",
    dep: "TPL-008,WB-013",
    route: "http://localhost:3000/collection/templates | src/app/collection/templates/page.js",
  }),
  requirement("模版中心", 10, {
    area: "模块通用", feature: "引用保护、权限和刷新持久化", priority: "P0", estimate: 16,
    description: "所有模版写操作执行编码唯一、引用保护、权限、版本、幂等和审计校验，并能在刷新后恢复。",
    front: "保存中防重复；冲突提示保留输入；停用和删除影响清晰；刷新读取服务端真实状态。",
    back: "接口鉴权、唯一约束、乐观锁、幂等键和引用查询；记录创建、发布、停用、删除和复用日志。",
    rules: "前端成功提示必须以服务端持久化结果为准；历史引用始终绑定具体版本。",
    edge: "网络中断、重复提交、并发编辑和登录过期均可安全恢复。",
    accept: "1. 重复编码被拒绝。\n2. 引用保护生效。\n3. 重复提交只写一次。\n4. 刷新后数据和版本保持。",
    dep: "TPL-001至TPL-009、统一认证与审计",
    route: "src/app/collection/templates/page.js | src/app/collection/templates/create/page.js",
  }),
];

export const requirementsByModule = {
  数据采集: collection,
  数据标注: annotation,
  标注工作台: workbench,
  数据质检: quality,
  模版中心: templates,
};

export function validateRequirements(data) {
  const seen = new Set();
  for (const module of MODULES) {
    const rows = data[module.name];
    assert.ok(Array.isArray(rows) && rows.length >= 10, `${module.name} rows missing`);
    rows.forEach((row, index) => {
      assert.equal(row.length, COLUMNS.length, `${module.name} row ${index + 1} column mismatch`);
      assert.match(row[0], new RegExp(`^${module.prefix}-\\d{3}$`));
      assert.equal(row[1], module.name);
      assert.equal(row[12], module.owner);
      assert.ok(["P0", "P1", "P2"].includes(row[11]));
      assert.equal(row[15], "待开始");
      assert.equal(row[19], "未测试");
      assert.ok(typeof row[13] === "number" && row[13] > 0);
      assert.ok(row.slice(0, 14).every((value) => value !== null && value !== ""), `${row[0]} has blank required fields`);
      assert.ok(!seen.has(row[0]), `duplicate id ${row[0]}`);
      seen.add(row[0]);
    });
  }
}

const palette = {
  navy: "#16324F",
  blue: "#1D4ED8",
  teal: "#0F766E",
  cyan: "#DFF6F2",
  sky: "#E8F1FF",
  ink: "#172033",
  muted: "#5B6577",
  line: "#D8E0EA",
  soft: "#F7F9FC",
  white: "#FFFFFF",
};

function styleTitle(sheet, address, fill = palette.navy) {
  const range = sheet.getRange(address);
  range.format = {
    fill,
    font: { bold: true, color: palette.white, size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
}

function styleHeader(range) {
  range.format = {
    fill: palette.navy,
    font: { bold: true, color: palette.white, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#9FB0C4" },
  };
}

function setColumnWidths(sheet, lastRow) {
  const widths = {
    A: 12, B: 14, C: 18, D: 24, E: 40, F: 44, G: 44, H: 40, I: 40, J: 44,
    K: 22, L: 10, M: 20, N: 13, O: 13, P: 16, Q: 13, R: 15, S: 15, T: 13,
    U: 42, V: 34,
  };
  for (const [column, width] of Object.entries(widths)) {
    sheet.getRange(`${column}1:${column}${lastRow}`).format.columnWidth = width;
  }
}

function addModuleConditionalFormatting(sheet, firstRow, lastRow) {
  const priority = sheet.getRange(`L${firstRow}:L${lastRow}`);
  priority.conditionalFormats.add("containsText", { text: "P0", format: { fill: "#FEE2E2", font: { color: "#B91C1C", bold: true } } });
  priority.conditionalFormats.add("containsText", { text: "P1", format: { fill: "#FEF3C7", font: { color: "#92400E", bold: true } } });
  priority.conditionalFormats.add("containsText", { text: "P2", format: { fill: "#E0F2FE", font: { color: "#075985" } } });

  const stage = sheet.getRange(`P${firstRow}:P${lastRow}`);
  stage.conditionalFormats.add("containsText", { text: "已完成", format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } } });
  stage.conditionalFormats.add("containsText", { text: "已阻塞", format: { fill: "#FEE2E2", font: { color: "#B91C1C", bold: true } } });
  stage.conditionalFormats.add("containsText", { text: "联调中", format: { fill: "#DBEAFE", font: { color: "#1D4ED8" } } });
  stage.conditionalFormats.add("containsText", { text: "待验收", format: { fill: "#F3E8FF", font: { color: "#7E22CE" } } });

  const test = sheet.getRange(`T${firstRow}:T${lastRow}`);
  test.conditionalFormats.add("containsText", { text: "通过", format: { fill: "#DCFCE7", font: { color: "#166534" } } });
  test.conditionalFormats.add("containsText", { text: "不通过", format: { fill: "#FEE2E2", font: { color: "#B91C1C" } } });
  test.conditionalFormats.add("containsText", { text: "部分通过", format: { fill: "#FEF3C7", font: { color: "#92400E" } } });
}

function buildInstructions(workbook) {
  const sheet = workbook.worksheets.getItem("使用说明");
  sheet.showGridLines = false;
  sheet.getRange("A1:H2").merge();
  sheet.getRange("A1").values = [["具身智能平台｜五板块需求开发文档"]];
  styleTitle(sheet, "A1:H2");
  sheet.getRange("A3:H3").merge();
  sheet.getRange("A3").values = [["一个负责人承担一个板块的前端、后端、数据、交互、联调、自测与交付结果"]];
  sheet.getRange("A3:H3").format = { fill: palette.sky, font: { color: palette.blue, bold: true }, verticalAlignment: "center" };

  sheet.getRange("A5:H5").merge();
  sheet.getRange("A5").values = [["使用原则"]];
  sheet.getRange("A5:H5").format = { fill: palette.teal, font: { color: palette.white, bold: true, size: 12 } };
  const rules = [
    ["1", "责任统一", "不再拆分前端、后端和平台负责人；每个板块只有一个模块负责人。"],
    ["2", "交付拆清", "负责人统一，但需求仍分列记录前端交互、API数据、业务规则、异常权限和验收标准。"],
    ["3", "状态可信", "页面上出现不等于已完成；服务端持久化、刷新恢复、权限校验和测试通过后才可计入完成。"],
    ["4", "颗粒可验收", "一行对应一个可独立开发、联调和验收的功能点。"],
    ["5", "时间可维护", "负责人姓名、工时和日期均为可编辑输入；汇总数字由公式计算。"],
  ];
  sheet.getRange("A6:C10").values = rules;
  sheet.getRange("A6:A10").format = { fill: palette.cyan, font: { bold: true, color: palette.teal }, horizontalAlignment: "center" };
  sheet.getRange("B6:B10").format.font = { bold: true, color: palette.ink };

  sheet.getRange("A12:H12").merge();
  sheet.getRange("A12").values = [["状态与口径"]];
  sheet.getRange("A12:H12").format = { fill: palette.teal, font: { color: palette.white, bold: true, size: 12 } };
  const definitions = [
    ["开发阶段", "待开始 → 前端与交互 / API与数据 → 联调中 → 待验收 → 已完成；任何未完成阶段可进入已阻塞。"],
    ["完成口径", "开发阶段=已完成 且 测试结果=通过，才计入开发总览的已完成数。"],
    ["优先级", "P0=主流程不可缺失；P1=高频能力或重要保护；P2=体验或后续增强。"],
    ["测试结果", "未测试、通过、不通过、部分通过。"],
    ["阻塞要求", "开发阶段选择已阻塞时，备注必须填写阻塞原因和解除条件。"],
    ["业务流程", "数据采集 → 数据标注任务 → 标注工作台完成并提交标注 → 数据质检检查标注质量 → 通过后最终完成；不通过退回标注返工并重新质检。"],
  ];
  sheet.getRange("A13:B18").values = definitions;
  sheet.getRange("A13:A18").format = { fill: palette.soft, font: { bold: true, color: palette.ink } };

  sheet.getRange("A19:H19").merge();
  sheet.getRange("A19").values = [["字段说明"]];
  sheet.getRange("A19:H19").format = { fill: palette.teal, font: { color: palette.white, bold: true, size: 12 } };
  const fieldRows = COLUMNS.map((column, index) => [index + 1, column, [
    "模块内唯一编号", "所属模块", "页面或业务功能域", "可独立验收名称", "业务目标",
    "页面、控件、联动与反馈", "接口、数据模型、事务与持久化", "状态与业务约束",
    "失败、权限和边界", "编号化通过条件", "前置需求或系统", "P0/P1/P2", "单一全栈责任角色",
    "计划总工时", "实际投入", "当前开发阶段", "实际启动日", "计划交付日", "实际交付日",
    "验证结论", "路由或源文件", "风险与补充",
  ][index]]);
  sheet.getRange(`A21:C${20 + fieldRows.length}`).values = fieldRows;
  styleHeader(sheet.getRange("A20:C20"));
  sheet.getRange("A20:C20").values = [["序号", "字段", "填写说明"]];

  const lastRow = 20 + fieldRows.length;
  sheet.getRange(`A6:C${lastRow}`).format.wrapText = true;
  sheet.getRange(`A6:C${lastRow}`).format.verticalAlignment = "top";
  sheet.getRange(`A6:C${lastRow}`).format.borders = { preset: "all", style: "thin", color: palette.line };
  sheet.getRange(`A1:A${lastRow}`).format.columnWidth = 9;
  sheet.getRange(`B1:B${lastRow}`).format.columnWidth = 24;
  sheet.getRange(`C1:C${lastRow}`).format.columnWidth = 76;
  sheet.getRange(`D1:H${lastRow}`).format.columnWidth = 12;
  sheet.getRange("A1:H2").format.rowHeight = 32;
  sheet.getRange("A3:H3").format.rowHeight = 26;
  sheet.getRange(`A6:C${lastRow}`).format.rowHeight = 34;
  sheet.getRange("A18:C18").format.rowHeight = 68;
  sheet.freezePanes.freezeRows(5);
}

function buildCombinedSheet(workbook) {
  const sheet = workbook.worksheets.getItem("功能需求清单");
  const rows = MODULES.flatMap((module) => requirementsByModule[module.name]);
  const firstRow = 6;
  const lastRow = firstRow + rows.length - 1;
  sheet.showGridLines = false;
  sheet.getRange("A1:V2").merge();
  sheet.getRange("A1").values = [["数据采集｜数据标注｜标注工作台｜数据质检｜模版中心｜功能需求清单"]];
  styleTitle(sheet, "A1:V2", palette.navy);
  sheet.getRange("A3:V3").merge();
  sheet.getRange("A3").values = [["五个板块已合并在同一张表；数据质检是标注完成后的最终质量检查，通过后最终完成，不通过退回标注返工。每个板块由一人负责前端、后端和交互闭环。"]];
  sheet.getRange("A3:V3").format = { fill: palette.sky, font: { color: palette.blue, bold: true }, verticalAlignment: "center" };
  sheet.getRange("A5:V5").values = [COLUMNS];
  styleHeader(sheet.getRange("A5:V5"));
  sheet.getRange(`A${firstRow}:V${lastRow}`).values = rows;
  sheet.getRange(`A${firstRow}:V${lastRow}`).format = {
    font: { color: palette.ink, size: 9 },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: palette.line },
  };
  sheet.getRange(`A${firstRow}:D${lastRow}`).format.fill = palette.soft;
  sheet.getRange(`A${firstRow}:A${lastRow}`).format.font = { bold: true, color: palette.blue };
  sheet.getRange(`L${firstRow}:T${lastRow}`).format.horizontalAlignment = "center";
  sheet.getRange(`N${firstRow}:O${lastRow}`).format.numberFormat = "0.0";
  sheet.getRange(`Q${firstRow}:S${lastRow}`).format.numberFormat = "yyyy-mm-dd";
  sheet.getRange(`A${firstRow}:V${lastRow}`).format.rowHeight = 102;
  sheet.getRange("A1:V2").format.rowHeight = 32;
  sheet.getRange("A3:V3").format.rowHeight = 26;
  sheet.getRange("A5:V5").format.rowHeight = 42;
  setColumnWidths(sheet, lastRow);
  const table = sheet.tables.add(`A5:V${lastRow}`, true, "AllModuleRequirements");
  table.style = "TableStyleMedium2";
  table.showFilterButton = true;
  sheet.freezePanes.freezeRows(5);
  sheet.freezePanes.freezeColumns(4);

  sheet.getRange(`L${firstRow}:L${lastRow}`).dataValidation = { rule: { type: "list", values: ["P0", "P1", "P2"] } };
  sheet.getRange(`M${firstRow}:M${lastRow}`).dataValidation = { rule: { type: "list", values: MODULES.map((item) => item.owner) } };
  sheet.getRange(`P${firstRow}:P${lastRow}`).dataValidation = { rule: { type: "list", values: ["待开始", "前端与交互", "API与数据", "联调中", "待验收", "已完成", "已阻塞"] } };
  sheet.getRange(`T${firstRow}:T${lastRow}`).dataValidation = { rule: { type: "list", values: ["未测试", "通过", "不通过", "部分通过"] } };
  addModuleConditionalFormatting(sheet, firstRow, lastRow);
  const moduleColumn = sheet.getRange(`B${firstRow}:B${lastRow}`);
  moduleColumn.conditionalFormats.add("containsText", { text: "数据采集", format: { fill: "#DBEAFE", font: { color: "#1D4ED8", bold: true } } });
  moduleColumn.conditionalFormats.add("containsText", { text: "数据标注", format: { fill: "#CCFBF1", font: { color: "#0F766E", bold: true } } });
  moduleColumn.conditionalFormats.add("containsText", { text: "标注工作台", format: { fill: "#F3E8FF", font: { color: "#7E22CE", bold: true } } });
  moduleColumn.conditionalFormats.add("containsText", { text: "数据质检", format: { fill: "#FFE4E6", font: { color: "#BE123C", bold: true } } });
  moduleColumn.conditionalFormats.add("containsText", { text: "模版中心", format: { fill: "#FFEDD5", font: { color: "#9A3412", bold: true } } });
}

function buildOverview(workbook) {
  const sheet = workbook.worksheets.getItem("开发总览");
  sheet.showGridLines = false;
  sheet.getRange("A1:M2").merge();
  sheet.getRange("A1").values = [["五板块开发总览"]];
  styleTitle(sheet, "A1:M2");
  sheet.getRange("A3:M3").merge();
  sheet.getRange("A3").values = [["汇总数据由功能需求清单实时计算；只有“已完成 + 测试通过”才计入完成数。数据质检位于标注之后，负责最终检查标注质量。"]];
  sheet.getRange("A3:M3").format = { fill: palette.sky, font: { color: palette.blue, bold: true }, wrapText: true };
  const headers = ["模块", "模块负责人", "需求总数", "已完成数", "进行中数", "阻塞数", "完成率", "P0数量", "P1数量", "计划工时(h)", "已投入工时(h)", "当前阶段", "风险与下一步"];
  sheet.getRange("A5:M5").values = [headers];
  styleHeader(sheet.getRange("A5:M5"));
  MODULES.forEach((module, index) => {
    const row = 6 + index;
    const firstSourceRow = 6;
    const lastSourceRow = 5 + MODULES.reduce((sum, item) => sum + requirementsByModule[item.name].length, 0);
    sheet.getRange(`A${row}:B${row}`).values = [[module.name, module.owner]];
    sheet.getRange(`C${row}:L${row}`).formulas = [[
      `=COUNTIF('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row})`,
      `=COUNTIFS('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$P$${firstSourceRow}:$P$${lastSourceRow},"已完成",'功能需求清单'!$T$${firstSourceRow}:$T$${lastSourceRow},"通过")`,
      `=COUNTIFS('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$P$${firstSourceRow}:$P$${lastSourceRow},"<>待开始",'功能需求清单'!$P$${firstSourceRow}:$P$${lastSourceRow},"<>已完成",'功能需求清单'!$P$${firstSourceRow}:$P$${lastSourceRow},"<>已阻塞")`,
      `=COUNTIFS('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$P$${firstSourceRow}:$P$${lastSourceRow},"已阻塞")`,
      `=IF(C${row}=0,0,D${row}/C${row})`,
      `=COUNTIFS('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$L$${firstSourceRow}:$L$${lastSourceRow},"P0")`,
      `=COUNTIFS('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$L$${firstSourceRow}:$L$${lastSourceRow},"P1")`,
      `=SUMIF('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$N$${firstSourceRow}:$N$${lastSourceRow})`,
      `=SUMIF('功能需求清单'!$B$${firstSourceRow}:$B$${lastSourceRow},A${row},'功能需求清单'!$O$${firstSourceRow}:$O$${lastSourceRow})`,
      `=IF(D${row}=C${row},"已完成",IF(F${row}>0,"已阻塞",IF(E${row}>0,"开发中","待开始")))`,
    ]];
    sheet.getRange(`M${row}`).values = [["填写实际负责人和日期；优先处理P0，并在备注中记录阻塞原因。"]];
  });
  const overviewLastRow = 5 + MODULES.length;
  sheet.getRange(`A6:M${overviewLastRow}`).format = {
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: palette.line },
  };
  sheet.getRange(`A6:B${overviewLastRow}`).format.fill = palette.soft;
  sheet.getRange(`A6:A${overviewLastRow}`).format.font = { bold: true, color: palette.navy };
  sheet.getRange(`C6:L${overviewLastRow}`).format.horizontalAlignment = "center";
  sheet.getRange(`G6:G${overviewLastRow}`).format.numberFormat = "0%";
  sheet.getRange(`J6:K${overviewLastRow}`).format.numberFormat = "0.0";
  sheet.getRange(`G6:G${overviewLastRow}`).conditionalFormats.add("dataBar", { color: "#2563EB", gradient: true });
  sheet.getRange(`L6:L${overviewLastRow}`).conditionalFormats.add("containsText", { text: "已完成", format: { fill: "#DCFCE7", font: { color: "#166534", bold: true } } });
  sheet.getRange(`L6:L${overviewLastRow}`).conditionalFormats.add("containsText", { text: "已阻塞", format: { fill: "#FEE2E2", font: { color: "#B91C1C", bold: true } } });
  const widths = [16, 21, 12, 12, 12, 12, 12, 10, 10, 15, 15, 14, 48];
  "ABCDEFGHIJKLM".split("").forEach((letter, index) => {
    sheet.getRange(`${letter}1:${letter}${overviewLastRow}`).format.columnWidth = widths[index];
  });
  sheet.getRange("A1:M2").format.rowHeight = 32;
  sheet.getRange("A3:M3").format.rowHeight = 30;
  sheet.getRange("A5:M5").format.rowHeight = 36;
  sheet.getRange(`A6:M${overviewLastRow}`).format.rowHeight = 48;
  sheet.freezePanes.freezeRows(5);
  sheet.freezePanes.freezeColumns(2);
}

export function buildWorkbook() {
  validateRequirements(requirementsByModule);
  const workbook = Workbook.create();
  workbook.worksheets.add("使用说明");
  workbook.worksheets.add("开发总览");
  workbook.worksheets.add("功能需求清单");
  buildInstructions(workbook);
  buildCombinedSheet(workbook);
  buildOverview(workbook);
  return workbook;
}

async function inspectAndRender(outputPath, previewDir) {
  const input = await FileBlob.load(outputPath);
  const workbook = await SpreadsheetFile.importXlsx(input);
  const sheets = await workbook.inspect({ kind: "sheet", include: "id,name,index,range", maxChars: 8000 });
  for (const name of ["使用说明", "开发总览", "功能需求清单"]) {
    assert.ok(sheets.ndjson.includes(`"name":"${name}"`), `missing sheet ${name}`);
  }

  const overview = await workbook.inspect({
    kind: "table",
    sheetId: "开发总览",
    range: "A1:M10",
    include: "values,formulas",
    tableMaxRows: 12,
    tableMaxCols: 14,
    maxChars: 12000,
  });
  assert.ok(overview.ndjson.includes("五板块开发总览"));
  const overviewFormulas = await workbook.inspect({
    kind: "formula",
    sheetId: "开发总览",
    range: "C6:L10",
    maxChars: 12000,
    options: { maxResults: 100 },
  });
  assert.ok(overviewFormulas.ndjson.includes("COUNTIFS"));

  const combinedSheet = workbook.worksheets.getItem("功能需求清单");
  const combinedRows = combinedSheet.getRange("A6:B70").values;
  assert.equal(combinedRows.length, 65, "combined requirement count mismatch");
  assert.deepEqual([...new Set(combinedRows.map((row) => row[1]))], MODULES.map((module) => module.name));
  assert.equal(combinedRows[0][0], "COL-001");
  assert.equal(combinedRows.at(-1)[0], "TPL-010");

  const errors = await workbook.inspect({
    kind: "match",
    searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
    options: { useRegex: true, maxResults: 300 },
    summary: "final formula error scan",
  });
  const errorCount = (errors.ndjson.match(/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/g) ?? []).length;
  console.log(`FORMULA_ERROR_COUNT ${errorCount}`);
  assert.equal(errorCount, 0, "formula error scan must be empty");

  await fs.mkdir(previewDir, { recursive: true });
  const renderSpecs = [
    ["使用说明", "A1:H42"],
    ["开发总览", "A1:M10"],
    ["功能需求清单", "A1:V16"],
  ];
  for (const [sheetName, range] of renderSpecs) {
    const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
    await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
    console.log(`RENDERED ${sheetName}`);
  }
  for (const [label, range] of [["数据标注区段", "A21:V28"], ["标注工作台区段", "A33:V40"], ["数据质检区段", "A49:V56"], ["模版中心区段", "A59:V66"]]) {
    const preview = await workbook.render({ sheetName: "功能需求清单", range, scale: 1, format: "png" });
    await fs.writeFile(path.join(previewDir, `${label}.png`), new Uint8Array(await preview.arrayBuffer()));
    console.log(`RENDERED ${label}`);
  }
  console.log("VISUAL_VERIFICATION_READY");
}

async function main() {
  validateRequirements(requirementsByModule);
  console.log("DATA_VALIDATION_OK");
  if (process.argv.includes("--validate-data")) return;

  const sourcePath = "/Users/zhangxiaozhang/Desktop/任务管理.xlsx";
  const sourceBefore = await fs.stat(sourcePath);
  const outputDir = path.resolve("outputs/019fd4cf-a109-7030-b121-706b12ba373d");
  const outputPath = path.join(outputDir, "具身智能平台_需求开发文档.xlsx");
  const previewDir = "/tmp/codex-requirements-excel-preview";

  const workbook = buildWorkbook();
  await fs.mkdir(outputDir, { recursive: true });
  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(outputPath);
  console.log(`WORKBOOK_EXPORTED ${outputPath}`);

  const sourceAfter = await fs.stat(sourcePath);
  assert.equal(sourceAfter.size, sourceBefore.size, "source workbook size changed");
  assert.equal(sourceAfter.mtimeMs, sourceBefore.mtimeMs, "source workbook timestamp changed");
  await inspectAndRender(outputPath, previewDir);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
