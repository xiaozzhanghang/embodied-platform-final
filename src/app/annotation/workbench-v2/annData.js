export const FPS = 29.36;
export const TOTAL = 1791;

export const HAND = { L: 'LeftHand(左手)', R: 'RightHand(右手)' };
export const HS = { L: '左手', R: '右手' };
export const PAL = ['#5b4bff', '#2db84d', '#fa8c16', '#13c2c2', '#eb2f96', '#8c6d1f'];
export const SKILLS = ['Grasp(抓取)', 'Place(放置)', 'Reset(复位)', 'Push(推)', 'Pull(拉)'];
export const TARGETS = ['台面上方', '桌面', '货架上层', '货架下层', '篮筐'];
export const OBJS = ['安慕希', '可乐', '矿泉水', '薯片', '盒装零食'];

export const TPL = {
  shelf: [['L', 'Grasp(抓取)'], ['L', 'Place(放置)'], ['L', 'Reset(复位)']],
  pick: [['R', 'Grasp(抓取)'], ['R', 'Place(放置)']]
};

export const shortSkill = (s) => (/\((.+)\)/.exec(s) || [0, s])[1];

export const INITIAL_STEPS = [
  { id: 1, hand: 'L', skill: 'Grasp(抓取)', obj: '安慕希', from: '台面上方', to: '桌面', s: 0, e: 300, locked: false },
  { id: 2, hand: 'R', skill: 'Reset(复位)', obj: '安慕希', from: '桌面', to: '台面上方', s: 301, e: 600, locked: false }
];

export const INITIAL_COMMENTS = [
  { id: 1, f: 120, txt: '起点偏晚，建议提前约 10 帧', done: false },
  { id: 2, f: 450, txt: '操作对象应为「可乐」', done: false }
];

export const ANN = [
  { id: 1, pri: 'P0', t: '帧数口径不一致', now: '步骤1为 0–300 帧显示 300f，步骤2为 301–600 帧却显示 299f，相同跨度算出不同帧数。', fix: '统一为“起止均包含”（结束−起始+1），并在界面注明口径。切到“优化版本”可见 301f / 300f。', target: 'card_rng', region: 'cards' },
  { id: 2, pri: 'P0', t: '步骤之间的衔接规则不明', now: '步骤1结束于 300、步骤2起始于 301，是否允许空档/重叠没有任何提示，全靠人眼核对。', fix: '新增步骤起点默认＝上一步终点+1；输入、拖拽时校验重叠并就地提示；相邻边界自动吸附。', target: 'card_start', region: 'cards' },
  { id: 3, pri: 'P1', t: '步骤标题被截断', now: '卡片与时间轴块标题都被截成“LeftHand(左手) Gra…”，看不到操作对象和目标。', fix: '精简为“左手·抓取·安慕希”，完整信息悬浮显示。', target: 'card_title', region: 'cards' },
  { id: 4, pri: 'P1', t: '时间刻度不规整', now: '刻度按 7.5 秒一格（00:07、00:15、00:22…），末尾标 01:00 而总时长是 01:01，没有帧刻度。', fix: '按整数秒自适应刻度；放大后出现帧号刻度；末端对齐总时长。', target: 'ruler_wrap', region: 'static' },
  { id: 5, pri: 'P1', t: '看不到当前播放时间', now: '底部只显示总“时长 01:01”，不知道当前播到第几秒。', fix: '改为“当前 00:12 / 总 01:01”，帧号框可直接输入并跳转。', target: 'chip_dur', region: 'static' },
  { id: 6, pri: 'P0', t: '“开始 / 标记”按钮含义不清', now: '两个大按钮没有说明，标注员要试过才知道点哪个，也不知道对应哪个帧。', fix: '改为“以当前帧为起点 [I]”“以当前帧为终点 [O]”，打点后自动选中并校验。', target: 'btn_start', region: 'static' },
  { id: 7, pri: 'P0', t: '起止帧只能手敲数字', now: '只有数字输入框；要先找到帧再记数字手输，输入后视频也不会跳转预览。', fix: '增加“设为当前帧”、±1 帧微调；输入后视频自动跳到该帧；越界/重叠就地校验。', target: 'card_frames', region: 'cards' },
  { id: 8, pri: 'P0', t: '时间轴不能缩放', now: '固定显示整段约 61 秒，1 帧不到 1 像素，精修起止点几乎无法做到。', fix: '支持缩放（Ctrl+滚轮、＋/－、滑块）、适配全部、聚焦所选；放大后显示帧刻度并可平移。', target: 'zoom_tools', region: 'static' },
  { id: 9, pri: 'P0', t: '视频过长，定位成本高', now: '整段 1791 帧（约 61 秒），实际只标了前 600 帧，每次都要在整条里找位置。', fix: '默认聚焦“未标注区间”；超长视频自动切成 15–20 秒小段并提供上/下一段；空白段可 2–4 倍速跳过。', target: 'video_main', region: 'static' },
  { id: 10, pri: 'P1', t: '拖拽没有吸附和提示', now: '拖拽手柄没有对齐辅助，容易出现缝隙或重叠，拖动时也看不到帧号。', fix: '吸附到播放头和相邻边界；拖动时实时显示帧号与时长；同一手内禁止重叠。', target: 'lanes_wrap', region: 'static' },
  { id: 11, pri: 'P1', t: '缺少区间循环播放', now: '没有只播选中区间的功能，核对起止点要手动来回拖。', fix: '增加“循环所选”开关（L）：只循环当前步骤，便于检查边界。', target: 'btn_loop', region: 'static' },
  { id: 12, pri: 'P0', t: '没有快捷键', now: '全部操作依赖鼠标，也没有任何提示。', fix: '空格播放、←→ 逐帧、Shift+←→ 跳10帧、I/O 打点、[ ] 切步骤、Ctrl+Z 撤销，按 ? 查看。', target: 'btn_keys', region: 'static' },
  { id: 13, pri: 'P1', t: '左右手共用一条轴，需一眼分清手别', now: '左右手步骤只靠标题文字区分，扫一眼分不清是哪只手，也看不出相邻步骤是否换手。', fix: '保持单条时间轴；步骤块上加“左/右”手别标记（蓝/橙），全轴任意两步不允许重叠，换手处自动高亮。', target: 'lanes_hand', region: 'static' },
  { id: 14, pri: 'P0', t: '未标注区间没有提示', now: '600 帧之后约 1190 帧没有任何提示，容易漏标。', fix: '未覆盖区间用斜线高亮并显示帧数，一键“新增步骤”；提交前汇总空白段。', target: 'gaps_notice', region: 'static' },
  { id: 15, pri: 'P1', t: '卡片与视频、时间轴不联动', now: '点击右侧卡片不会带动视频和时间轴，需要自己去找位置。', fix: '点击卡片：选中并跳到该步骤起点；点击时间轴块反向定位卡片。', target: 'card_header', region: 'cards' },
  { id: 16, pri: 'P2', t: '画面上没有当前步骤信息', now: '视频画面上看不出当前处于哪一步。', fix: '画面左下角叠加“当前步骤：01 左手抓取”，不在任何步骤内时提示“未标注”。', target: 'v_step', region: 'static' },
  { id: 17, pri: 'P1', t: '下拉选项不能搜索', now: '操作对象 / 目标是普通下拉，商品多时只能滚动查找。', fix: '支持输入搜索、最近使用置顶（原型中操作对象已支持输入筛选）。', target: 'card_obj', region: 'cards' },
  { id: 18, pri: 'P1', t: '新增步骤要重填所有字段', now: '新增步骤是空白表单，起止帧也要手填。', fix: '自动从第一个空白段起始，继承上一步的末端、技能、对象，只改差异项。', target: 'btn_add', region: 'static' },
  { id: 19, pri: 'P2', t: '折叠卡片信息量太少', now: '折叠卡片只显示被截断的标题，右侧下半部分大片空白。', fix: '折叠态显示摘要（技能·对象·路径·帧数），一屏看全所有步骤。', target: 'card_summary', region: 'cards' },
  { id: 20, pri: 'P2', t: '删除无反馈、无法撤销', now: '垃圾桶紧挨复制/拖拽图标，一点就删，没有任何反馈。', fix: '不弹确认框，改为支持 Ctrl+Z 撤销，并提示“已删除 · 撤销”。', target: 'card_del', region: 'cards' },
  { id: 21, pri: 'P0', t: '提交前没有校验', now: '“生成标注模版”与“完成标注”并排且样式接近，点提交前不做检查。', fix: '提交前弹出校验汇总（步骤数、覆盖率、空白段、缺失字段），可点击跳转；次要按钮降级。点“完成标注”试试。', target: 'btn_done', region: 'static' },
  { id: 22, pri: 'P1', t: '保存状态不可见', now: '状态标签只有“未标注”，不知道有没有保存，关闭页面可能丢数据。', fix: '实时显示“未保存 / 已自动保存 10:30”，离开页面时提示未保存内容。', target: 'st_chip', region: 'static' },
  { id: 23, pri: 'P2', t: '倍速档位偏少', now: '精修边界时常规倍速太快。', fix: '增加 0.25×、0.5×，支持快捷键切换。', target: 'speed_wrap', region: 'static' },
  { id: 24, pri: 'P2', new: 1, optOnly: 1, t: '画面里点选操作对象', now: '“操作对象”要在下拉里翻找，商品种类多时很慢。', fix: '直接点击画面中的商品自动填入对象；后续可接入检测框/分割结果，按离手部最近的物体推荐。', demo: '鼠标移到视频里的商品上会高亮，点击即把所选步骤的“操作对象”设为该商品。', target: 'video_hotspots', region: 'static' },
  { id: 25, pri: 'P0', new: 1, optOnly: 1, t: '步骤模板一键套用', now: '货架抓取流程基本固定（抓取→放置→复位），却要逐个“增加步骤”并重填字段；“生成标注模版”的含义也不清。', fix: '按任务类型预置步骤模板，一键生成骨架（手别、技能已预填），标注员只需对齐起止帧；“生成标注模版”可改为“保存为我的模板”。', demo: '选择模板后点“套用到空白段”，会在第一个放得下的空白段生成步骤骨架。', target: 'tpl_row', region: 'static' },
  { id: 26, pri: 'P1', new: 1, optOnly: 1, t: '重复动作批量生成', now: '连续抓取多件商品时，同样的步骤要反复复制、改帧号。', fix: '“复制并顺延 ×N”：按当前步骤长度向后排布 N 个副本，遇到已有步骤/视频末尾自动停止，之后只需微调。', demo: '展开所选步骤卡片底部，点“×2 / ×3 / ×5”。', target: 'card_rep', region: 'cards' },
  { id: 27, pri: 'P0', new: 1, optOnly: 1, t: '时间轴右键菜单', now: '拆分、合并、删除只能靠新增步骤再手改帧号，没有就地操作。', fix: '步骤块右键：在播放头处拆分、与下一步合并、循环播放、删除；已锁定步骤置灰。', demo: '在时间轴的步骤块上点鼠标右键。', target: 'lanes_ctx', region: 'static' },
  { id: 28, pri: 'P1', new: 1, optOnly: 1, t: '技能与对象/路径联动', now: '每个字段独立选择，选“复位”还要重新选对象和路径。', fix: '选技能后自动带出相关选项：复位＝上一步对象＋反向路径；对象列表按技能过滤（如抓取只列可抓取物）。', demo: '把所选步骤的“原子技能”改成别的，再改成“Reset(复位)”，对象和路径会自动带出。', target: 'card_skill', region: 'cards' },
  { id: 29, pri: 'P0', new: 1, optOnly: 1, t: '标注规则实时校验', now: '“抓取后没有放置”“复位前没有抓取”这类逻辑问题要到审核时才被发现。', fix: '按规则在步骤卡片和时间轴上实时提示（⚠）并在提交前汇总；规则可配置，提交前必须处理或写明原因。', demo: '示例数据已触发提示（步骤卡片与时间轴块上的 ⚠）；补齐对应步骤后提示消失。', target: 'card_warn', region: 'cards' },
  { id: 30, pri: 'P1', new: 1, optOnly: 1, t: '审核批注到具体帧', now: '驳回只能写文字意见，标注员不知道问题出在哪个位置。', fix: '审核人在时间轴具体帧上留批注（🚩），标注员逐条定位修改后标记“已处理”（✅）；可对比修改前后版本。', demo: '点标尺上的 🚩 查看并标记已处理；点“批注当前帧”新增一条。', target: 'btn_comment', region: 'static' },
  { id: 31, pri: 'P0', new: 1, optOnly: 1, t: '帧级精确的技术保障（需先验证）', now: '浏览器 video 默认不能精确到帧，“设为当前帧、逐帧步进”可能有几帧偏差，标注结果不可复现。', fix: '开发前先验证：用 WebCodecs 或后端抽帧缓存实现帧精确定位，并显示当前帧号；若做不到，需在需求里明确容差。', demo: '此项是技术前提，原型仅用“帧精确”标签示意。', target: 'chip_frame', region: 'static' },
  { id: 32, pri: 'P2', new: 1, optOnly: 1, t: '下一条预加载', now: '切换任务时才开始加载视频，等待时间长。', fix: '当前任务后台预加载下一条的视频与标注数据，并显示预加载状态；拖动时按需加载分段。', demo: '顶部显示「下一条 4/20 已预加载 ✓」。', target: 'pill_preload', region: 'static' },
  { id: 33, pri: 'P2', new: 1, optOnly: 1, t: '多视角同步', now: '只有一个相机画面，看不清手与物体的接触细节。', fix: '支持切换 ego/左腕/右腕相机，或并排/画中画显示，播放与拖动保持同步。', demo: '点视频右上角的相机标签切换（画面动态示意）。', target: 'cam_tabs', region: 'static' },
  { id: 34, pri: 'P1', new: 1, optOnly: 1, t: '任务流转', now: '完成一条后要回到列表再选下一条。', fix: '显示队列进度，支持“上一条 / 保存并下一条 / 跳到下一条未标注”，切换前自动保存。', demo: '点底部“保存并下一条”。', target: 'flow_row', region: 'static' },
  { id: 35, pri: 'P2', new: 1, optOnly: 1, t: '效率埋点', now: '不知道每条花了多久、时间耗在哪个操作上。', fix: '记录每条耗时，以及拖拽/手输/撤销/播放次数，用数据定位最耗时的环节，指导下一轮优化。', demo: '点顶部“本条”计时查看操作统计。', target: 'pill_telem', region: 'static' },
  { id: 36, pri: 'P2', new: 1, optOnly: 1, t: '步骤锁定与并发提示', now: '已审核通过的步骤仍可被改动；多人同时打开同一条数据没有任何提示。', fix: '审核通过的步骤自动锁定（不可拖拽/编辑，需先解锁）；顶部显示正在查看的其他人，避免相互覆盖。', demo: '点步骤卡片上的 🔓 锁定，再尝试拖动或编辑。', target: 'card_lock', region: 'cards' },
  { id: 37, pri: 'P2', new: 1, optOnly: 1, t: '布局自适应与记忆', now: '视频区尺寸固定，小屏幕上右侧面板占用空间大。', fix: '视频可放大、右侧面板可折叠，并记住个人布局设置。', demo: '点顶部“放大视频 / 折叠面板”（支持刷新记忆）。', target: 'layout_btns', region: 'static' }
];
