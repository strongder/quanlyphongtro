const { db } = require('./db');

function runMigration() {
  console.log('🔄 Bắt đầu migration database...');
  
  try {
    // 1. Kiểm tra xem username column đã tồn tại chưa
    const userSchema = db.prepare('PRAGMA table_info(User)').all();
    const hasUsername = userSchema.some(col => col.name === 'username');
    
    if (hasUsername) {
      console.log('✅ Username column đã tồn tại, bỏ qua migration');
      return;
    }
    
    console.log('📝 Thêm username column vào bảng User...');
    
    // 2. Thêm username column (tạm thời cho phép NULL)
    db.exec('ALTER TABLE User ADD COLUMN username TEXT');
    
    console.log('✅ Đã thêm username column');
    
    // 3. Cập nhật dữ liệu hiện có
    console.log('📝 Cập nhật dữ liệu hiện có...');
    
    // Lấy tất cả users hiện có
    const users = db.prepare('SELECT id, name, phone FROM User').all();
    
    for (const user of users) {
      let username;
      
      if (user.role === 'MANAGER') {
        // Quản lý: sử dụng "admin" hoặc tạo từ name
        username = 'admin';
      } else {
        // Khách thuê: tạo username từ name + id
        const cleanName = user.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
        username = `${cleanName}${user.id}`;
      }
      
      // Cập nhật username cho user
      db.prepare('UPDATE User SET username = ? WHERE id = ?').run(username, user.id);
      console.log(`  - User ${user.id}: ${user.name} -> username: ${username}`);
    }
    
    // 4. Tạo bảng User mới với username NOT NULL
    console.log('📝 Tạo bảng User mới...');
    
    db.exec(`
      CREATE TABLE User_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL CHECK(role IN ('MANAGER','TENANT')),
        username TEXT NOT NULL UNIQUE,
        name TEXT,
        phone TEXT,
        passwordHash TEXT,
        expoPushToken TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    
    // 5. Copy dữ liệu từ bảng cũ sang bảng mới
    console.log('📝 Copy dữ liệu sang bảng mới...');
    
    db.exec(`
      INSERT INTO User_new (id, role, username, name, phone, passwordHash, expoPushToken, createdAt)
      SELECT id, role, username, name, phone, passwordHash, expoPushToken, createdAt
      FROM User;
    `);
    
    // 6. Xóa bảng cũ và đổi tên bảng mới
    console.log('📝 Hoàn tất migration...');
    
    db.exec('DROP TABLE User;');
    db.exec('ALTER TABLE User_new RENAME TO User;');
    
    console.log('✅ Migration hoàn thành thành công!');
    
    // 7. Kiểm tra kết quả
    const newUserSchema = db.prepare('PRAGMA table_info(User)').all();
    console.log('📋 Schema mới của bảng User:');
    newUserSchema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    const userCount = db.prepare('SELECT COUNT(*) as count FROM User').get();
    console.log(`📊 Tổng số users: ${userCount.count}`);
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
