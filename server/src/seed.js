const { db } = require('./db');
const bcrypt = require('bcryptjs');

function pad(num, size) {
  let s = String(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function seedDatabase() {
  console.log('🌱 Bắt đầu seed database (reset & seed >= 10 bản ghi mỗi bảng)...');

  try {
    // Xóa sạch dữ liệu theo thứ tự khóa ngoại
    const clearTx = db.transaction(() => {
      db.prepare('DELETE FROM RoomTenant').run();
      db.prepare('DELETE FROM MeterReading').run();
      db.prepare('DELETE FROM Invoice').run();
      db.prepare('DELETE FROM Tenant').run();
      db.prepare('DELETE FROM Room').run();
      db.prepare('DELETE FROM Setting').run();
      // Giữ lại user manager nếu có? Ở đây xóa sạch rồi tạo lại để chắc chắn
      db.prepare('DELETE FROM User').run();
    });
    clearTx();
    console.log('🧹 Đã xóa sạch dữ liệu cũ');

    // 1) User: 1 manager + 12 tenants (>= 10)
    const managerHash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO User (role, username, name, phone, passwordHash, status) VALUES (?,?,?,?,?,?)')
      .run('MANAGER', 'admin', 'Quản lý chính', '0123456789', managerHash, 'ACTIVE');

    const tenantUserIds = [];
    for (let i = 1; i <= 12; i++) {
      const hash = bcrypt.hashSync('123456', 10);
      const username = `tenant${i}`;
      const name = `Khách thuê ${i}`;
      const phone = `090${pad(100000 + i, 7)}`;
      const info = db.prepare('INSERT INTO User (role, username, name, phone, passwordHash, status) VALUES (?,?,?,?,?,?)')
        .run('TENANT', username, name, phone, hash, 'ACTIVE');
      tenantUserIds.push(info.lastInsertRowid);
    }
    console.log(`✅ Đã tạo ${tenantUserIds.length} user khách thuê + 1 manager`);

    // 2) Room: 10 phòng (>= 10)
    const roomIds = [];
    for (let i = 1; i <= 10; i++) {
      const maPhong = `P${pad(i, 3)}`;
      const giaThue = 1800000 + (i % 5) * 200000; // 1.8tr - 2.6tr
      const note = i % 2 === 0 ? 'Phòng có ban công' : 'Phòng mới sơn sửa';
      const info = db.prepare('INSERT INTO Room (maPhong, giaThue, trangThai, note) VALUES (?,?,?,?)')
        .run(maPhong, giaThue, 'TRONG', note);
      roomIds.push(info.lastInsertRowid);
    }
    console.log(`✅ Đã tạo ${roomIds.length} phòng`);

    // 3) Tenant: 12 tenant records liên kết userId
    const tenantIds = [];
    for (let i = 0; i < tenantUserIds.length; i++) {
      const hoTen = `Khách thuê ${i + 1}`;
      const soDienThoai = `090${pad(200000 + i + 1, 7)}`;
      const cccd = `${pad(100000000000 + i + 1, 12)}`;
      const info = db.prepare('INSERT INTO Tenant (userId, hoTen, soDienThoai, cccd) VALUES (?,?,?,?)')
        .run(tenantUserIds[i], hoTen, soDienThoai, cccd);
      tenantIds.push(info.lastInsertRowid);
    }
    console.log(`✅ Đã tạo ${tenantIds.length} khách thuê`);

    // 4) RoomTenant: gán >= 10 bản ghi
    // Gán 8 phòng đầu cho 8 tenant đầu làm primary
    const today = new Date().toISOString().split('T')[0];
    let assignmentsCount = 0;
    for (let i = 0; i < 8; i++) {
      db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
        .run(roomIds[i], tenantIds[i], today, 1);
      assignmentsCount++;
    }
    // Thêm 2 đồng thuê vào phòng 9 và 10
    db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
      .run(roomIds[8], tenantIds[8], today, 1);
    db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
      .run(roomIds[8], tenantIds[9], today, 0);
    db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
      .run(roomIds[9], tenantIds[10], today, 1);
    db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
      .run(roomIds[9], tenantIds[11], today, 0);
    assignmentsCount += 4;
    console.log(`✅ Đã gán ${assignmentsCount} bản ghi RoomTenant`);

    // Cập nhật trạng thái phòng có khách
    db.prepare(`UPDATE Room SET trangThai = 'CO_KHACH' WHERE id IN (${roomIds.slice(0,10).map(() => '?').join(',')})`)
      .run(...roomIds);

    // 5) MeterReading: tạo >= 10 bản ghi (2 kỳ cho 6 phòng = 12)
    const meterRooms = roomIds.slice(0, 6);
    const meterReadings = [];
    for (const roomId of meterRooms) {
      meterReadings.push({ roomId, ky: '2025-08', dienSoCu: 100, dienSoMoi: 140, nuocSoCu: 50, nuocSoMoi: 70, locked: 1 });
      meterReadings.push({ roomId, ky: '2025-09', dienSoCu: 140, dienSoMoi: 190, nuocSoCu: 70, nuocSoMoi: 95, locked: 0 });
    }
    for (const r of meterReadings) {
      db.prepare('INSERT INTO MeterReading (roomId, ky, dienSoCu, dienSoMoi, nuocSoCu, nuocSoMoi, locked) VALUES (?,?,?,?,?,?,?)')
        .run(r.roomId, r.ky, r.dienSoCu, r.dienSoMoi, r.nuocSoCu, r.nuocSoMoi, r.locked);
    }
    console.log(`✅ Đã tạo ${meterReadings.length} bản ghi chỉ số`);

    // 6) Invoice: tạo >= 10 bản ghi (2 kỳ cho 6 phòng = 12)
    const invoices = [];
    for (const roomId of meterRooms) {
      // tháng 8 paid
      invoices.push({ roomId, ky: '2025-08', tienPhong: 2000000, dienTieuThu: 40, nuocTieuThu: 20, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2000000 + 40*3500 + 20*15000, status: 'PAID', paidAt: '2025-08-10 09:00:00' });
      // tháng 9 unpaid
      invoices.push({ roomId, ky: '2025-09', tienPhong: 2000000, dienTieuThu: 50, nuocTieuThu: 25, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2000000 + 50*3500 + 25*15000, status: 'UNPAID', paidAt: null });
    }
    for (const inv of invoices) {
      db.prepare('INSERT INTO Invoice (roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status, paidAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(inv.roomId, inv.ky, inv.tienPhong, inv.dienTieuThu, inv.nuocTieuThu, inv.donGiaDien, inv.donGiaNuoc, inv.phuPhi, inv.tongCong, inv.status, inv.paidAt);
    }
    console.log(`✅ Đã tạo ${invoices.length} hóa đơn`);

    // 7) Settings: >= 10 khóa cấu hình
    const settings = [
      { key: 'donGiaDien', value: '3500' },
      { key: 'donGiaNuoc', value: '15000' },
      { key: 'ngayNhapSo', value: '30' },
      { key: 'ngayNhapTien', value: '5' },
      { key: 'tenChuTro', value: 'Nguyễn Văn A' },
      { key: 'diaChi', value: '123 Đường ABC, Quận 1, TP.HCM' },
      { key: 'soTaiKhoan', value: '1234567890' },
      { key: 'chuTaiKhoan', value: 'Nguyen Van A' },
      { key: 'nganHang', value: 'VCB' },
      { key: 'soDienTong', value: '0' },
      { key: 'soNuocTong', value: '0' },
    ];
    for (const s of settings) {
      db.prepare('INSERT INTO Setting (key, value) VALUES (?,?)').run(s.key, s.value);
    }
    console.log(`✅ Đã tạo ${settings.length} cài đặt hệ thống`);

    console.log('\n🎉 Seed database hoàn tất với dữ liệu mới (>=10/bảng)!');
  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
  }
}

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
