import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ActionType } from '../../types';

interface UnitreeG1ModelProps {
  action: ActionType;
  actionProgress: number; // 0 to 1
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (hovered: boolean) => void;
  pickedObjectPosition?: [number, number, number];
  isObjectAttached?: boolean;
}

export const UnitreeG1Model: React.FC<UnitreeG1ModelProps> = ({
  action,
  actionProgress,
  isSelected,
  onSelect,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Joint hierarchy refs
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const rightWristRef = useRef<THREE.Group>(null);
  const rightGripperLRef = useRef<THREE.Mesh>(null);
  const rightGripperRRef = useRef<THREE.Mesh>(null);

  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const leftWristRef = useRef<THREE.Group>(null);

  // PBR materials
  const materials = useMemo(() => {
    return {
      darkChassis: new THREE.MeshStandardMaterial({
        color: '#1a1c23',
        metalness: 0.85,
        roughness: 0.25
      }),
      whiteArmor: new THREE.MeshStandardMaterial({
        color: '#e5e9f0',
        metalness: 0.2,
        roughness: 0.3
      }),
      jointMetal: new THREE.MeshStandardMaterial({
        color: '#4c566a',
        metalness: 0.9,
        roughness: 0.2
      }),
      cyanVisor: new THREE.MeshStandardMaterial({
        color: '#00f2fe',
        emissive: '#00f2fe',
        emissiveIntensity: 0.8,
        roughness: 0.1
      }),
      accentOrange: new THREE.MeshStandardMaterial({
        color: '#ff7700',
        emissive: '#ff7700',
        emissiveIntensity: 0.4
      }),
      highlightRing: new THREE.MeshBasicMaterial({
        color: '#00f2fe',
        wireframe: true,
        transparent: true,
        opacity: 0.6
      })
    };
  }, []);

  // Kinematic joint animations driven per frame
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!torsoRef.current || !rightShoulderRef.current || !rightElbowRef.current || !rightWristRef.current) return;

    if (action === 'idle') {
      // Natural humanoid breathing and micro postural adjustments
      const breath = Math.sin(time * 2.0) * 0.015;
      torsoRef.current.position.y = 0.72 + breath;
      torsoRef.current.rotation.x = Math.sin(time * 1.2) * 0.01;

      // Head slight scanning
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.8) * 0.08;
        headRef.current.rotation.x = Math.sin(time * 1.5) * 0.03;
      }

      // Rest arm pose (slightly bent elbow, natural hang)
      rightShoulderRef.current.rotation.x = 0.15 + Math.sin(time * 1.5) * 0.02;
      rightShoulderRef.current.rotation.z = -0.12;
      rightElbowRef.current.rotation.x = -0.45 + Math.sin(time * 1.5) * 0.02;
      rightWristRef.current.rotation.x = 0.1;

      if (leftShoulderRef.current && leftElbowRef.current) {
        leftShoulderRef.current.rotation.x = 0.15 + Math.sin(time * 1.5 + 0.5) * 0.02;
        leftShoulderRef.current.rotation.z = 0.12;
        leftElbowRef.current.rotation.x = -0.45 + Math.sin(time * 1.5 + 0.5) * 0.02;
      }

      // Grippers neutral
      if (rightGripperLRef.current && rightGripperRRef.current) {
        rightGripperLRef.current.position.x = -0.018;
        rightGripperRRef.current.position.x = 0.018;
      }
    } else if (action === 'raise_arm') {
      // Smooth interpolation for arm raising (reach target)
      const p = actionProgress;
      // Shoulder pitches forward from 0.15 to -1.3 rad (approx 75 deg up)
      rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(0.15, -1.35, p);
      rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(-0.12, -0.25, p);
      rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(-0.45, -0.65, p);
      rightWristRef.current.rotation.x = THREE.MathUtils.lerp(0.1, -0.3, p);

      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.2, p);
        headRef.current.rotation.y = THREE.MathUtils.lerp(0, 0.15, p);
      }
    } else if (action === 'pick_object') {
      // Multi-stage pick trajectory: Reach -> Lower -> Grasp -> Lift
      const p = actionProgress;
      if (p < 0.4) {
        // Stage 1: Approach workbench (reach toward box)
        const subP = p / 0.4;
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(0.15, -0.9, subP);
        rightShoulderRef.current.rotation.y = THREE.MathUtils.lerp(0, -0.2, subP);
        rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(-0.45, -0.85, subP);
        rightWristRef.current.rotation.x = THREE.MathUtils.lerp(0.1, 0.35, subP);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.08, subP); // torso lean forward
      } else if (p < 0.7) {
        // Stage 2: Grasp (gripper fingers close)
        const subP = (p - 0.4) / 0.3;
        if (rightGripperLRef.current && rightGripperRRef.current) {
          rightGripperLRef.current.position.x = THREE.MathUtils.lerp(-0.018, -0.006, subP);
          rightGripperRRef.current.position.x = THREE.MathUtils.lerp(0.018, 0.006, subP);
        }
      } else {
        // Stage 3: Lift object upwards
        const subP = (p - 0.7) / 0.3;
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(-0.9, -1.15, subP);
        rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(-0.85, -1.1, subP);
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(0.08, 0.02, subP);
      }
    } else if (action === 'place_object') {
      // Multi-stage place trajectory: Pivot -> Reach Goal -> Lower -> Release
      const p = actionProgress;
      if (p < 0.4) {
        // Pivot toward target area (right side)
        const subP = p / 0.4;
        rightShoulderRef.current.rotation.y = THREE.MathUtils.lerp(-0.2, 0.35, subP);
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(-1.15, -0.85, subP);
        rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(-1.1, -0.75, subP);
      } else if (p < 0.7) {
        // Lower to table
        const subP = (p - 0.4) / 0.3;
        rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(-0.85, -0.7, subP);
        rightWristRef.current.rotation.x = THREE.MathUtils.lerp(0.35, 0.15, subP);
      } else {
        // Release (grippers open)
        const subP = (p - 0.7) / 0.3;
        if (rightGripperLRef.current && rightGripperRRef.current) {
          rightGripperLRef.current.position.x = THREE.MathUtils.lerp(-0.006, -0.02, subP);
          rightGripperRRef.current.position.x = THREE.MathUtils.lerp(0.006, 0.02, subP);
        }
      }
    }
  });

  return (
    <group
      ref={groupRef}
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
      {/* Ground Base / Stability Ring & Holographic Selection Highlight */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.48, 36]} />
        <meshBasicMaterial
          color={isSelected ? '#00f2fe' : '#1e293b'}
          transparent
          opacity={isSelected ? 0.9 : 0.3}
        />
      </mesh>

      {/* Subtle Holographic Pulse Disc when selected */}
      {isSelected && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.49, 0.52, 36]} />
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.6} />
        </group>
      )}

      {/* Feet & Legs (Stance) */}
      <group position={[0, 0, 0]}>
        {/* Left Foot & Leg */}
        <group position={[-0.12, 0, 0]}>
          <mesh position={[0, 0.03, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[0.09, 0.06, 0.18]} />
            <primitive object={materials.darkChassis} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.26, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
          <mesh position={[0, 0.33, 0]} castShadow>
            <sphereGeometry args={[0.042, 16, 16]} />
            <primitive object={materials.jointMetal} />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.042, 0.038, 0.28, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
        </group>

        {/* Right Foot & Leg */}
        <group position={[0.12, 0, 0]}>
          <mesh position={[0, 0.03, 0.04]} castShadow receiveShadow>
            <boxGeometry args={[0.09, 0.06, 0.18]} />
            <primitive object={materials.darkChassis} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.04, 0.26, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
          <mesh position={[0, 0.33, 0]} castShadow>
            <sphereGeometry args={[0.042, 16, 16]} />
            <primitive object={materials.jointMetal} />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.042, 0.038, 0.28, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
        </group>

        {/* Pelvis Structure */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.26, 0.09, 0.15]} />
          <primitive object={materials.darkChassis} />
        </mesh>
      </group>

      {/* Torso Group (Hierarchical Kinematics Anchor) */}
      <group ref={torsoRef} position={[0, 0.72, 0]}>
        {/* Main Chest Armor */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.28, 0.26, 0.18]} />
          <primitive object={materials.whiteArmor} />
        </mesh>
        {/* Power Status LED Bar */}
        <mesh position={[0, 0.14, 0.092]}>
          <planeGeometry args={[0.14, 0.03]} />
          <primitive object={materials.cyanVisor} />
        </mesh>
        {/* Backpack Computing Unit */}
        <mesh position={[0, 0.14, -0.11]} castShadow>
          <boxGeometry args={[0.22, 0.24, 0.07]} />
          <primitive object={materials.darkChassis} />
        </mesh>

        {/* Head Assembly */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.09, 24, 24]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
          {/* Cyan Sensor Visor (BiGym Head Cam) */}
          <mesh position={[0, 0.02, 0.07]}>
            <boxGeometry args={[0.12, 0.04, 0.04]} />
            <primitive object={materials.cyanVisor} />
          </mesh>
          <mesh position={[0, -0.04, 0.07]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 16]} />
            <primitive object={materials.jointMetal} />
          </mesh>
        </group>

        {/* Left Arm Kinematics Chain */}
        <group ref={leftShoulderRef} position={[-0.18, 0.22, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
            <primitive object={materials.jointMetal} />
          </mesh>
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.032, 0.18, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
          {/* Left Elbow */}
          <group ref={leftElbowRef} position={[0, -0.22, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.038, 16, 16]} />
              <primitive object={materials.jointMetal} />
            </mesh>
            <mesh position={[0, -0.11, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.028, 0.16, 16]} />
              <primitive object={materials.darkChassis} />
            </mesh>
            {/* Left Wrist & Gripper */}
            <group ref={leftWristRef} position={[0, -0.2, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.028, 16, 16]} />
                <primitive object={materials.jointMetal} />
              </mesh>
              <mesh position={[0, -0.04, 0]} castShadow>
                <boxGeometry args={[0.05, 0.04, 0.03]} />
                <primitive object={materials.accentOrange} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Right Arm Kinematics Chain (Active Manipulator) */}
        <group ref={rightShoulderRef} position={[0.18, 0.22, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
            <primitive object={materials.jointMetal} />
          </mesh>
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.032, 0.18, 16]} />
            <primitive object={materials.whiteArmor} />
          </mesh>
          {/* Right Elbow */}
          <group ref={rightElbowRef} position={[0, -0.22, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.038, 16, 16]} />
              <primitive object={materials.jointMetal} />
            </mesh>
            <mesh position={[0, -0.11, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.028, 0.16, 16]} />
              <primitive object={materials.darkChassis} />
            </mesh>
            {/* Right Wrist & Gripper */}
            <group ref={rightWristRef} position={[0, -0.2, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.028, 16, 16]} />
                <primitive object={materials.jointMetal} />
              </mesh>
              {/* Wrist Camera (BiGym Eye-in-Hand) */}
              <mesh position={[0.03, 0.01, 0.02]}>
                <boxGeometry args={[0.02, 0.02, 0.03]} />
                <primitive object={materials.cyanVisor} />
              </mesh>
              {/* Gripper Palm Base */}
              <mesh position={[0, -0.035, 0]} castShadow>
                <boxGeometry args={[0.045, 0.03, 0.04]} />
                <primitive object={materials.accentOrange} />
              </mesh>
              {/* Parallel Gripper Fingers */}
              <mesh ref={rightGripperLRef} position={[-0.018, -0.07, 0]} castShadow>
                <boxGeometry args={[0.008, 0.05, 0.02]} />
                <primitive object={materials.darkChassis} />
              </mesh>
              <mesh ref={rightGripperRRef} position={[0.018, -0.07, 0]} castShadow>
                <boxGeometry args={[0.008, 0.05, 0.02]} />
                <primitive object={materials.darkChassis} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
