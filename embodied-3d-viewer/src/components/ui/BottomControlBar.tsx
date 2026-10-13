import React from 'react';
import { ActionType, CameraPreset } from '../../types';
import { CAMERA_PRESETS } from '../../data/sceneData';
import {
  RotateCcw,
  Play,
  Pause,
  Repeat,
  Camera,
  Hand,
  Package,
  ArrowDownToLine,
  HelpCircle,
  Eye
} from 'lucide-react';

interface BottomControlBarProps {
  action: ActionType;
  onActionChange: (action: ActionType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  actionProgress: number;
  onProgressSeek: (progress: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  activeCameraPreset: string | null;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onResetCamera: () => void;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  action,
  onActionChange,
  isPlaying,
  onTogglePlay,
  actionProgress,
  onProgressSeek,
  playbackSpeed,
  onChangeSpeed,
  isLooping,
  onToggleLoop,
  activeCameraPreset,
  onSelectCameraPreset,
  onResetCamera
}) => {
  return (
    <footer style={{
      height: '92px',
      background: 'rgba(10, 15, 29, 0.9)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 242, 254, 0.2)',
      display: 'grid',
      gridTemplateColumns: '360px 1fr 240px',
      alignItems: 'center',
      padding: '0 20px',
      zIndex: 50,
      userSelect: 'none',
      gap: '20px'
    }}>
      {/* 1. Camera View Presets & Reset */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            <Camera size={13} color="#00f2fe" />
            <span>视角预设与控制</span>
          </div>
          <button
            onClick={onResetCamera}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00f2fe')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
          >
            <RotateCcw size={11} />
            重置视角
          </button>
        </div>

        {/* Preset Buttons */}
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectCameraPreset(preset)}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '5px',
                background: activeCameraPreset === preset.id ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: activeCameraPreset === preset.id ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                color: activeCameraPreset === preset.id ? '#00f2fe' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              {preset.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Center: Motion Demonstration & Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Task Selection Bar supporting all 20 BiGym 2.0 Tasks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {/* Quick Standby Button */}
          <button
            onClick={() => onActionChange('idle')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: action === 'idle' ? 'rgba(0, 242, 254, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: action === 'idle' ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
              color: action === 'idle' ? '#00f2fe' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <RotateCcw size={12} />
            <span>待机</span>
          </button>

          {/* All 20 Tasks Quick Dropdown Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>任务操作:</span>
            <select
              value={action}
              onChange={(e) => onActionChange(e.target.value as ActionType)}
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                color: '#00f2fe',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '280px'
              }}
            >
              <optgroup label="🎯 目标定位 (3)">
                <option value="reach_target_single">单目标空间精准触达 (100%)</option>
                <option value="reach_target_multi_modal">多模态空间动态追踪 (MVP 98%)</option>
                <option value="reach_target_dual">双臂协同双目标定点到达 (96%)</option>
              </optgroup>
              <optgroup label="🍽️ 桌面操作 (5)">
                <option value="move_plate">两架间移动餐盘 (Move Plate 88%)</option>
                <option value="move_two_plates">双盘跨架同步转移 (Move Two Plates 76%)</option>
                <option value="flip_cup">倒置陶瓷马克杯翻正 (Flip Cup 84%)</option>
                <option value="flip_cutlery">托架餐具取出翻转放回 (Flip Cutlery 79%)</option>
                <option value="stack_blocks">双立方体方块对准堆叠 (Stack Blocks 82%)</option>
              </optgroup>
              <optgroup label="🧼 洗碗机操作 (4)">
                <option value="dishwasher_close">洗碗机仓门推合闭锁 (92%)</option>
                <option value="dishwasher_load_cups">杯具装载入洗碗机上层 (75%)</option>
                <option value="dishwasher_load_cutlery">餐具精准插入洗碗机筷笼 (71%)</option>
                <option value="dishwasher_load_plates">餐盘对位装载入洗碗机下架 (78%)</option>
              </optgroup>
              <optgroup label="🍳 厨房操作 (8)">
                <option value="drawer_top_open">厨房顶层抽屉拉开 (MVP 94%)</option>
                <option value="drawer_top_close">开放抽屉推合归位 (95%)</option>
                <option value="pick_box">侧桌纸箱搬至主台 (Pick Box 91%)</option>
                <option value="put_cups">双杯装箱配对收纳 (Put Cups 80%)</option>
                <option value="saucepan_to_hob">锅具搬运至电磁灶 (Saucepan to Hob 85%)</option>
                <option value="sandwich_remove">从煎锅取出三明治 (Sandwich Remove 89%)</option>
                <option value="wall_cupboard_open">厨房上壁吊柜对开门开启 (83%)</option>
                <option value="wall_cupboard_close">开放吊柜门合拢关紧 (88%)</option>
              </optgroup>
              <optgroup label="🔧 基础机构调测">
                <option value="turn_faucet">厨房水龙头旋转测试 (95.4%)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Timeline Slider & Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: isPlaying ? 'rgba(0, 242, 254, 0.2)' : '#00f2fe',
              color: isPlaying ? '#00f2fe' : '#000',
              border: isPlaying ? '1px solid #00f2fe' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s'
            }}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} fill="#000" />}
          </button>

          {/* Progress Slider */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={actionProgress}
              onChange={(e) => onProgressSeek(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#00f2fe',
                height: '4px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00f2fe', width: '38px' }}>
              {(actionProgress * 100).toFixed(0)}%
            </span>
          </div>

          {/* Loop Toggle */}
          <button
            onClick={onToggleLoop}
            style={{
              background: 'transparent',
              border: 'none',
              color: isLooping ? '#00f2fe' : '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
            title={isLooping ? '循环播放已开启' : '单次播放'}
          >
            <Repeat size={14} />
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => {
              const speeds = [0.5, 1.0, 2.0];
              const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
              onChangeSpeed(speeds[nextIndex]);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* 3. Right: Interaction Navigation Tips */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '11px',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1', fontWeight: 600 }}>
          <HelpCircle size={12} color="#00f2fe" />
          <span>鼠标交互指引</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>左键拖拽:</span>
          <span style={{ color: '#00f2fe' }}>旋转视角</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>滚轮滚动:</span>
          <span style={{ color: '#00f2fe' }}>平滑缩放</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>右键拖拽:</span>
          <span style={{ color: '#00f2fe' }}>平移场景</span>
        </div>
      </div>
    </footer>
  );
};
