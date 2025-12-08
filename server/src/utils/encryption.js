const crypto = require('crypto');

// Sử dụng biến môi trường hoặc key cố định (nên dùng env)
const RAW_KEY = process.env.ENCRYPTION_KEY;
// Hỗ trợ key dạng hex 64 ký tự (32 bytes) hoặc chuỗi 32 ký tự ASCII
const KEY_BUFFER = /^[0-9a-fA-F]{64}$/.test(RAW_KEY)
  ? Buffer.from(RAW_KEY, 'hex')
  : Buffer.from(RAW_KEY);

if (KEY_BUFFER.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (provide 32-char text or 64-char hex)');
}

const IV_LENGTH = 16; // AES block size

/**
 * Mã hóa dữ liệu bằng AES-256-CBC
 * @param {string} text - Dữ liệu cần mã hóa
 * @returns {string} - Dữ liệu đã mã hóa (format: iv:encryptedData)
 */
function encrypt(text) {
  if (!text) return null;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY_BUFFER, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Trả về iv + encrypted data (cách nhau bởi :)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Giải mã dữ liệu AES-256-CBC
 * @param {string} encryptedText - Dữ liệu đã mã hóa (format: iv:encryptedData)
 * @returns {string} - Dữ liệu gốc
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_BUFFER, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Mã hóa thông tin User (phone)
 * @param {Object} userData - Dữ liệu User
 * @returns {Object} - Object với phone đã mã hóa
 */
function encryptUser(userData) {
  if (!userData) return userData;
  
  const encrypted = { ...userData };
  
  if (encrypted.phone) {
    encrypted.phone = encrypt(encrypted.phone);
  }
  
  return encrypted;
}

/**
 * Giải mã thông tin User (phone)
 * @param {Object} userData - Dữ liệu User đã mã hóa
 * @returns {Object} - Object với phone đã giải mã
 */
function decryptUser(userData) {
  if (!userData) return userData;
  
  const decrypted = { ...userData };
  
  if (decrypted.phone) {
    try {
      decrypted.phone = decrypt(decrypted.phone);
    } catch (err) {
      console.error(`Error decrypting phone:`, err.message);
    }
  }
  
  return decrypted;
}

/**
 * Mã hóa thông tin Tenant (soDienThoai, cccd)
 * @param {Object} tenantData - Dữ liệu Tenant
 * @returns {Object} - Object với soDienThoai và cccd đã mã hóa
 */
function encryptTenant(tenantData) {
  if (!tenantData) return tenantData;
  
  const encrypted = { ...tenantData };
  
  if (encrypted.soDienThoai) {
    encrypted.soDienThoai = encrypt(encrypted.soDienThoai);
  }
  
  if (encrypted.cccd) {
    encrypted.cccd = encrypt(encrypted.cccd);
  }
  
  return encrypted;
}

/**
 * Giải mã thông tin Tenant (soDienThoai, cccd)
 * @param {Object} tenantData - Dữ liệu Tenant đã mã hóa
 * @returns {Object} - Object với soDienThoai và cccd đã giải mã
 */
function decryptTenant(tenantData) {
  if (!tenantData) return tenantData;
  
  const decrypted = { ...tenantData };
  
  if (decrypted.soDienThoai) {
    try {
      decrypted.soDienThoai = decrypt(decrypted.soDienThoai);
    } catch (err) {
      console.error(`Error decrypting soDienThoai:`, err.message);
    }
  }
  
  if (decrypted.cccd) {
    try {
      decrypted.cccd = decrypt(decrypted.cccd);
    } catch (err) {
      console.error(`Error decrypting cccd:`, err.message);
    }
  }
  
  return decrypted;
}

/**
 * Giải mã danh sách Tenant
 * @param {Array<Object>} tenantList - Danh sách Tenant
 * @returns {Array<Object>} - Danh sách với các trường đã giải mã
 */
function decryptTenantList(tenantList) {
  if (!Array.isArray(tenantList)) return tenantList;
  
  return tenantList.map(tenant => decryptTenant(tenant));
}

module.exports = { 
  encrypt, 
  decrypt, 
  encryptUser,
  decryptUser,
  encryptTenant,
  decryptTenant,
  decryptTenantList
};
