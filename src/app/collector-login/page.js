'use client';

import React, { useEffect, useState } from 'react';
import { App, Button, Checkbox, ConfigProvider, Form, Input, Tag, theme } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
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
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3157f6',
          borderRadius: 8,
          fontFamily:
            '"Avenir Next", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif',
        },
      }}
    >
      <main className="collector-login-page">
        <style jsx global>{`
          .collector-login-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            position: relative;
            overflow: hidden;
            padding: 36px 24px;
            background:
              radial-gradient(circle at 16% 8%, rgba(105, 171, 255, 0.34), transparent 30%),
              radial-gradient(circle at 86% 38%, rgba(107, 118, 255, 0.2), transparent 32%),
              radial-gradient(circle at 48% 98%, rgba(38, 216, 220, 0.34), transparent 36%),
              #f4f9ff;
          }

          .collector-login-stage {
            width: min(1180px, 100%);
            min-height: 660px;
            position: relative;
            border-radius: 34px;
            overflow: hidden;
            background-image:
              linear-gradient(90deg, rgba(15, 54, 106, 0.34) 0%, rgba(20, 76, 141, 0.14) 43%, rgba(255, 255, 255, 0.78) 78%, rgba(255, 255, 255, 0.9) 100%),
              url(${heroUrl});
            background-size: cover;
            background-position: center;
            box-shadow: 0 32px 88px rgba(63, 97, 139, 0.22);
          }

          .collector-login-stage::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 34%),
              radial-gradient(circle at 42% 34%, rgba(107, 188, 255, 0.26), transparent 28%);
            pointer-events: none;
          }

          .collector-brand {
            position: absolute;
            z-index: 1;
            top: 44px;
            left: 52px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
          }

          .collector-brand img {
            width: 46px;
            height: 46px;
            object-fit: contain;
          }

          .collector-brand strong,
          .collector-brand span {
            display: block;
          }

          .collector-brand strong {
            font-size: 22px;
            line-height: 1;
            letter-spacing: 0;
            text-shadow: 0 8px 20px rgba(3, 28, 62, 0.32);
          }

          .collector-brand span {
            margin-top: 4px;
            font-size: 10px;
            letter-spacing: 1.8px;
            opacity: 0.86;
          }

          .collector-hero-copy {
            position: absolute;
            z-index: 1;
            left: 52px;
            bottom: 72px;
            max-width: 430px;
            color: #fff;
          }

          .collector-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 18px;
            padding: 8px 15px;
            border-radius: 22px;
            background: rgba(57, 132, 226, 0.58);
            color: #ddf3ff;
            font-size: 14px;
            backdrop-filter: blur(12px);
          }

          .collector-pill i {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #bff6ff;
            box-shadow: 0 0 12px #bff6ff;
          }

          .collector-hero-copy h1 {
            margin: 0;
            font-size: 42px;
            line-height: 1.18;
            font-weight: 850;
            letter-spacing: 0;
            text-shadow: 0 12px 28px rgba(0, 35, 78, 0.38);
          }

          .collector-hero-copy h1 span {
            display: block;
            color: #7bd9ff;
          }

          .collector-hero-copy p {
            margin: 22px 0 0;
            max-width: 390px;
            color: rgba(255, 255, 255, 0.88);
            font-size: 15px;
            line-height: 1.85;
          }

          .collector-login-card {
            position: absolute;
            z-index: 2;
            top: 50%;
            right: 58px;
            width: 420px;
            transform: translateY(-50%);
            padding: 46px 42px 34px;
            border: 1px solid rgba(255, 255, 255, 0.86);
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.86);
            box-shadow: 0 26px 70px rgba(35, 76, 132, 0.2);
            backdrop-filter: blur(22px);
          }

          .collector-login-head {
            margin-bottom: 34px;
          }

          .collector-login-head h2 {
            margin: 0 0 10px;
            color: #08162d;
            font-size: 32px;
            line-height: 1.15;
            font-weight: 850;
            letter-spacing: 0;
          }

          .collector-login-head p {
            margin: 0;
            color: #66768b;
            font-size: 15px;
          }

          .collector-login-form .ant-input-affix-wrapper {
            height: 58px;
            padding: 0 18px;
            border-radius: 13px;
            border-color: #d9e3ef;
            background: #f8fbff;
            box-shadow: none;
          }

          .collector-login-form .ant-input-affix-wrapper:hover,
          .collector-login-form .ant-input-affix-wrapper-focused {
            border-color: #3157f6 !important;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(49, 87, 246, 0.08) !important;
          }

          .collector-login-form input {
            color: #1c2a3d !important;
            font-size: 16px;
          }

          .collector-login-form input::placeholder {
            color: #9aa9bc !important;
          }

          .collector-login-tools {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 4px 0 28px;
          }

          .collector-login-tools .ant-checkbox-wrapper {
            color: #536579;
            font-size: 14px;
          }

          .collector-submit {
            height: 62px;
            border: 0;
            border-radius: 13px;
            background: linear-gradient(90deg, #2f68ff, #5739e6);
            color: #fff;
            font-size: 17px;
            font-weight: 800;
            letter-spacing: 1px;
            box-shadow: 0 18px 36px rgba(57, 86, 236, 0.28);
          }

          .collector-submit:hover {
            color: #fff !important;
            background: linear-gradient(90deg, #245cf3, #4a2dd4) !important;
            transform: translateY(-1px);
          }

          .collector-stats {
            margin-top: 26px;
            display: grid;
            gap: 10px;
          }

          .collector-stat {
            display: grid;
            grid-template-columns: 34px 1fr auto;
            align-items: center;
            gap: 10px;
            min-height: 48px;
            padding: 8px 10px;
            border: 1px solid #e4ebf3;
            border-radius: 8px;
            background: rgba(248, 251, 255, 0.88);
          }

          .collector-stat-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 8px;
            color: #3157f6;
            background: #eaf1ff;
          }

          .collector-stat span {
            color: #6b7c91;
            font-size: 12px;
          }

          .collector-stat strong {
            color: #17253a;
            font-size: 13px;
          }

          .collector-footer-note {
            position: absolute;
            z-index: 2;
            right: 58px;
            bottom: 26px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #63748a;
            font-size: 12px;
          }

          .collector-footer-note svg {
            color: #3157f6;
          }

          @media (max-width: 980px) {
            .collector-login-stage {
              min-height: auto;
              padding: 34px;
              display: grid;
              gap: 28px;
            }

            .collector-brand,
            .collector-hero-copy,
            .collector-login-card,
            .collector-footer-note {
              position: relative;
              inset: auto;
              transform: none;
            }

            .collector-login-card {
              width: 100%;
              max-width: 460px;
              justify-self: end;
            }

            .collector-footer-note {
              justify-self: end;
            }
          }

          @media (max-width: 640px) {
            .collector-login-page {
              padding: 16px;
            }

            .collector-login-stage {
              border-radius: 22px;
              padding: 24px;
            }

            .collector-login-card {
              padding: 32px 22px 24px;
              border-radius: 18px;
            }

            .collector-hero-copy h1 {
              font-size: 30px;
            }

            .collector-login-head h2 {
              font-size: 27px;
            }
          }
        `}</style>

        <section className="collector-login-stage">
          <div className="collector-brand">
            <img src={logoUrl} alt="天奇股份" />
            <div>
              <strong>天奇股份</strong>
              <span>MIRACLE AUTOMATION</span>
            </div>
          </div>

          <div className="collector-hero-copy">
            <div className="collector-pill">
              <i />
              数据采集站管理系统
            </div>
            <h1>
              开启机器人
              <span>现场采集任务</span>
            </h1>
            <p>登录后接收任务、连接设备、执行采集，并将本地数据包上传入库。</p>
          </div>

          <div className="collector-login-card">
            <div className="collector-login-head">
              <h2>欢迎登录</h2>
              <p>请输入您的采集员账号与密码</p>
            </div>

            <Form onFinish={onFinish} size="large" className="collector-login-form">
              <Form.Item name="username" rules={[{ required: true, message: '请输入采集员账号' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: '#9aa9bc', fontSize: 18 }} />}
                  placeholder="请输入账号"
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9aa9bc', fontSize: 18 }} />}
                  placeholder="请输入密码"
                />
              </Form.Item>

              <div className="collector-login-tools">
                <Checkbox>记住密码</Checkbox>
                <Tag color="processing" variant="filled">
                  WORKSTATION
                </Tag>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="collector-submit"
              >
                登 录 <ArrowRightOutlined />
              </Button>
            </Form>

            <div className="collector-stats">
              {stationStats.map((item) => (
                <div className="collector-stat" key={item.label}>
                  <div className="collector-stat-icon">{item.icon}</div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="collector-footer-note">
            <SafetyCertificateOutlined />
            <span>本机采集站登录后自动同步可执行任务列表</span>
          </div>
        </section>
      </main>
    </ConfigProvider>
  );
}
