const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const qs = require("qs");
const vnpConfig = require("../config/vnpay.config");
const { db } = require("../db");
const { authRequired } = require("../middlewares/auth");

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

// VNPay callback (IPN)
// VNPay callback (redirect từ web)
router.get("/vnpay/callback", (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params.vnp_SecureHash;

  // Xóa các trường không cần hash
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  // Tạo chữ ký lại
  const { sortedParams } = buildSecureHash(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac("sha512", vnpConfig.vnp_HashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  if (secureHash !== signed) {
    console.error("Invalid signature:", { secureHash, signed, signData });
    return res.send(`
      <html>
        <head><title>Thanh toán thất bại</title></head>
        <body style="font-family: Arial; text-align:center; padding:40px;">
          <h1>❌ Lỗi xác thực chữ ký</h1>
          <p>Không thể xác minh giao dịch.</p>
          <a href="quanlyphongtro://payment-failed">← Quay lại ứng dụng</a>
        </body>
      </html>
    `);
  }

  const transactionId = vnp_Params.vnp_TxnRef;
  const responseCode = vnp_Params.vnp_ResponseCode;

  try {
    let paymentStatus = "FAILED";
    if (responseCode === "00") paymentStatus = "SUCCESS";
    else if (responseCode === "24") paymentStatus = "CANCELLED";

    const invoiceId = extractInvoiceId(vnp_Params.vnp_OrderInfo);
    if (!invoiceId) {
      return res.send(`
        <html>
          <head><title>Thanh toán thất bại</title></head>
          <body style="font-family: Arial; text-align:center; padding:40px;">
            <h1>❌ Không tìm thấy hóa đơn</h1>
            <a href="quanlyphongtro://payment-failed">← Quay lại ứng dụng</a>
          </body>
        </html>
      `);
    }

    const invoice = db
      .prepare("SELECT * FROM Invoice WHERE id = ?")
      .get(invoiceId);
    if (!invoice) {
      return res.send(`
        <html>
          <head><title>Thanh toán thất bại</title></head>
          <body style="font-family: Arial; text-align:center; padding:40px;">
            <h1>❌ Hóa đơn không tồn tại</h1>
            <a href="quanlyphongtro://payment-failed">← Quay lại ứng dụng</a>
          </body>
        </html>
      `);
    }

    // Nếu đã thanh toán rồi
    if (invoice.status === "PAID") {
      return res.send(`
        <html>
          <head><title>Đã thanh toán</title></head>
          <body style="font-family: Arial; text-align:center; padding:40px;">
            <h1>✅ Hóa đơn đã thanh toán</h1>
            <a href="quanlyphongtro://payment-success?invoiceId=${invoiceId}">← Quay lại ứng dụng</a>
          </body>
        </html>
      `);
    }

    // Lưu giao dịch
    const existingPayment = db
      .prepare("SELECT * FROM Payment WHERE transactionId = ?")
      .get(transactionId);
    if (existingPayment) {
      db.prepare(
        `
        UPDATE Payment SET status = ?, responseCode = ?, paidAt = datetime('now')
        WHERE transactionId = ?
      `
      ).run(paymentStatus, responseCode, transactionId);
    } else {
      db.prepare(
        `
        INSERT INTO Payment (invoiceId, transactionId, amount, status, responseCode, paidAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `
      ).run(
        invoiceId,
        transactionId,
        vnp_Params.vnp_Amount / 100,
        paymentStatus,
        responseCode
      );
    }

    if (paymentStatus === "SUCCESS") {
      db.prepare(
        `
        UPDATE Invoice SET status = 'PAID', paidAt = datetime('now')
        WHERE id = ?
      `
      ).run(invoiceId);
      const deepLink = `quanlyphongtro://payment-callback?invoiceId=${invoiceId}&responseCode=${responseCode}`;
      return res.send(`
        <html>
          <head><title>Thanh toán thành công</title></head>
          <body style="font-family: Arial; text-align:center; padding:40px;">
            <h1>✅ Thanh toán thành công</h1>
            <p>Mã hóa đơn: ${invoiceId}</p>
            <p>Số tiền: ${(vnp_Params.vnp_Amount / 100).toLocaleString(
              "vi-VN"
            )} VND</p>
            <script>
        setTimeout(() => {
          window.location.href = '${deepLink}';
        }, 2000);
      </script>
      <p><a href="${deepLink}">Nhấn vào đây nếu không tự động chuyển</a></p>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head><title>Thanh toán thất bại</title></head>
          <body style="font-family: Arial; text-align:center; padding:40px;">
            <h1>❌ Thanh toán thất bại</h1>
            <p>Mã lỗi: ${responseCode}</p>
            <a href="quanlyphongtro://payment-failed">← Quay lại ứng dụng</a>
          </body>
        </html>
      `);
    }
  } catch (e) {
    console.error("Callback error:", e);
    return res.send(`
      <html>
        <head><title>Lỗi hệ thống</title></head>
        <body style="font-family: Arial; text-align:center; padding:40px;">
          <h1>❌ Lỗi hệ thống</h1>
          <p>${e.message}</p>
          <a href="quanlyphongtro://payment-failed">← Quay lại ứng dụng</a>
        </body>
      </html>
    `);
  }
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
    invoiceId,
    invoiceStatus: invoice.status,
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

module.exports = router;
