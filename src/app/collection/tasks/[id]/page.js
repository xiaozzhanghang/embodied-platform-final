'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Table, Button, Tag, Space, Card, Typography, Breadcrumb, 
  Badge, App, Modal, Form, Select, Input, Switch, Tabs, 
  Progress, Tooltip, Descriptions, Divider, Row, Col, InputNumber, Upload, Radio, Checkbox, Alert
} from 'antd';
import { 
  ArrowLeftOutlined, PlusOutlined, SearchOutlined, SyncOutlined, 
  ThunderboltOutlined, PauseCircleOutlined, TagsOutlined, InfoCircleOutlined,
  DownloadOutlined, FileSearchOutlined, CloudUploadOutlined, EditOutlined, 
  DeleteOutlined, CheckCircleOutlined, ReloadOutlined, PauseOutlined,
  ExclamationCircleOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const mockInstances = [
  { key: '1', instanceId: '12745', taskName: '餐具摆放', autoDataset: false, isShelf: false, shelfPos: '--', annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '张三', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-11 09:00', endTime: '-', collectProgress: 53, qaProgress: 0, status: '采集中' },
  { key: '2', instanceId: '12744', taskName: '餐具摆放', autoDataset: false, isShelf: false, shelfPos: '--', annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '李四', deviceInstance: 'R002GB-RGB-102', startTime: '2026-03-11 10:30', endTime: '-', collectProgress: 80, qaProgress: 0, status: '采集中' },
  { key: '3', instanceId: '12619', taskName: '餐具摆放', autoDataset: false, isShelf: false, shelfPos: '--', annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '-', deviceInstance: '—', startTime: '-', endTime: '-', collectProgress: 0, qaProgress: 0, status: '待分配' },
  { key: '4', instanceId: '12511', taskName: '餐具摆放', autoDataset: false, isShelf: false, shelfPos: '--', annoType: '轨迹标注', singlePack: 15, planCount: 120, collector: '王五', deviceInstance: 'R002GB-RGB-101', startTime: '2026-03-10 14:30', endTime: '2026-03-12 18:00', collectProgress: 100, qaProgress: 100, status: '已完成' },
];

const StatCard = ({ icon, value, label, iconBg, color }) => (
  <Card size="small" style={{ borderRadius: 12, border: '1px solid #f0f0f0', flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 10, background: iconBg, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{label}</div>
      </div>
    </div>
  </Card>
);

export default function TaskInstancePage() {
  const { id } = useParams();
  const router = useRouter();
  const { message } = App.useApp();
  const [addPackForm] = Form.useForm();
  const [annoForm] = Form.useForm();
  
  const [activeTab, setActiveTab] = useState('all');
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // Track selected annotation types for dynamic rendering
  const [selectedTypes, setSelectedTypes] = useState(['point']);

  // Modal visibility states
  const [isAddPackVisible, setIsAddPackVisible] = useState(false);
  const [isPauseTaskVisible, setIsPauseTaskVisible] = useState(false);
  const [isAddAnnoVisible, setIsAddAnnoVisible] = useState(false);

  const handlePausePack = (record) => {
    Modal.confirm({
      title: `暂停包 ${record.instanceId}`,
      content: `暂停后，采集员将无法继续录入。该包内已采集完成的数据将自动打包解析并流转至质检中心。`,
      okText: '确认暂停',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => message.success(`包 ${record.instanceId} 已暂停`),
    });
  };

  const handleCompletePack = (record) => {
    Modal.confirm({
      title: `标记包 ${record.instanceId} 为完成`,
      content: `确认后，该包将结束采集并自动打包解析，数据将流转至质检中心。`,
      okText: '确认完成',
      cancelText: '取消',
      onOk: () => message.success(`包 ${record.instanceId} 已完成`),
    });
  };

  const getStatusActions = (record) => {
    if (record.status === '已完成') {
      return (
        <Space separator={<Divider type="vertical" />} size={0}>
          <Button type="link" size="small" icon={<DownloadOutlined />} style={{ padding: '0 4px' }}>下载</Button>
          <Button type="link" size="small" icon={<FileSearchOutlined />} style={{ padding: '0 4px', color: '#52c41a' }}>质检详情</Button>
          <Button type="link" size="small" icon={<CloudUploadOutlined />} style={{ padding: '0 4px', color: '#722ed1' }}>手动上传</Button>
        </Space>
      );
    }
    if (record.status === '待分配') {
      return (
        <Space separator={<Divider type="vertical" />} size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: '0 4px' }}>编辑</Button>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} style={{ padding: '0 4px' }} onClick={() => Modal.confirm({ title: '确定删除？', content: '此操作不可恢复，是否继续？', okText: '确定', okType: 'danger', cancelText: '取消', onOk: () => message.success('已删除') })}>删除</Button>
        </Space>
      );
    }
    return (
      <Space separator={<Divider type="vertical" />} size={0}>
        <Button type="link" size="small" icon={<PauseCircleOutlined />} style={{ padding: '0 4px', color: '#faad14' }} onClick={() => handlePausePack(record)}>暂停</Button>
        <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', color: '#52c41a' }} onClick={() => handleCompletePack(record)}>完成</Button>
      </Space>
    );
  };

  const columns = [
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 100 },
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 120 },
    { title: '自动数据集', dataIndex: 'autoDataset', key: 'autoDataset', width: 100, render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag> },
    { title: '标注类型', dataIndex: 'annoType', key: 'annoType', width: 120 },
    { title: '单包采集量', dataIndex: 'singlePack', key: 'singlePack', width: 100 },
    { title: '计划采集量', dataIndex: 'planCount', key: 'planCount', width: 100 },
    { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 100 },
    { title: '分配设备实例', dataIndex: 'deviceInstance', key: 'deviceInstance', width: 140 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    {
      title: '采集进度', key: 'collectProgress', width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress percent={record.collectProgress} size="small" showInfo={false} style={{ flex: 1 }} strokeColor="#1677ff" />
          <span style={{ fontSize: 12, color: '#595959' }}>{record.collectProgress}%</span>
        </div>
      )
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s) => <Tag color={s === '已完成' ? 'success' : 'processing'}>{s}</Tag> },
    { title: '操作', key: 'action', width: 180, fixed: 'right', render: (_, record) => getStatusActions(record) },
  ];

  return (
    <MainLayout>
      <Breadcrumb items={[{ title: '首页' }, { title: '数据采集' }, { title: '任务详情' }]} style={{ marginBottom: 16 }} />

      <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push('/collection/tasks')} style={{ padding: 0, marginBottom: 12 }}>
        返回任务列表
      </Button>

      {/* High-Fidelity Header Card */}
      <Card style={{ marginBottom: 24, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: '#f8f9fc' }} styles={{ body: { padding: '24px 28px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>任务详情：餐具摆放 ({id})</Title>
          <Tag color="processing" bordered={false} style={{ borderRadius: 10, padding: '0 12px', background: '#e6f4ff', color: '#1677ff' }}>进行中</Tag>
        </div>

        {/* Basic Info Bar - Collapsible */}
        <div style={{ 
          background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, 
          padding: '16px 20px', marginBottom: 20, transition: 'all 0.3s'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              </div>
              <span style={{ fontWeight: 600, color: '#262626' }}>任务基本信息</span>
            </div>
            <Button 
              type="text" 
              size="small" 
              onClick={() => setInfoExpanded(!infoExpanded)}
              style={{ borderRadius: 20, background: '#f5f5f5', padding: '0 12px', fontSize: 12, color: '#8c8c8c' }}
            >
              {infoExpanded ? '点击收起 ▴' : '点击展开详情 ▾'}
            </Button>
          </div>
          
          {infoExpanded && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px dashed #f0f0f0' }}>
              <Row gutter={[40, 24]}>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>任务ID</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>{id}</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>任务状态</div>
                  <Tag color="default" style={{ borderRadius: 4 }}>进行中</Tag>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>创建人</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>天奇管理员</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>项目名</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>InternalCommercial (内部-商业)</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>场景分类</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>Supermarket (超市场景)</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>采集模式</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>WholeBody</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>遥操类型</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>Master-slave</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#bfbfbf', marginBottom: 8 }}>创建时间</div>
                  <div style={{ fontWeight: 600, color: '#262626' }}>2026-03-10 14:22</div>
                </Col>
              </Row>
            </div>
          )}
        </div>

        {/* Statistics Row */}
        <div style={{ display: 'flex', gap: 16 }}>
          <StatCard icon="📦" value="3" label="总包数" iconBg="#e6f4ff" color="#1677ff" />
          <StatCard icon="✅" value="3" label="已完成包" iconBg="#f6ffed" color="#52c41a" />
          <StatCard icon="⚡" value="0" label="采集中包" iconBg="#fffbe6" color="#faad14" />
          <StatCard icon="🔢" value="30/30" label="采集记录进度" iconBg="#f9f0ff" color="#722ed1" />
        </div>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title level={5} style={{ margin: 0 }}>包列表</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>每个包分配给一名采集员，包内包含多条采集记录</Text>
          </div>
          <Button type="text" icon={<ReloadOutlined />} style={{ color: '#8c8c8c' }} />
        </div>

        <div style={{ background: '#fff', borderRadius: 8, padding: '16px 20px', border: '1px solid #f0f0f0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16} align="bottom">
            <Form.Item label="实例任务id" style={{ marginBottom: 0 }}><Input placeholder="实例任务id" style={{ width: 140 }} /></Form.Item>
            <Form.Item label="操作物体" style={{ marginBottom: 0 }}><Select placeholder="操作物体" style={{ width: 140 }} /></Form.Item>
            <Form.Item label="采集人员" style={{ marginBottom: 0 }}><Select placeholder="采集人员" style={{ width: 140 }} /></Form.Item>
            <Form.Item style={{ marginBottom: 0 }}><Button type="primary" icon={<SearchOutlined />}>搜索</Button></Form.Item>
          </Space>
            <Space size={12}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddPackVisible(true)}>添加分包</Button>
              <Button 
                icon={<PauseOutlined />} 
                disabled={selectedRowKeys.length === 0} 
                onClick={() => setIsPauseTaskVisible(true)}
                style={{ borderRadius: 6, background: selectedRowKeys.length > 0 ? '#e6f7ff' : '#f5f5f5', color: selectedRowKeys.length > 0 ? '#1677ff' : '#bfbfbf', border: 'none' }}
              >
                暂停任务
              </Button>
              <Button 
                icon={<PlusOutlined />} 
                disabled={selectedRowKeys.length === 0}
                onClick={() => setIsAddAnnoVisible(true)}
                style={{ borderRadius: 6, background: selectedRowKeys.length > 0 ? '#e6f7ff' : '#f5f5f5', color: selectedRowKeys.length > 0 ? '#1677ff' : '#bfbfbf', border: 'none' }}
              >
                添加标注任务
              </Button>
            </Space>
          </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: <span>全部 <Badge count={4} style={{ backgroundColor: '#e6f4ff', color: '#1677ff', boxShadow: 'none', marginLeft: 4 }} /></span> },
            { key: 'pending', label: '待分配' },
            { key: 'collecting', label: '采集中' },
            { key: 'done', label: '已完成' },
          ]}
          style={{ marginBottom: 16 }}
        />

        <Table
          rowSelection={{ type: 'checkbox', selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={mockInstances}
          scroll={{ x: 1400 }}
          pagination={false}
          size="middle"
        />
      </Card>

      {/* --- MODALS --- */}

      {/* 1. 添加分包弹窗 */}
      <Modal
        title={<div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>新建分包</div>}
        open={isAddPackVisible}
        onCancel={() => setIsAddPackVisible(false)}
        width={520}
        okText="确定"
        cancelText="取消"
        onOk={() => {
          message.success('分包创建成功');
          setIsAddPackVisible(false);
        }}
      >
        <Form form={addPackForm} layout="vertical" style={{ paddingTop: 24 }}>
          <Form.Item label="选择采集员" name="collector" required>
            <Select placeholder="请选择采集员" options={[{ value: 'u1', label: '采集员 - 张三' }, { value: 'u2', label: '采集员 - 李四' }]} />
          </Form.Item>
          <Form.Item label="指派设备实例" name="deviceInstance" required>
            <Select 
              placeholder="请指派设备实例" 
              options={[
                { value: 'R002GB-RGB-101', label: 'R002GB-RGB-101 (Galbot RGB - 在线)' },
                { value: 'R002GB-RGB-102', label: 'R002GB-RGB-102 (Galbot RGB - 离线)' },
                { value: 'R002GB-RGBD-101', label: 'R002GB-RGBD-101 (Galbot RGBD - 在线)' },
                { value: 'DEV-FR-301', label: 'FRANKA-FR3-1号 (Franka Std - 在线)' },
              ]} 
            />
          </Form.Item>
          <Form.Item label="计划采集量 (单包)" name="planCount" required initialValue={100}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="是否自动生成数据集" name="autoDataset" initialValue={false}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item label="备注说明" name="remarks">
            <TextArea rows={3} placeholder="请输入分包备注信息..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2. 暂停任务弹窗 */}
      <Modal
        title={<Space><ExclamationCircleOutlined style={{ color: '#faad14' }} /> 确认暂停采集任务</Space>}
        open={isPauseTaskVisible}
        onCancel={() => setIsPauseTaskVisible(false)}
        okText="确认暂停"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => {
          message.success(`已暂停选中的 ${selectedRowKeys.length} 个分包任务`);
          setIsPauseTaskVisible(false);
          setSelectedRowKeys([]);
        }}
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph>您已选中 <Text strong type="danger">{selectedRowKeys.length}</Text> 个分包实例。暂停操作将产生以下影响：</Paragraph>
          <ul style={{ color: '#8c8c8c', fontSize: 13, paddingLeft: 20 }}>
            <li>对应采集员将立即收到暂停通知，无法继续录入新数据。</li>
            <li>已采集但未提交的数据将自动保存，采集任务进入“已暂停”状态。</li>
          </ul>
        </div>
      </Modal>

      {/* 3. 添加标注任务弹窗 (Dynamic Rendering) */}
      <Modal
        title={<div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>分配标注任务</div>}
        open={isAddAnnoVisible}
        onCancel={() => setIsAddAnnoVisible(false)}
        width={680}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' } }}
        footer={[
          <Button key="cancel" onClick={() => setIsAddAnnoVisible(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={() => {
            message.success('标注任务已成功指派至工作台');
            setIsAddAnnoVisible(false);
            setSelectedRowKeys([]);
          }}>确定</Button>
        ]}
      >
        <Alert 
          message={`当前已选中 ${selectedRowKeys.length} 个包实例，将统一配置标注流程。`} 
          type="info" showIcon style={{ marginBottom: 24 }} 
        />
        <Form form={annoForm} layout="vertical">
          <Form.Item label="标注类型" name="types" rules={[{ required: true }]}>
            <Space direction="vertical" size={12}>
              <Checkbox.Group 
                value={selectedTypes} 
                onChange={(values) => setSelectedTypes(values)}
              >
                <Space size={16} wrap>
                  <Checkbox value="point">点标注</Checkbox>
                  <Checkbox value="range">范围标注</Checkbox>
                  <Checkbox value="box">框标注</Checkbox>
                  <Checkbox value="mixed">范围&框标注</Checkbox>
                </Space>
              </Checkbox.Group>
              <Checkbox value="none" onChange={(e) => e.target.checked && setSelectedTypes([])}>无需标注</Checkbox>
            </Space>
          </Form.Item>

          <Form.Item label="质检员" name="qa">
            <Select placeholder="请选择质检员" defaultValue="00810" options={[{label:'质检员00810', value:'00810'}]} style={{ width: '100%' }} />
          </Form.Item>

          {/* Section: 点标注 */}
          {selectedTypes.includes('point') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>点标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围标注 */}
          {selectedTypes.includes('range') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 框标注 */}
          {selectedTypes.includes('box') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>框标注</Text></Divider>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: 范围&框标注 */}
          {selectedTypes.includes('mixed') && (
            <>
              <Divider orientation="left" plain style={{ margin: '32px 0 24px' }}><Text type="secondary" style={{ fontSize: 12 }}>范围&框标注</Text></Divider>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="自动生成数据集"><Switch /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="跨步骤标注"><Switch defaultChecked /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="标注员"><Select placeholder="请选择" /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="审核员"><Select placeholder="请选择" /></Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Modal>
    </MainLayout>
  );
}
