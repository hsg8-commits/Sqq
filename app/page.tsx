'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import AdminLayout from '@/components/layout/AdminLayout';
import Dashboard from '@/components/dashboard/Dashboard';
import { Spin } from 'antd';

export default function HomePage() {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!admin) {
    return <LoginForm />;
  }

  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
}