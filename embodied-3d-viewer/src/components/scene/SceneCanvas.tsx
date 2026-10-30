import React, { Suspense, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneId, RobotModelType, ActionType, SelectableObject } from '../../types';
import { RoomEnvironment, TableEnvironment } from './RoomEnvironment';
import { CameraController } from './CameraController';
import { RealUnitreeG1Model } from '../robot/RealUnitreeG1Model';
import { RiggedRobotModel } from '../robot/RiggedRobotModel';
import { PlaceholderRobotModel } from '../robot/PlaceholderRobotModel';
import { ManipulableObjects } from './ManipulableObjects';
import { SCENE_OBJECTS } from '../../data/sceneData';

const SceneTracker: React.FC = () => {
  const { scene } = useThree();
  useEffect(() => {
    (window as any).__THREE_SCENE__ = scene;
    (window as any).__THREE__ = THREE;
  }, [scene]);
  return null;
};

interface SceneCanvasProps {
  sceneId: SceneId;
  robotModelType: RobotModelType;
  action: ActionType;
  actionProgress: number;
  selectedObjectId: string | null;
  onSelectObject: (obj: SelectableObject | null) => void;
  cameraTargetPos: [number, number, number] | null;
  cameraTargetLookAt: [number, number, number] | null;
  onCameraTransitionComplete: () => void;
  onHoverObject?: (name: string | null) => void;
  objects?: SelectableObject[];
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  sceneId,
  robotModelType,
  action, // User's selected action for the main focused robot
  actionProgress,
  selectedObjectId,
  onSelectObject,
  cameraTargetPos,
  cameraTargetLookAt,
  onCameraTransitionComplete,
  onHoverObject,
  objects
}) => {
  const currentObjects = objects || SCENE_OBJECTS[sceneId] || [];
  const robotObj = currentObjects.find((o) => o.category === 'robot') || {
    id: 'robot_g1',
    name: 'Unitree G1 具身机器人',
    category: 'robot',
    status: '在线就绪',
    position: [0, 0, 0] as [number, number, number],
    dimensions: [0.55, 1.32, 0.4] as [number, number, number],
    isPlaceholder: robotModelType === 'placeholder_geom',
    description: '主执行机器人'
  };

  // Generate 3x5 Grid of Tasks
  const gridTasks = useMemo(() => {
    const tasks: any[] = [];
    const actions: ActionType[] = ['pick_object', 'move_plate', 'flip_cup', 'turn_faucet', 'reach_target'];
    const ROWS = 3;
    const COLS = 5;
    const SPACING_X = 4;
    const SPACING_Z = 5;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c - Math.floor(COLS / 2)) * SPACING_X;
        const z = (r - Math.floor(ROWS / 2)) * SPACING_Z;
        
        // Make the center robot (0,0) the main selected one reacting to UI.
        const isMain = r === 1 && c === 2;
        
        const taskAction = isMain ? null : actions[(r * COLS + c) % actions.length];
        const stagger = (r * COLS + c) * 0.15;

        tasks.push({ id: `grid_${r}_${c}`, x, z, isMain, taskAction, stagger });
      }
    }
    return tasks;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [1.20, 1.40, 0.90], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          logarithmicDepthBuffer: true
        }}
        onPointerMissed={() => {
          onSelectObject(null);
        }}
      >
        <CameraController
          targetPosition={cameraTargetPos}
          targetLookAt={cameraTargetLookAt}
          onTransitionComplete={onCameraTransitionComplete}
        />

        <SceneTracker />

        <Suspense fallback={null}>
          <RoomEnvironment sceneId={sceneId} />

          {/* Primary Focused Kitchen Workbench & Unitree G1 Humanoid Robot */}
          <group position={[0, 0, 0]}>
            <TableEnvironment sceneId={sceneId} action={action} actionProgress={actionProgress} />

            {robotModelType === 'unitree_g1' && (
              <RealUnitreeG1Model
                action={action}
                actionProgress={actionProgress}
                isSelected={selectedObjectId === 'robot_g1'}
                onSelect={() => onSelectObject(robotObj as SelectableObject)}
                onHover={(hov) => onHoverObject?.(hov ? robotObj.name : null)}
              />
            )}

            {robotModelType === 'robot_expressive' && (
              <RiggedRobotModel
                action={action}
                isSelected={selectedObjectId === 'robot_g1'}
                onSelect={() => onSelectObject(robotObj as SelectableObject)}
                onHover={(hov) => onHoverObject?.(hov ? robotObj.name : null)}
              />
            )}

            {robotModelType === 'placeholder_geom' && (
              <PlaceholderRobotModel
                action={action}
                actionProgress={actionProgress}
                isSelected={selectedObjectId === 'robot_g1'}
                onSelect={() => onSelectObject(robotObj as SelectableObject)}
                onHover={(hov) => onHoverObject?.(hov ? robotObj.name : null)}
              />
            )}

            <ManipulableObjects
              objects={currentObjects}
              selectedObjectId={selectedObjectId}
              onSelectObject={onSelectObject}
              action={action}
              actionProgress={actionProgress}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};
