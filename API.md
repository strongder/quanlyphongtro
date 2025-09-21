# Tài liệu API - Quản Lý Phòng Trọ

## Tổng quan
- **Base URL**: `http://localhost:3000/api`
- **Xác thực**: JWT Bearer Token (trừ `/health`, `/docs`, `/auth/*`)
- **Content-Type**: `application/json`

## Xác thực

### 1. Đăng ký quản lý
```http
POST /auth/register-manager
```

**Body:**
```json
{
  "name": "Admin",
  "phone": "0901234567",
  "password": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "role": "MANAGER",
    "name": "Admin",
    "phone": "0901234567",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Đăng nhập
```http
POST /auth/login
```

**Body:**
```json
{
  "phone": "0901234567",
  "password": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "role": "MANAGER",
    "name": "Admin",
    "phone": "0901234567",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Người dùng

### 3. Lấy thông tin cá nhân
```http
GET /users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "role": "MANAGER",
  "name": "Admin",
  "phone": "0901234567",
  "expoPushToken": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. Cập nhật thông tin cá nhân
```http
PATCH /users/me
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Admin Updated",
  "phone": "0907654321",
  "expoPushToken": "ExponentPushToken[xxx]"
}
```

## Phòng

### 5. Danh sách phòng
```http
GET /rooms?status=TRONG
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `TRONG` | `CO_KHACH`

**Response:**
```json
[
  {
    "id": 1,
    "maPhong": "P001",
    "giaThue": 2000000,
    "trangThai": "TRONG",
    "note": "Phòng đẹp",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 6. Tạo phòng
```http
POST /rooms
Authorization: Bearer <token>
```

**Body:**
```json
{
  "maPhong": "P002",
  "giaThue": 2500000,
  "trangThai": "TRONG",
  "note": "Phòng có ban công"
}
```

### 7. Chi tiết phòng
```http
GET /rooms/1
Authorization: Bearer <token>
```

### 8. Cập nhật phòng
```http
PATCH /rooms/1
Authorization: Bearer <token>
```

**Body:**
```json
{
  "giaThue": 2200000,
  "note": "Cập nhật ghi chú"
}
```

### 9. Xóa phòng
```http
DELETE /rooms/1
Authorization: Bearer <token>
```

## Khách thuê

### 10. Danh sách khách thuê
```http
GET /tenants?query=Nguyễn
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (optional): Tìm kiếm theo tên hoặc số điện thoại

**Response:**
```json
[
  {
    "id": 1,
    "hoTen": "Nguyễn Văn A",
    "soDienThoai": "0901234567",
    "cccd": "123456789",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 11. Tạo khách thuê
```http
POST /tenants
Authorization: Bearer <token>
```

**Body:**
```json
{
  "hoTen": "Nguyễn Văn A",
  "soDienThoai": "0901234567",
  "cccd": "123456789"
}
```

### 12. Chi tiết khách thuê
```http
GET /tenants/1
Authorization: Bearer <token>
```

### 13. Cập nhật khách thuê
```http
PATCH /tenants/1
Authorization: Bearer <token>
```

**Body:**
```json
{
  "hoTen": "Nguyễn Văn A Updated",
  "soDienThoai": "0907654321"
}
```

### 14. Xóa khách thuê
```http
DELETE /tenants/1
Authorization: Bearer <token>
```

## Gán phòng - Khách thuê

### 15. Gán khách vào phòng
```http
POST /rooms/1/assign-tenant
Authorization: Bearer <token>
```

**Body:**
```json
{
  "tenantId": 1,
  "ngayVao": "2024-01-01",
  "isPrimaryTenant": true
}
```

### 16. Trả phòng (ghi ngày ra)
```http
POST /rooms/1/release-tenant
Authorization: Bearer <token>
```

**Body:**
```json
{
  "tenantId": 1,
  "ngayRa": "2024-01-31"
}
```

## Chỉ số điện nước

### 17. Danh sách chỉ số
```http
GET /meter-readings?roomId=1&ky=2024-01
Authorization: Bearer <token>
```

**Query Parameters:**
- `roomId` (optional): ID phòng
- `ky` (optional): Kỳ (YYYY-MM)

**Response:**
```json
[
  {
    "id": 1,
    "roomId": 1,
    "ky": "2024-01",
    "dienSoCu": 100,
    "dienSoMoi": 150,
    "nuocSoCu": 50,
    "nuocSoMoi": 75,
    "locked": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 18. Nhập chỉ số kỳ
```http
POST /meter-readings
Authorization: Bearer <token>
```

**Body:**
```json
{
  "roomId": 1,
  "ky": "2024-01",
  "dienSoMoi": 150,
  "nuocSoMoi": 75
}
```

### 19. Cập nhật chỉ số (nếu chưa khóa)
```http
PATCH /meter-readings/1
Authorization: Bearer <token>
```

**Body:**
```json
{
  "dienSoMoi": 155,
  "nuocSoMoi": 80
}
```

### 20. Khóa chỉ số
```http
POST /meter-readings/1/lock
Authorization: Bearer <token>
```

## Hóa đơn

### 21. Tạo hóa đơn hàng loạt
```http
POST /invoices/generate
Authorization: Bearer <token>
```

**Body:**
```json
{
  "ky": "2024-01"
}
```

**Response:**
```json
{
  "created": [
    {
      "id": 1,
      "roomId": 1,
      "ky": "2024-01",
      "tienPhong": 2000000,
      "dienTieuThu": 50,
      "nuocTieuThu": 25,
      "donGiaDien": 3500,
      "donGiaNuoc": 15000,
      "phuPhi": 0,
      "tongCong": 2175000,
      "status": "UNPAID",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "paidAt": null
    }
  ]
}
```

### 22. Danh sách hóa đơn
```http
GET /invoices?status=UNPAID&roomId=1&ky=2024-01
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): `PAID` | `UNPAID`
- `roomId` (optional): ID phòng
- `ky` (optional): Kỳ (YYYY-MM)

### 23. Chi tiết hóa đơn
```http
GET /invoices/1
Authorization: Bearer <token>
```

### 24. Đánh dấu đã thanh toán
```http
PATCH /invoices/1/pay
Authorization: Bearer <token>
```

## Báo cáo

### 25. Tổng thu nhập
```http
GET /reports/revenue?from=2024-01-01&to=2024-01-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `from` (optional): Ngày bắt đầu
- `to` (optional): Ngày kết thúc

**Response:**
```json
{
  "total": 5000000
}
```

### 26. Tóm tắt phòng
```http
GET /reports/rooms/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "empty": 5,
  "occupied": 10
}
```

## Cài đặt

### 27. Lấy cấu hình
```http
GET /settings
Authorization: Bearer <token>
```

**Response:**
```json
{
  "donGiaDien": "3500",
  "donGiaNuoc": "15000",
  "ngayNhapSo": "30",
  "ngayNhapTien": "5"
}
```

### 28. Cập nhật cấu hình
```http
PATCH /settings
Authorization: Bearer <token>
```

**Body:**
```json
{
  "donGiaDien": "4000",
  "donGiaNuoc": "18000",
  "ngayNhapSo": "25"
}
```

## Thông báo

### 29. Gửi thông báo test
```http
POST /notifications/test
Authorization: Bearer <token>
```

**Body:**
```json
{
  "to": "ExponentPushToken[xxx]",
  "title": "Test Notification",
  "body": "Đây là thông báo test"
}
```

**Response:**
```json
{
  "sent": true,
  "to": "ExponentPushToken[xxx]",
  "title": "Test Notification",
  "body": "Đây là thông báo test"
}
```

## Health Check

### 30. Kiểm tra trạng thái
```http
GET /health
```

**Response:**
```json
{
  "ok": true
}
```

## Mã lỗi thường gặp

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ
- **401 Unauthorized**: Token không hợp lệ hoặc thiếu
- **404 Not Found**: Không tìm thấy tài nguyên
- **500 Internal Server Error**: Lỗi server

## Ghi chú

1. **JWT Token**: Có thời hạn 30 ngày
2. **Database**: SQLite, tự động tạo bảng khi khởi động
3. **Validation**: Cơ bản, chưa có validation phức tạp
4. **CORS**: Chưa cấu hình, phù hợp cho development
5. **Rate Limiting**: Chưa áp dụng

## Swagger UI

Truy cập: `http://localhost:3000/api/docs` để xem và test API trực tiếp.
