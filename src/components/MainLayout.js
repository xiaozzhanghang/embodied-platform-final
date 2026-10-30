'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Badge, Space, Typography, Tag, App, Switch, Drawer, Divider, List, Button } from 'antd';
import logoImg from '../assets/tq_logo.svg';
import { SpecProvider, useSpec } from './SpecContext';
import {
  DashboardOutlined,
  TagsOutlined,
  FormOutlined,
  CameraOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  RobotOutlined,
  FileSearchOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  EyeOutlined,
  LayoutOutlined,
  ReadOutlined,
  InboxOutlined,
  VideoCameraOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  IdcardOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
  InfoCircleOutlined,
  TranslationOutlined,
  FullscreenOutlined,
  CloudOutlined,
  SunOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  GlobalOutlined,
  HomeOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Role constants
export const ROLES = {
  ADMIN_ZHOU: 'ADMIN_ZHOU',
  COLLECTOR_LIN: 'COLLECTOR_LIN',
  QC_ZHAO: 'QC_ZHAO',
  ANNOTATOR_CHEN: 'ANNOTATOR_CHEN',
  REVIEWER_GU: 'REVIEWER_GU',
  // Backwards compatibility aliases
  ADMIN: 'ADMIN_ZHOU',
  QA: 'QC_ZHAO',
  COLLECTOR: 'COLLECTOR_LIN',
};

export const ROLE_USER_MAP = {
  ADMIN_ZHOU: {
    key: 'ADMIN_ZHOU',
    username: 'admin_zhou',
    name: '周启明',
    display: '周启明 · 系统管理员',
    title: '采集系统管理员',
    badgeColor: 'gold',
    defaultRoute: '/collection/collection-tasks'
  },
  COLLECTOR_LIN: {
    key: 'COLLECTOR_LIN',
    username: 'collector_lin',
    name: '林嘉禾',
    display: '林嘉禾 · 数据采集员',
    title: '数据采集员',
    badgeColor: 'blue',
    defaultRoute: '/collection/collect'
  },
  QC_ZHAO: {
    key: 'QC_ZHAO',
    username: 'qc_zhao',
    name: '赵妍',
    display: '赵妍 · 数据质检员',
    title: '数据质检员',
    badgeColor: 'cyan',
    defaultRoute: '/collection/qa'
  },
  ANNOTATOR_CHEN: {
    key: 'ANNOTATOR_CHEN',
    username: 'annotator_chen',
    name: '陈曦',
    display: '陈曦 · 数据标注员',
    title: '数据标注员',
    badgeColor: 'purple',
    defaultRoute: '/collection/annotation-tasks'
  },
  REVIEWER_GU: {
    key: 'REVIEWER_GU',
    username: 'reviewer_gu',
    name: '顾衡',
    display: '顾衡 · 数据审核员',
    title: '数据审核员',
    badgeColor: 'magenta',
    defaultRoute: '/annotation/review'
  }
};

const menuItems = [
  {
    key: 'config_labels',
    icon: <TagsOutlined />,
    label: '基础数据',
    roles: [ROLES.ADMIN_ZHOU],
    children: [
      { key: '/collection/projects', label: '项目管理' },
      { key: '/collection/objects', label: '物体库' },
      { key: '/collection/config', label: '任务标签' },
      { key: '/collection/object-labels', label: '物体标签' },
    ],
  },
  {
    key: 'config_devices',
    icon: <RobotOutlined />,
    label: '设备管理',
    roles: [ROLES.ADMIN_ZHOU, ROLES.COLLECTOR_LIN],
    children: [
      { key: '/collection/device-types', label: '设备类型', roles: [ROLES.ADMIN_ZHOU] },
      { key: '/collection/devices', label: '设备列表', roles: [ROLES.ADMIN_ZHOU, ROLES.COLLECTOR_LIN] },
    ],
  },
  {
    key: 'data_collection',
    icon: <DatabaseOutlined />,
    label: '任务管理',
    children: [
      { key: '/collection/collection-tasks', icon: <CameraOutlined />, label: '数据采集', roles: [ROLES.ADMIN_ZHOU, ROLES.COLLECTOR_LIN] },
      { key: '/collection/qa', icon: <FileSearchOutlined />, label: '数据质检', roles: [ROLES.ADMIN_ZHOU, ROLES.QC_ZHAO] },
      { key: '/collection/annotation-tasks', icon: <FormOutlined />, label: '数据标注', roles: [ROLES.ADMIN_ZHOU, ROLES.ANNOTATOR_CHEN] },
      { key: '/annotation/review', icon: <AuditOutlined />, label: '数据审核', roles: [ROLES.ADMIN_ZHOU, ROLES.REVIEWER_GU] },
      { key: '/annotation/audit', icon: <EyeOutlined />, label: '标注工作台', roles: [ROLES.ADMIN_ZHOU, ROLES.ANNOTATOR_CHEN, ROLES.REVIEWER_GU] },
      { key: '/collection/templates', icon: <LayoutOutlined />, label: '模版中心', roles: [ROLES.ADMIN_ZHOU, ROLES.ANNOTATOR_CHEN] },
      { key: '/collection/taskbooks', icon: <ReadOutlined />, label: '任务书', roles: [ROLES.ADMIN_ZHOU, ROLES.COLLECTOR_LIN, ROLES.QC_ZHAO, ROLES.ANNOTATOR_CHEN, ROLES.REVIEWER_GU] },
    ],
  },
  {
    key: '/collection/collect',
    icon: <VideoCameraOutlined />,
    label: '任务中心（采集端）',
    roles: [ROLES.ADMIN_ZHOU, ROLES.COLLECTOR_LIN],
  },
  {
    key: 'data_assets',
    icon: <DatabaseOutlined />,
    label: '数据资产',
    roles: [ROLES.ADMIN_ZHOU, ROLES.QC_ZHAO, ROLES.COLLECTOR_LIN],
    children: [
      { key: '/screen', label: '📊 数采工厂大屏 (指挥中心)' },
      { key: '/data/catalog', label: '数据资产目录' },
      { key: '/data/datasets', label: '高质量数据集' },
      { key: '/data/reports', label: '数据资产报表' },
    ],
  },
  {
    key: 'permissions',
    icon: <SafetyCertificateOutlined />,
    label: '权限设置',
    roles: [ROLES.ADMIN_ZHOU],
    children: [
      { key: '/accounts/list', label: '用户管理' },
    ],
  },
];

const breadcrumbMap = {
  '/collection/projects': ['基础数据', '项目管理'],
  '/collection/config': ['基础数据', '任务标签'],
  '/collection/objects': ['基础数据', '物体库'],
  '/collection/object-labels': ['基础数据', '物体标签'],
  '/collection/devices': ['设备管理', '设备列表'],
  '/collection/device-types': ['设备管理', '设备类型'],
  '/collection/tasks': ['任务管理', '数据采集'],
  '/collection/collection-tasks': ['任务管理', '数据采集'],
  '/collection/collection-tasks/create': ['数据采集', '新建采集计划'],
  '/collection/qa': ['任务管理', '数据质检'],
  '/collection/annotation-tasks': ['任务管理', '数据标注'],
  '/collection/annotation-tasks/create': ['数据标注', '新建数据标注'],
  '/annotation/review': ['任务管理', '数据审核'],
  '/annotation/review-list': ['任务管理', '数据审核', '审核详情'],
  '/annotation/audit': ['任务管理', '标注工作台'],
  '/collection/collect': ['任务中心（采集端）'],
  '/collection/collect-home': ['首页'],
  '/collection/templates': ['模版中心'],
  '/collection/taskbooks': ['任务书'],
  '/data/raw': ['数据资产', '原始数据'],
  '/data/catalog': ['数据资产', '数据资产目录'],
  '/data/datasets': ['数据资产', '高质量数据集'],
  '/data/reports': ['数据资产', '数据资产报表'],
  '/data/download': ['下载中心'],
  '/accounts/list': ['权限设置', '用户管理'],
};

function MainLayoutContent({ children }) {
  const { specMode, toggleSpecMode, activeSpec, setActiveSpec } = useSpec();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(ROLES.ADMIN_ZHOU);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarRobotMode, setSidebarRobotMode] = useState('video_webm'); // 默认启用方案 C：透明视频 (WebM / ProRes)
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  useEffect(() => {
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (savedRole && (ROLE_USER_MAP[savedRole] || ROLES[savedRole])) {
      const normalized = ROLES[savedRole] || savedRole;
      setUserRole(normalized);
    }
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Proactive Route Prefetching for instantaneous menu switching
  useEffect(() => {
    const prefetchRoutes = [
      '/collection/collection-tasks',
      '/collection/qa',
      '/collection/annotation-tasks',
      '/annotation/review',
      '/annotation/audit',
      '/collection/templates',
      '/collection/taskbooks',
      '/collection/devices',
      '/collection/device-types',
      '/collection/projects',
      '/data/catalog',
      '/data/datasets',
      '/data/reports',
      '/accounts/list',
    ];
    prefetchRoutes.forEach(r => {
      try {
        router.prefetch(r);
      } catch (e) {
        // ignore
      }
    });
  }, [router]);

  const handleRoleChange = (roleKey) => {
    const roleInfo = ROLE_USER_MAP[roleKey];
    if (!roleInfo) return;
    
    setUserRole(roleKey);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', roleKey);
    }
    message.success(`已切换为角色：${roleInfo.display}`);
    if (roleInfo.defaultRoute) {
      router.push(roleInfo.defaultRoute);
    }
  };

  const crumbs = breadcrumbMap[pathname] || ['任务管理'];

  const filterMenuItems = (items) => {
    return items
      .filter(item => !item.roles || item.roles.includes(userRole))
      .map(item => {
        if (item.children) {
          const children = filterMenuItems(item.children);
          if (children.length > 0) {
            return { ...item, children };
          }
          return null;
        }
        return item;
      })
      .filter(item => item !== null);
  };

  const filteredItems = filterMenuItems(menuItems);
  const getMenuItems = () => {
    if (userRole === ROLES.COLLECTOR_LIN && pathname === '/collection/collect-home') {
      return [
        { key: '/collection/collect-home', icon: <HomeOutlined />, label: '首页' },
        { key: '/collection/collect', icon: <SolutionOutlined />, label: '任务中心（采集端）' },
        { key: '/collection/devices', icon: <RobotOutlined />, label: '设备管理' },
      ];
    }
    return filteredItems;
  };
  const effectiveCollapsed = collapsed || isMobile;
  const siderWidth = isMobile ? 64 : 240;
  const collapsedWidth = isMobile ? 64 : 80;

  const getOpenKeys = () => {
    const parentMap = {};
    const traverse = (items, parentKey = null) => {
      items.forEach(item => {
        if (parentKey) parentMap[item.key] = parentKey;
        if (item.children) traverse(item.children, item.key);
      });
    };
    traverse(menuItems);
    
    let current = pathname;
    const openKeys = [];
    while (parentMap[current]) {
      openKeys.push(parentMap[current]);
      current = parentMap[current];
    }
    return openKeys;
  };

  const currentUser = ROLE_USER_MAP[userRole] || ROLE_USER_MAP.ADMIN_ZHOU;

  const userMenu = {
    items: [
      { key: 'role-header', label: <Text type="secondary" style={{ fontSize: 11 }}>测试账号角色快速切换</Text>, disabled: true },
      {
        key: ROLES.ADMIN_ZHOU,
        icon: <SafetyCertificateOutlined style={{ color: '#d97706' }} />,
        label: <span>周启明 · 系统管理员 <Tag color="gold" style={{ fontSize: 10, marginLeft: 4 }}>admin_zhou</Tag></span>,
        className: userRole === ROLES.ADMIN_ZHOU ? 'ant-dropdown-menu-item-selected' : ''
      },
      {
        key: ROLES.COLLECTOR_LIN,
        icon: <VideoCameraOutlined style={{ color: '#2563eb' }} />,
        label: <span>林嘉禾 · 数据采集员 <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>collector_lin</Tag></span>,
        className: userRole === ROLES.COLLECTOR_LIN ? 'ant-dropdown-menu-item-selected' : ''
      },
      {
        key: ROLES.QC_ZHAO,
        icon: <FileSearchOutlined style={{ color: '#059669' }} />,
        label: <span>赵妍 · 数据质检员 <Tag color="cyan" style={{ fontSize: 10, marginLeft: 4 }}>qc_zhao</Tag></span>,
        className: userRole === ROLES.QC_ZHAO ? 'ant-dropdown-menu-item-selected' : ''
      },
      {
        key: ROLES.ANNOTATOR_CHEN,
        icon: <FormOutlined style={{ color: '#7c3aed' }} />,
        label: <span>陈曦 · 数据标注员 <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>annotator_chen</Tag></span>,
        className: userRole === ROLES.ANNOTATOR_CHEN ? 'ant-dropdown-menu-item-selected' : ''
      },
      {
        key: ROLES.REVIEWER_GU,
        icon: <AuditOutlined style={{ color: '#db2777' }} />,
        label: <span>顾衡 · 数据审核员 <Tag color="magenta" style={{ fontSize: 10, marginLeft: 4 }}>reviewer_gu</Tag></span>,
        className: userRole === ROLES.REVIEWER_GU ? 'ant-dropdown-menu-item-selected' : ''
      },
      { type: 'divider' },
      { key: 'profile', icon: <IdcardOutlined />, label: '个人中心' },
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => {
      if (ROLE_USER_MAP[key]) {
        handleRoleChange(key);
      } else if (key === 'logout') {
        router.push('/login');
      }
    },
  };

  const getRoleBadge = () => {
    const user = ROLE_USER_MAP[userRole] || ROLE_USER_MAP.ADMIN_ZHOU;
    return <Tag color={user.badgeColor} style={{ margin: 0 }}>{user.title}</Tag>;
  };

  return (
    <Layout className="main-layout">
      <Sider
        collapsible
        collapsed={effectiveCollapsed}
        onCollapse={setCollapsed}
        width={siderWidth}
        collapsedWidth={collapsedWidth}
        trigger={null}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: 'none',
        }}
      >
        <div className="sidebar-logo" style={{ flexShrink: 0 }}>
          <div className="logo-square">
            <img src={logoImg?.src || logoImg} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          {!effectiveCollapsed && (
            <span className="logo-text">
              {userRole === ROLES.COLLECTOR ? '数据系统' : '天奇股份'}
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[
              pathname === '/collection/collect-home' ? '/collection/collect-home' :
              pathname.includes('/collection/collection-tasks') ? '/collection/collection-tasks' : 
              pathname.includes('/collection/qa') ? '/collection/qa' : 
              pathname.includes('/collection/annotation-tasks') ? '/collection/annotation-tasks' : 
              pathname.includes('/annotation/review') ? '/annotation/review' : 
              pathname.includes('/annotation/audit') ? '/annotation/audit' : 
              pathname.includes('/collection/collect') ? '/collection/collect' : 
              pathname.includes('/collection/tasks') ? '/collection/tasks' : 
              pathname
            ]}
            defaultOpenKeys={getOpenKeys()}
            items={getMenuItems()}
            onClick={({ key }) => {
              if (key.startsWith('/')) {
                router.push(key);
              }
            }}
            style={{ borderRight: 0 }}
          />
        </div>

        {/* 左下角：方案 B 动态透明 WebP 机器人挂件 (红框位置) */}
        {/* 左下角：方案 C 透明视频 (WebM / ProRes) 挂件 (红框位置) */}
        {!effectiveCollapsed ? (
          <div
            className="sidebar-robot-widget"
            style={{
              flexShrink: 0,
              padding: '10px 14px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* 模式状态徽章与快捷切换器 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '6px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  fontSize: '11px',
                  color: '#e2e8f0'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 6px #10b981'
                  }}
                />
                <span>{sidebarRobotMode === 'video_webm' ? '方案 C · 透明视频' : '方案 B · 动态WebP'}</span>
              </div>

              {/* 快捷对比切换小胶囊 */}
              <button
                type="button"
                onClick={() => setSidebarRobotMode(m => m === 'video_webm' ? 'animated_webp' : 'video_webm')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#cbd5e1',
                  fontSize: '10px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="点击在方案 C(透明视频) 与方案 B(动态WebP) 之间切换"
              >
                切到{sidebarRobotMode === 'video_webm' ? 'WebP' : '视频'}
              </button>
            </div>

            {/* 角色播放容器 */}
            <div
              style={{
                width: '190px',
                height: '170px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              onClick={() => router.push('/demo/spline-character')}
              title={sidebarRobotMode === 'video_webm' ? '方案 C：16.9秒全长度透明视频（点击查看详情）' : '方案 B：动态透明 WebP（点击查看详情）'}
            >
              {/* 纯净无光模式，完全去除任何背景光晕 */}

              {sidebarRobotMode === 'video_webm' ? (
                /* 方案 C：纯净透明背景视频 (无任何背后杂光/紫光) */
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'none',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <source src="/robot-character/spline_robot_transparent.mp4" type='video/mp4; codecs="hvc1"' />
                  <source src="/robot-character/spline_robot_transparent.webm" type="video/webm" />
                </video>
              ) : (
                /* 方案 B：动态透明 WebP */
                <img
                  src="/robot-character/spline_robot_animated.webp"
                  alt="Embodied Robot Assistant"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'none',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              flexShrink: 0,
              padding: '12px 0',
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => router.push('/demo/spline-character')}
              title="具身智能助理"
            >
              {sidebarRobotMode === 'video_webm' ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '56px', height: '56px', objectFit: 'contain' }}
                >
                  <source src="/robot-character/spline_robot_transparent.mp4" type='video/mp4; codecs="hvc1"' />
                  <source src="/robot-character/spline_robot_transparent.webm" type="video/webm" />
                </video>
              ) : (
                <img
                  src="/robot-character/spline_robot_animated.webp"
                  alt="Assistant"
                  style={{ width: '52px', height: '52px', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        )}
      </Sider>
      <Layout style={{ marginLeft: effectiveCollapsed ? collapsedWidth : siderWidth, transition: 'margin-left 0.2s' }}>
        <Header className="header-bar" style={{ position: 'sticky', top: 0 }}>
          {userRole === ROLES.COLLECTOR ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {React.createElement(effectiveCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                  onClick: () => setCollapsed(!collapsed),
                  style: { fontSize: 18, cursor: 'pointer', color: '#001529' },
                })}
                
                {/* Breadcrumb */}
                <div style={{ fontSize: 14, color: '#595959', fontWeight: 500 }}>
                  {pathname === '/collection/collect-home' ? '首页' : 
                   pathname.includes('/collection/collect') ? '任务中心（采集端）' : 
                   pathname.includes('/collection/devices') ? '设备管理' : '数据采集'}
                </div>

                <Divider orientation="vertical" style={{ height: 20, borderColor: '#d9d9d9', margin: '0 8px' }} />

                {/* Mode Badge */}
                <div style={{
                  padding: '2px 12px',
                  borderRadius: '16px',
                  border: '1px solid #d9d9d9',
                  background: '#fafafa',
                  fontSize: '12px',
                  color: '#1f1f1f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1890ff' }}></span>
                  当前模式：数采模式
                </div>

                <Divider orientation="vertical" style={{ height: 20, borderColor: '#d9d9d9', margin: '0 8px' }} />

                {/* Run Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '12px',
                  color: '#595959'
                }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                  <span>运行信息</span>
                  <Button 
                    size="small" 
                    type="text" 
                    icon={<ReloadOutlined style={{ fontSize: 10 }} />} 
                    onClick={() => message.success('数据已清空并重新同步')}
                    style={{ 
                      fontSize: '11px', 
                      padding: '2px 6px', 
                      height: 'auto',
                      lineHeight: 1.2,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      marginLeft: 4
                    }}
                  >
                    清空数据
                  </Button>
                </div>
              </div>

              {/* Right Menu Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <SunOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} onClick={() => message.info('主题切换暂不可用')} />
                <GlobalOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} onClick={() => message.info('语言切换暂不可用')} />
                <FullscreenOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} onClick={() => message.info('全屏模式暂不可用')} />
                <SettingOutlined style={{ fontSize: 18, cursor: 'pointer', color: '#595959' }} onClick={() => message.info('设置暂不可用')} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#595959', fontSize: 13 }}>
                  <CloudOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                  <span>天奇数据中心</span>
                </div>

                <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                  <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }} className="user-dropdown-hover">
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                      <Text strong style={{ fontSize: 13 }}>{currentUser.name} ({currentUser.username})</Text>
                      {getRoleBadge()}
                    </div>
                  </Space>
                </Dropdown>
              </div>
            </div>
          ) : (
            <>
              <div className="header-left">
                {React.createElement(effectiveCollapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                  onClick: () => setCollapsed(!collapsed),
                  style: { fontSize: 18, cursor: 'pointer', color: '#001529' },
                })}
                <div style={{ marginLeft: 16, fontSize: 15, fontWeight: 500, color: '#595959', letterSpacing: '0.5px', display: isMobile ? 'none' : 'block' }}>
                  欢迎进入具身智能数据采集管理系统
                </div>
              </div>
              <div className="header-right">
                <Space size="middle">
                  <Button
                    type="primary"
                    icon={<DashboardOutlined />}
                    onClick={() => router.push('/screen')}
                    style={{
                      background: 'linear-gradient(135deg, #00f2fe 0%, #1677ff 100%)',
                      border: 'none',
                      color: '#050b17',
                      fontWeight: 700,
                      borderRadius: 16,
                      height: 28,
                      padding: '0 12px',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 2px 8px rgba(0,242,254,0.3)'
                    }}
                  >
                    📊 数采工厂大屏
                  </Button>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    background: specMode ? '#fffbe6' : '#f5f5f5', 
                    padding: '4px 12px', 
                    borderRadius: 20,
                    border: specMode ? '1px solid #ffe58f' : '1px solid #d9d9d9',
                    transition: 'all 0.3s'
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: specMode ? 600 : 400, color: specMode ? '#d46b08' : '#595959', margin: 0 }}>
                      📖 需求标注
                    </Text>
                    <Switch 
                      checked={specMode} 
                      onChange={toggleSpecMode} 
                      size="small"
                      checkedChildren="开" 
                      unCheckedChildren="关"
                    />
                  </div>

                  <Badge count={5} size="small">
                    <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Badge>
                  <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                    <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4, transition: 'all 0.3s' }} className="user-dropdown-hover">
                      <Avatar size="small" style={{ backgroundColor: currentUser.badgeColor === 'gold' ? '#faad14' : currentUser.badgeColor === 'cyan' ? '#13c2c2' : currentUser.badgeColor === 'purple' ? '#722ed1' : currentUser.badgeColor === 'magenta' ? '#eb2f96' : '#1677ff' }} icon={<UserOutlined />} />
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <Text strong style={{ fontSize: 13 }}>{currentUser.name} ({currentUser.username})</Text>
                        {getRoleBadge()}
                      </div>
                    </Space>
                  </Dropdown>
                </Space>
              </div>
            </>
          )}
        </Header>
        <Content>
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </Layout>

      {/* Spec details drawer */}
      <Drawer
        title={activeSpec ? `需求逻辑明细 #${activeSpec.number || ''}` : '需求逻辑明细'}
        placement="right"
        size={420}
        onClose={() => setActiveSpec(null)}
        open={!!activeSpec}
        styles={{ body: { padding: '24px' } }}
      >
        {activeSpec && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f', margin: 0 }}>
              {activeSpec.title}
            </h3>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <div style={{ fontWeight: 600, color: '#595959', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SolutionOutlined style={{ color: '#1677ff' }} /> 交互与业务逻辑:
            </div>
            <List
              dataSource={activeSpec.rules}
              split={false}
              renderItem={(rule, index) => (
                <List.Item style={{ padding: '6px 0', alignItems: 'flex-start', border: 'none' }}>
                  <span style={{ color: '#1677ff', fontWeight: 'bold', marginRight: 8 }}>{index + 1}.</span>
                  <span style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: 13, lineHeight: '1.6' }}>{rule}</span>
                </List.Item>
              )}
            />

            {activeSpec.remark && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ background: '#fafafa', padding: '16px', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 600, color: '#fa8c16', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <InfoCircleOutlined /> 开发备注 / 校验细则
                  </div>
                  <div style={{ color: 'rgba(0,0,0,0.65)', fontSize: 12, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {activeSpec.remark}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      <style jsx global>{`
        .user-dropdown-hover:hover {
          background: rgba(0,0,0,0.04);
        }
        .ant-dropdown-menu-item-selected {
          background-color: #1890ff !important;
          color: #fff !important;
        }
        .spec-badge-trigger:hover {
          transform: scale(1.15);
        }
        .spec-badge-trigger.selected {
          animation: specBadgePulse 2s infinite alternate;
        }
        @keyframes specBadgePulse {
          0% { box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.3), 0 2px 4px rgba(0,0,0,0.2); }
          100% { box-shadow: 0 0 0 8px rgba(82, 196, 26, 0.5), 0 4px 8px rgba(0,0,0,0.3); }
        }
      `}</style>
    </Layout>
  );
}

export default function MainLayout({ children }) {
  return (
    <SpecProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SpecProvider>
  );
}
