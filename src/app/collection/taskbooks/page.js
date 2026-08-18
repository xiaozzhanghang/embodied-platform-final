'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, Button, Card, Typography, Space, Tag, Input, Badge, 
  Select, Form, Tooltip, Row, Col, Modal, App, Progress, Statistic 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, 
  DownloadOutlined, EditOutlined, DeleteOutlined, RobotOutlined, 
  BookOutlined, CheckCircleOutlined, AppstoreOutlined, 
  ApiOutlined, ThunderboltOutlined, CopyOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { PageHeader, StatusTag, TableToolbar, TableToolbarActions } from '@/components/ui';

const { Title, Text, Paragraph } = Typography;

// Realistic Embodied AI SOP Taskbooks
const initialTaskbooks = [
  {
    key: '1',
    id: 'TB-超市场景采集规范 V1.0',
    code: 'TB-20260415-001',
    name: '超市场景物品货架抓取与托盘放置规范',
    instruction: 'pick snack from top shelf and place onto moving tray',
    project: 'InternalCommercial (内部-商业)',
    skillCategory: 'Pick & Place (抓取放置)',
    skillTagColor: 'blue',
    scene: '商业零售',
    objects: ['薯片盒', '饮料瓶', '移动托盘', '三层货架'],
    supportedHardware: ['Galbot_2.2_RGBD', 'Galbot_1.16_G2'],
    stepCount: 4,
    linkedCollectPlans: 2,
    linkedEpisodes: 105,
    version: 'V1.0',
    status: '已发布',
    creator: '天奇管理员',
    updateTime: '2026-04-15 11:30:00',
    createTime: '2026-04-10 09:00:00',
  },
  {
    key: '2',
    id: 'TB-货架抓取规范 V1.5',
    code: 'TB-20260415-002',
    name: '货架密集物品单臂位姿拾取规范',
    instruction: 'grasp beverage bottles with orientation alignment and place into crate',
    project: 'InternalCommercial (内部-商业)',
    skillCategory: 'Pick & Place (抓取放置)',
    skillTagColor: 'blue',
    scene: '商业零售',
    objects: ['饮料瓶', '收纳筐', '中层货架'],
    supportedHardware: ['Galbot_2.2_RGBD', 'Air-SN201'],
    stepCount: 3,
    linkedCollectPlans: 1,
    linkedEpisodes: 85,
    version: 'V1.5',
    status: '已发布',
    creator: '天奇管理员',
    updateTime: '2026-04-15 14:20:00',
    createTime: '2026-04-08 10:00:00',
  },
  {
    key: '3',
    id: 'TB-纸箱打包规范 V2.0',
    code: 'TB-20260414-001',
    name: '工业纸箱抓取封口与码垛入库规范',
    instruction: 'pick industrial box, seal with tape machine and stack on pallet',
    project: 'InternalIndustrial (内部-工业)',
    skillCategory: 'Packaging & Stacking (封装码垛)',
    skillTagColor: 'purple',
    scene: '工业制造',
    objects: ['瓦楞纸箱', '自动胶带封箱机', '重载木托盘'],
    supportedHardware: ['Galbot_2.2_RGBD', 'Lumos_FastUMI'],
    stepCount: 5,
    linkedCollectPlans: 2,
    linkedEpisodes: 1426,
    version: 'V2.0',
    status: '已发布',
    creator: 'zhangsan',
    updateTime: '2026-04-14 16:30:00',
    createTime: '2026-04-05 14:00:00',
  },
  {
    key: '4',
    id: 'TB-厨房操作规范 V1.2',
    code: 'TB-20260414-002',
    name: '厨房环境双臂协同开闭柜门与餐具移位规范',
    instruction: 'bimanual opening of cabinet door and transferring glass cup to countertop',
    project: 'ExternalXupaosi (外部合作)',
    skillCategory: 'Bimanual Manipulation (双臂协同)',
    skillTagColor: 'magenta',
    scene: '家庭厨房',
    objects: ['双门吊柜', '玻璃水杯', '沥水架'],
    supportedHardware: ['Lumos_FastUMI'],
    stepCount: 4,
    linkedCollectPlans: 1,
    linkedEpisodes: 0,
    version: 'V1.2',
    status: '已发布',
    creator: '天奇管理员',
    updateTime: '2026-04-14 11:00:00',
    createTime: '2026-04-02 09:30:00',
  },
  {
    key: '5',
    id: 'TB-桌面整理采集规范 V1.0',
    code: 'TB-20260413-001',
    name: '桌面通用餐具分类与收纳托盘规整规范',
    instruction: 'sort desktop utensils and place symmetrically into partitioned tray',
    project: 'SimulatedCollection (模拟采集)',
    skillCategory: 'Object Sorting (分类整理)',
    skillTagColor: 'cyan',
    scene: '模拟实验室',
    objects: ['不锈钢刀叉', '陶瓷汤匙', '分隔餐盘'],
    supportedHardware: ['Franka_FR3', 'Air-SN201'],
    stepCount: 4,
    linkedCollectPlans: 1,
    linkedEpisodes: 0,
    version: 'V1.0',
    status: '草稿',
    creator: 'cy00831',
    updateTime: '2026-04-13 18:00:00',
    createTime: '2026-04-13 18:00:00',
  },
];

export default function TaskbooksPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [data, setData] = useState(initialTaskbooks);
  const [searchName, setSearchName] = useState('');
  const [filterSkill, setFilterSkill] = useState(null);
  const [filterScene, setFilterScene] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [tableDensity, setTableDensity] = useState('middle');
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Stats calculation
  const totalCount = data.length;
  const publishedCount = data.filter(d => d.status === '已发布').length;
  const draftCount = data.filter(d => d.status === '草稿').length;
  const totalLinkedPlans = data.reduce((acc, cur) => acc + cur.linkedCollectPlans, 0);

  const filteredData = data.filter(item => {
    const matchName = !searchName || item.name.includes(searchName) || item.id.includes(searchName) || item.instruction.toLowerCase().includes(searchName.toLowerCase());
    const matchSkill = !filterSkill || item.skillCategory.includes(filterSkill);
    const matchScene = !filterScene || item.scene === filterScene;
    const matchStatus = !filterStatus || item.status === filterStatus;
    return matchName && matchSkill && matchScene && matchStatus;
  });

  const columns = [
    { 
      title: '任务书标识 / 编号', 
      dataIndex: 'id', 
      key: 'id', 
      width: 210,
      fixed: 'left',
      render: (id, r) => (
        <div>
          <Text strong style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => router.push(`/collection/taskbooks/detail/${encodeURIComponent(id)}`)}>
            {id}
          </Text>
          <div style={{ fontSize: 12, color: '#8c8c8c', fontFamily: 'monospace' }}>
            {r.code}
          </div>
        </div>
      )
    },
    { 
      title: '任务书名称与标准动作指令 (Language Instruction)', 
      dataIndex: 'name', 
      key: 'name', 
      width: 340,
      render: (name, r) => (
        <div>
          <Text strong style={{ color: '#1e293b' }}>{name}</Text>
          <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag color="geekblue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px', margin: 0 }}>Prompt</Tag>
            <span>"{r.instruction}"</span>
          </div>
        </div>
      )
    },
    { 
      title: '所属项目', 
      dataIndex: 'project', 
      key: 'project', 
      width: 170,
      ellipsis: true,
      render: (p) => <Text style={{ color: '#475569' }}>{p}</Text>
    },
    { 
      title: '技能分类', 
      dataIndex: 'skillCategory', 
      key: 'skillCategory', 
      width: 160,
      render: (cat, r) => <Tag color={r.skillTagColor}>{cat}</Tag>
    },
    { 
      title: '场景类型', 
      dataIndex: 'scene', 
      key: 'scene', 
      width: 110,
      render: (s) => <Tag color="default">{s}</Tag>
    },
    { 
      title: '涉及目标物体', 
      dataIndex: 'objects', 
      key: 'objects', 
      width: 200,
      render: (objs) => (
        <Space size={[4, 4]} wrap>
          {objs.map((o, idx) => (
            <Tag key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: 4, margin: 0, fontSize: 11 }}>
              {o}
            </Tag>
          ))}
        </Space>
      )
    },
    { 
      title: '支持硬件设备', 
      dataIndex: 'supportedHardware', 
      key: 'supportedHardware', 
      width: 160,
      render: (hws) => (
        <Space size={2} direction="vertical">
          {hws.map((h, i) => (
            <Text key={i} style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>• {h}</Text>
          ))}
        </Space>
      )
    },
    { 
      title: '版本号', 
      dataIndex: 'version', 
      key: 'version', 
      width: 85,
      align: 'center',
      render: (v) => <Tag color="blue" style={{ fontWeight: 600 }}>{v}</Tag> 
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      align: 'center',
      render: (s) => <StatusTag status={s} />
    },
    { 
      title: '关联计划', 
      dataIndex: 'linkedCollectPlans', 
      key: 'linkedCollectPlans', 
      width: 100,
      align: 'center',
      render: (cnt) => (
        <Badge count={cnt} style={{ backgroundColor: cnt > 0 ? '#52c41a' : '#d9d9d9' }} />
      )
    },
    { title: '更新时间', dataIndex: 'updateTime', key: 'updateTime', width: 160 },
    {
      title: '操作', 
      key: 'action', 
      width: 220, 
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            style={{ padding: 0 }} 
            onClick={() => router.push(`/collection/taskbooks/detail/${encodeURIComponent(record.id)}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            style={{ padding: 0 }} 
            onClick={() => router.push(`/collection/taskbooks/create?mode=edit&id=${encodeURIComponent(record.id)}`)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<PlayCircleOutlined />} 
            style={{ padding: 0, color: '#52c41a' }}
            onClick={() => router.push(`/collection/collection-tasks/create?taskbook=${encodeURIComponent(record.id)}`)}
          >
            发起采集
          </Button>
          <Button 
            type="link" 
            danger 
            size="small" 
            icon={<DeleteOutlined />} 
            style={{ padding: 0 }} 
            onClick={() => {
              Modal.confirm({ 
                title: `确认删除任务书 [${record.id}]？`, 
                content: '删除后，已关联的采集计划仍将保留历史快照，但无法新建以此任务书为模板的新计划。', 
                okText: '确定删除', 
                okType: 'danger', 
                cancelText: '取消', 
                onOk: () => {
                  setData(prev => prev.filter(d => d.key !== record.key));
                  message.success(`已删除任务书 [${record.id}]`);
                } 
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    },
  ];

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="任务书"
          description="定义具身智能机器人的动作规范、自然语言指令 (Language Instruction)、目标物体与子步骤切分模板，直接作为下游 taskinfo 与模型训练的基准源头。"
          breadcrumbs={[{ title: '首页' }, { title: '任务管理' }, { title: '任务书' }]}
        />

        {/* Filter Row */}
        <div className="ui-form-section">
          <Form layout="inline">
            <Row gutter={[12, 12]} style={{ width: '100%' }}>
              <Col>
                <Input 
                  placeholder="搜索任务书名称 / ID / 英文指令" 
                  style={{ width: 260 }} 
                  value={searchName} 
                  onChange={e => setSearchName(e.target.value)} 
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
                  allowClear 
                />
              </Col>
              <Col>
                <Select 
                  placeholder="技能分类" 
                  style={{ width: 180 }} 
                  allowClear 
                  value={filterSkill} 
                  onChange={setFilterSkill}
                  options={[
                    { label: '抓取放置 (Pick & Place)', value: 'Pick & Place' },
                    { label: '封装码垛 (Packaging)', value: 'Packaging' },
                    { label: '双臂协同 (Bimanual)', value: 'Bimanual' },
                    { label: '分类整理 (Sorting)', value: 'Sorting' },
                  ]}
                />
              </Col>
              <Col>
                <Select 
                  placeholder="适用场景" 
                  style={{ width: 140 }} 
                  allowClear 
                  value={filterScene} 
                  onChange={setFilterScene}
                  options={[
                    { label: '商业零售', value: '商业零售' },
                    { label: '工业制造', value: '工业制造' },
                    { label: '家庭厨房', value: '家庭厨房' },
                    { label: '模拟实验室', value: '模拟实验室' },
                  ]}
                />
              </Col>
              <Col>
                <Select 
                  placeholder="发布状态" 
                  style={{ width: 130 }} 
                  allowClear 
                  value={filterStatus} 
                  onChange={setFilterStatus}
                  options={[
                    { label: '已发布', value: '已发布' },
                    { label: '草稿', value: '草稿' },
                  ]}
                />
              </Col>
              <Col>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                      setSearchName('');
                      setFilterSkill(null);
                      setFilterScene(null);
                      setFilterStatus(null);
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </div>

        {/* Main Table Card */}
        <Card className="ui-table-card" styles={{ body: { padding: 0 } }}>
          <TableToolbar
            title="任务书列表"
            count={filteredData.length}
            actions={[
              <Button key="create" type="primary" icon={<PlusOutlined />} onClick={() => router.push('/collection/taskbooks/create')}>
                新建任务书
              </Button>,
              <TableToolbarActions
                key="tableActions"
                columns={columns}
                density={tableDensity}
                onDensityChange={setTableDensity}
                hiddenColumns={hiddenColumns}
                onHiddenColumnsChange={setHiddenColumns}
                onRefresh={() => message.success('数据已刷新')}
              />
            ]}
          />

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            columns={columns.filter(col => !hiddenColumns.includes(col.key))}
            dataSource={filteredData}
            scroll={{ x: 1800 }}
            size={tableDensity}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 套任务书` }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
