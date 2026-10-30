import React, { useState, useEffect, useRef } from 'react';
import { SceneId, RobotModelType, ActionType, SelectableObject, CameraPreset, BiGymTaskId, ExecutionMode } from './types';
import { SCENE_OBJECTS, CAMERA_PRESETS } from './data/sceneData';
import { BIGYM_TASKS } from './data/bigymTasks';
import { HeaderBar } from './components/ui/HeaderBar';
import { BottomControlBar } from './components/ui/BottomControlBar';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { SceneCanvas } from './components/scene/SceneCanvas';
import { SplineRobotViewer } from './components/robot/SplineRobotViewer';
import { ActionAccuracyHUD } from './components/ui/ActionAccuracyHUD';
import { TaskListSidebar } from './components/ui/TaskListSidebar';
import { TaskDetailSidebar } from './components/ui/TaskDetailSidebar';
import { ImageToSimReadyModal, SimReadyCandidate } from './components/ui/ImageToSimReadyModal';
import { OpenUSDViewerModal } from './components/ui/OpenUSDViewerModal';
import { useMujocoSim } from './hooks/useMujocoSim';

export const App: React.FC = () => {
  // BiGym 2.0 Task & Execution Mode State
  // Default task is pick_box: a full dual-arm pick-carry-place on the prep
  // island, which reads far better as a landing view than a single-arm reach.
  const [activeTaskId, setActiveTaskId] = useState<BiGymTaskId>('pick_box');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('replay');
  const [isTaskListOpen, setIsTaskListOpen] = useState<boolean>(true);

  // Core Scene & Robot Driver State
  const [sceneId, setSceneId] = useState<SceneId>('kitchen_bigym');
  const [robotModelType, setRobotModelType] = useState<RobotModelType>('unitree_g1');
  const [action, setAction] = useState<ActionType>('pick_box');

  // Dynamic Scene Objects Map (supports SimReady asset injection)
  const [sceneObjectsMap, setSceneObjectsMap] = useState<Record<string, SelectableObject[]>>(SCENE_OBJECTS);
  const [isSimReadyModalOpen, setIsSimReadyModalOpen] = useState<boolean>(false);
  const [isOpenUSDModalOpen, setIsOpenUSDModalOpen] = useState<boolean>(false);
  const [selectedUSDAssetId, setSelectedUSDAssetId] = useState<string>('nvidia/simready:warehouse_carton_box_medium_01');

  // Motion Timeline State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [actionProgress, setActionProgress] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Object Selection State
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [customSelectedObject, setCustomSelectedObject] = useState<SelectableObject | null>(null);
  const [hoveredObjectName, setHoveredObjectName] = useState<string | null>(null);

  // Camera State
  const [activeCameraPreset, setActiveCameraPreset] = useState<string | null>('overview');
  const [cameraTargetPos, setCameraTargetPos] = useState<[number, number, number] | null>(CAMERA_PRESETS[0].position);
  const [cameraTargetLookAt, setCameraTargetLookAt] = useState<[number, number, number] | null>(CAMERA_PRESETS[0].target);

  // Error State
  const [loadError, setLoadError] = useState<string | null>(null);

  // Connect to MuJoCo Backend Server via WebSocket
  const { simState, reconnect } = useMujocoSim(activeTaskId, executionMode);

  // Derive current BiGym task object
  const currentBiGymTask = BIGYM_TASKS.find((t) => t.id === activeTaskId) || BIGYM_TASKS[0];

  // Derive currently selected object
  const currentObjects = sceneObjectsMap[sceneId] || [];
  const selectedObject =
    (robotModelType === 'spline_robot' && selectedObjectId === 'spline_robot')
      ? customSelectedObject
      : currentObjects.find((o) => o.id === selectedObjectId) || null;

  // Handle SimReady Asset Injection from Image-to-3D modal
  const handleInjectSimReadyAsset = (candidate: SimReadyCandidate) => {
    setSceneObjectsMap((prev) => {
      const list = prev[sceneId] || [];
      const updated = list.map((obj) => {
        if (obj.id === candidate.targetObjectId) {
          return {
            ...obj,
            name: candidate.name,
            weight: candidate.weight,
            material: candidate.material,
            description: candidate.description,
            simReady: candidate.simReady,
            modelSource: 'NVIDIA SimReady Central (OpenUSD)'
          };
        }
        return obj;
      });
      return { ...prev, [sceneId]: updated };
    });

    // Automatically select the newly configured SimReady object
    setSelectedObjectId(candidate.targetObjectId);
  };

  // Animation frame loop for action timeline
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        if (executionMode === 'simulation' && simState.connected) {
          // In physical simulation mode, sync progress with 60Hz physics evaluation cycle (3.0s)
          const simCycle = (simState.simTime % 3.0) / 3.0;
          setActionProgress(simCycle);
        } else {
          // In demonstration replay mode, cycle through calibrated trajectory
          const step = (delta / 2.5) * playbackSpeed;
          setActionProgress((prev) => {
            let next = prev + step;
            if (next >= 1.0) {
              if (isLooping) {
                next = 0.0;
              } else {
                next = 1.0;
                setIsPlaying(false);
              }
            }
            return next;
          });
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, isLooping, executionMode, simState.connected, simState.simTime]);

  // Handle task selection from Left Sidebar
  const handleSelectBiGymTask = (taskId: BiGymTaskId) => {
    setActiveTaskId(taskId);
    setAction(taskId);
    setActionProgress(0);
    setIsPlaying(true);
    setSelectedObjectId(null);
  };

  // Handle action change from Bottom Bar tabs
  const handleActionChange = (newAction: ActionType) => {
    setAction(newAction);
    const matched = BIGYM_TASKS.find((t) => t.id === newAction);
    if (matched) {
      setActiveTaskId(matched.id);
    } else if (newAction === 'reach_target') {
      setActiveTaskId('reach_target_multi_modal');
    } else if (newAction === 'pick_object') {
      setActiveTaskId('pick_box');
    }
    setActionProgress(0);
    setIsPlaying(true);
    setSelectedObjectId(null);
  };

  // Switch Scene
  const handleSceneChange = (newScene: SceneId) => {
    setSceneId(newScene);
    setSelectedObjectId(null);
    setCustomSelectedObject(null);
    const overview = CAMERA_PRESETS[0];
    setActiveCameraPreset(overview.id);
    setCameraTargetPos(overview.position);
    setCameraTargetLookAt(overview.target);
  };

  // Select Camera Preset
  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setActiveCameraPreset(preset.id);
    setCameraTargetPos(preset.position);
    setCameraTargetLookAt(preset.target);
  };

  // Reset Camera View
  const handleResetCamera = () => {
    const overview = CAMERA_PRESETS[0];
    setActiveCameraPreset(overview.id);
    setCameraTargetPos(overview.position);
    setCameraTargetLookAt(overview.target);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#060a14',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Top Header */}
      <HeaderBar
        sceneId={sceneId}
        onSceneChange={handleSceneChange}
        robotModelType={robotModelType}
        onModelTypeChange={(type) => {
          setRobotModelType(type);
          if (type === 'spline_robot') {
            setSelectedObjectId('spline_robot');
          } else {
            setSelectedObjectId('robot_g1');
          }
        }}
        onOpenSimReadyModal={() => setIsSimReadyModalOpen(true)}
      />

      {/* Main Workspace (Left Tasks Sidebar + Center 3D Scene + Right Telemetry Sidebar) */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left: 20 BiGym Benchmark Tasks Sidebar */}
        <TaskListSidebar
          activeTaskId={activeTaskId}
          onSelectTask={handleSelectBiGymTask}
          isOpen={isTaskListOpen}
          onToggle={() => setIsTaskListOpen(!isTaskListOpen)}
        />

        {/* Center: 3D Scene Canvas & Spatial HUD */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {/* Hover HUD Badge */}
          {hoveredObjectName && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: isTaskListOpen ? '16px' : '72px',
              zIndex: 30,
              background: 'rgba(10, 15, 29, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#00f2fe',
              fontSize: '12px',
              fontWeight: 600,
              pointerEvents: 'none',
              boxShadow: '0 0 12px rgba(0, 242, 254, 0.2)'
            }}>
              目标识别: {hoveredObjectName}
            </div>
          )}

          {/* BiGym 2.0 Action Accuracy & Benchmark HUD */}
          <ActionAccuracyHUD
            action={action}
            actionProgress={actionProgress}
          />

          {/* Conditional 3D Engine: Spline 3D or Three.js Spatial Arena */}
          {robotModelType === 'spline_robot' ? (
            <SplineRobotViewer
              action={action}
              actionProgress={actionProgress}
              selectedObjectId={selectedObjectId}
              onSelectObject={(obj) => {
                setSelectedObjectId(obj ? obj.id : null);
                setCustomSelectedObject(obj);
              }}
              onHoverObject={setHoveredObjectName}
            />
          ) : (
            <SceneCanvas
              sceneId={sceneId}
              robotModelType={robotModelType}
              action={action}
              actionProgress={actionProgress}
              selectedObjectId={selectedObjectId}
              onSelectObject={(obj) => {
                setSelectedObjectId(obj ? obj.id : null);
                setCustomSelectedObject(null);
              }}
              cameraTargetPos={cameraTargetPos}
              cameraTargetLookAt={cameraTargetLookAt}
              onCameraTransitionComplete={() => {
                setCameraTargetPos(null);
                setCameraTargetLookAt(null);
              }}
              onHoverObject={setHoveredObjectName}
              objects={currentObjects}
            />
          )}
        </div>

        {/* Right: Task Telemetry, Dual-Mode Switch & Physical Evaluation */}
        <TaskDetailSidebar
          task={currentBiGymTask}
          executionMode={executionMode}
          onChangeExecutionMode={setExecutionMode}
          actionProgress={actionProgress}
          simState={simState}
          onReconnectSim={reconnect}
          selectedObject={selectedObject}
          onDeselectObject={() => setSelectedObjectId(null)}
          onOpenUSDViewer={(assetId) => {
            setSelectedUSDAssetId(assetId);
            setIsOpenUSDModalOpen(true);
          }}
        />
      </div>

      {/* Bottom Timeline & Camera Controller */}
      <BottomControlBar
        action={action}
        onActionChange={handleActionChange}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        actionProgress={actionProgress}
        onProgressSeek={(p) => {
          setActionProgress(p);
          setIsPlaying(false);
        }}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        activeCameraPreset={activeCameraPreset}
        onSelectCameraPreset={handleSelectCameraPreset}
        onResetCamera={handleResetCamera}
      />

      {/* Loading Progress & Error Overlay */}
      <LoadingOverlay
        error={loadError}
        onRetry={() => setLoadError(null)}
      />

      {/* Image-to-SimReady 3D Asset Matching Modal */}
      <ImageToSimReadyModal
        isOpen={isSimReadyModalOpen}
        onClose={() => setIsSimReadyModalOpen(false)}
        onInjectAsset={handleInjectSimReadyAsset}
        onOpenUSDViewer={(assetId) => {
          setSelectedUSDAssetId(assetId);
          setIsOpenUSDModalOpen(true);
        }}
      />

      {/* Hugging Face OpenUSD Native 3D Inspector Modal (Caleb Fahlgren Spec) */}
      <OpenUSDViewerModal
        isOpen={isOpenUSDModalOpen}
        onClose={() => setIsOpenUSDModalOpen(false)}
        assetId={selectedUSDAssetId}
        simReadyMeta={selectedObject?.simReady}
      />
    </div>
  );
};

export default App;
