'use client';

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  MessageOutlined,
  TeamOutlined,
  FileImageOutlined,
  FlagOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
  BarChartOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">لوحة التحكم</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link href="/users">إدارة المستخدمين</Link>,
    },
    {
      key: '/messages',
      icon: <MessageOutlined />,
      label: <Link href="/messages">المحادثات والرسائل</Link>,
    },
    {
      key: '/rooms',
      icon: <TeamOutlined />,
      label: <Link href="/rooms">الغرف والمجموعات</Link>,
    },
    {
      key: '/media',
      icon: <FileImageOutlined />,
      label: <Link href="/media">إدارة الملفات</Link>,
    },
    {
      key: '/reports',
      icon: <FlagOutlined />,
      label: (
        <Link href="/reports">
          <Badge count={5} size="small">
            البلاغات
          </Badge>
        </Link>
      ),
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link href="/analytics">التحليلات والإحصائيات</Link>,
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: <Link href="/notifications">الإشعارات</Link>,
    },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: <Link href="/system">إعدادات النظام</Link>,
    },
    {
      key: '/admins',
      icon: <SafetyOutlined />,
      label: <Link href="/admins">إدارة المشرفين</Link>,
    },
    {
      key: '/backups',
      icon: <DatabaseOutlined />,
      label: <Link href="/backups">النسخ الاحتياطية</Link>,
    },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (!admin?.permissions) return false;
    
    const path = item.key.substring(1) || 'dashboard';
    
    // Always show dashboard
    if (path === '' || path === 'dashboard') return true;
    
    // Check permissions for each section
    switch (path) {
      case 'users':
        return admin.permissions.users?.view;
      case 'messages':
        return admin.permissions.messages?.view;
      case 'rooms':
        return admin.permissions.rooms?.view;
      case 'media':
        return admin.permissions.messages?.view; // Media is part of messages
      case 'reports':
        return admin.permissions.reports?.view;
      case 'analytics':
        return admin.permissions.system?.view;
      case 'notifications':
        return admin.permissions.system?.edit;
      case 'system':
        return admin.permissions.system?.view;
      case 'admins':
        return admin.permissions.admins?.view;
      case 'backups':
        return admin.permissions.system?.edit;
      default:
        return false;
    }
  });

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link href="/profile">الملف الشخصي</Link>
      </Menu.Item>
      <Menu.Item key="security" icon={<SafetyOutlined />}>
        <Link href="/security">الأمان والحماية</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item 
        key="logout" 
        icon={<LogoutOutlined />}
        onClick={() => logout()}
        danger
      >
        تسجيل الخروج
      </Menu.Item>
    </Menu>
  );

  const getRoleBadge = (role: string) => {
    const roleMap = {
      superadmin: { text: 'مدير عام', color: '#f50' },
      moderator: { text: 'مشرف', color: '#108ee9' },
      viewer: { text: 'مراقب', color: '#87d068' },
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || { text: role, color: '#ccc' };
    
    return (
      <Badge 
        count={roleInfo.text} 
        style={{ 
          backgroundColor: roleInfo.color,
          fontSize: '10px',
          height: '16px',
          lineHeight: '16px',
          borderRadius: '8px'
        }} 
      />
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-center p-4 border-b border-gray-700">
          {!collapsed ? (
            <div className="text-center">
              <div className="text-white font-bold text-lg mb-1">لوحة التحكم</div>
              <div className="text-gray-300 text-xs">Telegram Clone</div>
            </div>
          ) : (
            <SafetyOutlined className="text-white text-xl" />
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={filteredMenuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ marginRight: collapsed ? 80 : 250, transition: 'margin-right 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1,
          }}
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 40, height: 40 }}
            />
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <Badge count={3} dot>
              <BellOutlined className="text-lg cursor-pointer hover:text-primary" />
            </Badge>
            
            <Dropdown overlay={userMenu} placement="bottomLeft" arrow>
              <div className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
                <Avatar 
                  src={admin?.avatar} 
                  icon={<UserOutlined />} 
                  size="default"
                />
                <div className="text-right">
                  <div className="text-sm font-medium">{admin?.username}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    {getRoleBadge(admin?.role || 'viewer')}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;