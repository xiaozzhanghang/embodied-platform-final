'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, App, Breadcrumb, Divider, List, Radio, InputNumber, 
  Switch, Tag, Alert, Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, 
  SaveOutlined, UnorderedListOutlined, MinusCircleOutlined,
  ThunderboltOutlined, CheckCircleOutlined, InfoCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function CreateActionTemplatePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  
  // Selected device state
  const [selectedDevice, setSelectedDevice] = useState('galbot');
  
  // Whether to enable frame range (Auto-adapts to device)
  const [enableFrameRange, setEnableFrameRange] = useState(false);

  // Input mode: structured steps or natural language
  const [inputMode, setInputMode] = useState('structured');
  
  // List of structured steps
  const [steps, setSteps] = useState([
    { key: '1', arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置', startFrame: 0, endFrame: 300 },
    { key: '2', arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近', startFrame: 301, endFrame: 600 },
    { key: '3', arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧', startFrame: 601, endFrame: 900 }
  ]);

  // Handle device change and auto-adapt form fields
  const handleDeviceChange = (deviceVal) => {
    setSelectedDevice(deviceVal);
    if (deviceVal === 'galbot' || deviceVal === 'franka_fr3') {
      setEnableFrameRange(false);
      message.info(`已选择 [${deviceVal === 'galbot' ? '银河 Galbot 机器人' : 'Franka FR3'}]：表单已自动精简为【无帧数纯动作语义模版】`);
    } else if (deviceVal === '鹿鸣') {
      setEnableFrameRange(true);
      message.info('已选择 [鹿鸣]：表单已自动切换为【时序帧区间切片模版】');
    }
  };

  // Synchronize natural language text whenever steps or enableFrameRange changes
  const naturalText = steps.map((s, idx) => {
    if (enableFrameRange) {
      const sFrame = s.startFrame ?? 0;
      const eFrame = s.endFrame ?? (sFrame + 300);
      return `${idx + 1}. ${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`;
    } else {
      return `${idx + 1}. ${s.arm} ${s.skill} ${s.object} (${s.goal})`;
    }
  }).join('\n');

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
      stepTexts = steps.map((s, idx) => {
        if (enableFrameRange) {
          const sFrame = s.startFrame ?? 0;
          const eFrame = s.endFrame ?? (sFrame + 30);
          return `${s.arm} ${s.skill} ${s.object} (${s.goal}) [${sFrame} - ${eFrame} 帧]`;
        } else {
          return `${s.arm} ${s.skill} ${s.object} (${s.goal})`;
        }
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
      enableFrameRange: enableFrameRange,
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
          title="新建动作模版 (设备自适应联动演示)"
          description="选择不同机器人硬件（如银河 Galbot）时，表单将自动自适应切换为无帧数纯动作语义模版，彻底消除冗余录入。"
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '模板中心', href: '/collection/templates' },
            { title: '新建动作模板' },
          ]}
          back={() => router.back()}
        />

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={{ type: '服务数据', device: 'galbot' }}
        >
        <Row gutter={24}>
          {/* Left Column: Form Config */}
          <Col span={8}>
            <FormSection title="基础配置">
              <Form.Item label="动作模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
                <Input placeholder="请输入模版名称，如：超市场景零食抓取与放置模版" />
              </Form.Item>

              <Form.Item 
                label={
                  <Space>
                    <span>适配设备类型 (触发自适应联动)</span>
                    <Tag color="geekblue">智能表单联动</Tag>
                  </Space>
                } 
                name="device" 
                rules={[{ required: true }]}
              >
                <Select 
                  placeholder="请选择" 
                  value={selectedDevice}
                  onChange={handleDeviceChange}
                  options={[
                    { value: 'galbot', label: 'Galbot (银河机器人 / 单双臂)' },
                    { value: 'franka_fr3', label: 'Franka FR3 (桌面机械臂)' },
                    { value: '鹿鸣', label: '鹿鸣 (时序抽检视频设备)' }
                  ]} 
                />
              </Form.Item>

              {/* Dynamic Feature Banner based on Device */}
              <div style={{ 
                background: selectedDevice === 'galbot' ? '#f0fdf4' : '#eff6ff', 
                padding: '12px 16px', 
                borderRadius: 8, 
                border: `1px solid ${selectedDevice === 'galbot' ? '#bbf7d0' : '#bfdbfe'}`,
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <RobotOutlined style={{ color: selectedDevice === 'galbot' ? '#16a34a' : '#2563eb' }} />
                  <Text strong style={{ color: selectedDevice === 'galbot' ? '#15803d' : '#1d4ed8', fontSize: 13 }}>
                    {selectedDevice === 'galbot' ? '银河 Galbot 模式生效中' : (selectedDevice === '鹿鸣' ? '鹿鸣 时序模式生效中' : 'Franka 语义模式生效中')}
                  </Text>
                </div>
                <div style={{ fontSize: 12, color: selectedDevice === 'galbot' ? '#166534' : '#1e40af', lineHeight: 1.5 }}>
                  {selectedDevice === 'galbot' 
                    ? '银河机器人执行连续动作流，模版已自动隐去硬编码帧数，聚焦于原子动作和终止判据定义。'
                    : (selectedDevice === '鹿鸣' 
                      ? '该设备要求固定帧切片，已自动展开「默认帧数区间」列供精细配置。'
                      : '已切换为事件语义驱动模式。')}
                </div>
              </div>

              {/* Manual Override Switch */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 14px', 
                background: '#fafafa', 
                borderRadius: 6, 
                border: '1px solid #e2e8f0',
                marginBottom: 16 
              }}>
                <div>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>包含预设帧区间</Text>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>（由设备类型自动设定，支持手动覆盖）</div>
                </div>
                <Switch 
                  checked={enableFrameRange} 
                  onChange={(checked) => {
                    setEnableFrameRange(checked);
                    message.info(`已${checked ? '开启' : '关闭'}动作模版帧区间输入项`);
                  }} 
                />
              </div>

              <Form.Item label="模板描述" name="desc">
                <Input.TextArea rows={3} placeholder="简述该动作模板的适用动作类型和技能点描述" />
              </Form.Item>
            </FormSection>
          </Col>

          {/* Right Column: SOP Steps List */}
          <Col span={16}>
            <FormSection 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>预设 SOP 动作步骤序列</span>
                  <Tag color={enableFrameRange ? 'gold' : 'green'}>
                    {enableFrameRange ? '含帧区间模式 [Start - End]' : '纯动作语义模式 (推荐用于银河)'}
                  </Tag>
                </div>
              }
            >
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Radio.Group 
                  value={inputMode} 
                  onChange={e => setInputMode(e.target.value)} 
                  optionType="button" 
                  buttonStyle="solid"
                >
                  <Radio.Button value="structured">结构化步骤配置</Radio.Button>
                  <Radio.Button value="natural">自然语言实时预览</Radio.Button>
                </Radio.Group>

                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addStep}>
                  添加动作步骤
                </Button>
              </div>

              {inputMode === 'structured' ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {steps.map((item, index) => (
                      <div 
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        {/* Step Number Badge */}
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#1677ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: 13,
                          flexShrink: 0
                        }}>
                          {index + 1}
                        </div>

                        {/* Dropdowns row - Dynamically adjusts widths when frame range is hidden */}
                        <div style={{ flex: 1 }}>
                          <Row gutter={[10, 10]}>
                            <Col span={enableFrameRange ? 5 : 6}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>执行末端</div>
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

                            <Col span={enableFrameRange ? 4 : 5}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>原子技能</div>
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

                            <Col span={enableFrameRange ? 4 : 6}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>操作对象</div>
                              <Select 
                                value={item.object} 
                                onChange={(val) => updateStepField(item.key, 'object', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="目标物品">目标物品</Option>
                                <Option value="薯片盒">薯片盒</Option>
                                <Option value="饮料瓶">饮料瓶</Option>
                                <Option value="移动托盘">移动托盘</Option>
                                <Option value="瓦楞纸箱">瓦楞纸箱</Option>
                                <Option value="阀门">阀门</Option>
                                <Option value="抽屉">抽屉</Option>
                              </Select>
                            </Col>

                            <Col span={enableFrameRange ? 5 : 7}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>
                                {enableFrameRange ? '操作目标' : '操作目标 / 终止判据'}
                              </div>
                              <Select 
                                value={item.goal} 
                                onChange={(val) => updateStepField(item.key, 'goal', val)}
                                size="middle" 
                                style={{ width: '100%' }}
                              >
                                <Option value="确认位置">确认位置 (Visual Match)</Option>
                                <Option value="避障靠近">避障靠近 (Approach &lt;3cm)</Option>
                                <Option value="牢固夹紧">牢固夹紧 (Torque Threshold)</Option>
                                <Option value="稳定释放">稳定释放 (Placement Safe)</Option>
                                <Option value="对齐插槽">对齐插槽 (Peg-in-hole Align)</Option>
                                <Option value="推拉合拢">推拉合拢 (Door Closed)</Option>
                              </Select>
                            </Col>

                            {/* Frame Range Column: Rendered only when enabled */}
                            {enableFrameRange && (
                              <Col span={6}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>默认帧数区间</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                                    value={item.endFrame ?? 300} 
                                    onChange={(val) => updateStepField(item.key, 'endFrame', val ?? 300)}
                                    min={0}
                                    size="middle"
                                    placeholder="结束帧"
                                    style={{ width: '48%' }}
                                  />
                                </div>
                              </Col>
                            )}
                          </Row>
                        </div>

                        {/* Delete Button */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Button 
                            type="text" 
                            danger 
                            size="small" 
                            disabled={steps.length <= 1}
                            icon={<MinusCircleOutlined style={{ fontSize: 16 }} />}
                            onClick={() => removeStep(item.key)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Input.TextArea 
                    rows={8} 
                    value={naturalText}
                    readOnly
                    style={{ fontFamily: 'monospace', fontSize: 13, background: '#f8fafc' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                    💡 自然语言文本根据结构化配置实时同步生成，创建银河模版时自动省略帧数后缀。
                  </div>
                </div>
              )}
            </FormSection>
          </Col>
        </Row>

        <ActionFooter>
          <Button style={{ width: 120 }} onClick={() => router.back()}>取消</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 160 }}>
            保存模版
          </Button>
        </ActionFooter>
        </Form>
      </div>
    </MainLayout>
  );
}
