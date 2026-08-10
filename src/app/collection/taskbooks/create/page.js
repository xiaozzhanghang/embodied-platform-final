'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, Upload, App, Breadcrumb, Divider, Checkbox, Tag
} from 'antd';
import { 
  ArrowLeftOutlined, UploadOutlined, SaveOutlined, 
  FilePdfOutlined, InfoCircleOutlined, BookOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CreateTaskbookPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    message.success('任务书创建成功');
    router.push('/collection/taskbooks');
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="新建任务书（SOP）"
          description="定义采集目标、作业指引、附件与质检必检项。"
          breadcrumbs={[
            { title: '数据采集' },
            { title: '任务书', href: '/collection/taskbooks' },
            { title: '新建任务书' },
          ]}
          back={() => router.back()}
        />

        <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          <Col span={16}>
            <FormSection title="基础信息">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="任务书名称" name="name" rules={[{ required: true }]}>
                    <Input placeholder="例如：医院场景垃圾清理采集规范 V2.0" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="所属项目" name="project" rules={[{ required: true }]}>
                    <Select placeholder="请选择项目" options={[
                      { value: 'p1', label: '内部项目-商业' },
                      { value: 'p2', label: 'SimulatedCollection' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="核心采集指标 (Goal)" name="goal">
                <TextArea rows={3} placeholder="请简述该任务书期望达到的采集目标和核心质量指标" />
              </Form.Item>
            </FormSection>

            <SpecMarker
              id="taskbooks-content"
              number={1}
              title="步骤富文本与数据绑定"
              rules={[
                "编写 SOP 指引支持图文和标准 Markdown 语法，用于具体规范机器人动作流和采集员物理操作规程。",
                "支持在文字中通过 `{{object_coord}}` / `{{grasp_torque}}` 等变量占位符，实现与具体项目、设备参数的动作属性联动插值绑定。",
                "支持上传 PDF/Docx 标准参考作业程序。上传大文件将自动触发分片暂存与秒传逻辑，避免网络中断导致编辑进度丢失。"
              ]}
              remark="将图文作业规范与底层控制物理参数进行数字链路绑定，极大程度提高人机协同数采的精准度。"
              style={{ width: '100%' }}
            >
              <FormSection title="详细指导说明（Markdown）">
                <Form.Item name="content" noStyle>
                  <TextArea 
                    rows={15} 
                    placeholder="# 采集环境要求\n1. 室内光照需保持在 500lux 以上...\n\n# 动作标准\n- 机器人起始位置必须在物体正前方 30cm...\n- 抓取力度需保持在..." 
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                </Form.Item>
              </FormSection>
            </SpecMarker>
          </Col>

          <Col span={8}>
            <FormSection title="附件与要求">
              <Form.Item label="上传标准 PDF 档" name="pdf">
                <Upload maxCount={1} accept=".pdf">
                  <Button icon={<UploadOutlined />} block>上传任务书 PDF</Button>
                </Upload>
                <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 12 }}>供采集员在工作台实时查阅</Text></div>
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />
              
              <Form.Item label="质检必检项" name="checks">
                <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Checkbox value="1">环境光照检查</Checkbox>
                  <Checkbox value="2">动作连贯性检查</Checkbox>
                  <Checkbox value="3">物体边界无遮挡</Checkbox>
                  <Checkbox value="4">关键点标注闭环</Checkbox>
                </Checkbox.Group>
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">版本号：</Text>
                  <Tag>v1.0.0 (Latest)</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">创建人：</Text>
                  <Text>Admin User</Text>
                </div>
              </Space>
            </FormSection>

            <div style={{ background: '#e6f7ff', padding: 16, borderRadius: 8, border: '1px solid #91d5ff' }}>
              <Space align="start">
                <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                <Text style={{ fontSize: 13 }}>
                  <b>提示</b>：任务书一旦保存并发布，将成为该项目下所有采集任务的最高执行准则。
                </Text>
              </Space>
            </div>
          </Col>
        </Row>

        <ActionFooter>
          <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 160 }}>保存并发布</Button>
        </ActionFooter>
        </Form>
      </div>
    </MainLayout>
  );
}
