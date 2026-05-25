'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Drawer, Descriptions, Badge, Progress, Statistic, Row, Col, Steps, Modal, App } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ApiOutlined, DashboardOutlined, HddOutlined, CheckCircleFilled, WarningFilled, DownOutlined, UpOutlined, CloudUploadOutlined, FolderOpenOutlined, InboxOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const { Title, Text } = Typography;

const mockData = [
    { key: '1', taskId: 'CT-20250301001', name: 'FRANKA-FR3-抓取红色方块-001', desc: '使用FR3机器人抓取红色方块', robot: 'FRANKA-FR3-1号', scene: '桌面抓取', collector: '张三', startTime: '2025-03-01 09:00', endTime: '-', collectStatus: '采集中', dataStatus: '上传中', creator: '管理员', createTime: '2025-02-28 14:30', progress: '35/50', deviceStatus: '正常' },
    { key: '2', taskId: 'CT-20250301002', name: 'FRANKA-FR3-放置蓝色圆柱-002', desc: '使用FR3机器人放置蓝色圆柱', robot: 'FRANKA-FR3-2号', scene: '桌面放置', collector: '李四', startTime: '2025-03-01 10:30', endTime: '2025-03-01 16:00', collectStatus: '采集完成', dataStatus: '处理完成', creator: '管理员', createTime: '2025-02-28 15:00', progress: '50/50', deviceStatus: '正常' },
    { key: '3', taskId: 'CT-20250302001', name: 'UR5e-搬运任务-003', desc: '使用UR5e搬运物体', robot: 'UR5e-1号', scene: '仓库搬运', collector: '王五', startTime: '-', endTime: '-', collectStatus: '待采集', dataStatus: '-', creator: '管理员', createTime: '2025-03-02 09:00', progress: '0/30', deviceStatus: '正常' },
    { key: '4', taskId: 'CT-20260414001', name: 'Lumos-双手筷子与勺子整理-001', desc: '使用Lumos离线背包数采终端进行餐具整理数据采集', robot: 'Lumos FastUMI Go', scene: '离线台面', collector: '王小二', startTime: '-', endTime: '-', collectStatus: '待采集', dataStatus: '-', creator: '管理员', createTime: '2026-04-14 10:00', progress: '0/50', deviceStatus: '正常' },
];

const collectStatusMap = { '采集中': 'processing', '采集完成': 'success', '待采集': 'default' };
const dataStatusMap = { '上传中': 'processing', '处理完成': 'success', '未上传': 'default', '处理中': 'warning', '-': 'default' };

export default function CollectTaskPage() {
  const router = useRouter();
  const { message } = App.useApp();
    const [detailOpen, setDetailOpen] = useState(false);
    const [expand, setExpand] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [timer, setTimer] = useState(0);

    // Upload states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadingTask, setUploadingTask] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTasks, setUploadedTasks] = useState({});

    // Drag-and-drop states
    const [dragActive, setDragActive] = useState(false);
    const [filesDropped, setFilesDropped] = useState(false);
    const [uploadedFileList, setUploadedFileList] = useState([]);
    const fileInputRef = React.useRef(null);
    const folderInputRef = React.useRef(null);

    // Drag events handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const traverseFileTree = (item, path = '') => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file) => {
                    resolve([{
                        name: path + item.name,
                        size: file.size,
                        type: file.type
                    }]);
                });
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                const entriesList = [];
                const readEntries = () => {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length === 0) {
                            const promises = entriesList.map(entry => traverseFileTree(entry, path + item.name + '/'));
                            const results = await Promise.all(promises);
                            resolve(results.flat());
                        } else {
                            entriesList.push(...entries);
                            readEntries();
                        }
                    }, (err) => {
                        console.error(err);
                        resolve([]);
                    });
                };
                readEntries();
            } else {
                resolve([]);
            }
        });
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const promises = [];
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                const item = e.dataTransfer.items[i].webkitGetAsEntry();
                if (item) {
                    promises.push(traverseFileTree(item));
                }
            }
            const results = await Promise.all(promises);
            const flatFiles = results.flat();
            if (flatFiles.length > 0) {
                setUploadedFileList(flatFiles);
                setFilesDropped(true);
                message.success(`已成功识别拖入的文件夹/文件，共包含 ${flatFiles.length} 个文件！`);
            } else {
                message.warning('未识别到有效的可上传文件。');
            }
        } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            setUploadedFileList(files.map(f => ({ name: f.name, size: f.size, type: f.type })));
            setFilesDropped(true);
            message.success(`已成功识别拖入的 ${files.length} 个文件！`);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setUploadedFileList(files.map(f => ({ name: f.name, size: f.size, type: f.type })));
            setFilesDropped(true);
            message.success(`已成功选择 ${files.length} 个文件！`);
        }
    };

    const handleFolderChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setUploadedFileList(files.map(f => ({ 
                name: f.webkitRelativePath || f.name, 
                size: f.size, 
                type: f.type 
            })));
            setFilesDropped(true);
            message.success(`已识别文件夹中共 ${files.length} 个文件！`);
        }
    };

    const handleSimulateDrop = () => {
        setUploadedFileList([]);
        setFilesDropped(true);
        message.success('已模拟导入本地“鹿鸣采集数据”数采文件夹结构！');
    };

    // Load uploaded tasks from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('luming_uploaded_tasks');
        if (stored) {
            try {
                setUploadedTasks(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleStartUpload = () => {
        setIsUploading(true);
        setUploadProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    const newUploaded = { ...uploadedTasks, [uploadingTask.taskId]: true };
                    setUploadedTasks(newUploaded);
                    localStorage.setItem('luming_uploaded_tasks', JSON.stringify(newUploaded));
                    
                    // Save detailed Luming session info
                    const sessionDetails = {
                        taskId: uploadingTask.taskId,
                        uploadTime: new Date().toLocaleString(),
                        sessionName: 'session_028',
                        status: '成功',
                        quality: '通过',
                        summary: {
                            startTime: '2026年 05月 20日 星期三 10:12:37 CST',
                            endTime: '2026年 05月 20日 星期三 10:13:17 CST',
                            duration: '40秒',
                            deviceCount: 2,
                            rgbFrames: 1800,
                            gripperType: '非平动夹爪 (pose_merge)',
                        }
                    };
                    localStorage.setItem(`luming_session_${uploadingTask.taskId}`, JSON.stringify(sessionDetails));

                    message.success('数据上传及质检分析处理成功！数据包 session_028 已入库。');
                    setIsUploading(false);
                    setIsUploadModalOpen(false);
                }, 500);
            }
        }, 150);
    };

    const columns = [
        { title: '采集任务ID', dataIndex: 'taskId', key: 'taskId', width: 150 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 260 },
        { title: '任务描述', dataIndex: 'desc', key: 'desc', width: 200, ellipsis: true },
        { title: '采集机器人', dataIndex: 'robot', key: 'robot', width: 150 },
        { title: '采集场景', dataIndex: 'scene', key: 'scene', width: 120 },
        { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 100 },
        { 
          title: '采集状态', 
          dataIndex: 'collectStatus', 
          key: 'collectStatus', 
          width: 100, 
          render: (s, record) => {
              const status = uploadedTasks[record.taskId] ? '采集完成' : s;
              return <Tag color={collectStatusMap[status]}>{status}</Tag>;
          } 
        },
        { 
          title: '数据状态', 
          dataIndex: 'dataStatus', 
          key: 'dataStatus', 
          width: 100, 
          render: (s, record) => {
              const status = uploadedTasks[record.taskId] ? '处理完成' : s;
              return <Tag color={dataStatusMap[status]}>{status}</Tag>;
          } 
        },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        {
            title: '操作', key: 'action', width: 380, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/collection/collect/detail/${record.taskId}`)}>查看详情</Button>
                    {record.collectStatus !== '采集完成' && !uploadedTasks[record.taskId] && (
                        <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => window.open(`/collection/collect/connection/${record.taskId}`, '_blank')}>
                            {record.collectStatus === '待采集' ? '开始采集' : '继续采集'}
                        </Button>
                    )}
                    <Button 
                        type="link" 
                        size="small" 
                        icon={<CloudUploadOutlined />} 
                        onClick={() => {
                            setUploadingTask(record);
                            setIsUploadModalOpen(true);
                            setUploadProgress(0);
                            setIsUploading(false);
                            setFilesDropped(false);
                            setDragActive(false);
                        }}
                    >
                        {uploadedTasks[record.taskId] ? '重新上传' : '上传数据'}
                    </Button>
                    {(record.dataStatus === '处理完成' || uploadedTasks[record.taskId]) && (
                        <Button type="link" size="small" onClick={() => {
                            window.open(`/collection/collect/data/${record.taskId}`, '_blank');
                        }}>查看数据</Button>
                    )}
                    {record.collectStatus === '采集完成' && record.dataStatus === '处理完成' && (
                        <Button type="link" size="small" onClick={() => message.success('任务已完成')}>完成任务</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
            <MainLayout>
                {/* Edge Client Hardware Status Panel */}
                <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color="blue" style={{ margin: 0, fontWeight: 'bold' }}>EDGE CLIENT</Tag>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#0958d9' }}>边缘侧采集工作站 - 就绪</span>
                    </div>
                    <Space size="large" separator={<span style={{ color: '#91caff' }}>|</span>}>
                        <Space size="small">
                            <ApiOutlined style={{ color: '#52c41a' }} />
                            <span style={{ fontSize: 13 }}>机器人直连: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 10 }} /> <span style={{ color: '#52c41a' }}>已连接 (1ms)</span></span>
                        </Space>
                        <Space size="small">
                            <HddOutlined style={{ color: '#faad14' }} />
                            <span style={{ fontSize: 13 }}>本地磁盘: <span style={{ color: '#faad14', fontWeight: 500 }}>剩余 128GB (12%)</span> <WarningFilled style={{ color: '#faad14', fontSize: 10 }} /></span>
                        </Space>
                        <Space size="small">
                            <DashboardOutlined style={{ color: '#1677ff' }} />
                            <span style={{ fontSize: 13 }}>CPU: 24% | GPU: 68%</span>
                        </Space>
                    </Space>
                </div>

                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="page-header-title" style={{ margin: 0 }}>采集任务</h3>
                    <Button type="primary" onClick={() => window.open('/collection/collect/connection/CT-20250301001', '_blank')}>设备连接自检</Button>
                </div>
                <Card 
                    style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
                    styles={{ body: { padding: '24px 24px 0' } }}
                >
                    <Form layout="horizontal" labelCol={{ flex: '80px' }}>
                        <Row gutter={24}>
                            <Col span={6}>
                                <Form.Item label="任务名称"><Input placeholder="请输入" allowClear /></Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="采集机器人"><Select placeholder="全部" allowClear options={[{ value: 'FRANKA-FR3-1号' }, { value: 'UR5e-1号' }]} /></Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item label="采集状态"><Select placeholder="全部" allowClear options={[{ value: '采集中' }, { value: '采集完成' }, { value: '待采集' }]} /></Form.Item>
                            </Col>
                            {!expand && (
                                <Col span={6} style={{ textAlign: 'right' }}>
                                    <Space>
                                        <Button icon={<ReloadOutlined />}>重置</Button>
                                        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                        <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                                            展开 <DownOutlined />
                                        </a>
                                    </Space>
                                </Col>
                            )}
                        </Row>
                        {expand && (
                            <>
                                <Row gutter={24}>
                                    <Col span={6}>
                                        <Form.Item label="指派时间"><Input placeholder="请选择时间" allowClear /></Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item label="采集员"><Input placeholder="请输入" allowClear /></Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={24}>
                                    <Col span={24} style={{ textAlign: 'right', marginBottom: 24 }}>
                                        <Space>
                                            <Button icon={<ReloadOutlined />}>重置</Button>
                                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                            <a style={{ fontSize: 12 }} onClick={() => setExpand(!expand)}>
                                                收起 <UpOutlined />
                                            </a>
                                        </Space>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Form>
                </Card>

                <Card styles={{ body: { padding: 0 } }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 16, fontWeight: 500 }}>任务列表</span>
                    </div>
                    <Table columns={columns} dataSource={mockData} scroll={{ x: 1600 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
                </Card>

                {/* Upload Data Modal */}
                <Modal
                    title={<div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10, fontSize: 16, fontWeight: 600 }}>
                        <CloudUploadOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                        上传本地数采包数据 (任务: {uploadingTask?.name})
                    </div>}
                    open={isUploadModalOpen}
                    onCancel={() => !isUploading && setIsUploadModalOpen(false)}
                    width={720}
                    footer={[
                        <Button key="cancel" disabled={isUploading} onClick={() => setIsUploadModalOpen(false)}>取消</Button>,
                        <Button 
                            key="upload" 
                            type="primary" 
                            loading={isUploading} 
                            disabled={!filesDropped} 
                            onClick={handleStartUpload}
                        >
                            {isUploading ? '正在上传及分析...' : (filesDropped ? '确认上传' : '确认上传 (请先拖入文件)')}
                        </Button>
                    ]}
                >
                    <div 
                        style={{ padding: '16px 0' }}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="数采源目录">
                                <Tag icon={<FolderOpenOutlined style={{ color: '#faad14' }} />} color="warning" style={{ fontSize: 12, padding: '2px 8px' }}>
                                    ./鹿鸣采集数据
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="目标任务ID">
                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{uploadingTask?.taskId}</span>
                            </Descriptions.Item>
                        </Descriptions>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            multiple 
                            onChange={handleFileChange} 
                        />
                        <input 
                            type="file" 
                            ref={folderInputRef} 
                            style={{ display: 'none' }} 
                            webkitdirectory=""
                            directory=""
                            multiple
                            onChange={handleFolderChange} 
                        />

                        {!filesDropped ? (
                            <div 
                                onClick={() => folderInputRef.current.click()}
                                style={{
                                    border: dragActive ? '2px dashed #1677ff' : '2px dashed #d9d9d9',
                                    borderRadius: '12px',
                                    background: dragActive ? '#f0f5ff' : '#fafafa',
                                    padding: '48px 24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: dragActive ? '0 0 16px rgba(22, 119, 255, 0.15)' : 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minHeight: '300px',
                                    margin: '8px 0'
                                }}
                            >
                                <InboxOutlined style={{ fontSize: 64, color: dragActive ? '#1677ff' : '#40a9ff', marginBottom: 20, pointerEvents: 'none' }} />
                                <div style={{ fontSize: 16, fontWeight: 600, color: dragActive ? '#1677ff' : '#262626', marginBottom: 8, pointerEvents: 'none' }}>
                                    将数采文件（夹）或压缩包拖拽到此区域上传
                                </div>
                                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 20, maxWidth: '80%', pointerEvents: 'none' }}>
                                    支持直接拖入整个文件夹（例如 ./鹿鸣采集数据），或拖入包含 timestamps.csv 和 video.mp4 等会话包的 ZIP 压缩文件。
                                </div>
                                <Space size="middle" style={{ marginTop: 10 }}>
                                    <Button type="primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                                        选择本地文件
                                    </Button>
                                    <Button type="primary" ghost onClick={(e) => { e.stopPropagation(); folderInputRef.current.click(); }}>
                                        选择本地文件夹
                                    </Button>
                                    <Button type="default" onClick={(e) => { e.stopPropagation(); handleSimulateDrop(); }}>
                                        一键导入模拟数据
                                    </Button>
                                </Space>
                            </div>
                        ) : (
                            <>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    background: '#f6ffed', 
                                    border: '1px solid #b7eb8f', 
                                    borderRadius: '8px', 
                                    padding: '12px 16px', 
                                    marginBottom: '16px' 
                                }}>
                                    <Space>
                                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                                        <Text strong style={{ color: '#389e0d' }}>
                                            {uploadedFileList.length > 0 ? '本地文件识别成功！' : '数采包结构解析就绪！'}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {uploadedFileList.length > 0 
                                                ? `(已选择 ${uploadedFileList.length} 个文件)` 
                                                : '(已匹配 1 个 collection_summary 与 session_028 子目录)'
                                            }
                                        </Text>
                                    </Space>
                                    <Button size="small" danger onClick={() => { setFilesDropped(false); setUploadedFileList([]); }}>重新选择</Button>
                                </div>

                                {isUploading && (
                                    <div style={{ marginBottom: 20, padding: '8px 12px', background: '#e6f4ff', borderRadius: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                            <Text type="secondary">正在解析上传路径位姿轨迹与视频帧数据...</Text>
                                            <Text strong type="primary">{uploadProgress}%</Text>
                                        </div>
                                        <Progress percent={uploadProgress} showInfo={false} size="small" strokeColor="#1677ff" status="active" />
                                    </div>
                                )}

                                {uploadedFileList.length > 0 ? (
                                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fafafa', height: 320, overflowY: 'auto' }}>
                                        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#8c8c8c', marginBottom: 12, textTransform: 'uppercase' }}>已选择的本地文件 ({uploadedFileList.length})</div>
                                        <Table 
                                            size="small"
                                            dataSource={uploadedFileList}
                                            rowKey="name"
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: '文件名',
                                                    dataIndex: 'name',
                                                    key: 'name',
                                                    render: (text) => (
                                                        <Space>
                                                            <FolderOpenOutlined style={{ color: '#faad14' }} />
                                                            <span style={{ fontFamily: 'monospace' }}>{text}</span>
                                                        </Space>
                                                    )
                                                },
                                                {
                                                    title: '大小',
                                                    dataIndex: 'size',
                                                    key: 'size',
                                                    width: 120,
                                                    render: (bytes) => {
                                                        if (bytes === 0) return '0 B';
                                                        const k = 1024;
                                                        const sizes = ['B', 'KB', 'MB', 'GB'];
                                                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                                    }
                                                },
                                                {
                                                    title: '文件类型',
                                                    dataIndex: 'type',
                                                    key: 'type',
                                                    width: 150,
                                                    render: (t) => t || '未知类型'
                                                }
                                            ]}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 16, height: 320 }}>
                                        {/* Left Side: Directory Tree */}
                                        <div style={{ flex: 1, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12, background: '#fafafa', overflowY: 'auto' }}>
                                            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#8c8c8c', marginBottom: 8, textTransform: 'uppercase' }}>本地文件夹目录结构</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '1.8' }}>
                                                <div style={{ color: '#faad14' }}>📁 鹿鸣采集数据/</div>
                                                <div style={{ paddingLeft: 12, color: '#1677ff' }}>📄 collection_summary.txt <span style={{ color: '#bfbfbf', fontSize: 11 }}>(2.7 KB)</span></div>
                                                <div style={{ paddingLeft: 12, color: '#faad14' }}>📁 session_028/</div>
                                                <div style={{ paddingLeft: 24, color: '#d9d9d9' }}>├── 📁 left_hand_250801DR48...</div>
                                                <div style={{ paddingLeft: 24, color: '#d9d9d9' }}>├── 📁 right_hand_250801DR...</div>
                                                <div style={{ paddingLeft: 24, color: '#8c8c8c' }}>├── 📄 relative_transforms_left_to_right.txt</div>
                                                <div style={{ paddingLeft: 24, color: '#8c8c8c' }}>├── 📄 relative_transforms_right_to_left.txt</div>
                                                <div style={{ paddingLeft: 24, color: '#faad14' }}>└── 📁 quality_report/</div>
                                                <div style={{ paddingLeft: 36, color: '#52c41a' }}>├── 📄 quality_report.json <Tag size="small" color="success" style={{ transform: 'scale(0.8)', margin: 0, padding: '0 4px' }}>JSON</Tag></div>
                                                <div style={{ paddingLeft: 36, color: '#8c8c8c' }}>├── 📄 quality_report.txt</div>
                                                <div style={{ paddingLeft: 36, color: '#8c8c8c' }}>└── 📄 check.log</div>
                                            </div>
                                        </div>

                                        {/* Right Side: Text Preview */}
                                        <div style={{ flex: 1.2, border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '8px 12px', background: '#fafafa', fontSize: 12, fontWeight: 'bold', color: '#8c8c8c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>📄 collection_summary.txt 预览</span>
                                                <Tag color="blue" bordered={false} style={{ margin: 0, fontSize: 10 }}>TEXT</Tag>
                                            </div>
                                            <div style={{ flex: 1, padding: 12, overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: 11, borderRadius: '0 0 8px 8px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
{`========================================
多会话摄像头数据采集摘要（Buffered版本）
========================================
开始时间: 2026年 05月 20日 星期三 10:10:35 CST
任务信息: [20260408W001] 抓杯子
背景编号: background_00
RGB帧数: 1800
夹爪类型: 非平动夹爪 (pose_merge)
质量检查开关: true
设备模式: 双设备
设备数量: 2
计划会话数: 300
会话间隔: 1秒

设备信息:
  设备 1:
    XV序列号: 250801DR48FP26003296
    设备标签: left_hand
  设备 2:
    XV序列号: 250801DR48FP26003349
    设备标签: right_hand

==========================================
会话 28 信息 (session_028):
==========================================
  开始时间: 2026年 05月 20日 星期三 10:12:37 CST
  结束时间: 2026年 05月 20日 星期三 10:13:17 CST
  持续时间: 40秒
  状态: 成功
  数据验证: 通过
  质量检查: 通过
  数据目录: ./Data/task_20260408W001_a/background_00/
            multi_sessions_20260520_101032/session_028/
    ├─ left_hand_250801DR48FP26003296
    └─ right_hand_250801DR48FP26003349`}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </Modal>

            </MainLayout>
    );
}
