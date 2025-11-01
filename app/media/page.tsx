'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, Spin, Result } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';

export default function MediaPage() {
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
      <Card title={<><FileImageOutlined /> إدارة الملفات</>}>
        <Result
          status="info"
          title="صفحة إدارة الملفات قيد التطوير"
          subTitle="سيتم إضافة المزيد من الميزات قريباً"
        />
      </Card>
    </AdminLayout>
  );
}
