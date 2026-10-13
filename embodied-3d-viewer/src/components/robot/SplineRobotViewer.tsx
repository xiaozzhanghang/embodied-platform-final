import React, { useRef, useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application, SPEObject } from '@splinetool/runtime';
import { ActionType, SelectableObject } from '../../types';
import { Cpu, RefreshCw, Layers } from 'lucide-react';

interface SplineRobotViewerProps {
  action: ActionType;
  actionProgress: number;
  selectedObjectId: string | null;
  onSelectObject: (obj: SelectableObject | null) => void;
  onHoverObject?: (name: string | null) => void;
}

export const SplineRobotViewer: React.FC<SplineRobotViewerProps> = ({
  action,
  actionProgress,
  selectedObjectId,
  onSelectObject,
  onHoverObject
}) => {
  const splineRef = useRef<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [splineObjects, setSplineObjects] = useState<string[]>([]);

  // When Spline scene loads
  const handleLoad = (splineApp: Application) => {
    splineRef.current = splineApp;
    setIsLoading(false);

    try {
      // Introspect all objects in Spline scene
      const all = splineApp.getAllObjects();
      const names = all.map((o) => o.name).filter(Boolean);
      console.log('Spline scene objects loaded: ' + names.slice(0, 30).join(', '));
      setSplineObjects(names);
      const bot = splineApp.findObjectByName('Bot');
      if (bot) {
        console.log('Bot object info: pos=' + JSON.stringify(bot.position) + ', scale=' + JSON.stringify(bot.scale));
      }
    } catch (err) {
      console.warn('Error inspecting Spline objects:', err);
    }
  };

  // Handle click on Spline objects
  const handleMouseDown = (e: any) => {
    if (!e || !e.target) return;
    const targetName = e.target.name || 'Spline 具身智能机器人';

    // Construct a rich selectable object from the Spline entity
    const splineObj: SelectableObject = {
      id: 'spline_robot',
      name: targetName.includes('Scene') || targetName.includes('Group') ? 'Spline 超写实具身人形机器人' : targetName,
      category: 'robot',
      status: '高精 PBR 渲染 · Spline 实时物理交互',
      position: [0, 1.1, 0],
      dimensions: [0.65, 1.45, 0.45],
      weight: '42.0 kg (等效轻量化结构)',
      material: '高光防眩涂层 + 哑光碳化纤维 + 柔性硅胶关节',
      isPlaceholder: false,
      modelSource: 'https://prod.spline.design/qBnmld15EAMuLsZo/scene.splinecode',
      description: '由 Spline 3D 专业引擎驱动的高写实度具身智能机器人模型，包含多层级拟真材质、环境光能传递及流畅的鼠标追踪视线交互。',
      telemetry: {
        jointState: 'Spline WebGL 60FPS 实时光照',
        temperature: '36.8 °C',
        batteryLevel: 98,
        payloadCapacity: '5.0 kg',
        torque: '16.5 N·m',
        confidence: 0.999,
        lastUpdate: 'Spline Runtime 实时'
      }
    };

    onSelectObject(splineObj);
  };

  // React to ActionType changes by driving Spline object transforms / events
  useEffect(() => {
    const splineApp = splineRef.current;
    if (!splineApp) return;

    try {
      // Find possible robot limbs or trigger Spline events
      const all = splineApp.getAllObjects();
      const rightArm = all.find((o) =>
        o.name.toLowerCase().includes('arm') ||
        o.name.toLowerCase().includes('hand') ||
        o.name.toLowerCase().includes('right') ||
        o.name.toLowerCase().includes('shoulder')
      );
      const head = all.find((o) =>
        o.name.toLowerCase().includes('head') ||
        o.name.toLowerCase().includes('face')
      );

      if (action === 'idle') {
        splineApp.emitEvent?.('mouseUp', 'Robot');
        splineApp.emitEvent?.('start', 'Robot');
      } else if (action === 'raise_arm') {
        splineApp.emitEvent?.('mouseDown', 'Robot');
        if (rightArm) {
          rightArm.rotation.x = -1.2;
        }
      } else if (action === 'pick_object') {
        if (rightArm) {
          rightArm.rotation.x = -0.8;
          rightArm.position.y += 10;
        }
      } else if (action === 'place_object') {
        if (rightArm) {
          rightArm.rotation.x = -0.5;
          rightArm.rotation.y = 0.4;
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  }, [action]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#060a14' }}>
      {/* Loading indicator */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(6, 10, 20, 0.9)',
          zIndex: 20,
          color: '#00f2fe'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid #00f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            animation: 'pulse 1.5s infinite'
          }}>
            <Cpu size={24} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            正在加载 Spline 高精超写实机器人模型...
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontFamily: 'monospace' }}>
            qBnmld15EAMuLsZo/scene.splinecode (1.3 MB)
          </span>
        </div>
      )}

      {/* Spline Canvas Runtime */}
      <Spline
        scene="https://prod.spline.design/qBnmld15EAMuLsZo/scene.splinecode"
        onLoad={handleLoad}
        onMouseDown={handleMouseDown}
        style={{ width: '100%', height: '100%' }}
      />

      {/* High-tech HUD Watermark Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(10, 15, 29, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: '8px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: '#e2e8f0',
        fontSize: '11px',
        pointerEvents: 'none'
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00f2fe',
          boxShadow: '0 0 10px #00f2fe'
        }} />
        <div>
          <div style={{ fontWeight: 700, color: '#00f2fe' }}>Spline 3D Real-time PBR Core</div>
          <div style={{ color: '#8da4c4', fontSize: '10px' }}>
            交互式光照与鼠标追踪 · 点击机器人任意部位查看属性
          </div>
        </div>
      </div>
    </div>
  );
};
