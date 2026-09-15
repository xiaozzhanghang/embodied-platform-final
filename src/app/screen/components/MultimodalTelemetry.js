'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Tag, Space, Typography, Badge, Progress } from 'antd';
import {
  VideoCameraOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function MultimodalTelemetry({ selectedStation }) {
  const trajectoryCanvasRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const [activeCam, setActiveCam] = useState('ALL');
  const [syncStatus, setSyncStatus] = useState({ offset: '0.034ms', status: 'PASS', fps: 59.8 });

  // 3D Robot Arm & 6-DoF Trajectory Trail Canvas Animation
  useEffect(() => {
    const canvas = trajectoryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;
    const trailPoints = [];

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w * 0.5;
      const cy = h * 0.55;

      t += 0.025;

      // Draw 3D coordinate grid plane
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.lineWidth = 1;
      const gridRadius = Math.min(w, h) * 0.42;

      // Base concentric rings
      for (let r = 30; r <= gridRadius; r += 35) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + 50, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Base Cross axes
      ctx.beginPath();
      ctx.moveTo(cx - gridRadius, cy + 50);
      ctx.lineTo(cx + gridRadius, cy + 50);
      ctx.moveTo(cx, cy + 50 - gridRadius * 0.45);
      ctx.lineTo(cx, cy + 50 + gridRadius * 0.45);
      ctx.stroke();

      // Kinematic Robot Arm Joint Calculation (3-link articulated arm)
      const baseJoint = { x: cx, y: cy + 45 };
      const shoulderAngle = Math.sin(t * 0.8) * 0.4 - 0.2;
      const elbowAngle = Math.cos(t * 1.1) * 0.6 + 0.5;
      const wristAngle = Math.sin(t * 1.4) * 0.5 - 0.3;

      const len1 = 80;
      const len2 = 70;
      const len3 = 45;

      const j1 = {
        x: baseJoint.x + Math.sin(shoulderAngle) * len1 * 0.8,
        y: baseJoint.y - Math.cos(shoulderAngle) * len1
      };

      const j2 = {
        x: j1.x + Math.sin(shoulderAngle + elbowAngle) * len2 * 0.9,
        y: j1.y - Math.cos(shoulderAngle + elbowAngle) * len2
      };

      const endEffector = {
        x: j2.x + Math.sin(shoulderAngle + elbowAngle + wristAngle) * len3,
        y: j2.y - Math.cos(shoulderAngle + elbowAngle + wristAngle) * len3
      };

      // Add to trajectory trail
      trailPoints.push({ x: endEffector.x, y: endEffector.y, alpha: 1.0 });
      if (trailPoints.length > 80) trailPoints.shift();

      // Render Trajectory Ribbon / Trail
      if (trailPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
        for (let i = 1; i < trailPoints.length; i++) {
          const pt = trailPoints[i];
          pt.alpha -= 0.01;
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = '#00f5a0';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f5a0';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Arm Link 1
      ctx.beginPath();
      ctx.moveTo(baseJoint.x, baseJoint.y);
      ctx.lineTo(j1.x, j1.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Link 2
      ctx.beginPath();
      ctx.moveTo(j1.x, j1.y);
      ctx.lineTo(j2.x, j2.y);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Link 3 & End Effector Gripper
      ctx.beginPath();
      ctx.moveTo(j2.x, j2.y);
      ctx.lineTo(endEffector.x, endEffector.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Joint Knots
      [baseJoint, j1, j2].forEach((joint, idx) => {
        ctx.beginPath();
        ctx.arc(joint.x, joint.y, 6 - idx, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // End Effector Gripper Head & 6-DoF Axis frame
      ctx.beginPath();
      ctx.arc(endEffector.x, endEffector.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00f5a0';
      ctx.shadowColor = '#00f5a0';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Mini Gripper prongs
      const gripAngle = shoulderAngle + elbowAngle + wristAngle;
      const p1 = { x: endEffector.x + Math.cos(gripAngle + 1.2) * 12, y: endEffector.y + Math.sin(gripAngle + 1.2) * 12 };
      const p2 = { x: endEffector.x + Math.cos(gripAngle - 1.2) * 12, y: endEffector.y + Math.sin(gripAngle - 1.2) * 12 };
      ctx.beginPath();
      ctx.moveTo(endEffector.x, endEffector.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.moveTo(endEffector.x, endEffector.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#00f5a0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Live 3D Position Coordinates text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`EE Pos: X=${(endEffector.x - cx).toFixed(1)} Y=${(cy - endEffector.y).toFixed(1)} Z=142.5mm`, 16, h - 16);
      ctx.fillText(`6DoF Orientation: [0.12, -0.45, 0.88, 0.05]`, 16, h - 30);

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Waveform Real-time Oscilloscope Canvas (Joint torque + Gripper Force)
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;
    const history = [];

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      t += 0.05;
      const force = Math.sin(t * 1.5) * 12 + Math.cos(t * 3.2) * 4 + 18;
      const velocity = Math.sin(t * 2) * 25 + 40;

      history.push({ force, velocity });
      if (history.length > w / 4) history.shift();

      // Grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Force Waveform (Cyan)
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = i * 4;
        const y = h * 0.5 - history[i].force * 1.2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Draw Velocity / Joint Curve (Green)
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = i * 4;
        const y = h * 0.85 - history[i].velocity * 0.6;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#00f5a0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const stationName = selectedStation ? selectedStation.name : '01号 厨房台面工位 (Franka Emika)';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(10, 25, 55, 0.8) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <VideoCameraOutlined style={{ color: '#00f2fe', fontSize: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {stationName} · 多模态时空对齐全景流
          </span>
          <Tag color="green" style={{ border: '1px solid #00f5a0', background: 'rgba(0,245,160,0.1)' }}>
            ● LIVE 实时推流中
          </Tag>
        </div>

        <Space size={14}>
          <span style={{ fontSize: 12, color: '#8da4c4' }}>
            时钟硬件锁相: <b style={{ color: '#00f5a0' }}>{syncStatus.offset}</b>
          </span>
          <span style={{ fontSize: 12, color: '#8da4c4' }}>
            FPS: <b style={{ color: '#00f2fe' }}>{syncStatus.fps}</b>
          </span>
        </Space>
      </div>

      {/* Main Content Split: Left (Multi-Angle Video Grid) + Right (3D Trajectory & Waveforms) */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '55% 45%', gap: 12, padding: 12, overflow: 'hidden' }}>
        {/* Left: 4-Angle Camera Feeds */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8 }}>
          {/* Cam 1: Head RGBD (Left Video) */}
          <div style={{ position: 'relative', background: '#000', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,242,254,0.2)' }}>
            <video
              src="/videos/session_028_left.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* AI Bounding Box overlay */}
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '42%',
              width: '28%',
              height: '32%',
              border: '2px solid #00f5a0',
              borderRadius: 4,
              boxShadow: '0 0 10px rgba(0,245,160,0.5)',
              pointerEvents: 'none'
            }}>
              <span style={{ position: 'absolute', top: -18, left: 0, background: '#00f5a0', color: '#000', fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 2 }}>
                盘子 98.4%
              </span>
            </div>
            <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#00f2fe' }}>
              CAM 01: 头部 RGB-D 主视角 [1080P/60FPS]
            </div>
          </div>

          {/* Cam 2: Wrist Fisheye (Right Video) */}
          <div style={{ position: 'relative', background: '#000', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,242,254,0.2)' }}>
            <video
              src="/videos/session_028_right.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#00f2fe' }}>
              CAM 02: 左手腕鱼眼相机 [720P/60FPS]
            </div>
          </div>

          {/* Cam 3: Wrist-Right Action Close-up (Simulated/Synced) */}
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, #071329 0%, #030814 100%)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: '#38bdf8' }}>🦾</div>
              <div style={{ fontSize: 11, color: '#8da4c4', marginTop: 4 }}>右手腕灵巧近景 (Depth Cloud)</div>
              <Tag color="cyan" style={{ fontSize: 10, marginTop: 4 }}>点云稠密度: 120,000 pts</Tag>
            </div>
            <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#38bdf8' }}>
              CAM 03: 右腕近景深度点云
            </div>
          </div>

          {/* Cam 4: Third-Person Global Observation */}
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, #071329 0%, #030814 100%)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, color: '#00f5a0' }}>🌐</div>
              <div style={{ fontSize: 11, color: '#8da4c4', marginTop: 4 }}>第三人称全局环境监控</div>
              <Tag color="green" style={{ fontSize: 10, marginTop: 4 }}>场景无遮挡 · 视线对齐</Tag>
            </div>
            <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: '#00f5a0' }}>
              CAM 04: 第三人称鸟瞰广角
            </div>
          </div>
        </div>

        {/* Right: 3D Trajectory Canvas + Live Waveforms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {/* Top: 3D Trajectory & Joint Kinematics Canvas */}
          <div style={{ flex: 1.4, position: 'relative', background: 'rgba(5, 15, 35, 0.7)', borderRadius: 8, border: '1px solid rgba(0,242,254,0.2)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 8, left: 12, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#00f2fe' }}>
                🧊 3D 机械臂空间末端轨迹 (6-DoF Trajectory)
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00f5a0' }}></span>
            </div>
            <canvas ref={trajectoryCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* Bottom: Joint Velocity & Force Feedback Waveform */}
          <div style={{ flex: 1, position: 'relative', background: 'rgba(5, 15, 35, 0.7)', borderRadius: 8, border: '1px solid rgba(0,242,254,0.2)', overflow: 'hidden', padding: '6px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
                ⚡ 夹爪力控反馈 & 关节角速度实时示波器
              </span>
              <Space size={10} style={{ fontSize: 10 }}>
                <span style={{ color: '#00f2fe' }}>― 夹持力 (18.4 N)</span>
                <span style={{ color: '#00f5a0' }}>― 关节角速度 (42 °/s)</span>
              </Space>
            </div>
            <div style={{ height: 'calc(100% - 24px)', width: '100%' }}>
              <canvas ref={waveformCanvasRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
