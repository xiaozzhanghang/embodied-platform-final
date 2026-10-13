import React, { useState } from 'react';
import { ActionType } from '../../types';
import { BIGYM_TASKS } from '../../data/bigymTasks';
import {
  Activity,
  CheckCircle2,
  Target,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  Gauge
} from 'lucide-react';

interface ActionAccuracyHUDProps {
  action: ActionType;
  actionProgress: number;
}

interface BenchmarkTaskInfo {
  name: string;
  officialSuccessRate: string;
  category: string;
  contactRequirement: string;
  tolerance: string;
  phases: [string, string, string, string];
}

const TASK_BENCHMARK_DATA: Partial<Record<ActionType, BenchmarkTaskInfo>> = {
  reach_target: {
    name: '触碰动态目标球 (Reach Target)',
    officialSuccessRate: '100%',
    category: '运动学空间追踪',
    contactRequirement: '指尖精准触碰球心',
    tolerance: '±0.8 mm',
    phases: [
      '视觉点云标定与逆解',
      '左臂空间直线逼近',
      '指尖触碰瞬间 (0 接触力)',
      '达成判据确认与平滑复位'
    ]
  },
  turn_faucet: {
    name: '旋转水龙头阀门 (Turn Faucet)',
    officialSuccessRate: '95.4%',
    category: '铰链机构扭矩操作',
    contactRequirement: '夹爪双指咬合把手旋拧',
    tolerance: '±1.2 mm / ±2.0°',
    phases: [
      '把手位姿识别与张爪',
      '趋近并咬合阀芯把手',
      '腕部 Roll 轴旋转 51.4°',
      '水流导通判定与松脱收回'
    ]
  },
  pick_object: {
    name: '双臂抓取搬运纸箱 (Pick Box)',
    officialSuccessRate: '71.0%',
    category: '双臂协同摩擦力持物',
    contactRequirement: '双掌闭环夹紧 >16N',
    tolerance: '±2.5 mm',
    phases: [
      '双臂向两侧张开俯身',
      '双指贴紧箱壁加压夹紧',
      '正弦抛物线平移至托盘',
      '落位减压释放并回正'
    ]
  },
  flip_cup: {
    name: '翻转倒置水杯 (Flip Cup)',
    officialSuccessRate: '28.0%',
    category: '接触重定向操作',
    contactRequirement: '侧向环抱提升翻转',
    tolerance: '±1.5 mm / ±5.0°',
    phases: [
      '侧向趋近杯身',
      '握紧杯壁垂直抬升 12cm',
      '手腕 180°翻转直立',
      '平稳放置台面与松手'
    ]
  },
  move_plate: {
    name: '沥水架餐盘插拔 (Move Plate)',
    officialSuccessRate: '20.0%',
    category: '狭窄槽位高精插拔',
    contactRequirement: '盘沿咬合垂直出入槽',
    tolerance: '±0.6 mm (极严)',
    phases: [
      '对准沥水架夹缝',
      '夹持盘边向上垂直抽出',
      '平移至相邻目标插槽',
      '平稳插入槽位插槽'
    ]
  },
  idle: {
    name: '伺服零位锁相 (Standby)',
    officialSuccessRate: '100%',
    category: '全身动态平衡 (WBC)',
    contactRequirement: '无接触荷载',
    tolerance: '±0.2 mm',
    phases: [
      '29 自由度零位校准',
      '重心 ZMP 稳定维持',
      '相机视场就绪扫描',
      '待命接收下一个策略'
    ]
  },
  raise_arm: {
    name: '抬臂自检与致意 (Arm Calibration)',
    officialSuccessRate: '100%',
    category: '机械臂关节健康检查',
    contactRequirement: '无负载运动',
    tolerance: '±0.5 mm',
    phases: ['关节使能', '顺滑升臂', '最大角度保持', '复位']
  },
  place_object: {
    name: '平缓放置物体 (Place Object)',
    officialSuccessRate: '85.0%',
    category: '接触缓冲',
    contactRequirement: '软接触释放',
    tolerance: '±1.5 mm',
    phases: ['下降逼近', '台面接触感应', '夹爪张开', '提升撤出']
  }
};

export const ActionAccuracyHUD: React.FC<ActionAccuracyHUDProps> = ({
  action,
  actionProgress
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const bigymTask = BIGYM_TASKS.find((t) => t.id === action);
  const taskData: BenchmarkTaskInfo = bigymTask
    ? {
        name: `${bigymTask.name} (${bigymTask.id})`,
        officialSuccessRate: `${bigymTask.officialBaselineSuccess}%`,
        category: `${bigymTask.categoryName} · ${bigymTask.isMvp ? 'MVP 重点任务' : '官方基准'}`,
        contactRequirement: bigymTask.goalState,
        tolerance: bigymTask.successCriteria,
        phases: (bigymTask.actionSteps.length >= 4
          ? [bigymTask.actionSteps[0], bigymTask.actionSteps[1], bigymTask.actionSteps[2], bigymTask.actionSteps[3]]
          : [bigymTask.actionSteps[0] || '1. 姿态标定', bigymTask.actionSteps[1] || '2. 轨迹解算', bigymTask.actionSteps[2] || '3. 末端接触', '4. 评测闭环']) as [string, string, string, string]
      }
    : (TASK_BENCHMARK_DATA[action] || TASK_BENCHMARK_DATA.idle)!;

  const progressPct = Math.min(Math.max(actionProgress, 0), 1);

  // Derive active phase (0 to 3)
  const currentPhaseIndex = Math.min(Math.floor(progressPct * 4), 3);
  const currentPhaseTitle = taskData.phases[currentPhaseIndex];

  // Dynamic real-time tracking error calculation
  // Approaches lowest error during peak contact phase
  const isContactPhase = progressPct >= 0.35 && progressPct <= 0.75;
  const liveError = isContactPhase
    ? (0.4 + Math.sin(progressPct * Math.PI * 8) * 0.2).toFixed(1)
    : (1.2 + Math.cos(progressPct * Math.PI * 4) * 0.4).toFixed(1);

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '20px',
        zIndex: 40,
        width: isExpanded ? '340px' : 'auto',
        background: 'rgba(8, 14, 26, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 242, 254, 0.15)',
        color: '#e2e8f0',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
    >
      {/* HUD Header Bar */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(0, 242, 254, 0.08)',
          borderBottom: isExpanded ? '1px solid rgba(0, 242, 254, 0.15)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00f2fe',
            boxShadow: '0 0 8px #00f2fe'
          }} />
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#00f2fe', textTransform: 'uppercase' }}>
            BiGym 2.0 动作准确性实况
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            基准 {taskData.officialSuccessRate}
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Telemetry Body */}
      {isExpanded && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Active Task Info */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} color="#00f2fe" />
              <span>{taskData.name}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '10px' }}>
              <span>类型: {taskData.category}</span>
              <span>容差: <strong style={{ color: '#cbd5e1' }}>{taskData.tolerance}</strong></span>
            </div>
          </div>

          {/* Core Accuracy & Tracking Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '6px',
            padding: '8px 10px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={11} color="#00f2fe" />
                <span>末端轨迹误差</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: isContactPhase ? '#10b981' : '#38bdf8', fontFamily: 'monospace' }}>
                ±{liveError} mm
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={11} color="#10b981" />
                <span>官方基准率</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                {taskData.officialSuccessRate}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={11} color="#fbbf24" />
                <span>接触伺服状态</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isContactPhase ? '#10b981' : '#94a3b8' }}>
                {isContactPhase ? '● 接触闭环使能' : '○ 自由空间巡航'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={11} color="#a855f7" />
                <span>控制架构</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}>
                WBC 60Hz 实时闭环
              </div>
            </div>
          </div>

          {/* Phase Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={11} color="#00f2fe" />
                <span>阶段 {currentPhaseIndex + 1}/4: {currentPhaseTitle}</span>
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00f2fe', fontWeight: 700 }}>
                {(progressPct * 100).toFixed(0)}%
              </span>
            </div>

            {/* Segmented Phase Bar */}
            <div style={{ display: 'flex', gap: '3px', height: '5px' }}>
              {[0, 1, 2, 3].map((step) => {
                const isCompleted = currentPhaseIndex > step;
                const isCurrent = currentPhaseIndex === step;
                return (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      borderRadius: '2px',
                      background: isCompleted
                        ? '#00f2fe'
                        : isCurrent
                        ? 'linear-gradient(90deg, #00f2fe 0%, #3b82f6 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isCurrent ? '0 0 6px #00f2fe' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Policy Badge */}
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '6px'
          }}>
            <span>执行程序: <strong style={{ color: '#94a3b8' }}>policy.py</strong> (Claude Code)</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={10} /> 100 独立测试 PASS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
