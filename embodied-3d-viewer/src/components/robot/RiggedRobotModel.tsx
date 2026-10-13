import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { ActionType } from '../../types';

interface RiggedRobotModelProps {
  action: ActionType;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (hovered: boolean) => void;
}

export const RiggedRobotModel: React.FC<RiggedRobotModelProps> = ({
  action,
  isSelected,
  onSelect,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/RobotExpressive.glb');
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Map our ActionType to RobotExpressive animations:
  // idle -> 'Idle'
  // raise_arm -> 'Wave' or 'ThumbsUp'
  // pick_object -> 'Punch' (reaches forward) or 'Standing'
  // place_object -> 'Sitting' or 'ThumbsUp'
  useEffect(() => {
    if (!actions) return;

    let targetAnimName = 'Idle';
    if (action === 'idle') targetAnimName = 'Idle';
    else if (action === 'raise_arm') targetAnimName = 'Wave';
    else if (action === 'pick_object') targetAnimName = 'Punch';
    else if (action === 'place_object') targetAnimName = 'ThumbsUp';

    // Fade into target animation
    const currentAction = actions[targetAnimName];
    if (currentAction) {
      // Stop other actions
      Object.values(actions).forEach((act) => {
        if (act && act !== currentAction) act.fadeOut(0.3);
      });
      currentAction.reset().fadeIn(0.3).play();
    }

    return () => {
      if (currentAction) currentAction.fadeOut(0.3);
    };
  }, [action, actions]);

  // Clone scene so multiple instances don't collide and set shadows
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      scale={[0.26, 0.26, 0.26]}
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
      {/* Ground Selection Marker */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.8} />
        </mesh>
      )}

      <primitive object={scene} />
    </group>
  );
};

useGLTF.preload('/models/RobotExpressive.glb');
