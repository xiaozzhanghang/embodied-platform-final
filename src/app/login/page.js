'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined, ArrowLeftOutlined, ThunderboltOutlined, CheckCircleFilled, AppstoreOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = (values) => {
    setLoading(true);
    localStorage.setItem('userRole', 'ADMIN');
    setTimeout(() => {
      message.success('管理员身份确认，进入控制中心...');
      setTimeout(() => {
        router.push('/dashboard');
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
      <div className="collector-login-root">
        <style jsx global>{`
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
            background: url('/assets/login_bg_admin.png') center/cover no-repeat;
            color: #f8fafc;
            overflow: hidden;
            font-family: 'Inter', -apple-system, sans-serif;
            position: relative;
          }
          .glass-panel {
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
                <RobotOutlined style={{ color: '#fff', fontSize: 26 }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>具身智能管理端</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>Management Console V2.0</div>
              </div>
            </div>
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
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 24 }}>
              全局管控<br />
              <span style={{ color: '#1677ff' }}>洞察数据全生命周期</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7 }}>
              面向平台管理者设计的综合治理系统。从项目初始化、任务分发到数据集发布，通过多维度监控与权限体系，构建稳健的数据生产闭环。
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, animation: 'fadeIn 1.2s ease' }}>
            {[
              { label: '活跃项目', value: '12', color: '#10b981' },
              { label: '节点状态', value: 'Healthy', color: '#3b82f6' },
              { label: '系统负载', value: 'Normal', color: '#f59e0b' }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '16px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.4)' }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{item.value}</div>
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
                <AppstoreOutlined style={{ fontSize: 28, color: '#1677ff' }} />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>管理端登录</h2>
            </div>

            <Form onFinish={onFinish} size="large" layout="vertical">
              <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  placeholder="管理员账号 / 用户名"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, height: 52 }}
                />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  placeholder="请输入访问密码"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, height: 52 }}
                />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Checkbox style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>保持登录状态</Checkbox>
                <Button type="link" style={{ padding: 0, fontSize: 13, color: '#1677ff' }}>忘记密码?</Button>
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 56, fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', boxShadow: '0 10px 20px -5px rgba(22,119,255,0.4)' }}>
                  确认并进入控制台
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>

    <div style={{ position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
      © 2026 天奇股份 · 具身智能事业部
    </div>
  </div>
    </ConfigProvider>
  );
}
