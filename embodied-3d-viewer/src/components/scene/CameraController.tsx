import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControllerProps {
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
  onTransitionComplete?: () => void;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  targetPosition,
  targetLookAt,
  onTransitionComplete
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const isTransitioningRef = useRef(false);
  const destPosRef = useRef(new THREE.Vector3());
  const destLookAtRef = useRef(new THREE.Vector3());

  // Listen to preset transitions
  useEffect(() => {
    if (targetPosition && targetLookAt) {
      destPosRef.current.set(...targetPosition);
      destLookAtRef.current.set(...targetLookAt);
      isTransitioningRef.current = true;
    }
  }, [targetPosition, targetLookAt]);

  useFrame((_, delta) => {
    if (isTransitioningRef.current && controlsRef.current) {
      const step = Math.min(delta * 4.0, 1.0); // smooth spring/lerp

      camera.position.lerp(destPosRef.current, step);
      controlsRef.current.target.lerp(destLookAtRef.current, step);
      controlsRef.current.update();

      const posDist = camera.position.distanceTo(destPosRef.current);
      const lookDist = controlsRef.current.target.distanceTo(destLookAtRef.current);

      if (posDist < 0.02 && lookDist < 0.02) {
        camera.position.copy(destPosRef.current);
        controlsRef.current.target.copy(destLookAtRef.current);
        controlsRef.current.update();
        isTransitioningRef.current = false;
        onTransitionComplete?.();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={true}
      dampingFactor={0.06}
      // Mouse interaction bindings
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      // Ground and near plane collision guards
      maxPolarAngle={Math.PI / 2 - 0.05} // strictly prevent piercing into ground
      minDistance={0.8}                  // prevent camera clipping inside robot
      maxDistance={12.0}                 // reasonable outer limit
      onStart={() => {
        // Cancel automated animation if user manually grabs the orbit
        isTransitioningRef.current = false;
      }}
    />
  );
};
