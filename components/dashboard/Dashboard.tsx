'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  TeamOutlined,
  DatabaseOutlined,
  FlagOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import axios from '@/lib/axios';
import StatsChart from './StatsChart';
import ActivityTimeline from './ActivityTimeline';
import TopUsers from './TopUsers';
import RecentReports from './RecentReports';

const { Title, Text } = Typography;

interface DashboardStats {
  overview: {
    totalUsers: number;
    onlineUsers: number;
    blockedUsers: number;
    totalMessages: number;
    totalRooms: number;
    totalStorage: number;
    pendingReports: number;
  };
  growth: {
    users: { count: number; percentage: string };
    messages: { count: number; percentage: string };
    reports: { count: number; percentage: string };
    media: { count: number; percentage: string };
  };
  breakdown: {
    rooms: {
      private: number;
      group: number;
      channel: number;
    };
    reports: {
      total: number;
      pending: number;
      resolved: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      users: number;
      messages: number;
      reports: number;
    }>;
    mostActiveUsers: Array<{
      _id: string;
      messageCount: number;
      username: string;
      name: string;
      avatar?: string;
    }>;
  };
}

const Dashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<{ success: boolean; data: DashboardStats }>(
    'dashboard-stats',
    async () => {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000, // Data is fresh for 15 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="خطأ في تحميل البيانات"
        description="لا يمكن تحميل إحصائيات لوحة التحكم حالياً"
        type="error"
        showIcon
      />
    );
  }

  const stats = data?.data;
  if (!stats) return null;

  const getGrowthIcon = (percentage: string) => {
    const num = parseFloat(percentage);
    if (num > 0) return <TrendingUpOutlined style={{ color: '#52c41a' }} />;
    if (num < 0) return <TrendingDownOutlined style={{ color: '#f5222d' }} />;
    return <EyeOutlined style={{ color: '#faad14' }} />;
  };

  const getGrowthColor = (percentage: string) => {
    const num = parseFloat(percentage);
    if (num > 0) return '#52c41a';
    if (num < 0) return '#f5222d';
    return '#faad14';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Title level={2}>لوحة التحكم الرئيسية</Title>
        <Text type="secondary">ملخص شامل لنشاط المنصة والإحصائيات المهمة</Text>
      </div>

      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="إجمالي المستخدمين"
              value={stats.overview.totalUsers}
              prefix={<UserOutlined />}
              suffix={
                <div className="flex items-center text-sm">
                  {getGrowthIcon(stats.growth.users.percentage)}
                  <span 
                    style={{ color: getGrowthColor(stats.growth.users.percentage) }}
                    className="mr-1"
                  >
                    {stats.growth.users.percentage}%
                  </span>
                </div>
              }
            />
            <div className="text-xs text-gray-500 mt-2">
              متصل الآن: {stats.overview.onlineUsers} | محظور: {stats.overview.blockedUsers}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="إجمالي الرسائل"
              value={stats.overview.totalMessages}
              prefix={<MessageOutlined />}
              suffix={
                <div className="flex items-center text-sm">
                  {getGrowthIcon(stats.growth.messages.percentage)}
                  <span 
                    style={{ color: getGrowthColor(stats.growth.messages.percentage) }}
                    className="mr-1"
                  >
                    {stats.growth.messages.percentage}%
                  </span>
                </div>
              }
            />
            <div className="text-xs text-gray-500 mt-2">
              اليوم: {stats.growth.messages.count} رسالة جديدة
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="إجمالي الغرف"
              value={stats.overview.totalRooms}
              prefix={<TeamOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">
              خاص: {stats.breakdown.rooms.private} | مجموعات: {stats.breakdown.rooms.group} | قنوات: {stats.breakdown.rooms.channel}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="المساحة المستخدمة"
              value={stats.overview.totalStorage}
              suffix="MB"
              prefix={<DatabaseOutlined />}
            />
            <div className="text-xs text-gray-500 mt-2">
              البلاغات المعلقة: {stats.overview.pendingReports}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts and Analytics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="نشاط المنصة (آخر 7 أيام)" className="h-96">
            <StatsChart data={stats.trends.daily} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="المستخدمون الأكثر نشاطاً" className="h-96">
            <TopUsers users={stats.trends.mostActiveUsers} />
          </Card>
        </Col>
      </Row>

      {/* Activity and Reports */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="البلاغات الأخيرة" 
            extra={
              <span className="text-sm text-gray-500">
                معلق: {stats.breakdown.reports.pending} / {stats.breakdown.reports.total}
              </span>
            }
            className="h-80"
          >
            <RecentReports />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="نشاط النظام" className="h-80">
            <ActivityTimeline />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;