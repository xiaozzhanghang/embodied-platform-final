import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SelectableObject, ActionType } from '../../types';

interface ManipulableObjectsProps {
  objects: SelectableObject[];
  selectedObjectId: string | null;
  onSelectObject: (obj: SelectableObject) => void;
  action: ActionType;
  actionProgress: number;
}

/**
 * Western Ceramic Dining Plate component.
 * Realistic morphology: sunken inner well, sloping rim, and rounded outer lip.
 * Material: pure white glossy porcelain (#ffffff).
 */
const CeramicDinnerPlate: React.FC<{
  plateRef?: React.RefObject<THREE.Group>;
  position: [number, number, number];
  rotation?: [number, number, number];
  isMoving?: boolean;
}> = ({ plateRef, position, rotation = [0, 0, Math.PI / 2] }) => {
  const points = useMemo(() => [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.06, 0.002),
    new THREE.Vector2(0.08, 0.012),
    new THREE.Vector2(0.10, 0.020),
    new THREE.Vector2(0.102, 0.018),
    new THREE.Vector2(0.098, 0.015),
    new THREE.Vector2(0.075, 0.004),
    new THREE.Vector2(0.06, 0),
    new THREE.Vector2(0, 0)
  ], []);

  return (
    <group ref={plateRef} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.12}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
};

/**
 * Stainless Steel Wire Comb/Slotted Draining Rack component.
 * Exact BiGym 2.0 benchmark morphology:
 * - Polished stainless steel / chrome wire bars
 * - Perimeter base wire frame (26cm x 16cm) with 4 small corner feet
 * - 6 upright inverted-U wire comb dividers creating vertical slots for plates
 */
const WireDrainingRack: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0.01, 0]
}) => {
  const steelMat = (
    <meshStandardMaterial
      color="#cbd5e1"
      metalness={0.92}
      roughness={0.18}
    />
  );

  const rackWidth = 0.26;
  const rackDepth = 0.16;
  const wireR = 0.0025; // 2.5mm wire radius

  const combPositions = [-0.10, -0.06, -0.02, 0.02, 0.06, 0.10];

  return (
    <group position={position}>
      {/* 4 Corner Elevation Feet */}
      {[
        [-rackWidth / 2 + 0.01, -rackDepth / 2 + 0.01],
        [rackWidth / 2 - 0.01, -rackDepth / 2 + 0.01],
        [-rackWidth / 2 + 0.01, rackDepth / 2 - 0.01],
        [rackWidth / 2 - 0.01, rackDepth / 2 - 0.01]
      ].map(([fx, fz], idx) => (
        <mesh key={`foot-${idx}`} position={[fx, -0.005, fz]} castShadow>
          <cylinderGeometry args={[0.003, 0.003, 0.01, 8]} />
          {steelMat}
        </mesh>
      ))}

      {/* Base Perimeter Frame: Front & Back Longitudinal Wire Rods */}
      <mesh position={[0, 0, -rackDepth / 2]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[wireR, wireR, rackWidth, 12]} />
        {steelMat}
      </mesh>
      <mesh position={[0, 0, rackDepth / 2]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[wireR, wireR, rackWidth, 12]} />
        {steelMat}
      </mesh>

      {/* Base Perimeter Frame: Left & Right Transverse Wire Rods */}
      <mesh position={[-rackWidth / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[wireR, wireR, rackDepth, 12]} />
        {steelMat}
      </mesh>
      <mesh position={[rackWidth / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[wireR, wireR, rackDepth, 12]} />
        {steelMat}
      </mesh>

      {/* Bottom Center Longitudinal Support Rails */}
      <mesh position={[0, 0, -0.03]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.002, 0.002, rackWidth - 0.02, 8]} />
        {steelMat}
      </mesh>
      <mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.002, 0.002, rackWidth - 0.02, 8]} />
        {steelMat}
      </mesh>

      {/* Comb Teeth (6 Upright Inverted-U Wire Loops) */}
      {combPositions.map((px, idx) => (
        <group key={`comb-${idx}`} position={[px, 0, 0]}>
          {/* Front upright pin */}
          <mesh position={[0, 0.045, -0.06]} castShadow>
            <cylinderGeometry args={[0.002, 0.002, 0.09, 8]} />
            {steelMat}
          </mesh>
          {/* Rear upright pin */}
          <mesh position={[0, 0.045, 0.06]} castShadow>
            <cylinderGeometry args={[0.002, 0.002, 0.09, 8]} />
            {steelMat}
          </mesh>
          {/* Top connecting bar */}
          <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.002, 0.002, 0.12, 8]} />
            {steelMat}
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Stainless Cutlery Holder/Tray component (Flip Cutlery benchmark holder)
 */
const CutleryHolder: React.FC<{ position?: [number, number, number] }> = ({
  position = [0.06, 0.763, -0.38]
}) => (
  <group position={position}>
    <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.06, 0.010, 0.18]} />
      <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.6} />
    </mesh>
    <mesh position={[0, 0.008, 0]} receiveShadow>
      <boxGeometry args={[0.046, 0.006, 0.166]} />
      <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.4} />
    </mesh>
  </group>
);

/**
 * Heavy Cast-Iron / Nonstick Frying Pan component (Sandwich Remove benchmark)
 */
const FryingPan: React.FC<{ position?: [number, number, number] }> = ({
  position = [-0.08, 0.762, -0.38]
}) => (
  <group position={position}>
    {/* Flat circular base */}
    <mesh position={[0, 0.004, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.10, 0.09, 0.008, 32]} />
      <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} />
    </mesh>
    {/* Flared outer wall */}
    <mesh position={[0, 0.018, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.105, 0.095, 0.024, 32, 1, true]} />
      <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} />
    </mesh>
    {/* Sturdy ergonomic handle */}
    <mesh position={[0, 0.022, 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.010, 0.010, 0.14, 16]} />
      <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
    </mesh>
  </group>
);

export const ManipulableObjects: React.FC<ManipulableObjectsProps> = ({
  objects,
  onSelectObject,
  action,
  actionProgress
}) => {
  const boxMeshRef = useRef<THREE.Group>(null);
  const mugMeshRef = useRef<THREE.Group>(null);
  const mug2MeshRef = useRef<THREE.Group>(null);
  const cupsTrayRef = useRef<THREE.Group>(null);
  const movingPlateRef = useRef<THREE.Group>(null);
  const movingPlate2Ref = useRef<THREE.Group>(null);
  const reachTargetRef = useRef<THREE.Group>(null);
  const reachTargetRightRef = useRef<THREE.Group>(null);
  const cutleryRef = useRef<THREE.Group>(null);
  const blockARef = useRef<THREE.Group>(null);
  const blockBRef = useRef<THREE.Group>(null);
  const saucepanRef = useRef<THREE.Group>(null);
  const sandwichRef = useRef<THREE.Group>(null);
  const mealContainerRef = useRef<THREE.Group>(null);

  const vLeftHand = useMemo(() => new THREE.Vector3(), []);
  const vRightHand = useMemo(() => new THREE.Vector3(), []);

  // Filter objects strictly by active workstation/benchmark cell
  const filteredObjects = useMemo(() => {
    return objects.filter((obj) => {
      if (obj.category === 'robot') return false;
      if (obj.category === 'furniture') return false;
      if (obj.category === 'sensor') return false;

      // ── Target Reaching (open_arena: only red spheres) ──
      if (
        (action === 'reach_target' || action === 'reach_target_single' || action === 'reach_target_multi_modal') &&
        obj.id === 'reach_target'
      ) {
        return true;
      }
      if (action === 'reach_target_dual' && (obj.id === 'reach_target' || obj.id === 'reach_target_right')) {
        return true;
      }

      // ── Tabletop Manipulation: Move Plate (rack_table: only dish_plate) ──
      if (action === 'move_plate' && obj.id === 'dish_plate') return true;
      if (action === 'move_two_plates' && (obj.id === 'dish_plate' || obj.id === 'dish_plate_2')) return true;

      // ── Tabletop Clean Station (tabletop_clean: only target prop) ──
      if (action === 'flip_cup' && obj.id === 'coffee_mug') return true;
      if (action === 'flip_cutlery' && obj.id === 'metal_cutlery') return true;
      if (action === 'stack_blocks' && (obj.id === 'stack_block_a' || obj.id === 'stack_block_b')) return true;

      // ── Dishwasher (dishwasher_unit: loading tasks have only their specific target object) ──
      if (action === 'dishwasher_close') return false; // Furniture-only! No loose tabletop objects!
      if (action === 'dishwasher_load_cups' && obj.id === 'coffee_mug') return true;
      if (action === 'dishwasher_load_cutlery' && obj.id === 'metal_cutlery') return true;
      if (action === 'dishwasher_load_plates' && obj.id === 'dish_plate') return true;

      // ── Furniture-Only Tasks: Absolutely NO loose objects ──
      if (action === 'drawer_top_open' || action === 'drawer_top_close') return false;
      if (action === 'wall_cupboard_open' || action === 'wall_cupboard_close') return false;

      // ── Kitchen / Prep Tasks ──
      if (action === 'saucepan_to_hob' && obj.id === 'saucepan') return true;
      if (action === 'turn_faucet') return false; // Faucet is integrated in RoomEnvironment
      if ((action === 'pick_object' || action === 'pick_box') && (obj.id === 'pick_box' || obj.id === 'target_tray')) {
        return true;
      }
      if (action === 'put_cups' && (obj.id === 'coffee_mug' || obj.id === 'coffee_mug_2' || obj.id === 'cups_tray')) {
        return true;
      }
      if (action === 'sandwich_remove' && (obj.id === 'sandwich' || obj.id === 'meal_container')) {
        return true;
      }

      // ── Fallback / Standby ──
      if (action === 'idle' || action === 'raise_arm' || action === 'place_object') {
        if (obj.id === 'pick_box' || obj.id === 'target_tray') return true;
      }
      return false;
    });
  }, [objects, action]);

  // Synchronized trajectories for BiGym 2.0 benchmark manipulation tasks
  useFrame((state) => {
    const leftHand = state.scene.getObjectByName('left_dex1_base_link');
    const rightHand = state.scene.getObjectByName('right_dex1_base_link');

    // 1. Cardboard Box (Pick Box Benchmark: Dual-arm pick and place on bench)
    // Table surface Y = 0.76m. Box height = 0.14m. Resting center Y = 0.76 + 0.07 = 0.83m.
    // Box starts on left side of workbench [-0.10, 0.83, -0.30] and transfers to target tray [0.14, 0.84, -0.30]
    if (boxMeshRef.current) {
      if (action === 'idle' || action === 'raise_arm' || action === 'place_object') {
        boxMeshRef.current.position.set(-0.10, 0.83, -0.30);
        boxMeshRef.current.rotation.set(0, 0, 0);
      } else if (action === 'pick_object' || action === 'pick_box') {
        const p = actionProgress;
        if (p < 0.44) {
          // Phase 1 & 2: Box rests firmly on workbench surface while robot approaches and clamps
          boxMeshRef.current.position.set(-0.10, 0.83, -0.30);
          boxMeshRef.current.rotation.set(0, 0, 0);
        } else if (p < 0.73) {
          // Phase 3: Lift box in smooth arc to target tray at [0.14, 0.84, -0.30]
          const s = (p - 0.44) / 0.29;
          const arcHeight = Math.sin(s * Math.PI) * 0.08;
          boxMeshRef.current.position.set(
            THREE.MathUtils.lerp(-0.10, 0.14, s),
            0.83 + arcHeight,
            -0.30
          );
          boxMeshRef.current.rotation.set(0, 0, 0);
        } else {
          // Phase 4 & 5: Firmly seated on target tray while hands retract cleanly
          boxMeshRef.current.position.set(0.14, 0.84, -0.30);
          boxMeshRef.current.rotation.set(0, 0, 0);
        }
      }
    }

    // 2. Ceramic Mug (Flip Cup Benchmark)
    if (mugMeshRef.current) {
      if (action === 'flip_cup') {
        const p = actionProgress;
        if (p < 0.35) {
          mugMeshRef.current.position.set(0.12, 0.82, -0.36);
          mugMeshRef.current.rotation.set(0, 0, Math.PI);
        } else if (p < 0.50) {
          mugMeshRef.current.position.set(0.12, 0.82, -0.36);
          mugMeshRef.current.rotation.set(0, 0, Math.PI);
        } else if (p < 0.78) {
          const s3 = (p - 0.50) / 0.28;
          if (rightHand) {
            rightHand.getWorldPosition(vRightHand);
            mugMeshRef.current.position.set(
              THREE.MathUtils.lerp(0.12, vRightHand.x, 0.7),
              Math.max(0.82, vRightHand.y - 0.07),
              THREE.MathUtils.lerp(-0.36, vRightHand.z, 0.7)
            );
          } else {
            const arcHeight = Math.sin(s3 * Math.PI) * 0.12;
            mugMeshRef.current.position.set(0.12, 0.82 + arcHeight, -0.36);
          }
          mugMeshRef.current.rotation.set(0, 0, Math.PI * (1 - s3));
        } else {
          mugMeshRef.current.position.set(0.12, 0.82, -0.36);
          mugMeshRef.current.rotation.set(0, 0, 0);
        }
      } else if (action === 'put_cups') {
        const p = actionProgress;
        if (p < 0.20) {
          mugMeshRef.current.position.set(-0.12, 0.82, -0.36);
        } else if (p < 0.45) {
          const s = (p - 0.20) / 0.25;
          const arc = Math.sin(s * Math.PI) * 0.10;
          mugMeshRef.current.position.set(THREE.MathUtils.lerp(-0.12, 0.13, s), 0.82 + arc, -0.36);
        } else {
          mugMeshRef.current.position.set(0.13, 0.80, -0.36);
        }
      } else if (action === 'dishwasher_load_cups') {
        const p = actionProgress;
        if (p < 0.30) {
          mugMeshRef.current.position.set(0.08, 0.82, -0.36);
          mugMeshRef.current.rotation.set(0, 0, 0);
        } else if (p < 0.75) {
          const s = (p - 0.30) / 0.45;
          const arc = Math.sin(s * Math.PI) * 0.15;
          mugMeshRef.current.position.x = THREE.MathUtils.lerp(0.08, -0.45, s);
          mugMeshRef.current.position.y = THREE.MathUtils.lerp(0.82, 0.52, s) + arc;
          mugMeshRef.current.position.z = THREE.MathUtils.lerp(-0.36, -0.25, s);
          mugMeshRef.current.rotation.z = Math.PI * s;
        } else {
          mugMeshRef.current.position.set(-0.45, 0.52, -0.25);
          mugMeshRef.current.rotation.set(0, 0, Math.PI);
        }
      } else {
        mugMeshRef.current.position.set(0.12, 0.82, -0.36);
        mugMeshRef.current.rotation.set(0, 0, 0);
      }
    }

    // 2b. Second Ceramic Mug (Put Cups Benchmark)
    if (mug2MeshRef.current) {
      if (action === 'put_cups') {
        const p = actionProgress;
        if (p < 0.55) {
          mug2MeshRef.current.position.set(-0.02, 0.82, -0.36);
        } else if (p < 0.85) {
          const s = (p - 0.55) / 0.30;
          const arc = Math.sin(s * Math.PI) * 0.10;
          mug2MeshRef.current.position.set(THREE.MathUtils.lerp(-0.02, 0.19, s), 0.82 + arc, -0.36);
        } else {
          mug2MeshRef.current.position.set(0.19, 0.80, -0.36);
        }
      } else {
        mug2MeshRef.current.position.set(-0.02, 0.82, -0.36);
      }
    }

    // 3. Move Plate Trajectory: Between TWO Draining Racks (Rack 1 -> Rack 2)
    if (movingPlateRef.current) {
      if (action === 'move_plate' || action === 'move_two_plates') {
        const p = actionProgress;
        if (p < 0.30) {
          movingPlateRef.current.position.set(-0.16, 0.08, 0);
        } else if (p < 0.75) {
          const s = (p - 0.30) / 0.45;
          const liftHeight = Math.sin(s * Math.PI) * 0.15;
          movingPlateRef.current.position.x = THREE.MathUtils.lerp(-0.16, 0.14, s);
          movingPlateRef.current.position.y = 0.08 + liftHeight;
        } else {
          movingPlateRef.current.position.set(0.14, 0.08, 0);
        }
      } else if (action === 'dishwasher_load_plates') {
        const p = actionProgress;
        if (p < 0.30) {
          movingPlateRef.current.position.set(-0.16, 0.08, 0);
        } else if (p < 0.75) {
          const s = (p - 0.30) / 0.45;
          const lift = Math.sin(s * Math.PI) * 0.15;
          movingPlateRef.current.position.x = THREE.MathUtils.lerp(-0.16, -0.45, s);
          movingPlateRef.current.position.y = THREE.MathUtils.lerp(0.08, -0.40, s) + lift;
        } else {
          movingPlateRef.current.position.set(-0.45, -0.40, 0);
        }
      } else {
        movingPlateRef.current.position.set(-0.16, 0.08, 0);
      }
    }

    if (movingPlate2Ref.current) {
      if (action === 'move_two_plates') {
        const p = actionProgress;
        if (p < 0.45) {
          movingPlate2Ref.current.position.set(-0.12, 0.08, 0);
        } else if (p < 0.88) {
          const s = (p - 0.45) / 0.43;
          const liftHeight = Math.sin(s * Math.PI) * 0.15;
          movingPlate2Ref.current.position.x = THREE.MathUtils.lerp(-0.12, 0.22, s);
          movingPlate2Ref.current.position.y = 0.08 + liftHeight;
        } else {
          movingPlate2Ref.current.position.set(0.22, 0.08, 0);
        }
      } else {
        movingPlate2Ref.current.position.set(-0.12, 0.08, 0);
      }
    }

    // 4. Reach Target Spheres (Single, Multimodal, Dual)
    // STRICTLY STATIC: Absolutely NO hover sine wave or floating jitter!
    if (reachTargetRef.current) {
      reachTargetRef.current.position.set(-0.12, 0.96, -0.35);
    }
    if (reachTargetRightRef.current) {
      reachTargetRightRef.current.position.set(0.22, 0.96, -0.35);
    }

    // 5. Metal Fork (Flip Cutlery & Dishwasher Load Cutlery)
    if (cutleryRef.current) {
      if (action === 'flip_cutlery') {
        const p = actionProgress;
        if (p < 0.35) {
          cutleryRef.current.position.set(0.06, 0.77, -0.38);
          cutleryRef.current.rotation.set(0, 0, Math.PI);
        } else if (p < 0.70) {
          const s = (p - 0.35) / 0.35;
          const arc = Math.sin(s * Math.PI) * 0.05;
          cutleryRef.current.position.set(0.06, 0.77 + arc, -0.38);
          cutleryRef.current.rotation.set(0, 0, Math.PI * (1 - s));
        } else {
          cutleryRef.current.position.set(0.06, 0.77, -0.38);
          cutleryRef.current.rotation.set(0, 0, 0);
        }
      } else if (action === 'dishwasher_load_cutlery') {
        const p = actionProgress;
        if (p < 0.30) {
          cutleryRef.current.position.set(0.06, 0.77, -0.38);
        } else if (p < 0.75) {
          const s = (p - 0.30) / 0.45;
          const arc = Math.sin(s * Math.PI) * 0.16;
          cutleryRef.current.position.x = THREE.MathUtils.lerp(0.06, -0.40, s);
          cutleryRef.current.position.y = THREE.MathUtils.lerp(0.77, 0.38, s) + arc;
          cutleryRef.current.position.z = THREE.MathUtils.lerp(-0.38, -0.20, s);
          cutleryRef.current.rotation.x = (Math.PI / 2) * s;
        } else {
          cutleryRef.current.position.set(-0.40, 0.38, -0.20);
          cutleryRef.current.rotation.set(Math.PI / 2, 0, 0);
        }
      } else {
        cutleryRef.current.position.set(0.06, 0.77, -0.38);
        cutleryRef.current.rotation.set(0, 0, 0);
      }
    }

    // 6. Stacking Blocks (Stack Blocks Benchmark)
    if (blockBRef.current) {
      if (action === 'stack_blocks') {
        const p = actionProgress;
        if (p < 0.35) {
          blockBRef.current.position.set(0.06, 0.79, -0.38);
        } else if (p < 0.75) {
          const s = (p - 0.35) / 0.40;
          const arc = Math.sin(s * Math.PI) * 0.14;
          blockBRef.current.position.x = THREE.MathUtils.lerp(0.06, -0.08, s);
          blockBRef.current.position.y = THREE.MathUtils.lerp(0.79, 0.85, s) + arc;
          blockBRef.current.position.z = -0.38;
        } else {
          blockBRef.current.position.set(-0.08, 0.85, -0.38);
        }
      } else {
        blockBRef.current.position.set(0.06, 0.79, -0.38);
      }
    }

    // 7. Saucepan (Saucepan to Hob Benchmark)
    if (saucepanRef.current) {
      if (action === 'saucepan_to_hob') {
        const p = actionProgress;
        if (p < 0.35) {
          saucepanRef.current.position.set(-0.14, 0.80, -0.38);
        } else if (p < 0.75) {
          const s = (p - 0.35) / 0.40;
          const arc = Math.sin(s * Math.PI) * 0.15;
          saucepanRef.current.position.x = THREE.MathUtils.lerp(-0.14, 0.20, s);
          saucepanRef.current.position.y = THREE.MathUtils.lerp(0.80, 0.79, s) + arc;
          saucepanRef.current.position.z = THREE.MathUtils.lerp(-0.38, -0.40, s);
        } else {
          saucepanRef.current.position.set(0.20, 0.79, -0.40);
        }
      } else {
        saucepanRef.current.position.set(-0.14, 0.80, -0.38);
      }
    }

    // 8. Sandwich (Sandwich Remove Benchmark: Lifted OUT of the Frying Pan)
    if (sandwichRef.current) {
      if (action === 'sandwich_remove') {
        const p = actionProgress;
        if (p < 0.35) {
          sandwichRef.current.position.set(-0.08, 0.78, -0.38);
        } else if (p < 0.75) {
          const s = (p - 0.35) / 0.40;
          const liftHeight = Math.sin(s * Math.PI) * 0.14; // High lift to clear frying pan rim
          sandwichRef.current.position.x = THREE.MathUtils.lerp(-0.08, 0.14, s);
          sandwichRef.current.position.y = THREE.MathUtils.lerp(0.78, 0.775, s) + liftHeight;
          sandwichRef.current.position.z = -0.38;
        } else {
          sandwichRef.current.position.set(0.14, 0.775, -0.38);
        }
      } else {
        sandwichRef.current.position.set(-0.08, 0.78, -0.38);
      }
    }
  });

  return (
    <group>
      {filteredObjects.map((obj) => {
        // Skip robot / furniture
        if (obj.category === 'robot' || obj.category === 'furniture' || obj.category === 'sensor') return null;

        // ─────────────────────────────────────────────────────────────────
        // 1. Red Solid Static Sphere (BiGym Reaching Target)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'reach_target' || obj.id === 'reach_target_right') {
          const isRight = obj.id === 'reach_target_right';
          return (
            <group
              key={obj.id}
              ref={isRight ? reachTargetRightRef : reachTargetRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Pure solid red sphere, static matte finish, exact benchmark spec (radius 0.03m / dia 6cm) */}
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.03, 32, 32]} />
                <meshStandardMaterial
                  color="#dc2626"
                  roughness={0.45}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────────
        // 2. TWO Stainless Steel Wire Comb Draining Racks + White Ceramic Plates
        // (Move Plate between two draining racks / Move Two Plates)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'dish_plate') {
          return (
            <group
              key={obj.id}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Rack 1 (Source Draining Rack on the Left) */}
              <WireDrainingRack position={[-0.18, 0.01, 0]} />

              {/* Rack 2 (Target Draining Rack on the Right) */}
              <WireDrainingRack position={[0.18, 0.01, 0]} />

              {/* Plate 0: Static reference plate in Rack 1 */}
              <CeramicDinnerPlate position={[-0.24, 0.08, 0]} />

              {/* Plate 1: Primary moving plate: transferred from Rack 1 to Rack 2 */}
              <CeramicDinnerPlate
                plateRef={movingPlateRef}
                position={[-0.16, 0.08, 0]}
                isMoving={true}
              />

              {/* Plate 2: Second plate (for move_two_plates simultaneous transfer) */}
              <CeramicDinnerPlate
                plateRef={movingPlate2Ref}
                position={[-0.12, 0.08, 0]}
              />

              {/* Plate 3: Target reference plate in Rack 2 */}
              <CeramicDinnerPlate position={[0.26, 0.08, 0]} />
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Corrugated Kraft Cardboard Box (Pick Box Benchmark)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'pick_box') {
          return (
            <group
              key={obj.id}
              ref={boxMeshRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              {/* Main Corrugated Kraft Cardboard Box Body */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={obj.dimensions} />
                <meshStandardMaterial
                  color="#b8864e"
                  roughness={0.88}
                  metalness={0.02}
                />
              </mesh>

              {/* Deep Kraft Paper Sealing Tape (Center seam on top flaps) */}
              <mesh position={[0, obj.dimensions[1] / 2 + 0.001, 0]}>
                <planeGeometry args={[obj.dimensions[0] + 0.002, 0.04]} />
                <meshStandardMaterial color="#7c4e28" roughness={0.5} />
              </mesh>
              {/* Sealing Tape Front Fold */}
              <mesh position={[0, obj.dimensions[1] / 2 - 0.012, obj.dimensions[2] / 2 + 0.001]}>
                <planeGeometry args={[0.04, 0.025]} />
                <meshStandardMaterial color="#7c4e28" roughness={0.5} />
              </mesh>
              {/* Sealing Tape Rear Fold */}
              <mesh position={[0, obj.dimensions[1] / 2 - 0.012, -obj.dimensions[2] / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.04, 0.025]} />
                <meshStandardMaterial color="#7c4e28" roughness={0.5} />
              </mesh>

              {/* Center Crease Groove between Flaps */}
              <mesh position={[0, obj.dimensions[1] / 2 + 0.0015, 0]} rotation={[0, 0, Math.PI / 2]}>
                <planeGeometry args={[0.002, obj.dimensions[2]]} />
                <meshBasicMaterial color="#5c3818" />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. White Ceramic Mug (Flip Cup Benchmark)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'coffee_mug') {
          return (
            <group
              key={obj.id}
              ref={mugMeshRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              {/* White Ceramic Mug Body */}
              <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.045, 0.042, 0.11, 24]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.06} />
              </mesh>

              {/* Mug Handle */}
              <mesh position={[0.05, 0.055, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <torusGeometry args={[0.026, 0.007, 12, 24, Math.PI]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.06} />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Target Tray (Pick Box Placement Target)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'target_tray') {
          return (
            <group
              key={obj.id}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              {/* Clean Acrylic Tray Base */}
              <mesh receiveShadow castShadow>
                <boxGeometry args={obj.dimensions} />
                <meshStandardMaterial
                  color="#1e293b"
                  roughness={0.3}
                  metalness={0.7}
                />
              </mesh>

              {/* Target Outline Boundary */}
              <mesh position={[0, obj.dimensions[1] / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.07, 0.08, 32]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Stainless Steel Cutlery Fork & Holder (Flip Cutlery Benchmark)
        // (Take cutlery from holder, flip it, and place it back)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'metal_cutlery') {
          return (
            <group
              key={obj.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              {/* Table Cutlery Holder Tray */}
              <CutleryHolder position={[0.06, 0.763, -0.38]} />

              {/* Moving Fork */}
              <group ref={cutleryRef} position={obj.position}>
                {/* Fork Handle */}
                <mesh position={[0, 0.005, 0.04]} castShadow receiveShadow>
                  <boxGeometry args={[0.012, 0.004, 0.12]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
                </mesh>
                {/* Fork Neck */}
                <mesh position={[0, 0.007, -0.03]} rotation={[-0.1, 0, 0]} castShadow>
                  <boxGeometry args={[0.016, 0.004, 0.04]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
                </mesh>
                {/* Fork Head & Prongs */}
                <mesh position={[0, 0.009, -0.065]} castShadow receiveShadow>
                  <boxGeometry args={[0.024, 0.004, 0.05]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
                </mesh>
              </group>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 7. Stacking Blocks (Stack Blocks Benchmark)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'stack_block_a' || obj.id === 'stack_block_b') {
          const isA = obj.id === 'stack_block_a';
          return (
            <group
              key={obj.id}
              ref={isA ? blockARef : blockBRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.06, 0.06, 0.06]} />
                <meshStandardMaterial
                  color={isA ? '#ef4444' : '#3b82f6'}
                  metalness={0.5}
                  roughness={0.3}
                />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 8. Stainless Saucepan (Saucepan to Hob Benchmark)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'saucepan') {
          return (
            <group
              key={obj.id}
              ref={saucepanRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              {/* Pan Body */}
              <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.10, 0.09, 0.07, 32]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.18} />
              </mesh>
              {/* Pan Handle */}
              <mesh position={[0, 0.05, 0.17]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.16, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.6} />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 9. Sandwich & Frying Pan (Sandwich Remove Benchmark)
        // (Remove the sandwich from the frying pan)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'sandwich') {
          return (
            <group
              key={obj.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              {/* Cast-iron Frying Pan */}
              <FryingPan position={[-0.08, 0.762, -0.38]} />

              {/* Prep Destination Plate */}
              <mesh position={[0.14, 0.763, -0.38]} receiveShadow>
                <cylinderGeometry args={[0.09, 0.08, 0.006, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
              </mesh>

              {/* Multilayer Sandwich */}
              <group ref={sandwichRef} position={[-0.08, 0.78, -0.38]}>
                <mesh position={[0, 0.008, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.014, 0.07]} />
                  <meshStandardMaterial color="#d97706" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.018, 0]}>
                  <boxGeometry args={[0.074, 0.006, 0.074]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.023, 0]}>
                  <boxGeometry args={[0.068, 0.006, 0.068]} />
                  <meshStandardMaterial color="#facc15" roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.032, 0]} castShadow>
                  <boxGeometry args={[0.07, 0.014, 0.07]} />
                  <meshStandardMaterial color="#d97706" roughness={0.7} />
                </mesh>
              </group>
            </group>
          );
        }

        if (obj.id === 'meal_container') {
          return (
            <group
              key={obj.id}
              ref={mealContainerRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              <mesh receiveShadow castShadow>
                <boxGeometry args={[0.15, 0.04, 0.15]} />
                <meshStandardMaterial color="#b45309" roughness={0.8} />
              </mesh>
            </group>
          );
        }

        // ─────────────────────────────────────────────────────────────────
        // 10. Secondary Mug & Cups Tray (Put Cups Benchmark)
        // ─────────────────────────────────────────────────────────────────
        if (obj.id === 'coffee_mug_2') {
          return (
            <group
              key={obj.id}
              ref={mug2MeshRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.042, 0.038, 0.10, 24]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.06} />
              </mesh>
            </group>
          );
        }

        if (obj.id === 'cups_tray') {
          return (
            <group
              key={obj.id}
              ref={cupsTrayRef}
              position={obj.position}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(obj);
              }}
            >
              <mesh receiveShadow castShadow>
                <boxGeometry args={[0.22, 0.025, 0.12]} />
                <meshStandardMaterial color="#78350f" roughness={0.7} />
              </mesh>
              <mesh position={[-0.05, 0.013, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.005, 24]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
              <mesh position={[0.05, 0.013, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.005, 24]} />
                <meshStandardMaterial color="#451a03" />
              </mesh>
            </group>
          );
        }

        return null;
      })}
    </group>
  );
};
