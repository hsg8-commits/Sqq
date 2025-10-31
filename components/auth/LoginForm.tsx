'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Checkbox, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
  twoFactorToken?: string;
  rememberMe?: boolean;
}

const LoginForm: React.FC = () => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await login(values);
      
      if (result.requireTwoFactor) {
        setRequireTwoFactor(true);
        toast('يرجى إدخال رمز المصادقة الثنائية', { icon: '🔐' });
      } else if (result.success) {
        toast.success('مرحباً بك في لوحة التحكم!');
      }
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card 
        className="w-full max-w-md shadow-2xl"
        style={{ borderRadius: '12px' }}
      >
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <SafetyOutlined className="text-2xl text-white" />
            </div>
          </div>
          <Title level={2} className="mb-2">لوحة تحكم المشرف</Title>
          <Text type="secondary">تسجيل الدخول للوحة الإدارة</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            name="username"
            label="اسم المستخدم أو البريد الإلكتروني"
            rules={[
              { required: true, message: 'يرجى إدخال اسم المستخدم' },
              { min: 3, message: 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="admin@example.com"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[
              { required: true, message: 'يرجى إدخال كلمة المرور' },
              { min: 6, message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="كلمة المرور"
              autoComplete="current-password"
            />
          </Form.Item>

          {requireTwoFactor && (
            <Form.Item
              name="twoFactorToken"
              label="رمز المصادقة الثنائية"
              rules={[
                { required: true, message: 'يرجى إدخال رمز المصادقة الثنائية' },
                { len: 6, message: 'رمز المصادقة يجب أن يكون 6 أرقام' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="123456"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '0.5em' }}
              />
            </Form.Item>
          )}

          <Form.Item>
            <div className="flex justify-between items-center">
              <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                <Checkbox>تذكرني لمدة 30 يوماً</Checkbox>
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div className="text-center">
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              © 2024 Telegram Clone Admin Panel
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              محمي بنظام المصادقة الثنائية والتشفير المتقدم
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LoginForm;