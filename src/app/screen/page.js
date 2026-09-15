'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Space,
  Tag,
  Progress,
  Button,
  Select,
  Typography,
  Tooltip,
  Badge,
  Row,
  Col
} from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  RollbackOutlined,
  RobotOutlined,
  DashboardOutlined,
  EyeOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  FireOutlined,
  GlobalOutlined,
  NodeIndexOutlined,
  VideoCameraOutlined,
  SlidersOutlined,
  CompassOutlined
} from '@ant-design/icons';
import styles from './screen.module.css';
import Factory3DThree from './components/Factory3DThree';
import Factory3DTwin, { initialStations } from './components/Factory3DTwin';
import MultimodalTelemetry from './components/MultimodalTelemetry';
import DataPipelineFlywheel from './components/DataPipelineFlywheel';
import StationDetailModal from './components/StationDetailModal';

const { Text } = Typography;

// Real-time Event stream initial items
const initialEvents = [
  { id: '1', time: '17:28:42', station: '01号工位', type: 'SUCCESS', msg: 'Episode #148924 质检复核通过 · 双视角时钟对齐 0.03ms' },
  { id: '2', time: '17:28:15', station: '09号工位', type: 'INFO', msg: 'Isaac Sim 批量合成 300 条轨迹自动分发完毕' },
  { id: '3', time: '17:27:50', station: '03号工位', type: 'SUCCESS', msg: '工业四宫格物料上料 · 第 52 条完成并上传' },
  { id: '4', time: '17:27:12', station: '04号工位', type: 'WARN', msg: '毛巾折叠任务 · 检测到末端柔性滑动预警 (已补偿)' },
  { id: '5', time: '17:26:38', station: '02号工位', type: 'SUCCESS', msg: '商超饮料瓶高位分拣 · 目标包围盒标注完成 100%' },
];

export default function FactoryScreenPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState('3D_THREE'); // '3D_THREE' | '3D_TWIN' | 'MULTIMODAL' | 'FLYWHEEL'
  const [currentTime, setCurrentTime] = useState('');
  const [selectedBase, setSelectedBase] = useState('WUXI_01');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [events, setEvents] = useState(initialEvents);

  // Dynamic Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic random event stream update for live cyber feel
  useEffect(() => {
    const eventInterval = setInterval(() => {
      const randomStationNum = Math.floor(Math.random() * 14) + 1;
      const padNum = String(randomStationNum).padStart(2, '0');
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const epId = 148925 + Math.floor(Math.random() * 50);

      const templates = [
        { type: 'SUCCESS', msg: `Episode #${epId} 遥操多模态数据入库 · 格式验证 PASS` },
        { type: 'SUCCESS', msg: `Episode #${epId} 标注审核通过 · 动作完整性 99.6%` },
        { type: 'INFO', msg: `传感器时钟硬件锁相检查通过 · 抖动 < 0.04ms` },
        { type: 'WARN', msg: `轻微视角反光提醒 · 已触发视觉自适应去噪` },
      ];
      const t = templates[Math.floor(Math.random() * templates.length)];

      setEvents(prev => [
        { id: String(Date.now()), time: timeStr, station: `${padNum}号工位`, type: t.type, msg: t.msg },
        ...prev.slice(0, 7)
      ]);
    }, 4500);

    return () => clearInterval(eventInterval);
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setModalVisible(true);
  };

  const handleDrilldownToStream = (station) => {
    setSelectedStation(station);
    setCurrentMode('MULTIMODAL');
  };

  return (
    <div className={styles.screenContainer}>
      <div className={styles.scanlineOverlay} />

      {/* Header Bar */}
      <header className={styles.screenHeader}>
        {/* Left: Base Switcher & Return */}
        <div className={styles.headerLeft}>
          <Button
            type="primary"
            icon={<RollbackOutlined />}
            onClick={() => router.push('/collection/collection-tasks')}
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: '#00f2fe',
              fontWeight: 600,
              fontSize: 12,
              borderRadius: 6
            }}
          >
            返回管理平台
          </Button>

          <Select
            value={selectedBase}
            onChange={setSelectedBase}
            style={{ width: 190 }}
            dropdownStyle={{ background: '#0a1932', border: '1px solid #00f2fe', color: '#fff' }}
            options={[
              { value: 'WUXI_01', label: '📍 无锡1号数采总装基地' },
              { value: 'SHANGHAI_02', label: '📍 上海机器人创新中心' },
              { value: 'SHENZHEN_03', label: '📍 深圳灵巧手实验室' },
            ]}
          />
        </div>

        {/* Center: Glowing Platform Main Title */}
        <div className={styles.headerCenter}>
          <div className={styles.headerTitleDecor}>
            <h1 className={styles.mainTitle}>
              <RobotOutlined style={{ fontSize: 24, color: '#00f2fe' }} />
              天奇 · 具身智能数采工厂指挥中心
            </h1>
          </div>
          <span className={styles.subTitle}>
            Embodied AI Data Factory Digital Twin & Telemetry Command Hub
          </span>
        </div>

        {/* Right: Real-time clock & Fullscreen Toggle */}
        <div className={styles.headerRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,242,254,0.2)' }}>
            <span className={styles.pulseDotGreen} />
            <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#00f2fe', fontWeight: 700 }}>
              {currentTime || '2026-09-01 17:30:00'}
            </span>
          </div>

          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            style={{ color: '#8da4c4', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}
          >
            {isFullscreen ? '退出全屏' : '全屏视效'}
          </Button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className={styles.mainLayoutGrid}>
        {/* Left Column: Collection Capacity & Order Operations */}
        <div className={styles.leftColumn}>
          {/* Panel 1: Throughput KPI Flip Cards */}
          <div className={styles.glassPanel}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <FireOutlined className={styles.panelTitleIcon} />
                <span>数采产能与实时吞吐</span>
              </div>
              <span className={styles.panelTag}>REALTIME</span>
            </div>

            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Metric 1 */}
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>今日采集轨迹数</span>
                  <div className={styles.kpiValueWrapper}>
                    <span className={styles.kpiValue}>14,820</span>
                    <span className={styles.kpiUnit}>Ep</span>
                  </div>
                  <span className={styles.kpiTrend}>▲ +14.2% (环比)</span>
                </div>

                {/* Metric 2 */}
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>有效采集时长</span>
                  <div className={styles.kpiValueWrapper}>
                    <span className={styles.kpiValue}>128.5</span>
                    <span className={styles.kpiUnit}>h</span>
                  </div>
                  <span className={styles.kpiTrend}>▲ 9.2h/工位</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Metric 3 */}
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>数据入库合格率</span>
                  <div className={styles.kpiValueWrapper}>
                    <span className={styles.kpiValue} style={{ color: '#00f5a0' }}>99.35</span>
                    <span className={styles.kpiUnit}>%</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#8da4c4', marginTop: 4 }}>零时钟漂移</span>
                </div>

                {/* Metric 4 */}
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>在线遥操设备</span>
                  <div className={styles.kpiValueWrapper}>
                    <span className={styles.kpiValue}>14</span>
                    <span className={styles.kpiUnit}>/ 16 台</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#00f5a0', marginTop: 4 }}>开机率 87.5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Live Collection Task Execution */}
          <div className={styles.glassPanel} style={{ flex: 1 }}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <ThunderboltOutlined className={styles.panelTitleIcon} />
                <span>数采任务工单实时执行进度</span>
              </div>
              <span className={styles.panelTag}>4 进行中</span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              {[
                { name: '餐盘整理与回收', plan: 'Galbot-厨房场景', percent: 92, done: 460, total: 500, type: '双臂真机' },
                { name: '工业四宫格物料分拣', plan: '天奇-制造装配线', percent: 86, done: 430, total: 500, type: '五指灵巧手' },
                { name: '商超高位饮料抓取', plan: 'Grocery-WLA项目', percent: 75, done: 300, total: 400, type: '轮足仿真机' },
                { name: '透明玻璃杯接水移载', plan: '光学校验攻坚项目', percent: 45, done: 90, total: 200, type: '触觉爪' },
              ].map((task, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{task.name}</span>
                    <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{task.type}</Tag>
                  </div>
                  <div style={{ fontSize: 11, color: '#8da4c4', marginBottom: 6 }}>{task.plan}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: '#8da4c4' }}>进度 ({task.done}/{task.total} Ep)</span>
                    <span style={{ color: '#00f2fe', fontWeight: 700 }}>{task.percent}%</span>
                  </div>
                  <Progress
                    percent={task.percent}
                    size="small"
                    strokeColor={{ '0%': '#00f2fe', '100%': '#00f5a0' }}
                    trailColor="rgba(255,255,255,0.1)"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Operator Efficiency Leaderboard */}
          <div className={styles.glassPanel}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <RobotOutlined className={styles.panelTitleIcon} />
                <span>当班遥操员与工位人效榜</span>
              </div>
              <span className={styles.panelTag}>TOP 3</span>
            </div>

            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { rank: '1', name: '林嘉禾', station: '01号工位', output: '320 Ep/日', rate: '98.6%', badge: '#faad14' },
                { rank: '2', name: '张晓明', station: '02号工位', output: '298 Ep/日', rate: '97.2%', badge: '#d9d9d9' },
                { rank: '3', name: '王立强', station: '03号工位', output: '285 Ep/日', rate: '96.5%', badge: '#d48806' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: item.badge, color: '#000', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.rank}
                    </span>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.name}</span>
                      <span style={{ fontSize: 11, color: '#8da4c4', marginLeft: 6 }}>{item.station}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#00f5a0', fontWeight: 700 }}>{item.output}</div>
                    <div style={{ fontSize: 10, color: '#8da4c4' }}>合格率 {item.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Interactive Master Visual Centerpiece */}
        <div className={styles.centerColumn}>
          {/* Visual Container */}
          <div className={styles.centerVisualWrapper}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            {/* Mode Switcher Tabs */}
            <div className={styles.centerModeBar}>
              <button
                className={`${styles.modeTabBtn} ${currentMode === '3D_THREE' ? styles.modeTabBtnActive : ''}`}
                onClick={() => setCurrentMode('3D_THREE')}
              >
                <RobotOutlined />
                Three.js 3D 车间孪生
              </button>
              <button
                className={`${styles.modeTabBtn} ${currentMode === '3D_TWIN' ? styles.modeTabBtnActive : ''}`}
                onClick={() => setCurrentMode('3D_TWIN')}
              >
                <CompassOutlined />
                2.5D 高清数采沙盘
              </button>
              <button
                className={`${styles.modeTabBtn} ${currentMode === 'MULTIMODAL' ? styles.modeTabBtnActive : ''}`}
                onClick={() => setCurrentMode('MULTIMODAL')}
              >
                <VideoCameraOutlined />
                实时多模态数采流
              </button>
              <button
                className={`${styles.modeTabBtn} ${currentMode === 'FLYWHEEL' ? styles.modeTabBtnActive : ''}`}
                onClick={() => setCurrentMode('FLYWHEEL')}
              >
                <NodeIndexOutlined />
                数据资产流动飞轮
              </button>
            </div>

            {/* Dynamic Visual Content */}
            <div style={{ width: '100%', height: '100%', paddingTop: 52 }}>
              {currentMode === '3D_THREE' && (
                <Factory3DThree onSelectStation={handleStationClick} />
              )}
              {currentMode === '3D_TWIN' && (
                <Factory3DTwin onSelectStation={handleStationClick} />
              )}
              {currentMode === 'MULTIMODAL' && (
                <MultimodalTelemetry selectedStation={selectedStation} />
              )}
              {currentMode === 'FLYWHEEL' && (
                <DataPipelineFlywheel />
              )}
            </div>
          </div>

          {/* Bottom Stream & Live Ticker */}
          <div className={`${styles.glassPanel} ${styles.bottomStreamPanel}`}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader} style={{ padding: '6px 14px' }}>
              <div className={styles.panelTitle} style={{ fontSize: 12 }}>
                <DatabaseOutlined className={styles.panelTitleIcon} />
                <span>实时多模态数采流水与事件播报 (Live Multimodal Event Log)</span>
              </div>
              <span style={{ fontSize: 11, color: '#8da4c4' }}>
                吞吐速率: <b style={{ color: '#00f2fe' }}>2.45 GB/s</b> | 硬件同步漂移: <b style={{ color: '#00f5a0' }}>0.032ms</b>
              </span>
            </div>

            <div className={styles.streamList}>
              {events.map((ev) => (
                <div key={ev.id} className={styles.streamItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: ev.type === 'SUCCESS' ? '#00f5a0' : ev.type === 'WARN' ? '#faad14' : '#00f2fe'
                    }} />
                    <span style={{ color: '#8da4c4', fontFamily: 'monospace' }}>[{ev.time}]</span>
                    <Tag color="cyan" style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>{ev.station}</Tag>
                    <span style={{ color: '#e2e8f0' }}>{ev.msg}</span>
                  </div>
                  <span style={{ color: ev.type === 'SUCCESS' ? '#00f5a0' : ev.type === 'WARN' ? '#faad14' : '#00f2fe', fontWeight: 600 }}>
                    {ev.type === 'SUCCESS' ? 'PASS' : ev.type === 'WARN' ? 'WARN' : 'INFO'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: QA Governance & Data Asset Profiling */}
        <div className={styles.rightColumn}>
          {/* Panel 1: QA Governance & Defect Filter */}
          <div className={styles.glassPanel}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <CheckCircleOutlined className={styles.panelTitleIcon} />
                <span>数据质检合规与缺陷拦截</span>
              </div>
              <span className={styles.panelTag} style={{ color: '#00f5a0', borderColor: '#00f5a0' }}>
                合格率 98.8%
              </span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Pass Rate Bar */}
              <div style={{ background: 'rgba(0, 245, 160, 0.05)', border: '1px solid rgba(0, 245, 160, 0.15)', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#8da4c4' }}>质检一次通过率 (First-Pass Rate)</span>
                  <span style={{ color: '#00f5a0', fontWeight: 800 }}>98.8%</span>
                </div>
                <Progress
                  percent={98.8}
                  strokeColor="#00f5a0"
                  trailColor="rgba(255,255,255,0.1)"
                  showInfo={false}
                />
              </div>

              {/* Defect Distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#8da4c4' }}>拦截异常类型分布 (Anomaly Filter):</span>
                {[
                  { name: '轨迹抖动与奇异点', ratio: '34%', count: '28例', color: '#ff4d4f' },
                  { name: '时钟时间戳漂移 (>0.1ms)', ratio: '28%', count: '23例', color: '#faad14' },
                  { name: '视角遮挡 / 光学过曝', ratio: '22%', count: '18例', color: '#1677ff' },
                  { name: '夹爪空抓与滑脱', ratio: '16%', count: '13例', color: '#a855f7' },
                ].map((def, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: def.color }} />
                      <span style={{ color: '#e2e8f0' }}>{def.name}</span>
                    </div>
                    <Space size={8}>
                      <span style={{ color: '#8da4c4' }}>{def.count}</span>
                      <span style={{ color: def.color, fontWeight: 700 }}>{def.ratio}</span>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: Multimodal Asset Profiling */}
          <div className={styles.glassPanel} style={{ flex: 1 }}>
            <div className={styles.cornerDecorTL} />
            <div className={styles.cornerDecorTR} />
            <div className={styles.cornerDecorBL} />
            <div className={styles.cornerDecorBR} />

            <div className={styles.panelHeader}>
              <div className={styles.panelTitle}>
                <DatabaseOutlined className={styles.panelTitleIcon} />
                <span>具身数据资产多维画像</span>
              </div>
              <span className={styles.panelTag}>1.42M EPISODES</span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              {/* Dimension 1: Scene Category */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8da4c4', marginBottom: 6 }}>
                  <span>物理场域分布 (Scene Distribution)</span>
                  <span style={{ color: '#00f2fe' }}>4 大场景库</span>
                </div>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                  <div style={{ width: '38%', background: '#38bdf8' }} title="工业制造 38%" />
                  <div style={{ width: '26%', background: '#00f5a0' }} title="商超零售 26%" />
                  <div style={{ width: '22%', background: '#f59e0b' }} title="智能家居/厨房 22%" />
                  <div style={{ width: '14%', background: '#a855f7' }} title="医疗科研 14%" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8da4c4', marginTop: 4 }}>
                  <span>工业 38%</span>
                  <span>商超 26%</span>
                  <span>厨房 22%</span>
                  <span>医疗 14%</span>
                </div>
              </div>

              {/* Dimension 2: Object Material Properties */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8da4c4', marginBottom: 6 }}>
                  <span>物体材质与力控属性 (Material Distribution)</span>
                  <span style={{ color: '#00f5a0' }}>力控标定覆盖</span>
                </div>
                <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                  <div style={{ width: '40%', background: '#6366f1' }} title="刚性金属 40%" />
                  <div style={{ width: '32%', background: '#ec4899' }} title="柔性塑料/海绵 32%" />
                  <div style={{ width: '18%', background: '#00f2fe' }} title="透明/反光玻璃 18%" />
                  <div style={{ width: '10%', background: '#eab308' }} title="铰接门柜 10%" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8da4c4', marginTop: 4 }}>
                  <span>金属 40%</span>
                  <span>柔性 32%</span>
                  <span>透明 18%</span>
                  <span>铰接 10%</span>
                </div>
              </div>

              {/* Dimension 3: End Effector Hardwares */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, color: '#8da4c4', display: 'block', marginBottom: 8 }}>
                  执行末端硬件配比 (End Effectors):
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                  <div>
                    <div style={{ color: '#00f2fe', fontSize: 15, fontWeight: 700 }}>55%</div>
                    <div style={{ color: '#8da4c4', fontSize: 10 }}>二指平行夹爪</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ color: '#00f5a0', fontSize: 15, fontWeight: 700 }}>30%</div>
                    <div style={{ color: '#8da4c4', fontSize: 10 }}>五指仿生灵巧手</div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ color: '#f59e0b', fontSize: 15, fontWeight: 700 }}>15%</div>
                    <div style={{ color: '#8da4c4', fontSize: 10 }}>真空吸附末端</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Station Details Modal */}
      <StationDetailModal
        station={selectedStation}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSwitchToStream={handleDrilldownToStream}
      />
    </div>
  );
}
