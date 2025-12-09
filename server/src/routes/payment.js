const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");
const vnpConfig = require("../config/vnpay.config");
const { db } = require("../db");
const { authRequired } = require("../middlewares/auth");
const app = require("../app");

const router = express.Router();

// Helper: VNPay requires keys sorted and values URL-encoded with + for spaces
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    });
  return sorted;
}

function buildSecureHash(params) {
  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const secureHash = crypto
    .createHmac("sha512", vnpConfig.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
  return { sortedParams, secureHash };
}

function extractInvoiceId(orderInfo) {
  if (!orderInfo) return NaN;
  const parts = orderInfo.split("_");
  if (parts.length < 2) return NaN;
  return parseInt(parts[1], 10);
}

// Tạo link thanh toán VNPay
router.post("/vnpay/create", authRequired, (req, res) => {
  const { invoiceId, bankCode } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: "invoiceId required" });
  }

  // Lấy thông tin hóa đơn
  const invoice = db
    .prepare("SELECT * FROM Invoice WHERE id = ?")
    .get(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  if (invoice.status === "PAID") {
    return res.status(400).json({ error: "Invoice already paid" });
  }

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress;

  // Tạo transactionId (8 số ngẫu nhiên như Java)
  const transactionId = Math.floor(
    10000000 + Math.random() * 90000000
  ).toString();

  const createDate = moment().format("YYYYMMDDHHmmss");
  const expireDate = moment().add(15, "minutes").format("YYYYMMDDHHmmss");

  let vnp_Params = {
    vnp_Version: vnpConfig.vnp_Version,
    vnp_Command: vnpConfig.vnp_Command,
    vnp_TmnCode: vnpConfig.vnp_TmnCode,
    vnp_Amount: Math.round(invoice.tongCong * 100), // VNPay yêu cầu nhân 100
    vnp_CurrCode: "VND",
    vnp_TxnRef: transactionId,
    vnp_OrderInfo: `Invoice_${invoiceId}_Room${invoice.roomId}_Ky${invoice.ky}`,
    vnp_OrderType: vnpConfig.vnp_OrderType,
    vnp_ReturnUrl: vnpConfig.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
    vnp_Locale: "vn",
  };

  if (bankCode) {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  const { sortedParams, secureHash } = buildSecureHash(vnp_Params);
  const signedParams = { ...sortedParams, vnp_SecureHash: secureHash };

  const paymentUrl =
    vnpConfig.vnp_Url + "?" + qs.stringify(signedParams, { encode: false });

  return res.json({
    code: "00",
    message: "Payment URL created successfully",
    transactionId,
    paymentUrl,
  });
});


// Kiểm tra trạng thái thanh toán
router.get("/vnpay/status/:invoiceId", authRequired, (req, res) => {
  const { invoiceId } = req.params;

  const invoice = db
    .prepare("SELECT * FROM Invoice WHERE id = ?")
    .get(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const payment = db
    .prepare(
      "SELECT * FROM Payment WHERE invoiceId = ? ORDER BY createdAt DESC LIMIT 1"
    )
    .get(invoiceId);

  return res.json({
    success: true,
    invoiceId,
    invoiceStatus: invoice.status,
    tongCong: invoice.tongCong,
    ky: invoice.ky,
    roomId: invoice.roomId,
    payment: payment
      ? {
          id: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.status,
          responseCode: payment.responseCode,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        }
      : null,
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

router.get('/vnpay/callback', (req, res) => {
  const vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const { sortedParams } = buildSecureHash(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto.createHmac('sha512', vnpConfig.vnp_HashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const RETURN_BASE = 'http://192.168.5.41:3000/vnpay-return'; // URL tĩnh để WebView bắt
  const buildReturn = (status, code = '', invoiceId = '') =>
    `${RETURN_BASE}?status=${status}&vnp_ResponseCode=${code}&invoiceId=${invoiceId}`;

  if (secureHash !== signed) {
    return res.redirect(buildReturn('failed', 'INVALID_SIGNATURE'));
  }

  const transactionId = vnp_Params.vnp_TxnRef;
  const responseCode = vnp_Params.vnp_ResponseCode;
  const invoiceId = extractInvoiceId(vnp_Params.vnp_OrderInfo);

  try {
    if (!invoiceId) return res.redirect(buildReturn('failed', 'NO_INVOICE'));

    const invoice = db.prepare('SELECT * FROM Invoice WHERE id = ?').get(invoiceId);
    if (!invoice) return res.redirect(buildReturn('failed', 'INVOICE_NOT_FOUND'));

    let paymentStatus = 'FAILED';
    if (responseCode === '00') paymentStatus = 'SUCCESS';
    else if (responseCode === '24') paymentStatus = 'CANCELLED';

    const existingPayment = db.prepare('SELECT * FROM Payment WHERE transactionId = ?').get(transactionId);
    if (existingPayment) {
      db.prepare(
        `UPDATE Payment SET status = ?, responseCode = ?, paidAt = datetime('now') WHERE transactionId = ?`
      ).run(paymentStatus, responseCode, transactionId);
    } else {
      db.prepare(
        `INSERT INTO Payment (invoiceId, transactionId, amount, status, responseCode, paidAt) VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).run(invoiceId, transactionId, vnp_Params.vnp_Amount / 100, paymentStatus, responseCode);
    }

    if (paymentStatus === 'SUCCESS') {
      db.prepare(`UPDATE Invoice SET status = 'PAID', paidAt = datetime('now') WHERE id = ?`).run(invoiceId);
      return res.redirect(buildReturn('success', responseCode, invoiceId));
    }
    if (paymentStatus === 'CANCELLED') {
      return res.redirect(buildReturn('cancelled', responseCode, invoiceId));
    }
    return res.redirect(buildReturn('failed', responseCode, invoiceId));
  } catch (err) {
    console.error('Callback error:', err);
    return res.redirect(buildReturn('failed', 'SERVER_ERROR'));
  }
});



module.exports = router;
