'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Input, Select, Form, Row, Col, 
  Card, Upload, App, Divider, Checkbox, Tag, InputNumber, 
  Tooltip, Alert, Popconfirm
} from 'antd';
import { 
  UploadOutlined, SaveOutlined, FilePdfOutlined, 
  InfoCircleOutlined, BookOutlined, PlusOutlined, 
  MinusCircleOutlined, ThunderboltOutlined, RobotOutlined,
  CheckCircleOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CreateTaskbookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Steps state for dynamic sub-goal decomposition
  const [steps, setSteps] = useState([
    { id: 1, name: '接近目标物体', subInstruction: 'move arm towards the target object', stopCondition: '夹爪末端距离物体表面小于 3cm' },
    { id: 2, name: '稳定夹取物体', subInstruction: 'grasp object firmly with controlled torque', stopCondition: '夹爪力传感器反馈达标，位姿无滑动' },
    { id: 3, name: '搬运与位姿调整', subInstruction: 'transfer object along collision-free trajectory', stopCondition: '提升高度达到 15cm，避开障碍物' },
    { id: 4, name: '平稳放置与释放', subInstruction: 'place object onto designated area and release gripper', stopCondition: '物体平稳着陆托盘，夹爪完全复位' },
  ]);

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue({
        code: editId.includes('TB-') ? editId : `TB-${editId}`,
        name: '超市场景物品货架抓取与托盘放置规范',
        instruction: 'pick snack from top shelf and place onto moving tray',
        project: 'p1',
        skillCategory: 'Pick & Place (抓取放置)',
        scene: '商业零售',
        version: 'V1.0',
        objects: ['薯片盒', '移动托盘', '三层货架'],
        supportedHardware: ['Galbot_2.2_RGBD', 'Galbot_1.16_G2'],
        teleopType: '双臂主从摇臂',
        goal: '规范机器人在超市货架抓取薯片、零食盒等多形态货品，并精准放置在移动托盘上的全套动作流水与力控指标。',
        content: `# 1. 采集环境与光照要求
- 室内环境照度需稳定在 500 ~ 750 lux 之间。
- 货架正面无剧烈逆光与反光阴影。

# 2. 机器人动作控制规范
- 起始位置：机械臂基座距离货架边缘 40cm，手眼相机水平对准货架中层。
- 抓取力度：根据不同零食盒材质自适应调节（软包装 10N，硬盒 18N）。
- 运动轨迹：全程需保持平滑无突变速度，避开货架层板边缘。

# 3. 数据合格与质检判据
- 必须包含完整的【接近 -> 抓取 -> 运送 -> 放置】时序闭环。
- 严禁出现掉落、磕碰货架或夹爪脱落现象。`,
        checks: ['1', '2', '3', '4', '5'],
      });
    } else {
      form.setFieldsValue({
        code: `TB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001`,
        version: 'V1.0',
        checks: ['1', '2', '3', '4'],
      });
    }
  }, [isEdit, editId, form]);

  const handleAddStep = () => {
    const nextId = steps.length + 1;
    setSteps(prev => [
      ...prev,
      { id: nextId, name: `步骤 0${nextId}`, subInstruction: 'action instruction in english', stopCondition: '动作完成判据' }
    ]);
  };

  const handleRemoveStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    setSteps(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const onFinish = (values) => {
    message.success({
      content: `🎉 任务书 [${values.name}] ${isEdit ? '更新' : '创建并发布'}成功！已自动建立与 downstream taskinfo 结构的动作语义映射。`,
      duration: 3
    });
    router.push('/collection/taskbooks');
  };

  return (
    <MainLayout>
      <div className="ui-page ui-form-page">
        <PageHeader
          title={isEdit ? `编辑任务书 — ${editId}` : '新建任务书 (SOP 规范)'}
          description="结构化定义动作规范、自然语言指令 (Language Instruction)、目标物体与阶段切分模板，直接为下游 taskinfo 生成与 VLA 模型训练提供标准数据源。"
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '任务书 (SOP)', href: '/collection/taskbooks' },
            { title: isEdit ? '编辑任务书' : '新建任务书' },
          ]}
          back={() => router.push('/collection/taskbooks')}
        />

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={16}>
              {/* Section 1: 基础信息与动作语义 (核心算法训练源) */}
              <FormSection title="1. 核心动作语义与自然语言指令 (Language Instruction)">
                <Alert
                  type="info"
                  showIcon
                  icon={<ThunderboltOutlined />}
                  message="【算法消费关键元数据】本处录入的英文指令与动作语义，将在标注工作台保存时 100% 自动注入为下游 taskinfo.json 的 task_description，直接供 VLA / ACT 策略模型训练！"
                  style={{ marginBottom: 16 }}
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="任务书标识编号" name="code" rules={[{ required: true, message: '请输入任务书编号' }]}>
                      <Input placeholder="例如：TB-20260415-001 或 TB-超市场景规范 V1.0" style={{ fontFamily: 'monospace' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="版本号" name="version" rules={[{ required: true }]}>
                      <Input placeholder="例如：V1.0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="任务书中文名称 (Task Name)" name="name" rules={[{ required: true, message: '请输入任务书名称' }]}>
                  <Input placeholder="例如：超市场景物品货架抓取与托盘放置规范" />
                </Form.Item>

                <Form.Item 
                  label={
                    <Space>
                      <span>自然语言指令 Prompt (Language Instruction)</span>
                      <Tag color="geekblue">VLA 模型对齐</Tag>
                    </Space>
                  } 
                  name="instruction" 
                  rules={[{ required: true, message: '请输入英文语言指令' }]}
                >
                  <Input 
                    placeholder="例如：pick snack from top shelf and place onto moving tray" 
                    style={{ fontFamily: 'monospace', color: '#0958d9' }} 
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="所属项目" name="project" rules={[{ required: true }]}>
                      <Select placeholder="请选择项目" options={[
                        { value: 'p1', label: '内部项目-商业 (Commercial)' },
                        { value: 'p2', label: '内部项目-工业 (Industrial)' },
                        { value: 'p3', label: '模拟采集 (Simulated)' },
                        { value: 'p4', label: '外部合作 (ExternalXupaosi)' },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="技能分类 (Skill Category)" name="skillCategory" rules={[{ required: true }]}>
                      <Select placeholder="请选择技能分类" options={[
                        { value: 'Pick & Place (抓取放置)', label: '抓取放置 (Pick & Place)' },
                        { value: 'Packaging & Stacking (封装码垛)', label: '封装码垛 (Packaging)' },
                        { value: 'Bimanual Manipulation (双臂协同)', label: '双臂协同 (Bimanual)' },
                        { value: 'Object Sorting (分类整理)', label: '分类整理 (Sorting)' },
                        { value: 'Precision Insertion (精密插拔)', label: '精密插拔 (Assembly)' },
                        { value: 'Door/Drawer Operating (开关操作)', label: '开关操作 (Operating)' },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="场景类型" name="scene" rules={[{ required: true }]}>
                      <Select placeholder="请选择场景" options={[
                        { value: '商业零售', label: '商业零售' },
                        { value: '工业制造', label: '工业制造' },
                        { value: '家庭厨房', label: '家庭厨房' },
                        { value: '医疗健康', label: '医疗健康' },
                        { value: '仓储物流', label: '仓储物流' },
                        { value: '模拟实验室', label: '模拟实验室' },
                      ]} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="核心采集目标 (Goal Description)" name="goal">
                  <TextArea rows={2} placeholder="请简述该任务书期望达到的采集目标和核心质量指标" />
                </Form.Item>
              </FormSection>

              {/* Section 2: 目标物体与设备约束 */}
              <FormSection title="2. 目标实体与设备硬件约束">
                <Form.Item label="关联目标物体库 (Target Objects)" name="objects" rules={[{ required: true, message: '请选择至少一个目标物体' }]}>
                  <Select 
                    mode="tags" 
                    placeholder="从物体库选择或直接输入物体名称（如：薯片盒、饮料瓶、托盘）" 
                    options={[
                      { value: '薯片盒', label: '薯片盒' },
                      { value: '饮料瓶', label: '饮料瓶' },
                      { value: '移动托盘', label: '移动托盘' },
                      { value: '三层货架', label: '三层货架' },
                      { value: '瓦楞纸箱', label: '瓦楞纸箱' },
                      { value: '自动胶带封箱机', label: '自动胶带封箱机' },
                      { value: '重载木托盘', label: '重载木托盘' },
                      { value: '玻璃水杯', label: '玻璃水杯' },
                      { value: '不锈钢刀叉', label: '不锈钢刀叉' },
                    ]}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="适配机器人硬件型号" name="supportedHardware" rules={[{ required: true }]}>
                      <Select 
                        mode="multiple" 
                        placeholder="请选择支持的设备" 
                        options={[
                          { value: 'Galbot_2.2_RGBD', label: 'Galbot_2.2_RGBD (双臂轮式)' },
                          { value: 'Galbot_1.16_G2', label: 'Galbot_1.16_G2 (双臂重载)' },
                          { value: 'Lumos_FastUMI', label: 'Lumos_FastUMI (双臂手持)' },
                          { value: 'Franka_FR3', label: 'Franka_FR3 (桌面单臂)' },
                          { value: 'Air-SN201', label: 'Air-SN201 (轻量遥操)' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="遥控操作方式 (Teleop Interface)" name="teleopType">
                      <Select 
                        placeholder="请选择操作方式" 
                        options={[
                          { value: '双臂主从摇臂', label: '双臂主从摇臂 (Master-Slave)' },
                          { value: 'VR 遥控头显', label: 'VR 遥控头显 (VR Teleop)' },
                          { value: '数据手套动捕', label: '数据手套动捕 (Data Glove)' },
                          { value: '手持 FastUMI 夹爪', label: '手持 FastUMI 夹爪' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </FormSection>

              {/* Section 3: 标准子步骤拆解 (直通 taskinfo segments) */}
              <FormSection title="3. 标准子步骤时序切片模板 (Sub-goals / Segments Template)">
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    定义标准子动作拆解流，在标注工作台做时序分段时可**一键导入此模版**，自动输出规范的 `segments` 字段。
                  </Text>
                  <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddStep}>
                    添加步骤
                  </Button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {steps.map((step, idx) => (
                    <Card key={step.id} size="small" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <Row gutter={12} align="middle">
                        <Col span={2} style={{ textAlign: 'center' }}>
                          <Tag color="blue" style={{ fontWeight: 600, margin: 0 }}>
                            #{idx + 1}
                          </Tag>
                        </Col>
                        <Col span={6}>
                          <Input 
                            placeholder="步骤名称 (如：接近目标)" 
                            value={step.name} 
                            onChange={e => handleStepChange(idx, 'name', e.target.value)} 
                          />
                        </Col>
                        <Col span={8}>
                          <Input 
                            placeholder="英文子指令 (sub_instruction)" 
                            value={step.subInstruction} 
                            onChange={e => handleStepChange(idx, 'subInstruction', e.target.value)} 
                            style={{ fontFamily: 'monospace', color: '#1677ff' }}
                          />
                        </Col>
                        <Col span={7}>
                          <Input 
                            placeholder="关键终止判据 (如：夹爪闭合)" 
                            value={step.stopCondition} 
                            onChange={e => handleStepChange(idx, 'stopCondition', e.target.value)} 
                          />
                        </Col>
                        <Col span={1} style={{ textAlign: 'right' }}>
                          {steps.length > 1 && (
                            <Button 
                              type="text" 
                              danger 
                              size="small" 
                              icon={<MinusCircleOutlined />} 
                              onClick={() => handleRemoveStep(idx)} 
                            />
                          )}
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              </FormSection>

              {/* Section 4: 详细规程 Markdown */}
              <FormSection title="4. 详细作业规程说明 (Markdown 图文指引)">
                <Form.Item name="content" noStyle>
                  <TextArea 
                    rows={12} 
                    placeholder="# 1. 采集环境要求\n- 室内光照需保持在 500lux 以上...\n\n# 2. 动作标准\n- 机器人起始位置必须在物体正前方 30cm...\n- 抓取力度需保持在..." 
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                </Form.Item>
              </FormSection>
            </Col>

            {/* Right Column: 质检与附件配置 */}
            <Col span={8}>
              <FormSection title="质检必检项 Checklist">
                <Form.Item name="checks">
                  <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Checkbox value="1">
                      <Space direction="vertical" size={0}>
                        <Text strong>环境光照检查</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>光照度达标（≥500lux），无剧烈反光</Text>
                      </Space>
                    </Checkbox>
                    <Checkbox value="2">
                      <Space direction="vertical" size={0}>
                        <Text strong>动作连贯性与末端防抖</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>机械臂末端抖动 &lt; 2mm，运动轨迹平滑</Text>
                      </Space>
                    </Checkbox>
                    <Checkbox value="3">
                      <Space direction="vertical" size={0}>
                        <Text strong>物体抓取稳固度</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>物体夹取无掉落、倾斜或滑脱</Text>
                      </Space>
                    </Checkbox>
                    <Checkbox value="4">
                      <Space direction="vertical" size={0}>
                        <Text strong>时序动作闭环完整度</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>包含完整接近、抓取、运送与释放全流程</Text>
                      </Space>
                    </Checkbox>
                    <Checkbox value="5">
                      <Space direction="vertical" size={0}>
                        <Text strong>多相机视角无遮挡</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>手眼相机与头顶相机视野清晰完整</Text>
                      </Space>
                    </Checkbox>
                  </Checkbox.Group>
                </Form.Item>
              </FormSection>

              <FormSection title="附件与参考程序 (PDF / Docx)">
                <Form.Item name="pdf">
                  <Upload maxCount={1} accept=".pdf,.doc,.docx">
                    <Button icon={<UploadOutlined />} block>上传 SOP 附件档案</Button>
                  </Upload>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      供采集员在移动采集端或标注员在打标工作台随时悬浮查阅。
                    </Text>
                  </div>
                </Form.Item>
              </FormSection>

              <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0', marginTop: 16 }}>
                <Space align="start">
                  <CheckCircleOutlined style={{ color: '#16a34a', marginTop: 4 }} />
                  <div>
                    <Text strong style={{ color: '#15803d', fontSize: 13 }}>taskinfo 自动生成已就绪</Text>
                    <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                      发布该任务书后，后续以此为模板的所有采集与标注任务，均将在保存时自动合成下游 VLA 训练所需的标准化 taskinfo 元数据。
                    </div>
                  </div>
                </Space>
              </div>
            </Col>
          </Row>

          <ActionFooter>
            <Button style={{ width: 120 }} onClick={() => router.push('/collection/taskbooks')}>取消</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} style={{ width: 160 }}>
              {isEdit ? '保存修改' : '保存并发布'}
            </Button>
          </ActionFooter>
        </Form>
      </div>
    </MainLayout>
  );
}
