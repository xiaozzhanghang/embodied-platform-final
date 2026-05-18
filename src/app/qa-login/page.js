'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, ArrowLeftOutlined, CheckCircleFilled, LineChartOutlined, ScanOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function QALoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onFinish = (values) => {
    setLoading(true);
    localStorage.setItem('userRole', 'QA');
    setTimeout(() => {
      message.success('质检员身份确认，进入审计空间...');
      setTimeout(() => {
        router.push('/annotation/review-list'); 
      }, 600);
    }, 1200);
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#722ed1',
          borderRadius: 12,
        },
      }}
    >
      <div className="collector-login-root">
        <style jsx global>{`
          @keyframes pulse-purple {
            0% { box-shadow: 0 0 0 0 rgba(114, 46, 209, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(114, 46, 209, 0); }
            100% { box-shadow: 0 0 0 0 rgba(114, 46, 209, 0); }
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
            background: url('/assets/login_bg_qa.png') center/cover no-repeat;
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
                background: 'linear-gradient(135deg, #722ed1, #531dab)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(114, 46, 209, 0.3)',
                animation: 'pulse-purple 2s infinite',
              }}>
                <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 26 }} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>具身智能质检端</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>Quality Assurance V1.2</div>
              </div>
            </div>
        </div>

        {/* Back link - Absolute positioned */}
        <div style={{ position: 'absolute', top: 60, right: 60, zIndex: 10 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/')}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}
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
              精准审计<br />
              <span style={{ color: '#722ed1' }}>定义高质量数据标准</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17, lineHeight: 1.7 }}>
              面向质检专家设计的专业审计空间。通过多维复核、关键帧校验与自动异常识别，确保输出的每一条数据都符合具身大模型训练要求。
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, animation: 'fadeIn 1.2s ease' }}>
            {[
              { label: '待审核项', value: '1,429', color: '#722ed1' },
              { label: '平均精细度', value: '99.2%', color: '#10b981' },
              { label: '审计效率', value: 'High', color: '#3b82f6' }
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
                background: 'rgba(114, 46, 209, 0.1)', 
                margin: '0 auto 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(114, 46, 209, 0.2)'
              }}>
                <ScanOutlined style={{ fontSize: 28, color: '#722ed1' }} />
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>质检端登录</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>请使用您的质检员 ID 登录工作区</p>
            </div>

            <Form onFinish={onFinish} size="large" layout="vertical">
              <Form.Item name="username" rules={[{ required: true, message: '请输入质检员 ID' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                  placeholder="质检员 ID / 用户名"
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
                <Button type="link" style={{ padding: 0, fontSize: 13, color: '#722ed1' }}>遇到问题?</Button>
              </div>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 56, fontSize: 16, fontWeight: 700, borderRadius: 12, border: 'none', background: 'linear-gradient(90deg, #722ed1, #531dab)', boxShadow: '0 10px 20px -5px rgba(114,46,209,0.4)' }}>
                  进入质检审计空间
                </Button>
              </Form.Item>
            </Form>

            <div style={{ marginTop: 40, padding: '16px', borderRadius: 12, background: 'rgba(114, 46, 209, 0.05)', border: '1px solid rgba(114, 46, 209, 0.1)', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
                审计会话已安全加密接入
              </p>
            </div>
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
