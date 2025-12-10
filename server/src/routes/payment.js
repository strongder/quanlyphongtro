const express = require("express");
const { db } = require("../db");
const { authRequired } = require("../middlewares/auth");
const { decryptTenant } = require("../utils/encryption");

const router = express.Router();

/**
 * Admin API: Lấy danh sách tất cả payments với filter
 * Query params: status, paymentMethod, startDate, endDate, limit, offset
 */
router.get("/", authRequired, (req, res) => {
  const user = req.user;
  if (user.role !== "MANAGER") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }

  const { status, paymentMethod, startDate, endDate, limit = 20, offset = 0 } = req.query;
  let query = `SELECT p.*, t.hoTen as tenantName, t.soDienThoai, i.ky, i.roomId FROM Payment p 
              JOIN Tenant t ON p.tenantId = t.id
              JOIN Invoice i ON p.invoiceId = i.id
              WHERE 1=1`;
  const params = [];

  if (status) {
    query += " AND p.status = ?";
    params.push(status);
  }
  if (paymentMethod) {
    query += " AND p.paymentMethod = ?";
    params.push(paymentMethod);
  }
  if (startDate) {
    query += " AND p.createdAt >= ?";
    params.push(startDate);
  }
  if (endDate) {
    query += " AND p.createdAt <= ?";
    params.push(endDate);
  }

  query += " ORDER BY p.createdAt DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  const payments = db.prepare(query).all(...params);
  
  // Giải mã số điện thoại
  const decryptedPayments = payments.map(payment => {
    try {
      const decrypted = decryptTenant({ soDienThoai: payment.soDienThoai });
      return {
        ...payment,
        soDienThoai: decrypted.soDienThoai
      };
    } catch (e) {
      return payment; // Nếu lỗi giải mã, giữ nguyên
    }
  });

  // Lấy total count
  let countQuery = `SELECT COUNT(*) as total FROM Payment p 
                   JOIN Tenant t ON p.tenantId = t.id
                   WHERE 1=1`;
  const countParams = [];
  if (status) {
    countQuery += " AND p.status = ?";
    countParams.push(status);
  }
  if (paymentMethod) {
    countQuery += " AND p.paymentMethod = ?";
    countParams.push(paymentMethod);
  }
  if (startDate) {
    countQuery += " AND p.createdAt >= ?";
    countParams.push(startDate);
  }
  if (endDate) {
    countQuery += " AND p.createdAt <= ?";
    countParams.push(endDate);
  }

  const { total } = db.prepare(countQuery).get(...countParams) || { total: 0 };

  res.json({
    data: decryptedPayments,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Admin API: Lấy thống kê payments
 */
router.get("/stats", authRequired, (req, res) => {
  const user = req.user;
  if (user.role !== "MANAGER") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }

  const stats = db
    .prepare(
      `SELECT 
        COUNT(*) as totalPayments,
        SUM(CASE WHEN p.status = 'SUCCESS' THEN p.amount ELSE 0 END) as totalSuccessAmount,
        COUNT(CASE WHEN p.status = 'SUCCESS' THEN 1 END) as successCount,
        COUNT(CASE WHEN p.status = 'FAILED' THEN 1 END) as failedCount,
        COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pendingCount,
        p.paymentMethod
      FROM Payment p
      GROUP BY p.paymentMethod`
    )
    .all();

  res.json(stats);
});

/**
 * Admin/Tenant API: Lấy payments của hóa đơn cụ thể
 */
router.get("/invoice/:invoiceId", authRequired, (req, res) => {
  const user = req.user;
  const { invoiceId } = req.params;

  const invoice = db
    .prepare("SELECT * FROM Invoice WHERE id = ?")
    .get(invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  // Kiểm quyền: tenant chỉ xem payments của hóa đơn của họ
  if (user.role !== "MANAGER") {
    const tenant = db
      .prepare("SELECT * FROM Tenant WHERE userId = ?")
      .get(user.id);
    if (!tenant || tenant.id !== invoice.tenantId) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const payments = db
    .prepare(
      `SELECT p.*, t.hoTen as tenantName, t.soDienThoai FROM Payment p
       JOIN Tenant t ON p.tenantId = t.id
       WHERE p.invoiceId = ? 
       ORDER BY p.createdAt DESC`
    )
    .all(invoiceId);

  // Giải mã số điện thoại
  const decryptedPayments = payments.map(payment => {
    try {
      const decrypted = decryptTenant({ soDienThoai: payment.soDienThoai });
      return { ...payment, soDienThoai: decrypted.soDienThoai };
    } catch (e) {
      return payment;
    }
  });

  res.json({
    invoice: {
      id: invoice.id,
      amount: invoice.tongCong,
      dueDate: invoice.ky,
      status: invoice.status,
    },
    payments: decryptedPayments,
  });
});

/**
 * Tenant API: Lấy tất cả payments của tenant
 */
router.get("/tenant/me", authRequired, (req, res) => {
  const user = req.user;
  console.log("Authenticated user:", user);
  // Lấy tenant info
  const tenant = db
    .prepare("SELECT * FROM Tenant WHERE userId = ?")
    .get(user.userId);

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" });
  }

  const payments = db
    .prepare(
      `SELECT p.*, i.tongCong as invoiceAmount, i.ky, i.roomId, t.hoTen as tenantName, t.soDienThoai
       FROM Payment p
       JOIN Invoice i ON p.invoiceId = i.id
       JOIN Tenant t ON p.tenantId = t.id
       WHERE p.tenantId = ?
       ORDER BY p.createdAt DESC`
    )
    .all(tenant.id);

  // Giải mã số điện thoại
  const decryptedPayments = payments.map(payment => {
    try {
      const decrypted = decryptTenant({ soDienThoai: payment.soDienThoai });
      return { ...payment, soDienThoai: decrypted.soDienThoai };
    } catch (e) {
      return payment;
    }
  });

  res.json({
    tenant: {
      id: tenant.id,
      name: tenant.hoTen,
    },
    payments: decryptedPayments,
  });
});

/**
 * Admin API: Lấy payments của tenant cụ thể
 */
router.get("/tenant/:tenantId", authRequired, (req, res) => {
  const user = req.user;
  if (user.role !== "MANAGER") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }

  const { tenantId } = req.params;
  const { status, limit = 20, offset = 0 } = req.query;

  const tenant = db
    .prepare("SELECT * FROM Tenant WHERE id = ?")
    .get(tenantId);

  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" });
  }

  let query = `SELECT p.*, i.ky, i.roomId, i.tongCong as invoiceAmount FROM Payment p
               JOIN Invoice i ON p.invoiceId = i.id
               WHERE p.tenantId = ?`;
  const params = [tenantId];

  if (status) {
    query += " AND p.status = ?";
    params.push(status);
  }

  query += " ORDER BY p.createdAt DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  const payments = db.prepare(query).all(...params);

  // Get total count
  let countQuery = "SELECT COUNT(*) as total FROM Payment WHERE tenantId = ?";
  const countParams = [tenantId];
  if (status) {
    countQuery += " AND status = ?";
    countParams.push(status);
  }

  const { total } = db.prepare(countQuery).get(...countParams) || { total: 0 };

  // Giải mã số điện thoại tenant
  let decryptedPhone = tenant.soDienThoai;
  try {
    const decrypted = decryptTenant({ soDienThoai: tenant.soDienThoai });
    decryptedPhone = decrypted.soDienThoai;
  } catch (e) {
    // Keep original if decryption fails
  }

  res.json({
    tenant: {
      id: tenant.id,
      name: tenant.hoTen,
      soDienThoai: decryptedPhone,
    },
    payments,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Endpoint để app lấy chi tiết giao dịch sau khi redirect từ VNPay
 * App gọi khi user quay lại từ deep link
 */
router.get("/transaction/:transactionId", authRequired, (req, res) => {
  const { transactionId } = req.params;

  const payment = db
    .prepare("SELECT * FROM Payment WHERE transactionId = ?")
    .get(transactionId);

  if (!payment) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  const invoice = db
    .prepare("SELECT * FROM Invoice WHERE id = ?")
    .get(payment.invoiceId);

  return res.json({
    success: true,
    payment: {
      id: payment.id,
      invoiceId: payment.invoiceId,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      responseCode: payment.responseCode,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    },
    invoice: invoice
      ? {
          id: invoice.id,
          tongCong: invoice.tongCong,
          status: invoice.status,
          ky: invoice.ky,
          roomId: invoice.roomId,
        }
      : null,
  });
});

module.exports = router;
