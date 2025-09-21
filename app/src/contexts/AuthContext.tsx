import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, name: string, phone: string, password: string) => Promise<void>;
  registerTenant: (username: string, name: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      await SecureStore.setItemAsync('authToken', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, name: string, phone: string, password: string) => {
    try {
      const response = await authService.registerManager({ username, name, phone, password });
      await SecureStore.setItemAsync('authToken', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const registerTenant = async (username: string, name: string, phone: string, password: string) => {
    try {
      const response = await authService.registerTenant({ username, name, phone, password });
      // Không tự động đăng nhập vì cần chờ duyệt
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    registerTenant,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
