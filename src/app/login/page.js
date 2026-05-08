'use client';

import React from 'react';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined, RobotOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { message } = App.useApp();
  const router = useRouter();

  const onFinish = () => {
    message.success('登录成功');
    setTimeout(() => {
      router.push('/collection/tasks');
    }, 500);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <RobotOutlined />
          </div>
          <h1>具身智能数据平台</h1>
          <p>Embodied Intelligence Data Platform</p>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              placeholder="请输入账号"
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              placeholder="请输入密码"
            />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox>记住密码</Checkbox>
              <a style={{ color: '#1677ff' }}>忘记密码？</a>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{
              height: 44,
              fontSize: 16,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1677ff, #0958d9)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(22, 119, 255, 0.4)',
            }}>
              登 录
            </Button>
          </Form.Item>
        </Form>

      </div>
    </div>
  );
}
