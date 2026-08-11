'use client';

import { useEffect, useState } from 'react';
import { App, Button, Checkbox, Form, Input } from 'antd';
import {
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  LockOutlined,
  PartitionOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import adminHero from '../../assets/admin_login_hero.png';

const portalStats = [
  { label: '活跃数据集', value: '18 个', icon: <DatabaseOutlined /> },
  { label: '全局节点数', value: '12 ONLINE', icon: <CloudServerOutlined /> },
  { label: '采集任务进度', value: '94.2%', icon: <PartitionOutlined /> },
];

export default function LoginPage() {
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
    localStorage.setItem('userRole', 'ADMIN');
    setTimeout(() => {
      message.success('管理员身份验证通过，正在进入管理控制台...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    }, 1200);
  };

  const heroUrl = adminHero.src || adminHero;

  return (
    <main className="ui-login" style={{ '--ui-login-hero': `url(${heroUrl})` }}>
      <section className="ui-login__shell" aria-label="云端管理系统登录">
        <aside className="ui-login__hero">
          <div className="ui-login__brand">
            <span className="ui-login__brand-icon"><RobotOutlined /></span>
            <span>
              <strong>SKYNET ROBOTICS</strong>
              <small>天奇具身智能数据平台</small>
            </span>
          </div>

          <div className="ui-login__hero-content">
            <span className="ui-login__eyebrow"><DashboardOutlined /> WEB CLOUD / 云端控制台</span>
            <h1>具身大模型数据<span>全局管控中心</span></h1>
            <p>
              面向企业云端管理员、系统审计员设计的综合管理系统。提供数据集统一分发、采集进度看板、多模态清洗规则配置以及集群节点算力调度。
            </p>
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
            <span>安全合规审计: L4级 · v2.4.1</span>
          </footer>
        </aside>

        <section className="ui-login__form-side">
          <div className="ui-login__card">
            <div className="ui-login__form-heading">
              <span className="ui-login__portal-icon"><RobotOutlined /></span>
              <div>
                <h2>云端系统登录</h2>
                <p>请输入平台管理员或审计员账号访问管理控制台</p>
              </div>
            </div>

            <Form onFinish={onFinish} layout="vertical" className="ui-login__form" size="large">
              <Form.Item label="管理员账号" name="username" rules={[{ required: true, message: '请输入管理员账号/邮箱' }]}>
                <Input prefix={<UserOutlined />} placeholder="管理员账号 / 电子邮箱" autoComplete="username" />
              </Form.Item>
              <Form.Item label="登录密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入您的登录密码" autoComplete="current-password" />
              </Form.Item>

              <div className="ui-login__tools">
                <Checkbox>保持云端会话登录</Checkbox>
                <Button type="link">忘记密码？</Button>
              </div>

              <Button type="primary" htmlType="submit" block loading={loading} className="ui-login__submit">
                验证身份并进入控制台
              </Button>
            </Form>

            <div className="ui-login__security-note">
              <SafetyCertificateOutlined />
              <span>当前登录受国家密码算法及双重审计认证保护</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
