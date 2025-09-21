const { db } = require('./db');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  console.log('🌱 Bắt đầu seed database...');
  
  try {
    // 1. Tạo user quản lý
    const managerHash = bcrypt.hashSync('123456', 10);
    const managerInfo = db.prepare('INSERT INTO User (role, username, name, phone, passwordHash) VALUES (?,?,?,?,?)')
      .run('MANAGER', 'admin', 'Quản lý chính', '0123456789', managerHash);
    console.log('✅ Đã tạo user quản lý');

    // 2. Tạo phòng mẫu
    const rooms = [
      { maPhong: 'P001', giaThue: 2000000, trangThai: 'CO_KHACH', note: 'Phòng đẹp, có ban công' },
      { maPhong: 'P002', giaThue: 2500000, trangThai: 'CO_KHACH', note: 'Phòng rộng, view đẹp' },
      { maPhong: 'P003', giaThue: 1800000, trangThai: 'TRONG', note: 'Phòng tiết kiệm' },
      { maPhong: 'P004', giaThue: 2200000, trangThai: 'CO_KHACH', note: 'Phòng mới sửa chữa' },
      { maPhong: 'P005', giaThue: 3000000, trangThai: 'TRONG', note: 'Phòng cao cấp' },
    ];

    const roomIds = [];
    for (const room of rooms) {
      const info = db.prepare('INSERT INTO Room (maPhong, giaThue, trangThai, note) VALUES (?,?,?,?)')
        .run(room.maPhong, room.giaThue, room.trangThai, room.note);
      roomIds.push(info.lastInsertRowid);
    }
    console.log('✅ Đã tạo 5 phòng mẫu');

    // 3. Tạo user khách thuê mẫu
    const tenantUsers = [
      { username: 'tenant1', name: 'Nguyễn Văn An', phone: '0901234567', password: '123456' },
      { username: 'tenant2', name: 'Trần Thị Bình', phone: '0902345678', password: '123456' },
      { username: 'tenant3', name: 'Lê Văn Cường', phone: '0903456789', password: '123456' },
      { username: 'tenant4', name: 'Phạm Thị Dung', phone: '0904567890', password: '123456' },
    ];

    const tenantUserIds = [];
    for (const user of tenantUsers) {
      const hash = bcrypt.hashSync(user.password, 10);
      const info = db.prepare('INSERT INTO User (role, username, name, phone, passwordHash, status) VALUES (?,?,?,?,?,?)')
        .run('TENANT', user.username, user.name, user.phone, hash, 'ACTIVE');
      tenantUserIds.push(info.lastInsertRowid);
    }
    console.log('✅ Đã tạo 4 user khách thuê mẫu');

    // 4. Tạo tenant records
    const tenants = [
      { userId: tenantUserIds[0], hoTen: 'Nguyễn Văn An', soDienThoai: '0901234567', cccd: '123456789012' },
      { userId: tenantUserIds[1], hoTen: 'Trần Thị Bình', soDienThoai: '0902345678', cccd: '234567890123' },
      { userId: tenantUserIds[2], hoTen: 'Lê Văn Cường', soDienThoai: '0903456789', cccd: '345678901234' },
      { userId: tenantUserIds[3], hoTen: 'Phạm Thị Dung', soDienThoai: '0904567890', cccd: '456789012345' },
    ];

    const tenantIds = [];
    for (const tenant of tenants) {
      const info = db.prepare('INSERT INTO Tenant (userId, hoTen, soDienThoai, cccd) VALUES (?,?,?,?)')
        .run(tenant.userId, tenant.hoTen, tenant.soDienThoai, tenant.cccd);
      tenantIds.push(info.lastInsertRowid);
    }
    console.log('✅ Đã tạo 4 khách thuê mẫu');

    // 5. Gán khách vào phòng
    const assignments = [
      { roomId: roomIds[0], tenantId: tenantIds[0], ngayVao: '2025-08-01', isPrimaryTenant: 1 },
      { roomId: roomIds[1], tenantId: tenantIds[1], ngayVao: '2025-08-15', isPrimaryTenant: 1 },
      { roomId: roomIds[3], tenantId: tenantIds[2], ngayVao: '2025-09-01', isPrimaryTenant: 1 },
      { roomId: roomIds[3], tenantId: tenantIds[3], ngayVao: '2025-09-10', isPrimaryTenant: 0 }, // đồng thuê
    ];

    for (const assignment of assignments) {
      db.prepare('INSERT INTO RoomTenant (roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
        .run(assignment.roomId, assignment.tenantId, assignment.ngayVao, assignment.isPrimaryTenant);
    }
    console.log('✅ Đã gán khách vào phòng');

    // 6. Tạo chỉ số điện nước cho tháng 8 và 9/2025
    const meterReadings = [
      // Tháng 8/2025
      { roomId: roomIds[0], ky: '2025-08', dienSoCu: 100, dienSoMoi: 150, nuocSoCu: 50, nuocSoMoi: 75, locked: 1 },
      { roomId: roomIds[1], ky: '2025-08', dienSoCu: 200, dienSoMoi: 280, nuocSoCu: 100, nuocSoMoi: 130, locked: 1 },
      { roomId: roomIds[3], ky: '2025-08', dienSoCu: 150, dienSoMoi: 180, nuocSoCu: 80, nuocSoMoi: 95, locked: 1 },
      
      // Tháng 9/2025
      { roomId: roomIds[0], ky: '2025-09', dienSoCu: 150, dienSoMoi: 220, nuocSoCu: 75, nuocSoMoi: 110, locked: 1 },
      { roomId: roomIds[1], ky: '2025-09', dienSoCu: 280, dienSoMoi: 350, nuocSoCu: 130, nuocSoMoi: 165, locked: 1 },
      { roomId: roomIds[3], ky: '2025-09', dienSoCu: 180, dienSoMoi: 250, nuocSoCu: 95, nuocSoMoi: 125, locked: 0 }, // chưa khóa
    ];

    for (const reading of meterReadings) {
      db.prepare('INSERT INTO MeterReading (roomId, ky, dienSoCu, dienSoMoi, nuocSoCu, nuocSoMoi, locked) VALUES (?,?,?,?,?,?,?)')
        .run(reading.roomId, reading.ky, reading.dienSoCu, reading.dienSoMoi, reading.nuocSoCu, reading.nuocSoMoi, reading.locked);
    }
    console.log('✅ Đã tạo chỉ số điện nước');

    // 7. Tạo hóa đơn cho tháng 8 và 9/2025
    const invoices = [
      // Tháng 8/2025 - đã thanh toán
      { roomId: roomIds[0], ky: '2025-08', tienPhong: 2000000, dienTieuThu: 50, nuocTieuThu: 25, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2175000, status: 'PAID', paidAt: '2025-08-05 10:30:00' },
      { roomId: roomIds[1], ky: '2025-08', tienPhong: 2500000, dienTieuThu: 80, nuocTieuThu: 30, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2830000, status: 'PAID', paidAt: '2025-08-06 14:20:00' },
      { roomId: roomIds[3], ky: '2025-08', tienPhong: 2200000, dienTieuThu: 30, nuocTieuThu: 15, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2305000, status: 'PAID', paidAt: '2025-08-07 09:15:00' },
      
      // Tháng 9/2025 - chưa thanh toán
      { roomId: roomIds[0], ky: '2025-09', tienPhong: 2000000, dienTieuThu: 70, nuocTieuThu: 35, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2245000, status: 'UNPAID', paidAt: null },
      { roomId: roomIds[1], ky: '2025-09', tienPhong: 2500000, dienTieuThu: 70, nuocTieuThu: 35, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2745000, status: 'UNPAID', paidAt: null },
      { roomId: roomIds[3], ky: '2025-09', tienPhong: 2200000, dienTieuThu: 70, nuocTieuThu: 30, donGiaDien: 3500, donGiaNuoc: 15000, phuPhi: 0, tongCong: 2345000, status: 'UNPAID', paidAt: null },
    ];

    for (const invoice of invoices) {
      db.prepare('INSERT INTO Invoice (roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status, paidAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(invoice.roomId, invoice.ky, invoice.tienPhong, invoice.dienTieuThu, invoice.nuocTieuThu, invoice.donGiaDien, invoice.donGiaNuoc, invoice.phuPhi, invoice.tongCong, invoice.status, invoice.paidAt);
    }
    console.log('✅ Đã tạo hóa đơn');

    // 8. Cập nhật trạng thái phòng
    db.prepare('UPDATE Room SET trangThai = ? WHERE id IN (?,?,?)')
      .run('CO_KHACH', roomIds[0], roomIds[1], roomIds[3]);
    console.log('✅ Đã cập nhật trạng thái phòng');

    // 9. Tạo cài đặt hệ thống
    const settings = [
      { key: 'donGiaDien', value: '3500' },
      { key: 'donGiaNuoc', value: '15000' },
      { key: 'ngayNhapSo', value: '30' },
      { key: 'ngayNhapTien', value: '5' },
      { key: 'tenChuTro', value: 'Nguyễn Văn A' },
      { key: 'diaChi', value: '123 Đường ABC, Quận 1, TP.HCM' },
    ];

    for (const setting of settings) {
      db.prepare('INSERT INTO Setting (key, value) VALUES (?,?)')
        .run(setting.key, setting.value);
    }
    console.log('✅ Đã tạo cài đặt hệ thống');

    console.log('\n🎉 Seed database hoàn thành!');
    console.log('\n📊 Tóm tắt data mẫu:');
    console.log('- 1 user quản lý (phone: 0123456789, password: 123456)');
    console.log('- 5 phòng (3 có khách, 2 trống)');
    console.log('- 4 khách thuê');
    console.log('- Chỉ số điện nước tháng 8, 9/2025');
    console.log('- Hóa đơn tháng 8 (đã thanh toán), tháng 9 (chưa thanh toán)');
    console.log('- Cài đặt hệ thống mặc định');

  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
  }
}

// Chạy seed nếu file được gọi trực tiếp
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
