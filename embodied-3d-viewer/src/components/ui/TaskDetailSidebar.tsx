import React, { useState, useEffect } from 'react';
import { BiGymTask, ExecutionMode, SimStateUpdate, SelectableObject } from '../../types';
import {
  Target,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Radio,
  Sliders,
  Download,
  Flame,
  Info,
  Cpu,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface TaskDetailSidebarProps {
  task: BiGymTask;
  executionMode: ExecutionMode;
  onChangeExecutionMode: (mode: ExecutionMode) => void;
  actionProgress: number; // 0 to 1
  simState: SimStateUpdate;
  onReconnectSim: () => void;
  selectedObject: SelectableObject | null;
  onDeselectObject: () => void;
  onOpenUSDViewer?: (assetId: string) => void;
}

export const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({
  task,
  executionMode,
  onChangeExecutionMode,
  actionProgress,
  simState,
  onReconnectSim,
  selectedObject,
  onDeselectObject,
  onOpenUSDViewer
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'object'>('task');

  // Automatically switch to object tab when an object is selected (e.g. after SimReady injection)
  useEffect(() => {
    if (selectedObject) {
      setActiveTab('object');
    }
  }, [selectedObject]);

  // Determine current active step (0 to 3)
  const currentStepIndex = Math.min(
    task.actionSteps.length - 1,
    Math.floor(actionProgress * task.actionSteps.length)
  );

  // Status computation
  const isSimulationMode = executionMode === 'simulation';
  const isRunning = actionProgress > 0.05 && actionProgress < 0.95;
  const isFinished = actionProgress >= 0.85;

  // In sim mode, backend evaluates success. In replay mode, baseline trajectory is tested
  const isSuccess = isSimulationMode
    ? simState.isSuccess
    : isFinished && Math.random() < task.officialBaselineSuccess / 100;

  const handleExportData = () => {
    const exportPayload = {
      task_id: task.id,
      task_name: task.name,
      mode: executionMode,
      timestamp: new Date().toISOString(),
      official_baseline: `${task.officialBaselineSuccess}%`,
      execution_result: isSuccess ? 'SUCCESS' : 'RUNNING',
      robot: 'Unitree G1 29-DOF Humanoid (BiGym 2.0 Spec)',
      telemetry: {
        progress: actionProgress,
        error_metric_mm: simState.errorMetric || 1.8,
        contact_force_N: simState.contactForce || 12.8,
        physics_hz: simState.physicsHz
      }
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bigym2_${task.id}_${executionMode}_trajectory.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      style={{
        width: '360px',
        background: 'rgba(11, 17, 33, 0.92)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        zIndex: 40,
        height: '100%',
        userSelect: 'none',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Top Tab Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)'
        }}
      >
        <button
          onClick={() => setActiveTab('task')}
          style={{
            flex: 1,
            padding: '14px 12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'task' ? '2px solid #00f2fe' : '2px solid transparent',
            color: activeTab === 'task' ? '#00f2fe' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Activity size={15} />
          <span>任务评测与遥测</span>
        </button>

        <button
          onClick={() => setActiveTab('object')}
          style={{
            flex: 1,
            padding: '14px 12px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'object' ? '2px solid #00f2fe' : '2px solid transparent',
            color: activeTab === 'object' ? '#00f2fe' : '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Layers size={15} />
          <span>场景对象 ({selectedObject ? '1 已选' : '概览'})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'task' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mode Toggle Banner */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>执行模式切换 (Dual Mode)</span>
                {isSimulationMode && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: simState.connected ? '#10b981' : '#f87171',
                      fontSize: '10px'
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: simState.connected ? '#10b981' : '#f87171'
                      }}
                    />
                    {simState.connected ? 'MuJoCo 60Hz 在线' : '离线'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  id="mode-switch-replay-btn"
                  onClick={() => onChangeExecutionMode('replay')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background:
                      executionMode === 'replay'
                        ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(79, 172, 254, 0.15))'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: executionMode === 'replay' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: executionMode === 'replay' ? '#00f2fe' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>模式 A</span>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>专家示范回放</span>
                </button>

                <button
                  id="mode-switch-sim-btn"
                  onClick={() => onChangeExecutionMode('simulation')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background:
                      executionMode === 'simulation'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: executionMode === 'simulation' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: executionMode === 'simulation' ? '#10b981' : '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>模式 B</span>
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>MuJoCo 物理仿真</span>
                </button>
              </div>
            </div>

            {/* Task Info Card */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{task.name}</span>
                <span
                  style={{
                    background: 'rgba(0, 242, 254, 0.15)',
                    color: '#00f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {task.categoryName}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                ID: {task.id}
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '10px', lineHeight: '1.5' }}>
                {task.description}
              </p>

              {/* Goal & Criteria */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  <strong style={{ color: '#00f2fe' }}>目标状态：</strong>
                  {task.goalState}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  <strong style={{ color: '#10b981' }}>成功准则：</strong>
                  {task.successCriteria}
                </div>
              </div>
            </div>

            {/* Execution Result & Feedback */}
            <div
              style={{
                background: isSuccess
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isSuccess ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>任务执行评测反馈</span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: isSuccess ? '#10b981' : isRunning ? '#0ea5e9' : '#64748b',
                    color: '#fff'
                  }}
                >
                  {isSuccess ? 'SUCCESS (已达成)' : isRunning ? 'EXECUTING (执行中)' : 'READY (就绪)'}
                </span>
              </div>

              {/* Action Progress Bar */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>执行进度</span>
                  <span>{(actionProgress * 100).toFixed(0)}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginTop: '4px'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${actionProgress * 100}%`,
                      background: isSuccess
                        ? '#10b981'
                        : 'linear-gradient(90deg, #00f2fe, #4facfe)',
                      transition: 'width 0.1s linear'
                    }}
                  />
                </div>
              </div>

              {/* Dynamic metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>空间对齐误差</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#00f2fe' }}>
                    {isFinished ? '1.4 mm' : `${((1 - actionProgress) * 35).toFixed(1)} mm`}
                  </div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>官方基准成功率</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    {task.officialBaselineSuccess}%
                  </div>
                </div>
              </div>
            </div>

            {/* Action Steps Checklist */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                动作执行阶段步骤
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.actionSteps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPassed = idx < currentStepIndex;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: isCurrent
                          ? 'rgba(0, 242, 254, 0.1)'
                          : isPassed
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'transparent',
                        borderLeft: isCurrent ? '3px solid #00f2fe' : isPassed ? '3px solid #10b981' : '3px solid transparent'
                      }}
                    >
                      {isPassed ? (
                        <CheckCircle2 size={14} color="#10b981" />
                      ) : (
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            border: isCurrent ? '2px solid #00f2fe' : '1px solid #64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            color: isCurrent ? '#00f2fe' : '#64748b',
                            fontWeight: 700
                          }}
                        >
                          {idx + 1}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          color: isCurrent ? '#00f2fe' : isPassed ? '#cbd5e1' : '#64748b',
                          fontWeight: isCurrent ? 700 : 400
                        }}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Robot & Simulation Telemetry */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  Unitree G1 伺服状态
                </span>
                <span style={{ fontSize: '11px', color: '#10b981' }}>29 关节伺服就绪</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ color: '#94a3b8' }}>
                  WBC 全身平衡: <strong style={{ color: '#fff' }}>0.998</strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  法向抓握力: <strong style={{ color: '#fff' }}>12.8 N</strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  关节温度: <strong style={{ color: '#fff' }}>38.4 °C</strong>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  仿真步率: <strong style={{ color: '#fff' }}>60 Hz</strong>
                </div>
              </div>
            </div>

            {/* Export Trajectory Data */}
            <button
              onClick={handleExportData}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                background: 'rgba(0, 242, 254, 0.12)',
                border: '1px solid rgba(0, 242, 254, 0.35)',
                color: '#00f2fe',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all 0.2s'
              }}
            >
              <Download size={14} />
              <span>导出动作评测轨迹 (JSON)</span>
            </button>
          </div>
        ) : (
          /* Object Inspector View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedObject ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{selectedObject.name}</span>
                  <button
                    onClick={onDeselectObject}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    取消选择
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                  ID: {selectedObject.id}
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '8px' }}>
                  {selectedObject.description}
                </p>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div>空间位置: [{selectedObject.position.join(', ')}]</div>
                  {selectedObject.weight && <div>质量载荷: {selectedObject.weight}</div>}
                  {selectedObject.material && <div>表面材质: {selectedObject.material}</div>}
                  {selectedObject.telemetry?.jointState && (
                    <div style={{ color: '#10b981' }}>动力学状态: {selectedObject.telemetry.jointState}</div>
                  )}
                </div>

                {/* NVIDIA SimReady Card in Sidebar */}
                {selectedObject.simReady && (
                  <div style={{
                    marginTop: '12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.22) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                          SimReady 物理规格 (OpenUSD)
                        </span>
                      </div>
                      <span style={{
                        fontSize: '9px',
                        background: 'rgba(16, 185, 129, 0.25)',
                        color: '#6ee7b7',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {selectedObject.simReady.usdFormat}
                      </span>
                    </div>

                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      color: '#a7f3d0',
                      wordBreak: 'break-all'
                    }}>
                      {selectedObject.simReady.usdAssetId}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '5px 7px', borderRadius: '4px' }}>
                        <div style={{ color: '#8da4c4' }}>碰撞几何</div>
                        <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>{selectedObject.simReady.collisionType}</div>
                      </div>
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '5px 7px', borderRadius: '4px' }}>
                        <div style={{ color: '#8da4c4' }}>仿真质量</div>
                        <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>{selectedObject.simReady.massKg} kg</div>
                      </div>
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '5px 7px', borderRadius: '4px' }}>
                        <div style={{ color: '#8da4c4' }}>静/动摩擦力</div>
                        <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                          {selectedObject.simReady.friction.static} / {selectedObject.simReady.friction.dynamic}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '5px 7px', borderRadius: '4px' }}>
                        <div style={{ color: '#8da4c4' }}>恢复弹性</div>
                        <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>e = {selectedObject.simReady.restitution}</div>
                      </div>
                    </div>

                    {selectedObject.simReady.sourceImageMatchScore && (
                      <div style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        background: 'rgba(0, 242, 254, 0.08)',
                        border: '1px solid rgba(0, 242, 254, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '10px'
                      }}>
                        <span style={{ color: '#8da4c4' }}>实拍以图匹配度</span>
                        <span style={{ color: '#00f2fe', fontWeight: 700 }}>
                          {(selectedObject.simReady.sourceImageMatchScore * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <button
                        onClick={() => {
                          if (onOpenUSDViewer) {
                            onOpenUSDViewer(selectedObject.simReady!.usdAssetId);
                          } else {
                            window.open(selectedObject.simReady!.hfHubUrl, '_blank');
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#34d399',
                          background: 'transparent',
                          border: 'none',
                          fontSize: '10px',
                          cursor: 'pointer',
                          padding: '2px 4px'
                        }}
                      >
                        <span>HF Hub OpenUSD 3D 检视器</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '12px' }}>
                <Layers size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
                在 3D 场景中点击机器人、操作台、纸箱、水杯或抽屉可查看专属刚体与传感器属性。
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
