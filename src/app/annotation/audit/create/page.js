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
  Alert
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
  LinkOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

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
    ]
  }
];

// ============ 区块标题组件 ============
const SectionHeader = ({ icon, title, subtitle, number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 15, fontWeight: 700
    }}>
      {number}
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f' }}>{title}</span>
      </div>
      {subtitle && <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{subtitle}</div>}
    </div>
  </div>
);

export default function CreateAnnotationTaskPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [activeCatalog, setActiveCatalog] = useState(null);
  const [episodesList, setEpisodesList] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
        steps: values.steps || [],
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
      <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh' }}>

        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb items={[
            { title: <a onClick={() => router.push('/annotation/audit')}>标注审核</a> },
            { title: '新建标注任务' }
          ]} />
        </div>

        {/* Page Title & Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/annotation/audit')}>
            返回列表
          </Button>
          <Title level={4} style={{ margin: 0 }}>新建标注任务</Title>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              annoType: '范围标注',
              deviceType: 'galbot',
              dataCount: 120,
              steps: [{ arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' }]
            }}
          >

            {/* ==================== 区块一：关联数据源 ==================== */}
            <Card
              title={
                <SectionHeader
                  number="1"
                  icon={<LinkOutlined style={{ color: '#1677ff' }} />}
                  title="关联数据资产目录"
                  subtitle="从数据资产目录中选择已导入或已采集的动作序列数据包"
                />
              }
              bordered={false}
              style={cardStyle}
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
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      onChange={handleCountChange}
                      addonAfter="条"
                      size="large"
                      disabled={!activeCatalog}
                      placeholder={activeCatalog ? "" : "请先选择目录"}
                    />
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
            </Card>

            {/* ==================== 区块二：基本配置 ==================== */}
            <Card
              title={
                <SectionHeader
                  number="2"
                  icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                  title="标注任务基本配置"
                  subtitle="设置任务名称、标注类型、所属项目等基础信息"
                />
              }
              bordered={false}
              style={cardStyle}
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
            </Card>

            {/* ==================== 区块三：人员分配 ==================== */}
            <Card
              title={
                <SectionHeader
                  number="3"
                  icon={<TeamOutlined style={{ color: '#1677ff' }} />}
                  title="人员分配"
                  subtitle="分配本任务的标注员与审核员"
                />
              }
              bordered={false}
              style={cardStyle}
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
            </Card>

            {/* ==================== 区块四：动作步骤编排 ==================== */}
            <Card
              title={
                <SectionHeader
                  number="4"
                  icon={<OrderedListOutlined style={{ color: '#1677ff' }} />}
                  title="动作步骤编排 (SOP Steps)"
                  subtitle="定义标注任务中的机器人动作步骤序列"
                />
              }
              bordered={false}
              style={cardStyle}
            >
              <Form.List name="steps">
                {(fields, { add, remove }) => (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => add({ arm: '右手 (Right Arm)', skill: '识别', object: '目标物品', goal: '确认位置' })}
                        style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 'bold' }}
                      >
                        添加步骤
                      </Button>
                    </div>

                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                      {/* Table Header */}
                      <Row style={{ background: '#fafafa', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 'bold', fontSize: 12, color: '#475569' }} align="middle">
                        <Col span={2} style={{ textAlign: 'center' }}>排序</Col>
                        <Col span={5}>执行末端类型</Col>
                        <Col span={5}>原子技能</Col>
                        <Col span={5}>操作对象</Col>
                        <Col span={5}>操作目标</Col>
                        <Col span={2} style={{ textAlign: 'center' }}>操作</Col>
                      </Row>

                      {/* Table Body */}
                      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {fields.map((field, index) => (
                          <Row key={field.key} style={{ padding: '8px 12px', borderBottom: index === fields.length - 1 ? 'none' : '1px solid #f0f0f0', background: '#fff' }} align="middle" gutter={8}>
                            <Col span={2} style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 16, cursor: 'grab' }}>
                              ＋
                            </Col>
                            <Col span={5}>
                              <Form.Item {...field} name={[field.name, 'arm']} rules={[{ required: true }]} noStyle>
                                <Select size="small" style={{ width: '100%' }}>
                                  <Option value="右手 (Right Arm)">右手 (Right Arm)</Option>
                                  <Option value="左手 (Left Arm)">左手 (Left Arm)</Option>
                                  <Option value="双手 (Dual Arms)">双手 (Dual Arms)</Option>
                                  <Option value="底盘 (Base)">底盘 (Base)</Option>
                                  <Option value="相机 (Camera)">相机 (Camera)</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...field} name={[field.name, 'skill']} rules={[{ required: true }]} noStyle>
                                <Select size="small" style={{ width: '100%' }}>
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
                            <Col span={5}>
                              <Form.Item {...field} name={[field.name, 'object']} rules={[{ required: true }]} noStyle>
                                <Select size="small" style={{ width: '100%' }}>
                                  <Option value="目标物品">目标物品</Option>
                                  <Option value="阀门">阀门</Option>
                                  <Option value="垃圾桶">垃圾桶</Option>
                                  <Option value="餐盘">餐盘</Option>
                                  <Option value="抽屉">抽屉</Option>
                                  <Option value="螺丝刀">螺丝刀</Option>
                                  <Option value="桌面">桌面</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...field} name={[field.name, 'goal']} rules={[{ required: true }]} noStyle>
                                <Select size="small" style={{ width: '100%' }}>
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
                            <Col span={2} style={{ textAlign: 'center' }}>
                              <Button
                                type="text"
                                danger
                                size="small"
                                disabled={fields.length <= 1}
                                icon={<MinusCircleOutlined style={{ color: '#ff4d4f' }} />}
                                onClick={() => remove(field.name)}
                              />
                            </Col>
                          </Row>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Form.List>
            </Card>



            {/* ==================== 底部操作栏 ==================== */}
            <div style={{
              padding: '16px 24px',
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 16,
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
            }}>
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
            </div>

          </Form>
        </div>
      </div>
    </MainLayout>
  );
}
