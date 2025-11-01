'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Table, Card, Button, Input, Tag, Space, Modal, Form, message, Spin } from 'antd';
import { UserOutlined, SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from '@/lib/axios';

export default function UsersPage() {
  const { admin, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/');
    } else if (admin) {
      fetchUsers();
    }
  }, [admin, isLoading, pagination.current, searchText]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.totalItems
        }));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'الاسم',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <UserOutlined />
          {record.fullName || text}
        </Space>
      ),
    },
    {
      title: 'اسم المستخدم',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'رقم الهاتف',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'green' : 'default'}>
          {status === 'online' ? 'متصل' : 'غير متصل'}
        </Tag>
      ),
    },
    {
      title: 'الرسائل',
      dataIndex: 'messageCount',
      key: 'messageCount',
    },
    {
      title: 'الحالة',
      dataIndex: 'isBlocked',
      key: 'isBlocked',
      render: (isBlocked: boolean) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? 'محظور' : 'نشط'}
        </Tag>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminLayout>
      <Card title={<><UserOutlined /> إدارة المستخدمين</>}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input
            placeholder="البحث عن مستخدم..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
          />
          
          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
              },
            }}
          />
        </Space>
      </Card>
    </AdminLayout>
  );
}
