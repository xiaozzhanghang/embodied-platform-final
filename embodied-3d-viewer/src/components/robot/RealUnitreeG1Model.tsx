import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ActionType } from '../../types';

interface RealUnitreeG1ModelProps {
  action: ActionType;
  actionProgress: number; // 0 to 1
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (hovered: boolean) => void;
}

const MODEL_URL = './models/g1_assembled.glb';

export const RealUnitreeG1Model: React.FC<RealUnitreeG1ModelProps> = ({
  action,
  actionProgress,
  isSelected,
  onSelect,
  onHover
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  // Clone scene so each instance has independent transforms
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Ensure all meshes can cast and receive shadows
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name === 'logo_link_mesh' || child.name.includes('logo')) {
        child.visible = false;
      }
    });
    return clone;
  }, [scene]);

  // Lookup key animated joint nodes in the BiGym 2.0 G1 hierarchy
  const jointNodes = useMemo(() => {
    return {
      torso: clonedScene.getObjectByName('torso_link'),
      waistYaw: clonedScene.getObjectByName('waist_yaw_link'),
      waistRoll: clonedScene.getObjectByName('waist_roll_link'),
      rightShoulderPitch: clonedScene.getObjectByName('right_shoulder_pitch_link'),
      rightShoulderRoll: clonedScene.getObjectByName('right_shoulder_roll_link'),
      rightShoulderYaw: clonedScene.getObjectByName('right_shoulder_yaw_link'),
      rightElbow: clonedScene.getObjectByName('right_elbow_link'),
      rightWristRoll: clonedScene.getObjectByName('right_wrist_roll_link'),
      rightWristPitch: clonedScene.getObjectByName('right_wrist_pitch_link'),
      rightWristYaw: clonedScene.getObjectByName('right_wrist_yaw_link'),
      rightDex1Base: clonedScene.getObjectByName('right_dex1_base_link'),
      rightFinger1: clonedScene.getObjectByName('right_dex1_finger_link_1'),
      rightFinger2: clonedScene.getObjectByName('right_dex1_finger_link_2'),

      leftShoulderPitch: clonedScene.getObjectByName('left_shoulder_pitch_link'),
      leftShoulderRoll: clonedScene.getObjectByName('left_shoulder_roll_link'),
      leftShoulderYaw: clonedScene.getObjectByName('left_shoulder_yaw_link'),
      leftElbow: clonedScene.getObjectByName('left_elbow_link'),
      leftWristRoll: clonedScene.getObjectByName('left_wrist_roll_link'),
      leftWristPitch: clonedScene.getObjectByName('left_wrist_pitch_link'),
      leftWristYaw: clonedScene.getObjectByName('left_wrist_yaw_link'),
      leftDex1Base: clonedScene.getObjectByName('left_dex1_base_link'),
      leftFinger1: clonedScene.getObjectByName('left_dex1_finger_link_1'),
      leftFinger2: clonedScene.getObjectByName('left_dex1_finger_link_2'),

      head: clonedScene.getObjectByName('head_link_mesh'),
      logo: clonedScene.getObjectByName('logo_link_mesh'),
    };
  }, [clonedScene]);

  // Dynamic kinematic animation loop with zero-penetration safety invariants
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const {
      torso,
      waistYaw,
      waistRoll,
      rightShoulderPitch,
      rightShoulderRoll,
      rightElbow,
      rightWristRoll,
      rightWristPitch,
      leftShoulderPitch,
      leftShoulderRoll,
      leftElbow,
      leftWristRoll,
      leftWristPitch,
      rightFinger1,
      rightFinger2,
      leftFinger1,
      leftFinger2
    } = jointNodes;

    if (!torso || !rightShoulderPitch || !leftShoulderPitch) return;

    // Reset baseline joint states
    if (rightWristRoll) rightWristRoll.rotation.x = 0;
    if (leftWristRoll) leftWristRoll.rotation.x = 0;
    if (waistRoll) waistRoll.rotation.x = 0;

    // Ergonomic ready posture angles: arms held safely above table surface (table slab Y = 0.76m)
    const readyTorsoX = 0.06;
    const readyRSP = -0.42;
    const readyRSR = 0.10;
    const readyRElb = 0.70;
    const readyLSP = -0.42;
    const readyLSR = -0.10;
    const readyLElb = 0.70;

    if (action === 'idle') {
      // Natural humanoid breathing & standing balance micro-movements
      const breath = Math.sin(time * 2.2) * 0.015;
      torso.rotation.x = readyTorsoX + breath;
      torso.rotation.z = Math.sin(time * 1.1) * 0.008;
      if (waistYaw) waistYaw.rotation.z = Math.sin(time * 0.8) * 0.02;

      // Rest arm pose (arms poised forward ready above tabletop, 12cm clear of table surface)
      rightShoulderPitch.rotation.y = readyRSP + Math.sin(time * 2.0) * 0.015;
      if (rightShoulderRoll) rightShoulderRoll.rotation.x = readyRSR;
      if (rightElbow) rightElbow.rotation.y = readyRElb + Math.sin(time * 2.0) * 0.015;
      if (rightWristPitch) rightWristPitch.rotation.y = -0.15;

      leftShoulderPitch.rotation.y = readyLSP + Math.sin(time * 2.0) * 0.015;
      if (leftShoulderRoll) leftShoulderRoll.rotation.x = readyLSR;
      if (leftElbow) leftElbow.rotation.y = readyLElb + Math.sin(time * 2.0) * 0.015;
      if (leftWristPitch) leftWristPitch.rotation.y = -0.15;

      // Relax fingers
      if (rightFinger1 && rightFinger2) {
        rightFinger1.position.y = 0.006;
        rightFinger2.position.y = -0.006;
      }
      if (leftFinger1 && leftFinger2) {
        leftFinger1.position.y = 0.006;
        leftFinger2.position.y = -0.006;
      }
    } else if (action === 'move_plate' || action === 'move_two_plates') {
      // BiGym 2.0 Move Plate Benchmark: Dual-arm rack manipulation with zero table clipping
      const p = actionProgress;

      // Right arm stays poised ready above workbench for dynamic balance
      rightShoulderPitch.rotation.y = readyRSP;
      if (rightShoulderRoll) rightShoulderRoll.rotation.x = readyRSR;
      if (rightElbow) rightElbow.rotation.y = readyRElb;
      if (rightWristPitch) rightWristPitch.rotation.y = -0.15;

      if (p < 0.35) {
        // Phase 1: Left arm reaches into dish rack slot towards plate at [-0.04, 0.83, -0.38]
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.12, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.10, s);

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.75, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.06, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.88, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.22, s);

        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = 0.006 + 0.014 * s;
          leftFinger2.position.y = -0.006 - 0.014 * s;
        }
      } else if (p < 0.50) {
        // Phase 2: Clamp ceramic plate rim
        const s = (p - 0.35) / 0.15;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = 0.10;

        leftShoulderPitch.rotation.y = -0.75;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = -0.06;
        if (leftElbow) leftElbow.rotation.y = 0.88;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.22;

        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = 0.020 - 0.017 * s;
          leftFinger2.position.y = -0.020 + 0.017 * s;
        }
      } else if (p < 0.75) {
        // Phase 3: Lift plate vertically and translate across to adjacent slot
        const s = (p - 0.50) / 0.25;
        const lift = Math.sin(s * Math.PI) * 0.10;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.10, -0.08, s);

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.75, -0.68, s) - lift * 0.3;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.06, -0.16, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.88, 0.82, s) + lift * 0.2;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.20;
      } else if (p < 0.90) {
        // Phase 4: Insert plate into slot and release
        const s = (p - 0.75) / 0.15;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = -0.08;

        leftShoulderPitch.rotation.y = -0.68;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = -0.16;
        if (leftElbow) leftElbow.rotation.y = 0.82;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.20;

        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = 0.003 + 0.015 * s;
          leftFinger2.position.y = -0.003 - 0.015 * s;
        }
      } else {
        // Phase 5: Smooth retract to ready posture
        const s = (p - 0.90) / 0.10;
        torso.rotation.x = THREE.MathUtils.lerp(0.12, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.08, 0, s);

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.68, readyLSP, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.16, readyLSR, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.82, readyLElb, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.20, -0.15, s);
      }
    } else if (action === 'flip_cup' || action === 'put_cups') {
      // BiGym 2.0 Flip Cup Benchmark: Inverted mug grasp, 180° wrist flip, upright placement
      const p = actionProgress;

      // Inactive left arm poised safely above workbench
      leftShoulderPitch.rotation.y = readyLSP;
      if (leftShoulderRoll) leftShoulderRoll.rotation.x = readyLSR;
      if (leftElbow) leftElbow.rotation.y = readyLElb;
      if (leftWristPitch) leftWristPitch.rotation.y = -0.15;

      if (p < 0.35) {
        // Phase 1: Reach right arm towards mug at [0.12, 0.82, -0.36]
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.12, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, -0.16, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.72, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.16, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.86, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.22, s);
        if (rightWristRoll) rightWristRoll.rotation.x = 0;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.006 + 0.016 * s;
          rightFinger2.position.y = -0.006 - 0.016 * s;
        }
      } else if (p < 0.50) {
        // Phase 2: Clamp mug securely
        const s = (p - 0.35) / 0.15;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = -0.16;

        rightShoulderPitch.rotation.y = -0.72;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.16;
        if (rightElbow) rightElbow.rotation.y = 0.86;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.22;
        if (rightWristRoll) rightWristRoll.rotation.x = 0;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.022 - 0.018 * s;
          rightFinger2.position.y = -0.022 + 0.018 * s;
        }
      } else if (p < 0.78) {
        // Phase 3: Lift mug and flip wrist roll 180° with pitch compensation to prevent table contact
        const s = (p - 0.50) / 0.28;
        const lift = Math.sin(s * Math.PI) * 0.12;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = -0.16;

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.72, -0.62, s) - lift * 0.3;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.16;
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.86, 0.80, s) + lift * 0.2;
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.22, 0.05, s);
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI * s;
      } else if (p < 0.90) {
        // Phase 4: Place cup upright on tabletop and release fingers
        const s = (p - 0.78) / 0.12;
        torso.rotation.x = 0.10;
        if (waistYaw) waistYaw.rotation.z = -0.16;

        rightShoulderPitch.rotation.y = -0.62;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.16;
        if (rightElbow) rightElbow.rotation.y = 0.80;
        if (rightWristPitch) rightWristPitch.rotation.y = 0.05;
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.004 + 0.016 * s;
          rightFinger2.position.y = -0.004 - 0.016 * s;
        }
      } else {
        // Phase 5: Smooth return to ready pose
        const s = (p - 0.90) / 0.10;
        torso.rotation.x = THREE.MathUtils.lerp(0.10, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.16, 0, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.62, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.16, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.80, readyRElb, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(0.05, -0.15, s);
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI * (1 - s);
      }
    } else if (action === 'pick_object' || action === 'pick_box') {
      // BiGym 2.0 Pick & Place Box Benchmark: Precision dual-arm grasp, carry, and zero-penetration placement
      // Cardboard box starts at [-0.10, 0.83, -0.30] and transfers to target tray at [0.14, 0.84, -0.30]
      const p = actionProgress;

      if (p < 0.30) {
        // Phase 1: Torso angles forward, waist yaws left to face box at [-0.10, 0.83, -0.30]
        const s = p / 0.30;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.12, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.20, s);

        // Arms start wide/retracted and extend to outer walls of box
        // Left arm abducted outward (lsr: 0.24 -> 0.16)
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.25, -0.68, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.24, 0.16, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.60, 0.82, s);
        if (leftWristPitch) leftWristPitch.rotation.y = -0.18;

        // Right arm abducted outward (rsr: -0.24 -> -0.06)
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.25, -0.65, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.24, -0.06, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.60, 0.78, s);
        if (rightWristPitch) rightWristPitch.rotation.y = -0.18;

        // Open Dex1 fingers wide before contact
        const fingerOpen = THREE.MathUtils.lerp(0.012, 0.022, s);
        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = fingerOpen;
          rightFinger2.position.y = -fingerOpen;
        }
        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = fingerOpen;
          leftFinger2.position.y = -fingerOpen;
        }
      } else if (p < 0.44) {
        // Phase 2: Dual grippers clamp outer cardboard walls with zero mesh penetration
        const s = (p - 0.30) / 0.14;
        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = 0.20;

        leftShoulderPitch.rotation.y = -0.68;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.16, 0.15, s);
        if (leftElbow) leftElbow.rotation.y = 0.82;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.18;

        rightShoulderPitch.rotation.y = -0.65;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = -0.06;
        if (rightElbow) rightElbow.rotation.y = 0.78;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.18;

        // Grip fingers touch outer cardboard surface firmly without penetrating
        const fingerGrip = THREE.MathUtils.lerp(0.022, 0.016, s);
        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = fingerGrip;
          rightFinger2.position.y = -fingerGrip;
        }
        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = fingerGrip;
          leftFinger2.position.y = -fingerGrip;
        }
      } else if (p < 0.73) {
        // Phase 3: Lift box in arc and smoothly swing waist across to target tray at [0.14, 0.84, -0.30]
        const s = (p - 0.44) / 0.29;
        const lift = Math.sin(s * Math.PI) * 0.08;

        torso.rotation.x = 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.20, -0.28, s);

        // Arm posture keeps span wide enough so hands stay strictly outside box volume
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.68, -0.62, s) - lift * 0.22;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.15, 0.12, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.82, 0.78, s) + lift * 0.18;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.18;

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.65, -0.72, s) - lift * 0.22;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.06, -0.14, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.78, 0.84, s) + lift * 0.18;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.18;

        const fingerGrip = 0.016;
        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = fingerGrip;
          rightFinger2.position.y = -fingerGrip;
        }
        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = fingerGrip;
          leftFinger2.position.y = -fingerGrip;
        }
      } else if (p < 0.86) {
        // Phase 4: Box touches down on target tray. Hands IMMEDIATELY OPEN and RETRACT backwards & outwards
        const s = (p - 0.73) / 0.13;
        torso.rotation.x = THREE.MathUtils.lerp(0.12, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.28, 0, s);

        // Immediate release & pull back: pitch pulls to +0.05 (drawing hands completely back to robot body)
        // Left arm abducts outward to the left (LSR positive -> +0.24)
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.62, 0.05, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.12, 0.24, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.78, 0.60, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.18, -0.10, s);

        // Right arm abducts outward to the right (RSR negative -> -0.28)
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.72, 0.05, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.14, -0.28, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.84, 0.60, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.18, -0.10, s);

        // Open fingers wide immediately on release
        const fingerOpen = THREE.MathUtils.lerp(0.016, 0.024, Math.min(1, s * 3));
        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = fingerOpen;
          rightFinger2.position.y = -fingerOpen;
        }
        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = fingerOpen;
          leftFinger2.position.y = -fingerOpen;
        }
      } else {
        // Phase 5: Maintain relaxed poised standby at body sides with safe clearance around target tray
        const s = (p - 0.86) / 0.14;
        torso.rotation.x = readyTorsoX;
        if (waistYaw) waistYaw.rotation.z = 0;

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(0.05, -0.20, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.24, 0.20, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.60, 0.65, s);
        if (leftWristPitch) leftWristPitch.rotation.y = -0.10;

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(0.05, -0.20, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.28, -0.25, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.60, 0.65, s);
        if (rightWristPitch) rightWristPitch.rotation.y = -0.10;
      }
    } else if (action === 'reach_target' || action === 'reach_target_single' || action === 'reach_target_multi_modal') {
      // BiGym 2.0 Reach Target Benchmark (MVP): Sub-millimeter reaching to target sphere at [-0.12, 0.96, -0.35]
      const p = actionProgress;

      rightShoulderPitch.rotation.y = readyRSP;
      if (rightShoulderRoll) rightShoulderRoll.rotation.x = readyRSR;
      if (rightElbow) rightElbow.rotation.y = readyRElb;
      if (rightWristPitch) rightWristPitch.rotation.y = -0.15;

      if (p < 0.35) {
        // Phase 1: Left arm extends straight towards sphere
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.10, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.16, s);

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.90, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.18, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.85, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.30, s);

        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = 0.003;
          leftFinger2.position.y = -0.003;
        }
      } else if (p < 0.68) {
        // Phase 2: Steady tip touch at sphere center
        const s = (p - 0.35) / 0.33;
        const microJitter = Math.sin(s * Math.PI * 4) * 0.003;
        torso.rotation.x = 0.10;
        if (waistYaw) waistYaw.rotation.z = 0.16;

        leftShoulderPitch.rotation.y = -0.90 + microJitter;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = -0.18;
        if (leftElbow) leftElbow.rotation.y = 0.85;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.30;

        if (leftFinger1 && leftFinger2) {
          leftFinger1.position.y = 0.002;
          leftFinger2.position.y = -0.002;
        }
      } else {
        // Phase 3: Smooth retraction to ready pose
        const s = (p - 0.68) / 0.32;
        torso.rotation.x = THREE.MathUtils.lerp(0.10, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.16, 0, s);

        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.90, readyLSP, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.18, readyLSR, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.85, readyLElb, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.30, -0.15, s);
      }
    } else if (action === 'turn_faucet') {
      // BiGym 2.0 Turn Faucet Benchmark: Clamp handle at [0.22, 0.88, -0.42], twist wrist, release
      const p = actionProgress;

      leftShoulderPitch.rotation.y = readyLSP;
      if (leftShoulderRoll) leftShoulderRoll.rotation.x = readyLSR;
      if (leftElbow) leftElbow.rotation.y = readyLElb;
      if (leftWristPitch) leftWristPitch.rotation.y = -0.15;

      if (p < 0.35) {
        // Phase 1: Right arm reaches to faucet handle
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.14, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, -0.20, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.80, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.18, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.92, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.22, s);
        if (rightWristRoll) rightWristRoll.rotation.x = 0;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.006 + 0.016 * s;
          rightFinger2.position.y = -0.006 - 0.016 * s;
        }
      } else if (p < 0.50) {
        // Phase 2: Clamp handle firmly
        const s = (p - 0.35) / 0.15;
        torso.rotation.x = 0.14;
        if (waistYaw) waistYaw.rotation.z = -0.20;

        rightShoulderPitch.rotation.y = -0.80;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.18;
        if (rightElbow) rightElbow.rotation.y = 0.92;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.22;
        if (rightWristRoll) rightWristRoll.rotation.x = 0;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.022 - 0.018 * s;
          rightFinger2.position.y = -0.022 + 0.018 * s;
        }
      } else if (p < 0.76) {
        // Phase 3: Torque rotation - turn wrist roll clockwise by ~50°
        const s = (p - 0.50) / 0.26;
        torso.rotation.x = 0.14;
        if (waistYaw) waistYaw.rotation.z = -0.20;

        rightShoulderPitch.rotation.y = -0.80;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.18;
        if (rightElbow) rightElbow.rotation.y = 0.92;
        if (rightWristRoll) rightWristRoll.rotation.x = (Math.PI / 3.5) * s;
      } else if (p < 0.88) {
        // Phase 4: Release handle
        const s = (p - 0.76) / 0.12;
        torso.rotation.x = 0.14;
        if (waistYaw) waistYaw.rotation.z = -0.20;

        rightShoulderPitch.rotation.y = -0.80;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.18;
        if (rightElbow) rightElbow.rotation.y = 0.92;
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI / 3.5;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.004 + 0.014 * s;
          rightFinger2.position.y = -0.004 - 0.014 * s;
        }
      } else {
        // Phase 5: Smooth return to ready pose
        const s = (p - 0.88) / 0.12;
        torso.rotation.x = THREE.MathUtils.lerp(0.14, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.20, 0, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.80, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.18, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.92, readyRElb, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.22, -0.15, s);
        if (rightWristRoll) rightWristRoll.rotation.x = (Math.PI / 3.5) * (1 - s);
      }
    } else if (action === 'drawer_top_open') {
      // BiGym 2.0 Drawer Top Open Benchmark (MVP):
      // Right hand reaches to drawer handle at [0.45, 0.52, -0.325],
      // grips handle at p=0.25, pulls drawer back along +Z as drawer slides open 19cm, releases at p=0.75
      const p = actionProgress;

      leftShoulderPitch.rotation.y = readyLSP;
      if (leftShoulderRoll) leftShoulderRoll.rotation.x = readyLSR;
      if (leftElbow) leftElbow.rotation.y = readyLElb;
      if (leftWristPitch) leftWristPitch.rotation.y = -0.15;

      if (p < 0.25) {
        const s = p / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.16, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, -0.25, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.58, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.22, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.72, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.10, s);

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.006 + 0.014 * s;
          rightFinger2.position.y = -0.006 - 0.014 * s;
        }
      } else if (p < 0.40) {
        torso.rotation.x = 0.16;
        if (waistYaw) waistYaw.rotation.z = -0.25;

        rightShoulderPitch.rotation.y = -0.58;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.22;
        if (rightElbow) rightElbow.rotation.y = 0.72;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.10;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.002;
          rightFinger2.position.y = -0.002;
        }
      } else if (p < 0.75) {
        const s = (p - 0.40) / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(0.16, 0.08, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.25, -0.18, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.58, -0.32, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.22, 0.20, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.72, 1.05, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.10, -0.18, s);

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.002;
          rightFinger2.position.y = -0.002;
        }
      } else if (p < 0.88) {
        const s = (p - 0.75) / 0.13;
        torso.rotation.x = 0.08;
        if (waistYaw) waistYaw.rotation.z = -0.18;

        rightShoulderPitch.rotation.y = -0.32;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.20;
        if (rightElbow) rightElbow.rotation.y = 1.05;

        if (rightFinger1 && rightFinger2) {
          rightFinger1.position.y = 0.002 + 0.010 * s;
          rightFinger2.position.y = -0.002 - 0.010 * s;
        }
      } else {
        const s = (p - 0.88) / 0.12;
        torso.rotation.x = THREE.MathUtils.lerp(0.08, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.18, 0, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.32, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.20, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(1.05, readyRElb, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.18, -0.15, s);
      }
    } else if (action === 'drawer_top_close') {
      const p = actionProgress;
      leftShoulderPitch.rotation.y = readyLSP;
      if (leftShoulderRoll) leftShoulderRoll.rotation.x = readyLSR;
      if (leftElbow) leftElbow.rotation.y = readyLElb;

      if (p < 0.30) {
        const s = p / 0.30;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.08, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, -0.18, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.32, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.20, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 1.05, s);
      } else if (p < 0.75) {
        const s = (p - 0.30) / 0.45;
        torso.rotation.x = THREE.MathUtils.lerp(0.08, 0.16, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.18, -0.25, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.32, -0.58, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.20, 0.22, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(1.05, 0.72, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(0.16, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.25, 0, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.58, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.22, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.72, readyRElb, s);
      }
    } else if (action === 'reach_target_dual') {
      // BiGym 2.0 Dual-Arm Symmetrical Reaching Benchmark
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.10, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.88, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.22, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.85, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.25, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.88, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.22, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.85, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.25, s);
      } else if (p < 0.68) {
        torso.rotation.x = 0.10;
        leftShoulderPitch.rotation.y = -0.88;
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = -0.22;
        if (leftElbow) leftElbow.rotation.y = 0.85;
        if (leftWristPitch) leftWristPitch.rotation.y = -0.25;

        rightShoulderPitch.rotation.y = -0.88;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = 0.22;
        if (rightElbow) rightElbow.rotation.y = 0.85;
        if (rightWristPitch) rightWristPitch.rotation.y = -0.25;
      } else {
        const s = (p - 0.68) / 0.32;
        torso.rotation.x = THREE.MathUtils.lerp(0.10, readyTorsoX, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.88, readyLSP, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.22, readyLSR, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.85, readyLElb, s);
        if (leftWristPitch) leftWristPitch.rotation.y = THREE.MathUtils.lerp(-0.25, -0.15, s);

        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.88, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.22, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.85, readyRElb, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.25, -0.15, s);
      }
    } else if (action === 'dishwasher_close') {
      const p = actionProgress;
      rightShoulderPitch.rotation.y = readyRSP;
      if (rightShoulderRoll) rightShoulderRoll.rotation.x = readyRSR;
      if (rightElbow) rightElbow.rotation.y = readyRElb;

      if (p < 0.30) {
        const s = p / 0.30;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.18, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.25, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.52, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.18, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.68, s);
      } else if (p < 0.75) {
        const s = (p - 0.30) / 0.45;
        torso.rotation.x = THREE.MathUtils.lerp(0.18, 0.12, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.25, 0.15, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.52, -0.68, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.18, -0.12, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.68, 0.85, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(0.12, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.15, 0, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.68, readyLSP, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.12, readyLSR, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.85, readyLElb, s);
      }
    } else if (action === 'dishwasher_load_cups') {
      // Pick cup from table -> load inverted into upper basket
      const p = actionProgress;
      if (p < 0.30) {
        const s = p / 0.30;
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.72, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.86, s);
        if (leftFinger1 && leftFinger2) { leftFinger1.position.y = 0.020 - 0.015 * s; leftFinger2.position.y = -0.020 + 0.015 * s; }
      } else if (p < 0.75) {
        const s = (p - 0.30) / 0.45;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.15, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.28, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.72, -0.60, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.16, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.86, 0.72, s);
        if (leftWristRoll) leftWristRoll.rotation.x = Math.PI * s;
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(0.15, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.28, 0, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.60, readyLSP, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.72, readyLElb, s);
        if (leftWristRoll) leftWristRoll.rotation.x = Math.PI * (1 - s);
        if (leftFinger1 && leftFinger2) { leftFinger1.position.y = 0.005; leftFinger2.position.y = -0.005; }
      }
    } else if (action === 'dishwasher_load_cutlery') {
      // Pick fork from table -> insert vertically into dishwasher cutlery caddy
      const p = actionProgress;
      if (p < 0.30) {
        const s = p / 0.30;
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.74, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.90, s);
      } else if (p < 0.75) {
        const s = (p - 0.30) / 0.45;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.14, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.25, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.74, -0.58, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, -0.08, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.90, 0.78, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.38, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(0.14, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.25, 0, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.58, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(-0.08, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.78, readyRElb, s);
        if (rightWristPitch) rightWristPitch.rotation.y = -0.15;
      }
    } else if (action === 'dishwasher_load_plates') {
      // Pick plate from table -> insert down into lower dish rack
      const p = actionProgress;
      if (p < 0.30) {
        const s = p / 0.30;
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyLSP, -0.72, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(readyLElb, 0.88, s);
      } else if (p < 0.75) {
        const s = (p - 0.30) / 0.45;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, 0.18, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.26, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.72, -0.48, s);
        if (leftShoulderRoll) leftShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyLSR, -0.14, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.88, 0.65, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(0.18, readyTorsoX, s);
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.26, 0, s);
        leftShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.48, readyLSP, s);
        if (leftElbow) leftElbow.rotation.y = THREE.MathUtils.lerp(0.65, readyLElb, s);
      }
    } else if (action === 'flip_cutlery') {
      // Finger roll contact with table cutlery to flip it over
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.74, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.12, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.90, s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.15, -0.26, s);
      } else if (p < 0.70) {
        const s = (p - 0.35) / 0.35;
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI * 0.4 * s;
        if (rightFinger1) rightFinger1.position.y = 0.006 + 0.010 * s;
      } else {
        const s = (p - 0.70) / 0.30;
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.74, readyRSP, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.90, readyRElb, s);
        if (rightWristRoll) rightWristRoll.rotation.x = Math.PI * 0.4 * (1 - s);
        if (rightWristPitch) rightWristPitch.rotation.y = THREE.MathUtils.lerp(-0.26, -0.15, s);
      }
    } else if (action === 'stack_blocks') {
      // Pick Block B on right -> transfer and stack on Block A on left
      const p = actionProgress;
      if (p < 0.30) {
        const s = p / 0.30;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, -0.12, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.76, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.16, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.92, s);
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.018; rightFinger2.position.y = -0.018; }
      } else if (p < 0.45) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.003; rightFinger2.position.y = -0.003; }
      } else if (p < 0.75) {
        const s = (p - 0.45) / 0.30;
        const lift = Math.sin(s * Math.PI) * 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.12, 0.16, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.76, -0.70, s) - lift * 0.2;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.16, 0.08, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.92, 0.82, s) + lift * 0.2;
      } else if (p < 0.88) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.018; rightFinger2.position.y = -0.018; }
      } else {
        const s = (p - 0.88) / 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.16, 0, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.70, readyRSP, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.82, readyRElb, s);
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.006; rightFinger2.position.y = -0.006; }
      }
    } else if (action === 'saucepan_to_hob') {
      // Pick saucepan handle on left -> lift and carry across to stove hob on right
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.14, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.74, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.10, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.88, s);
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.018; rightFinger2.position.y = -0.018; }
      } else if (p < 0.50) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.003; rightFinger2.position.y = -0.003; }
      } else if (p < 0.75) {
        const s = (p - 0.50) / 0.25;
        const lift = Math.sin(s * Math.PI) * 0.15;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.14, -0.22, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.74, -0.68, s) - lift * 0.2;
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.88, 0.80, s) + lift * 0.2;
      } else if (p < 0.88) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.018; rightFinger2.position.y = -0.018; }
      } else {
        const s = (p - 0.88) / 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.22, 0, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.68, readyRSP, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.80, readyRElb, s);
      }
    } else if (action === 'sandwich_remove') {
      // Compliance force control: gentle pinch of sandwich into meal container
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0, 0.08, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -0.72, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.86, s);
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.016; rightFinger2.position.y = -0.016; }
      } else if (p < 0.50) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.007; rightFinger2.position.y = -0.007; }
      } else if (p < 0.75) {
        const s = (p - 0.50) / 0.25;
        const lift = Math.sin(s * Math.PI) * 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(0.08, -0.18, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.72, -0.66, s) - lift * 0.2;
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.86, 0.78, s) + lift * 0.2;
      } else if (p < 0.88) {
        if (rightFinger1 && rightFinger2) { rightFinger1.position.y = 0.016; rightFinger2.position.y = -0.016; }
      } else {
        const s = (p - 0.88) / 0.12;
        if (waistYaw) waistYaw.rotation.z = THREE.MathUtils.lerp(-0.18, 0, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-0.66, readyRSP, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.78, readyRElb, s);
      }
    } else if (action === 'wall_cupboard_open') {
      // High reach: arm extends up to cupboard handle and pulls outward
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, -0.02, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -1.28, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.22, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.48, s);
      } else if (p < 0.75) {
        const s = (p - 0.35) / 0.40;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.22, 0.38, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-1.28, -1.15, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(-0.02, readyTorsoX, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-1.15, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.38, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.48, readyRElb, s);
      }
    } else if (action === 'wall_cupboard_close') {
      // Pushing open wall cupboard door shut
      const p = actionProgress;
      if (p < 0.35) {
        const s = p / 0.35;
        torso.rotation.x = THREE.MathUtils.lerp(readyTorsoX, -0.02, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(readyRSP, -1.15, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(readyRSR, 0.38, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(readyRElb, 0.50, s);
      } else if (p < 0.75) {
        const s = (p - 0.35) / 0.40;
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.38, 0.22, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-1.15, -1.28, s);
      } else {
        const s = (p - 0.75) / 0.25;
        torso.rotation.x = THREE.MathUtils.lerp(-0.02, readyTorsoX, s);
        rightShoulderPitch.rotation.y = THREE.MathUtils.lerp(-1.28, readyRSP, s);
        if (rightShoulderRoll) rightShoulderRoll.rotation.x = THREE.MathUtils.lerp(0.22, readyRSR, s);
        if (rightElbow) rightElbow.rotation.y = THREE.MathUtils.lerp(0.50, readyRElb, s);
      }
    } else if (action === 'place_object') {
      const p = actionProgress;
      const s = Math.sin(p * Math.PI);
      torso.rotation.x = readyTorsoX + 0.06 * s;
      rightShoulderPitch.rotation.y = readyRSP - 0.30 * s;
      leftShoulderPitch.rotation.y = readyLSP - 0.30 * s;
    } else if (action === 'raise_arm') {
      const p = Math.sin(actionProgress * Math.PI);
      torso.rotation.x = readyTorsoX;
      rightShoulderPitch.rotation.y = readyRSP - 0.70 * p;
      if (rightShoulderRoll) rightShoulderRoll.rotation.x = readyRSR + 0.20 * p;
      if (rightElbow) rightElbow.rotation.y = readyRElb + 0.40 * p;
      leftShoulderPitch.rotation.y = readyLSP;
      if (leftElbow) leftElbow.rotation.y = readyLElb;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0.06]}
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
        document.body.style.cursor = 'default';
        onHover?.(false);
      }}
    >
      {/* Authentic Unitree G1 Humanoid Model (BiGym 2.0 Spec) */}
      <primitive object={clonedScene} />

      {/* Futuristic Holographic Selection Ring at base */}
      {isSelected && (
        <group position={[0, 0.015, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.38, 0.44, 48]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.48, 0.50, 48]} />
            <meshBasicMaterial
              color="#00f2fe"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Subtle floor glow */}
          <pointLight
            position={[0, 0.15, 0]}
            color="#00f2fe"
            intensity={0.8}
            distance={1.2}
          />
        </group>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_URL);
