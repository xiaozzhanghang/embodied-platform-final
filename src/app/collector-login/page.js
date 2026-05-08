'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined, ApiOutlined, HddOutlined, DashboardOutlined, CheckCircleFilled, WarningFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function CollectorLoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    // Save role to localStorage so MainLayout picks it up
    localStorage.setItem('userRole', 'COLLECTOR');
    setTimeout(() => {
      message.success('采集员登录成功，正在进入采集工作台...');
      setTimeout(() => {
        router.push('/collection/collect');
      }, 400);
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#0a1628',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif',
    }}>
      {/* Left Panel — Branding & Hardware Status */}
      <div style={{
        width: '50%',
        background: 'linear-gradient(160deg, #0d1f3c 0%, #0a2a5e 50%, #0d1f3c 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid lines decoration */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(22,119,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(22,119,255,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '30%', left: '40%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,119,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'linear-gradient(135deg, #1677ff, #0958d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(22,119,255,0.5)',
            }}>
              <ApiOutlined style={{ color: '#fff', fontSize: 22 }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>具身智能数据平台</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, letterSpacing: 2 }}>EDGE CLIENT · 采集工作站</div>
            </div>
          </div>
          <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg, #1677ff, transparent)' }} />
        </div>

        {/* Center text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
            数据采集<br />
            <span style={{ color: '#1677ff' }}>边缘工作站</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.8, maxWidth: 340 }}>
            专为一线采集员设计的本地化作业端，登录后直接进入采集工作台，高效完成每日派发的机器人数据录制任务。
          </p>
        </div>

        {/* Hardware Status Panel */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>设备状态</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: <ApiOutlined />, label: '机器人直连', value: '已连接 (1ms)', valueColor: '#52c41a', suffix: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 10 }} /> },
              { icon: <HddOutlined />, label: '本地磁盘', value: '剩余 128GB (12%)', valueColor: '#faad14', suffix: <WarningFilled style={{ color: '#faad14', fontSize: 10 }} /> },
              { icon: <DashboardOutlined />, label: 'CPU / GPU', value: '24%  /  68%', valueColor: '#1677ff' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                padding: '10px 16px', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <span style={{ color: item.valueColor }}>{item.icon}</span>
                  {item.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.valueColor, fontSize: 13, fontWeight: 600 }}>
                  {item.value}
                  {item.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 64px',
        background: '#111c30',
      }}>
        {/* Back button */}
        <div style={{ alignSelf: 'flex-start', marginBottom: 40 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}
          >
            返回系统
          </Button>
        </div>

        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Title */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 28, margin: 0 }}>采集员登录</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 14 }}>
              登录后将直接进入今日采集任务工作台
            </p>
          </div>

          <Form
            name="collector_login"
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              label={<span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>采集员账号</span>}
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="请输入采集员账号"
                autoComplete="off"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#fff',
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>密码</span>}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="请输入密码"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#fff',
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Checkbox style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>记住账号</Checkbox>
                <a style={{ color: '#1677ff', fontSize: 13 }}>忘记密码？</a>
              </div>
            </Form.Item>

            <Form.Item style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 50,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                  border: 'none',
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(22,119,255,0.45)',
                }}
              >
                登录工作站
              </Button>
            </Form.Item>
          </Form>

          {/* Hint */}
          <div style={{
            marginTop: 24, padding: '12px 16px',
            background: 'rgba(22,119,255,0.1)', border: '1px solid rgba(22,119,255,0.25)',
            borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.8,
          }}>
            <CheckCircleFilled style={{ color: '#52c41a', marginRight: 6 }} />
            完整保留平台导航权限，登录后直达<strong style={{ color: 'rgba(255,255,255,0.8)' }}>「采集工作台」</strong>任务列表
          </div>
        </div>
      </div>
    </div>
  );
}
