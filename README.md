# 🏠 Quản Lý Phòng Trọ - Backend Server

Hệ thống quản lý phòng trọ với Node.js + Express + SQLite + AES Encryption

## 📋 Tính năng

### 👨‍💼 Quản lý
- Dashboard tổng quan
- Quản lý phòng trọ (diện tích, tài sản JSON)
- Quản lý khách thuê (thông tin mã hóa)
- Duyệt đăng ký khách thuê
- Nhập chỉ số điện nước
- Tạo và quản lý hóa đơn
- Thanh toán VNPay (sandbox)
- Báo cáo thống kê
- Thông báo nhắc nhở
- Cài đặt hệ thống

### 👤 Khách thuê
- Đăng ký tài khoản (cần duyệt)
- Xem thông tin phòng
- Xem hóa đơn
- Thanh toán hóa đơn qua VNPay
- Cập nhật thông tin cá nhân

### 🔐 Bảo mật
- Mã hóa AES-256-CBC cho dữ liệu nhạy cảm
- Mã hóa User: username, phone, name
- Mã hóa Tenant: soDienThoai, cccd, email, diaChi, ngaySinh
- Password hashing với bcrypt
- JWT authentication
- Role-based access control

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js 22+ (hoặc 16+)
- npm hoặc yarn
- Git

### 1. Clone dự án
```bash
git clone <repository-url>
cd QuanLyPhongTro/server
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` với nội dung:
```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=b5c9e1fe28218006b93fa4ea398430562c851841aba92cb9bc681799dd365865

# VNPay Configuration (Sandbox)
VNPAY_TMN_CODE=J0U1HNEO
VNPAY_HASH_SECRET=PNOAXOXAMBCZWJQDGNBBJQCZGJVAJKLM
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://YOUR_SERVER_IP:3000/api/payment/vnpay/callback
```

### 4. Tạo database và seed data
```bash
npm run setup
```

Database sẽ được tạo tại `server/data.sqlite` với:
- 1 tài khoản quản lý
- 12 tài khoản khách thuê
- 10 phòng với thông tin diện tích và tài sản
- Tất cả dữ liệu nhạy cảm được mã hóa

### 5. Chạy server
```bash
npm start
# hoặc development mode
npm run dev
```

Server chạy tại: `http://localhost:3000`

## 📱 Sử dụng

### Đăng nhập quản lý
- **Username:** `manager`
- **Password:** `manager123`

### Đăng nhập khách thuê
- **Username:** `tenant1` đến `tenant12`
- **Password:** `tenant123`

**Lưu ý:** Username và thông tin cá nhân được mã hóa trong database, nhưng đăng nhập vẫn dùng plaintext.

## 🗄️ Database

Database SQLite với dữ liệu mã hóa:
- `server/data.sqlite` - Database chính
- Tạo bằng lệnh `npm run setup`
- 10 phòng, 12 khách thuê với dữ liệu mã hóa
- Chứa hóa đơn, chỉ số điện nước, thanh toán

### Schema chính

**User Table:**
- `username` (mã hóa AES-256-CBC)
- `name` (mã hóa AES-256-CBC)
- `phone` (mã hóa AES-256-CBC)
- `passwordHash` (bcrypt)
- `role` (MANAGER/TENANT)
- `status` (ACTIVE/PENDING/REJECTED)

**Tenant Table:**
- `soDienThoai` (mã hóa)
- `cccd` (mã hóa)
- `email` (mã hóa)
- `diaChi` (mã hóa)
- `ngaySinh` (mã hóa)
- `gioiTinh`
- `hoTen`

**Room Table:**
- `maPhong`
- `giaThue`
- `dienTich` (REAL)
- `taiSan` (JSON: {"Quạt trần": 1, "Bình nóng lạnh": 1})
- `trangThai` (EMPTY/OCCUPIED)
- `note`

## 📁 Cấu trúc dự án

```
server/
├── src/
│   ├── routes/
│   │   ├── auth.js              # Đăng ký, đăng nhập (mã hóa)
│   │   ├── users.js             # Quản lý user (encrypt/decrypt)
│   │   ├── tenants.js           # Quản lý tenant (encrypt/decrypt)
│   │   ├── rooms.js             # Quản lý phòng (JSON taiSan)
│   │   ├── invoices.js          # Hóa đơn
│   │   ├── payment.js           # VNPay integration
│   │   ├── meterReadings.js     # Chỉ số điện nước
│   │   ├── notifications.js     # Thông báo
│   │   ├── reports.js           # Báo cáo
│   │   ├── settings.js          # Cài đặt
│   │   ├── tenant-approval.js   # Duyệt khách thuê
│   │   └── roomTenant.js        # Gán phòng
│   ├── middlewares/
│   │   └── auth.js              # JWT middleware
│   ├── config/
│   │   └── vnpay.config.js      # VNPay config
│   ├── utils/
│   │   └── encryption.js        # AES-256-CBC utilities
│   ├── app.js                   # Express app
│   ├── db.js                    # Database schema
│   ├── setup.js                 # Database init + seed
│   ├── migration.js             # Legacy migration
│   ├── seed.js                  # Legacy seed
│   └── openapi.js               # API docs
├── data.sqlite                  # SQLite database
├── .env                         # Environment config
├── package.json
├── index.js                     # Entry point
└── README.md
```

## 🔧 Cấu hình

### Environment Variables (.env)

```env
# Server
PORT=3000
JWT_SECRET=your-jwt-secret-key

# Encryption (AES-256-CBC)
ENCRYPTION_KEY=b5c9e1fe28218006b93fa4ea398430562c851841aba92cb9bc681799dd365865

# VNPay Sandbox
VNPAY_TMN_CODE=J0U1HNEO
VNPAY_HASH_SECRET=PNOAXOXAMBCZWJQDGNBBJQCZGJVAJKLM
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payment/vnpay/callback
```

### Database
Database được tạo bằng lệnh:
```bash
npm run setup
```

### API Base URL
- Development: `http://localhost:3000/api`
- Production: `http://YOUR_SERVER_IP:3000/api`

## 📊 Dữ liệu mẫu (npm run setup)

### Quản lý
- 1 tài khoản: `manager` / `manager123`
- Username và thông tin được mã hóa trong DB

### Phòng trọ
- 10 phòng (P101-P110)
- Giá thuê: 2,000,000 - 3,000,000 VNĐ
- Diện tích: 20-28 m²
- Tài sản JSON: {"Quạt trần": 1, "Bình nóng lạnh": 1, "Tủ lạnh": 1, "Máy giặt": 1}

### Khách thuê
- 12 tài khoản: `tenant1-12` / `tenant123`
- Thông tin đầy đủ được mã hóa:
  - Họ tên: Khách thuê 1-12
  - SĐT: 0900200001-0900200012 (mã hóa)
  - CCCD: 001200000001-001200000012 (mã hóa)
  - Email: tenant1-12@example.com (mã hóa)
  - Địa chỉ: Quận 1-12, TP.HCM (mã hóa)
  - Ngày sinh: Random 1990-2000 (mã hóa)
  - Giới tính: Nam/Nữ

### Hóa đơn
- Chưa có (tạo sau khi nhập chỉ số điện nước)

## 🛠️ Development

### Chạy development
```bash
# Server
cd server && npm run dev

# App
cd app && npm start
```

### Build production
```bash
# App
cd app
expo build:android
expo build:ios
```

## 📝 API Documentation

API được document tại: `http://localhost:3000/api/docs`

### Endpoints chính

#### Authentication (Public)
- `POST /api/auth/login` - Đăng nhập (mã hóa username trước khi lookup)
- `POST /api/auth/register-tenant` - Đăng ký khách thuê (mã hóa dữ liệu)
- `POST /api/auth/register-manager` - Đăng ký quản lý (mã hóa dữ liệu)

#### Users (Authenticated)
- `GET /api/users/me` - Thông tin user (giải mã username, phone, name)
- `PATCH /api/users/me` - Cập nhật user (mã hóa trước khi lưu)

#### Tenants (Manager only)
- `GET /api/tenants` - Danh sách khách thuê (giải mã tất cả)
- `POST /api/tenants` - Tạo khách thuê (mã hóa dữ liệu)
- `GET /api/tenants/:id` - Chi tiết khách thuê (giải mã)
- `PATCH /api/tenants/:id` - Cập nhật khách thuê (mã hóa)

#### Rooms
- `GET /api/rooms` - Danh sách phòng
- `POST /api/rooms` - Tạo phòng (taiSan JSON)
- `GET /api/rooms/:id` - Chi tiết phòng (parse JSON taiSan)
- `PATCH /api/rooms/:id` - Cập nhật phòng

#### Payment (Public callbacks)
- `POST /api/payment/vnpay/create` - Tạo link thanh toán VNPay
- `GET /api/payment/vnpay/callback` - Callback từ VNPay (signature verification)

#### Others
- `GET /api/invoices` - Hóa đơn
- `GET /api/meter-readings` - Chỉ số điện nước
- `GET /api/notifications` - Thông báo
- `GET /api/reports` - Báo cáo
- `GET /api/tenant-approval/pending` - Duyệt khách thuê

## 🔒 Bảo mật

### Mã hóa dữ liệu (AES-256-CBC)
- **User**: `username`, `phone`, `name`
- **Tenant**: `soDienThoai`, `cccd`, `email`, `diaChi`, `ngaySinh`
- Sử dụng IV ngẫu nhiên cho mỗi lần mã hóa
- Format: `iv:encryptedData`
- Key length: 32 bytes (64 ký tự hex)

### Authentication & Authorization
- Password hashing: bcrypt (salt rounds: 10)
- JWT token với expiry
- Role-based access control (MANAGER/TENANT)
- Status-based approval (ACTIVE/PENDING/REJECTED)

### Payment Security
- VNPay HMAC-SHA512 signature validation
- Public callback endpoints (no auth required)
- Deep link redirect: `quanlyphongtro://vnpay-return`

### Input Validation
- Express validator middleware
- SQL injection prevention (prepared statements)
- XSS protection

## 🔗 VNPay Integration

### Cấu hình Sandbox
```env
VNPAY_TMN_CODE=J0U1HNEO
VNPAY_HASH_SECRET=PNOAXOXAMBCZWJQDGNBBJQCZGJVAJKLM
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### Flow thanh toán
1. Client gọi `POST /api/payment/vnpay/create` với `invoiceId`
2. Server tạo payment URL với signature HMAC-SHA512
3. Client mở VNPay payment page
4. VNPay callback về `GET /api/payment/vnpay/callback`
5. Server verify signature, cập nhật Invoice/Payment
6. Trả HTML với deep link button → React Native app
7. Deep link format: `quanlyphongtro://vnpay-return?invoiceId=X&responseCode=00`

### Test Cards (Sandbox)
- Ngân hàng: NCB
- Card: 9704198526191432198
- Tên: NGUYEN VAN A
- Ngày phát hành: 07/15
- OTP: 123456

## 🚀 Deployment

### Server
```bash
# Production
cd server
npm install --production
pm2 start index.js
```

### App
```bash
# Build
cd app
expo build:android
expo build:ios
```

## 🛠️ Troubleshooting

### better-sqlite3 build errors
```bash
npm rebuild better-sqlite3
```

### Port already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database locked
Đóng tất cả connections tới `data.sqlite` rồi chạy lại server

### Encryption errors
- Đảm bảo `ENCRYPTION_KEY` có đúng 64 ký tự hex (32 bytes)
- Không thay đổi key sau khi đã mã hóa dữ liệu
- Chạy lại `npm run setup` nếu key bị thay đổi

## 📚 Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js 5.1.0
- **Database:** SQLite3 (better-sqlite3)
- **Authentication:** JWT (jsonwebtoken), bcryptjs
- **Encryption:** crypto (AES-256-CBC)
- **Payment:** VNPay Sandbox
- **API Docs:** OpenAPI/Swagger

## 📄 License

MIT License

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub

---

**⚠️ Lưu ý bảo mật:**
- Không commit file `.env` vào Git
- Đổi `ENCRYPTION_KEY` và `JWT_SECRET` trong production
- Database chứa dữ liệu mã hóa, không thể đọc trực tiếp
- Không share VNPay credentials trong môi trường production
