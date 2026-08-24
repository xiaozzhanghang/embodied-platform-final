'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Button, Typography, Space, Card, Descriptions, 
  Tag, Divider, Row, Col, List, Empty, Table, Badge, Alert 
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, FilePdfOutlined, 
  ProjectOutlined, CheckCircleFilled, PlayCircleOutlined,
  CopyOutlined, ThunderboltOutlined, BookOutlined,
  BranchesOutlined, RobotOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { FormSection, PageHeader } from '@/components/ui';
import { STATIC_ROUTES, buildStaticHref } from '@/lib/staticRoutes';

const { Title, Text, Paragraph } = Typography;

export default function TaskbookDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  // Mock metadata lookup
  const taskbook = {
    id: id,
    code: id.includes('TB-2026') ? id : 'TB-20260415-001',
    name: id.includes('超市') ? '超市场景物品货架抓取与托盘放置规范' : (id.includes('纸箱') ? '工业纸箱抓取封口与码垛入库规范' : `${id} 详细规程`),
    instruction: id.includes('超市') 
      ? 'pick snack from top shelf and place onto moving tray' 
      : (id.includes('纸箱') 
        ? 'pick industrial box, seal with tape machine and stack on pallet'
        : 'bimanual manipulation of target objects in designated environment'),
    project: id.includes('工业') ? 'InternalIndustrial (内部-工业)' : 'InternalCommercial (内部-商业)',
    skillCategory: id.includes('工业') ? 'Packaging & Stacking (封装码垛)' : 'Pick & Place (抓取放置)',
    skillTagColor: id.includes('工业') ? 'purple' : 'blue',
    scene: id.includes('工业') ? '工业制造' : '商业零售',
    version: 'V1.0',
    status: '已发布',
    creator: '天奇管理员',
    createTime: '2026-04-10 09:00:00',
    updateTime: '2026-04-15 11:30:00',
    goal: '规范机器人在货架抓取盒装、瓶装等多形态商品并平稳放入移动托盘的全套动作控制与质量评测基准。',
    objects: ['薯片盒', '饮料瓶', '移动托盘', '三层货架'],
    supportedHardware: ['Galbot_2.2_RGBD', 'Galbot_1.16_G2'],
    teleopType: '双臂主从遥控手柄 (Master-Slave)',
    steps: [
      { id: 1, name: '接近目标物体', subInstruction: 'move arm towards the target object', stopCondition: '夹爪末端距离物体表面小于 3cm' },
      { id: 2, name: '稳定夹取物体', subInstruction: 'grasp object firmly with controlled torque', stopCondition: '夹爪力传感器反馈达标，位姿无滑动' },
      { id: 3, name: '搬运与位姿调整', subInstruction: 'transfer object along collision-free trajectory', stopCondition: '提升高度达到 15cm，避开障碍物' },
      { id: 4, name: '平稳放置与释放', subInstruction: 'place object onto designated area and release gripper', stopCondition: '物体平稳着陆托盘，夹爪完全复位' },
    ],
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
    checkpoints: [
      '环境光照度达标（≥500lux），无剧烈反光',
      '机械臂末端抖动 < 2mm，运动轨迹平滑',
      '物体夹取无掉落、倾斜或滑脱',
      '包含完整接近、抓取、运送与释放全流程',
      '手眼相机与头顶相机视野清晰完整'
    ],
    linkedPlans: [
      { id: 'COLL-20260415-001', name: '超市场景物品物理采集计划', planCount: 100, actualCount: 83, status: '采集中' },
      { id: 'COLL-20260415-002', name: '商业中心货架商品补充采集', planCount: 50, actualCount: 50, status: '已完成' },
    ]
  };

  return (
    <MainLayout>
      <div className="ui-page ui-detail-page">
        <PageHeader
          title={taskbook.name}
          description={`任务书编号: ${taskbook.code} · 版本 ${taskbook.version} · 发布状态: ${taskbook.status}`}
          breadcrumbs={[
            { title: '首页' },
            { title: '任务管理' },
            { title: '任务书 (SOP)', href: '/collection/taskbooks' },
            { title: '任务书详情' },
          ]}
          back={() => router.push('/collection/taskbooks')}
          extra={[
            <Button key="pdf" icon={<FilePdfOutlined />} danger>
              下载 PDF 规程
            </Button>,
            <Button 
              key="collect" 
              type="default"
              icon={<PlayCircleOutlined />} 
              style={{ color: '#52c41a', borderColor: '#b7eb8f' }}
              onClick={() => router.push(buildStaticHref('/collection/collection-tasks/create', { taskbook: taskbook.id }))}
            >
              发起采集计划
            </Button>,
            <Button 
              key="edit" 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => router.push(buildStaticHref('/collection/taskbooks/create', { mode: 'edit', id: taskbook.id }))}
            >
              编辑任务书
            </Button>,
          ]}
        />

        <Row gutter={24}>
          <Col span={16}>
            {/* 1. 核心动作语义与 Prompt */}
            <FormSection title="1. 核心动作语义与 VLA 语言指令 (Language Instruction)">
              <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Model Prompt / Language Instruction
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0958d9', fontFamily: 'monospace', marginTop: 4 }}>
                  "{taskbook.instruction}"
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  💡 此指令将在标注工作台保存时全自动注入到每条 Episode 的 `taskinfo.json` 中。
                </div>
              </div>

              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="所属项目">{taskbook.project}</Descriptions.Item>
                <Descriptions.Item label="技能分类"><Tag color={taskbook.skillTagColor}>{taskbook.skillCategory}</Tag></Descriptions.Item>
                <Descriptions.Item label="适用场景">{taskbook.scene}</Descriptions.Item>
                <Descriptions.Item label="版本号"><Tag color="blue">{taskbook.version}</Tag></Descriptions.Item>
                <Descriptions.Item label="创建人">{taskbook.creator}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{taskbook.updateTime}</Descriptions.Item>
                <Descriptions.Item label="核心目标" span={2}>{taskbook.goal}</Descriptions.Item>
              </Descriptions>
            </FormSection>

            {/* 2. 目标实体与设备硬件约束 */}
            <FormSection title="2. 目标实体与设备硬件约束">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="目标物体库" span={2}>
                  <Space size={[6, 6]} wrap>
                    {taskbook.objects.map((obj, i) => (
                      <Tag key={i} color="processing" style={{ margin: 0 }}>{obj}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="适配机器人硬件" span={2}>
                  <Space size={[6, 6]} wrap>
                    {taskbook.supportedHardware.map((hw, i) => (
                      <Tag key={i} color="geekblue" style={{ fontFamily: 'monospace', margin: 0 }}>{hw}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="遥控操作方式" span={2}>
                  {taskbook.teleopType}
                </Descriptions.Item>
              </Descriptions>
            </FormSection>

            {/* 3. 标准子步骤时序切片模板 */}
            <FormSection title="3. 标准子步骤时序切片模板 (Sub-goals / Segments Template)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {taskbook.steps.map((step, idx) => (
                  <Card key={step.id} size="small" style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <Row gutter={12} align="middle">
                      <Col span={2} style={{ textAlign: 'center' }}>
                        <Tag color="blue" style={{ fontWeight: 600, margin: 0 }}>#{idx + 1}</Tag>
                      </Col>
                      <Col span={6}>
                        <Text strong style={{ color: '#1e293b' }}>{step.name}</Text>
                      </Col>
                      <Col span={8}>
                        <Text style={{ fontFamily: 'monospace', color: '#1677ff', fontSize: 12 }}>
                          {step.subInstruction}
                        </Text>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          判据: {step.stopCondition}
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </FormSection>

            {/* 4. 详细规程 Markdown */}
            <FormSection title="4. 详细操作规程说明 (Markdown SOP 指引)">
              <div style={{ padding: '16px 20px', background: '#fafafa', borderRadius: 8, border: '1px solid #e2e8f0', minHeight: 280 }}>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-all', 
                  fontFamily: 'inherit',
                  lineHeight: '1.8',
                  color: '#334155',
                  margin: 0
                }}>
                  {taskbook.content}
                </pre>
              </div>
            </FormSection>
          </Col>

          {/* Right Column: 质检必检项 & 关联执行计划 */}
          <Col span={8}>
            <FormSection title="质检必检项 Checklist">
              <List
                dataSource={taskbook.checkpoints}
                renderItem={(item) => (
                  <List.Item style={{ padding: '10px 0' }}>
                    <Space align="start">
                      <CheckCircleFilled style={{ color: '#52c41a', marginTop: 3 }} />
                      <Text style={{ fontSize: 13 }}>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </FormSection>

            <FormSection title="已关联的采集计划">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {taskbook.linkedPlans.map((plan) => (
                  <Card key={plan.id} size="small" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => router.push(buildStaticHref(STATIC_ROUTES.taskDetail, { id: plan.id }))}>
                        {plan.id}
                      </Text>
                      <Tag color={plan.status === '已完成' ? 'success' : 'processing'}>{plan.status}</Tag>
                    </div>
                    <div style={{ fontSize: 13, color: '#1e293b', marginTop: 4 }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      采集进度: {plan.actualCount} / {plan.planCount} 条
                    </div>
                  </Card>
                ))}
              </div>
            </FormSection>

            <FormSection title="SOP 附件文档">
              <div style={{ 
                height: 140, 
                background: '#f8fafc', 
                borderRadius: 8, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                border: '1px dashed #cbd5e1'
              }}>
                <FilePdfOutlined style={{ fontSize: 36, color: '#ff4d4f', marginBottom: 8 }} />
                <Text strong style={{ fontSize: 13 }}>{taskbook.code}_Standard_SOP.pdf</Text>
                <Button type="link" size="small" style={{ marginTop: 4 }}>点击在线预览</Button>
              </div>
            </FormSection>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
