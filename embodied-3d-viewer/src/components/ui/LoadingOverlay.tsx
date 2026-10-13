import React from 'react';
import { useProgress } from '@react-three/drei';
import { Cpu, AlertTriangle } from 'lucide-react';

interface LoadingOverlayProps {
  error?: string | null;
  onRetry?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ error, onRetry }) => {
  const { active, progress, item } = useProgress();

  if (error) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 15, 29, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        color: '#fff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <AlertTriangle size={28} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#ef4444' }}>
          3D 场景与模型加载异常
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {error}
        </p>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          重新尝试加载
        </button>
      </div>
    );
  }

  if (!active && progress >= 100) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(6, 10, 20, 0.92)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      color: '#fff',
      transition: 'opacity 0.4s ease'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.2) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 0 24px rgba(0, 242, 254, 0.3)',
        animation: 'pulse 2s infinite'
      }}>
        <Cpu size={32} color="#00f2fe" />
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '0.5px' }}>
        正在装载具身智能 3D 渲染管线
      </h3>

      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0', fontFamily: 'monospace' }}>
        {item ? `Loading: ${item.split('/').pop()}` : 'Initializing Three.js WebGL & Spatial Physics...'}
      </p>

      {/* Progress Bar */}
      <div style={{ width: '280px', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${progress.toFixed(0)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #00f2fe, #4facfe)',
          transition: 'width 0.2s ease',
          boxShadow: '0 0 10px #00f2fe'
        }} />
      </div>

      <span style={{ marginTop: '10px', fontSize: '12px', color: '#00f2fe', fontFamily: 'monospace', fontWeight: 700 }}>
        {progress.toFixed(0)}%
      </span>
    </div>
  );
};
