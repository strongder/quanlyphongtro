export interface User {
  id: number;
  role: 'MANAGER' | 'TENANT';
  username: string;
  name: string;
  phone?: string;
  expoPushToken?: string;
  createdAt: string;
  tenantInfo?: {
    id: number;
    hoTen: string;
    soDienThoai?: string;
    cccd?: string;
  };
}

export interface Room {
  id: number;
  maPhong: string;
  giaThue: number;
  dienTich?: number;
  taiSan?: Record<string, number>;
  trangThai: 'TRONG' | 'CO_KHACH';
  note?: string;
  createdAt: string;
  currentTenants?: Array<{
    id: number;
    hoTen: string;
    soDienThoai?: string;
    username: string;
    isPrimaryTenant: number;
    ngayVao: string;
  }>;
}

export interface Tenant {
  id: number;
  hoTen: string;
  soDienThoai?: string;
  cccd?: string;
  email?: string;
  diaChi?: string;
  ngaySinh?: string;
  gioiTinh?: 'NAM' | 'NU' | 'KHAC';
  createdAt: string;
}

export interface MeterReading {
  id: number;
  roomId: number;
  ky: string;
  dienSoCu?: number;
  dienSoMoi?: number;
  nuocSoCu?: number;
  nuocSoMoi?: number;
  locked: number;
  createdAt: string;
}

export interface Invoice {
  id: number;
  roomId: number;
  ky: string;
  tienPhong: number;
  dienTieuThu: number;
  nuocTieuThu: number;
  donGiaDien: number;
  donGiaNuoc: number;
  phuPhi: number;
  tongCong: number;
  status: 'PAID' | 'UNPAID' | 'PENDING';
  createdAt: string;
  paidAt?: string;
  requestedAt?: string;
}
export interface PaymentResponse {
  code: string;
  message: string;
  transactionId: string;
  paymentUrl: string;
}

export interface PaymentStatusResponse {
  invoiceId: number;
  invoiceStatus: string;
  payment?: {
    id: number;
    transactionId: string;
    amount: number;
    status: string;
    responseCode: string;
    paidAt: string;
    createdAt: string;
  };
}
export interface AuthResponse {
  token: string;
  user: User;
  error: string;
  status: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  tenantId: number;
  roomId: number;
  amount: number;
  paymentMethod: 'MOMO' | 'VNPAY';
  transactionId?: string;
  status: 'SUCCESS' | 'FAILED';
  responseCode?: string;
  paidAt?: string;
  createdAt: string;
  
  // Populated fields
  tenant?: {
    hoTen: string;
    soDienThoai?: string;
  };
  room?: {
    maPhong: string;
  };
  invoice?: {
    ky: string;
    tongCong: number;
  };
}

export interface PaymentStats {
  totalAmount: number;
  totalCount: number;
  paymentMethod:  'MOMO' | 'VNPAY';
}

export interface PaymentFilters {
  status?: 'SUCCESS' | 'FAILED';
  paymentMethod?: 'MOMO' | 'VNPAY';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
