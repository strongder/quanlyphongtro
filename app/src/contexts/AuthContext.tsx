import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";
import { User } from "../types";
import { authService } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    name: string,
    phone: string,
    password: string
  ) => Promise<void>;
  registerTenant: (
    username: string,
    name: string,
    phone: string,
    password: string,
    additionalInfo?: {
      email?: string;
      diaChi?: string;
      ngaySinh?: string;
      gioiTinh?: "NAM" | "NU" | "KHAC";
      cccd?: string;
    }
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.log("Auth check failed:", error);
      await SecureStore.deleteItemAsync("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      if (response?.status === 429) {
        Alert.alert("Lỗi", "Bạn đăng nhập quá nhiều lần, vui lòng thử lại sau");
        return;
      }
      await SecureStore.setItemAsync("authToken", response.token);
      await SecureStore.setItemAsync("userRole", response.user.role);
      const biometricSuccess = await authenticateWithBiometrics();
      if (!biometricSuccess) throw new Error("Vân tay thất bại");

      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    username: string,
    name: string,
    phone: string,
    password: string
  ) => {
    try {
      const response = await authService.registerManager({
        username,
        name,
        phone,
        password,
      });
      await SecureStore.setItemAsync("authToken", response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const registerTenant = async (
    username: string,
    name: string,
    phone: string,
    password: string,
    additionalInfo?: {
      email?: string;
      diaChi?: string;
      ngaySinh?: string;
      gioiTinh?: "NAM" | "NU" | "KHAC";
      cccd?: string;
    }
  ) => {
    try {
      await authService.registerTenant({
        username,
        name,
        phone,
        password,
        ...additionalInfo,
      });
      // Không tự động đăng nhập vì cần chờ duyệt
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
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

  const authenticateWithBiometrics = async () => {
    // Kiểm tra thiết bị hỗ trợ vân tay / Face ID
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      Alert.alert(
        "Thông báo",
        "Thiết bị không hỗ trợ hoặc chưa đăng ký vân tay"
      );
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Xác thực vân tay để đăng nhập",
      fallbackLabel: "Dùng mật khẩu",
    });

    return result.success;
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
