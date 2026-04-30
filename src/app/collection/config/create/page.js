'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Input, Form, Select, Row, Col, App } from 'antd';
import { ArrowLeftOutlined, CheckSquareOutlined, TagOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

export default function CreateLabelPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const handleSave = () => {
    message.success('标签创建成功！');
    setTimeout(() => router.push('/collection/config'), 500);
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}><TagOutlined style={{ marginRight: 8, color: '#1677ff' }}/>新增业务标签</Title>
        </div>
        <Space>
            <Button onClick={() => router.back()}>取消</Button>
            <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleSave}>保存标签</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical">
          <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item label="所属分类" required name="category">
                          <Select placeholder="选择分类" options={[
                              { value: 'project', label: '项目 (Project)' },
                              { value: 'purpose', label: '任务用途 (Purpose)' },
                              { value: 'scene', label: '场景分类 (Scene)' },
                              { value: 'mode', label: '采集模式 (Mode)' }
                          ]} />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item label="标签名称" required name="name">
                          <Input placeholder="例如：医疗协作训练" />
                      </Form.Item>
                  </Col>
              </Row>
              <Form.Item label="标签唯一编码" name="code">
                  <Input placeholder="例如：TAG_MED_01" />
              </Form.Item>
              <Form.Item label="标签描述" name="desc">
                  <Input.TextArea rows={4} placeholder="描述该标签的具体用途..." />
              </Form.Item>
          </Card>
      </Form>
    </MainLayout>
  );
}
