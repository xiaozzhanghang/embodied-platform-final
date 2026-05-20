'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Tabs, Card, Tag, Typography, Space, Row, Col, Divider, List, Badge, Alert } from 'antd';
import { 
  ArrowLeftOutlined, 
  CheckCircleFilled, 
  CloseCircleFilled,
  InfoCircleOutlined, 
  SettingOutlined, 
  RobotOutlined, 
  MonitorOutlined, 
  DeploymentUnitOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  MessageOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  HddOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

export default function DeviceStatusPage() {
  const router = useRouter();
  const params = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [isErrorMode, setIsErrorMode] = useState(true); // Simulate error state initially to match the screenshot flow

  const taskId = params?.taskId || 'CT-20250301001';

  const statusLogs = [
    { time: '16:20:11', msg: '系统自检完成: 发现 1 个硬件模块异常 (右侧手部夹爪未响应)', type: 'error' },
    { time: '16:20:10', msg: '背包主机: 已进入就绪态 (Ready State)', type: 'info' },
    { time: '16:20:09', msg: '夹爪控制器: 警告！检测到 1 个设备。请检查 USB 数据线连接', type: 'error' },
    { time: '16:20:08', msg: '移动电源: 握手成功 (输出功率 22.5W, 备用电池在线)', type: 'info' },
    { time: '16:20:05', msg: '网口环境: 本地 IP 192.168.54.53 与背包 192.168.54.110 双向通路正常', type: 'success' },
  ];

  const healthyLogs = [
    { time: '16:21:05', msg: '系统自检完成: 所有核心硬件就绪，可以安全进入工作台。', type: 'success' },
    { time: '16:20:10', msg: '背包主机: 已进入就绪态 (Ready State)', type: 'info' },
    { time: '16:20:09', msg: '夹爪控制器: 检测到两台设备。左右侧夹爪配对校验成功', type: 'success' },
    { time: '16:20:08', msg: '移动电源: 握手成功 (输出功率 22.5W, 电量 92%)', type: 'info' },
    { time: '16:20:05', msg: '网口环境: 本地 IP 192.168.54.53 与背包 192.168.54.110 通信正常', type: 'success' },
  ];

  // 1. Render Backpack Host Page
  const renderBackpackHost = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          height: 520, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #f0f0f0',
          overflow: 'hidden'
        }}>
          {/* Simulated blueprint drawing for Lumos Backpack */}
          <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              width: 200, height: 260, border: '4px solid #1677ff', borderRadius: 24, background: '#e6f4ff', 
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around',
              boxShadow: '0 8px 24px rgba(22, 119, 255, 0.15)'
            }}>
              <div style={{ width: 120, height: 16, background: '#faad14', borderRadius: 4, textAlign: 'center', fontSize: 9, color: '#fff', fontWeight: 'bold' }}>
                48000mAh POWER
              </div>
              <div style={{ width: 80, height: 80, border: '2px solid #52c41a', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textAlign: 'center' }}>
                Mini PC<br/>(Ubuntu 22.04)
              </div>
              <div style={{ width: 100, height: 30, background: '#1677ff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                蓝光启动按钮
              </div>
            </div>
            
            {/* Annotation markers for backpack parts */}
            <div style={{ position: 'absolute', top: '10%', left: '5%', borderBottom: '1px solid #1677ff', paddingRight: 40 }}>
              <span style={{ fontSize: 12, position: 'absolute', right: 0, top: -18, whiteSpace: 'nowrap' }}>移动电源 Type-C DC 供电 (20V)</span>
            </div>
            <div style={{ position: 'absolute', top: '40%', right: '5%', borderBottom: '1px solid #52c41a', paddingLeft: 40 }}>
              <span style={{ fontSize: 12, position: 'absolute', left: 0, top: -18, whiteSpace: 'nowrap' }}>HDMI 信号模拟器 (OK)</span>
            </div>
            <div style={{ position: 'absolute', bottom: '15%', left: '10%', borderBottom: '1px solid #13c2c2', paddingRight: 50 }}>
              <span style={{ fontSize: 12, position: 'absolute', right: 0, top: -18, whiteSpace: 'nowrap' }}>3.5mm 音频监听阻抗正常</span>
            </div>
          </div>
          
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5}>| 数采背包主机拓扑图</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">设备型号</Text>
                <Text strong>Lumos FastUMI Go 离线版数采主机</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">序列号 (SN)</Text>
                <Text>LUMOS-GO-OFFLINE-2026105</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">背包 IP 地址</Text>
                <Text strong style={{ color: '#1677ff' }}>192.168.54.110</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">移动电源电量</Text>
                <Tag color="success">92% (输入功率 22.5W)</Tag>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Title level={5}>| 状态信息</Title>
            <Row gutter={[16, 16]} style={{ padding: '0 12px' }}>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>主频负载</Text>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1677ff' }}>CPU: 24% | GPU: 68%</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>可用存储</Text>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>105 GB / 128 GB</div>
                </div>
              </Col>
              <Col span={12}>
                <Badge status="success" text="HDMI 诱骗器信号连接正常" />
              </Col>
              <Col span={12}>
                <Badge status="success" text="耳机音频插口就绪 (Stereo)" />
              </Col>
            </Row>
          </div>
        </Space>
      </Col>
    </Row>
  );

  // 2. Render Grippers Page
  const renderGrippers = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: isErrorMode ? '#fff1f0' : '#f8f9fa', 
          borderRadius: 8, 
          height: 520, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: isErrorMode ? '1px solid #ffa39e' : '1px solid #f0f0f0',
          transition: 'all 0.3s',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            
            {/* Left gripper visual */}
            <div style={{ textAlign: 'center', border: '1px dashed #52c41a', padding: 16, borderRadius: 8, background: '#fff', width: 160 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>左手控制夹爪</div>
              <div style={{ width: 80, height: 60, background: '#f0f0f0', borderRadius: 4, margin: '0 auto 8px', border: '2px solid #52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleFilled style={{ color: '#52c41a', fontSize: 24 }} />
              </div>
              <div style={{ fontSize: 10, color: '#666' }}>USB 端口: `/dev/ttyUSB0`</div>
              <div style={{ fontSize: 10, color: '#52c41a' }}>力反馈准直: 已就绪</div>
            </div>

            {/* Right gripper visual */}
            <div style={{ 
              textAlign: 'center', 
              border: isErrorMode ? '1px dashed #ff4d4f' : '1px dashed #52c41a', 
              padding: 16, 
              borderRadius: 8, 
              background: '#fff', 
              width: 160,
              boxShadow: isErrorMode ? '0 0 12px rgba(255,77,79,0.15)' : 'none'
            }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: isErrorMode ? '#ff4d4f' : '#52c41a', marginBottom: 8 }}>右手控制夹爪</div>
              <div style={{ 
                width: 80, height: 60, 
                background: '#f0f0f0', borderRadius: 4, margin: '0 auto 8px', 
                border: isErrorMode ? '2px solid #ff4d4f' : '2px solid #52c41a', 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {isErrorMode ? <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 24 }} /> : <CheckCircleFilled style={{ color: '#52c41a', fontSize: 24 }} />}
              </div>
              <div style={{ fontSize: 10, color: '#666' }}>{isErrorMode ? 'USB 端口: 连接丢失' : 'USB 端口: `/dev/ttyUSB1`'}</div>
              <div style={{ fontSize: 10, color: isErrorMode ? '#ff4d4f' : '#52c41a' }}>{isErrorMode ? '力反馈准直: 异常' : '力反馈准直: 已就绪'}</div>
            </div>

          </div>
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5} style={{ color: isErrorMode ? '#cf1322' : 'inherit' }}>| 数据采集主从夹爪状态 {isErrorMode && '(异常)'}</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">控制器类别</Text>
                <Text strong>自适应力控手柄夹爪 (Franka-Haptic)</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">左夹爪状态</Text>
                <Tag color="success">正常通信</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">右夹爪状态</Text>
                <Tag color={isErrorMode ? 'error' : 'success'}>{isErrorMode ? '未响应 (设备丢失)' : '正常通信'}</Tag>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Title level={5}>| 故障排查建议</Title>
            {isErrorMode ? (
              <div style={{ padding: '0 12px' }}>
                <Alert
                  message="检测到 1 个设备通信异常"
                  description="可能是右侧夹爪的 USB 信号接头未锁紧，或供电不足。请根据《离线版使用指南》第 11 页说明：重新插拔夹爪 USB 连接线，并点击重连设备。"
                  type="error"
                  showIcon
                />
                <Button type="primary" danger block style={{ marginTop: 16 }} icon={<SyncOutlined />} onClick={() => setIsErrorMode(false)}>
                  尝试重连并重新校准
                </Button>
              </div>
            ) : (
              <Text type="secondary" style={{ padding: '0 12px' }}>双臂及夹爪传感器自准直通过，零点校准完毕，通信状态极佳。</Text>
            )}
          </div>
        </Space>
      </Col>
    </Row>
  );

  // 3. Render Cameras Page
  const renderCameras = () => (
    <Row gutter={24}>
      <Col span={14}>
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 8, 
          height: 520, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid #f0f0f0',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ width: '45%', border: '1px solid #d9d9d9', borderRadius: 4, background: '#000', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ color: '#fff', fontSize: 11 }}>[WRIST_CAM_L] 左手相机流就绪</span>
              <div style={{ position: 'absolute', bottom: 8, right: 8, color: '#52c41a', fontSize: 9 }}>30fps | 640x360</div>
            </div>
            <div style={{ width: '45%', border: '1px solid #d9d9d9', borderRadius: 4, background: '#000', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ color: '#fff', fontSize: 11 }}>[WRIST_CAM_R] 右手相机流就绪</span>
              <div style={{ position: 'absolute', bottom: 8, right: 8, color: '#52c41a', fontSize: 9 }}>30fps | 640x360</div>
            </div>
            <div style={{ width: '92%', border: '1px solid #d9d9d9', borderRadius: 4, background: '#000', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <span style={{ color: '#fff', fontSize: 11 }}>[HEAD_LEFT_EYE] 头部左目相机流就绪</span>
              <div style={{ position: 'absolute', bottom: 8, right: 8, color: '#52c41a', fontSize: 9 }}>30fps | 640x480</div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <Title level={5}>| 多目传感器帧率状态</Title>
          </div>
        </div>
      </Col>
      <Col span={10}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Title level={5}>| 基本信息</Title>
            <div style={{ padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">摄像头数量</Text>
                <Text strong>3路 RGB + 1路 激光点云 (背包内置)</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text type="secondary">时钟对齐同步度</Text>
                <Tag color="success">时滞差异 &lt; 2ms</Tag>
              </div>
            </div>
          </div>
          <div>
            <Title level={5}>| 状态列表</Title>
            <List
              size="small"
              dataSource={[
                { name: '左手腕部相机 (WRIST_CAM_L)', status: '已开启 (30fps)' },
                { name: '右手腕部相机 (WRIST_CAM_R)', status: '已开启 (30fps)' },
                { name: '头部目视相机 (HEAD_LEFT_EYE)', status: '已开启 (30fps)' },
                { name: '背包红外激光雷达 (LIDAR)', status: '就绪 (15fps)' },
              ]}
              renderItem={item => (
                <List.Item style={{ padding: '8px 12px' }}>
                  <Space>
                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                    <span>{item.name}</span>
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
            <Button size="small" onClick={() => setIsErrorMode(!isErrorMode)} style={{ fontSize: 11 }}>
              {isErrorMode ? '模拟恢复正常' : '模拟硬件故障'}
            </Button>
            <Button icon={<HistoryOutlined />} onClick={() => router.push(`/collection/collect/connection/${taskId}`)}>重连设备</Button>
            <Button 
              type="primary" 
              size="large" 
              disabled={isErrorMode}
              icon={<PlayCircleOutlined />} 
              onClick={() => window.open(`/collection/collect/workspace/${taskId}`, '_blank')}
            >
              {isErrorMode ? '请先排除异常' : '确认并进入工作台'}
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
                label: <Space><ThunderboltOutlined />数采背包主机</Space>,
                children: <div style={{ padding: 24 }}>{renderBackpackHost()}</div>,
              },
              {
                key: '2',
                label: <Space>
                  <RobotOutlined style={{ color: isErrorMode ? '#ff4d4f' : 'inherit' }} />
                  <span style={{ color: isErrorMode ? '#ff4d4f' : 'inherit' }}>双臂夹爪控制器</span>
                  {isErrorMode && <Badge dot color="#ff4d4f" />}
                </Space>,
                children: <div style={{ padding: 24 }}>{renderGrippers()}</div>,
              },
              {
                key: '3',
                label: <Space><VideoCameraOutlined />多目相机传感器</Space>,
                children: <div style={{ padding: 24 }}>{renderCameras()}</div>,
              },
            ]}
          />
        </Card>

        {/* Floating Log Viewer */}
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
            style={{ borderRadius: 8, borderColor: isErrorMode ? '#ffa39e' : '#d9d9d9', transition: 'all 0.3s' }}
            extra={<Button type="link" size="small">清空</Button>}
          >
            <div style={{ height: 180, overflowY: 'auto', fontSize: 12 }}>
              {(isErrorMode ? statusLogs : healthyLogs).map((log, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>[{log.time}]</Text>{' '}
                  <Text type={log.type === 'error' ? 'danger' : log.type === 'success' ? 'success' : 'default'}>{log.msg}</Text>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8, fontSize: 11 }}>
              <Text type="secondary">当前硬件配置: <Text strong>Lumos FastUMI Go 离线版</Text></Text>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
