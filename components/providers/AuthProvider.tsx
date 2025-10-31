'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import axios from '@/lib/axios';

interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: any;
  avatar?: string;
  lastLogin?: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  admin: Admin | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshAdmin: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    'admin-profile',
    async () => {
      const response = await axios.get('/api/auth/profile');
      return response.data;
    },
    {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data.success && data.admin) {
          setAdmin(data.admin);
        }
      },
      onError: () => {
        setAdmin(null);
      }
    }
  );

  const login = async (credentials: any) => {
    try {
      const response = await axios.post('/api/auth/login', credentials);
      
      if (response.data.success) {
        if (response.data.requireTwoFactor) {
          return { requireTwoFactor: true };
        }
        
        setAdmin(response.data.admin);
        queryClient.setQueryData('admin-profile', response.data);
        return { success: true };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setAdmin(null);
      queryClient.clear();
      window.location.href = '/';
    }
  };

  const refreshAdmin = () => {
    queryClient.invalidateQueries('admin-profile');
  };

  useEffect(() => {
    if (data?.success && data.admin) {
      setAdmin(data.admin);
    } else if (error) {
      setAdmin(null);
    }
  }, [data, error]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;