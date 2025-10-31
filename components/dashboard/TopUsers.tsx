'use client';

import React from 'react';
import { List, Avatar, Typography, Progress } from 'antd';
import { UserOutlined, MessageOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface User {
  _id: string;
  messageCount: number;
  username: string;
  name: string;
  avatar?: string;
}

interface TopUsersProps {
  users: User[];
}

const TopUsers: React.FC<TopUsersProps> = ({ users }) => {
  const maxMessages = Math.max(...users.map(u => u.messageCount), 1);

  return (
    <div className="h-full overflow-y-auto">
      <List
        dataSource={users}
        renderItem={(user, index) => (
          <List.Item className="px-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="relative">
                  <Avatar 
                    src={user.avatar} 
                    icon={<UserOutlined />}
                    size={40}
                  />
                  <div 
                    className="absolute -top-1 -left-1 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center"
                    style={{ fontSize: '10px' }}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </div>
              </div>
              
              <div className="text-left min-w-0 flex-1 ml-3">
                <div className="flex items-center justify-between mb-1">
                  <Text className="text-xs text-gray-500">
                    <MessageOutlined className="ml-1" />
                    {user.messageCount.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {((user.messageCount / maxMessages) * 100).toFixed(0)}%
                  </Text>
                </div>
                <Progress
                  percent={(user.messageCount / maxMessages) * 100}
                  size="small"
                  showInfo={false}
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                />
              </div>
            </div>
          </List.Item>
        )}
      />
      
      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <UserOutlined className="text-2xl mb-2" />
          <Text type="secondary">لا توجد بيانات للعرض</Text>
        </div>
      )}
    </div>
  );
};

export default TopUsers;