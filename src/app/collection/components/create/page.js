'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Input, Select, Form, Row, Col, App, Alert } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text } = Typography;

export default function CreateComponentPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const handleSave = () => {
    form.validateFields().then(values => {
      console.log('Component Data:', values);
      message.success('部件与 Topic 映射关系已保存并生效');
      setTimeout(() => router.push('/collection/components'), 800);
    }).catch(err => {
      console.log('Validation failed:', err);
    });
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="接入新机器人部件"
          description="完成部件基础信息与 ROS Topic 数据通道映射。"
          breadcrumbs={[{ title: '首页' }, { title: '部件管理' }, { title: '接入新部件' }]}
          back={() => router.back()}
        />

        <Row gutter={24}>
          <Col span={16}>
            <Form form={form} layout="vertical" initialValues={{ topics: [{ name: '', path: '', res: '' }] }}>
              <FormSection title="部件基础信息" description="定义部件身份、所属设备与硬件类型。">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="部件名称" name="name" rules={[{ required: true, message: '请输入部件名称' }]}>
                      <Input placeholder="如：英特尔 RealSense D435" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="所属机器人设备" name="device" rules={[{ required: true, message: '请选择关联的机器人设备' }]}>
                      <Select placeholder="请选择" options={[
                        { value: 'gb2', label: 'Galbot-G2-Alpha (GB2-2025-001)' },
                        { value: 'fr3', label: 'Franka-FR3-Beta (FR3-992-04)' }
                      ]} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="部件类型" name="type" rules={[{ required: true, message: '请选择部件类型' }]}>
                      <Select placeholder="请选择" options={[
                        { value: 'depth_camera', label: '深度相机 (Depth Camera)' },
                        { value: 'gripper', label: '二指夹爪 (Gripper)' },
                        { value: 'dex_hand', label: '灵巧手 (Dexterous Hand)' },
                        { value: 'lidar', label: '激光雷达 (LiDAR)' },
                        { value: 'arm', label: '六轴机械臂 (6DoF Arm)' },
                        { value: 'imu', label: '惯导传感器 (IMU)' },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="部件序列号/MAC" name="sn">
                      <Input placeholder="选填，硬件唯一序列号" />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              <FormSection title="ROS Topic 数据通道配置" description="为每一种硬件数据流配置采集路径与规格。">
                <Alert
                  title="硬件通讯链路配置"
                  description="物理硬件通常会向外广播多个数据流。请为每一种数据流添加一个 Topic 映射。如果是深度相机，请至少添加“彩色流”、“深度流”和“IMU”三个通道。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <Form.List name="topics">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 0 }}>
                            <Input placeholder="Topic 名称 (如: 彩色图像流)" />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'path']} rules={[{ required: true, message: '必填' }]} style={{ marginBottom: 0 }}>
                            <Input placeholder="Topic 路径 (如: /camera/color/image_raw)" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'res']} style={{ marginBottom: 0 }}>
                            <Input placeholder="分辨率/频率 (如: 1920*1080)" />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          {fields.length > 1 && (
                            <MinusCircleOutlined
                                style={{ color: '#ff4d4f', fontSize: 20, cursor: 'pointer', marginTop: 8 }}
                                onClick={() => remove(name)}
                            />
                          )}
                        </Col>
                      </Row>
                    ))}
                    <Form.Item style={{ marginTop: 16 }}>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加数据流 (Add Topic)
                      </Button>
                    </Form.Item>
                  </>
                )}
                </Form.List>
              </FormSection>
            </Form>
          </Col>

          <Col span={8}>
            <Card title="配置指南" style={{ borderRadius: 8 }}>
            <Text strong>什么是 Topic 组件？</Text>
            <p style={{ color: '#8c8c8c', marginTop: 8, fontSize: 13 }}>
              Topic 是 ROS 架构里的数据通道。例如一个英特尔 RealSense D435 深度相机，插上电后会发三个不同的流：<br/><br/>
              1. <b>彩色流</b>：<code>/camera/color/image_raw</code><br/>
              2. <b>深度流</b>：<code>/camera/depth/image_rect_raw</code><br/>
              3. <b>IMU</b>：<code>/camera/imu</code><br/><br/>
              您需要将它们分行录入，以便数据采集节点精确抓取。
            </p>
            </Card>
          </Col>
        </Row>

        <ActionFooter>
          <Button onClick={() => router.back()}>取消</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存配置</Button>
        </ActionFooter>
      </div>
    </MainLayout>
  );
}
