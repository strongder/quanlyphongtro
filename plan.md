## Kế hoạch xây dựng ứng dụng Quản Lý Phòng Trọ (React Native + Expo, Node.js, SQLite)

### 1. Mục tiêu & phạm vi
- **Mục tiêu**: Xây dựng app quản lý phòng trọ mức độ môn học, gồm quản lý phòng, khách thuê, chỉ số điện nước, hóa đơn, thông báo/nhắc nhở, tìm kiếm/báo cáo đơn giản, với 2 vai trò: **Quản lý** và **Khách thuê**.
- **Nền tảng**: Mobile app bằng React Native (Expo). Backend Node.js (Express) kết nối SQLite. Thông báo đẩy dùng Expo Notifications.
- **Phạm vi**: MVP hoàn chỉnh các chức năng đã liệt kê, bảo mật cơ bản (JWT), triển khai thử nghiệm.

### 2. Kiến trúc tổng thể
- **Client (Mobile)**: React Native + Expo, TypeScript, React Navigation, React Query cho data fetching/cache, Context API cho state nhẹ, Expo Notifications.
- **Server**: Node.js + Express (TypeScript), ORM: Prisma (SQLite); Auth: JWT (access token), Bcrypt; Scheduler: node-cron (tối thiểu); CORS cơ bản.
- **Database**: SQLite (file `.db`).
- **Thông báo**: Server giữ `expoPushToken` cho từng người dùng; bắn thông báo qua Expo Push API.
- **Triển khai**: Backend trên Render/railway/VPS nhỏ (1 instance); SQLite lưu kèm theo app (volume/persistent disk). Mobile phát hành Expo (Development build/TestFlight/Play Internal).

### 3. Phân quyền & vai trò
- **Quản lý**: Toàn quyền CRUD phòng, khách, chỉ số, hóa đơn; xem báo cáo; cấu hình lịch nhắc; duyệt/đánh dấu thanh toán.
- **Khách thuê**: Xem phòng của mình, xem chỉ số & hóa đơn của phòng mình, nhận nhắc nhở, đánh dấu “đã xem”, cập nhật thông tin cá nhân tối thiểu (sdt), không được chỉnh sửa dữ liệu hệ thống.

### 4. Tính năng chi tiết & tiêu chí chấp nhận
1) Quản lý phòng
   - Thêm/sửa/xóa phòng với: `maPhong` (unique), `giaThue`, `trangThai` (trong|coKhach), ghi chú.
   - Danh sách phòng, lọc theo trạng thái.
   - AC: Không cho trùng `maPhong`; không xóa nếu đang có khách (tuỳ chính sách: cho phép nhưng phải chuyển khách, hoặc chặn xóa).

2) Quản lý khách thuê
   - Thêm/sửa/xóa khách: `hoTen`, `soDienThoai`, `cccd`, `ngayVao`, `ngayRa (optional)`.
   - Gán khách vào phòng; xem khách đang ở phòng nào.
   - AC: Một phòng có thể có nhiều khách (tùy chính sách, mặc định 1 chính, cho phép đồng thuê); lịch sử vào/ra phòng được lưu.

3) Quản lý chỉ số điện nước
   - Nhập số điện/nước hàng tháng cho từng phòng; lưu lịch sử kỳ chốt.
   - Cảnh báo nếu số nhập nhỏ hơn kỳ trước; yêu cầu xác nhận nếu buộc ghi đè.
   - AC: Khóa chỉnh sửa sau khi tạo hóa đơn kỳ đó (hoặc chỉ cho phép quản lý sửa với ghi log).

4) Quản lý hóa đơn
   - Tạo hóa đơn hàng tháng: tiền phòng + (điện tiêu thụ x đơn giá) + (nước tiêu thụ x đơn giá) + phụ phí (nếu có).
   - Danh sách hóa đơn: tất cả/chưa thanh toán/đã thanh toán; chi tiết hóa đơn; đánh dấu đã thanh toán.
   - AC: Mỗi phòng mỗi tháng tối đa 1 hóa đơn; không tạo khi thiếu chỉ số; cho phép xuất PDF đơn giản (tùy thời gian).

5) Thông báo – nhắc nhở
   - Nhắc chốt số điện nước (ví dụ ngày 30 hàng tháng cho quản lý).
   - Nhắc khách trả tiền (ví dụ trước ngày 5 hàng tháng cho khách).
   - Hiển thị in-app và push notification.
   - AC: Người dùng có thể bật/tắt loại nhắc; tôn trọng quyền thông báo của hệ điều hành.

6) Tìm kiếm – báo cáo đơn giản
   - Tìm kiếm phòng/khách theo mã phòng, tên, số điện thoại.
   - Báo cáo: tổng tiền thu trong tháng, số phòng đang trống.
   - AC: Báo cáo theo khoảng thời gian (tháng/năm); xuất CSV cơ bản (tùy thời gian).

### 5. Mô hình dữ liệu (SQLite)
- `User` (id, role: MANAGER|TENANT, name, phone, passwordHash, expoPushToken, createdAt)
- `Room` (id, maPhong unique, giaThue, trangThai: TRONG|CO_KHACH, note, createdAt)
- `Tenant` (id, hoTen, soDienThoai, cccd, createdAt)
- `RoomTenant` (id, roomId, tenantId, ngayVao, ngayRa nullable, isPrimaryTenant)
- `MeterReading` (id, roomId, ky: YYYY-MM, dienSoCu, dienSoMoi, nuocSoCu, nuocSoMoi, locked, createdAt)
- `Invoice` (id, roomId, ky: YYYY-MM, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status: PAID|UNPAID, createdAt, paidAt nullable)
- `Setting` (id, key, value) ví dụ: ngày nhắc chốt số, ngày nhắc thanh toán, đơn giá điện/nước mặc định.
- Ràng buộc chính:
  - `Room.maPhong` unique.
  - `Invoice (roomId, ky)` unique.
  - `MeterReading (roomId, ky)` unique.
  - `RoomTenant` cho phép nhiều bản ghi để lưu lịch sử.

Gợi ý index: `Room.maPhong`, `Tenant.soDienThoai`, `(Invoice.ky, status)`, `(MeterReading.roomId, ky)`.

### 6. API thiết kế (REST, tiền tố /api)
Auth
- POST `/auth/register-manager` (chỉ thiết lập lần đầu hoặc qua seed)
- POST `/auth/login` -> JWT, profile

User/Tenant
- GET `/users/me`
- PATCH `/users/me` (khách cập nhật sđt, cccd, token push)

Phòng
- GET `/rooms?status=`
- POST `/rooms`
- GET `/rooms/:id`
- PATCH `/rooms/:id`
- DELETE `/rooms/:id`

Khách thuê
- GET `/tenants?query=`
- POST `/tenants`
- GET `/tenants/:id`
- PATCH `/tenants/:id` (quản lý chỉnh sửa, bao gồm `cccd`)
- DELETE `/tenants/:id`
- POST `/rooms/:roomId/assign-tenant` { tenantId, ngayVao, isPrimaryTenant }
- POST `/rooms/:roomId/release-tenant` { tenantId, ngayRa }

Chỉ số điện nước
- GET `/meter-readings?roomId=&ky=`
- POST `/meter-readings` { roomId, ky, dienSoMoi, nuocSoMoi }
- PATCH `/meter-readings/:id` (quản lý, nếu chưa locked)
- POST `/meter-readings/:id/lock`

Hóa đơn
- POST `/invoices/generate` { ky } (tạo hàng loạt theo phòng)
- GET `/invoices?status=&roomId=&ky=`
- GET `/invoices/:id`
- PATCH `/invoices/:id/pay`

Thông báo
- POST `/notifications/test` (quản lý tự test đến mình)
- Server background job gửi nhắc theo lịch.

Báo cáo
- GET `/reports/revenue?from=&to=`
- GET `/reports/rooms/summary` (số phòng trống/đang có khách)

### 7. Luồng nghiệp vụ chính
- Nhập chỉ số: mỗi tháng quản lý nhập số điện/nước cho từng phòng; hệ thống kiểm tra với kỳ trước, cảnh báo nếu giảm; chốt và lock trước khi tạo hóa đơn.
- Tạo hóa đơn: theo `ky` tạo cho tất cả phòng có chỉ số; tính tổng: `tongCong = tienPhong + (dienTieuThu * donGiaDien) + (nuocTieuThu * donGiaNuoc) + phuPhi`.
- Thanh toán: đánh dấu PAID, lưu `paidAt`.
- Nhắc nhở: ngày 25 gửi nhắc nhập/chốt chỉ số cho quản lý; ngày 1 tạo hóa đơn; ngày 3-5 nhắc khách thanh toán.

### 8. Lịch và tác vụ nền (Scheduler)
- Dùng `node-cron` trên server.
- Lịch mặc định (cấu hình qua `Setting`):
  - 30 hàng tháng 09:00: gửi nhắc chốt chỉ số.
  - 01 hàng tháng 09:00: tạo hóa đơn `ky` mới.
  - 03, 05 hàng tháng 09:00: gửi nhắc thanh toán cho hóa đơn UNPAID.
- Cơ chế idempotent: job kiểm tra tồn tại dữ liệu trước khi tạo/gửi.

### 9. Bảo mật & tối giản
- Dùng JWT Access duy nhất (thời hạn 7-30 ngày) cho môn học; lưu trong SecureStore/AsyncStorage.
- Hash mật khẩu bằng Bcrypt; CORS cơ bản theo domain; có thể bỏ rate-limit ở môi trường học tập.
- Phân quyền middleware theo `role` và quyền sở hữu dữ liệu (tenant chỉ thấy dữ liệu của mình).
- Logging tối giản; không ghi thông tin nhạy cảm.

### 10. Ứng dụng Mobile (Expo)
- Điều hướng: React Navigation (Stack: Auth, App; Tabs: Phòng, Hóa đơn, Báo cáo/Thông báo, Cá nhân).
- State: React Query; Context API nếu cần state cục bộ; tránh Redux/Zustand để tối giản.
- Màn hình (Manager):
  - Đăng nhập/Đăng xuất; Dashboard tóm tắt.
  - Phòng: Danh sách, lọc, tạo/sửa/xóa, chi tiết; Gán khách.
  - Khách thuê: Danh sách, tìm kiếm, tạo/sửa/xóa, chi tiết.
  - Chỉ số: Danh sách theo `ky`, nhập/chỉnh, lịch sử.
  - Hóa đơn: Danh sách (tất cả/chưa/đã thanh toán), chi tiết, đánh dấu thanh toán.
  - Báo cáo: Tổng thu tháng, số phòng trống.
  - Cài đặt: đơn giá điện/nước, ngày nhắc, bật/tắt thông báo.
- Màn hình (Tenant):
  - Trang chủ: Phòng đang thuê, trạng thái hóa đơn hiện tại.
  - Hóa đơn của tôi: danh sách, chi tiết.
  - Thông báo.
  - Tài khoản: cập nhật sđt, CCCD, bật/tắt nhận thông báo.

### 11. Cấu trúc thư mục đề xuất
Backend (`server/`)
```
server/
  src/
    app.ts
    config/
    modules/
      auth/
      users/
      rooms/
      tenants/
      meter-readings/
      invoices/
      notifications/
      reports/
    middlewares/
    jobs/
    utils/
  prisma/
  package.json
```

Mobile (`app/`)
```
app/
  src/
    api/
    screens/
      Auth/
      Rooms/
      Tenants/
      Meter/
      Invoices/
      Reports/
      Settings/
    components/
    store/
    navigation/
    hooks/
    utils/
  app.json (expo)
  package.json
```

### 12. Testing & chất lượng (tối giản)
- Backend: 1-2 test tích hợp chính cho auth và một module quan trọng (Jest/Supertest) nếu kịp.
- Mobile: test cơ bản cho 1-2 form quan trọng (tùy thời gian).
- Lint/Format: ESLint + Prettier.

### 13. Triển khai & môi trường
- Môi trường: `.env` cho server (DATABASE_URL=\"file:./data.sqlite\", JWT_SECRET, EXPO_ACCESS_TOKEN,...), `.env` cho app (API_URL).
- Deploy: CI/CD đơn giản (GitHub Actions) build/test -> deploy. Prisma migrate chạy trước khi start.
- Backup DB: sao lưu file `.sqlite` định kỳ; tránh chạy nhiều instance ghi vào cùng file.

### 14. Kế hoạch thực thi (4 tuần gợi ý)
- Tuần 1: Khởi tạo repo, server + mobile, auth + role, mô hình dữ liệu SQLite, migrations, CRUD Phòng/Khách.
- Tuần 2: Chỉ số điện nước (nhập, cảnh báo, lock), danh sách/lịch sử; tích hợp React Query.
- Tuần 3: Hóa đơn (generate, danh sách/chi tiết, pay), báo cáo; phân quyền.
- Tuần 4: Thông báo đẩy + cron tối thiểu; hoàn thiện UI/UX; kiểm thử cơ bản; demo.

### 15. Backlog nhiệm vụ (rút gọn)
- Server
  - Khởi tạo dự án TS, Express, Prisma (SQLite), cấu hình Prisma schema
  - Auth: seed quản lý, login, JWT, middleware role
  - Modules: rooms, tenants, room-tenant, meter-readings, invoices, reports
  - Business rules: validate chỉ số, generate invoice, pay
  - Notifications: lưu expoPushToken, cron tối thiểu
- Mobile
  - Expo init TS, điều hướng
  - Màn hình Auth, lưu token
  - Màn hình Phòng/Khách/Chỉ số/Hóa đơn/Báo cáo/Cài đặt (manager)
  - Màn hình Tenant: phòng của tôi, hóa đơn của tôi, thông báo
  - Tích hợp push notification, permissions

### 16. Rủi ro & giảm thiểu
- Hạn chế thời gian: ưu tiên đường xương sống (CRUD + hóa đơn) trước; thông báo làm sau.
- Expo Notifications cần device thật: dùng Expo Go và test token; fallback in-app notifications.
- SQLite: lưu ý concurrent write (tránh nhiều instance), sao lưu file định kỳ.

### 17. Định nghĩa xong (Definition of Done)
- Tất cả luồng chính hoạt động trên thiết bị thật.
- Kiểm thử cơ bản pass; không crash; dữ liệu bền vững.
- Tối thiểu 1 môi trường demo online; hướng dẫn README, tài khoản mẫu.


