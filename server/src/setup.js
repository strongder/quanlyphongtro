/**
 * Script khởi tạo database và seed dữ liệu mẫu
 * Chạy: node src/setup.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { encryptUser, encryptTenant } = require('./utils/encryption');

console.log('🚀 Starting database setup...\n');

// Xóa database cũ
try {
  console.log('1. Cleaning old data...');
  db.exec(`
    DELETE FROM Payment;
    DELETE FROM Invoice;
    DELETE FROM MeterReading;
    DELETE FROM RoomTenant;
    DELETE FROM Tenant;
    DELETE FROM Room;
    DELETE FROM User;
    DELETE FROM Setting;
  `);
  console.log('   ✓ Old data cleaned\n');
} catch (e) {
  console.log('   - No old data to clean\n');
}

// Seed Settings
console.log('2. Seeding Settings...');
db.prepare('INSERT INTO Setting(key, value) VALUES (?, ?)').run('donGiaDien', '3500');
db.prepare('INSERT INTO Setting(key, value) VALUES (?, ?)').run('donGiaNuoc', '20000');
console.log('   ✓ Settings created\n');

// Seed Users
console.log('3. Seeding Users...');
const managerHash = bcrypt.hashSync('manager123', 10);
const managerEncrypted = encryptUser({ name: 'Quản lý' });

db.prepare('INSERT INTO User(role, username, name, passwordHash, status) VALUES (?,?,?,?,?)')
  .run('MANAGER', 'manager', managerEncrypted.name, managerHash, 'ACTIVE');

const tenantUsers = [];
for (let i = 1; i <= 12; i++) {
  const tenantHash = bcrypt.hashSync('tenant123', 10);
  const phone = `090020000${i.toString().padStart(2, '0')}`;
  const username = `tenant${i}`;
  const name = `Khách thuê ${i}`;
  
  const encryptedUser = encryptUser({ phone, name });
  
  const info = db.prepare('INSERT INTO User(role, username, name, phone, passwordHash, status) VALUES (?,?,?,?,?,?)')
    .run('TENANT', username, encryptedUser.name, encryptedUser.phone, tenantHash, 'ACTIVE');
  tenantUsers.push(info.lastInsertRowid);
}
console.log(`   ✓ Created 1 manager + 12 tenants\n`);

// Seed Rooms
console.log('4. Seeding Rooms...');
const rooms = [];
const giaThueMau = [2000000, 2200000, 2400000, 2600000, 1800000];
const dienTichMau = [20, 22, 25, 28, 18];
const taiSanMau = [
  { 'Quạt trần': 1, 'Bình nóng lạnh': 1 },
  { 'Quạt trần': 1, 'Bình nóng lạnh': 1, 'Tủ lạnh': 1 },
  { 'Máy lạnh': 1, 'Bình nóng lạnh': 1, 'Tủ lạnh': 1 },
  { 'Máy lạnh': 1, 'Bình nóng lạnh': 1, 'Tủ lạnh': 1, 'Máy giặt': 1 }
];

for (let i = 1; i <= 10; i++) {
  const giaThue = giaThueMau[i % giaThueMau.length];
  const dienTich = dienTichMau[i % dienTichMau.length];
  const taiSan = JSON.stringify(taiSanMau[i % taiSanMau.length]);
  const note = i % 2 === 0 ? 'Phòng có ban công' : 'Phòng mới sơn sửa';
  
  const info = db.prepare('INSERT INTO Room(maPhong, giaThue, dienTich, taiSan, note) VALUES (?,?,?,?,?)')
    .run(`P${i.toString().padStart(3, '0')}`, giaThue, dienTich, taiSan, note);
  rooms.push(info.lastInsertRowid);
}
console.log(`   ✓ Created 10 rooms\n`);

// Seed Tenants
console.log('5. Seeding Tenants...');
const tenants = [];
for (let i = 0; i < 12; i++) {
  const soDienThoai = `090020000${(i + 1).toString().padStart(2, '0')}`;
  const cccd = `10000000000${i + 1}`;
  const email = `tenant${i + 1}@example.com`;
  const diaChi = `${i + 1} Nguyễn Văn Linh, Q7, TP.HCM`;
  const ngaySinh = `199${i % 10}-0${(i % 9) + 1}-15`;
  const gioiTinh = i % 2 === 0 ? 'NAM' : 'NU';
  
  // Mã hóa tất cả dữ liệu nhạy cảm
  const encrypted = encryptTenant({ soDienThoai, cccd, email, diaChi, ngaySinh });
  
  const info = db.prepare('INSERT INTO Tenant(userId, hoTen, soDienThoai, cccd, email, diaChi, ngaySinh, gioiTinh) VALUES (?,?,?,?,?,?,?,?)')
    .run(tenantUsers[i], `Khách thuê ${i + 1}`, encrypted.soDienThoai, encrypted.cccd, encrypted.email, encrypted.diaChi, encrypted.ngaySinh, gioiTinh);
  tenants.push(info.lastInsertRowid);
}
console.log(`   ✓ Created 12 tenants\n`);

// Seed RoomTenant (assign tenants to rooms)
console.log('6. Assigning tenants to rooms...');
const ngayVao = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Phòng 1-8: 1 tenant/phòng
for (let i = 0; i < 8; i++) {
  db.prepare('INSERT INTO RoomTenant(roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
    .run(rooms[i], tenants[i], ngayVao, 1);
  db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', rooms[i]);
}

// Phòng 9-10: 2 tenants/phòng
db.prepare('INSERT INTO RoomTenant(roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
  .run(rooms[8], tenants[8], ngayVao, 1);
db.prepare('INSERT INTO RoomTenant(roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
  .run(rooms[8], tenants[9], ngayVao, 0);
db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', rooms[8]);

db.prepare('INSERT INTO RoomTenant(roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
  .run(rooms[9], tenants[10], ngayVao, 1);
db.prepare('INSERT INTO RoomTenant(roomId, tenantId, ngayVao, isPrimaryTenant) VALUES (?,?,?,?)')
  .run(rooms[9], tenants[11], ngayVao, 0);
db.prepare('UPDATE Room SET trangThai = ? WHERE id = ?').run('CO_KHACH', rooms[9]);

console.log(`   ✓ Assigned tenants to rooms\n`);

console.log('✅ Database setup completed!\n');
console.log('📋 Summary:');
console.log('   - 1 Manager: username=manager, password=manager123');
console.log('   - 12 Tenants: username=tenant1-12, password=tenant{N}');
console.log('   - 10 Rooms with dienTich & taiSan (JSON)');
console.log('   - Settings: donGiaDien=3500, donGiaNuoc=20000\n');
