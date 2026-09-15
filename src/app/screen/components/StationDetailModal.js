'use client';

import React from 'react';
import { Modal, Tag, Progress, Row, Col, Typography, Space, Button } from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

export default function StationDetailModal({ station, visible, onClose, onSwitchToStream }) {
  if (!station) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case '采集中': return '#00f5a0';
      case '质检中': return '#00f2fe';
      case '待机': return '#8da4c4';
      case '异常': return '#ff4d4f';
      default: return '#1677ff';
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
          <Space>
            <RobotOutlined style={{ color: '#00f2fe', fontSize: 18 }} />
            <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 700 }}>
              {station.name} · 数采工位遥测终端
            </span>
          </Space>
          <Tag color={station.status === '采集中' ? 'green' : station.status === '质检中' ? 'cyan' : 'default'}>
            ● {station.status}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
          关闭窗口
        </Button>,
        <Button
          key="stream"
          type="primary"
          icon={<EyeOutlined />}
          style={{ background: 'linear-gradient(135deg, #00f2fe 0%, #1677ff 100%)', border: 'none', color: '#050b17', fontWeight: 700 }}
          onClick={() => {
            onClose();
            if (onSwitchToStream) onSwitchToStream(station);
          }}
        >
          下钻实时多模态视窗
        </Button>
      ]}
      styles={{
        content: {
          background: 'linear-gradient(180deg, #0d1b38 0%, #081126 100%)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,242,254,0.15)',
          color: '#e2e8f0',
        },
        header: {
          background: 'transparent',
          borderBottom: '1px solid rgba(0, 242, 254, 0.2)',
          paddingBottom: 12
        }
      }}
    >
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Info Grid */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#8da4c4', fontSize: 12 }}>当前执行任务书</Text>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, marginTop: 4 }}>{station.taskbook || 'TB-餐盘整理任务规范 V2.0'}</div>
              <div style={{ color: '#00f2fe', fontSize: 12, marginTop: 4 }}>项目归属: {station.project || 'Galbot-通用机器人厨房项目'}</div>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#8da4c4', fontSize: 12 }}>当班遥操员 & 设备</Text>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserOutlined style={{ color: '#00f5a0' }} /> {station.operator || '林嘉禾'}
                <Tag color="blue" style={{ fontSize: 11, marginLeft: 6 }}>{station.deviceType || '双臂双目真机'}</Tag>
              </div>
              <div style={{ color: '#8da4c4', fontSize: 12, marginTop: 4 }}>硬件序列号: {station.deviceSN || 'SN-TQ-2026-0881'}</div>
            </div>
          </Col>
        </Row>

        {/* Progress & Episode */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#8da4c4', fontSize: 13 }}>今日批次采集进度 (Episode)</span>
            <span style={{ color: '#00f5a0', fontWeight: 700 }}>{station.completedEpisodes || 42} / {station.targetEpisodes || 50} 条 ({Math.round(((station.completedEpisodes || 42) / (station.targetEpisodes || 50)) * 100)}%)</span>
          </div>
          <Progress
            percent={Math.round(((station.completedEpisodes || 42) / (station.targetEpisodes || 50)) * 100)}
            strokeColor={{ '0%': '#00f2fe', '100%': '#00f5a0' }}
            trailColor="rgba(255,255,255,0.1)"
            showInfo={false}
          />
        </div>

        {/* Sensor & Telemetry Metrics */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8, padding: 14 }}>
          <Text style={{ color: '#00f2fe', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 10 }}>
            🛰️ 传感器在线遥测诊断 (Hardware & Sensor Heartbeat)
          </Text>
          <Row gutter={[12, 12]}>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
                <div style={{ color: '#8da4c4', fontSize: 11 }}>头部 RGBD</div>
                <div style={{ color: '#00f5a0', fontWeight: 700, fontSize: 13, marginTop: 2 }}>30 FPS (OK)</div>
                <div style={{ color: '#52c41a', fontSize: 10 }}>1080P / 12Mbps</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
                <div style={{ color: '#8da4c4', fontSize: 11 }}>手腕双目鱼眼</div>
                <div style={{ color: '#00f5a0', fontWeight: 700, fontSize: 13, marginTop: 2 }}>60 FPS (OK)</div>
                <div style={{ color: '#52c41a', fontSize: 10 }}>低延时 18ms</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
                <div style={{ color: '#8da4c4', fontSize: 11 }}>6-DoF 力传感器</div>
                <div style={{ color: '#00f2fe', fontWeight: 700, fontSize: 13, marginTop: 2 }}>1000 Hz</div>
                <div style={{ color: '#1677ff', fontSize: 10 }}>力控 8.4 N</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 6 }}>
                <div style={{ color: '#8da4c4', fontSize: 11 }}>时钟同步漂移</div>
                <div style={{ color: '#00f5a0', fontWeight: 700, fontSize: 13, marginTop: 2 }}>0.04 ms</div>
                <div style={{ color: '#52c41a', fontSize: 10 }}>PTP硬件锁相</div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Current Target Objects */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0, 242, 254, 0.04)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(0, 242, 254, 0.1)' }}>
          <span style={{ color: '#8da4c4', fontSize: 12 }}>当前采集物体属性:</span>
          <Space size={6}>
            <Tag color="cyan">盘子 (陶瓷/刚体)</Tag>
            <Tag color="blue">不锈钢餐刀 (高反光)</Tag>
            <Tag color="purple">双指平动夹爪 (80mm)</Tag>
          </Space>
        </div>
      </div>
    </Modal>
  );
}
