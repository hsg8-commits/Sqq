'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, Spin, Result } from 'antd';
import { BellOutlined } from '@ant-design/icons';

export default function NotificationsPage() {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!admin) {
    router.push('/');
    return null;
  }

  return (
    <AdminLayout>
      <Card title={<><BellOutlined /> الإشعارات</>}>
        <Result
          status="info"
          title="صفحة الإشعارات قيد التطوير"
          subTitle="سيتم إضافة المزيد من الميزات قريباً"
        />
      </Card>
    </AdminLayout>
  );
}
