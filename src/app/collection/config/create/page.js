'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Form, Select, Row, Col, App } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

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
      <div className="ui-page">
        <PageHeader
          title="新增业务标签"
          description="将新标签归入现有业务分类，用于采集任务与数据检索。"
          breadcrumbs={[{ title: '首页' }, { title: '基础数据' }, { title: '任务标签' }, { title: '新增' }]}
          back={() => router.back()}
        />

        <Form form={form} layout="vertical">
          <FormSection title="标签信息" description="配置所属分类、唯一编码与业务说明。">
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
          </FormSection>
        </Form>

        <ActionFooter>
          <Button onClick={() => router.back()}>取消</Button>
          <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleSave}>保存标签</Button>
        </ActionFooter>
      </div>
    </MainLayout>
  );
}
