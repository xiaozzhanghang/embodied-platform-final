'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Tree, Form, Select, Row, Col, Space, Tag, Typography, Breadcrumb, Tooltip, Empty, Divider, Tabs, Table, Pagination } from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  CameraOutlined, 
  DatabaseOutlined, 
  ShopOutlined, 
  AppstoreOutlined, 
  ContainerOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  AreaChartOutlined,
  DashboardOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';
import { FilterPanel, PageHeader, TableToolbar } from '@/components/ui';

const { Text, Title } = Typography;

// Left Tree structure matching Image 1
const initialTreeData = [
  {
    title: '仿真数据',
    key: 'sim-data',
    icon: <FolderOutlined />,
    children: [
      { title: '服务数据', key: 'sim-service', icon: <FolderOutlined /> },
      { title: '工业数据', key: 'sim-industrial', icon: <FolderOutlined /> },
      { title: '零售数据', key: 'sim-retail', icon: <FolderOutlined /> },
      { title: 'UMI服务', key: 'sim-umi-service', icon: <FolderOutlined /> },
      { title: 'UMI工业', key: 'sim-umi-industrial', icon: <FolderOutlined /> },
      { title: 'UMI零售', key: 'sim-umi-retail', icon: <FolderOutlined /> },
    ],
  },
  {
    title: '真实数据',
    key: 'real-data',
    icon: <FolderOutlined />,
    children: [
      { title: '服务数据', key: 'real-service', icon: <FolderOutlined /> },
      { title: '工业数据', key: 'real-industrial', icon: <FolderOutlined /> },
      { title: '零售数据', key: 'real-retail', icon: <FolderOutlined /> },
      { title: 'UMI服务', key: 'real-umi-service', icon: <FolderOutlined /> },
      { 
        title: 'UMI工业', 
        key: 'real-umi-industrial', 
        icon: <FolderOutlined />,
        children: [
          { title: 'TQLixiang', key: 'luming-data', icon: <FolderOutlined /> }
        ]
      },
      { title: 'UMI零售', key: 'real-umi-retail', icon: <FolderOutlined /> },
    ],
  },
  {
    title: '合成数据',
    key: 'synthetic-data',
    icon: <FolderOutlined />,
  },
];

// Cards representation matching Image 1
const mockCards = [
  { 
    id: '1b3e56c1b0bf4925a031b9933fb7a767', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '379.52 MB', 
    date: '2025-11-13', 
    frames: 1255, 
    type: 'RGB', 
    cover: '/assets/images/master_slave.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架 and 两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: 'session_028_6f8b9ee3b57db6db1a8b', 
    title: '鹿鸣双臂手眼协同动作采集 (session_028)', 
    tags: ['鹿鸣 v1.0', '真实数据'], 
    size: '220.90 MB', 
    date: '2026-05-20', 
    frames: 15222, 
    type: 'RGB + 3D Pose', 
    cover: '/assets/images/robot_body.png',
    robot: 'luming_dual_arm',
    serial: 'R002FBBCBABA0066',
    scene: 'Luming / lab_table',
    desc: '双臂手眼机器人在实验室桌面前，执行高频协同抓取及运动位姿标定',
    dataDir: ['left_hand_250801DR48FP26003296', 'right_hand_250801DR48FP26003349', 'quality_report', 'relative_transforms_left_to_right.txt', 'relative_transforms_right_to_left.txt'],
    isLuming: true
  },
  { 
    id: '1b52ced98e684eeb9fcd932bd234b3', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '410.07 MB', 
    date: '2025-11-12', 
    frames: 1320, 
    type: 'RGB', 
    cover: '/assets/images/robot_schematic.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架和两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: '1b974bb78e0a49ab9dbe5a0bb5086079', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '383.44 MB', 
    date: '2025-11-13', 
    frames: 1195, 
    type: 'RGB', 
    cover: '/assets/images/master_arm_schematic.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架和两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: '1c49cea106734051a95b671543c7bb5d', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '379.52 MB', 
    date: '2025-11-13', 
    frames: 1255, 
    type: 'RGB', 
    cover: '/assets/images/left_cam.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架 and 两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: '1ca171b257f245428f4231e2ad2765c5', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '410.07 MB', 
    date: '2025-11-12', 
    frames: 1320, 
    type: 'RGB', 
    cover: '/assets/images/right_cam.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架和两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: '1cc55d784e0045078702ced171802649', 
    title: '桌面书籍整理 (organize_books_on_the_table)', 
    tags: ['银河 v2.1', '仿真数据'], 
    size: '383.44 MB', 
    date: '2025-11-13', 
    frames: 1195, 
    type: 'RGB', 
    cover: '/assets/images/main_cam.png',
    robot: 'galbot_one_foxtrot',
    serial: 'R001FBBCBABA0058',
    scene: 'Company / work_station',
    desc: '机器人在桌面前，桌上有一个书架和两本书籍',
    dataDir: ['audio', 'camera', 'parameters', 'proprio_stats', 'task_info.json'],
    isLuming: false
  },
  { 
    id: 'session_029_6f8b9ee3b57db6db1a8c', 
    title: '鹿鸣双手臂动作标定测试 (session_029)', 
    tags: ['鹿鸣 v1.0', '真实数据'], 
    size: '185.20 MB', 
    date: '2026-05-21', 
    frames: 11020, 
    type: 'RGB + 3D Pose', 
    cover: '/assets/images/robot_body.png',
    robot: 'luming_dual_arm',
    serial: 'R002FBBCBABA0066',
    scene: 'Luming / lab_table',
    desc: '双手臂机器人在实验室桌面前，执行协同抓取及运动位姿标定',
    dataDir: ['left_hand_250801DR48FP26003296', 'right_hand_250801DR48FP26003349', 'quality_report', 'relative_transforms_left_to_right.txt', 'relative_transforms_right_to_left.txt'],
    isLuming: true
  },
  { 
    id: 'session_030_6f8b9ee3b57db6db1a8d', 
    title: '鹿鸣商超货架商品理货 (session_030)', 
    tags: ['鹿鸣 v1.0', '真实数据'], 
    size: '290.45 MB', 
    date: '2026-05-22', 
    frames: 16030, 
    type: 'RGB + 3D Pose', 
    cover: '/assets/images/robot_body.png',
    robot: 'luming_dual_arm',
    serial: 'R002FBBCBABA0066',
    scene: 'Luming / lab_table',
    desc: '双手臂机器人在实验室桌面前，执行协同抓取及运动位姿标定',
    dataDir: ['left_hand_250801DR48FP26003296', 'right_hand_250801DR48FP26003349', 'quality_report', 'relative_transforms_left_to_right.txt', 'relative_transforms_right_to_left.txt'],
    isLuming: true
  }
];

// Interactive File Tree for session_028 (Image 2 Left)
const sessionFileTree = [
  {
    title: 'session_028',
    key: 'session_root',
    icon: <FolderOpenOutlined />,
    children: [
      {
        title: 'left_hand_250801DR48FP26003296',
        key: 'left_hand',
        icon: <FolderOutlined />,
        children: [
          { 
            title: 'Clamp_Data', 
            key: 'left_clamp', 
            icon: <FolderOutlined />,
            children: [
              { title: 'clamp_data_tum.txt (201 KB)', key: 'left_clamp_tum', icon: <FileOutlined /> }
            ]
          },
          { 
            title: 'Merged_Trajectory', 
            key: 'left_merged', 
            icon: <FolderOutlined />,
            children: [
              { title: 'merge_stats.txt (331 B)', key: 'left_merge_txt', icon: <FileOutlined /> },
              { title: 'merged_trajectory.txt (2.3 MB)', key: 'left_merged_trajectory', icon: <FileOutlined /> }
            ]
          },
          { 
            title: 'RGB_Images', 
            key: 'left_rgb', 
            icon: <FolderOutlined />,
            children: [
              { title: 'timestamps.csv (47 KB)', key: 'left_time_csv', icon: <FileOutlined /> },
              { title: 'video.mp4 (127.3 MB)', key: 'left_video_mp4', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> }
            ]
          },
          { 
            title: 'SLAM_Poses', 
            key: 'left_slam', 
            icon: <FolderOutlined />,
            children: [
              { title: 'slam_processed.txt (2.3 MB)', key: 'left_slam_proc', icon: <FileOutlined /> },
              { title: 'slam_raw.txt (2.3 MB)', key: 'left_slam_raw', icon: <FileOutlined /> }
            ]
          },
          { title: 'queue_lengths.csv (9 KB)', key: 'left_queue_csv', icon: <FileOutlined /> }
        ]
      },
      {
        title: 'right_hand_250801DR48FP26003349',
        key: 'right_hand',
        icon: <FolderOutlined />,
        children: [
          { 
            title: 'Clamp_Data', 
            key: 'right_clamp', 
            icon: <FolderOutlined />,
            children: [
              { title: 'clamp_data_tum.txt (200 KB)', key: 'right_clamp_tum', icon: <FileOutlined /> }
            ]
          },
          { 
            title: 'Merged_Trajectory', 
            key: 'right_merged', 
            icon: <FolderOutlined />,
            children: [
              { title: 'merge_stats.txt (332 B)', key: 'right_merge_txt', icon: <FileOutlined /> },
              { title: 'merged_trajectory.txt (2.3 MB)', key: 'right_merged_trajectory', icon: <FileOutlined /> }
            ]
          },
          { 
            title: 'RGB_Images', 
            key: 'right_rgb', 
            icon: <FolderOutlined />,
            children: [
              { title: 'timestamps.csv (46 KB)', key: 'right_time_csv', icon: <FileOutlined /> },
              { title: 'video.mp4 (81.5 MB)', key: 'right_video_mp4', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> }
            ]
          },
          { 
            title: 'SLAM_Poses', 
            key: 'right_slam', 
            icon: <FolderOutlined />,
            children: [
              { title: 'slam_processed.txt (2.3 MB)', key: 'right_slam_proc', icon: <FileOutlined /> },
              { title: 'slam_raw.txt (2.4 MB)', key: 'right_slam_raw', icon: <FileOutlined /> }
            ]
          },
          { title: 'queue_lengths.csv (9 KB)', key: 'right_queue_csv', icon: <FileOutlined /> }
        ]
      },
      {
        title: 'quality_report',
        key: 'quality_report_dir',
        icon: <FolderOutlined />,
        children: [
          { title: 'check.log (185 B)', key: 'check_log', icon: <FileOutlined /> },
          { title: 'quality_report.json (7.4 KB)', key: 'report_json', icon: <FileOutlined style={{ color: '#1890ff' }} /> },
          { title: 'quality_report.txt (3.0 KB)', key: 'report_txt', icon: <FileOutlined /> }
        ]
      },
      { title: 'relative_transforms_left_to_right.txt (1.2 MB)', key: 'trans_l_r', icon: <FileOutlined /> },
      { title: 'relative_transforms_right_to_left.txt (1.1 MB)', key: 'trans_r_l', icon: <FileOutlined /> }
    ]
  }
];

// Interactive File Tree for Simulation/Non-Luming datasets (Image 2 Left)
const nonLumingFileTree = [
  {
    title: 'data',
    key: 'data_root',
    icon: <FolderOpenOutlined />,
    children: [
      {
        title: 'audio',
        key: 'audio_dir',
        icon: <FolderOutlined />,
        children: [
          { title: 'audio.wav (1.3 MB)', key: 'audio_wav', icon: <FileOutlined /> }
        ]
      },
      {
        title: 'camera',
        key: 'camera_dir',
        icon: <FolderOutlined />,
        children: [
          {
            title: 'depth',
            key: 'depth_dir',
            icon: <FolderOutlined />,
            children: [
              { title: 'camera_head_depth.mkv (240.53 MB)', key: 'head_depth', icon: <FileOutlined /> },
              { title: 'camera_left_depth.mkv (59.35 MB)', key: 'left_depth', icon: <FileOutlined /> },
              { title: 'camera_right_depth.mkv (59.35 MB)', key: 'right_depth', icon: <FileOutlined /> }
            ]
          },
          {
            title: 'rgb',
            key: 'rgb_dir',
            icon: <FolderOutlined />,
            children: [
              { title: 'camera_head_color.mp4 (103.21 MB)', key: 'head_rgb', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> },
              { title: 'camera_left_color.mp4 (45.12 MB)', key: 'left_rgb_file', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> },
              { title: 'camera_right_color.mp4 (45.12 MB)', key: 'right_rgb_file', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> }
            ]
          }
        ]
      },
      {
        title: 'parameters',
        key: 'params_dir',
        icon: <FolderOutlined />,
        children: [
          { title: 'camera_intrinsics.json (2 KB)', key: 'cam_intrinsics', icon: <FileOutlined /> },
          { title: 'robot_extrinsics.json (2 KB)', key: 'robot_extrinsics', icon: <FileOutlined /> }
        ]
      },
      {
        title: 'proprio_stats',
        key: 'proprio_dir',
        icon: <FolderOutlined />,
        children: [
          { title: 'joint_states.csv (850 KB)', key: 'joint_states', icon: <FileOutlined /> },
          { title: 'end_effector_pose.csv (620 KB)', key: 'ee_pose', icon: <FileOutlined /> }
        ]
      },
      { title: 'task_info.json (1.5 KB)', key: 'task_info_json', icon: <FileOutlined /> }
    ]
  }
];

export default function DataCatalogPage() {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedTreeKey, setSelectedTreeKey] = useState('luming-data');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  
  // Player state refs
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const headVideoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync player controls
  const playAll = () => {
    if (leftVideoRef.current) leftVideoRef.current.play();
    if (rightVideoRef.current) rightVideoRef.current.play();
    if (headVideoRef.current) headVideoRef.current.play();
    setIsPlaying(true);
  };

  const pauseAll = () => {
    if (leftVideoRef.current) leftVideoRef.current.pause();
    if (rightVideoRef.current) rightVideoRef.current.pause();
    if (headVideoRef.current) headVideoRef.current.pause();
    setIsPlaying(false);
  };

  const resetAll = () => {
    if (leftVideoRef.current) {
      leftVideoRef.current.pause();
      leftVideoRef.current.currentTime = 0;
    }
    if (rightVideoRef.current) {
      rightVideoRef.current.pause();
      rightVideoRef.current.currentTime = 0;
    }
    if (headVideoRef.current) {
      headVideoRef.current.pause();
      headVideoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Reset page number on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTreeKey, searchText]);

  // Filter cards based on selected tree key and search text
  const filteredCards = mockCards.filter(card => {
    const matchesSearch = card.title.toLowerCase().includes(searchText.toLowerCase()) || 
                          card.id.toLowerCase().includes(searchText.toLowerCase());
    
    if (selectedTreeKey === 'luming-data') {
      return card.isLuming && matchesSearch;
    } else if (selectedTreeKey === 'sim-data' || selectedTreeKey.startsWith('sim-')) {
      return !card.isLuming && matchesSearch;
    } else if (selectedTreeKey === 'real-data' || selectedTreeKey.startsWith('real-')) {
      return matchesSearch; // Show all for root real data
    }
    return matchesSearch;
  });

  // Paginated cards (6 cards per page)
  const paginatedCards = filteredCards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    resetAll();
  };

  return (
    <MainLayout>
      <div className="ui-page">
      <PageHeader
        title={viewMode === 'list' ? '数据资产目录' : '数据详情'}
        description={viewMode === 'list' ? '按场景、来源与任务查找已完成的数据资产。' : '查看数据概况、文件清单与同步视频。'}
        breadcrumbs={[{ title: '数据资产' }, { title: viewMode === 'list' ? '数据资产目录' : '数据详情' }]}
        back={viewMode === 'detail' ? handleBack : undefined}
      />

      {viewMode === 'list' ? (
        <div className="fade-in-up">
          <Row gutter={16}>
            {/* Left Tree Panel */}
            <Col span={6}>
              <Card
                variant="borderless"
                style={{ borderRadius: 8, height: 'calc(100vh - 160px)', overflowY: 'auto' }}
                styles={{ body: { padding: '16px' } }}
              >
                <Input
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="搜索场景/子场景..."
                  style={{ marginBottom: '16px', borderRadius: '6px' }}
                  onChange={e => setSearchText(e.target.value)}
                />
                <Tree
                  showIcon
                  defaultExpandAll
                  defaultSelectedKeys={['luming-data']}
                  treeData={initialTreeData}
                  selectedKeys={[selectedTreeKey]}
                  onSelect={(keys) => {
                    if (keys.length) setSelectedTreeKey(keys[0]);
                  }}
                />
              </Card>
            </Col>

            {/* Right Cards List */}
            <Col span={18} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filters */}
              <FilterPanel>
                <Form layout="vertical" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                  <Form.Item label="任务名称ID" style={{ margin: 0, flex: 1 }}>
                    <Input 
                      placeholder="请输入任务编号ID或者任务名称" 
                      value={searchText} 
                      onChange={e => setSearchText(e.target.value)}
                      style={{ borderRadius: '6px' }} 
                    />
                  </Form.Item>
                  <Form.Item label="厂商" style={{ margin: 0, width: '240px' }}>
                    <Select placeholder="请选择厂商" style={{ borderRadius: '6px' }} allowClear>
                      <Select.Option value="luming">鹿鸣UMI</Select.Option>
                      <Select.Option value="yinhe">银河科技</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item style={{ margin: 0 }}>
                    <Space>
                      <Button type="primary">筛选</Button>
                      <Button onClick={() => { setSearchText(''); setSelectedTreeKey('luming-data'); }}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </FilterPanel>

              {/* Cards Grid */}
              <Card
                className="ui-table-card"
                variant="borderless"
                style={{ borderRadius: 8, minHeight: 'calc(100vh - 300px)' }}
                styles={{ body: { padding: '20px' } }}
              >
                <TableToolbar title="数据资产列表" count={filteredCards.length} />
                {filteredCards.length > 0 ? (
                  <>
                  <Row gutter={[16, 20]}>
                    {paginatedCards.map((card) => (
                      <Col xl={8} lg={12} md={24} key={card.id}>
                        <Card
                          hoverable
                          style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}
                          styles={{ body: { padding: '16px' } }}
                          cover={
                            <div style={{ position: 'relative', height: '170px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img 
                                src={card.cover} 
                                alt={card.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }} 
                              />
                              <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.65)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                                {card.id.substring(0, 16)}...
                              </div>
                              {card.isLuming && (
                                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                  <Tag color="cyan" style={{ margin: 0 }}>真实物理采集</Tag>
                                </div>
                              )}
                            </div>
                          }
                        >
                          <div style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937', marginBottom: '8px', height: '44px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {card.title}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {card.tags.map((tag, i) => (
                              <Tag color={i === 0 ? 'blue' : 'default'} key={tag} style={{ margin: 0 }}>{tag}</Tag>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c8c8c', fontSize: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CameraOutlined /> {card.type}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DatabaseOutlined /> {card.size}</span>
                            <span>{card.date}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                              type="primary" 
                              icon={<EyeOutlined />} 
                              onClick={() => handleCardClick(card)}
                              style={{ flex: 1 }}
                            >
                              查看详情
                            </Button>
                            <Button 
                              icon={<DownloadOutlined />} 
                              style={{ flex: 1 }}
                              onClick={() => window.open(card.isLuming ? '/videos/session_028_left.mp4' : '#')}
                            >
                              下载
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {filteredCards.length > pageSize && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredCards.length}
                        onChange={(page) => setCurrentPage(page)}
                        showTotal={(total) => `共 ${total} 条数据`}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                  </>
                ) : (
                  <Empty description="暂无符合条件的数据资产" />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <div className="fade-in-up">
          {/* Top Overview Card */}
          <Card
            title={<Space><DatabaseOutlined style={{ color: '#1890ff' }} /><span>{selectedCard?.title}</span></Space>}
            style={{ borderRadius: 8, marginBottom: '16px' }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>数据集/会话 ID</Text>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff', marginTop: 4 }}>{selectedCard?.id}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>数据量 / 文件数</Text>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{selectedCard?.size} / {selectedCard?.dataDir.length} 文件</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>任务名称</Text>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{selectedCard?.title}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>采集总帧数</Text>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                    <Tag color="green" style={{ fontWeight: 600 }}>{selectedCard?.frames} 帧</Tag>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>场景类别 / 硬件底座</Text>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{selectedCard?.scene}</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>更新时间</Text>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{selectedCard?.date} 10:29:38 AM</div>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <Row gutter={[24, 16]}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 13 }}>机器人设备名称</Text>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>
                  <Tag color="blue">{selectedCard?.robot}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 13 }}>设备 SN 序列号</Text>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{selectedCard?.serial}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 13 }}>初始化物理场景描述</Text>
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, fontStyle: 'italic', color: '#595959' }}>
                  "{selectedCard?.desc}"
                </div>
              </Col>
            </Row>

          </Card>

          {/* Bottom Split Section */}
          <Row gutter={16}>
            {/* Left File List Tree */}
            <Col span={5}>
              <Card
                title={<Space><FolderOpenOutlined style={{ color: '#fa8c16' }} /><span>文件列表清单</span></Space>}
                style={{ borderRadius: 8, height: '560px', overflowY: 'auto' }}
                styles={{ body: { padding: '12px' } }}
              >
                <Tree
                  showIcon
                  defaultExpandAll
                  treeData={selectedCard?.isLuming ? sessionFileTree : nonLumingFileTree}
                />
              </Card>
            </Col>

            {/* Right Video Grid */}
            <Col span={19}>
              <Card
                title={<Space><PlayCircleOutlined style={{ color: '#52c41a' }} /><span>手手眼姿态时序真值（Episode 同步播放）</span></Space>}
                extra={
                  <Space size={8}>
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />} 
                      onClick={playAll}
                    >
                      播放全部
                    </Button>
                    <Button 
                      type="primary" 
                      danger 
                      icon={<PauseCircleOutlined />} 
                      onClick={pauseAll}
                    >
                      暂停全部
                    </Button>
                    <Button 
                      icon={<RedoOutlined />} 
                      onClick={resetAll}
                    >
                      重置全部
                    </Button>
                  </Space>
                }
                style={{ borderRadius: 8, height: '560px' }}
                styles={{ body: { padding: '16px' } }}
              >
                <div style={{ marginTop: '10px' }}>
                  <Row gutter={16}>
                    {/* Left View */}
                    <Col span={12}>
                      <Card
                        title={<span style={{ fontSize: 13, fontWeight: 600 }}>Left (左侧视角)</span>}
                        variant="borderless"
                        styles={{ body: { padding: '8px' } }}
                        style={{ background: '#f5f5f5', borderRadius: 6 }}
                      >
                        {selectedCard?.isLuming ? (
                          <video 
                            ref={leftVideoRef} 
                            src="/videos/session_028_left.mp4" 
                            style={{ width: '100%', height: '380px', borderRadius: 4, background: '#000', objectFit: 'cover' }} 
                            controls
                            muted
                          />
                        ) : (
                          <div style={{ height: '380px', background: '#262626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
                            <span style={{ fontSize: '11px' }}>[ 仿真录制 Left 视角流 ]</span>
                          </div>
                        )}
                      </Card>
                    </Col>

                    {/* Right View */}
                    <Col span={12}>
                      <Card
                        title={<span style={{ fontSize: 13, fontWeight: 600 }}>Right (右侧视角)</span>}
                        variant="borderless"
                        styles={{ body: { padding: '8px' } }}
                        style={{ background: '#f5f5f5', borderRadius: 6 }}
                      >
                        {selectedCard?.isLuming ? (
                          <video 
                            ref={rightVideoRef} 
                            src="/videos/session_028_right.mp4" 
                            style={{ width: '100%', height: '380px', borderRadius: 4, background: '#000', objectFit: 'cover' }} 
                            controls
                            muted
                          />
                        ) : (
                          <div style={{ height: '380px', background: '#262626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
                            <span style={{ fontSize: '11px' }}>[ 仿真录制 Right 视角流 ]</span>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}
      </div>
    </MainLayout>
  );
}
