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
const ROLES = {
  ADMIN: 'ADMIN',
  QA: 'QA',
  COLLECTOR: 'COLLECTOR',
};

const menuItems = [
  {
    key: 'config_labels',
    icon: <TagsOutlined />,
    label: '基础数据',
    roles: [ROLES.ADMIN],
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
    roles: [ROLES.ADMIN],
    children: [
      { key: '/collection/device-types', label: '设备类型' },
      { key: '/collection/devices', label: '设备列表' },
    ],
  },
  {
    key: 'data_collection',
    icon: <DatabaseOutlined />,
    label: '任务管理',
    roles: [ROLES.ADMIN, ROLES.QA, ROLES.COLLECTOR],
    children: [
      { key: '/collection/collection-tasks', icon: <CameraOutlined />, label: '数据采集', roles: [ROLES.ADMIN] },
      { key: '/collection/annotation-tasks', icon: <FormOutlined />, label: '数据标注', roles: [ROLES.ADMIN] },
      { key: '/annotation/audit', icon: <EyeOutlined />, label: '标注工作台', roles: [ROLES.ADMIN, ROLES.QA] },
      { key: '/collection/qa', icon: <FileSearchOutlined />, label: '数据质检', roles: [ROLES.ADMIN, ROLES.QA] },
      { key: '/collection/templates', icon: <LayoutOutlined />, label: '模版中心', roles: [ROLES.ADMIN] },
      { key: '/collection/taskbooks', icon: <ReadOutlined />, label: '任务书', roles: [ROLES.ADMIN] },
    ],
  },
  {
    key: '/collection/collect',
    icon: <VideoCameraOutlined />,
    label: '任务中心（采集端）',
    roles: [ROLES.ADMIN, ROLES.COLLECTOR],
  },
  {
    key: 'data_assets',
    icon: <DatabaseOutlined />,
    label: '数据资产',
    roles: [ROLES.ADMIN, ROLES.QA, ROLES.COLLECTOR],
    children: [
      { key: '/data/catalog', label: '数据资产目录' },
      { key: '/data/datasets', label: '高质量数据集' },
      { key: '/data/reports', label: '数据资产报表' },
    ],
  },
  {
    key: 'permissions',
    icon: <SafetyCertificateOutlined />,
    label: '权限设置',
    roles: [ROLES.ADMIN],
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
  '/collection/annotation-tasks': ['数据标注'],
  '/collection/annotation-tasks/create': ['数据标注', '新建数据标注'],
  '/collection/collection-tasks': ['数据采集'],
  '/collection/collection-tasks/create': ['数据采集', '新建数据采集'],
  '/collection/collect': ['任务中心（采集端）'],
  '/collection/collect-home': ['首页'],
  '/collection/qa': ['数据质检'],
  '/annotation/audit': ['标注工作台'],
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
  const [userRole, setUserRole] = useState(ROLES.ADMIN);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  useEffect(() => {
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (savedRole && ROLES[savedRole]) {
      setUserRole(savedRole);
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

  const handleRoleChange = (role) => {
    if (role === ROLES.COLLECTOR) {
      router.push('/collector-login');
      return;
    }
    
    // Redirect based on role
    message.loading(`正在切换至 ${role === ROLES.QA ? '质检端' : '管理端'}...`, 1);
    setTimeout(() => {
      if (role === ROLES.QA) {
        router.push('/qa-login');
      } else {
        router.push('/login');
      }
    }, 800);
  };

  const crumbs = breadcrumbMap[pathname] || ['数据采集'];

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
    if (userRole === ROLES.COLLECTOR) {
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
    
    // Find parent of current pathname
    let current = pathname;
    const openKeys = [];
    while (parentMap[current]) {
      openKeys.push(parentMap[current]);
      current = parentMap[current];
    }
    return openKeys;
  };

  const userMenu = {
    items: [
      { key: 'role-header', label: <Text type="secondary" style={{ fontSize: 11 }}>角色切换</Text>, disabled: true },
      { key: ROLES.ADMIN, icon: <SafetyCertificateOutlined />, label: '超级管理员', className: userRole === ROLES.ADMIN ? 'ant-dropdown-menu-item-selected' : '' },
      { key: ROLES.QA, icon: <AuditOutlined />, label: '质检员', className: userRole === ROLES.QA ? 'ant-dropdown-menu-item-selected' : '' },
      { key: ROLES.COLLECTOR, icon: <UserOutlined />, label: '采集员', className: userRole === ROLES.COLLECTOR ? 'ant-dropdown-menu-item-selected' : '' },
      { type: 'divider' },
      { key: 'profile', icon: <IdcardOutlined />, label: '个人中心' },
      { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }) => {
      if (ROLES[key]) {
        handleRoleChange(key);
      } else if (key === 'logout') {
        router.push('/');
      }
    },
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case ROLES.ADMIN: return <Tag color="gold" style={{ margin: 0 }}>管理员</Tag>;
      case ROLES.QA: return <Tag color="cyan" style={{ margin: 0 }}>质检员</Tag>;
      case ROLES.COLLECTOR: return <Tag color="blue" style={{ margin: 0 }}>采集员</Tag>;
      default: return null;
    }
  };

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
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
        <div className="sidebar-logo" style={{
          background: '#001529',
          borderBottom: 'none',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}>
          <div className="logo-square" style={{ background: 'transparent' }}>
            <img src={logoImg?.src || logoImg} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          {!effectiveCollapsed && (
            <span className="logo-text" style={{ 
              fontSize: 18, 
              fontWeight: 600,
              color: '#fff',
              marginLeft: 12
            }}>
              {userRole === ROLES.COLLECTOR ? '数据系统' : '天奇股份'}
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            pathname === '/collection/collect-home' ? '/collection/collect-home' :
            pathname.includes('/collection/collection-tasks') ? '/collection/collection-tasks' : 
            pathname.includes('/collection/annotation-tasks') ? '/collection/annotation-tasks' : 
            pathname.includes('/collection/collect') ? '/collection/collect' : 
            pathname.includes('/collection/tasks') ? '/collection/tasks' : 
            pathname.includes('/collection/qa') ? '/collection/qa' : 
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
      </Sider>
      <Layout style={{ marginLeft: effectiveCollapsed ? collapsedWidth : siderWidth, transition: 'margin-left 0.2s' }}>
        <Header className="header-bar" style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 90,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
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
                      <Text strong style={{ fontSize: 13 }}>cy00831</Text>
                      <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px', lineHeight: 1.5 }}>采集员</Tag>
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
                <Space size="large">
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
                      <Avatar size="small" style={{ backgroundColor: userRole === ROLES.ADMIN ? '#faad14' : '#1677ff' }} icon={<UserOutlined />} />
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <Text strong style={{ fontSize: 13 }}>Admin User</Text>
                        {getRoleBadge()}
                      </div>
                    </Space>
                  </Dropdown>
                </Space>
              </div>
            </>
          )}
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <div className="content-wrapper fade-in-up">
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
