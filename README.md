# 🏠 Quản Lý Phòng Trọ V2

Hệ thống quản lý phòng trọ với React Native + Node.js + SQLite

## 📋 Tính năng

### 👨‍💼 Quản lý
- Dashboard tổng quan
- Quản lý phòng trọ
- Quản lý khách thuê
- Duyệt đăng ký khách thuê
- Nhập chỉ số điện nước
- Tạo và quản lý hóa đơn
- Báo cáo thống kê
- Thông báo nhắc nhở
- Cài đặt hệ thống

### 👤 Khách thuê
- Đăng ký tài khoản (cần duyệt)
- Xem thông tin phòng
- Xem hóa đơn
- Thanh toán hóa đơn
- Cập nhật thông tin cá nhân

## 🚀 Cài đặt

### Yêu cầu hệ thống
- Node.js 16+
- npm hoặc yarn
- Expo CLI
- Git

### 1. Clone dự án
```bash
git clone <repository-url>
cd QuanLyPhongTroV2
```

### 2. Cài đặt dependencies

#### Server
```bash
cd server
npm install
```

#### App
```bash
cd app
npm install
```

### 3. Tạo database
```bash
cd server
node src/seed.js
```

### 4. Chạy dự án

#### Server (Terminal 1)
```bash
cd server
npm start
```

#### App (Terminal 2)
```bash
cd app
npm start
```

## 📱 Sử dụng

### Đăng nhập quản lý
- **Username:** `admin`
- **Password:** `123456`

### Đăng nhập khách thuê
- **Username:** `tenant1`, `tenant2`, `tenant3`, `tenant4`
- **Password:** `123456`

## 🗄️ Database

Database SQLite được commit vào Git để chia sẻ dữ liệu mẫu:
- `server/data.sqlite` - Database chính
- Chứa dữ liệu mẫu cho tháng 8-9/2025
- 5 phòng, 4 khách thuê, hóa đơn, chỉ số điện nước

## 📁 Cấu trúc dự án

```
QuanLyPhongTroV2/
├── app/                    # React Native app
│   ├── src/
│   │   ├── screens/       # Màn hình
│   │   ├── navigation/    # Navigation
│   │   ├── contexts/      # Context API
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
├── server/                 # Node.js server
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Middleware
│   │   └── db.js          # Database
│   ├── data.sqlite        # Database (committed)
│   └── package.json
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔧 Cấu hình

### API Base URL
Mặc định: `http://192.168.71.163:3000/api`

Để thay đổi, sửa file `app/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP:3000/api';
```

### Database
Database được tạo tự động khi chạy `node src/seed.js`

## 📊 Dữ liệu mẫu

### Phòng trọ
- 5 phòng (P001-P005)
- 3 phòng có khách, 2 phòng trống
- Giá thuê: 2,000,000 - 2,500,000 VNĐ

### Khách thuê
- 4 khách thuê với tài khoản đã kích hoạt
- Thông tin đầy đủ: họ tên, SĐT, CCCD

### Chỉ số điện nước
- Tháng 8/2025: Đã khóa
- Tháng 9/2025: Chưa khóa (có thể chỉnh sửa)

### Hóa đơn
- Tháng 8/2025: Đã thanh toán
- Tháng 9/2025: Chưa thanh toán

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
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register-tenant` - Đăng ký khách thuê
- `GET /api/rooms` - Danh sách phòng
- `GET /api/tenants` - Danh sách khách thuê
- `GET /api/invoices` - Danh sách hóa đơn
- `GET /api/meter-readings` - Chỉ số điện nước

## 🔒 Bảo mật

- Mật khẩu được hash bằng bcrypt
- JWT token cho authentication
- Role-based access control
- Input validation và sanitization

## 📱 Mobile App

### Tính năng
- Responsive design
- Dark/Light theme
- Push notifications
- Offline support
- Real-time updates

### Platforms
- Android (APK)
- iOS (IPA)
- Web (PWA)

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

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết

## 📞 Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ:
- Email: support@example.com
- Phone: +84 123 456 789

---

**Lưu ý:** Database được commit vào Git để chia sẻ dữ liệu mẫu. Trong production, nên sử dụng database riêng biệt.
