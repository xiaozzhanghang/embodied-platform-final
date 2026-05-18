'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, ApiOutlined, HddOutlined, DashboardOutlined, CheckCircleFilled, WarningFilled, ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import heroImg from '../../assets/collector_login_hero.png';

export default function CollectorLoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = (values) => {
    setLoading(true);
    localStorage.setItem('userRole', 'COLLECTOR');
    setTimeout(() => {
      message.success('采集员身份确认，接入边缘工作站...');
      setTimeout(() => {
        router.push('/collection/collect');
      }, 600);
    }, 1200);
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 12,
        },
      }}
    >
      <div className="collector-login-root" style={{
        backgroundColor: '#020817', // Fallback
        backgroundImage: `url(${heroImg.src || heroImg})`,
        backgroundSize: 'contain', 
        backgroundPosition: 'left center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}>
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-9px); }
            100% { transform: translateY(0px); }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(22, 119, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .collector-login-root {
            min-height: 100vh;
            display: flex;
            color: #f8fafc;
            overflow: hidden;
            font-family: 'Inter', -apple-system, sans-serif;
          }
          .glass-panel {
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .status-item {
            transition: all 0.3s ease;
            animation: fadeIn 0.8s ease backwards;
          }
          .status-item:hover {
            background: rgba(255, 255, 255, 0.08) !important;
            border-color: rgba(22, 119, 255, 0.3) !important;
            transform: scale(1.02);
          }
          .hero-gradient-overlay {
            background: linear-gradient(to right, rgba(2, 8, 23, 0.9) 0%, rgba(2, 8, 23, 0.4) 50%, rgba(2, 8, 23, 0.8) 100%);
          }
        `}</style>

        <div className="hero-gradient-overlay" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* Header Logo */}
        <div style={{ position: 'absolute', top: 60, left: 60, zIndex: 10, animation: 'slideIn 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(22,119,255,0.3)',
                animation: 'pulse 2s infinite',
              }}>
                <ThunderboltOutlined style={{ color: '#fff', fontSize: 26 }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: 0.5, marginBottom: 2 }}>具身智能终端</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>Edge Workstation V1.0</div>
              </div>
            </div>
        </div>
      
        <div style={{ position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          © 2026 天奇股份 · 具身智能事业部
        </div>   

        {/* Back link - Absolute positioned */}
        <div style={{ position: 'absolute', top: 60, right: 60, zIndex: 10 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}
            className="hover:text-blue-400"
          >
            返回系统主页
          </Button>
        </div>

        {/* Main Content Row aligned at bottom */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 60px',
          flex: 1,
        }}>
          {/* Grid lines decoration for the content area */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: -1,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 1300,
            gap: 60,
          }}>
            {/* Left Content (Title & Stats) */}
            <div style={{ flex: 1, paddingBottom: 10 }}>
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 500, animation: 'slideIn 1s ease' }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '6px 12px', 
              background: 'rgba(22, 119, 255, 0.1)', 
              borderRadius: 6, 
              border: '1px solid rgba(22, 119, 255, 0.2)',
              color: '#3b82f6',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 20
            }}>
              Collector Mode
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 24 }}>
              高效采集<br />
              <span style={{ 
                background: 'linear-gradient(90deg, #1677ff, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>加速智能演进</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7, fontWeight: 400 }}>
              面向现场作业人员优化的专用采集系统。本地化存储、硬件加速解码、秒级低延迟反馈，确保每一条轨迹数据的精准无误。
            </p>
          </div>

          {/* Bottom hardware status */}
          <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, animation: 'fadeIn 1.2s ease' }}>
            {[
              { icon: <ApiOutlined />, label: '机器人通讯', value: '1ms', color: '#10b981', status: 'Online' },
              { icon: <HddOutlined />, label: '本地缓存', value: '128GB', color: '#f59e0b', status: '88% Free' },
              { icon: <DashboardOutlined />, label: '系统负载', value: 'Balanced', color: '#3b82f6', status: 'CPU 24%' }
            ].map((item, idx) => (
              <div key={idx} className="status-item glass-panel" style={{ 
                padding: '16px', 
                borderRadius: 12, 
                background: 'rgba(15, 23, 42, 0.4)',
                animationDelay: `${0.2 * idx}s`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: item.color, fontSize: 18 }}>{item.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{item.value}</span>
                  <span style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
            </div>

            {/* Right Panel (Form Card) */}
            <div style={{ width: 480, flexShrink: 0 }}>

          <div style={{ 
            width: '100%', 
            maxWidth: 480, 
            background: 'rgba(2, 8, 23, 0.65)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '50px 40px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 1s ease' 
          }}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, 
                background: 'rgba(22, 119, 255, 0.1)', 
                margin: '0 auto 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(22, 119, 255, 0.2)'
              }}>
                <UserOutlined style={{ fontSize: 28, color: '#1677ff' }} />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>采集员登录</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>请输入您的采集站账号以开始作业</p>
            </div>

            <Form
              name="collector_login_final"
              onFinish={onFinish}
              size="large"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                name="username"
                label={<span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>采集端账号</span>}
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  placeholder="采集员 ID / 用户名"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    height: 52,
                    color: '#fff',
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>访问密码</span>}
                rules={[{ required: true, message: '请输入密码' }]}
                style={{ marginBottom: 16 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  placeholder="请输入访问密码"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    height: 52,
                    color: '#fff',
                  }}
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Checkbox style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>保持登录状态</Checkbox>
                <Button type="link" style={{ padding: 0, height: 'auto', fontSize: 13, color: '#1677ff' }}>忘记密码?</Button>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    height: 56,
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #1677ff, #2563eb)',
                    border: 'none',
                    borderRadius: 12,
                    boxShadow: '0 10px 20px -5px rgba(22, 119, 255, 0.4)',
                  }}
                >
                  确认接入工作站
                </Button>
              </Form.Item>
            </Form>

            <div style={{ 
              marginTop: 40, 
              padding: '16px', 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.05), rgba(22, 119, 255, 0.01))',
              border: '1px solid rgba(22, 119, 255, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
                已通过设备安全校验，本次登录环境安全有效
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer Copyright */}
    <div style={{ position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
      © 2025 天奇股份 · 具身智能事业部
    </div>
  </div>
    </ConfigProvider>
  );
}


