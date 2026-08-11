'use client';

import { useEffect, useState } from 'react';
import { App, Button, Checkbox, Form, Input } from 'antd';
import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  VideoCameraAddOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import qaHero from '../../assets/qa_login_hero.png';

const portalStats = [
  { label: '待审计序列', value: '1,429 EP', icon: <DatabaseOutlined /> },
  { label: '真值对齐引擎', value: 'ONLINE', icon: <CloudSyncOutlined /> },
  { label: '渲染加速芯片', value: 'CUDA ON', icon: <VideoCameraAddOutlined /> },
];

export default function QALoginPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const onFinish = () => {
    setLoading(true);
    localStorage.setItem('userRole', 'QA');
    setTimeout(() => {
      message.success('质检会话载入成功，正在拉取待质检数据包并加载多模态播放器...');
      setTimeout(() => {
        router.push('/annotation/review-list');
      }, 800);
    }, 1200);
  };

  const heroUrl = qaHero.src || qaHero;

  return (
    <main className="ui-login" style={{ '--ui-login-hero': `url(${heroUrl})` }}>
      <section className="ui-login__shell" aria-label="数据质检系统登录">
        <aside className="ui-login__hero">
          <div className="ui-login__brand">
            <span className="ui-login__brand-icon"><SafetyCertificateOutlined /></span>
            <span>
              <strong>SKYNET QA</strong>
              <small>天奇具身智能质检系统</small>
            </span>
          </div>

          <div className="ui-login__hero-content">
            <span className="ui-login__eyebrow"><CheckCircleOutlined /> QA STATION / 数据质检端</span>
            <h1>真值精细度对齐与<span>多模态序列审计</span></h1>
            <p>面向数据审核专家的深度分析工作舱。支持轨迹序列三维重建校验、相机多帧对齐标记及异常包快速剔除。</p>
            <div className="ui-login__metrics">
              {portalStats.map((item) => (
                <div className="ui-login__metric" key={item.label}>
                  <span>{item.icon}{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <footer className="ui-login__hero-footer">
            <span>© 2026 天奇股份 · 具身智能事业部</span>
            <span>质检站编码: MAC-QA-STATION-012 · v1.2.0</span>
          </footer>
        </aside>

        <section className="ui-login__form-side">
          <div className="ui-login__card">
            <div className="ui-login__form-heading">
              <span className="ui-login__portal-icon"><SafetyCertificateOutlined /></span>
              <div>
                <h2>数据质检员登录</h2>
                <p>请输入质检专家凭证 ID 进行防污染安全校验</p>
              </div>
            </div>

            <Form onFinish={onFinish} layout="vertical" className="ui-login__form" size="large">
              <Form.Item label="质检员账号" name="username" rules={[{ required: true, message: '请输入质检专家 ID' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入您的质检员 ID / 账号" autoComplete="username" />
              </Form.Item>
              <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
              </Form.Item>

              <div className="ui-login__tools">
                <Checkbox>保持此会话登录</Checkbox>
                <Button type="link">遇到故障？</Button>
              </div>

              <Button type="primary" htmlType="submit" block loading={loading} className="ui-login__submit">
                验证身份并登入质检空间
              </Button>
            </Form>

            <div className="ui-login__security-note">
              <CheckCircleOutlined />
              <span>多模态真值对准引擎已挂载并开始分配处理信道</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
