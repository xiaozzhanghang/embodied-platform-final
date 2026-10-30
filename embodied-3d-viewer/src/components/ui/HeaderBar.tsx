import React from 'react';
import { SceneId, RobotModelType } from '../../types';
import { Cpu, Box, Radio, ExternalLink, Activity, Scan, Sparkles } from 'lucide-react';

interface HeaderBarProps {
  sceneId: SceneId;
  onSceneChange: (scene: SceneId) => void;
  robotModelType: RobotModelType;
  onModelTypeChange: (model: RobotModelType) => void;
  onOpenSimReadyModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  sceneId,
  onSceneChange,
  robotModelType,
  onModelTypeChange,
  onOpenSimReadyModal
}) => {
  return (
    <header style={{
      height: '56px',
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 50,
      userSelect: 'none'
    }}>
      {/* Left: Brand & BiGym 2.0 Reference Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#fff',
          fontWeight: 700,
          fontSize: '15px',
          letterSpacing: '-0.3px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 0 12px rgba(0, 242, 254, 0.5)'
          }}>
            <Cpu size={18} strokeWidth={2.5} />
          </div>
          <span>具身智能交互式 3D 场景展示系统</span>
          <span style={{
            fontSize: '11px',
            background: 'rgba(0, 242, 254, 0.12)',
            color: '#00f2fe',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            BiGym 2.0 Benchmark
          </span>
        </div>
      </div>

      {/* Center: Scene Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        gap: '4px'
      }}>
        {[
          { id: 'kitchen_bigym', label: '🍳 厨房家庭操纵 (BiGym)' },
          { id: 'industrial_bench', label: '🏭 工业装配操作台' },
          { id: 'standard_arena', label: '📐 标准几何标定场' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onSceneChange(item.id as SceneId)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: sceneId === item.id ? 600 : 500,
              color: sceneId === item.id ? '#00f2fe' : '#94a3b8',
              background: sceneId === item.id ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              border: sceneId === item.id ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right: Model Driver & Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Image to SimReady 3D Matcher Trigger */}
        <button
          onClick={onOpenSimReadyModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.55)',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#6ee7b7',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 14px rgba(16, 185, 129, 0.25)',
            transition: 'all 0.2s ease'
          }}
          title="上传真实图片或选择数采实拍，基于 Hugging Face & NVIDIA SimReady 库匹配带物理刚体与碰撞体的 3D 资产"
        >
          <Scan size={14} color="#10b981" />
          <span>实景图 ➔ SimReady 3D 资产</span>
        </button>

        {/* Robot Model Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <Box size={14} style={{ color: '#00f2fe' }} />
          <span>机器人本体:</span>
          <select
            value={robotModelType}
            onChange={(e) => onModelTypeChange(e.target.value as RobotModelType)}
            style={{
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="unitree_g1">🤖 Unitree G1 (BiGym 2.0 官方 29-DOF 手眼拓扑)</option>
            <option value="spline_robot">✨ Spline 超写实金属质感展台</option>
            <option value="robot_expressive">RobotExpressive (GLB 骨骼绑定)</option>
            <option value="placeholder_geom">基础几何刚体 (极简碰撞占位)</option>
          </select>
        </div>

        {/* Telemetry Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          color: '#10b981',
          fontWeight: 600
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }} />
          <span>60 FPS · 硬件锁相</span>
        </div>

        {/* BiGym Link */}
        <a
          href="https://bigym2.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          title="打开 BiGym 2.0 原文基准主页"
          style={{
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00f2fe')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </header>
  );
};
