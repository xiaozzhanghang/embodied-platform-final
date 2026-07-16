'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, Space, Card, Typography, Breadcrumb, Tag, 
  App, Row, Col, Avatar, Tooltip, Input, Divider, Form, Select, Tabs
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, LayoutOutlined,
  ShoppingOutlined, ToolOutlined, RestOutlined,
  SkinOutlined, ExperimentOutlined, DeleteOutlined,
  EditOutlined, PlayCircleOutlined, ReloadOutlined, DownOutlined, UpOutlined,
  NodeIndexOutlined, FileTextOutlined, FolderOpenOutlined, UserOutlined, TagOutlined
} from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const defaultAnnoTemplates = [
  {
    id: 'tpl_default_1',
    name: '🍽️ 餐厅餐盘整理标准标注模版',
    desc: '覆盖完整的双臂就餐收拾工序，包括托盘抓取、餐盘理顺、餐叉摆放，适配鹿鸣双臂机器人。',
    stepCount: 9,
    creator: '系统内置',
    createTime: '2026-07-12 10:15:30',
    steps: [
      { text: '右手从置物架抓取托盘并放置在餐桌上', startFrame: 0, endFrame: 15 },
      { text: '左手拿起杯子平稳放置到托盘边缘', startFrame: 15, endFrame: 30 },
      { text: '右手从餐桌抓取待收碗盘并叠放', startFrame: 30, endFrame: 45 },
      { text: '双手端起装载碗盘的托盘至工作区', startFrame: 45, endFrame: 60 },
      { text: '右手取消毒布快速擦拭餐桌残留油渍', startFrame: 60, endFrame: 75 },
      { text: '右手放置餐盘到清洗机架格内', startFrame: 75, endFrame: 90 },
      { text: '右手拿起备用刀叉整理归置', startFrame: 90, endFrame: 100 },
      { text: '左手协助校正主干刀叉位置', startFrame: 100, endFrame: 110 },
      { text: '双手清洁理顺并退回初始安全点', startFrame: 110, endFrame: 120 }
    ]
  },
  {
    id: 'tpl_default_2',
    name: '📦 工业打包贴标标准标注模版',
    desc: '标准的6工步纸箱开箱封底及贴标工段步骤，适配Galbot真机采集数据。',
    stepCount: 6,
    creator: '系统内置',
    createTime: '2026-07-14 16:40:00',
    steps: [
      { text: '双手抓取纸箱并开箱定位', startFrame: 0, endFrame: 20 },
      { text: '右手取底部泡沫垫并放入纸箱', startFrame: 20, endFrame: 40 },
      { text: '右手抓取核心金属支架入箱', startFrame: 40, endFrame: 65 },
      { text: '左手取顶部泡沫垫覆盖定位', startFrame: 65, endFrame: 80 },
      { text: '双手折叠两侧箱盖合拢', startFrame: 80, endFrame: 100 },
      { text: '双手持胶带机封口封箱', startFrame: 100, endFrame: 120 }
    ]
  }
];

export default function TaskTemplatesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState('task');
  const [annoTemplates, setAnnoTemplates] = useState([]);

  // 加载已保存标注模版
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('embodied_anno_templates');
      if (saved) {
        try {
          setAnnoTemplates(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      } else {
        setAnnoTemplates(defaultAnnoTemplates);
        localStorage.setItem('embodied_anno_templates', JSON.stringify(defaultAnnoTemplates));
      }
    }
  }, [activeTab]);

  const handleDeleteAnnoTemplate = (id, name) => {
    modal.confirm({
      title: '确定删除该标注模版吗？',
      content: `删除后，标注工作台将无法在批量标注中套用此模版。此操作不可恢复。`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const updated = annoTemplates.filter(t => t.id !== id);
        setAnnoTemplates(updated);
        localStorage.setItem('embodied_anno_templates', JSON.stringify(updated));
        message.success(`标注模版「${name}」已删除`);
      }
    });
  };

  const mockTemplates = [
    {
      key: '1',
      name: '桌面整理',
      desc: '书籍、收纳盒、垃圾清理等桌面物品整理任务',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <ShoppingOutlined />,
      bgColor: '#e6f4ff',
      iconColor: '#1677ff'
    },
    {
      key: '2',
      name: '衣物折叠',
      desc: '叠牛仔裤等柔性物体折叠操作，步骤多、精度高',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <SkinOutlined />,
      bgColor: '#f0f5ff',
      iconColor: '#2f54eb'
    },
    {
      key: '3',
      name: '物品分拣',
      desc: '分拣物品、电子产品，按类别放入对应区域',
      type: '工业数据',
      device: 'galbot_2.2_R',
      icon: <LayoutOutlined />,
      bgColor: '#fff7e6',
      iconColor: '#fa8c16'
    },
    {
      key: '4',
      name: '工业组装',
      desc: '组装管道支架等精密组装任务，需高精度对准',
      type: '工业数据',
      device: 'galbot_2.2_R',
      icon: <ToolOutlined />,
      bgColor: '#fff1f0',
      iconColor: '#f5222d'
    },
    {
      key: '5',
      name: '零售商品操作',
      desc: '零售薄饼、绿茶、茶里王等商品的货架操作',
      type: '零售数据',
      device: 'galbot_2.2_RGB',
      icon: <ExperimentOutlined />,
      bgColor: '#f6ffed',
      iconColor: '#52c41a'
    },
    {
      key: '6',
      name: '清洁操作',
      desc: '清理台面垃圾等非结构化目标清洁任务',
      type: '服务数据',
      device: 'galbot_2.2_RGB',
      icon: <RestOutlined />,
      bgColor: '#f9f0ff',
      iconColor: '#722ed1'
    }
  ];

  const actionTemplates = [
    {
      key: 'act_1',
      name: '📦 工业纸箱打包封装与装箱模版',
      desc: '标准的工业包装与物流操作，支持结构化技能映射与自然语言描述，包含6个动作步骤。',
      type: '工业数据',
      device: 'galbot',
      stepCount: 6,
      steps: [
        '展开纸箱并封底 (Unfold box and seal bottom)',
        '放入底部泡沫垫 (Place bottom foam pad)',
        '放入工厂部件 (Place factory components)',
        '放入顶部泡沫垫 (Place top foam pad)',
        '折叠合拢箱盖 (Fold box lids)',
        '顶部封箱 (Seal top)'
      ]
    },
    {
      key: 'act_2',
      name: '📚 桌面书籍整理与摆放模版',
      desc: '面向家庭/办公室的服务机器人桌面物品理顺模板，包含4个动作步骤。',
      type: '服务数据',
      device: 'galbot',
      stepCount: 4,
      steps: [
        '右手识别定位目标书籍',
        '右手靠近目标书籍',
        '右手抓取目标书籍',
        '右手平稳放置在目标桌面上'
      ]
    },
    {
      key: 'act_3',
      name: '🍽️ 餐盘清理与协同搬运模版',
      desc: '用于餐饮或居家场景中待收拾的碗盘碟器皿抓取及运送，包含4个操作。',
      type: '服务数据',
      device: '鹿鸣/galbot',
      stepCount: 4,
      steps: [
        '双手识别餐盘位置',
        '双手避障靠近餐盘',
        '双手牢固夹紧抓取',
        '双手平稳放置指定盘区'
      ]
    },
    {
      key: 'act_4',
      name: '🚪 抽屉开关与取物操作模版',
      desc: '操纵滑轨结构体家具，支持左右/上下端手爪交互及微调，包含4个步骤。',
      type: '服务数据',
      device: 'galbot',
      stepCount: 4,
      steps: [
        '右手识别抽屉把手',
        '右手把手贴合对准',
        '右手拉开抽屉',
        '右手松开把手复位'
      ]
    }
  ];

  return (
    <MainLayout>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '模板中心' }]} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>模板中心</Title>
            <Text type="secondary">管理采集任务模版、预设动作模版、以及从标注工作台导出的标注模版。</Text>
          </div>
          {activeTab === 'task' && (
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => router.push('/collection/templates/create')}>
              创建新模板
            </Button>
          )}
        </div>
      </div>

      {/* Tab 分类切换 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '4px 16px', marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'task', label: `任务模版 (${mockTemplates.length})` },
            { key: 'action', label: `动作模版 (${actionTemplates.length})` },
            { key: 'annotation', label: `标注模版 (${annoTemplates.length})` }
          ]}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      {activeTab === 'task' && (
        <>
          <Card 
            style={{ marginBottom: 24, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
            styles={{ body: { padding: '24px 24px 16px' } }}
          >
            <QueryFilter
                submitter={{
                    submitButtonProps: { icon: <SearchOutlined /> },
                    resetButtonProps: { icon: <ReloadOutlined /> },
                }}
            >
                <ProFormText name="name" label="模板名称" placeholder="搜索模板名称..." />
                <ProFormSelect name="type" label="模板类型" placeholder="全部类型" options={[{label:'服务数据', value:'service'}, {label:'工业数据', value:'industry'}]} />
                <ProFormText name="creator" label="创建人" placeholder="请输入创建人" />
            </QueryFilter>
          </Card>

          <Row gutter={[24, 24]}>
            {mockTemplates.map((tpl) => (
              <Col span={8} key={tpl.key}>
                <Card 
                  hoverable 
                  style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{ padding: '24px 24px 16px' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <Avatar 
                        size={48} 
                        icon={tpl.icon} 
                        style={{ backgroundColor: tpl.bgColor, color: tpl.iconColor, flexShrink: 0 }} 
                      />
                      <div>
                        <Title level={5} style={{ margin: '0 0 4px 0', fontSize: 16 }}>{tpl.name}</Title>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', minHeight: 36 }}>
                          {tpl.desc}
                        </Text>
                      </div>
                    </div>
                    
                    <Space size={8}>
                      <Tag color="blue" variant="filled" style={{ fontSize: 11 }}>{tpl.type}</Tag>
                      <Tag variant="filled" style={{ fontSize: 11 }}>{tpl.device}</Tag>
                    </Space>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    borderTop: '1px solid #f0f0f0', 
                    background: '#fafafa'
                  }}>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer', borderRight: '1px solid #f0f0f0' }}
                      className="hover-action"
                      onClick={() => router.push('/collection/tasks/create')}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>在任务中心使用</Text>
                    </div>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer', borderRight: '1px solid #f0f0f0' }}
                      className="hover-action"
                      onClick={() => router.push(`/collection/templates/create?id=${tpl.key}`)}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>编辑</Text>
                    </div>
                    <div 
                      style={{ flex: 1, textAlign: 'center', padding: '12px 0', cursor: 'pointer' }}
                      className="hover-action"
                      onClick={() => modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>删除</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {activeTab === 'action' && (
        <Row gutter={[24, 24]}>
          {actionTemplates.map((tpl) => (
            <Col span={12} key={tpl.key}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text strong style={{ fontSize: 14 }}>{tpl.name}</Text>
                    <Tag color="purple">{tpl.type}</Tag>
                  </div>
                }
                style={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.01)' }}
              >
                <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>{tpl.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <Tag color="cyan">步骤数: {tpl.stepCount}</Tag>
                  <Tag>适配设备: {tpl.device}</Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 8 }}>预设SOP动作序列流程：</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    {tpl.steps.map((st, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
                          {idx + 1}
                        </span>
                        <span style={{ color: '#1e293b', fontWeight: 500 }}>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {activeTab === 'annotation' && (
        <div>
          {annoTemplates.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <FolderOpenOutlined style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
              <Title level={5} style={{ margin: 0, color: '#64748b' }}>暂无自定义标注模版</Title>
              <Text type="secondary" style={{ fontSize: 13, marginTop: 6, display: 'block' }}>
                当标注员在“标注工作台”标完某条具体的动作数据后，可以点击“生成标注模版”按钮，成功后数据即会在此集中展现。
              </Text>
              <Button type="primary" style={{ marginTop: 16 }} onClick={() => router.push('/annotation/audit')}>
                前往标注工作台
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {annoTemplates.map((tpl) => (
                <Col span={12} key={tpl.id}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Text strong style={{ fontSize: 14 }}>{tpl.name}</Text>
                        <Button 
                          type="text" 
                          danger 
                          size="small" 
                          icon={<DeleteOutlined />} 
                          onClick={() => handleDeleteAnnoTemplate(tpl.id, tpl.name)}
                        >
                          删除模版
                        </Button>
                      </div>
                    }
                    style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  >
                    <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>{tpl.desc}</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <Tag color="green">标注模版</Tag>
                      <Tag color="blue">动作数: {tpl.stepCount}</Tag>
                      <Tag color="orange">创建时间: {tpl.createTime}</Tag>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Text strong style={{ fontSize: 12, color: '#334155', display: 'block', marginBottom: 8 }}>已封存动作帧区间数据：</Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #d1fae5' }}>
                        {tpl.steps.map((st, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
                                {idx + 1}
                              </span>
                              <span style={{ color: '#065f46', fontWeight: 500 }}>{st.text}</span>
                            </div>
                            <Tag color="emerald" style={{ margin: 0, background: '#10b981', color: '#fff', border: 'none', fontSize: 11 }}>
                              {st.startFrame} - {st.endFrame} 帧
                            </Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      <style jsx>{`
        .hover-action:hover {
          background: #f0f0f0;
        }
        .hover-action:hover span {
          color: #1677ff !important;
        }
      `}</style>
    </MainLayout>
  );
}
