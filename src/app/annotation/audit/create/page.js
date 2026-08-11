'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Tag,
  Space,
  Input,
  Card,
  Typography,
  Breadcrumb,
  Progress,
  App,
  Row,
  Col,
  Tooltip,
  Badge,
  Form,
  Select,
  InputNumber,
  Divider,
  Alert,
  Radio
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  DatabaseOutlined,
  UserOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  FileAddOutlined,
  InfoCircleOutlined,
  InfoCircleFilled,
  SettingOutlined,
  TeamOutlined,
  OrderedListOutlined,
  LinkOutlined,
  EditOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { ActionFooter, FormSection, PageHeader } from '@/components/ui';

const { Title, Text } = Typography;
const { Option } = Select;

const ANNO_TYPES = ['框标注', '点标注', '范围标注', '范围&框标注'];
const DEVICE_TYPES = ['galbot', '鹿鸣', '真机', '仿真机'];

const projectNames = [
  '垃圾分类抓取项目',
  'SimulatedCollection(模拟采集) sin',
  '天奇-餐盘整理任务',
  'Galbot-厨房场景',
  '银河 v2.1 仿真测试',
  '鹿鸣高频协同抓取'
];

const taskbooks = [
  'TB-垃圾分类',
  'TB-抓取红色方块',
  'TB-餐盘整理',
  'TB-物品摆放'
];

const people = ['张三', '李四', '王五', '赵六', '陈七', '孙八', '周九', '吴十', '郑十一'];

// 已采集未标注的数据源列表（关联自数据资产目录）
const collectedDataSources = [
  {
    value: 'catalog_1',
    label: '桌面书籍整理 (organize_books_on_the_table) [ID: 1b3e56c1b...] (银河 v2.1, 仿真数据)',
    project: '银河 v2.1 仿真测试',
    taskbook: 'TB-物品摆放',
    taskName: '桌面书籍整理_仿真任务',
    dataCount: 150,
    deviceType: '仿真机',
    steps: [
      { arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
      { arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' },
      { arm: '右手 (Right Arm)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '右手识别并定位桌上的目标书籍' },
      { text: '右手避障缓慢靠近书籍' },
      { text: '右手牢固夹紧并抓取书籍' },
      { text: '右手将书籍平稳放置在目标桌面上释放' }
    ]
  },
  {
    value: 'catalog_2',
    label: '鹿鸣双臂手眼协同动作采集 (session_028) [ID: session_028_6f8...] (鹿鸣 v1.0, 真实数据)',
    project: '鹿鸣高频协同抓取',
    taskbook: 'TB-餐盘整理',
    taskName: '鹿鸣手眼协同采集_028',
    dataCount: 200,
    deviceType: '鹿鸣',
    steps: [
      { arm: '双手 (Dual Arms)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '双手 (Dual Arms)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '双手识别并定位桌上的待整理餐盘' },
      { text: '双手避障靠近餐盘' },
      { text: '双手牢固夹紧抓取餐盘' },
      { text: '双手平稳将餐盘移至指定放置区域' }
    ]
  },
  {
    value: 'catalog_3',
    label: '鹿鸣双手臂动作标定测试 (session_029) [ID: session_029_6f8...] (鹿鸣 v1.0, 真实数据)',
    project: '鹿鸣高频协同抓取',
    taskbook: 'TB-餐盘整理',
    taskName: '鹿鸣手臂标定测试_029',
    dataCount: 160,
    deviceType: '鹿鸣',
    steps: [
      { arm: '双手 (Dual Arms)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '双手 (Dual Arms)', skill: '旋转', object: '目标物品', goal: '扭转至角度' },
      { arm: '双手 (Dual Arms)', skill: '松开', object: '目标物品', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '双手识别目标物品并确认位置' },
      { text: '双手将物品旋转至指定包装/装配角度' },
      { text: '双手在指定位置稳定松开释放' }
    ]
  },
  {
    value: 'catalog_4',
    label: '工业纸箱打包封装与装箱任务 (session_175_mov) [ID: session_175_box...] (galbot, 真实数据)',
    project: '垃圾分类抓取项目',
    taskbook: 'TB-物品摆放',
    taskName: '纸箱打包装箱_session_175',
    dataCount: 120,
    deviceType: 'galbot',
    steps: [
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '纸箱', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '工厂部件', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '纸箱', goal: '推拉合拢' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '胶带封装器', goal: '对齐插槽' }
    ],
    naturalSteps: [
      { text: '展开纸箱并封底 (Unfold box and seal bottom)' },
      { text: '放入底部泡沫垫 (Place bottom foam pad)' },
      { text: '放入工厂部件 (Place factory components/metal brackets)' },
      { text: '放入顶部泡沫垫 (Place top foam pad)' },
      { text: '折叠合拢箱盖 (Fold box lids)' },
      { text: '顶部封箱 (Seal top)' }
    ]
  }
];

// ============ 动作步骤预设模板 ============
const ACTION_TEMPLATES = {
  box_packing: {
    steps: [
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '纸箱', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '工厂部件', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '泡沫填充纸', goal: '稳定释放' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '纸箱', goal: '推拉合拢' },
      { arm: '双手 (Dual Arms)', skill: '对准', object: '胶带封装器', goal: '对齐插槽' }
    ],
    naturalSteps: [
      { text: '展开纸箱并封底 (Unfold box and seal bottom)' },
      { text: '放入底部泡沫垫 (Place bottom foam pad)' },
      { text: '放入工厂部件 (Place factory components/metal brackets)' },
      { text: '放入顶部泡沫垫 (Place top foam pad)' },
      { text: '折叠合拢箱盖 (Fold box lids)' },
      { text: '顶部封箱 (Seal top)' }
    ]
  },
  books_organize: {
    steps: [
      { arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' },
      { arm: '右手 (Right Arm)', skill: '靠近', object: '目标物品', goal: '避障靠近' },
      { arm: '右手 (Right Arm)', skill: '抓取', object: '目标物品', goal: '牢固夹紧' },
      { arm: '右手 (Right Arm)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '右手识别并定位桌上的目标书籍' },
      { text: '右手避障缓慢靠近书籍' },
      { text: '右手牢固夹紧并抓取书籍' },
      { text: '右手将书籍平稳放置在目标桌面上释放' }
    ]
  },
  dishes_clean: {
    steps: [
      { arm: '双手 (Dual Arms)', skill: '识别', object: '餐盘', goal: '确认位置' },
      { arm: '双手 (Dual Arms)', skill: '靠近', object: '餐盘', goal: '避障靠近' },
      { arm: '双手 (Dual Arms)', skill: '抓取', object: '餐盘', goal: '牢固夹紧' },
      { arm: '双手 (Dual Arms)', skill: '放置', object: '桌面', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '双手识别并定位桌上的待整理餐盘' },
      { text: '双手避障靠近餐盘' },
      { text: '双手牢固夹紧抓取餐盘' },
      { text: '双手平稳将餐盘移至指定放置区域' }
    ]
  },
  drawer_operation: {
    steps: [
      { arm: '右手 (Right Arm)', skill: '识别', object: '抽屉', goal: '确认位置' },
      { arm: '右手 (Right Arm)', skill: '靠近', object: '抽屉', goal: '避障靠近' },
      { arm: '右手 (Right Arm)', skill: '抓取', object: '抽屉', goal: '牢固夹紧' },
      { arm: '右手 (Right Arm)', skill: '松开', object: '抽屉', goal: '稳定释放' }
    ],
    naturalSteps: [
      { text: '识别抽屉把手位置并调整末端方向' },
      { text: '末端靠近并握紧抽屉拉手' },
      { text: '匀速拉开抽屉至最大开度' },
      { text: '释放把手并退回安全等待位置' }
    ]
  }
};

// ============ 区块标题组件 ============
const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
    {icon}
    <span style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f' }}>{title}</span>
  </div>
);

export default function CreateAnnotationTaskPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [activeCatalog, setActiveCatalog] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [sopMode, setSopMode] = useState('structured'); // 'structured' or 'natural'

  // Apply predefined template and fill steps data
  const handleTemplateSelect = (value) => {
    const template = ACTION_TEMPLATES[value];
    if (template) {
      form.setFieldsValue({
        steps: template.steps,
        naturalSteps: template.naturalSteps
      });
      message.success('已成功应用预设动作模版并填充步骤数据！');
    }
  };

  // Generate mock action episodes when catalog is changed
  const handleCatalogChange = (value) => {
    const catalog = collectedDataSources.find(c => c.value === value);
    if (!catalog) return;

    setActiveCatalog(catalog);

    // Autofill form
    form.setFieldsValue({
      taskName: catalog.taskName,
      project: catalog.project,
      taskbook: catalog.taskbook,
      dataCount: 120, // default annotation count
      deviceType: catalog.deviceType,
      steps: catalog.steps || [],
      naturalSteps: catalog.naturalSteps || [],
      taskDesc: `针对数据目录「${catalog.label.split(' [')[0]}」的机器人时序动作标注`
    });

    // Generate mock episodes
    const mockEpisodes = Array.from({ length: catalog.dataCount }).map((_, idx) => {
      const epId = 744101 + idx;
      return {
        key: String(epId),
        id: epId,
        episodeName: `${catalog.taskName}_ep_${String(idx + 1).padStart(3, '0')}`,
        collectTime: `2026-05-${String(10 + (idx % 15)).padStart(2, '0')} 14:${String(idx % 60).padStart(2, '0')}:30`,
        totalFrames: [120, 150, 180, 240, 300][idx % 5],
        device: catalog.deviceType,
        parseStatus: '已对齐并解析'
      };
    });

    setEpisodesList(mockEpisodes);

    // Default select first 120 items
    const defaultKeys = mockEpisodes.slice(0, 120).map(item => item.key);
    setSelectedRowKeys(defaultKeys);
  };

  // Sync count input value to table selections
  const handleCountChange = (val) => {
    const num = Math.min(val || 0, episodesList.length);
    const targetKeys = episodesList.slice(0, num).map(item => item.key);
    setSelectedRowKeys(targetKeys);
  };

  // Sync table selections to count input value
  const handleTableSelectChange = (keys) => {
    setSelectedRowKeys(keys);
    form.setFieldsValue({ dataCount: keys.length });
  };

  // Handle Form Submission
  const handleSubmit = () => {
    form.validateFields().then(values => {
      // Load current tasks from LocalStorage
      let currentTasks = [];
      const saved = localStorage.getItem('embodied_anno_tasks');
      if (saved) {
        try {
          currentTasks = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }

      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const newId = 16800 + Math.floor(Math.random() * 100);

      // Compile steps depending on chosen mode
      const processedSteps = sopMode === 'natural'
        ? (values.naturalSteps || []).map((s, idx) => ({
            id: idx + 1,
            text: s.text || ''
          }))
        : (values.steps || []).map((s, idx) => ({
            id: idx + 1,
            text: `${s.arm || ''}对${s.object || ''}进行[${s.skill || ''}]，达到[${s.goal || ''}]`
          }));

      const newTask = {
        key: `new_${Date.now()}`,
        project: values.project || '未命名项目',
        taskbook: values.taskbook || '未命名任务书',
        annoId: newId,
        taskId: 21700 + Math.floor(Math.random() * 100),
        instanceId: 19800 + Math.floor(Math.random() * 100),
        taskName: values.taskName,
        taskNameEn: values.taskName,
        taskStatus: '待分配',
        annotator: values.annotator || '-',
        auditor: values.auditor || '-',
        collectionMode: 'UMI',
        deviceType: values.deviceType || 'galbot',
        remoteControlType: '双设备',
        annoProgress: 0,
        annoTotal: selectedRowKeys.length || values.dataCount || 120,
        auditProgress: 0,
        auditTotal: 0,
        annoType: values.annoType,
        taskDesc: values.taskDesc || `${values.taskName}场景数据标注`,
        creator: '当前用户',
        createTime: timeStr,
        steps: processedSteps,
        rawSteps: values.steps || [],
        rawNaturalSteps: values.naturalSteps || [],
        sopMode: sopMode,
        selectedIds: selectedRowKeys
      };

      const updatedTasks = [newTask, ...currentTasks];
      localStorage.setItem('embodied_anno_tasks', JSON.stringify(updatedTasks));

      message.success(`✅ 已成功创建并下发标注任务「${values.taskName}」`);
      router.push('/annotation/audit');
    }).catch(() => {
      message.warning('请补充必填项并重试');
    });
  };

  const columns = [
    {
      title: '数据ID',
      dataIndex: 'id',
      width: 110,
      render: (text) => <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{text}</Text>
    },
    { title: '动作序列名称 (Episode Name)', dataIndex: 'episodeName' },
    { title: '采集时间', dataIndex: 'collectTime', width: 180 },
    { title: '数据长度', dataIndex: 'totalFrames', width: 110, render: (v) => `${v} 帧` },
    { title: '采集设备', dataIndex: 'device', width: 110 },
    {
      title: '解析状态',
      dataIndex: 'parseStatus',
      width: 120,
      render: (s) => <Badge status="success" text={s} />
    }
  ];

  // 通用卡片样式
  const cardStyle = {
    borderRadius: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
    marginBottom: 20
  };

  return (
    <MainLayout>
      <div className="ui-page">
        <PageHeader
          title="新建标注任务"
          description="关联已采集的数据资产，配置标注要求并分配作业人员。"
          breadcrumbs={[
            { title: '首页' },
            { title: '标注工作台', href: '/annotation/audit' },
            { title: '新建标注任务' },
          ]}
          back={() => router.push('/annotation/audit')}
        />

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              annoType: '范围标注',
              deviceType: 'galbot',
              dataCount: 120,
              steps: [{ arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' }],
              naturalSteps: [{ text: '右手识别并定位桌上的目标书籍' }]
            }}
          >

            {/* ==================== 区块一：关联数据源 ==================== */}
            <FormSection
              title="01 · 关联数据资产目录"
              description="从数据资产目录中选择已导入或已采集的动作序列数据包。"
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="dataSource"
                    label="选择数据资产目录数据"
                    tooltip="从数据资产目录中选择已导入或已采集的动作序列数据包进行标注"
                    rules={[{ required: true, message: '请关联数据资产目录数据' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="请选择或搜索数据资产目录中的已采集数据..."
                      onChange={handleCatalogChange}
                      options={collectedDataSources}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="dataCount"
                    label="需要标注数量"
                    tooltip="设置需要下发标注的动作实例数量，将自动对应下方数据表中的选中数量"
                    style={{ marginBottom: 0 }}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <InputNumber
                        min={1}
                        style={{ width: 'calc(100% - 46px)' }}
                        onChange={handleCountChange}
                        size="large"
                        disabled={!activeCatalog}
                        placeholder={activeCatalog ? "" : "请先选择目录"}
                      />
                      <Button size="large" disabled style={{ width: 46, padding: 0, color: 'rgba(0, 0, 0, 0.45)', backgroundColor: '#fafafa', borderLeft: 0, cursor: 'default' }}>条</Button>
                    </Space.Compact>
                  </Form.Item>
                </Col>
              </Row>

              {activeCatalog && (
                <div style={{ marginTop: 20 }}>
                  {/* 元数据简报 */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
                    display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13,
                    marginBottom: 20
                  }}>
                    <span><Text type="secondary">项目：</Text><Text strong>{activeCatalog.project}</Text></span>
                    <span><Text type="secondary">任务书：</Text><Text strong>{activeCatalog.taskbook}</Text></span>
                    <span><Text type="secondary">设备：</Text><Text strong>{activeCatalog.deviceType}</Text></span>
                    <span><Text type="secondary">数据量：</Text><Text strong>{activeCatalog.dataCount} 条</Text></span>
                  </div>

                  <Divider style={{ margin: '20px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DatabaseOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>关联数据资产数据明细</span>
                    </div>
                    <Tag color="success" style={{ fontSize: 12, padding: '2px 12px' }}>
                      已选 {selectedRowKeys.length} / {episodesList.length} 条
                    </Tag>
                  </div>

                  <Alert
                    message="数据选取联动说明"
                    description={`当前资产目录共包含 ${episodesList.length} 条已解析动作序列。默认已根据标注数量自动勾选前 ${selectedRowKeys.length} 条，您也可以在下表中手动调整勾选状态。`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, fontSize: 12 }}
                  />

                  <Table
                    rowSelection={{
                      selectedRowKeys,
                      onChange: handleTableSelectChange
                    }}
                    columns={columns}
                    dataSource={episodesList}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: false,
                      size: 'small',
                      showTotal: (total) => `共 ${total} 条数据`
                    }}
                    size="small"
                    bordered
                  />
                </div>
              )}
            </FormSection>

            {/* ==================== 区块二：基本配置 ==================== */}
            <FormSection
              title="02 · 标注任务基本配置"
              description="设置任务名称、标注类型、所属项目等基础信息。"
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item name="taskName" label="标注任务名称" rules={[{ required: true, message: '请输入标注任务名称' }]}>
                    <Input placeholder="例如：桌面书籍整理_标注_001" maxLength={60} showCount />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="annoType" label="标注类型" rules={[{ required: true }]}>
                    <Select options={ANNO_TYPES.map(t => ({ value: t, label: t }))} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="project" label="所属项目">
                    <Select placeholder="选择项目" options={projectNames.map(n => ({ value: n, label: n }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="taskbook" label="任务书">
                    <Select placeholder="选择任务书" options={taskbooks.map(n => ({ value: n, label: n }))} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="deviceType" label="设备类型">
                    <Select options={DEVICE_TYPES.map(d => ({ value: d, label: d }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="taskDesc" label="任务描述" style={{ marginBottom: 0 }}>
                    <Input placeholder="可选，简要说明任务目标" maxLength={80} />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            {/* ==================== 区块三：人员分配 ==================== */}
            <FormSection
              title="03 · 人员分配"
              description="分配本任务的标注员与审核员。"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="annotator" label="分配标注员">
                    <Select placeholder="选择（可选）" allowClear options={people.map(p => ({ value: p, label: p }))} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="auditor" label="分配审核员">
                    <Select placeholder="选择（可选）" allowClear options={people.map(p => ({ value: p, label: p }))} />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            {/* ==================== 区块四：动作步骤编排 ==================== */}
            <FormSection
              title="04 · 动作步骤编排"
              description="选择结构化步骤或自然语言描述方式，编排任务的动作流程。"
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    padding: '2px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setSopMode('structured')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: sopMode === 'structured' ? 600 : 500,
                        color: sopMode === 'structured' ? '#2563eb' : '#64748b',
                        background: sopMode === 'structured' ? '#ffffff' : 'transparent',
                        boxShadow: sopMode === 'structured' ? '0 2px 8px rgba(37, 99, 235, 0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <OrderedListOutlined style={{ fontSize: 13 }} />
                      结构化步骤
                    </button>
                    <button
                      type="button"
                      onClick={() => setSopMode('natural')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: sopMode === 'natural' ? 600 : 500,
                        color: sopMode === 'natural' ? '#10b981' : '#64748b',
                        background: sopMode === 'natural' ? '#ffffff' : 'transparent',
                        boxShadow: sopMode === 'natural' ? '0 2px 8px rgba(16, 185, 129, 0.08)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <EditOutlined style={{ fontSize: 13 }} />
                      自然语言描述
                    </button>
                  </div>
              </div>

              {/* 模版选择与填充 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 20,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                padding: '16px 20px',
                borderRadius: 12,
                border: '1px dashed #cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InfoCircleFilled style={{ color: '#1677ff' }} />
                    预设动作步骤模版一键填充:
                  </span>
                  <Select
                    placeholder="选择预设动作模版一键填充步骤数据..."
                    style={{ width: 360 }}
                    size="middle"
                    onChange={handleTemplateSelect}
                    allowClear
                  >
                    <Option value="box_packing">📦 工业纸箱打包封装与装箱模版 (6 步)</Option>
                    <Option value="books_organize">📚 桌面书籍整理与摆放模版 (4 步)</Option>
                    <Option value="dishes_clean">🍽️ 餐盘清理与协同搬运模版 (4 步)</Option>
                    <Option value="drawer_operation">🚪 抽屉开关与取物操作模版 (4 步)</Option>
                  </Select>
                </div>
              </div>

              {sopMode === 'natural' ? (
                <Form.List name="naturalSteps">
                  {(fields, { add, remove, move }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 12 }}>
                      {/* Visual vertical connector line */}
                      <div style={{
                        position: 'absolute',
                        left: '27px',
                        top: '24px',
                        bottom: '24px',
                        width: '2px',
                        borderLeft: '2px dashed #cbd5e1',
                        zIndex: 0
                      }} />

                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(index));
                            e.currentTarget.style.opacity = '0.6';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (!isNaN(fromIndex) && fromIndex !== index) {
                              move(fromIndex, index);
                            }
                          }}
                          style={{
                            display: 'flex',
                            gap: 16,
                            background: '#ffffff',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 12,
                            padding: '16px 20px',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            alignItems: 'center',
                            cursor: 'grab'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#10b981';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.08)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          {/* Step Number Badge */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              fontSize: 14,
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                            }}>
                              {String(index + 1).padStart(2, '0')}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: 16, marginTop: 4, cursor: 'grab', userSelect: 'none' }}>
                              ⋮
                            </div>
                          </div>

                          {/* Form Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>自然语言动作描述</div>
                            <Form.Item {...field} name={[field.name, 'text']} rules={[{ required: true, message: '请输入步骤描述' }]} noStyle>
                              <Input
                                placeholder="在此描述具体的机器人动作步骤，例如：双手抓取底部泡沫填充纸放入箱内"
                                size="large"
                                style={{
                                  width: '100%',
                                  borderRadius: 8,
                                  borderColor: '#cbd5e1'
                                }}
                                prefix={<EditOutlined style={{ color: '#94a3b8', marginRight: 4 }} />}
                              />
                            </Form.Item>
                          </div>

                          {/* Delete Action Button */}
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                            <Button
                              type="text"
                              danger
                              size="middle"
                              disabled={fields.length <= 1}
                              icon={<MinusCircleOutlined style={{ fontSize: 16 }} />}
                              onClick={() => remove(field.name)}
                              style={{
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                width: 36,
                                height: 36
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add Step Button */}
                      <Button
                        type="dashed"
                        onClick={() => add({ text: '' })}
                        icon={<PlusOutlined />}
                        style={{
                          width: '100%',
                          height: 48,
                          borderRadius: 12,
                          color: '#10b981',
                          borderColor: '#a7f3d0',
                          background: '#ecfdf5',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        添加自然语言步骤
                      </Button>
                    </div>
                  )}
                </Form.List>
              ) : (
                <Form.List name="steps">
                  {(fields, { add, remove, move }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 12 }}>
                      {/* Visual vertical connector line */}
                      <div style={{
                        position: 'absolute',
                        left: '27px',
                        top: '24px',
                        bottom: '24px',
                        width: '2px',
                        borderLeft: '2px dashed #cbd5e1',
                        zIndex: 0
                      }} />

                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(index));
                            e.currentTarget.style.opacity = '0.6';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            if (!isNaN(fromIndex) && fromIndex !== index) {
                              move(fromIndex, index);
                            }
                          }}
                          style={{
                            display: 'flex',
                            gap: 16,
                            background: '#ffffff',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 12,
                            padding: '16px 20px',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s ease',
                            cursor: 'grab'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1677ff';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 119, 255, 0.08)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                            e.currentTarget.style.transform = 'none';
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
                            <div style={{ color: '#94a3b8', fontSize: 16, marginTop: 4, cursor: 'grab', userSelect: 'none' }}>
                              ⋮
                            </div>
                          </div>

                          {/* Form Content Grid */}
                          <div style={{ flex: 1 }}>
                            <Row gutter={[12, 12]}>
                              <Col xs={24} sm={12} md={6}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>执行末端类型</div>
                                <Form.Item {...field} name={[field.name, 'arm']} rules={[{ required: true }]} noStyle>
                                  <Select size="middle" style={{ width: '100%' }}>
                                    <Option value="右手 (Right Arm)">右手 (Right Arm)</Option>
                                    <Option value="左手 (Left Arm)">左手 (Left Arm)</Option>
                                    <Option value="双手 (Dual Arms)">双手 (Dual Arms)</Option>
                                    <Option value="底盘 (Base)">底盘 (Base)</Option>
                                    <Option value="相机 (Camera)">相机 (Camera)</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                              
                              <Col xs={24} sm={12} md={6}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>原子技能</div>
                                <Form.Item {...field} name={[field.name, 'skill']} rules={[{ required: true }]} noStyle>
                                  <Select size="middle" style={{ width: '100%' }}>
                                    <Option value="识别">识别</Option>
                                    <Option value="靠近">靠近</Option>
                                    <Option value="抓取">抓取</Option>
                                    <Option value="放置">放置</Option>
                                    <Option value="旋转">旋转</Option>
                                    <Option value="对准">对准</Option>
                                    <Option value="松开">松开</Option>
                                  </Select>
                                </Form.Item>
                              </Col>

                              <Col xs={24} sm={12} md={6}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>操作对象</div>
                                <Form.Item {...field} name={[field.name, 'object']} rules={[{ required: true }]} noStyle>
                                  <Select size="middle" style={{ width: '100%' }}>
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
                                </Form.Item>
                              </Col>

                              <Col xs={24} sm={12} md={6}>
                                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>操作目标</div>
                                <Form.Item {...field} name={[field.name, 'goal']} rules={[{ required: true }]} noStyle>
                                  <Select size="middle" style={{ width: '100%' }}>
                                    <Option value="确认位置">确认位置</Option>
                                    <Option value="避障靠近">避障靠近</Option>
                                    <Option value="牢固夹紧">牢固夹紧</Option>
                                    <Option value="稳定释放">稳定释放</Option>
                                    <Option value="扭转至角度">扭转至角度</Option>
                                    <Option value="对齐插槽">对齐插槽</Option>
                                    <Option value="推拉合拢">推拉合拢</Option>
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>

                          {/* Delete Action Button */}
                          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                            <Button
                              type="text"
                              danger
                              size="middle"
                              disabled={fields.length <= 1}
                              icon={<MinusCircleOutlined style={{ fontSize: 16 }} />}
                              onClick={() => remove(field.name)}
                              style={{
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                width: 36,
                                height: 36
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add Step Button */}
                      <Button
                        type="dashed"
                        onClick={() => add({ arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' })}
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
                          gap: 6
                        }}
                      >
                        添加结构化步骤
                      </Button>
                    </div>
                  )}
                </Form.List>
              )}
            </FormSection>



            {/* ==================== 底部操作栏 ==================== */}
            <ActionFooter>
              <Button size="large" onClick={() => router.push('/annotation/audit')}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                disabled={!activeCatalog}
                style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
              >
                确认并分发标注任务
              </Button>
            </ActionFooter>

          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
