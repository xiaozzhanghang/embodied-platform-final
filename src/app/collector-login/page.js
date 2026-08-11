'use client';

import { useEffect, useState } from 'react';
import { App, Button, Checkbox, Form, Input, Tag } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  CloudSyncOutlined,
  HddOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import collectorHero from '../../assets/collector_login_hero_16_9.png';
import logoImg from '../../assets/tq_logo.svg';

const stationStats = [
  { label: '设备链路', value: '已连接', icon: <ApiOutlined /> },
  { label: '任务同步', value: '登录后同步', icon: <CloudSyncOutlined /> },
  { label: '本地缓存', value: '105GB', icon: <HddOutlined /> },
];

export default function CollectorLoginPage() {
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
    localStorage.setItem('userRole', 'COLLECTOR');
    setTimeout(() => {
      message.success('采集员身份验证通过，正在同步采集任务...');
      setTimeout(() => {
        router.push('/collection/collect');
      }, 700);
    }, 900);
  };

  const heroUrl = collectorHero.src || collectorHero;
  const logoUrl = logoImg.src || logoImg;

  return (
    <main className="ui-login" style={{ '--ui-login-hero': `url(${heroUrl})` }}>
      <section className="ui-login__shell" aria-label="数据采集站系统登录">
        <aside className="ui-login__hero">
          <div className="ui-login__brand">
            <span className="ui-login__brand-logo"><img src={logoUrl} alt="天奇股份" /></span>
            <span>
              <strong>天奇股份</strong>
              <small>MIRACLE AUTOMATION</small>
            </span>
          </div>

          <div className="ui-login__hero-content">
            <span className="ui-login__eyebrow"><ApiOutlined /> 数据采集站管理系统</span>
            <h1>开启机器人<span>现场采集任务</span></h1>
            <p>登录后接收任务、连接设备、执行采集，并将本地数据包上传入库。</p>
            <div className="ui-login__metrics">
              {stationStats.map((item) => (
                <div className="ui-login__metric" key={item.label}>
                  <span>{item.icon}{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <footer className="ui-login__hero-footer">
            <span>© 2026 天奇股份 · 具身智能事业部</span>
            <span>本机采集站 · 任务状态实时同步</span>
          </footer>
        </aside>

        <section className="ui-login__form-side">
          <div className="ui-login__card">
            <div className="ui-login__form-heading">
              <span className="ui-login__portal-icon"><ApiOutlined /></span>
              <div>
                <h2>欢迎登录</h2>
                <p>请输入您的采集员账号与密码</p>
              </div>
            </div>

            <Form onFinish={onFinish} layout="vertical" className="ui-login__form" size="large">
              <Form.Item label="采集员账号" name="username" rules={[{ required: true, message: '请输入采集员账号' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入账号" autoComplete="username" />
              </Form.Item>
              <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
              </Form.Item>

              <div className="ui-login__tools">
                <Checkbox>记住密码</Checkbox>
                <Tag color="processing" variant="filled">WORKSTATION</Tag>
              </div>

              <Button type="primary" htmlType="submit" block loading={loading} className="ui-login__submit">
                登 录 <ArrowRightOutlined />
              </Button>
            </Form>

            <div className="ui-login__security-note">
              <SafetyCertificateOutlined />
              <span>本机采集站登录后自动同步可执行任务列表</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
