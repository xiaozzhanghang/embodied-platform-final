import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ActionType } from '../../types';

interface PlaceholderRobotModelProps {
  action: ActionType;
  actionProgress: number;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (hovered: boolean) => void;
}

export const PlaceholderRobotModel: React.FC<PlaceholderRobotModelProps> = ({
  action,
  actionProgress,
  isSelected,
  onSelect,
  onHover
}) => {
  const armRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!armRef.current || !headRef.current) return;

    if (action === 'idle') {
      headRef.current.position.y = 1.35 + Math.sin(time * 2) * 0.01;
      armRef.current.rotation.x = Math.sin(time * 1.5) * 0.05;
    } else if (action === 'raise_arm') {
      armRef.current.rotation.x = -actionProgress * 1.2;
    } else if (action === 'pick_object') {
      armRef.current.rotation.x = -actionProgress * 0.9;
    } else if (action === 'place_object') {
      armRef.current.rotation.x = -0.9 + actionProgress * 0.5;
    }
  });

  return (
    <group
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover?.(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        onHover?.(false);
      }}
    >
      {/* HUD 明确标明占位模型 */}
      <Html position={[0, 1.65, 0]} center distanceFactor={8}>
        <div style={{
          background: 'rgba(255, 107, 107, 0.85)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          border: '1px solid #ff4d4f',
          boxShadow: '0 0 10px rgba(255, 77, 79, 0.5)'
        }}>
          ⚠️ [基础几何体占位模型]
        </div>
      </Html>

      {/* 头部几何体 */}
      <mesh ref={headRef} position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color={isSelected ? '#00f2fe' : '#888899'} wireframe={false} />
      </mesh>

      {/* 躯干几何体 */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.6, 16]} />
        <meshStandardMaterial color={isSelected ? '#00f2fe' : '#555566'} />
      </mesh>

      {/* 手臂层级结构 */}
      <group ref={armRef} position={[0.22, 1.15, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#ffaa00" />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
      </group>

      {/* 底座几何体 */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.5, 16]} />
        <meshStandardMaterial color="#333344" />
      </mesh>
    </group>
  );
};
