const Database = require('better-sqlite3');
const path = require('path');

const dbFile = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbFile);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('MANAGER','TENANT')),
      username TEXT NOT NULL UNIQUE,
      name TEXT,
      phone TEXT,
      passwordHash TEXT,
      expoPushToken TEXT,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE','PENDING','REJECTED')) DEFAULT 'ACTIVE',
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
      note TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Tenant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES User(id) ON DELETE CASCADE,
      hoTen TEXT NOT NULL,
      soDienThoai TEXT,
      cccd TEXT,
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

    CREATE TABLE IF NOT EXISTS Setting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_room_maPhong ON Room(maPhong);
    CREATE INDEX IF NOT EXISTS idx_tenant_phone ON Tenant(soDienThoai);
    CREATE INDEX IF NOT EXISTS idx_invoice_ky_status ON Invoice(ky, status);
    CREATE INDEX IF NOT EXISTS idx_meter_room_ky ON MeterReading(roomId, ky);
  `);
}

runMigrations();

// Simple migration to ensure Invoice supports PENDING and requestedAt
try {
  const cols = db.prepare("PRAGMA table_info('Invoice')").all();
  const hasRequestedAt = cols.some(c => c.name === 'requestedAt');
  // Check constraint by reading table SQL
  const tableSqlRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Invoice'").get();
  const tableSql = tableSqlRow?.sql || '';
  const supportsPending = tableSql.includes("'PENDING'");

  if (!hasRequestedAt || !supportsPending) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS Invoice_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          roomId INTEGER NOT NULL REFERENCES Room(id) ON DELETE CASCADE,
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

      // Copy data with best-effort mapping; requestedAt will be NULL
      db.exec(`
        INSERT INTO Invoice_new (id, roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status, createdAt, paidAt)
        SELECT id, roomId, ky, tienPhong, dienTieuThu, nuocTieuThu, donGiaDien, donGiaNuoc, phuPhi, tongCong, status, createdAt, paidAt FROM Invoice;
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


