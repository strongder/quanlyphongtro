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
  trangThai: 'TRONG' | 'CO_KHACH';
  note?: string;
  createdAt: string;
}

export interface Tenant {
  id: number;
  hoTen: string;
  soDienThoai?: string;
  cccd?: string;
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
  status: 'PAID' | 'UNPAID';
  createdAt: string;
  paidAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
