'use client';

import React from 'react';
import { Timeline, Typography, Avatar } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  DeleteOutlined, 
  FlagOutlined, 
  SettingOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import axios from '@/lib/axios';
import moment from 'moment';

const { Text } = Typography;

interface ActivityLog {
  _id: string;
  action: string;
  adminUsername: string;
  target?: string;
  targetType?: string;
  createdAt: string;
  success: boolean;
}

const ActivityTimeline: React.FC = () => {
  const { data, isLoading } = useQuery<{ success: boolean; data: ActivityLog[] }>(
    'activity-timeline',
    async () => {
      const response = await axios.get('/api/logs/recent?limit=10');
      return response.data;
    },
    {
      refetchInterval: 30000,
    }
  );

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return <UserOutlined />;
    if (action.includes('MESSAGE')) return <MessageOutlined />;
    if (action.includes('DELETE')) return <DeleteOutlined />;
    if (action.includes('REPORT')) return <FlagOutlined />;
    if (action.includes('SYSTEM') || action.includes('SETTINGS')) return <SettingOutlined />;
    if (action.includes('ADMIN') || action.includes('2FA')) return <SafetyOutlined />;
    return <MessageOutlined />;
  };

  const getActionLabel = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'USER_VIEW': 'عرض المستخدمين',
      'USER_EDIT': 'تعديل مستخدم',
      'USER_DELETE': 'حذف مستخدم',
      'USER_BAN': 'حظر مستخدم',
      'USER_UNBAN': 'إلغاء حظر مستخدم',
      'MESSAGE_VIEW': 'عرض الرسائل',
      'MESSAGE_DELETE': 'حذف رسالة',
      'ROOM_VIEW': 'عرض الغرف',
      'ROOM_EDIT': 'تعديل غرفة',
      'ROOM_DELETE': 'حذف غرفة',
      'REPORT_VIEW': 'عرض البلاغات',
      'REPORT_RESOLVE': 'حل بلاغ',
      'SYSTEM_SETTINGS_EDIT': 'تعديل إعدادات النظام',
      'ADMIN_LOGIN': 'تسجيل دخول مشرف',
      'ADMIN_LOGOUT': 'تسجيل خروج مشرف',
      '2FA_ENABLE': 'تفعيل المصادقة الثنائية',
      'NOTIFICATION_SEND': 'إرسال إشعار',
    };
    return actionMap[action] || action;
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success) return 'red';
    if (action.includes('DELETE') || action.includes('BAN')) return 'orange';
    if (action.includes('CREATE') || action.includes('ADD')) return 'green';
    if (action.includes('LOGIN')) return 'blue';
    return 'gray';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
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

  const activities = data?.data || [];

  const timelineItems = activities.map((activity) => ({
    dot: (
      <Avatar 
        size="small"
        icon={getActionIcon(activity.action)}
        style={{ 
          backgroundColor: getActionColor(activity.action, activity.success),
          borderColor: getActionColor(activity.action, activity.success)
        }}
      />
    ),
    children: (
      <div>
        <div className="flex items-center justify-between mb-1">
          <Text className="text-sm font-medium">
            {getActionLabel(activity.action)}
          </Text>
          <Text className="text-xs text-gray-400">
            {moment(activity.createdAt).fromNow()}
          </Text>
        </div>
        <Text className="text-xs text-gray-600 block">
          بواسطة: {activity.adminUsername}
        </Text>
        {activity.target && (
          <Text className="text-xs text-gray-500 block">
            الهدف: {activity.targetType} ({activity.target})
          </Text>
        )}
        {!activity.success && (
          <Text type="danger" className="text-xs block">
            فشلت العملية
          </Text>
        )}
      </div>
    ),
  }));

  return (
    <div className="max-h-60 overflow-y-auto">
      <Timeline items={timelineItems} mode="left" size="small" />
      
      {activities.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <SettingOutlined className="text-2xl mb-2 block" />
          <Text type="secondary">لا توجد أنشطة حديثة</Text>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;