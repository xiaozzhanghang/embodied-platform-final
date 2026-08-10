'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, App, Breadcrumb, Divider, List, Radio, InputNumber
} from 'antd';
import { 
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, 
  SaveOutlined, UnorderedListOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function CreateActionTemplatePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  // Input mode: structured steps or natural language
  const [inputMode, setInputMode] = useState('structured');
  
  // List of structured steps matching the audit/create page
  const [steps, setSteps] = useState([
    { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 301, endFrame: 600 },
    { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);

  const [naturalText, setNaturalText] = useState(
    "1. 右手 (Right Arm) 识别 目标物品 (确认位置) [0 - 300 帧]\n2. 右手 (Right Arm) 靠近 目标物品 (避障靠近) [301 - 600 帧]\n3. 右手 (Right Arm) 抓取 目标物品 (牢固夹紧) [601 - 900 帧]"
  );

  const addStep = () => {
    const newKey = (steps.length + 1).toString();
    const lastStep = steps[steps.length - 1];
    const prevEnd = lastStep ? (lastStep.endFrame ?? 0) : 0;
    const startF = prevEnd > 0 ? prevEnd + 1 : 0;
    setSteps([
      ...steps, 
      { 
        key: newKey, 
        arm: '右手 (Right Arm)', 
        skill: '识别', 
        object: '目标物品', 
        goal: '确认位置',
        startFrame: startF,
        endFrame: startF + 299
      }
    ]);
  };

  const removeStep = (key) => {
    setSteps(steps.filter(item => item.key !== key));
  };

  const updateStepField = (key, field, val) => {
    setSteps(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const onFinish = (values) => {
    let stepTexts = [];
    if (inputMode === 'structured') {
      stepTexts = steps.map(s => {
        const sFrame = s.startFrame ?? 0;
        const eFrame = s.endFrame ?? (sFrame + 30);
        return `${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`;
      });
    } else {
      stepTexts = naturalText.split('\n').map(line => line.replace(/^\d+[\.\、\s]*/, '').trim()).filter(Boolean);
    }

    if (stepTexts.length === 0) {
      message.error('动作步骤序列不能为空！');
      return;
    }

    const newTemplate = {
      key: 'act_user_' + Date.now(),
      name: values.name,
      desc: values.desc || '',
      type: '服务数据',
      device: values.device,
      stepCount: stepTexts.length,
      steps: stepTexts
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

    message.success('动作模板创建成功！');
    router.push('/collection/templates');
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="新建动作模版"
          description="定义动作模板的适配设备与可复用 SOP 步骤序列。"
          breadcrumbs={[
            { title: '数据采集' },
            { title: '模板中心', href: '/collection/templates' },
            { title: '新建动作模板' },
          ]}
          back={() => router.back()}
        />

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: '服务数据', device: 'galbot' }}>
        <Row gutter={24}>
          {/* Left Column: Form Config */}
          <Col span={8}>
            <FormSection title="基础配置">
              <Form.Item label="动作模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
                <Input placeholder="请输入模版名称，如：桌面书籍整理与摆放模版" />
              </Form.Item>



              <Form.Item label="适配设备类型" name="device" rules={[{ required: true }]}>
                <Select placeholder="请选择" options={[
                  { value: 'galbot', label: 'Galbot (单臂/双臂)' },
                  { value: 'franka_fr3', label: 'Franka FR3' },
                  { value: '鹿鸣', label: '鹿鸣' }
                ]} />
              </Form.Item>

              <Form.Item label="模板描述" name="desc">
                <Input.TextArea rows={4} placeholder="简述该动作模板的适用动作类型和技能点描述" />
              </Form.Item>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 24 }}>
                <Title level={5} style={{ fontSize: 13, margin: '0 0 8px 0', color: '#475569' }}>动作模板说明</Title>
                <Paragraph style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  动作模板用于定义**机器人执行特定动作的SOP流程**。在新建宏观任务模板或标注任务时，可以直接导入已建好的动作模板以自动填充原子动作编排步骤。
                </Paragraph>
              </div>
            </FormSection>
          </Col>

          {/* Right Column: SOP Steps List */}
          <Col span={16}>
            <FormSection title="预设 SOP 动作步骤序列">
              <div style={{ marginBottom: 20 }}>
                <Radio.Group 
                  value={inputMode} 
                  onChange={e => setInputMode(e.target.value)} 
                  optionType="button" 
                  buttonStyle="solid"
                >
                  <Radio.Button value="structured">结构化步骤</Radio.Button>
                  <Radio.Button value="natural">自然语言描述</Radio.Button>
                </Radio.Group>
              </div>

              {inputMode === 'structured' ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                    {steps.map((item, index) => (
                      <div 
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '16px 20px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Step Number Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            fontSize: 14,
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                          }}>
                            {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>

                        {/* Dropdowns row */}
                        <div style={{ flex: 1 }}>
                          <Row gutter={[12, 12]}>
                            <Col span={5}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>执行末端类型</div>
                              <Select 
                                value={item.arm} 
                                onChange={(val) => updateStepField(item.key, 'arm', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="右手 (Right Arm)">右手 (Right Arm)</Option>
                                <Option value="左手 (Left Arm)">左手 (Left Arm)</Option>
                                <Option value="双手 (Dual Arms)">双手 (Dual Arms)</Option>
                                <Option value="底盘 (Base)">底盘 (Base)</Option>
                                <Option value="相机 (Camera)">相机 (Camera)</Option>
                              </Select>
                            </Col>

                            <Col span={4}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>原子技能</div>
                              <Select 
                                value={item.skill} 
                                onChange={(val) => updateStepField(item.key, 'skill', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="识别">识别</Option>
                                <Option value="靠近">靠近</Option>
                                <Option value="抓取">抓取</Option>
                                <Option value="放置">放置</Option>
                                <Option value="旋转">旋转</Option>
                                <Option value="对准">对准</Option>
                                <Option value="松开">松开</Option>
                              </Select>
                            </Col>

                            <Col span={4}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>操作对象</div>
                              <Select 
                                value={item.object} 
                                onChange={(val) => updateStepField(item.key, 'object', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="目标物品">目标物品</Option>
                                <Option value="阀门">阀门</Option>
                                <Option value="垃圾桶">垃圾桶</Option>
                                <Option value="餐盘">餐盘</Option>
                                <Option value="抽屉">抽屉</Option>
                                <Option value="螺丝刀">螺丝刀</Option>
                                <Option value="桌面">桌面</Option>
                                <Option value="纸箱">纸箱</Option>
                                <Option value="泡沫填充纸">泡沫填充纸</Option>
                                <Option value="工厂部件">工厂部件</Option>
                                <Option value="胶带封装器">胶带封装器</Option>
                              </Select>
                            </Col>

                            <Col span={5}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>操作目标</div>
                              <Select 
                                value={item.goal} 
                                onChange={(val) => updateStepField(item.key, 'goal', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="确认位置">确认位置</Option>
                                <Option value="避障靠近">避障靠近</Option>
                                <Option value="牢固夹紧">牢固夹紧</Option>
                                <Option value="稳定释放">稳定释放</Option>
                                <Option value="扭转至角度">扭转至角度</Option>
                                <Option value="对齐插槽">对齐插槽</Option>
                                <Option value="推拉合拢">推拉合拢</Option>
                              </Select>
                            </Col>

                            <Col span={6}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>默认帧数区间</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <InputNumber 
                                  value={item.startFrame ?? 0} 
                                  onChange={(val) => updateStepField(item.key, 'startFrame', val ?? 0)}
                                  min={0}
                                  size="middle"
                                  placeholder="起始帧"
                                  style={{ width: '48%' }}
                                />
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>-</span>
                                <InputNumber 
                                  value={item.endFrame ?? 30} 
                                  onChange={(val) => updateStepField(item.key, 'endFrame', val ?? 30)}
                                  min={0}
                                  size="middle"
                                  placeholder="结束帧"
                                  style={{ width: '48%' }}
                                />
                              </div>
                            </Col>
                          </Row>
                        </div>

                        {/* Delete Button */}
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                          <Button 
                            type="text" 
                            danger 
                            size="middle" 
                            disabled={steps.length <= 1}
                            icon={<MinusCircleOutlined style={{ fontSize: 16 }} />}
                            onClick={() => removeStep(item.key)}
                            style={{
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              width: 36,
                              height: 36,
                              marginTop: 16
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="dashed"
                    onClick={addStep}
                    icon={<PlusOutlined />}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 12,
                      color: '#2563eb',
                      borderColor: '#93c5fd',
                      background: '#f0f7ff',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginBottom: 16
                    }}
                  >
                    添加结构化步骤
                  </Button>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Input.TextArea 
                    rows={12} 
                    value={naturalText}
                    onChange={e => setNaturalText(e.target.value)}
                    placeholder="请输入自然语言描述的动作步骤流程，每行代表一个步骤。例如：&#10;1. 右手 (Right Arm) 识别 目标物品 (确认位置)&#10;2. 右手 (Right Arm) 靠近 目标物品 (避障靠近)"
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                    支持直接复制大段以空格/符号分隔的动作文本描述，每行文字将自动转换为模板中的独立工作步骤。
                  </Text>
                </div>
              )}

              <div style={{ background: '#fafafa', padding: 16, borderRadius: 4, border: '1px dashed #d9d9d9', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  提示：编排后的动作步骤序列将在新建任务模板阶段被引入，作为原子动作编排映射的基础指引。
                </Text>
              </div>

              <ActionFooter>
                <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 120 }}>保存模板</Button>
              </ActionFooter>
            </FormSection>
          </Col>
        </Row>
        </Form>
      </div>
    </MainLayout>
  );
}
