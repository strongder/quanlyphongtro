# Quản Lý Phòng Trọ - Mobile App

Ứng dụng quản lý phòng trọ được xây dựng với React Native (Expo) và TypeScript.

## Tính năng chính

- **Xác thực**: Đăng nhập/đăng ký quản lý
- **Quản lý phòng**: CRUD phòng, lọc theo trạng thái
- **Quản lý khách thuê**: CRUD khách thuê, tìm kiếm
- **Chỉ số điện nước**: Nhập, cập nhật, khóa chỉ số
- **Hóa đơn**: Tạo hàng loạt, quản lý thanh toán
- **Báo cáo**: Thống kê doanh thu, tỷ lệ lấp đầy
- **Cài đặt**: Cấu hình hệ thống, thông tin cá nhân

## Cài đặt và chạy

### Yêu cầu
- Node.js 16+
- Expo CLI
- Android Studio (cho Android) hoặc Xcode (cho iOS)

### Cài đặt
```bash
cd app
npm install
```

### Chạy ứng dụng
```bash
# Development
npm start

# Android
npm run android

# iOS (chỉ trên macOS)
npm run ios

# Web
npm run web
```

## Cấu trúc dự án

```
app/
├── src/
│   ├── components/          # Components tái sử dụng
│   ├── contexts/           # React Context (Auth)
│   ├── navigation/         # Navigation setup
│   ├── screens/           # Các màn hình
│   │   ├── auth/          # Đăng nhập/đăng ký
│   │   ├── main/          # Màn hình chính
│   │   └── detail/        # Màn hình chi tiết
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── App.tsx                # Entry point
└── app.json              # Expo config
```

## API Integration

App kết nối với server backend qua các service:
- `authService`: Xác thực
- `roomService`: Quản lý phòng
- `tenantService`: Quản lý khách thuê
- `meterService`: Chỉ số điện nước
- `invoiceService`: Hóa đơn
- `reportService`: Báo cáo
- `settingsService`: Cài đặt

## State Management

- **React Query**: Cache và sync data
- **Context API**: Auth state
- **Local State**: Component state

## Navigation

- **Stack Navigator**: Auth flow
- **Tab Navigator**: Main app tabs
- **Stack Navigator**: Detail screens

## Thư viện chính

- `@react-navigation/native`: Navigation
- `@tanstack/react-query`: Data fetching
- `axios`: HTTP client
- `expo-secure-store`: Secure storage
- `expo-notifications`: Push notifications
- `@expo/vector-icons`: Icons

## Môi trường phát triển

- **Base URL**: `http://localhost:3000/api`
- **Database**: SQLite (backend)
- **Authentication**: JWT Bearer Token

## Build và Deploy

### Development Build
```bash
expo build:android
expo build:ios
```

### EAS Build (khuyến nghị)
```bash
npm install -g @expo/eas-cli
eas build --platform android
eas build --platform ios
```

## Ghi chú

- App được thiết kế cho môi trường học tập
- Không có bảo mật phức tạp
- Phù hợp cho demo và prototype
- Có thể mở rộng thêm tính năng
