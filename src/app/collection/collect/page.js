'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Tag, Space, Input, Select, Form, Card, Typography, Drawer, Descriptions, Badge, Progress, Statistic, Row, Col, Steps, Modal, App, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, ApiOutlined, DashboardOutlined, HddOutlined, CheckCircleFilled, WarningFilled, DownOutlined, UpOutlined, CloudUploadOutlined, FolderOpenOutlined, InboxOutlined, LoadingOutlined, PauseOutlined, CaretRightOutlined, WarningOutlined } from '@ant-design/icons';
import { QueryFilter, ProFormText, ProFormSelect, ProFormDatePicker } from '@ant-design/pro-components';
import MainLayout from '@/components/MainLayout';
import SpecMarker from '@/components/SpecMarker';

const { Title, Text } = Typography;

const mockData = [
    { key: '1', name: 'CarTrunkStorage_job', taskId: '42729', purpose: 'OperationalCollection', sceneCategory: 'Industry(工业)', subSceneCategory: 'Workshop(车厂)', collectMode: 'WholeBody(全身)', connectionType: 'Master-slaveArm', deviceInfo: '—', collector: '采集员00831', status: '已采集', progress: '40/40', qaPassRate: '100%' },
    { key: '2', name: 'CarTrunkStorage_job', taskId: '35676', purpose: 'OperationalCollection', sceneCategory: 'Industry(工业)', subSceneCategory: 'Workshop(车厂)', collectMode: 'WholeBody(全身)', connectionType: 'Master-slaveArm', deviceInfo: '—', collector: '采集员00831', status: '采集中', progress: '13/100', qaPassRate: '67%' },
    { key: '3', name: '颜色分类_job', taskId: '29313', purpose: 'OperationalCollection', sceneCategory: 'Household(家庭)', subSceneCategory: '—', collectMode: 'WholeBody(全身)', connectionType: 'Master-slaveArm', deviceInfo: '—', collector: '采集员00831', status: '采集中', progress: '2740/4000', qaPassRate: '96%' },
    { key: '4', name: '药品检索_job', taskId: '19871', purpose: 'OperationalCollection', sceneCategory: 'Household(家庭)', subSceneCategory: '—', collectMode: 'WholeBody(全身)', connectionType: 'Master-slaveArm', deviceInfo: '—', collector: '采集员00831', status: '已采集', progress: '1224/2000', qaPassRate: '98%' },
    { key: '5', name: '线缆整理_job', taskId: '16516', purpose: 'OperationalCollection', sceneCategory: 'Industry(工业)', subSceneCategory: 'Electronic Assembly', collectMode: 'WholeBody(全身)', connectionType: 'Master-slaveArm', deviceInfo: '—', collector: '采集员00831', status: '已采集', progress: '1394/1500', qaPassRate: '96%' }
];

const collectStatusMap = { '采集中': 'processing', '采集完成': 'success', '待采集': 'default' };
const dataStatusMap = { '上传中': 'processing', '处理完成': 'success', '未上传': 'default', '处理中': 'warning', '-': 'default' };

export default function CollectTaskPage() {
    const router = useRouter();
    const { message, notification } = App.useApp();
    const [form] = Form.useForm();
    const [detailOpen, setDetailOpen] = useState(false);
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
    const [filters, setFilters] = useState({});

    // Drag-and-drop states
    const [dragActive, setDragActive] = useState(false);
    const [filesDropped, setFilesDropped] = useState(false);
    const [uploadedFileList, setUploadedFileList] = useState([]);
    const folderInputRef = React.useRef(null);
    const setFolderInputRef = React.useCallback((node) => {
        if (node) {
            node.setAttribute('webkitdirectory', '');
            node.setAttribute('directory', '');
        }
        folderInputRef.current = node;
    }, []);

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

    const filteredData = useMemo(() => {
        return mockData.filter(item => {
            const idMatch = !filters.taskId || item.taskId.includes(filters.taskId);
            const nameMatch = !filters.taskName || item.name.includes(filters.taskName);
            const statusMatch = !filters.status || item.status === filters.status;
            return idMatch && nameMatch && statusMatch;
        });
    }, [filters]);

    const summaryStats = useMemo(() => {
        const uploadedCount = mockData.filter(item => uploadedTasks[item.taskId]).length;
        const collectingCount = mockData.filter(item => item.collectStatus === '采集中').length;
        const pendingCount = mockData.filter(item => item.collectStatus === '待采集').length;
        const completedCount = mockData.filter(item => item.collectStatus === '采集完成').length + uploadedCount;
        const uploadingCount = uploadQueue.filter(item => item.status === 'uploading').length;
        return [
            { title: '待采集任务', value: pendingCount, color: '#8c8c8c', icon: <ClockCircleOutlined /> },
            { title: '采集中', value: collectingCount, color: '#1677ff', icon: <PlayCircleOutlined /> },
            { title: '已完成/已上传', value: completedCount, color: '#52c41a', icon: <CheckCircleOutlined /> },
            { title: '上传队列', value: uploadingCount || uploadQueue.length, color: '#faad14', icon: <CloudUploadOutlined /> },
        ];
    }, [uploadedTasks, uploadQueue]);

    const finishUpload = React.useCallback((currentQueue) => {
        if (!uploadingTask) return;

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
        setUploadQueue([]);
        setFilesDropped(false);
    }, [notification, uploadingTask]);

    // Multi-folder sequential uploading simulation logic
    useEffect(() => {
        const currentQueue = uploadQueueRef.current;
        if (!isUploading || activeQueueIndex === null) {
            return;
        }

        if (currentQueue.length > 0 && activeQueueIndex >= currentQueue.length) {
            finishUpload(currentQueue);
            return;
        }

        const activeItem = currentQueue[activeQueueIndex];
        if (!activeItem) return;

        if (activeItem.status === 'success') {
            const nextIndex = currentQueue.findIndex((q, idx) => idx > activeQueueIndex && q.status !== 'success');
            if (nextIndex !== -1) {
                setActiveQueueIndex(nextIndex);
            } else {
                finishUpload(currentQueue);
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

                const finishedQueue = currentQueue.map((q, idx) => 
                    idx === activeQueueIndex 
                        ? { ...q, progress: 100, status: 'success', speed: '0 KB/s', timeLeft: '已完成' } 
                        : q
                );
                setUploadQueue(finishedQueue);
                setTimeout(() => {
                    if (activeQueueIndex >= currentQueue.length - 1) {
                        finishUpload(finishedQueue);
                    } else {
                        setActiveQueueIndex(prev => prev + 1);
                    }
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
    }, [isUploading, activeQueueIndex, finishUpload]);

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
        {
            title: '序号',
            dataIndex: 'key',
            key: 'key',
            width: 70,
            align: 'center',
        },
        {
            title: '任务名称',
            dataIndex: 'name',
            key: 'name',
            width: 180,
        },
        {
            title: '任务ID',
            dataIndex: 'taskId',
            key: 'taskId',
            width: 100,
        },
        {
            title: '任务用途',
            dataIndex: 'purpose',
            key: 'purpose',
            width: 160,
            ellipsis: true,
        },
        {
            title: '场景分类',
            dataIndex: 'sceneCategory',
            key: 'sceneCategory',
            width: 140,
        },
        {
            title: '子场景分类',
            dataIndex: 'subSceneCategory',
            key: 'subSceneCategory',
            width: 160,
            ellipsis: true,
        },
        {
            title: '采集模式',
            dataIndex: 'collectMode',
            key: 'collectMode',
            width: 120,
        },
        {
            title: '连接类型',
            dataIndex: 'connectionType',
            key: 'connectionType',
            width: 140,
            ellipsis: true,
        },
        {
            title: '设备信息',
            dataIndex: 'deviceInfo',
            key: 'deviceInfo',
            width: 100,
        },
        {
            title: '采集员',
            dataIndex: 'collector',
            key: 'collector',
            width: 120,
        },
        {
            title: '进入采集',
            key: 'enterCollect',
            width: 100,
            render: (_, record) => (
                <Button 
                    type="link" 
                    onClick={() => window.open(`/collection/collect/workspace/${record.taskId}`, '_blank')}
                    style={{ padding: 0 }}
                >
                    开始采集
                </Button>
            )
        },
        {
            title: '手动上传',
            key: 'manualUpload',
            width: 100,
            render: (_, record) => (
                <Button 
                    type="link" 
                    onClick={() => {
                        setUploadingTask(record);
                        setIsUploadModalOpen(true);
                        setIsUploading(false);
                        setFilesDropped(false);
                        setUploadQueue([]);
                        setActiveQueueIndex(null);
                        setIsMinimized(false);
                        setCliSuggested(false);
                    }}
                    style={{ padding: 0 }}
                >
                    手动上传
                </Button>
            )
        },
        {
            title: '任务状态',
            key: 'status',
            width: 220,
            render: (_, record) => {
                const total = parseInt(record.progress.split('/')[1]) || 100;
                const current = parseInt(record.progress.split('/')[0]) || 0;
                const percent = Math.min(100, Math.round((current / total) * 100));
                
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <Tag color={record.status === '已采集' ? 'success' : 'processing'} style={{ margin: 0 }}>
                            {record.status}
                        </Tag>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Progress percent={percent} showInfo={false} size="small" strokeColor="#1890ff" style={{ margin: 0 }} />
                            <span style={{ fontSize: '11px', color: '#595959', whiteSpace: 'nowrap' }}>{record.progress}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            title: '质检合格率',
            dataIndex: 'qaPassRate',
            key: 'qaPassRate',
            width: 100,
        },
        {
            title: '采集列表',
            key: 'collectList',
            width: 90,
            render: (_, record) => (
                <Button 
                    type="link" 
                    onClick={() => router.push(`/collection/collect/detail/${record.taskId}`)}
                    style={{ padding: 0 }}
                >
                    查看
                </Button>
            )
        }
    ];

    return (
            <MainLayout>


                <Card 
                    style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa', border: '1px solid #f0f0f0' }} 
                    styles={{ body: { padding: '24px 24px 16px' } }}
                >
                    <Form
                        form={form}
                        layout="horizontal"
                        onValuesChange={(_, allValues) => {
                            setFilters(allValues);
                        }}
                    >
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="taskId" style={{ marginBottom: 12 }}>
                                    <Input placeholder="实例任务ID" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="taskName" style={{ marginBottom: 12 }}>
                                    <Input placeholder="实例任务名称" allowClear />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="status" style={{ marginBottom: 12 }}>
                                    <Select placeholder="请选择任务状态" allowClear options={[{ label: '已采集', value: '已采集' }, { label: '采集中', value: '采集中' }]} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={16}>
                                <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
                                    <DatePicker.RangePicker 
                                        separator="至" 
                                        placeholder={['开始时间', '结束时间']} 
                                        style={{ width: '100%' }} 
                                        allowClear 
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8} style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'center' }}>
                                <Button 
                                    type="primary" 
                                    icon={<SearchOutlined />} 
                                    onClick={() => {
                                        const values = form.getFieldsValue();
                                        setFilters(values);
                                    }}
                                >
                                    搜索
                                </Button>
                                <Button 
                                    icon={<ReloadOutlined />} 
                                    onClick={() => {
                                        form.resetFields();
                                        setFilters({});
                                    }}
                                >
                                    重置
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                <SpecMarker
                  id="collect-precheck"
                  number={1}
                  title="LIDAR/左右手相机 3D 预检自检"
                  rules={[
                    "开始采集前必须执行全通道自检（包括标定参数校验、图像帧率稳定性监测、雷达深度流连通性等）。",
                    "开始/继续采集操作会强依赖自检状态，若传感器检测（激光雷达/左右相机/手眼相机）未全部通过，按钮置灰或强警告拦截。",
                    "通过自检后生成的自检报告（包含 PTP 时钟同步延迟、重投影误差等）将作为元数据绑定到采集 Episode 中。"
                  ]}
                  remark="数据采集前置物理校验，防止因传感器损坏、线缆松动或时钟失准导致采集到不可用的废包。"
                >
                    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8 }}>
                        <Table 
                            columns={columns} 
                            dataSource={filteredData} 
                            scroll={{ x: 1500 }} 
                            pagination={{ 
                                pageSize: 10, 
                                showTotal: (t) => `共 ${t} 条`,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }} 
                        />
                    </Card>
                </SpecMarker>

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
                    <SpecMarker
                      id="collect-upload"
                      number={2}
                      title="数采文件夹解析与大文件传输"
                      rules={[
                        "支持直接选择或拖拽本地数采目录，前端通过递归解析，校验包含 timestamps.csv 和视频流等必需结构。",
                        "当数采会话包体积大于 500MB 时，自动激活命令行提示，引导用户使用 `lumos-cli` 工具，以获得极速的多线程并发、断点续传及网络抖动容错处理。",
                        "上传队列支持单任务会话级别的暂停、恢复及批量暂停/恢复功能，以应对采集车在复杂场站网络环境下的带宽控制。"
                      ]}
                      remark="主要用于离线大包数采，通过 H5 批量队列与本地 CLI 辅助通道的联合优化设计，保证TB级数据能够稳定入库。"
                      style={{ width: '100%' }}
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
                                ref={setFolderInputRef} 
                                style={{ display: 'none' }} 
                                multiple
                                onChange={handleFolderChange} 
                            />

                            {!filesDropped ? (
                                <div 
                                    onClick={() => {
                                        if (folderInputRef.current) {
                                            folderInputRef.current.value = '';
                                            folderInputRef.current.click();
                                        }
                                    }}
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
                                        <Button type="primary" onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (folderInputRef.current) {
                                                folderInputRef.current.value = '';
                                                folderInputRef.current.click();
                                            }
                                        }}>
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
                    </SpecMarker>
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
