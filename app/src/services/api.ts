import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User, Room, Tenant, MeterReading, Invoice } from '../types';

// Sử dụng IP thay vì localhost để app có thể kết nối từ thiết bị thật
const API_BASE_URL = 'http://192.130.38.110:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, xóa token và redirect về login
      await SecureStore.deleteItemAsync('authToken');
      // Có thể dispatch action để logout ở đây
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async registerManager(data: { username: string; name: string; phone: string; password: string }): Promise<AuthResponse> {
    const response = await api.post('/auth/register-manager', data);
    return response.data;
  },

  async registerTenant(data: { username: string; name: string; phone: string; password: string }): Promise<AuthResponse> {
    const response = await api.post('/auth/register-tenant', data);
    return response.data;
  },

  async login(data: { username: string; password: string }): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
};

export const roomService = {
  async getRooms(status?: string): Promise<Room[]> {
    const params = status ? { status } : {};
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  async createRoom(data: Partial<Room>): Promise<Room> {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  async getRoom(id: number): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  async updateRoom(id: number, data: Partial<Room>): Promise<Room> {
    const response = await api.patch(`/rooms/${id}`, data);
    return response.data;
  },

  async deleteRoom(id: number): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },
};

export const tenantService = {
  async getTenants(query?: string): Promise<Tenant[]> {
    const params = query ? { query } : {};
    const response = await api.get('/tenants', { params });
    return response.data;
  },

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const response = await api.post('/tenants', data);
    return response.data;
  },

  async getTenant(id: number): Promise<Tenant> {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  async updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
    const response = await api.patch(`/tenants/${id}`, data);
    return response.data;
  },

  async deleteTenant(id: number): Promise<void> {
    await api.delete(`/tenants/${id}`);
  },

  async assignTenant(roomId: number, data: { tenantId: number; ngayVao?: string; isPrimaryTenant?: boolean }): Promise<any> {
    const response = await api.post(`/rooms/${roomId}/assign-tenant`, data);
    return response.data;
  },

  async releaseTenant(roomId: number, data: { tenantId: number; ngayRa?: string }): Promise<any> {
    const response = await api.post(`/rooms/${roomId}/release-tenant`, data);
    return response.data;
  },
};

export const meterService = {
  async getMeterReadings(roomId?: number, ky?: string): Promise<MeterReading[]> {
    const params: any = {};
    if (roomId) params.roomId = roomId;
    if (ky) params.ky = ky;
    const response = await api.get('/meter-readings', { params });
    return response.data;
  },

  async createMeterReading(data: { roomId: number; ky: string; dienSoCu: number; dienSoMoi: number; nuocSoCu: number; nuocSoMoi: number }): Promise<MeterReading> {
    const response = await api.post('/meter-readings', data);
    return response.data;
  },

  async updateMeterReading(id: number, data: { dienSoCu?: number; dienSoMoi?: number; nuocSoCu?: number; nuocSoMoi?: number }): Promise<MeterReading> {
    const response = await api.patch(`/meter-readings/${id}`, data);
    return response.data;
  },

  async lockMeterReading(id: number): Promise<MeterReading> {
    const response = await api.post(`/meter-readings/${id}/lock`);
    return response.data;
  },
};

export const invoiceService = {
  async generateInvoices(ky: string): Promise<{ created: Invoice[] }> {
    const response = await api.post('/invoices/generate', { ky });
    return response.data;
  },

  async getInvoices(status?: string, roomId?: number, ky?: string): Promise<Invoice[]> {
    const params: any = {};
    if (status) params.status = status;
    if (roomId) params.roomId = roomId;
    if (ky) params.ky = ky;
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  async payInvoice(id: number): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/pay`);
    return response.data;
  },
};

export const reportService = {
  async getRevenue(from?: string, to?: string): Promise<{ total: number }> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  },

  async getRoomsSummary(): Promise<{ empty: number; occupied: number }> {
    const response = await api.get('/reports/rooms/summary');
    return response.data;
  },
};

export const settingsService = {
  async getSettings(): Promise<Record<string, string>> {
    const response = await api.get('/settings');
    return response.data;
  },

  async updateSettings(data: Record<string, string>): Promise<{ ok: boolean }> {
    const response = await api.patch('/settings', data);
    return response.data;
  },
};

export const notificationService = {
  async sendTestNotification(data: { to?: string; title?: string; body?: string }): Promise<any> {
    const response = await api.post('/notifications/test', data);
    return response.data;
  },
};

export const tenantApprovalService = {
  async getPendingTenants(): Promise<any[]> {
    const response = await api.get('/tenant-approval/pending');
    return response.data;
  },

  async getApprovalStats(): Promise<any> {
    const response = await api.get('/tenant-approval/stats');
    return response.data;
  },

  async approveTenant(userId: number): Promise<any> {
    const response = await api.post(`/tenant-approval/${userId}/approve`);
    return response.data;
  },

  async rejectTenant(userId: number, reason: string): Promise<any> {
    const response = await api.post(`/tenant-approval/${userId}/reject`, { reason });
    return response.data;
  },
};
