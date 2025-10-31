'use client';

import React from 'react';
import { List, Tag, Avatar, Typography, Button, Empty } from 'antd';
import { UserOutlined, MessageOutlined, TeamOutlined, FileImageOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import axios from '@/lib/axios';
import moment from 'moment';
import Link from 'next/link';

const { Text } = Typography;

interface Report {
  _id: string;
  targetType: 'user' | 'message' | 'room' | 'media';
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  reporterName?: string;
}

const RecentReports: React.FC = () => {
  const { data, isLoading } = useQuery<{ success: boolean; data: Report[] }>(
    'recent-reports',
    async () => {
      const response = await axios.get('/api/reports?limit=5&status=pending');
      return response.data;
    },
    {
      refetchInterval: 30000,
    }
  );

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserOutlined />;
      case 'message': return <MessageOutlined />;
      case 'room': return <TeamOutlined />;
      case 'media': return <FileImageOutlined />;
      default: return <MessageOutlined />;
    }
  };

  const getTargetLabel = (type: string) => {
    switch (type) {
      case 'user': return 'مستخدم';
      case 'message': return 'رسالة';
      case 'room': return 'غرفة';
      case 'media': return 'ملف';
      default: return type;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      spam: 'رسائل مزعجة',
      harassment: 'تحرش',
      inappropriate_content: 'محتوى غير مناسب',
      fake_account: 'حساب وهمي',
      copyright_violation: 'انتهاك حقوق النشر',
      violence: 'عنف',
      hate_speech: 'خطاب كراهية',
      adult_content: 'محتوى للبالغين',
      other: 'أخرى'
    };
    return reasonMap[reason] || reason;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'مرتفع';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const reports = data?.data || [];

  if (reports.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="لا توجد بلاغات معلقة"
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      <List
        dataSource={reports}
        renderItem={(report) => (
          <List.Item className="px-0 py-2 border-b border-gray-100">
            <div className="flex items-start justify-between w-full">
              <div className="flex items-start space-x-3 space-x-reverse flex-1">
                <Avatar 
                  icon={getTargetIcon(report.targetType)}
                  size="small"
                  className="bg-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <Text className="text-sm font-medium">
                      {getTargetLabel(report.targetType)}
                    </Text>
                    <Tag 
                      color={getPriorityColor(report.priority)}
                      size="small"
                    >
                      {getPriorityLabel(report.priority)}
                    </Tag>
                  </div>
                  <Text className="text-xs text-gray-600 block">
                    {getReasonLabel(report.reason)}
                  </Text>
                  <Text className="text-xs text-gray-400 block">
                    {moment(report.createdAt).fromNow()}
                    {report.reporterName && ` • بواسطة ${report.reporterName}`}
                  </Text>
                </div>
              </div>
              
              <Link href={`/reports/${report._id}`}>
                <Button 
                  type="text" 
                  size="small"
                  icon={<EyeOutlined />}
                  className="text-blue-500"
                />
              </Link>
            </div>
          </List.Item>
        )}
      />
      
      <div className="pt-3 border-t">
        <Link href="/reports">
          <Button type="primary" ghost block size="small">
            عرض جميع البلاغات
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RecentReports;