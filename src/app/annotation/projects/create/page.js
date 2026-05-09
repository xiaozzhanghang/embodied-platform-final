'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography, Space, Input, Select, Form, Row, Col, Steps, Table, App, Radio, Tag, Divider, Avatar } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, ProjectOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const ANNOTATION_TYPES = [
  { value: '点标注', label: '点标注', color: 'purple', desc: '在图像/帧中标注关键点坐标，适用于关节点、目标中心等' },
  { value: '范围标注', label: '范围标注', color: 'blue', desc: '标注动作的起止时间范围，用于动作分段' },
  { value: '框标注', label: '框标注（BBox）', color: 'orange', desc: '用矩形框圈选目标区域，适用于物体检测' },
  { value: '范围&框标注', label: '范围&框标注', color: 'geekblue', desc: '同时标注时间范围与空间边界框，复合任务' },
  { value: '无需标注', label: '无需标注', color: 'default', desc: '仅做质检，无需进行额外标注操作' },
];

const annotators = [
  { value: '标注员A', label: '标注员A', dept: '标注一组' },
  { value: '标注员B', label: '标注员B', dept: '标注一组' },
  { value: '标注员M', label: '标注员M', dept: '标注二组' },
  { value: '标注员X', label: '标注员X', dept: '标注二组' },
  { value: '标注员Z', label: '标注员Z', dept: '外包供应商' },
];
const reviewers = [
  { value: '审核员Y', label: '审核员Y', dept: '质检组' },
  { value: '审核员N', label: '审核员N', dept: '质检组' },
  { value: '审核员P', label: '审核员P', dept: '质检组' },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState(0);
  const [annoType, setAnnoType] = useState(null);
  const [selectedAnnotators, setSelectedAnnotators] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [linkedTask, setLinkedTask] = useState(null);

  const handleSave = () => {
    if (!projectName) { message.warning('请填写项目名称'); return; }
    if (!annoType) { message.warning('请选择标注类型'); return; }
    if (!selectedAnnotators.length) { message.warning('请分配至少一名标注员'); return; }
    message.success('标注项目创建成功，已通知标注员开始作业！');
    setTimeout(() => router.push('/annotation/projects'), 800);
  };

  const canNext = () => {
    if (step === 0) return projectName && annoType && linkedTask;
    if (step === 1) return selectedAnnotators.length > 0;
    return true;
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginRight: 16 }} />
          <Title level={4} style={{ margin: 0 }}>
            <ProjectOutlined style={{ marginRight: 8, color: '#1677ff' }} />新建标注项目
          </Title>
        </div>
        <Space>
          <Button onClick={() => router.back()}>取消</Button>
          {step > 0 && <Button onClick={() => setStep(s => s - 1)}>上一步</Button>}
          {step < 2 && <Button type="primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>下一步</Button>}
          {step === 2 && <Button type="primary" onClick={handleSave} icon={<CheckCircleOutlined />}>保存并创建</Button>}
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: 8, minHeight: 'calc(100vh - 180px)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 0' }}>
          <Steps
            current={step}
            style={{ marginBottom: 48 }}
            items={[
              { title: '基本信息', description: '项目名称与标注类型' },
              { title: '分配人员', description: '标注员与审核员' },
              { title: '确认发布', description: '预览并提交' },
            ]}
          />

          {/* Step 1: Basic Info */}
          {step === 0 && (
            <Form layout="vertical">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="项目名称" required>
                    <Input
                      placeholder="请输入标注项目名称"
                      size="large"
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="关联采集任务" required>
                    <Select
                      placeholder="请选择采集任务"
                      size="large"
                      value={linkedTask}
                      onChange={setLinkedTask}
                      options={[
                        { value: 'CT-20250301001', label: 'CT-20250301001 — FRANKA-FR3-抓取红色方块' },
                        { value: 'CT-20250308007', label: 'CT-20250308007 — G1-整理厨具' },
                        { value: 'CT-20250310015', label: 'CT-20250310015 — G1-搬运纸箱' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="标注类型" required>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
                  {ANNOTATION_TYPES.map(type => (
                    <div
                      key={type.value}
                      onClick={() => setAnnoType(type.value)}
                      style={{
                        padding: 16,
                        borderRadius: 8,
                        border: `2px solid ${annoType === type.value ? '#1677ff' : '#f0f0f0'}`,
                        background: annoType === type.value ? '#e6f4ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Tag color={type.color}>{type.label}</Tag>
                        {annoType === type.value && <CheckCircleOutlined style={{ color: '#1677ff', float: 'right' }} />}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{type.desc}</Text>
                    </div>
                  ))}
                </div>
              </Form.Item>

              <Form.Item label="项目描述">
                <Input.TextArea rows={3} placeholder="请输入项目描述（可选）" />
              </Form.Item>
            </Form>
          )}

          {/* Step 2: Assign People */}
          {step === 1 && (
            <Form layout="vertical">
              <Form.Item label="分配标注员" required extra="可分配多名标注员，任务将均分给每位标注员">
                <Select
                  mode="multiple"
                  size="large"
                  placeholder="请选择标注员"
                  value={selectedAnnotators}
                  onChange={setSelectedAnnotators}
                  style={{ width: '100%' }}
                  optionLabelProp="label"
                  options={annotators.map(a => ({
                    value: a.value,
                    label: a.label,
                    dept: a.dept,
                  }))}
                  optionRender={(opt) => (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{opt.data.label}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{opt.data.dept}</div>
                      </div>
                    </Space>
                  )}
                />
              </Form.Item>

              <Divider>审核人员（QA）</Divider>

              <Form.Item label="分配审核员" extra="审核员负责对标注结果进行抽检与审核">
                <Select
                  size="large"
                  placeholder="请选择审核员（可选）"
                  value={selectedReviewer}
                  onChange={setSelectedReviewer}
                  style={{ width: '100%' }}
                  allowClear
                  options={reviewers.map(r => ({ value: r.value, label: `${r.label} — ${r.dept}` }))}
                />
              </Form.Item>

              {selectedAnnotators.length > 0 && (
                <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginTop: 16 }}>
                  <Text type="success">
                    <CheckCircleOutlined /> 已选择 {selectedAnnotators.length} 名标注员，
                    系统将自动均分数据任务。{selectedReviewer && `审核员：${selectedReviewer}。`}
                  </Text>
                </Card>
              )}
            </Form>
          )}

          {/* Step 3: Confirm */}
          {step === 2 && (
            <div>
              <Card title="项目信息预览" style={{ marginBottom: 16 }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">项目名称</Text>
                      <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>{projectName || '(未填写)'}</div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">关联采集任务</Text>
                      <div style={{ marginTop: 4 }}><Tag color="blue">{linkedTask}</Tag></div>
                    </div>
                    <div>
                      <Text type="secondary">标注类型</Text>
                      <div style={{ marginTop: 4 }}>
                        {annoType && <Tag color={ANNOTATION_TYPES.find(t => t.value === annoType)?.color}>{annoType}</Tag>}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">标注员（{selectedAnnotators.length} 人）</Text>
                      <div style={{ marginTop: 4 }}>
                        {selectedAnnotators.map(a => (
                          <Tag key={a} icon={<UserOutlined />} style={{ marginBottom: 4 }}>{a}</Tag>
                        ))}
                        {!selectedAnnotators.length && <Text type="secondary">未分配</Text>}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">审核员</Text>
                      <div style={{ marginTop: 4 }}>
                        {selectedReviewer
                          ? <Tag icon={<UserOutlined />} color="green">{selectedReviewer}</Tag>
                          : <Text type="secondary">未分配</Text>}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card style={{ background: '#e6f4ff', borderColor: '#91caff' }}>
                <Text>
                  📬 创建成功后，系统将向已分配的 <strong>{selectedAnnotators.length} 名标注员</strong> 发送任务通知，
                  标注任务将进入「标注中」状态。
                </Text>
              </Card>
            </div>
          )}
        </div>
      </Card>
    </MainLayout>
  );
}
