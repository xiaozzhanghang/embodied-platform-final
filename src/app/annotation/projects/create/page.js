'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Input, Select, Form, Row, Col, Steps, Table, App } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

export default function CreateProjectPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [createStep, setCreateStep] = useState(0);

  const handleSave = () => {
    message.success('标注项目创建成功！');
    setTimeout(() => router.push('/annotation/projects'), 500);
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}><ProjectOutlined style={{ marginRight: 8, color: '#1677ff' }}/>新建标注项目</Title>
        </div>
        <Space>
            <Button onClick={() => router.back()}>取消</Button>
            {createStep > 0 && <Button onClick={() => setCreateStep(s => s - 1)}>上一步</Button>}
            {createStep < 2 && <Button type="primary" onClick={() => setCreateStep(s => s + 1)}>下一步</Button>}
            {createStep === 2 && <Button type="primary" onClick={handleSave}>保存并创建</Button>}
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 8, minHeight: 'calc(100vh - 180px)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
              <Steps current={createStep} style={{ marginBottom: 40 }} items={[{ title: '基础信息' }, { title: '题型配置' }, { title: '答题指南' }]} />
              
              {createStep === 0 && (
                  <Form layout="vertical">
                      <Row gutter={24}>
                          <Col span={12}><Form.Item label="项目名称" required><Input placeholder="请输入项目名称" size="large" /></Form.Item></Col>
                          <Col span={12}><Form.Item label="标注场景" required><Select placeholder="请选择" size="large" options={[{ value: '二维框选标注' }, { value: 'VLA标注（音视频分段）' }, { value: '视频质检' }]} /></Form.Item></Col>
                      </Row>
                      <Row gutter={24}>
                          <Col span={12}><Form.Item label="标注类型" required><Select placeholder="请选择" size="large" options={[{ value: '框选标注' }, { value: '分段标注' }, { value: '质检标注' }]} /></Form.Item></Col>
                          <Col span={12}><Form.Item label="项目描述"><Input.TextArea rows={4} placeholder="请输入描述" /></Form.Item></Col>
                      </Row>
                  </Form>
              )}
              
              {createStep === 1 && (
                  <Form layout="vertical">
                      <Form.Item label="选择类型"><Select size="large" defaultValue="框1个" options={[{ value: '框1个' }, { value: '框多个' }]} /></Form.Item>
                      <Row gutter={24}>
                          <Col span={12}><Form.Item label="元素名/元素值"><Input size="large" defaultValue="默认" disabled /></Form.Item></Col>
                          <Col span={12}><Form.Item label="高级元素设置"><Input size="large" defaultValue="默认" disabled /></Form.Item></Col>
                      </Row>
                      <Card size="small" title="属性类型配置" style={{ marginBottom: 16, background: '#fafafa' }}>
                          <Table
                              size="small"
                              pagination={false}
                              dataSource={[
                                  { key: '1', name: '物体类别', type: '多选', values: '方块,圆柱,球体', color: '红/蓝/绿' },
                                  { key: '2', name: '遮挡程度', type: '单选', values: '无遮挡,部分遮挡,完全遮挡', color: '-' },
                              ]}
                              columns={[
                                  { title: '属性名称', dataIndex: 'name' },
                                  { title: '类型', dataIndex: 'type' },
                                  { title: '属性值', dataIndex: 'values' },
                                  { title: '颜色', dataIndex: 'color' },
                              ]}
                          />
                          <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 16 }}>添加属性</Button>
                      </Card>
                  </Form>
              )}
              
              {createStep === 2 && (
                  <Form layout="vertical">
                      <Form.Item label="答题指南内容" required>
                          <Input.TextArea size="large" rows={10} placeholder="请输入答题指南...&#10;&#10;例如：&#10;1. 使用矩形框标注图像中所有目标物体&#10;2. 框选时需要包含物体完整区域&#10;3. 标注完成后选择对应的物体类别" />
                      </Form.Item>
                      <Form.Item label="参考示例图">
                          <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: 40, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
                              <PlusOutlined style={{ fontSize: 32, color: '#bfbfbf' }} /><br />
                              <span style={{ color: '#999', marginTop: 16, display: 'inline-block' }}>点击上传参考图片 (支持 JPG/PNG，不超过 5MB)</span>
                          </div>
                      </Form.Item>
                  </Form>
              )}
          </div>
      </Card>
    </MainLayout>
  );
}
