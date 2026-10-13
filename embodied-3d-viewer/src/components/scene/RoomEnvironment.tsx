import React from 'react';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { SceneId, ActionType } from '../../types';
import { getWorkstation, Workstation } from '../../data/workstations';

interface RoomEnvironmentProps {
  sceneId: SceneId;
  action?: ActionType;
  actionProgress?: number;
}

// ── Shared work-surface reference (all table-based workstations reuse this) ──
// Countertop surface sits at Y = 0.76m, footprint 1.8m x 0.9m, whole assembly pushed back to Z = -0.75.
// sceneData object coordinates and RealUnitreeG1Model joint keyframes are all calibrated to this,
// so every workstation keeps it and differs only in what surrounds it.
const BENCH_Z = -0.75;
const SURFACE_Y = 0.76;
const BENCH_W = 1.8;
const BENCH_D = 0.9;

const WOOD_TOP = '#e6d7ba';
const WHITE_BODY = '#eceff3';
const STEEL = '#cbd5e1';

export const RoomEnvironment: React.FC<RoomEnvironmentProps> = ({ sceneId }) => {
  return (
    <group>
      {/* Sci-Fi Lighting System with Calibrated Shadow Casting */}
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[4, 7, 5]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0001}
      />

      <directionalLight position={[-5, 4, -4]} intensity={0.6} color="#00f2fe" />
      <pointLight position={[0, 2.5, 0]} intensity={0.9} color="#ffffff" distance={8} />

      {/* Grid Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color={sceneId === 'kitchen_bigym' ? '#0b0f19' : sceneId === 'industrial_bench' ? '#0f141c' : '#080c14'}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      <Grid
        position={[0, 0.001, 0]}
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.7}
        cellColor="#1e293b"
        sectionSize={2.0}
        sectionThickness={1.2}
        sectionColor="#00f2fe"
        fadeDistance={40}
        fadeStrength={2}
      />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Workstation sub-components — each renders one part of a station only.
   Real BiGym 2.0 cells are built from the same vocabulary: wood island,
   white standing table, steel-wire draining rack, black induction hob,
   overhead wall cabinet, floor-hinged dishwasher door.
   ═══════════════════════════════════════════════════════════════════════ */

/** Wood-look island top. Surface strictly at Y = 0.76m. */
const WoodCounter: React.FC = () => (
  <mesh position={[0, SURFACE_Y - 0.02, 0]} castShadow receiveShadow>
    <boxGeometry args={[BENCH_W, 0.04, BENCH_D]} />
    <meshStandardMaterial color={WOOD_TOP} roughness={0.55} metalness={0.05} />
  </mesh>
);

/** White standing table (used by the draining-rack cell). Surface also at Y = 0.76m. */
const WhiteTable: React.FC = () => (
  <group>
    <mesh position={[0, SURFACE_Y - 0.02, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.4, 0.04, 0.8]} />
      <meshStandardMaterial color="#f2f4f7" roughness={0.35} metalness={0.05} />
    </mesh>
    {[[-0.62, -0.32], [0.62, -0.32], [-0.62, 0.32], [0.62, 0.32]].map(([px, pz], i) => (
      <mesh key={i} position={[px, 0.36, pz]} castShadow>
        <boxGeometry args={[0.035, 0.72, 0.035]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.35} />
      </mesh>
    ))}
    {/* Cross brace, matches the thin-legged table look in the reference video */}
    <mesh position={[0, 0.16, 0]} castShadow>
      <boxGeometry args={[1.26, 0.025, 0.025]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.35} />
    </mesh>
  </group>
);

/** Side table for Pick Box benchmark (robot picks box from side table and places onto counter) */
const SideTable: React.FC = () => (
  <group position={[-0.92, 0, 0.12]}>
    <mesh position={[0, SURFACE_Y - 0.02, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.54, 0.04, 0.54]} />
      <meshStandardMaterial color="#d4c9b2" roughness={0.45} metalness={0.08} />
    </mesh>
    {[[-0.23, -0.23], [0.23, -0.23], [-0.23, 0.23], [0.23, 0.23]].map(([px, pz], i) => (
      <mesh key={i} position={[px, 0.36, pz]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.72, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
  </group>
);

/** Solid cabinet carcass under the island. */
const CabinetBody: React.FC = () => (
  <mesh position={[0, 0.36, -0.01]} castShadow receiveShadow>
    <boxGeometry args={[1.76, 0.72, 0.84]} />
    <meshStandardMaterial color={WHITE_BODY} roughness={0.5} metalness={0.1} />
  </mesh>
);

/**
 * Freestanding steel-wire draining rack.
 * The reference benchmark shows these as a flat comb of thin metal rods —
 * a low base tray with a row of U-shaped wire slots. Built from thin
 * cylinders rather than a wireframe box so the silhouette actually reads
 * as a rack from a distance.
 */
const WireRack: React.FC<{ position: [number, number, number]; slots?: number; width?: number }> = ({
  position,
  slots = 5,
  width = 0.2
}) => {
  const span = width - 0.02;
  return (
    <group position={position}>
      {/* Base tray */}
      <mesh position={[0, 0.004, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.008, 0.1]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Slot wires: two vertical pins joined by a top crossbar = U shape */}
      {Array.from({ length: slots }).map((_, i) => {
        const px = -span / 2 + (span * i) / (slots - 1);
        return (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, 0.032, -0.04]} castShadow>
              <cylinderGeometry args={[0.0022, 0.0022, 0.064, 6]} />
              <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.032, 0.04]} castShadow>
              <cylinderGeometry args={[0.0022, 0.0022, 0.064, 6]} />
              <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.064, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.0022, 0.0022, 0.08, 6]} />
              <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Black induction cooktop with the dual heating-ring indicator. */
const InductionHob: React.FC<{ progress: number; active: boolean }> = ({ progress, active }) => (
  <group position={[0.20, SURFACE_Y + 0.002, 0.33]}>
    <mesh receiveShadow castShadow>
      <boxGeometry args={[0.32, 0.006, 0.32]} />
      <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.9} />
    </mesh>
    <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.07, 0.085, 32]} />
      <meshBasicMaterial color={active && progress > 0.75 ? '#ef4444' : '#00f2fe'} transparent opacity={0.7} />
    </mesh>
    <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.025, 0.035, 24]} />
      <meshBasicMaterial color={active && progress > 0.75 ? '#f97316' : '#38bdf8'} transparent opacity={0.6} />
    </mesh>
  </group>
);

/** Stainless sink basin + gooseneck faucet (only for the faucet task). */
const SinkAndFaucet: React.FC = () => (
  <group position={[0.22, 0, 0.33]}>
    <mesh position={[0, SURFACE_Y - 0.015, 0]} receiveShadow>
      <boxGeometry args={[0.34, 0.035, 0.3]} />
      <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
    </mesh>
    <mesh position={[0, SURFACE_Y + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.025, 0.025, 0.005, 16]} />
      <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
    </mesh>
    <group position={[0, SURFACE_Y, -0.14]}>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.014, 0.18, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.175, 0.04]} rotation={[Math.PI / 2.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.1, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  </group>
);

/**
 * Dishwasher cell: open-front tub + upper cup basket + lower plate rack +
 * cutlery caddy, plus the door hinged at the bottom edge.
 *
 * The island carcass is split here rather than reusing CabinetBody: the left
 * half is left open so the tub interior is actually visible from the robot's
 * side, instead of being sealed inside a solid block.
 */
const DishwasherUnit: React.FC<{ doorAngle: number }> = ({ doorAngle }) => (
  <group position={[-0.45, 0, 0]}>
    {/* Solid carcass for the right half of the island */}
    <mesh position={[0.43, 0.36, -0.01]} castShadow receiveShadow>
      <boxGeometry args={[0.86, 0.72, 0.84]} />
      <meshStandardMaterial color={WHITE_BODY} roughness={0.5} metalness={0.1} />
    </mesh>
    {/* Outer side panel so the left half is not a solid block */}
    <mesh position={[-0.42, 0.36, -0.01]} castShadow receiveShadow>
      <boxGeometry args={[0.05, 0.72, 0.84]} />
      <meshStandardMaterial color={WHITE_BODY} roughness={0.5} metalness={0.1} />
    </mesh>
    {/* Kick plate */}
    <mesh position={[0, 0.035, -0.01]} castShadow receiveShadow>
      <boxGeometry args={[0.84, 0.07, 0.84]} />
      <meshStandardMaterial color="#d7dce3" roughness={0.6} metalness={0.1} />
    </mesh>

    {/* Tub: built from panels so the opening actually faces the robot */}
    <group position={[0, 0.36, 0.06]}>
      <mesh position={[0, 0, -0.32]} receiveShadow>
        <boxGeometry args={[0.6, 0.58, 0.04]} />
        <meshStandardMaterial color="#8f9bab" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-0.3, 0, 0]} receiveShadow>
        <boxGeometry args={[0.04, 0.58, 0.66]} />
        <meshStandardMaterial color="#8f9bab" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0.3, 0, 0]} receiveShadow>
        <boxGeometry args={[0.04, 0.58, 0.66]} />
        <meshStandardMaterial color="#8f9bab" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.29, 0]} receiveShadow>
        <boxGeometry args={[0.6, 0.04, 0.66]} />
        <meshStandardMaterial color="#8f9bab" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Upper cup basket */}
      <group position={[0, 0.16, 0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.07, 0.42]} />
          <meshStandardMaterial color={STEEL} wireframe />
        </mesh>
        {[-0.16, 0, 0.16].map((px, i) => (
          <mesh key={i} position={[px, 0.055, 0]} castShadow>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Lower plate rack + cutlery caddy */}
      <group position={[0, -0.17, 0.14]}>
        <mesh castShadow>
          <boxGeometry args={[0.54, 0.07, 0.44]} />
          <meshStandardMaterial color={STEEL} wireframe />
        </mesh>
        <group position={[0.17, 0.08, -0.06]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
            <meshStandardMaterial color="#64748b" wireframe />
          </mesh>
        </group>
      </group>
    </group>

    {/* Door: bottom-hinged. Positive X rotation makes it fall FORWARD onto the floor. */}
    <group position={[0, 0.07, 0.42]} rotation={[doorAngle, 0, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.66, 0.6, 0.025]} />
        <meshStandardMaterial color="#eef1f5" metalness={0.15} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.56, 0.02]} castShadow>
        <boxGeometry args={[0.46, 0.022, 0.022]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.12} />
      </mesh>
    </group>
  </group>
);

/** Overhead wall cupboard: full-size upper kitchen cabinet hanging at Y=1.40m~2.10m. */
const WallCupboard: React.FC<{ doorAngle: number }> = ({ doorAngle }) => (
  <group position={[0.25, 1.72, -0.10]}>
    {/* Cabinet main carcass */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.90, 0.68, 0.36]} />
      <meshStandardMaterial color={WHITE_BODY} roughness={0.45} metalness={0.1} />
    </mesh>
    {/* Interior middle shelf */}
    <mesh position={[0, 0, 0.15]} receiveShadow>
      <boxGeometry args={[0.84, 0.02, 0.32]} />
      <meshStandardMaterial color="#d7dce3" roughness={0.6} />
    </mesh>
    {/* Fixed left cabinet door with shaker border */}
    <mesh position={[-0.22, 0, 0.185]} castShadow>
      <boxGeometry args={[0.43, 0.64, 0.02]} />
      <meshStandardMaterial color="#e8ecf1" roughness={0.35} metalness={0.2} />
    </mesh>
    {/* Swinging right cabinet door with vertical hinge at right outer edge */}
    <group position={[0.44, 0, 0.185]} rotation={[0, doorAngle, 0]}>
      <mesh position={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[0.43, 0.64, 0.02]} />
        <meshStandardMaterial color="#e8ecf1" roughness={0.35} metalness={0.25} />
      </mesh>
      {/* Sleek horizontal pull handle at lower front edge for robot to grip */}
      <mesh position={[-0.36, -0.26, 0.022]} castShadow>
        <boxGeometry args={[0.08, 0.018, 0.025]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.12} />
      </mesh>
    </group>
  </group>
);

/** Interactive top drawer (BiGym drawer_top_open / drawer_top_close MVP). */
const TopDrawer: React.FC<{ slideZ: number }> = ({ slideZ }) => (
  <group position={[0.45, 0.52, 0.425 + slideZ]}>
    <mesh castShadow>
      <boxGeometry args={[0.55, 0.22, 0.02]} />
      <meshStandardMaterial color={WHITE_BODY} roughness={0.4} />
    </mesh>
    <mesh position={[0, -0.01, -0.2]} castShadow>
      <boxGeometry args={[0.5, 0.18, 0.4]} />
      <meshStandardMaterial color="#d7dce3" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.02]} castShadow>
      <boxGeometry args={[0.2, 0.015, 0.02]} />
      <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
);

/** Static lower drawer panel, purely visual, only on the prep island. */
const LowerDrawerPanel: React.FC = () => (
  <group position={[0.45, 0.26, 0.425]}>
    <mesh castShadow>
      <boxGeometry args={[0.55, 0.24, 0.02]} />
      <meshStandardMaterial color={WHITE_BODY} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0, 0.02]} castShadow>
      <boxGeometry args={[0.2, 0.015, 0.02]} />
      <meshStandardMaterial color={STEEL} metalness={0.8} />
    </mesh>
  </group>
);

/* ═══════════════════════════════════════════════════════════════════════
   Station dispatcher
   ═══════════════════════════════════════════════════════════════════════ */

export const TableEnvironment: React.FC<RoomEnvironmentProps> = ({
  sceneId,
  action = 'pick_object',
  actionProgress = 0
}) => {
  if (sceneId !== 'kitchen_bigym') {
    return (
      <group>
        {sceneId === 'industrial_bench' && (
          <group position={[0, 0, BENCH_Z]}>
            <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.0, 0.04, 1.0]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
            </mesh>
            {[[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]].map(([px, pz], i) => (
              <mesh key={i} position={[px, 0.36, pz]} castShadow>
                <boxGeometry args={[0.08, 0.72, 0.08]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>
        )}
        {sceneId === 'standard_arena' && (
          <group position={[0, 0, BENCH_Z]}>
            <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.6, 0.04, 0.8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.762, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.4, 0.6]} />
              <meshBasicMaterial color="#00f2fe" wireframe transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 0.36, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.28, 0.72, 32]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  const ws: Workstation = getWorkstation(action);

  // Furniture progress — driven by the same actionProgress that drives the robot,
  // so an object motion and its opening are always phase-locked.
  let topDrawerSlideZ = 0;
  if (action === 'drawer_top_open' && actionProgress >= 0.25) {
    topDrawerSlideZ = Math.min(1.0, (actionProgress - 0.25) / 0.5) * 0.19;
  } else if (action === 'drawer_top_close' && actionProgress < 0.75) {
    topDrawerSlideZ = (1.0 - actionProgress / 0.75) * 0.19;
  }

  // Dishwasher door rotates about its bottom hinge. Positive X angle = falls forward.
  let dishwasherDoorAngle = 0;
  if (action === 'dishwasher_close') {
    dishwasherDoorAngle = actionProgress < 0.75 ? (1.0 - actionProgress / 0.75) * 1.3 : 0;
  } else if (action.startsWith('dishwasher_load')) {
    dishwasherDoorAngle = 1.3; // stays open for loading
  }

  // Wall cupboard door swings on a vertical hinge; ~66deg fully open.
  let wallCupboardDoorAngle = 0;
  if (action === 'wall_cupboard_open') {
    if (actionProgress >= 0.25) {
      wallCupboardDoorAngle = Math.min(1.0, (actionProgress - 0.25) / 0.5) * 1.15;
    }
  } else if (action === 'wall_cupboard_close' && actionProgress < 0.75) {
    wallCupboardDoorAngle = (1.0 - actionProgress / 0.75) * 1.15;
  }

  // The faucet task is the only one that needs a sink
  const showSink = ws.showSink || ws.showFaucet;

  return (
    <group position={[0, 0, BENCH_Z]}>
      {/* open_arena deliberately has no work surface at all — the target
          sphere simply floats in front of the robot, as in the reference cell. */}
      {ws.hasWorkSurface &&
        (ws.counterTop === 'wood' ? <WoodCounter /> : ws.counterTop === 'white' ? <WhiteTable /> : null)}

      {/* The dishwasher cell builds its own split carcass so the tub stays visible. */}
      {ws.hasWorkSurface && ws.counterTop !== 'white' && !ws.showDishwasher && <CabinetBody />}

      {ws.showHob && <InductionHob progress={actionProgress} active={action === 'saucepan_to_hob'} />}
      {showSink && !ws.showHob && <SinkAndFaucet />}
      {ws.showDishwasher && <DishwasherUnit doorAngle={dishwasherDoorAngle} />}
      {ws.showWallCabinet && <WallCupboard doorAngle={wallCupboardDoorAngle} />}

      {ws.showDrawer && (
        <group>
          <LowerDrawerPanel />
          <TopDrawer slideZ={topDrawerSlideZ} />
        </group>
      )}
    </group>
  );
};
