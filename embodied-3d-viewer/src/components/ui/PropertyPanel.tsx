import React from 'react';
import { SelectableObject } from '../../types';
import { Layers, Target, Eye, Info, Zap, BatteryCharging, Gauge, CheckCircle2, ShieldCheck, ExternalLink, Box } from 'lucide-react';

interface PropertyPanelProps {
  selectedObject: SelectableObject | null;
  onFocusObject: (obj: SelectableObject) => void;
  onDeselect: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedObject,
  onFocusObject,
  onDeselect
}) => {
  return (
    <aside style={{
      width: '320px',
      background: 'rgba(11, 17, 33, 0.88)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(0, 242, 254, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      zIndex: 40,
      userSelect: 'none',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* Panel Title Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} color="#00f2fe" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', color: '#fff' }}>
            对象实时属性面板
          </span>
        </div>
        {selectedObject && (
          <button
            onClick={onDeselect}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            取消选中
          </button>
        )}
      </div>

      {/* Body Content */}
      {selectedObject ? (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Main Name & Category */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                background:
                  selectedObject.category === 'robot'
                    ? 'rgba(0, 242, 254, 0.2)'
                    : selectedObject.category === 'manipulable'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                color:
                  selectedObject.category === 'robot'
                    ? '#00f2fe'
                    : selectedObject.category === 'manipulable'
                    ? '#f59e0b'
                    : '#818cf8',
                border: '1px solid currentColor'
              }}>
                {selectedObject.category === 'robot'
                  ? '具身机器人'
                  : selectedObject.category === 'manipulable'
                  ? '可操作物体'
                  : selectedObject.category === 'sensor'
                  ? '传感器系统'
                  : '工作站设施'}
              </span>
              {selectedObject.isPlaceholder && (
                <span style={{
                  fontSize: '10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  占位模型
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {selectedObject.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                {selectedObject.status}
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#94a3b8'
          }}>
            {selectedObject.description}
          </div>

          {/* Spatial Coordinates Box */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              空间位姿 (Spatial Pose)
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>X: </span>
                {selectedObject.position[0].toFixed(2)}m
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Y: </span>
                {selectedObject.position[1].toFixed(2)}m
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>Z: </span>
                {selectedObject.position[2].toFixed(2)}m
              </div>
            </div>
          </div>

          {/* Physical Attributes */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              物理规格 (Physical Specs)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ color: '#64748b' }}>长宽高尺寸</span>
                <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>
                  {selectedObject.dimensions.map((d) => (d * 100).toFixed(0) + 'cm').join(' × ')}
                </span>
              </div>
              {selectedObject.weight && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ color: '#64748b' }}>质量估算</span>
                  <span style={{ color: '#e2e8f0' }}>{selectedObject.weight}</span>
                </div>
              )}
              {selectedObject.material && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ color: '#64748b' }}>材质表面</span>
                  <span style={{ color: '#e2e8f0' }}>{selectedObject.material}</span>
                </div>
              )}
            </div>
          </div>

          {/* NVIDIA SimReady & OpenUSD Physical Attributes */}
          {selectedObject.simReady && (
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#10b981',
                marginBottom: '8px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>NVIDIA SimReady 官方物理规格 (OpenUSD)</span>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.16) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#8da4c4', fontSize: '10px' }}>USD Asset 句柄:</span>
                  <span style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#6ee7b7',
                    fontWeight: 700
                  }}>
                    {selectedObject.simReady.usdFormat}
                  </span>
                </div>

                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  color: '#a7f3d0',
                  wordBreak: 'break-all'
                }}>
                  {selectedObject.simReady.usdAssetId}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginTop: '4px'
                }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#8da4c4', fontSize: '9px' }}>刚体碰撞凸包</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                      {selectedObject.simReady.collisionType}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#8da4c4', fontSize: '9px' }}>仿真标准质量</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                      {selectedObject.simReady.massKg} kg
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#8da4c4', fontSize: '9px' }}>静/动摩擦力</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                      {selectedObject.simReady.friction.static} / {selectedObject.simReady.friction.dynamic}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#8da4c4', fontSize: '9px' }}>恢复弹性系数</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                      e = {selectedObject.simReady.restitution}
                    </div>
                  </div>
                </div>

                {selectedObject.simReady.sourceImageMatchScore && (
                  <div style={{
                    marginTop: '4px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 242, 254, 0.08)',
                    border: '1px solid rgba(0, 242, 254, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ color: '#8da4c4', fontSize: '10px' }}>实拍图像匹配置信度</span>
                    <span style={{ color: '#00f2fe', fontWeight: 700, fontSize: '11px' }}>
                      {(selectedObject.simReady.sourceImageMatchScore * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '2px' }}>
                  <a
                    href={selectedObject.simReady.hfHubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#34d399',
                      fontSize: '10px',
                      textDecoration: 'none'
                    }}
                  >
                    <span>Hugging Face Hub 3D 预览</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Embodied Telemetry (if available) */}
          {selectedObject.telemetry && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                具身遥测监控 (Live Telemetry)
              </div>
              <div style={{
                background: 'rgba(0, 242, 254, 0.05)',
                border: '1px solid rgba(0, 242, 254, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px'
              }}>
                {selectedObject.telemetry.jointState && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8da4c4' }}>关节伺服状态:</span>
                    <span style={{ color: '#00f2fe', fontWeight: 600 }}>{selectedObject.telemetry.jointState}</span>
                  </div>
                )}
                {selectedObject.telemetry.temperature && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8da4c4' }}>机体工作温度:</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{selectedObject.telemetry.temperature}</span>
                  </div>
                )}
                {selectedObject.telemetry.batteryLevel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8da4c4' }}>动力电池电量:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedObject.telemetry.batteryLevel}%</span>
                  </div>
                )}
                {selectedObject.telemetry.confidence && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8da4c4' }}>位姿检测置信度:</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{(selectedObject.telemetry.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button: Focus Object */}
          <button
            onClick={() => onFocusObject(selectedObject)}
            style={{
              marginTop: '8px',
              padding: '10px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.2) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              borderRadius: '8px',
              color: '#00f2fe',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 242, 254, 0.3)';
              e.currentTarget.style.borderColor = '#00f2fe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.2) 100%)';
              e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.4)';
            }}
          >
            <Eye size={16} />
            视角聚焦此目标 (Focus Target)
          </button>
        </div>
      ) : (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: '#64748b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <Target size={22} color="#64748b" />
          </div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
            尚未选中任何 3D 对象
          </p>
          <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.6' }}>
            在 3D 场景中点击人形机器人、操作台、搬运纸箱或杯子，即可查看详细坐标与伺服遥测。
          </p>
        </div>
      )}
    </aside>
  );
};
