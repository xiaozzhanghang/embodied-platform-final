'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Badge, Space, Typography, Tag, App } from 'antd';
import logoImg from '../assets/tq_logo.svg';
import {
  DashboardOutlined,
  TagsOutlined,
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
  MenuUnfoldOutlined
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
    label: '数据采集',
    roles: [ROLES.ADMIN, ROLES.QA, ROLES.COLLECTOR],
    children: [
      { key: '/collection/tasks', icon: <SolutionOutlined />, label: '任务派发', roles: [ROLES.ADMIN] },
      { key: '/collection/collect', icon: <VideoCameraOutlined />, label: '采集工作台', roles: [ROLES.ADMIN, ROLES.COLLECTOR] },
      { key: '/collection/qa', icon: <FileSearchOutlined />, label: '数据质检', roles: [ROLES.ADMIN, ROLES.QA] },
      { key: '/annotation/audit', icon: <EyeOutlined />, label: '标注审核', roles: [ROLES.ADMIN, ROLES.QA] },
      { key: '/collection/templates', icon: <LayoutOutlined />, label: '任务模板', roles: [ROLES.ADMIN] },
      { key: '/collection/taskbooks', icon: <ReadOutlined />, label: '任务书', roles: [ROLES.ADMIN] },
    ],
  },
  {
    key: 'data_app',
    icon: <AppstoreOutlined />,
    label: '数据应用',
    roles: [ROLES.ADMIN],
    children: [
      { key: '/data/raw', label: '原始数据' },
      { key: '/data/datasets', label: '数据集管理' },
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
  '/collection/devices': ['设备管理', '机器人设备'],
  '/collection/device-types': ['设备管理', '设备类型'],
  '/collection/tasks': ['数据采集', '任务派发'],
  '/collection/collect': ['数据采集', '采集工作台'],
  '/collection/qa': ['数据采集', '数据质检'],
  '/annotation/audit': ['数据采集', '标注审核'],
  '/collection/templates': ['数据采集', '任务模板'],
  '/collection/taskbooks': ['数据采集', '任务书'],
  '/data/raw': ['数据应用', '原始数据'],
  '/data/datasets': ['数据应用', '数据集管理'],
  '/data/download': ['下载中心'],
  '/accounts/list': ['权限设置', '用户管理'],
};

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(ROLES.ADMIN);
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  useEffect(() => {
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    if (savedRole && ROLES[savedRole]) {
      setUserRole(savedRole);
    }
  }, []);

  const handleRoleChange = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    message.success(`角色已切换为: ${role === ROLES.ADMIN ? '超级管理员' : role === ROLES.QA ? '质检员' : '采集员'}`);
    router.push('/collection/tasks');
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
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
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
        }}
      >
        <div className="sidebar-logo">
          <div className="logo-square" style={{ background: 'transparent' }}>
            <img src={logoImg?.src || logoImg} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          {!collapsed && <span className="logo-text" style={{ fontSize: 18, fontWeight: 600 }}>天奇股份</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[
            pathname.includes('/collection/collect') ? '/collection/collect' : 
            pathname.includes('/collection/tasks') ? '/collection/tasks' : 
            pathname.includes('/collection/qa') ? '/collection/qa' : 
            pathname
          ]}
          defaultOpenKeys={getOpenKeys()}
          items={filteredItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) {
              router.push(key);
            }
          }}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header className="header-bar" style={{ position: 'sticky', top: 0, zIndex: 90 }}>
          <div className="header-left">
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18, cursor: 'pointer', color: '#001529' },
            })}
            <div style={{ marginLeft: 16, fontSize: 15, fontWeight: 500, color: '#595959', letterSpacing: '0.5px' }}>
              欢迎进入具身智能数据采集管理系统
            </div>
          </div>
          <div className="header-right">
            <Space size="large">
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
        </Header>
        <Content style={{ background: '#f0f2f5' }}>
          <div className="content-wrapper fade-in-up">
            {children}
          </div>
        </Content>
      </Layout>

      <style jsx global>{`
        .user-dropdown-hover:hover {
          background: rgba(0,0,0,0.04);
        }
        .ant-dropdown-menu-item-selected {
          background-color: #1890ff !important;
          color: #fff !important;
        }
      `}</style>
    </Layout>
  );
}
