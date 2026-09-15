'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Space, Tag, Tooltip, Typography, Button, Badge } from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  SyncOutlined,
  SlidersOutlined,
  AimOutlined,
  DesktopOutlined,
  ShopOutlined,
  InboxOutlined,
  BuildOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Hotspot zones mapped accurately to the 2.5D isometric factory floor image
export const factoryZones = [
  {
    id: 'ZONE_CORE',
    name: '算力与多模态数据总线中心',
    en: 'Edge AI Compute & Data Bus Hub',
    x: 50, // % of width
    y: 45, // % of height
    type: 'core',
    status: '运行中',
    statusColor: '#00f2fe',
    badgeIcon: '⚡',
    stats: { throughput: '2.45 GB/s', latency: '0.032ms', load: '68%' },
    desc: '集成 8x H100 边缘训练集群与 PTP 硬件时钟锁相服务器，汇聚全车间多模态数据流',
    stationData: {
      id: 'HUB-CORE',
      name: '边缘算力与多模态数据总线中心',
      status: '采集中',
      operator: '周启明 · 系统管理员',
      task: 'PTP硬件锁相多模态数据汇总与分发',
      taskbook: 'TB-全局数据总线分发规范 V3.0',
      project: '天奇具身智能边缘计算中心',
      robot: '8x H100 Edge Node + PTP Grandmaster',
      deviceType: '边缘算力集群',
      deviceSN: 'SN-CORE-PTP-001',
      completedEpisodes: 14820,
      targetEpisodes: 15000,
      rate: '98.8%',
      fps: 60,
      sync: '0.032ms'
    }
  },
  {
    id: 'ZONE_INDUSTRY',
    name: '工业流水线装配岛',
    en: 'Industrial Conveyor Assembly Island',
    x: 23,
    y: 26,
    type: 'workstation',
    status: '采集中',
    statusColor: '#00f5a0',
    badgeIcon: '🏭',
    stats: { stations: 'WS-01 ~ 03', episodes: '430/500 Ep', passRate: '99.2%' },
    desc: '配置双臂协作机器人、人形抓取机与传动流水线，主攻四宫格物料上料与结构件装配',
    stationData: {
      id: 'WS-01',
      name: '01号 工业流水线装配工位',
      status: '采集中',
      operator: '王立强',
      task: '四宫格物料抓取与托盘有序装配',
      taskbook: 'TB-工业装配与上料规范 V1.8',
      project: '天奇-制造装配线',
      robot: 'Franka Emika 双臂 + 人形机器人',
      deviceType: '双臂真机',
      deviceSN: 'SN-IND-2026-01',
      completedEpisodes: 430,
      targetEpisodes: 500,
      rate: '86%',
      fps: 60,
      sync: '0.034ms'
    }
  },
  {
    id: 'ZONE_SUPERMARKET',
    name: '商超零售与冷柜数采岛',
    en: 'Retail & Shelving Collection Island',
    x: 74,
    y: 24,
    type: 'workstation',
    status: '采集中',
    statusColor: '#00f5a0',
    badgeIcon: '🛒',
    stats: { stations: 'WS-04 ~ 06', episodes: '300/400 Ep', passRate: '98.5%' },
    desc: '包含标准商超高位货架、透明冷藏展示柜与购物车，开展人形机器人取放与推车数采',
    stationData: {
      id: 'WS-02',
      name: '02号 商超货架冷柜工位',
      status: '采集中',
      operator: '张晓明',
      task: '商超饮料瓶高位分拣与冷柜抓取',
      taskbook: 'TB-商超零售场景采集规范 V2.0',
      project: 'Grocery-WLA项目',
      robot: 'Galbot 轮足人形机器人',
      deviceType: '轮足真机',
      deviceSN: 'SN-MKT-2026-02',
      completedEpisodes: 300,
      targetEpisodes: 400,
      rate: '75%',
      fps: 60,
      sync: '0.038ms'
    }
  },
  {
    id: 'ZONE_LOGISTICS',
    name: '物流码垛与分拣打包岛',
    en: 'Logistics Palletizing & Packing Island',
    x: 20,
    y: 63,
    type: 'workstation',
    status: '采集中',
    statusColor: '#00f5a0',
    badgeIcon: '📦',
    stats: { stations: 'WS-07 ~ 09', episodes: '460/500 Ep', passRate: '99.5%' },
    desc: '模拟仓储物流区，人形机器人协作完成大箱体抓取、码垛、打包与 AGV 搬运交接',
    stationData: {
      id: 'WS-03',
      name: '03号 物流码垛分拣工位',
      status: '采集中',
      operator: '林嘉禾',
      task: '餐盘与物流箱码垛移载任务',
      taskbook: 'TB-物流仓储搬运作业指导书 V1.2',
      project: 'Galbot-厨房与物流场景',
      robot: '双人形机器人 + AGV小车',
      deviceType: '双足人形机器人',
      deviceSN: 'SN-LOG-2026-03',
      completedEpisodes: 460,
      targetEpisodes: 500,
      rate: '92%',
      fps: 60,
      sync: '0.028ms'
    }
  },
  {
    id: 'ZONE_DEXTEROUS',
    name: '精密桌面与五指灵巧岛',
    en: 'Precision Dexterous Manipulation Island',
    x: 68,
    y: 66,
    type: 'workstation',
    status: '质检中',
    statusColor: '#00f2fe',
    badgeIcon: '🦾',
    stats: { stations: 'WS-10 ~ 12', episodes: '90/200 Ep', passRate: '97.8%' },
    desc: '专注触觉力控、高精度芯片接插件插拔、透明/高反光玻璃器皿柔性抓取作业',
    stationData: {
      id: 'WS-04',
      name: '04号 精密五指灵巧工位',
      status: '质检中',
      operator: '李雨桐',
      task: '透明玻璃杯接水与高精密装配',
      taskbook: 'TB-精密触觉力控作业规范 V1.0',
      project: '光学校验攻坚项目',
      robot: 'UR5e + 五指仿生触觉灵巧手',
      deviceType: '五指灵巧手',
      deviceSN: 'SN-DEX-2026-04',
      completedEpisodes: 90,
      targetEpisodes: 200,
      rate: '45%',
      fps: 60,
      sync: '0.042ms'
    }
  },
  {
    id: 'ZONE_COCKPIT',
    name: '质检与人工遥操监控总控台',
    en: 'QA & Teleoperation Command Cockpit',
    x: 88,
    y: 50,
    type: 'cockpit',
    status: '运行中',
    statusColor: '#00f2fe',
    badgeIcon: '🖥️',
    stats: { operator: '赵妍 (主管)', activeTasks: '4 质检中', passRate: '98.8%' },
    desc: '全厂质检中枢，多屏联动复核双视角视频对齐、时钟抖动与动作分段标注真实性',
    stationData: {
      id: 'WS-QC',
      name: '质检与遥操监控总控台',
      status: '质检中',
      operator: '赵妍 · 数据质检主管',
      task: '全厂实时多视角视频与时钟对齐仲裁',
      taskbook: 'TB-多模态具身数据质检通用规范 V2.5',
      project: '天奇数采质量治理中心',
      robot: '多联屏质检工作站 + VR遥操总控台',
      deviceType: '总控终端',
      deviceSN: 'SN-QC-COCKPIT-01',
      completedEpisodes: 1280,
      targetEpisodes: 1300,
      rate: '98.5%',
      fps: 60,
      sync: '0.030ms'
    }
  },
  {
    id: 'ZONE_AGV',
    name: 'AGV 智能物料转运小车',
    en: 'AGV Automated Transport',
    x: 42,
    y: 80,
    type: 'agv',
    status: '巡航中',
    statusColor: '#00f5a0',
    badgeIcon: '🚚',
    stats: { speed: '1.2 m/s', payload: '45 kg', battery: '92%' },
    desc: '在各数采岛与立体料架之间自动运送物料箱、标定工装与采集样本',
    stationData: {
      id: 'AGV-04',
      name: 'AGV-04 智能料箱巡航车',
      status: '采集中',
      operator: 'Auto-Dispatch',
      task: '数采岛间物料料箱自动流转',
      taskbook: 'TB-AGV调度与物料交接规范 V1.0',
      project: '天奇智能物流车间',
      robot: '激光SLAM导航 AGV',
      deviceType: 'AGV移动机器人',
      deviceSN: 'SN-AGV-2026-04',
      completedEpisodes: 120,
      targetEpisodes: 120,
      rate: '100%',
      fps: 30,
      sync: '0.010ms'
    }
  }
];

export default function Factory3DTwin({ onSelectStation }) {
  const canvasRef = useRef(null);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Interactive Particle & Flow Line Canvas Animation linking Center Hub to all islands
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const core = factoryZones.find(z => z.id === 'ZONE_CORE');
    const targets = factoryZones.filter(z => z.id !== 'ZONE_CORE');

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      t += 0.03;

      const coreX = (core.x / 100) * w;
      const coreY = (core.y / 100) * h;

      // Draw Energy Circuit Buses from Core to each Island
      targets.forEach((tgt, idx) => {
        const tx = (tgt.x / 100) * w;
        const ty = (tgt.y / 100) * h;

        // Draw circuit path (orthogonal / isometric style)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(coreX, coreY);

        // Calculate intermediate elbow for circuit look
        const midX = (coreX + tx) * 0.5;
        ctx.lineTo(midX, coreY);
        ctx.lineTo(midX, ty);
        ctx.lineTo(tx, ty);

        ctx.strokeStyle = tgt.id === activeZoneId ? 'rgba(0, 242, 254, 0.7)' : 'rgba(0, 242, 254, 0.22)';
        ctx.lineWidth = tgt.id === activeZoneId ? 2.5 : 1.2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Energy Data Pulses traveling from Core to Target
        const progress = ((t * 0.4 + idx * 0.25) % 1);
        let px, py;
        if (progress < 0.33) {
          const segP = progress / 0.33;
          px = coreX + (midX - coreX) * segP;
          py = coreY;
        } else if (progress < 0.66) {
          const segP = (progress - 0.33) / 0.33;
          px = midX;
          py = coreY + (ty - coreY) * segP;
        } else {
          const segP = (progress - 0.66) / 0.34;
          px = midX + (tx - midX) * segP;
          py = ty;
        }

        ctx.beginPath();
        ctx.arc(px, py, tgt.id === activeZoneId ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = tgt.statusColor;
        ctx.shadowColor = tgt.statusColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // Core Pulsing Rings
      ctx.save();
      const pulseRadius = 30 + Math.sin(t * 2) * 8;
      ctx.beginPath();
      ctx.arc(coreX, coreY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 242, 254, ${0.4 + Math.sin(t * 2) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [activeZoneId]);

  const handleZoneClick = (zone) => {
    if (onSelectStation && zone.stationData) {
      onSelectStation(zone.stationData);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Filter & Station Summary Bar */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(8, 20, 48, 0.9) 0%, rgba(6, 12, 28, 0.4) 100%)',
        borderBottom: '1px solid rgba(0, 242, 254, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f5a0', boxShadow: '0 0 10px #00f5a0' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', letterSpacing: 0.5 }}>
              具身智能数采数字孪生工厂沙盘 (5大工作岛 + 算力总线中枢)
            </span>
          </div>
          <Tag color="cyan" style={{ border: '1px solid rgba(0,242,254,0.3)', background: 'rgba(0,242,254,0.1)' }}>
            实时总线带宽: 2.45 GB/s
          </Tag>
          <Tag color="green" style={{ border: '1px solid rgba(0,245,160,0.3)', background: 'rgba(0,245,160,0.1)' }}>
            16 台机器人/工装协同在线
          </Tag>
        </div>

        {/* Quick Island Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#8da4c4' }}><AimOutlined /> 视点定位:</span>
          {[
            { id: 'ALL', label: '全景' },
            { id: 'ZONE_INDUSTRY', label: '工业流水线' },
            { id: 'ZONE_SUPERMARKET', label: '商超冷柜' },
            { id: 'ZONE_LOGISTICS', label: '物流码垛' },
            { id: 'ZONE_DEXTEROUS', label: '精密灵巧' },
            { id: 'ZONE_COCKPIT', label: '质检中控' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedFilter(item.id);
                setActiveZoneId(item.id === 'ALL' ? null : item.id);
              }}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                borderRadius: 14,
                border: selectedFilter === item.id ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.15)',
                background: selectedFilter === item.id ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                color: selectedFilter === item.id ? '#00f2fe' : '#8da4c4',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: selectedFilter === item.id ? 700 : 400
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2.5D Isometric Interactive Stage */}
      <div style={{
        position: 'relative',
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#060b19'
      }}>
        {/* Crisp Isometric Factory Floor Image Render */}
        <img
          src="/factory_isometric_map.jpg"
          alt="Embodied AI Factory Isometric Floor"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: 'brightness(0.95) contrast(1.08)',
            zIndex: 1
          }}
        />

        {/* Dynamic Energy Data Bus Canvas Overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3
          }}
        />

        {/* Floating Holographic Hotspot Badges for Each Workstation Island */}
        {factoryZones.map((zone) => {
          const isActive = activeZoneId === zone.id || selectedFilter === zone.id;
          const isCore = zone.type === 'core';

          return (
            <div
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              onMouseEnter={() => setActiveZoneId(zone.id)}
              onMouseLeave={() => setActiveZoneId(null)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 30 : 10,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Pulsing Breathing Marker Pin */}
              <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {/* Holographic Tooltip Card */}
                <div style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(8, 28, 64, 0.95) 0%, rgba(4, 14, 34, 0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(10, 22, 45, 0.85) 0%, rgba(5, 12, 28, 0.9) 100%)',
                  border: isActive ? `1.5px solid ${zone.statusColor}` : '1px solid rgba(0, 242, 254, 0.3)',
                  boxShadow: isActive ? `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${zone.statusColor}` : '0 6px 18px rgba(0,0,0,0.6)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  minWidth: isCore ? 170 : 150,
                  transform: isActive ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
                  transition: 'all 0.25s ease'
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13 }}>{zone.badgeIcon}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                        {zone.name}
                      </span>
                    </div>
                    <span style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: zone.statusColor,
                      boxShadow: `0 0 8px ${zone.statusColor}`
                    }} />
                  </div>

                  {/* Card Metrics Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: '#8da4c4', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4, marginTop: 2 }}>
                    <span>{Object.keys(zone.stats)[0] === 'throughput' ? '吞吐:' : Object.keys(zone.stats)[0] === 'stations' ? '工位:' : '状态:'}</span>
                    <span style={{ color: zone.statusColor, fontWeight: 700 }}>
                      {Object.values(zone.stats)[0]}
                    </span>
                    <span style={{ color: '#00f2fe' }}>
                      {Object.values(zone.stats)[1]}
                    </span>
                  </div>
                </div>

                {/* Vertical Anchor Laser Line */}
                <div style={{
                  width: 2,
                  height: 14,
                  background: `linear-gradient(180deg, ${zone.statusColor} 0%, transparent 100%)`,
                  marginTop: 2
                }} />

                {/* Ground Glowing Anchor Ripple */}
                <div style={{
                  width: 12,
                  height: 6,
                  borderRadius: '50%',
                  border: `1.5px solid ${zone.statusColor}`,
                  boxShadow: `0 0 8px ${zone.statusColor}`,
                  animation: 'pulse 1.8s infinite'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint Banner */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        padding: '6px 20px',
        background: 'rgba(5, 12, 28, 0.85)',
        borderTop: '1px solid rgba(0, 242, 254, 0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#8da4c4'
      }}>
        <span>💡 <b>交互指引</b>：点击任意工位岛标签可下钻展开<b>单机传感器遥测、多模态时钟对齐诊断与硬件详情</b></span>
        <Space size={14}>
          <span><span style={{ color: '#00f5a0' }}>●</span> 采集中 (4 岛)</span>
          <span><span style={{ color: '#00f2fe' }}>●</span> 质检复核 (1 岛)</span>
          <span><span style={{ color: '#38bdf8' }}>●</span> PTP硬件时钟同步 (0.032ms)</span>
        </Space>
      </div>
    </div>
  );
}
