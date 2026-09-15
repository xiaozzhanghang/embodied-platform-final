'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, App, Radio, InputNumber, Switch, Tag
} from 'antd';
import { 
  PlusOutlined, SaveOutlined, UnorderedListOutlined, 
  EditOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, PageHeader } from '@/components/ui';

const { Title, Text } = Typography;

export default function CreateActionTemplatePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Selected device state
  const [selectedDevice, setSelectedDevice] = useState('galbot');
  
  // Whether to enable frame range
  const [enableFrameRange, setEnableFrameRange] = useState(true);

  // Input mode: structured steps or natural language
  const [stepFormat, setStepFormat] = useState('natural'); // 'natural' | 'structured'
  
  // List of structured steps
  const [structuredSteps, setStructuredSteps] = useState([
    { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 301, endFrame: 600 },
    { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);

  // List of natural steps (1 input per step row as in screenshot)
  const [naturalSteps, setNaturalSteps] = useState([
    { key: '1', text: '展开纸箱并封底', startFrame: 0, endFrame: 300 },
    { key: '2', text: '放置底部泡沫垫并对准角落', startFrame: 301, endFrame: 600 }
  ]);

  const addStep = () => {
    if (stepFormat === 'structured') {
      const newKey = (structuredSteps.length + 1).toString();
      const lastStep = structuredSteps[structuredSteps.length - 1];
      const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
      const startF = prevEnd > 0 ? prevEnd + 1 : 0;
      setStructuredSteps([
        ...structuredSteps, 
        { 
          key: newKey, 
          arm: '右手 (Right Arm)', 
          skill: '靠近', 
          object: '目标物品', 
          goal: '避障靠近',
          startFrame: startF,
          endFrame: startF + 299
        }
      ]);
    } else {
      const newKey = (naturalSteps.length + 1).toString();
      const lastStep = naturalSteps[naturalSteps.length - 1];
      const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
      const startF = prevEnd > 0 ? prevEnd + 1 : 0;
      setNaturalSteps([
        ...naturalSteps,
        {
          key: newKey,
          text: '',
          startFrame: startF,
          endFrame: startF + 299
        }
      ]);
    }
  };

  const removeStep = (key) => {
    if (stepFormat === 'structured') {
      setStructuredSteps(structuredSteps.filter(item => item.key !== key));
    } else {
      setNaturalSteps(naturalSteps.filter(item => item.key !== key));
    }
  };

  const updateStructuredStepField = (key, field, val) => {
    setStructuredSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const updateNaturalStepField = (key, field, val) => {
    setNaturalSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const onFinish = (values) => {
    let stepTexts = [];
    if (stepFormat === 'structured') {
      stepTexts = structuredSteps.map((s) => {
        const sFrame = s.startFrame ?? 0;
        const eFrame = s.endFrame ?? (sFrame + 300);
        return enableFrameRange 
          ? `${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`
          : `${s.arm} ${s.skill} ${s.object} (${s.goal})`;
      });
    } else {
      stepTexts = naturalSteps.map((s, idx) => {
        const sFrame = s.startFrame ?? 0;
        const eFrame = s.endFrame ?? (sFrame + 300);
        const txt = s.text || `步骤 ${idx + 1}`;
        return enableFrameRange ? `${txt} [${sFrame} - ${eFrame} 帧]` : txt;
      });
    }

    if (stepTexts.length === 0) {
      message.error('动作步骤序列不能为空！');
      return;
    }

    const newTemplate = {
      key: 'act_user_' + Date.now(),
      name: values.name,
      desc: values.desc || '',
      type: values.type || '服务数据',
      device: values.device || 'galbot',
      stepFormat: stepFormat, // 'structured' | 'natural'
      stepType: stepFormat === 'structured' ? '结构化步骤' : '自然语言',
      enableFrameRange: enableFrameRange,
      stepCount: stepTexts.length,
      steps: stepTexts,
      structuredSteps: stepFormat === 'structured' ? structuredSteps : [],
      naturalSteps: stepFormat === 'natural' ? naturalSteps : []
    };

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_action_templates');
      let currentTemplates = [];
      if (saved) {
        try {
          currentTemplates = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
      currentTemplates.push(newTemplate);
      localStorage.setItem('embodied_action_templates', JSON.stringify(currentTemplates));
    }

    message.success(`已成功创建【${newTemplate.stepType}】动作模板！`);
    router.push('/collection/templates');
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="新建动作模版"
          description="按照动作模版标准录入步骤序列，支持在结构化步骤与自然语言描述之间便捷切换并预设帧区间。"
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '模板中心', href: '/collection/templates' },
            { title: '新建动作模板' },
          ]}
          back={() => router.back()}
        />

        <Card style={{ maxWidth: 960, margin: '0 auto', borderRadius: 10, border: '1px solid #e2e8f0' }} styles={{ body: { padding: '24px 28px' } }}>
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={onFinish} 
            initialValues={{ type: '服务数据', device: 'galbot' }}
          >
            {/* Row 1: Name and Device (Exact match to screenshot) */}
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模版名称</span>} 
                  name="name" 
                  rules={[{ required: true, message: '请输入模版名称' }]} 
                  style={{ marginBottom: 18 }}
                >
                  <Input placeholder="例如：工业纸箱打包封装与装箱模版" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  label={<span style={{ fontWeight: 500 }}>适配设备</span>} 
                  name="device" 
                  style={{ marginBottom: 18 }}
                >
                  <Select 
                    placeholder="请下拉选择设备" 
                    value={selectedDevice}
                    onChange={(v) => setSelectedDevice(v)}
                    options={[
                      { value: 'galbot', label: 'Galbot (银河机器人 / 单双臂)' },
                      { value: 'franka_fr3', label: 'Franka FR3 (桌面机械臂)' },
                      { value: '鹿鸣', label: '鹿鸣 (时序抽检设备)' },
                      { value: 'xinsong', label: '新松工业机械臂' }
                    ]} 
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Row 2: Description */}
            <Form.Item 
              label={<span style={{ fontWeight: 500 }}><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>模版描述</span>} 
              name="desc" 
              rules={[{ required: true, message: '请输入模版描述' }]}
              style={{ marginBottom: 20 }}
            >
              <Input.TextArea 
                rows={3} 
                maxLength={200} 
                showCount 
                placeholder="简要说明此动作模版的适用场景..." 
              />
            </Form.Item>

            {/* Row 3: Action Steps Header Bar with Step Mode Buttons and Frame Switch */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>*</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>动作步骤</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>（请先选择步骤模式）</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Preset Frame Range Switch */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 13, color: '#334155' }}>预设帧区间</span>
                  <Switch 
                    size="small" 
                    checked={enableFrameRange} 
                    onChange={(checked) => {
                      setEnableFrameRange(checked);
                      message.info(`已${checked ? '开启' : '关闭'}预设帧区间`);
                    }} 
                  />
                </div>

                {/* Step Mode Buttons (Exact match to screenshot) */}
                <Radio.Group 
                  value={stepFormat} 
                  onChange={(e) => setStepFormat(e.target.value)}
                  buttonStyle="solid"
                  size="middle"
                >
                  <Radio.Button value="structured" style={{ borderRadius: '6px 0 0 6px' }}>
                    <Space size={4}>
                      <UnorderedListOutlined />
                      <span>结构化步骤</span>
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="natural" style={{ borderRadius: '0 6px 6px 0' }}>
                    <Space size={4}>
                      <EditOutlined />
                      <span>自然语言描述</span>
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </div>
            </div>

            {/* Steps List */}
            <div style={{ marginBottom: 20 }}>
              {stepFormat === 'natural' ? (
                /* View A: Natural Language Rows */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {naturalSteps.map((item, index) => (
                    <div 
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                      }}
                    >
                      {/* Blue Round Badge */}
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#1677ff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 12,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Step Input */}
                      <Input 
                        placeholder="例如：展开纸箱并封底"
                        value={item.text}
                        onChange={(e) => updateNaturalStepField(item.key, 'text', e.target.value)}
                        style={{ flex: 1 }}
                      />

                      {/* Frame Range Inputs */}
                      {enableFrameRange && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>帧数区间:</span>
                          <InputNumber 
                            value={item.startFrame ?? 0} 
                            onChange={(val) => updateNaturalStepField(item.key, 'startFrame', val ?? 0)}
                            min={0}
                            style={{ width: 75 }}
                          />
                          <span style={{ color: '#94a3b8' }}>-</span>
                          <InputNumber 
                            value={item.endFrame ?? 300} 
                            onChange={(val) => updateNaturalStepField(item.key, 'endFrame', val ?? 300)}
                            min={0}
                            style={{ width: 75 }}
                          />
                        </div>
                      )}

                      {/* Delete Action */}
                      <Button 
                        type="link" 
                        danger 
                        size="small"
                        disabled={naturalSteps.length <= 1}
                        onClick={() => removeStep(item.key)}
                        style={{ padding: '0 4px', fontSize: 13 }}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                /* View B: Structured Step Rows */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {structuredSteps.map((item, index) => (
                    <div 
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                      }}
                    >
                      {/* Blue Round Badge */}
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#1677ff',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 12,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Dropdowns row */}
                      <div style={{ flex: 1 }}>
                        <Row gutter={[8, 8]}>
                          <Col span={enableFrameRange ? 5 : 6}>
                            <Select 
                              value={item.arm} 
                              placeholder="执行末端"
                              onChange={(val) => updateStructuredStepField(item.key, 'arm', val)}
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="右手 (Right Arm)">右手 (Right Arm)</Select.Option>
                              <Select.Option value="左手 (Left Arm)">左手 (Left Arm)</Select.Option>
                              <Select.Option value="双手 (Dual Arms)">双手 (Dual Arms)</Select.Option>
                              <Select.Option value="底盘 (Base)">底盘 (Base)</Select.Option>
                              <Select.Option value="相机 (Camera)">相机 (Camera)</Select.Option>
                            </Select>
                          </Col>

                          <Col span={enableFrameRange ? 4 : 6}>
                            <Select 
                              value={item.skill} 
                              placeholder="原子技能"
                              onChange={(val) => updateStructuredStepField(item.key, 'skill', val)}
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="识别">识别</Select.Option>
                              <Select.Option value="靠近">靠近</Select.Option>
                              <Select.Option value="抓取">抓取</Select.Option>
                              <Select.Option value="放置">放置</Select.Option>
                              <Select.Option value="旋转">旋转</Select.Option>
                              <Select.Option value="对准">对准</Select.Option>
                              <Select.Option value="展开">展开</Select.Option>
                              <Select.Option value="折叠">折叠</Select.Option>
                              <Select.Option value="封箱">封箱</Select.Option>
                              <Select.Option value="松开">松开</Select.Option>
                            </Select>
                          </Col>

                          <Col span={enableFrameRange ? 5 : 6}>
                            <Select 
                              value={item.object} 
                              placeholder="操作对象"
                              onChange={(val) => updateStructuredStepField(item.key, 'object', val)}
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="目标物品">目标物品</Select.Option>
                              <Select.Option value="纸箱">纸箱</Select.Option>
                              <Select.Option value="泡沫垫">泡沫垫</Select.Option>
                              <Select.Option value="工厂部件">工厂部件</Select.Option>
                              <Select.Option value="箱盖">箱盖</Select.Option>
                              <Select.Option value="胶带机">胶带机</Select.Option>
                              <Select.Option value="餐盘">餐盘</Select.Option>
                              <Select.Option value="抽屉">抽屉</Select.Option>
                              <Select.Option value="门把手">门把手</Select.Option>
                            </Select>
                          </Col>

                          <Col span={enableFrameRange ? 5 : 6}>
                            <Select 
                              value={item.goal} 
                              placeholder="操作目标"
                              onChange={(val) => updateStructuredStepField(item.key, 'goal', val)}
                              style={{ width: '100%' }}
                            >
                              <Select.Option value="确认位置">确认位置</Select.Option>
                              <Select.Option value="避障靠近">避障靠近</Select.Option>
                              <Select.Option value="牢固夹紧">牢固夹紧</Select.Option>
                              <Select.Option value="稳定装箱">稳定装箱</Select.Option>
                              <Select.Option value="封底定位">封底定位</Select.Option>
                              <Select.Option value="合拢定位">合拢定位</Select.Option>
                              <Select.Option value="顶部密封">顶部密封</Select.Option>
                              <Select.Option value="平稳入框">平稳入框</Select.Option>
                            </Select>
                          </Col>

                          {enableFrameRange && (
                            <Col span={5}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <InputNumber 
                                  value={item.startFrame ?? 0} 
                                  onChange={(val) => updateStructuredStepField(item.key, 'startFrame', val ?? 0)}
                                  min={0}
                                  style={{ width: '48%' }}
                                />
                                <span style={{ color: '#94a3b8' }}>-</span>
                                <InputNumber 
                                  value={item.endFrame ?? 300} 
                                  onChange={(val) => updateStructuredStepField(item.key, 'endFrame', val ?? 300)}
                                  min={0}
                                  style={{ width: '48%' }}
                                />
                              </div>
                            </Col>
                          )}
                        </Row>
                      </div>

                      {/* Delete Action */}
                      <Button 
                        type="link" 
                        danger 
                        size="small"
                        disabled={structuredSteps.length <= 1}
                        onClick={() => removeStep(item.key)}
                        style={{ padding: '0 4px', fontSize: 13 }}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Wide Dashed Add Button (Exact match to screenshot) */}
              <Button
                type="dashed"
                block
                onClick={addStep}
                style={{
                  height: 38,
                  marginTop: 12,
                  borderRadius: 6,
                  color: '#475569',
                  borderColor: '#cbd5e1',
                  fontSize: 13,
                  background: '#ffffff'
                }}
              >
                + 新增步骤
              </Button>
            </div>

            <ActionFooter>
              <Button style={{ width: 100 }} onClick={() => router.back()}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 120, background: '#1677ff' }}>
                保 存
              </Button>
            </ActionFooter>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}

