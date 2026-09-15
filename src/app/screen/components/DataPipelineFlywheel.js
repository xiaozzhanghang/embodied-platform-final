'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Typography, Tag, Progress, Row, Col, Space } from 'antd';
import {
  SyncOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  RobotOutlined,
  NodeIndexOutlined,
  SlidersOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const pipelineStages = [
  {
    step: '01',
    title: '任务下发与SOP',
    en: 'Task & SOP Spec',
    icon: '📋',
    color: '#38bdf8',
    throughput: '42 项任务书',
    activeCount: '16 个项目',
    desc: '定义场景、材质特性、关节自由度与采集配额',
    metrics: { efficiency: '100%', latency: '<1s' }
  },
  {
    step: '02',
    title: '实机/仿真多模态采集',
    en: 'Teleop & Sim Collection',
    icon: '🦾',
    color: '#00f2fe',
    throughput: '14,820 Ep/日',
    activeCount: '14 工位在线',
    desc: '双目RGBD、鱼眼、6-DoF末端轨迹与力传感器同步',
    metrics: { syncPrecision: '0.034ms', fps: '60 FPS' }
  },
  {
    step: '03',
    title: '时空对齐与自动清洗',
    en: 'Sync & Auto-Cleaning',
    icon: '⚡',
    color: '#00f5a0',
    throughput: '2.4 GB/s 流吞吐',
    activeCount: '清洗率 99.4%',
    desc: 'PTP硬件锁相校验、奇异点轨迹剔除、空抓过滤',
    metrics: { filterRate: '3.2%', autoPass: '96.8%' }
  },
  {
    step: '04',
    title: '时序分段与自然语言标注',
    en: 'Temporal & NL Labeling',
    icon: '🏷️',
    color: '#a855f7',
    throughput: '9,840 条已标',
    activeCount: '8 名标注员',
    desc: '动作子步骤拆解 (如: 接近-抓取-提升-放置) 与物体包围盒',
    metrics: { stepAccuracy: '99.2%', speed: '180 Ep/h' }
  },
  {
    step: '05',
    title: '真值质检与合规审核',
    en: 'QA & Compliance Audit',
    icon: '🛡️',
    color: '#ec4899',
    throughput: '99.1% 一次通过率',
    activeCount: '2 名质检员',
    desc: '双视角视频复核、时钟对齐校验、动作完整性仲裁',
    metrics: { returnRate: '0.9%', avgTime: '45s/Ep' }
  },
  {
    step: '06',
    title: '高质量具身数据集发布',
    en: 'Dataset Packaging',
    icon: '📦',
    color: '#f59e0b',
    throughput: '1.42 M 轨迹库',
    activeCount: '48 个版本',
    desc: 'HDF5 / Zarr / Parquet 多模态标准包，支持跨算力集群秒级分发',
    metrics: { storage: '184 TB', compression: '4.2x' }
  },
  {
    step: '07',
    title: 'VLA 大模型预训练与评测',
    en: 'VLA Training & Sim2Real',
    icon: '🧠',
    color: '#6366f1',
    throughput: 'GO-1 基座模型',
    activeCount: '闭环评测 88.5%',
    desc: '下游策略微调、仿真环境闭环评测与真机泛化验证',
    metrics: { taskSuccess: '88.5%', generalize: '+14%' }
  },
];

export default function DataPipelineFlywheel() {
  const [selectedStage, setSelectedStage] = useState(1);
  const canvasRef = useRef(null);

  // Animated particle pipeline canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 800),
        y: (canvas.height || 400) * 0.45 + (Math.random() - 0.5) * 30,
        speed: 1.5 + Math.random() * 2,
        size: Math.random() * 2.5 + 1.5,
        color: ['#00f2fe', '#00f5a0', '#38bdf8', '#a855f7'][Math.floor(Math.random() * 4)]
      });
    }

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const centerY = h * 0.45;

      // Draw Main Flow Highway Line
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
      gradient.addColorStop(0.3, 'rgba(0, 242, 254, 0.4)');
      gradient.addColorStop(0.6, 'rgba(0, 245, 160, 0.4)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(40, centerY);
      ctx.lineTo(w - 40, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update & Draw Flowing Particles
      particles.forEach(p => {
        p.x += p.speed;
        if (p.x > w - 40) p.x = 40;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const cur = pipelineStages[selectedStage] || pipelineStages[1];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Background Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Header */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(10, 25, 55, 0.8) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NodeIndexOutlined style={{ color: '#00f2fe', fontSize: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            具身数据资产全生命周期流动飞轮 (End-to-End Embodied Data Flywheel)
          </span>
        </div>
        <Tag color="cyan" style={{ border: '1px solid rgba(0,242,254,0.3)', background: 'rgba(0,242,254,0.1)' }}>
          🔄 全链路自闭环迭代 (Sim2Real2Sim)
        </Tag>
      </div>

      {/* Pipeline Stage Flow Cards */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        padding: '16px 14px',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px',
        alignItems: 'center',
      }}>
        {pipelineStages.map((st, idx) => {
          const isSelected = selectedStage === idx;
          return (
            <div
              key={st.step}
              onClick={() => setSelectedStage(idx)}
              style={{
                background: isSelected
                  ? `linear-gradient(180deg, rgba(${hexToRgb(st.color)}, 0.25) 0%, rgba(10, 25, 50, 0.9) 100%)`
                  : 'linear-gradient(180deg, rgba(15, 30, 60, 0.6) 0%, rgba(6, 15, 35, 0.8) 100%)',
                border: isSelected ? `1.5px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '10px 8px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'translateY(-4px) scale(1.03)' : 'none',
                boxShadow: isSelected ? `0 10px 25px rgba(0,0,0,0.6), 0 0 15px ${st.color}` : '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: st.color }}>STAGE {st.step}</span>
                <span style={{ fontSize: 14 }}>{st.icon}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {st.title}
              </div>
              <div style={{ fontSize: 9, color: '#8da4c4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {st.en}
              </div>
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{st.throughput}</div>
                <div style={{ fontSize: 10, color: '#8da4c4' }}>{st.activeCount}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Deep-Dive Detail Card */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        flex: 1,
        margin: '0 14px 12px 14px',
        padding: '16px 20px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(10, 25, 55, 0.85) 0%, rgba(5, 12, 28, 0.95) 100%)',
        border: `1px solid ${cur.color}40`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.5), inset 0 0 20px ${cur.color}15`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Space size={8}>
              <span style={{ fontSize: 22 }}>{cur.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                STAGE {cur.step} · {cur.title} ({cur.en})
              </span>
            </Space>
            <Tag color="blue" style={{ background: `${cur.color}25`, border: `1px solid ${cur.color}`, color: cur.color, fontWeight: 700 }}>
              实时吞吐: {cur.throughput}
            </Tag>
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>
            {cur.desc}
          </div>
        </div>

        {/* Real-time Sub-metrics */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: '12px 16px',
          marginTop: 10
        }}>
          <Row gutter={[16, 8]}>
            <Col span={6}>
              <div style={{ color: '#8da4c4', fontSize: 11 }}>当前节点处理吞吐</div>
              <div style={{ color: cur.color, fontWeight: 700, fontSize: 15, marginTop: 2 }}>{cur.throughput}</div>
            </Col>
            <Col span={6}>
              <div style={{ color: '#8da4c4', fontSize: 11 }}>在线工位/人员配额</div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15, marginTop: 2 }}>{cur.activeCount}</div>
            </Col>
            <Col span={6}>
              <div style={{ color: '#8da4c4', fontSize: 11 }}>核心性能指标</div>
              <div style={{ color: '#00f5a0', fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                {Object.values(cur.metrics)[0]}
              </div>
            </Col>
            <Col span={6}>
              <div style={{ color: '#8da4c4', fontSize: 11 }}>质量与延迟指标</div>
              <div style={{ color: '#00f2fe', fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                {Object.values(cur.metrics)[1]}
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}
