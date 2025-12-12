import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthResponse, User, Room, Tenant, MeterReading, Invoice, PaymentResponse, PaymentStatusResponse, Payment, PaymentStats, PaymentFilters } from '../types';
import * as WebBrowser from 'expo-web-browser';


// Sử dụng IP thay vì localhost để app có thể kết nối từ thiết bị thật.com
const API_URL = 'https://laboratories-lights-suited-rolling.trycloudflare.com';
const API_BASE_URL = `${API_URL}/api`;

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

  async updateProfileForAdmin(userId: number, data: Partial<User>): Promise<User> {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  async getAllUsers(): Promise<User[]> {
    const response = await api.get('/users');
    return response.data;
  },

  async deleteUser(userId: number): Promise<{ success: boolean; message: string; userId: number }> {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

export const roomService = {
  async getRooms(status?: string): Promise<Room[]> {
    const params = status ? { status } : {};
    const response = await api.get('/rooms', { params });
    console.log('Fetched rooms:', response.data);
    return response.data;
  },

  async getMyRooms(): Promise<Room> {
    const response = await api.get('/rooms/me/tenant');
    console.log('Fetched my room for tenant:', response.data);
    return response.data;
  },

  async createRoom(data: Partial<Room>): Promise<Room> {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  async getRoom(id: number): Promise<Room> {
    const response = await api.get(`/rooms/${id}`);
    console.log('Fetched room:', response.data);
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
  async fetchLatestMeterReading(roomId: number): Promise<MeterReading> {
    const response = await api.get(`/meter-readings/latest/${roomId}`);
    return response.data;
  }
};

export const invoiceService = {
  async generateInvoices(ky: string): Promise<{ created: Invoice[] }> {
    const response = await api.post('/invoices/generate', { ky });
    return response.data;
  },

  async getInvoices(status?: string, ky?: string): Promise<Invoice[]> {
    const params: any = {};
    if (status) params.status = status;
    if (ky) params.ky = ky;
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  // get me for tenant
  async getMyInvoices(status?: string, ky?: string): Promise<Invoice[]> {
    const params: any = {};
    if (status) params.status = status;
    if (ky) params.ky = ky;
    const response = await api.get('/invoices/me', { params });
    return response.data;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  async requestPayment(id: number): Promise<Invoice> {
    const response = await api.post(`/invoices/${id}/request-payment`);
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

  async approveTenant(userId: number, roomId: number): Promise<any> {
    const response = await api.post(`/tenant-approval/${userId}/approve`, { roomId });
    return response.data;
  },

  async rejectTenant(userId: number, reason: string): Promise<any> {
    const response = await api.post(`/tenant-approval/${userId}/reject`, { reason });
    return response.data;
  },
};

export const vnpayService = {
  async createPaymentUrl(invoiceId: number, bankCode?: string): Promise<PaymentResponse> {
    const response = await api.post('/vnpay/create', {
      invoiceId,
      bankCode,
      // Backend sẽ tự thêm returnUrl từ config
    });
    return response.data;
  },

  async checkPaymentStatus(invoiceId: number): Promise<PaymentStatusResponse> {
    const response = await api.get(`/vnpay/status/${invoiceId}`);
    return response.data;
  },

};

  export const momoService = {
    async createPaymentUrl(invoiceId: number): Promise<PaymentResponse> {
      const response = await api.post('/momo/create', {
        invoiceId,
      });
      return response.data;
    },

    async checkPaymentStatus(invoiceId: number): Promise<PaymentStatusResponse> {
      const response = await api.get(`/momo/status/${invoiceId}`);
      return response.data;
    },
  };

export const paymentService = {
  /**
   * Admin: Get all payments with filters and pagination
   */
  async getAllPayments(filters?: PaymentFilters): Promise<{ payments: Payment[]; total: number; pages: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await api.get(`/payments?${params.toString()}`);
    // Backend returns { data: [], pagination: { total, pages, limit, offset } }
    return {
      payments: response.data?.data || [],
      total: response.data?.pagination?.total || 0,
      pages: response.data?.pagination?.pages || 0,
    };
  },

  /**
   * Admin: Get payment statistics by method
   */
  async getPaymentStats(): Promise<any[]> {
    const response = await api.get('/payments/stats');
    // Backend returns array of stats with paymentMethod, totalPayments, successCount, etc
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.stats && Array.isArray(response.data.stats)) {
      return response.data.stats;
    }
    return [];
  },

  /**
   * Get payments for a specific invoice
   */
  async getInvoicePayments(invoiceId: number): Promise<Payment[]> {
    const response = await api.get(`/payments/invoice/${invoiceId}`);
    return response.data;
  },

  /**
   * Tenant: Get own payment history
   */
  async getTenantPayments(): Promise<Payment[]> {
    const response = await api.get('/payments/tenant/me');
    // Backend returns { tenant: {...}, payments: [...] }
    if (response.data?.payments && Array.isArray(response.data.payments)) {
      return response.data.payments;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  /**
   * Admin: Get payments for a specific tenant
   */
  async getTenantPaymentsById(tenantId: number): Promise<Payment[]> {
    const response = await api.get(`/payments/tenant/${tenantId}`);
    return response.data;
  },

  /**
   * Get transaction details
   */
  async getTransactionDetails(transactionId: string): Promise<Payment> {
    const response = await api.get(`/payments/transaction/${transactionId}`);
    return response.data;
  },
};

