'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Tabs, Card, Tag, Typography, Space, Row, Col, Divider, List, Badge, Tooltip } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleFilled, 
  InfoCircleOutlined, 
  SettingOutlined, 
  RobotOutlined, 
  MonitorOutlined, 
  DeploymentUnitOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  MessageOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function DeviceStatusPage() {
  const router = useRouter();
  const params = useParams();
  const [activeKey, setActiveKey] = useState('1');

  const taskId = params?.taskId || 'CT-20250301001';

  const statusLogs = [
    { time: '2026-05-08 16:20:11', msg: '系统自检完成: 所有核心模块通信正常', type: 'success' },
    { time: '2026-05-08 16:20:10', msg: '机器人本体: 已进入就绪态 (Ready State)', type: 'info' },
    { time: '2026-05-08 16:20:09', msg: 'VR设备: 6DOF 空间定位追踪正常', type: 'info' },
    { time: '2026-05-08 16:20:08', msg: '主从臂设备: 力反馈电机自准直成功', type: 'info' },
    { time: '2026-05-08 16:20:05', msg: '网络环境: 检测到 1000Mbps 网口直连', type: 'info' },
  ];

  const renderMasterSlave = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          height: 600, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #f0f0f0'
        }}>
          {/* Mock Schematic Image */}
          <div style={{ position: 'relative', width: '80%', height: '80%' }}>
            <img src="/assets/images/master_arm_schematic.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="master arm" />
            
            {/* Annotation Markers */}
            <div style={{ position: 'absolute', top: '15%', left: '20%', borderBottom: '1px solid #1677ff', paddingRight: 40 }}>
               <span style={{ fontSize: 12, position: 'absolute', right: 0, top: -18, whiteSpace: 'nowrap' }}>J1 旋转轴 (OK)</span>
            </div>
            <div style={{ position: 'absolute', top: '35%', left: '15%', borderBottom: '1px solid #1677ff', paddingRight: 60 }}>
               <span style={{ fontSize: 12, position: 'absolute', right: 0, top: -18, whiteSpace: 'nowrap' }}>J2/J3 关节臂</span>
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '15%', borderBottom: '1px solid #1677ff', paddingLeft: 60 }}>
               <span style={{ fontSize: 12, position: 'absolute', left: 0, top: -18, whiteSpace: 'nowrap' }}>力反馈手柄</span>
            </div>
            <div style={{ position: 'absolute', top: '50%', right: '10%', borderBottom: '1px solid #1677ff', paddingLeft: 40 }}>
               <span style={{ fontSize: 12, position: 'absolute', left: 0, top: -18, whiteSpace: 'nowrap' }}>六维力传感器</span>
            </div>
          </div>
          
          {/* Float Title */}
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5}>| 主从臂硬件分布图</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">设备名称</Text>
                <Text strong>高精度力反馈主手</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">序列号 (SN)</Text>
                <Text>HAPTIC-FR3-2025001</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">连接状态</Text>
                <Tag color="success">已连接</Tag>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Title level={5}>| 状态信息</Title>
            <Row gutter={[16, 16]} style={{ padding: '0 12px' }}>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Text type="secondary" size="small">实时心跳</Text>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>1000 Hz</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Text type="secondary" size="small">位置精度</Text>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>±0.01 mm</div>
                </div>
              </Col>
              <Col span={12}>
                <Badge status="success" text="电机初始化完成" />
              </Col>
              <Col span={12}>
                <Badge status="success" text="力反馈通道正常" />
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Title level={5}>| 参数设置</Title>
            <Space wrap>
              <Button size="small">力反馈强度调节</Button>
              <Button size="small">零点重新校准</Button>
              <Button size="small">模式切换</Button>
            </Space>
          </div>
        </Space>
      </Col>
    </Row>
  );

  const renderRobotBody = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          height: 600, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ position: 'relative', width: '60%', height: '80%' }}>
            <img src="/assets/images/robot_schematic.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="robot" />
            {/* Robot Markers */}
            <div style={{ position: 'absolute', top: '10%', right: '-20%', borderBottom: '1px solid #ff4d4f', paddingLeft: 40 }}>
               <span style={{ fontSize: 12, position: 'absolute', left: 0, top: -18, whiteSpace: 'nowrap' }}>头部相机 (30fps)</span>
            </div>
            <div style={{ position: 'absolute', top: '30%', left: '-20%', borderBottom: '1px solid #1677ff', paddingRight: 40 }}>
               <span style={{ fontSize: 12, position: 'absolute', right: 0, top: -18, whiteSpace: 'nowrap' }}>左侧执行器</span>
            </div>
            <div style={{ position: 'absolute', bottom: '15%', left: '50%', borderLeft: '1px solid #8c8c8c', height: 40 }}>
               <span style={{ fontSize: 12, position: 'absolute', bottom: -20, left: -20, whiteSpace: 'nowrap' }}>移动底盘 (Locked)</span>
            </div>
          </div>
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5}>| 机器人本体拓扑图</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">机型</Text>
                <Text strong>Tianqi Bionic-G1</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">IP地址</Text>
                <Text>192.168.1.100</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">电池状态</Text>
                <Tag color="success">98% (充电中)</Tag>
              </div>
            </div>
          </div>
          <div>
            <Title level={5}>| 状态信息</Title>
            <List
              size="small"
              dataSource={[
                { label: '控制器', status: '正常' },
                { label: '头部相机', status: '已开启' },
                { label: '左/右关节', status: '就绪' },
                { label: '紧急停止按键', status: '未按下' },
                { label: '感知系统', status: '正常' },
              ]}
              renderItem={item => (
                <List.Item style={{ padding: '8px 12px' }}>
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    <span>{item.label}</span>
                  </Space>
                  <Text type="success">{item.status}</Text>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Col>
    </Row>
  );

  const renderVREquipment = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          height: 600, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #f0f0f0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <MonitorOutlined style={{ fontSize: 120, color: '#bfbfbf' }} />
            <div style={{ marginTop: 24, fontSize: 16, color: '#8c8c8c' }}>VR设备佩戴示意图 (3D Model Loading...)</div>
          </div>
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5}>| VR 感知设备状态</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
         <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">头显型号</Text>
                <Text strong>Meta Quest 3 (Wired)</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">追踪频率</Text>
                <Text>90 Hz</Text>
              </div>
            </div>
          </div>
          <div>
            <Title level={5}>| 手柄状态 (L/R)</Title>
            <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, textAlign: 'center' }}>
              <Row gutter={20}>
                <Col span={12}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>左手柄</div>
                  <Badge status="success" text="已配对" />
                </Col>
                <Col span={12}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>右手柄</div>
                  <Badge status="success" text="已配对" />
                </Col>
              </Row>
            </div>
          </div>
        </Space>
      </Col>
    </Row>
  );

  return (
    <MainLayout>
      <div style={{ padding: '0 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space size="middle">
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <div>
              <Title level={4} style={{ margin: 0 }}>设备自检状态看板</Title>
              <Text type="secondary">采集任务: {taskId} | 请确认硬件就绪后进入工作台</Text>
            </div>
          </Space>
          <Space>
            <Button icon={<HistoryOutlined />}>重连设备</Button>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlayCircleOutlined />} 
              onClick={() => router.push(`/collection/collect/workspace/${taskId}`)}
            >
              确认并进入工作台
            </Button>
          </Space>
        </div>

        <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, overflow: 'hidden' }}>
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            type="line"
            size="large"
            style={{ padding: '0 24px' }}
            items={[
              {
                key: '1',
                label: <Space><DeploymentUnitOutlined />主从臂设备</Space>,
                children: <div style={{ padding: 24 }}>{renderMasterSlave()}</div>,
              },
              {
                key: '2',
                label: <Space><MonitorOutlined />VR设备</Space>,
                children: <div style={{ padding: 24 }}>{renderVREquipment()}</div>,
              },
              {
                key: '3',
                label: <Space><RobotOutlined />机器人本体</Space>,
                children: <div style={{ padding: 24 }}>{renderRobotBody()}</div>,
              },
            ]}
          />
        </Card>

        {/* Floating Log Viewer (Photos reference) */}
        <div style={{ 
          position: 'fixed', 
          bottom: 24, 
          left: 280, // Offset for sidebar
          width: 320, 
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <Card 
            title={<div style={{ fontSize: 13 }}><MessageOutlined /> 运行信息</div>}
            size="small"
            style={{ borderRadius: 8, borderColor: '#d9d9d9' }}
            extra={<Button type="link" size="small">清空</Button>}
          >
            <div style={{ height: 180, overflowY: 'auto', fontSize: 12 }}>
              {statusLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>[{log.time.split(' ')[1]}]</Text>{' '}
                  <Text type={log.type === 'success' ? 'success' : 'default'}>{log.msg}</Text>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8, fontSize: 11 }}>
              <Text type="secondary">当前模式: <Text strong>数据采集模式</Text></Text>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
