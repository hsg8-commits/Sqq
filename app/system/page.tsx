'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, Spin, Result } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

export default function SystemPage() {
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
      <Card title={<><SettingOutlined /> إعدادات النظام</>}>
        <Result
          status="info"
          title="صفحة إعدادات النظام قيد التطوير"
          subTitle="سيتم إضافة المزيد من الميزات قريباً"
        />
      </Card>
    </AdminLayout>
  );
}
