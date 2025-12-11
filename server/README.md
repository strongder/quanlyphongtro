Server (Express + better-sqlite3)

## 📋 Tính năng

### 👨‍💼 Quản lý
- Dashboard tổng quan
- Quản lý phòng trọ (diện tích, tài sản JSON)
- Quản lý khách thuê (thông tin mã hóa)
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
- Thanh toán hóa đơn qua VNPay, MOMO
- Cập nhật thông tin cá nhân

## Cơ sở dữ liệu (chính)

### Sử dụng SQL lite

```
- User: role MANAGER/TENANT, thông tin đăng nhập.
- Tenant: thông tin cá nhân (đã mã hóa một số trường nhạy cảm).
- Room, RoomTenant: phòng và gán khách thuê.
- MeterReading: chỉ số điện nước theo kỳ.
- Invoice: hóa đơn (có tenantId, roomId, kỳ, số tiền, trạng thái).
- Payment: thanh toán (liên kết invoice + tenant, phương thức VNPAY/MOMO, trạng thái).
- Setting: đơn giá điện, nước, cấu hình khác.
```

## Bảo mật
- JWT cho xác thực (`Authorization: Bearer <token>`).
- Mã hóa/băm: bcrypt cho mật khẩu,
- Mã hóa AES-256-CBC cho dữ liệu nhạy cảm (điện thoại, CCCD...).
- Rate limit toàn cục trên `/api` (globalLimiter).
- Role check: MANAGER cho API quản trị; Tenant chỉ xem dữ liệu của mình.
- Prepared statemets : Chống sql injection.
- Sử dụng vân tay.
- HTTPs: Mã hoá dữ liệu khi truyền

## Cấu hình
- Để trong file env


## 📊 Dữ liệu mẫu (npm run setup)

### Quản lý
- 1 tài khoản: `admin` / `admin123`
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

## Thanh toán
- VNPay: `/api/vnpay/create`, `/api/vnpay/status/:invoiceId`, `/api/vnpay/callback`.
- MoMo: `/api/momo/create`, `/api/momo/status/:invoiceId`, `/api/momo/callback` (IPN), `/api/momo/return` (redirect).
- Bảng Payment có cột `paymentMethod` (VNPAY/MOMO) và `tenantId`.



## Thông tin thanh toán 

### VNpay
```
Ngân hàng         NCB
Số thẻ            9704198526191432198
Tên chủ thẻ       NGUYEN VAN A
Ngày phát hành    07/15
Mật khẩu OTP      123456
```

### MOMO
```
No	Tên	          Số thẻ	                  Hạn ghi trên thẻ	 Số điện thọa        OTP	  Trường hợp test
1	  NGUYEN VAN A	9704 0000 0000 0018	      03/07	             0987778888         OTP	  Thành công
2	  NGUYEN VAN A	9704 0000 0000 0026	      03/07	             Sdt bat ky 10 so   OTP	  Thẻ bị khóa
3	  NGUYEN VAN A	9704 0000 0000 0034	      03/07	             Sdt bat ky 10 so   OTP	  Nguồn tiền không đủ
4	  NGUYEN VAN A	9704 0000 0000 0042	      03/07	             Sdt bat ky 10 so   OTP	  Hạn mức thẻ       
```

## Chạy dự án
```bash
# cài phụ thuộc
npm install

# tạo DB + seed mẫu
npm run setup

# chạy dev (nodemon)
npm run dev

# chạy production
npm start
````

```js
Expose port : Sử dụng ngrok hoặc cloudflare tunnerl
    // cloudflared --url localhost:3000

Mặc định: http://localhost:3000
# xem tai lieu api
Swagger UI: http://localhost:3000/api/docs 

Env quan trọng (.env mẫu đã có):
- VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL, VNPAY_RETURN_URL
- MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_ENDPOINT, MOMO_REDIRECT_URL, MOMO_IPN_URL
- JWT_SECRET, ENCRYPTION_KEY
```
