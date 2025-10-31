'use client';

import React from 'react';
import { ConfigProvider, App } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import './globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#13c2c2',
    borderRadius: 6,
    fontFamily: 'Cairo, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#fff',
      bodyBg: '#f0f2f5',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: '#1890ff',
      darkItemHoverBg: '#1c4a73',
    },
    Card: {
      headerBg: '#fafafa',
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>لوحة تحكم المشرف - Telegram Clone</title>
        <meta name="description" content="لوحة تحكم إدارية شاملة لمشروع Telegram Clone" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={arEG}
            theme={theme}
            direction="rtl"
          >
            <App>
              <AuthProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#fff',
                      color: '#333',
                      fontSize: '14px',
                      fontFamily: 'Cairo, sans-serif',
                      direction: 'rtl',
                    },
                  }}
                />
              </AuthProvider>
            </App>
          </ConfigProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}