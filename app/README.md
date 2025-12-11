# Quản Lý Phòng Trọ (Expo + TypeScript)

Ứng dụng mobile giúp chủ trọ và khách thuê quản lý phòng, hóa đơn, chỉ số điện nước và thanh toán trực tuyến. Dự án chạy trên Expo (React Native) với TypeScript.

## Công nghệ
- Expo SDK 54 (React Native 0.81, React 19) + TypeScript
- React Navigation (Stack, Bottom Tabs tùy vai trò)
- @tanstack/react-query cho data fetching/cache
- Axios + SecureStore (JWT interceptor)
- React Native WebView cho luồng thanh toán VNPay/MoMo

## Tính năng
- Xác thực: đăng ký/đăng nhập quản lý hoặc khách thuê, lưu token an toàn
- Chủ trọ: quản lý phòng, khách thuê, chỉ số điện nước, tạo/xem hóa đơn, thống kê, thông báo, cài đặt
- Khách thuê: xem phòng của mình, xem và thanh toán hóa đơn, lịch sử thanh toán, thông báo, cài đặt
- Thanh toán online: chọn VNPay hoặc MoMo, mở WebView thanh toán, tự kiểm tra trạng thái và hiển thị kết quả

## Thanh toán trực tuyến
- Component `PaymentModal` hiển thị trong màn hình hóa đơn/thanh toán, cho phép chọn phương thức VNPay hoặc MoMo.
- Sau khi tạo link (`vnpayService`/`momoService`), WebView mở trang cổng thanh toán; callback `payment-callback|vnpay-return|momo-return` được chặn để xử lý.
- Ứng dụng kiểm tra lại trạng thái invoice qua API và báo thành công/thất bại cho người dùng.

## Cấu trúc thư mục
```
app/
├── App.tsx                 # Khởi tạo QueryClient + AuthProvider + AppNavigator
├── app.json                # Cấu hình Expo
├── src/
│   ├── components/         # Component dùng lại (ví dụ: PaymentModal)
│   ├── contexts/           # Context (AuthContext)
│   ├── navigation/         # Điều hướng stack/tab theo vai trò
│   ├── screens/            # Màn hình auth, main (dashboard, rooms, tenants, invoices, payments,...), detail
│   ├── services/           # Gọi API (auth, room, tenant, meter, invoice, payment, report, settings, notification)
│   └── types/              # Kiểu dữ liệu chia sẻ
└── package.json            # Scripts và dependency
```

## Thiết lập môi trường
- Node.js 16+ và npm
- Cài Expo CLI: `npm install -g expo-cli`
- Android Studio (emulator) hoặc Xcode (macOS) nếu build thiết bị

## Cài đặt & chạy
```bash
cd app
npm install

# Khởi động dev server (QR hoặc emulator)
npm start

# Chạy nhanh trên thiết bị
npm run android
npm run ios   # chỉ trên macOS
npm run web
```

## Cấu hình API
- Chỉnh `API_BASE_URL` tại `src/services/api.ts` trỏ tới server backend của bạn. Giá trị hiện tại: `http://192.168.5.41:3000/api`.
- App tự đính kèm JWT từ SecureStore vào mỗi request và xóa token khi 401.

## Điều hướng & vai trò
- Khi chưa đăng nhập: stack gồm `Login`, `Register`, `TenantRegister`.
- Khi đăng nhập:
	- Quản lý: tab Dashboard, Rooms, Tenants, TenantApproval, Meter, Invoices, Payments, Reports, Notifications, Settings.
	- Khách thuê: tab Dashboard, Invoices, PaymentHistory, Notifications, Settings.
- Các màn hình chi tiết: RoomDetail, TenantDetail, InvoiceDetail, MeterDetail, PaymentDetail.

## Scripts npm
- `npm start` — mở Expo dev server
- `npm run android` — build/run Android
- `npm run ios` — build/run iOS (macOS)
- `npm run web` — chạy trên web

## Ghi chú phát triển
- Kiểm tra lại cấu hình return URL trên backend cho VNPay/MoMo để khớp callback `payment-callback|vnpay-return|momo-return`.
- Nếu dùng thiết bị thật, đảm bảo `API_BASE_URL` trỏ tới IP mạng nội bộ truy cập được từ điện thoại.
