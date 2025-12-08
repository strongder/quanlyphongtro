require('dotenv').config();
const crypto = require('crypto');
const { db } = require('./db');
const { encryptUser, encryptTenant } = require('./utils/encryption');

// Khóa cũ để giải mã và mã hóa lại (đặt trong PREV_ENCRYPTION_KEY). Nếu không có, dùng key 32 ký tự trước đó.
const RAW_OLD_KEY = process.env.PREV_ENCRYPTION_KEY || '12345678901234567890123456789012';
const OLD_KEY_BUFFER = /^[0-9a-fA-F]{64}$/.test(RAW_OLD_KEY)
  ? Buffer.from(RAW_OLD_KEY, 'hex')
  : Buffer.from(RAW_OLD_KEY);

// Cố gắng giải mã bằng khóa cũ; nếu thất bại, trả về null để biết là không giải mã được
function tryDecryptWithOldKey(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return null;
  if (!encryptedText.includes(':')) return null;
  const parts = encryptedText.split(':');
  if (parts.length < 2) return null;
  try {
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', OLD_KEY_BUFFER, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null; // không giải mã được (có thể đã mã hóa bằng key mới)
  }
}

console.log('Starting encryption migration...');

try {
  // Mã hóa dữ liệu User
  console.log('\n1. Migrating User table...');
  const users = db.prepare('SELECT * FROM User').all();
  
  let userCount = 0;
  users.forEach(user => {
    if (!user.phone) return;

    const isEncrypted = user.phone.includes(':');
    const decryptedOld = tryDecryptWithOldKey(user.phone);

    // Nếu đã mã hóa bằng key mới (không giải mã được với key cũ) thì bỏ qua để tránh double-encrypt
    if (isEncrypted && !decryptedOld) return;

    const plainPhone = decryptedOld || user.phone; // Nếu chưa mã hóa hoặc mã hóa bằng key cũ
    const encrypted = encryptUser({ phone: plainPhone });
    db.prepare('UPDATE User SET phone = ? WHERE id = ?').run(encrypted.phone, user.id);
    userCount++;
    console.log(`  ✓ Encrypted phone for user ID ${user.id}`);
  });
  
  console.log(`✅ Migrated ${userCount} users`);
  
  // Mã hóa dữ liệu Tenant
  console.log('\n2. Migrating Tenant table...');
  const tenants = db.prepare('SELECT * FROM Tenant').all();
  
  let tenantCount = 0;
  tenants.forEach(tenant => {
    const phoneEnc = tenant.soDienThoai;
    const cccdEnc = tenant.cccd;

    const phoneDecryptedOld = phoneEnc ? tryDecryptWithOldKey(phoneEnc) : null;
    const cccdDecryptedOld = cccdEnc ? tryDecryptWithOldKey(cccdEnc) : null;

    const phoneIsEncrypted = phoneEnc && phoneEnc.includes(':');
    const cccdIsEncrypted = cccdEnc && cccdEnc.includes(':');

    // Nếu cả hai trường đều đã mã hóa bằng key mới (không giải mã được bằng key cũ) thì bỏ qua
    const skip = 
      (!phoneEnc || (phoneIsEncrypted && !phoneDecryptedOld)) &&
      (!cccdEnc || (cccdIsEncrypted && !cccdDecryptedOld));
    if (skip) return;

    const plainSoDienThoai = phoneDecryptedOld || phoneEnc;
    const plainCccd = cccdDecryptedOld || cccdEnc;

    const encrypted = encryptTenant({ 
      soDienThoai: plainSoDienThoai, 
      cccd: plainCccd 
    });
    
    db.prepare('UPDATE Tenant SET soDienThoai = ?, cccd = ? WHERE id = ?').run(
      encrypted.soDienThoai || plainSoDienThoai,
      encrypted.cccd || plainCccd,
      tenant.id
    );
    
    tenantCount++;
    console.log(`  ✓ Encrypted data for tenant ID ${tenant.id}`);
  });
  
  console.log(`✅ Migrated ${tenantCount} tenants`);
  
  console.log('\n🎉 Encryption migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
