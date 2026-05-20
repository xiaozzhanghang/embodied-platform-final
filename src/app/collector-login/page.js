'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, ConfigProvider, theme } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  ThunderboltOutlined, 
  ApiOutlined, 
  HddOutlined, 
  GlobalOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import collectorHero from '../../assets/collector_login_hero.png';

export default function CollectorLoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ping, setPing] = useState('1ms');

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPing(`${Math.floor(Math.random() * 2) + 1}ms`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const onFinish = (values) => {
    setLoading(true);
    localStorage.setItem('userRole', 'COLLECTOR');
    setTimeout(() => {
      message.success('采集站会话凭证下发成功，正在启动底层驱动并进入工作台...');
      setTimeout(() => {
        router.push('/collection/collect');
      }, 800);
    }, 1200);
  };

  const bgImgUrl = collectorHero.src || collectorHero;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#faad14',
          borderRadius: 8,
          colorBgContainer: 'rgba(11, 16, 31, 0.75)',
          colorBorder: 'rgba(255,255,255,0.06)'
        },
      }}
    >
      <div className="login-root-container" style={{
        backgroundImage: `radial-gradient(circle at center, rgba(4, 7, 17, 0.8) 0%, rgba(4, 7, 17, 0.95) 100%), url(${bgImgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Global Styles */}
        <style jsx global>{`
          @keyframes glowDrift {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-3%, 3%) scale(1.08); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes borderPulse {
            0% { border-color: rgba(250, 173, 20, 0.2); }
            50% { border-color: rgba(250, 173, 20, 0.5); }
            100% { border-color: rgba(250, 173, 20, 0.2); }
          }
          .login-root-container {
            min-height: 100vh;
            color: #f8fafc;
            font-family: 'Inter', -apple-system, sans-serif;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .cyber-grid {
            position: absolute;
            inset: 0;
            background-image: 
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
            background-size: 60px 60px;
            background-position: center;
            z-index: 2;
            pointer-events: none;
          }
          .tech-login-panel {
            background: rgba(8, 12, 20, 0.65);
            border: 1px solid rgba(250, 173, 20, 0.25);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.7);
            z-index: 10;
            position: relative;
            animation: borderPulse 5s infinite ease-in-out;
          }
          .tech-input .ant-input-affix-wrapper {
            background: rgba(255, 255, 255, 0.02) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            transition: all 0.3s ease;
          }
          .tech-input .ant-input-affix-wrapper-focused,
          .tech-input .ant-input-affix-wrapper:focus,
          .tech-input .ant-input-affix-wrapper:hover {
            border-color: #faad14 !important;
            box-shadow: 0 0 12px rgba(250, 173, 20, 0.25) !important;
          }
          .tech-input input {
            color: #fff !important;
          }
          .custom-button {
            height: 52px;
            font-size: 15px;
            font-weight: 700;
            border: none;
            background: linear-gradient(135deg, #faad14, #d89614);
            color: #040711;
            box-shadow: 0 8px 24px rgba(250, 173, 20, 0.25);
            transition: all 0.3s ease;
          }
          .custom-button:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 12px 30px rgba(250, 173, 20, 0.4);
          }
          .metric-badge {
            background: rgba(8, 12, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 14px 20px;
            backdrop-filter: blur(10px);
          }
        `}</style>

        <div className="cyber-grid" />

        {/* Branding header */}
        <div style={{ position: 'absolute', top: 40, left: 40, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: 'linear-gradient(135deg, #faad14, #d89614)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(250, 173, 20, 0.3)'
          }}>
            <ThunderboltOutlined style={{ color: '#040711', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, color: '#fff' }}>SKYNET EDGE</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: 1.5 }}>天奇具身智能边缘采集站</div>
          </div>
        </div>

        {/* Main Content split */}
        <div style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 40px',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 80,
          alignItems: 'center'
        }}>
          
          {/* Left Panel: Metrics and Title */}
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid rgba(250, 173, 20, 0.3)',
              background: 'rgba(250, 173, 20, 0.08)',
              color: '#faad14',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 24,
              textTransform: 'uppercase'
            }}>
              EDGE WORKSTATION / 边缘采集端
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#fff',
              marginBottom: 16,
              letterSpacing: '-0.5px'
            }}>
              高精度数据采集与<br />
              <span style={{ color: '#faad14' }}>现场传感器融合</span>
            </h1>

            <p style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.55)',
              lineHeight: 1.6,
              marginBottom: 48,
              maxWidth: 500
            }}>
              面向现场作业专家优化的微秒级采集工作站。支持多相机流式对齐、机械臂示教轨迹以及传感器数据硬件加速写入。
            </p>

            {/* Diagnostics checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: '机器人连接', value: 'FRANKA FR3', icon: <ApiOutlined style={{ color: '#faad14' }} /> },
                { label: '边缘缓存空间', value: '105GB FREE', icon: <HddOutlined style={{ color: '#52c41a' }} /> },
                { label: '内网实时延迟', value: ping, icon: <GlobalOutlined style={{ color: '#1677ff' }} /> }
              ].map((item, idx) => (
                <div className="metric-badge" key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Clean login card */}
          <div className="tech-login-panel" style={{ padding: '54px 44px' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: 6 }}>现场采集员登录</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                请输入您的指派采集工程师 ID 以同步本日任务队列
              </p>
            </div>

            <Form 
              onFinish={onFinish} 
              size="large" 
              layout="vertical"
              className="tech-input"
            >
              <Form.Item name="username" rules={[{ required: true, message: '请输入采集员账号' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  placeholder="请输入您的采集站账号"
                />
              </Form.Item>
              
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 16 }}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  placeholder="请输入访问防误触密码"
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Checkbox style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>保持此设备登录</Checkbox>
                <Button type="link" style={{ padding: 0, fontSize: 12, color: '#faad14' }}>
                  设备故障报备?
                </Button>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  loading={loading}
                  className="custom-button"
                >
                  解锁并登入物理工作站
                </Button>
              </Form.Item>
            </Form>

            <div style={{
              marginTop: 24,
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 13 }} />
              <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.35)' }}>
                RT-Kernel 与物理紧急停机控制器链路已成功载入
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(255, 255, 255, 0.2)',
          fontSize: 11,
          zIndex: 5
        }}>
          <div>© 2026 天奇股份 · 具身智能事业部</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <span>设备编码: MAC-FR3-WORKSTATION-001</span>
            <span>系统版本: v1.2.0</span>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
