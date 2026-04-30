'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Input, Form, Select, Upload, App, Row, Col, Modal } from 'antd';
import { ArrowLeftOutlined, CheckSquareOutlined, InboxOutlined, BlockOutlined, PlusOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title } = Typography;

export default function CreateObjectPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isTagModalOpen, setIsTagModalOpen] = React.useState(false);
  const [newTagName, setNewTagName] = React.useState('');

  const handleSave = () => {
    message.success('物体已成功入库！');
    setTimeout(() => router.push('/collection/objects'), 500);
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
            <Title level={4} style={{ margin: 0 }}><BlockOutlined style={{ marginRight: 8, color: '#1677ff' }}/>添加新物体</Title>
        </div>
        <Space>
            <Button onClick={() => router.back()}>取消</Button>
            <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleSave}>入库并保存</Button>
        </Space>
      </div>

      <Form form={form} layout="vertical">
          <Card bordered={false} style={{ marginBottom: 24, borderRadius: 8 }}>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item label="中文名称" required name="nameCn">
                          <Input placeholder="请输入，如：农夫山泉 550ml" />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item label="英文名称" required name="nameEn">
                          <Input placeholder="请输入，如：nongfu_spring_bottle" />
                      </Form.Item>
                  </Col>
              </Row>
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item label="子类路径" required name="category">
                          <Select placeholder="请选择或输入" options={[{value: 'water', label: '瓶装水'}]} />
                      </Form.Item>
                  </Col>
                  <Col span={12}>
                      <Form.Item 
                          label={
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                  <span>材质类型 (影响抓取力控逻辑)</span>
                                  <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setIsTagModalOpen(true)}>快捷新建标签</Button>
                              </div>
                          }
                          required 
                          name="material"
                          tooltip="不同材质对应的刚度系数不同，后台将根据此项调整机器人末端的力闭环参数。"
                      >
                          <Select placeholder="请选择材质" options={[
                              { value: 'Metal', label: '金属 (Metal)' },
                              { value: 'Ceramic', label: '陶瓷 (Ceramic)' },
                              { value: 'Plastic', label: '塑料 (Plastic)' },
                              { value: 'Wood', label: '木质 (Wood)' },
                              { value: 'Smooth', label: '光滑 (Smooth)' },
                          ]} />
                      </Form.Item>
                  </Col>
              </Row>
              <Form.Item label="实物图片上传 (建议 1:1 比例)">
                  <Upload.Dragger multiple={false}>
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">点击或拖拽图片进行上传</p>
                  </Upload.Dragger>
              </Form.Item>
          </Card>
      </Form>

      <Modal 
        title="快捷新建标签字典" 
        open={isTagModalOpen} 
        onOk={() => {
            message.success(`已将“${newTagName}”加入标签字典并自动选中！`);
            form.setFieldsValue({ material: newTagName });
            setIsTagModalOpen(false);
            setNewTagName('');
        }}
        onCancel={() => setIsTagModalOpen(false)}
        okText="保存并使用"
        cancelText="取消"
      >
        <p style={{ color: '#8c8c8c', marginBottom: 16 }}>如果在下拉框中找不到合适的物理属性标签，可在此直接新建，系统将自动同步至【标签管理】模块。</p>
        <Form layout="vertical">
            <Form.Item label="新标签中英文名" required>
                <Input placeholder="例如：光滑 (Smooth)" value={newTagName} onChange={e => setNewTagName(e.target.value)} />
            </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
}
