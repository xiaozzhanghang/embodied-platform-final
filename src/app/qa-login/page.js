'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, App, ConfigProvider, theme } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyCertificateOutlined, 
  DatabaseOutlined,
  CloudSyncOutlined,
  VideoCameraAddOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import qaHero from '../../assets/qa_login_hero.png';

export default function QALoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const onFinish = (values) => {
    setLoading(true);
    localStorage.setItem('userRole', 'QA');
    setTimeout(() => {
      message.success('质检会话载入成功，正在拉取待质检数据包并加载多模态播放器...');
      setTimeout(() => {
        router.push('/annotation/review-list');
      }, 800);
    }, 1200);
  };

  const bgImgUrl = qaHero.src || qaHero;

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#722ed1',
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
            50% { transform: translate(3%, -3%) scale(1.08); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes borderPulse {
            0% { border-color: rgba(114, 46, 209, 0.2); }
            50% { border-color: rgba(114, 46, 209, 0.5); }
            100% { border-color: rgba(114, 46, 209, 0.2); }
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
            border: 1px solid rgba(114, 46, 209, 0.25);
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
            border-color: #722ed1 !important;
            box-shadow: 0 0 12px rgba(114, 46, 209, 0.25) !important;
          }
          .tech-input input {
            color: #fff !important;
          }
          .custom-button {
            height: 52px;
            font-size: 15px;
            font-weight: 700;
            border: none;
            background: linear-gradient(135deg, #722ed1, #531dab);
            color: #fff;
            box-shadow: 0 8px 24px rgba(114, 46, 209, 0.25);
            transition: all 0.3s ease;
          }
          .custom-button:hover {
            opacity: 0.95;
            transform: translateY(-1px);
            box-shadow: 0 12px 30px rgba(114, 46, 209, 0.4);
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
            background: 'linear-gradient(135deg, #722ed1, #531dab)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(114, 46, 209, 0.3)'
          }}>
            <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, color: '#fff' }}>SKYNET QA</div>
            <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: 1.5 }}>天奇具身智能质检系统</div>
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
              border: '1px solid rgba(114, 46, 209, 0.3)',
              background: 'rgba(114, 46, 209, 0.08)',
              color: '#722ed1',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 24,
              textTransform: 'uppercase'
            }}>
              QA STATION / 数据质检端
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#fff',
              marginBottom: 16,
              letterSpacing: '-0.5px'
            }}>
              真值精细度对齐与<br />
              <span style={{ color: '#722ed1' }}>多模态序列审计</span>
            </h1>

            <p style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.55)',
              lineHeight: 1.6,
              marginBottom: 48,
              maxWidth: 500
            }}>
              面向数据审核专家的深度分析工作舱。支持轨迹序列三维重建校验、相机多帧对齐标记及异常包快速剔除。
            </p>

            {/* QA Diagnostics Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: '待审计序列', value: '1,429 EP', icon: <DatabaseOutlined style={{ color: '#722ed1' }} /> },
                { label: '真值对齐引擎', value: 'ONLINE', icon: <CloudSyncOutlined style={{ color: '#52c41a' }} /> },
                { label: '渲染加速芯片', value: 'CUDA ON', icon: <VideoCameraAddOutlined style={{ color: '#1677ff' }} /> }
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
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: 6 }}>数据质检员登录</h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                请输入您的质检专家凭证 ID 进行防污染安全校验
              </p>
            </div>

            <Form 
              onFinish={onFinish} 
              size="large" 
              layout="vertical"
              className="tech-input"
            >
              <Form.Item name="username" rules={[{ required: true, message: '请输入质检专家 ID' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  placeholder="请输入您的质检员 ID / 账号"
                />
              </Form.Item>
              
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 16 }}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  placeholder="请输入密码"
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Checkbox style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>保持此会话登录</Checkbox>
                <Button type="link" style={{ padding: 0, fontSize: 12, color: '#722ed1' }}>
                  遇到故障?
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
                  验证身份并登入质检空间
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
                多模态真值对准引擎已挂载并开始分配处理信道
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
            <span>质检站编码: MAC-QA-STATION-012</span>
            <span>系统版本: v1.2.0</span>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
