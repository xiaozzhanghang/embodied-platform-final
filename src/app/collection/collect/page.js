'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Drawer, Descriptions, Badge, Progress, Statistic, Row, Col, Steps, Modal, App } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ApiOutlined, DashboardOutlined, HddOutlined, CheckCircleFilled, WarningFilled, DownOutlined, UpOutlined, CloudUploadOutlined, FolderOpenOutlined, InboxOutlined, LoadingOutlined, PauseOutlined, CaretRightOutlined, WarningOutlined } from '@ant-design/icons';
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
    const { message, notification } = App.useApp();
    const [detailOpen, setDetailOpen] = useState(false);
    const [expand, setExpand] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [collectModalOpen, setCollectModalOpen] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [timer, setTimer] = useState(0);

    // Upload states
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadingTask, setUploadingTask] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTasks, setUploadedTasks] = useState({});

    // Multi-folder Queue States
    const [uploadQueue, setUploadQueue] = useState([]);
    const uploadQueueRef = React.useRef(uploadQueue);
    useEffect(() => {
        uploadQueueRef.current = uploadQueue;
    }, [uploadQueue]);

    const [activeQueueIndex, setActiveQueueIndex] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [cliSuggested, setCliSuggested] = useState(false);

    // Drag-and-drop states
    const [dragActive, setDragActive] = useState(false);
    const [filesDropped, setFilesDropped] = useState(false);
    const [uploadedFileList, setUploadedFileList] = useState([]);
    const folderInputRef = React.useRef(null);

    const groupFilesByFolder = (files) => {
        const foldersMap = {};
        files.forEach(f => {
            const pathParts = f.name.split('/');
            let folderName = '默认数采包';
            if (pathParts.length > 1) {
                if (pathParts[0] === '鹿鸣采集数据' && pathParts.length > 2) {
                    folderName = pathParts[1];
                } else {
                    folderName = pathParts[0];
                }
            }
            if (!foldersMap[folderName]) {
                foldersMap[folderName] = {
                    id: folderName,
                    name: folderName,
                    size: 0,
                    filesCount: 0,
                    files: []
                };
            }
            foldersMap[folderName].size += f.size || 0;
            foldersMap[folderName].filesCount += 1;
            foldersMap[folderName].files.push(f);
        });
        return Object.values(foldersMap).map(folder => {
            const isLarge = folder.size > 524288000; // > 500MB
            return {
                id: folder.id,
                name: folder.name,
                size: folder.size,
                filesCount: folder.filesCount,
                progress: 0,
                status: 'waiting', // 'waiting' | 'uploading' | 'paused' | 'success'
                speed: '0 KB/s',
                timeLeft: '—',
                isLarge
            };
        });
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

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
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
                const queue = groupFilesByFolder(flatFiles);
                setUploadQueue(queue);
                setUploadedFileList(flatFiles);
                setFilesDropped(true);
                const hasLargeFolder = queue.some(q => q.isLarge);
                setCliSuggested(hasLargeFolder);
                message.success(`已成功识别拖入的 ${queue.length} 个数采会话文件夹，共包含 ${flatFiles.length} 个文件！`);
            } else {
                message.warning('未识别到有效的可上传文件。');
            }
        }
    };

    const handleFolderChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).map(f => ({
                name: f.webkitRelativePath || f.name,
                size: f.size,
                type: f.type
            }));
            const queue = groupFilesByFolder(files);
            setUploadQueue(queue);
            setUploadedFileList(files);
            setFilesDropped(true);
            const hasLargeFolder = queue.some(q => q.isLarge);
            setCliSuggested(hasLargeFolder);
            message.success(`已成功选择 ${queue.length} 个数采会话文件夹，共包含 ${files.length} 个文件！`);
        }
    };

    const handleSimulateDrop = () => {
        const simulatedQueue = [
            {
                id: 'session_027',
                name: 'session_027',
                size: 125829120, // 120MB
                filesCount: 154,
                progress: 0,
                status: 'waiting',
                speed: '0 KB/s',
                timeLeft: '—',
                isLarge: false
            },
            {
                id: 'session_028',
                name: 'session_028',
                size: 713031680, // 680MB (>500MB)
                filesCount: 1800,
                progress: 0,
                status: 'waiting',
                speed: '0 KB/s',
                timeLeft: '—',
                isLarge: true
            }
        ];
        setUploadQueue(simulatedQueue);
        setUploadedFileList(new Array(1954).fill({ name: 'mock' }));
        setFilesDropped(true);
        setCliSuggested(true);
        message.success('已模拟导入“鹿鸣采集数据”的多会话目录结构 (包含 session_027 & session_028)！');
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

    // Multi-folder sequential uploading simulation logic
    useEffect(() => {
        if (!isUploading || activeQueueIndex === null || activeQueueIndex >= uploadQueueRef.current.length) {
            return;
        }

        const currentQueue = uploadQueueRef.current;
        const activeItem = currentQueue[activeQueueIndex];
        if (!activeItem) return;

        if (activeItem.status === 'success') {
            const nextIndex = currentQueue.findIndex((q, idx) => idx > activeQueueIndex && q.status !== 'success');
            if (nextIndex !== -1) {
                setActiveQueueIndex(nextIndex);
            } else {
                setIsUploading(false);
                setActiveQueueIndex(null);
                
                setUploadedTasks(prev => {
                    const newUploaded = { ...prev, [uploadingTask.taskId]: true };
                    localStorage.setItem('luming_uploaded_tasks', JSON.stringify(newUploaded));
                    return newUploaded;
                });
                
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

                notification.success({
                    message: '数采数据包上传完成',
                    description: `任务 [${uploadingTask.taskId}] 的数采包 (${currentQueue.map(q => q.name).join(', ')}) 已全部成功上传并入库质检池。`,
                    placement: 'bottomRight',
                    duration: 6
                });
                
                setIsUploadModalOpen(false);
                setIsMinimized(false);
            }
            return;
        }

        if (activeItem.status === 'paused') {
            return;
        }

        if (activeItem.status !== 'uploading') {
            setUploadQueue(prev => prev.map((q, idx) => idx === activeQueueIndex ? { ...q, status: 'uploading' } : q));
        }

        let currentProgress = activeItem.progress;
        const totalSize = activeItem.size;
        
        const interval = setInterval(() => {
            if (uploadQueueRef.current[activeQueueIndex]?.status === 'paused') {
                clearInterval(interval);
                return;
            }

            currentProgress += Math.floor(Math.random() * 8) + 4;
            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                
                setUploadQueue(prev => prev.map((q, idx) => 
                    idx === activeQueueIndex 
                        ? { ...q, progress: 100, status: 'success', speed: '0 KB/s', timeLeft: '已完成' } 
                        : q
                ));
                setTimeout(() => {
                    setActiveQueueIndex(prev => prev + 1);
                }, 500);
            } else {
                const rawSpeed = (Math.random() * 8 + 10).toFixed(1);
                const speedStr = `${rawSpeed} MB/s`;
                const remainingBytes = totalSize * (1 - currentProgress / 100);
                const remainingMB = remainingBytes / 1024 / 1024;
                const remainingSeconds = Math.ceil(remainingMB / parseFloat(rawSpeed));
                const timeLeftStr = `${remainingSeconds} 秒`;

                setUploadQueue(prev => prev.map((q, idx) => 
                    idx === activeQueueIndex 
                        ? { ...q, progress: currentProgress, speed: speedStr, timeLeft: timeLeftStr } 
                        : q
                ));
            }
        }, 300);

        return () => clearInterval(interval);
    }, [isUploading, activeQueueIndex, uploadingTask, notification]);

    const handleStartUpload = () => {
        setIsUploading(true);
        const firstPendingIndex = uploadQueue.findIndex(q => q.status !== 'success');
        if (firstPendingIndex === -1) {
            message.warning('所有数采包已成功上传！');
            setIsUploading(false);
            return;
        }
        setActiveQueueIndex(firstPendingIndex);
    };

    const handlePauseItem = (index) => {
        setUploadQueue(prev => prev.map((q, idx) => 
            idx === index 
                ? { ...q, status: 'paused', speed: '0 KB/s', timeLeft: '已暂停' } 
                : q
        ));
        if (index === activeQueueIndex) {
            setIsUploading(false);
        }
    };

    const handleResumeItem = (index) => {
        setUploadQueue(prev => prev.map((q, idx) => 
            idx === index 
                ? { ...q, status: 'waiting', speed: '正在连接...' } 
                : q
        ));
        setIsUploading(true);
        setActiveQueueIndex(index);
    };

    const handlePauseAll = () => {
        setUploadQueue(prev => prev.map(q => 
            q.status === 'uploading' || q.status === 'waiting'
                ? { ...q, status: 'paused', speed: '0 KB/s', timeLeft: '已暂停' }
                : q
        ));
        setIsUploading(false);
    };

    const handleResumeAll = () => {
        setUploadQueue(prev => prev.map(q => 
            q.status === 'paused'
                ? { ...q, status: 'waiting', speed: '正在连接...' }
                : q
        ));
        setIsUploading(true);
        const nextPending = uploadQueue.findIndex(q => q.status !== 'success');
        if (nextPending !== -1) {
            setActiveQueueIndex(nextPending);
        }
    };

    const totalQueueSize = uploadQueue.reduce((acc, q) => acc + q.size, 0) || 1;
    const uploadedBytes = uploadQueue.reduce((acc, q) => acc + (q.size * q.progress / 100), 0);
    const overallProgressPercent = Math.round(uploadedBytes / totalQueueSize * 100);

    const columns = [
        { title: '采集任务ID', dataIndex: 'taskId', key: 'taskId', width: 150 },
        { title: '任务名称', dataIndex: 'name', key: 'name', width: 260 },
        { title: '任务描述', dataIndex: 'desc', key: 'desc', width: 200, ellipsis: true },
        { title: '采集机器人', dataIndex: 'robot', key: 'robot', width: 150 },
        { title: '采集场景', dataIndex: 'scene', key: 'scene', width: 120 },
        { title: '采集人员', dataIndex: 'collector', key: 'collector', width: 100 },
        { title: '采集状态', dataIndex: 'collectStatus', key: 'collectStatus', width: 100, render: (s, record) => { const status = uploadedTasks[record.taskId] ? '采集完成' : s; return <Tag color={collectStatusMap[status]}>{status}</Tag>; } },
        { title: '数据状态', dataIndex: 'dataStatus', key: 'dataStatus', width: 100, render: (s, record) => { const status = uploadedTasks[record.taskId] ? '处理完成' : s; return <Tag color={dataStatusMap[status]}>{status}</Tag>; } },
        { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
        { title: '操作', key: 'action', width: 380, fixed: 'right', render: (_, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/collection/collect/detail/${record.taskId}`)}>查看详情</Button>
                    {record.collectStatus !== '采集完成' && !uploadedTasks[record.taskId] && (
                        <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => window.open(`/collection/collect/connection/${record.taskId}`, '_blank')}>{record.collectStatus === '待采集' ? '开始采集' : '继续采集'}</Button>
                    )}
                    <Button type="link" size="small" icon={<CloudUploadOutlined />} onClick={() => { setUploadingTask(record); setIsUploadModalOpen(true); setIsUploading(false); setFilesDropped(false); setUploadQueue([]); setActiveQueueIndex(null); setIsMinimized(false); setCliSuggested(false); }}>{uploadedTasks[record.taskId] ? '重新上传' : '上传数据'}</Button>
                </Space>
            )
        }
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
                        filesDropped && (
                            <Button 
                                key="background" 
                                type="default" 
                                disabled={!isUploading}
                                onClick={() => {
                                    setIsMinimized(true);
                                    setIsUploadModalOpen(false);
                                    message.info('数采包上传已切入后台运行，您可继续操作页面。');
                                }}
                            >
                                后台运行
                            </Button>
                        ),
                        <Button key="cancel" disabled={isUploading} onClick={() => setIsUploadModalOpen(false)}>取消</Button>,
                        <Button 
                            key="upload" 
                            type="primary" 
                            loading={isUploading && activeQueueIndex !== null} 
                            disabled={!filesDropped || uploadQueue.every(q => q.status === 'success')} 
                            onClick={handleStartUpload}
                        >
                            {uploadQueue.some(q => q.status === 'success') ? '继续上传' : '确认上传'}
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
                                    将数采文件夹或压缩包拖拽到此区域上传
                                </div>
                                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 20, maxWidth: '80%', pointerEvents: 'none' }}>
                                    支持直接拖入整个文件夹（例如 ./鹿鸣采集数据），或拖入包含 timestamps.csv 和 video.mp4 等会话包的 ZIP 压缩文件。
                                </div>
                                <Space size="middle" style={{ marginTop: 10 }}>
                                    <Button type="primary" onClick={(e) => { e.stopPropagation(); folderInputRef.current.click(); }}>
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
                                            数采包结构解析就绪！
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            (已识别出 {uploadQueue.length} 个数采会话)
                                        </Text>
                                    </Space>
                                    <Button size="small" danger disabled={isUploading} onClick={() => { setFilesDropped(false); setUploadQueue([]); setCliSuggested(false); }}>
                                        重新选择
                                    </Button>
                                </div>

                                {/* Overall Progress Tracker */}
                                {(isUploading || uploadQueue.some(q => q.progress > 0)) && (
                                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e6f4ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                            <Text strong type="primary">总上传进度 ({uploadQueue.filter(q => q.status === 'success').length}/{uploadQueue.length})</Text>
                                            <Text strong type="primary">{overallProgressPercent}%</Text>
                                        </div>
                                        <Progress percent={overallProgressPercent} showInfo={false} size="small" strokeColor="#1677ff" status={isUploading ? "active" : "normal"} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                                            <span>已传输: {(uploadedBytes / 1024 / 1024).toFixed(1)} MB / {(totalQueueSize / 1024 / 1024).toFixed(1)} MB</span>
                                            <Space size="middle">
                                                {isUploading ? (
                                                    <Button size="small" type="text" danger icon={<PauseOutlined />} onClick={handlePauseAll} style={{ padding: 0, height: 'auto', fontSize: 11 }}>暂停全部</Button>
                                                ) : (
                                                    <Button size="small" type="text" icon={<PlayCircleOutlined />} onClick={handleResumeAll} style={{ padding: 0, height: 'auto', fontSize: 11, color: '#52c41a' }}>恢复全部</Button>
                                                )}
                                            </Space>
                                        </div>
                                    </div>
                                )}

                                {/* Upload Queue Table */}
                                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', background: '#fafafa', marginBottom: 16 }}>
                                    <Table 
                                        size="small"
                                        dataSource={uploadQueue}
                                        rowKey="id"
                                        pagination={false}
                                        columns={[
                                            {
                                                title: '会话/文件夹名称',
                                                dataIndex: 'name',
                                                key: 'name',
                                                render: (text) => (
                                                    <Space>
                                                        <FolderOpenOutlined style={{ color: '#faad14' }} />
                                                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{text}</span>
                                                    </Space>
                                                )
                                            },
                                            {
                                                title: '大小',
                                                dataIndex: 'size',
                                                key: 'size',
                                                width: 100,
                                                render: (bytes) => {
                                                    if (bytes === 0) return '0 B';
                                                    const k = 1024;
                                                    const sizes = ['B', 'KB', 'MB', 'GB'];
                                                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                                                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                                                }
                                            },
                                            {
                                                title: '进度/状态',
                                                key: 'progress',
                                                width: 180,
                                                render: (_, record, index) => {
                                                    let statusType = 'normal';
                                                    if (record.status === 'success') statusType = 'success';
                                                    if (record.status === 'paused') statusType = 'normal';
                                                    return (
                                                        <div style={{ width: '100%' }}>
                                                            <Progress percent={record.progress} size="small" status={statusType} showInfo={false} />
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                                                                <span>{record.speed}</span>
                                                                <span>{record.timeLeft}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            },
                                            {
                                                title: '操作',
                                                key: 'action',
                                                width: 90,
                                                align: 'center',
                                                render: (_, record, index) => {
                                                    if (record.status === 'success') {
                                                        return <Tag color="success">已完成</Tag>;
                                                    }
                                                    if (record.status === 'uploading') {
                                                        return (
                                                            <Button 
                                                                type="text" 
                                                                size="small" 
                                                                icon={<PauseOutlined />} 
                                                                onClick={() => handlePauseItem(index)}
                                                                style={{ color: '#faad14' }}
                                                            />
                                                        );
                                                    }
                                                    return (
                                                        <Button 
                                                            type="text" 
                                                            size="small" 
                                                            icon={<PlayCircleOutlined />} 
                                                            onClick={() => handleResumeItem(index)}
                                                            style={{ color: '#52c41a' }}
                                                        />
                                                    );
                                                }
                                            }
                                        ]}
                                    />
                                </div>

                                {/* Large File / CLI suggestions */}
                                {cliSuggested && (
                                    <Card 
                                        size="small" 
                                        style={{ 
                                            background: '#fffbe6', 
                                            border: '1px solid #ffe58f', 
                                            borderRadius: 8 
                                        }}
                                        styles={{ body: { padding: '12px 16px' } }}
                                    >
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <WarningOutlined style={{ color: '#faad14', fontSize: 18, marginTop: 2 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#d46b08', fontSize: 13, marginBottom: 4 }}>
                                                    检测到超大型数据文件夹 (包含 &gt;500MB 会话包)
                                                </div>
                                                <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.5, marginBottom: 8 }}>
                                                    推荐使用我们的 **Lumos 数采传输命令行助手** 进行极速、稳定的断点续传与线程优化。
                                                </div>
                                                <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#111827' }}>
                                                        lumos-cli upload --task-id {uploadingTask?.taskId} --dir ./鹿鸣采集数据
                                                    </code>
                                                    <Button 
                                                        size="small" 
                                                        type="link" 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`lumos-cli upload --task-id ${uploadingTask?.taskId} --dir ./鹿鸣采集数据`);
                                                            message.success('命令行已复制到剪贴板！');
                                                        }}
                                                        style={{ padding: 0, height: 'auto', fontSize: 11 }}
                                                    >
                                                        复制指令
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                </Modal>

                {/* Minimized Background Uploading Widget */}
                {isMinimized && uploadingTask && (
                    <div style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        width: 320,
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        borderRadius: 12,
                        padding: 16,
                        zIndex: 9999,
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space size="small">
                                <LoadingOutlined spin={isUploading} style={{ color: '#1677ff', fontSize: 16 }} />
                                <Text strong style={{ fontSize: 13 }}>正在上传数采包...</Text>
                            </Space>
                            <Button 
                                type="link" 
                                size="small" 
                                onClick={() => { setIsMinimized(false); setIsUploadModalOpen(true); }}
                                style={{ padding: 0 }}
                            >
                                展开详情
                            </Button>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <Text type="secondary">总进度 ({uploadQueue.filter(q => q.status === 'success').length}/{uploadQueue.length})</Text>
                                <Text strong>{overallProgressPercent}%</Text>
                            </div>
                            <Progress percent={overallProgressPercent} status={isUploading ? "active" : "normal"} strokeColor="#1677ff" size="small" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                            <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                                {isUploading ? `速度: ${uploadQueue[activeQueueIndex]?.speed || '—'}` : '上传已暂停'}
                            </span>
                            <Space size="small">
                                {isUploading ? (
                                    <Button size="small" icon={<PauseOutlined />} onClick={handlePauseAll}>暂停全部</Button>
                                ) : (
                                    <Button size="small" type="primary" icon={<CaretRightOutlined />} onClick={handleResumeAll}>恢复全部</Button>
                                )}
                            </Space>
                        </div>
                    </div>
                )}

            </MainLayout>
    );
}
