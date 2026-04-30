'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Typography, Space, Card, Row, Col, Badge, Divider } from 'antd';
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';

import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function DeviceConnectionPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId || 'CT-20250301001';
  
  const [activeTab, setActiveTab] = useState('master_slave');

  const tabs = [
    { key: 'master_slave', title: '主从臂设备', status: '已连接', statusColor: '#52c41a' },
    { key: 'robot', title: '机器人本体', status: '设备正常', statusColor: '#52c41a' },
    { key: 'vr', title: 'VR 设备', status: '已连接', statusColor: '#52c41a' },
  ];

  const deviceData = {
    master_slave: {
      title: '主从臂设备信息',
      desc: '主从臂用于控制机器人做同步运动，通过人手臂带动主臂的 7DOF 可移动机器人从臂完成动作采集。',
      image: '/assets/images/master_slave.png',
      imageTitle: '主从臂设备示意图',
      props1: [
        { label: '链路连接状态', value: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>已连接</span> },
        { label: '手柄输入', value: <span style={{ color: '#1677ff', fontWeight: 'bold' }}>L / R 正常</span> },
        { label: '控制频率', value: <span style={{ fontWeight: 'bold' }}>500 Hz</span> },
      ],
      props2: [
        { label: '右臂夹爪', value: <><Badge color="green" /> 已连接</> },
        { label: '左臂夹爪', value: <><Badge color="green" /> 已连接</> },
        { label: 'J1-J7 关节', value: <><Badge color="green" /> 在线</> },
        { label: '手柄按钮', value: <><Badge color="green" /> 正常</> },
      ]
    },
    robot: {
      title: '机器人本体信息',
      desc: '机器人本体聚合头部、双臂、相机、末端执行器、升降装置和底盘状态，是采集任务进入工作台前的设备门禁。',
      image: '/assets/images/robot_body.png',
      imageTitle: '机器人本体示意图',
      props1: [
        { label: '本机 IP', value: <span style={{ fontWeight: 'bold' }}>192.168.12.12</span> },
        { label: 'SN', value: <span style={{ fontWeight: 'bold' }}>R001GB00AAEE812</span> },
        { label: '设备电量', value: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>74%</span> },
      ],
      props2: [
        { label: '头部状态', value: <><Badge color="green" /> 设备正常</> },
        { label: '头部相机状态', value: <><Badge color="green" /> 相机通信正常</> },
        { label: '左/右臂状态', value: <><Badge color="green" /> 关节正常</> },
        { label: '左/右末端执行器', value: <><Badge color="green" /> 夹爪正常</> },
        { label: '升降装置', value: <><Badge color="green" /> 关节正常</> },
        { label: '底盘状态', value: <><Badge color="orange" /> 待标定</> },
      ]
    },
    vr: {
      title: 'VR 设备信息',
      desc: 'VR 设备提供第一视角监看、手柄按键与空间位姿输入，用于采集过程中的远程观察和动作确认。',
      image: '/assets/images/vr_headset.png',
      imageTitle: 'VR 设备示意图',
      props1: [
        { label: '头显链路', value: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>已连接</span> },
        { label: '左手柄', value: <span style={{ color: '#1677ff', fontWeight: 'bold' }}>已配对</span> },
        { label: '右手柄', value: <span style={{ color: '#1677ff', fontWeight: 'bold' }}>已配对</span> },
      ],
      props2: [
        { label: '头显画面', value: <><Badge color="green" /> 在线</> },
        { label: '左右手柄', value: <><Badge color="green" /> 在线</> },
        { label: '空间定位', value: <><Badge color="green" /> 正常</> },
        { label: '按键映射', value: <><Badge color="green" /> 正常</> },
      ]
    }
  };

  const currentData = deviceData[activeTab];

  return (
    <MainLayout>
      <div style={{ height: '100%', background: '#f0f2f5', display: 'flex', flexDirection: 'column', margin: '-24px' }}>
      
      {/* Header */}
      <div style={{ height: 64, background: '#f0f2f5', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 'bold', letterSpacing: 1 }}>DEVICE CONNECTION</div>
           <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1f1f1f' }}>设备连接状态</div>
        </div>
        <Space size="middle">
          <Button size="large" onClick={() => router.push('/collection/collect')}>返回采集任务</Button>
        </Space>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Tabs Card */}
        <div style={{ background: '#fff', borderRadius: 8, padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16 }}>
          {tabs.map(tab => (
            <div 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ 
                padding: '8px 24px', 
                borderRadius: 4, 
                border: activeTab === tab.key ? '1px solid #1677ff' : '1px solid #e8e8e8',
                background: activeTab === tab.key ? '#e6f4ff' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontWeight: 500, color: activeTab === tab.key ? '#1677ff' : '#333' }}>{tab.title}</span>
              <span style={{ fontSize: 12, color: tab.statusColor, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Badge color={tab.statusColor} /> {tab.status}
              </span>
            </div>
          ))}
        </div>

        {/* Split Layout */}
        <div style={{ display: 'flex', gap: 24, flex: 1 }}>
          
          {/* Left Image Panel */}
          <div style={{ width: 400, background: '#fff', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>{currentData.imageTitle}</span>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>已连接</span>
            </div>
            <div style={{ flex: 1, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src={currentData.image} alt={currentData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* Right Info Panel */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, padding: 32, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{currentData.title}</div>
            <div style={{ color: '#595959', fontSize: 14, marginBottom: 40, lineHeight: 1.6, maxWidth: 800 }}>
              {currentData.desc}
            </div>

            {/* Properties Group 1 */}
            <div style={{ maxWidth: 600, marginBottom: 40 }}>
              {currentData.props1.map((prop, idx) => (
                <div key={idx} style={{ display: 'flex', padding: '12px 0', borderBottom: '1px dashed #f0f0f0' }}>
                  <div style={{ width: 200, color: '#595959' }}>{prop.label}</div>
                  <div style={{ flex: 1 }}>{prop.value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 24 }}>状态信息</div>
            
            {/* Properties Group 2 (Grid) */}
            <div style={{ maxWidth: 800, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 48px', marginBottom: 48 }}>
              {currentData.props2.map((prop, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#595959' }}>{prop.label}</span>
                  <span style={{ fontWeight: 500 }}>{prop.value}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>参数设置</div>
            <Space size="middle">
              <Button size="large">高度调整</Button>
              <Button size="large">头部视角调整</Button>
              <Button size="large">夹爪调整</Button>
            </Space>



          </div>
        </div>

      </div>
    </div>
    </MainLayout>
  );
}
