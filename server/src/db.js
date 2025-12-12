const Database = require('better-sqlite3');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbFile);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function runMigrations() {
  // Drop old Invoice table if exists and doesn't have tenantId
  try {
    const cols = db.prepare("PRAGMA table_info('Invoice')").all();
    const hasTenantId = cols.some(c => c.name === 'tenantId');
    if (!hasTenantId) {
      db.exec('DROP TABLE IF EXISTS Invoice;');
    }
  } catch (e) {
    // Table doesn't exist yet, continue
  }

  // Check if User table status constraint needs updating
  try {
    const cols = db.prepare("PRAGMA table_info('User')").all();
    if (cols.length > 0) {
      // Table exists, check the constraint by trying to insert DELETED status
      const checkConstraint = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='User'").get();
      if (checkConstraint && checkConstraint.sql && !checkConstraint.sql.includes("'DELETED'")) {
        // Old constraint without DELETED, drop and recreate
        db.exec('DROP TABLE IF EXISTS User;');
        db.exec('DROP TABLE IF EXISTS RoomTenant;');
        db.exec('DROP TABLE IF EXISTS Tenant;');
      }
    }
  } catch (e) {
    // Continue with migration
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('MANAGER','TENANT')),
      username TEXT NOT NULL UNIQUE,
      name TEXT,
      phone TEXT,
      passwordHash TEXT,
      expoPushToken TEXT,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE','PENDING','REJECTED','DELETED')) DEFAULT 'ACTIVE',
      approvedAt TEXT,
      rejectedAt TEXT,
      rejectedReason TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Room (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      maPhong TEXT NOT NULL UNIQUE,
      giaThue REAL NOT NULL,
      trangThai TEXT NOT NULL CHECK(trangThai IN ('TRONG','CO_KHACH')) DEFAULT 'TRONG',
      dienTich REAL,
      taiSan TEXT,
      note TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Tenant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES User(id) ON DELETE CASCADE,
      hoTen TEXT NOT NULL,
      soDienThoai TEXT,
      cccd TEXT,
      email TEXT,
      diaChi TEXT,
      ngaySinh TEXT,
      gioiTinh TEXT CHECK(gioiTinh IN ('NAM','NU','KHAC')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS RoomTenant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId INTEGER NOT NULL REFERENCES Room(id) ON DELETE CASCADE,
      tenantId INTEGER NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
      ngayVao TEXT NOT NULL,
      ngayRa TEXT,
      isPrimaryTenant INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS MeterReading (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId INTEGER NOT NULL REFERENCES Room(id) ON DELETE CASCADE,
      ky TEXT NOT NULL,
      dienSoCu REAL,
      dienSoMoi REAL,
      nuocSoCu REAL,
      nuocSoMoi REAL,
      locked INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(roomId, ky)
    );

    CREATE TABLE IF NOT EXISTS Invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roomId INTEGER NOT NULL REFERENCES Room(id) ON DELETE CASCADE,
      tenantId INTEGER NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
      ky TEXT NOT NULL,
      tienPhong REAL NOT NULL,
      dienTieuThu REAL NOT NULL,
      nuocTieuThu REAL NOT NULL,
      donGiaDien REAL NOT NULL,
      donGiaNuoc REAL NOT NULL,
      phuPhi REAL NOT NULL DEFAULT 0,
      tongCong REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PAID','UNPAID','PENDING')) DEFAULT 'UNPAID',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      paidAt TEXT,
      requestedAt TEXT,
      UNIQUE(roomId, ky)
    );

    CREATE TABLE IF NOT EXISTS Payment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES Invoice(id) ON DELETE CASCADE,
      tenantId INTEGER NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
      transactionId TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS','FAILED','CANCELLED','PENDING')) DEFAULT 'PENDING',
      responseCode TEXT,
      paymentMethod TEXT CHECK(paymentMethod IN ('VNPAY','MOMO')) DEFAULT 'VNPAY',
      paidAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Setting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_room_maPhong ON Room(maPhong);
    CREATE INDEX IF NOT EXISTS idx_tenant_phone ON Tenant(soDienThoai);
    CREATE INDEX IF NOT EXISTS idx_invoice_tenant ON Invoice(tenantId);
    CREATE INDEX IF NOT EXISTS idx_invoice_ky_status ON Invoice(ky, status);
    CREATE INDEX IF NOT EXISTS idx_meter_room_ky ON MeterReading(roomId, ky);
    CREATE INDEX IF NOT EXISTS idx_payment_invoice ON Payment(invoiceId);
    CREATE INDEX IF NOT EXISTS idx_payment_tenant ON Payment(tenantId);
    CREATE INDEX IF NOT EXISTS idx_payment_transaction ON Payment(transactionId);
  `);
}

runMigrations();

// Simple migration to ensure Invoice supports tenantId, PENDING and requestedAt
try {
  const cols = db.prepare("PRAGMA table_info('Invoice')").all();
  const hasTenantId = cols.some(c => c.name === 'tenantId');
  const hasRequestedAt = cols.some(c => c.name === 'requestedAt');
  // Check constraint by reading table SQL
  const tableSqlRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Invoice'").get();
  const tableSql = tableSqlRow?.sql || '';
  const supportsPending = tableSql.includes("'PENDING'");

  if (!hasTenantId || !hasRequestedAt || !supportsPending) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS Invoice_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          roomId INTEGER NOT NULL REFERENCES Room(id) ON DELETE CASCADE,
          tenantId INTEGER NOT NULL REFERENCES Tenant(id) ON DELETE CASCADE,
          ky TEXT NOT NULL,
          tienPhong REAL NOT NULL,
          dienTieuThu REAL NOT NULL,
          nuocTieuThu REAL NOT NULL,
          donGiaDien REAL NOT NULL,
          donGiaNuoc REAL NOT NULL,
          phuPhi REAL NOT NULL DEFAULT 0,
          tongCong REAL NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('PAID','UNPAID','PENDING')) DEFAULT 'UNPAID',
          createdAt TEXT NOT NULL DEFAULT (datetime('now')),
          paidAt TEXT,
          requestedAt TEXT,
          UNIQUE(roomId, ky)
        );
      `);

      // Copy data with best-effort mapping; get tenantId from RoomTenant
      db.exec(`
        INSERT INTO Invoice_new (id, roomId, tenantId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status, createdAt, paidAt)
        SELECT i.id, i.roomId, COALESCE(rt.tenantId, 1) as tenantId, i.ky, i.tienPhong, i.dienTieuThu, i.nuocTieuThu, i.donGiaDien, i.donGiaNuoc, i.phuPhi, i.tongCong, i.status, i.createdAt, i.paidAt 
        FROM Invoice i
        LEFT JOIN RoomTenant rt ON i.roomId = rt.roomId AND rt.isPrimaryTenant = 1;
      `);

      db.exec('DROP TABLE Invoice;');
      db.exec('ALTER TABLE Invoice_new RENAME TO Invoice;');
    })();
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('Invoice migration check failed:', e);
}

module.exports = { db };


