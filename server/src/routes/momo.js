const express = require("express");
const crypto = require("crypto");
const https = require("https");
const momoConfig = require("../config/momo.config");
const { db } = require("../db");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

// Helper: Tạo HMAC SHA256 signature cho MoMo
function createSignature(rawSignature) {
  return crypto
    .createHmac("sha256", momoConfig.secretKey)
    .update(rawSignature)
    .digest("hex");
}

// Tạo link thanh toán MoMo
router.post("/create", authRequired, (req, res) => {
  const { invoiceId } = req.body;

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

  // Tạo orderId và requestId
  const orderId = momoConfig.partnerCode + new Date().getTime();
  const requestId = orderId;
  const amount = Math.round(invoice.tongCong).toString();
  const orderInfo = `Invoice_${invoiceId}_Room${invoice.roomId}_Ky${invoice.ky}`;
  const extraData = "";
  const orderGroupId = "";

  // Tạo raw signature theo format của MoMo
  const rawSignature =
    "accessKey=" + momoConfig.accessKey +
    "&amount=" + amount +
    "&extraData=" + extraData +
    "&ipnUrl=" + momoConfig.ipnUrl +
    "&orderId=" + orderId +
    "&orderInfo=" + orderInfo +
    "&partnerCode=" + momoConfig.partnerCode +
    "&redirectUrl=" + momoConfig.redirectUrl +
    "&requestId=" + requestId +
    "&requestType=" + momoConfig.requestType;

  const signature = createSignature(rawSignature);

  // Request body gửi đến MoMo
  const requestBody = JSON.stringify({
    partnerCode: momoConfig.partnerCode,
    partnerName: momoConfig.partnerName,
    storeId: momoConfig.storeId,
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    lang: momoConfig.lang,
    requestType: momoConfig.requestType,
    autoCapture: momoConfig.autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });

  const options = {
    hostname: "test-payment.momo.vn",
    port: 443,
    path: "/v2/gateway/api/create",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };

  // Gửi request đến MoMo
  const momoReq = https.request(options, (momoRes) => {
    let data = "";

    momoRes.on("data", (chunk) => {
      data += chunk;
    });

    momoRes.on("end", () => {
      try {
        const response = JSON.parse(data);
        
        if (response.resultCode === 0) {
          return res.json({
            code: "00",
            message: "Payment URL created successfully",
            orderId: orderId,
            paymentUrl: response.payUrl,
            deeplink: response.deeplink,
            qrCodeUrl: response.qrCodeUrl,
          });
        } else {
          return res.status(400).json({
            error: "MoMo error",
            resultCode: response.resultCode,
            message: response.message,
          });
        }
      } catch (err) {
        console.error("Parse MoMo response error:", err);
        return res.status(500).json({ error: "Failed to parse MoMo response" });
      }
    });
  });

  momoReq.on("error", (e) => {
    console.error("MoMo request error:", e);
    return res.status(500).json({ error: "Failed to connect to MoMo" });
  });

  momoReq.write(requestBody);
  momoReq.end();
});

// Kiểm tra trạng thái thanh toán MoMo
router.get("/status/:invoiceId", authRequired, (req, res) => {
  const { invoiceId } = req.params;

  const invoice = db
    .prepare("SELECT * FROM Invoice WHERE id = ?")
    .get(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  const payment = db
    .prepare(
      "SELECT * FROM Payment WHERE invoiceId = ? AND paymentMethod = 'MOMO' ORDER BY createdAt DESC LIMIT 1"
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
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
        }
      : null,
  });
});


// // Callback từ MoMo (IPN - Instant Payment Notification)
// router.post("/callback", (req, res) => {
//   const {
//     partnerCode,
//     orderId,
//     requestId,
//     amount,
//     orderInfo,
//     orderType,
//     transId,
//     resultCode,
//     message,
//     payType,
//     responseTime,
//     extraData,
//     signature,
//   } = req.body;

//   // Verify signature
//   const rawSignature =
//     "accessKey=" + momoConfig.accessKey +
//     "&amount=" + amount +
//     "&extraData=" + extraData +
//     "&message=" + message +
//     "&orderId=" + orderId +
//     "&orderInfo=" + orderInfo +
//     "&orderType=" + orderType +
//     "&partnerCode=" + partnerCode +
//     "&payType=" + payType +
//     "&requestId=" + requestId +
//     "&responseTime=" + responseTime +
//     "&resultCode=" + resultCode +
//     "&transId=" + transId;

//   const expectedSignature = createSignature(rawSignature);

//   if (signature !== expectedSignature) {
//     console.error("Invalid MoMo signature");
//     return res.status(400).json({ error: "Invalid signature" });
//   }

//   // Extract invoiceId from orderInfo
//   const invoiceId = extractInvoiceId(orderInfo);

//   try {
//     if (!invoiceId) {
//       console.error("No invoice ID in orderInfo:", orderInfo);
//       return res.status(400).json({ error: "Invalid orderInfo" });
//     }

//     const invoice = db.prepare("SELECT * FROM Invoice WHERE id = ?").get(invoiceId);
//     if (!invoice) {
//       console.error("Invoice not found:", invoiceId);
//       return res.status(404).json({ error: "Invoice not found" });
//     }

//     let paymentStatus = "FAILED";
//     if (resultCode === 0) paymentStatus = "SUCCESS";
//     else if (resultCode === 1006) paymentStatus = "CANCELLED";

//     const existingPayment = db
//       .prepare("SELECT * FROM Payment WHERE transactionId = ?")
//       .get(orderId);

//     if (existingPayment) {
//       db.prepare(
//         `UPDATE Payment SET status = ?, responseCode = ?, paidAt = datetime('now') WHERE transactionId = ?`
//       ).run(paymentStatus, resultCode.toString(), orderId);
//     } else {
//       db.prepare(
//         `INSERT INTO Payment (invoiceId, tenantId, transactionId, amount, status, responseCode, paymentMethod, paidAt) VALUES (?, ?, ?, ?, ?, ?, 'MOMO', datetime('now'))`
//       ).run(invoiceId, invoice.tenantId, orderId, parseFloat(amount), paymentStatus, resultCode.toString());
//     }

//     if (paymentStatus === "SUCCESS") {
//       db.prepare(`UPDATE Invoice SET status = 'PAID', paidAt = datetime('now') WHERE id = ?`).run(invoiceId);
//     }

//     return res.status(200).json({ message: "Callback processed" });
//   } catch (err) {
//     console.error("MoMo callback error:", err);
//     return res.status(500).json({ error: "Server error" });
//   }
// });

// Redirect từ MoMo (sau khi user thanh toán)
router.get("/return", (req, res) => {
  const {
    partnerCode,
    orderId,
    requestId,
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature,
  } = req.query;

  // Verify signature
  const rawSignature =
    "accessKey=" + momoConfig.accessKey +
    "&amount=" + amount +
    "&extraData=" + extraData +
    "&message=" + message +
    "&orderId=" + orderId +
    "&orderInfo=" + orderInfo +
    "&orderType=" + orderType +
    "&partnerCode=" + partnerCode +
    "&payType=" + payType +
    "&requestId=" + requestId +
    "&responseTime=" + responseTime +
    "&resultCode=" + resultCode +
    "&transId=" + transId;

  const expectedSignature = createSignature(rawSignature);

  const RETURN_BASE = "http://192.168.5.41:3000/momo-return";
  const buildReturn = (status, code = "", invoiceId = "") =>
    `${RETURN_BASE}?status=${status}&resultCode=${code}&invoiceId=${invoiceId}`;

  if (signature !== expectedSignature) {
    return res.redirect(buildReturn("failed", "INVALID_SIGNATURE"));
  }

  const invoiceId = extractInvoiceId(orderInfo);

  try {
    if (!invoiceId) return res.redirect(buildReturn("failed", "NO_INVOICE"));

    const invoice = db.prepare("SELECT * FROM Invoice WHERE id = ?").get(invoiceId);
    if (!invoice) return res.redirect(buildReturn("failed", "INVOICE_NOT_FOUND"));

    let paymentStatus = "FAILED";
    if (resultCode === "0") paymentStatus = "SUCCESS";
    else if (resultCode === "1006") paymentStatus = "CANCELLED";

    const existingPayment = db
      .prepare("SELECT * FROM Payment WHERE transactionId = ?")
      .get(orderId);

    if (existingPayment) {
      db.prepare(
        `UPDATE Payment SET status = ?, responseCode = ?, paidAt = datetime('now') WHERE transactionId = ?`
      ).run(paymentStatus, resultCode, orderId);
    } else {
      db.prepare(
        `INSERT INTO Payment (invoiceId, tenantId, transactionId, amount, status, responseCode, paymentMethod, paidAt) VALUES (?, ?, ?, ?, ?, ?, 'MOMO', datetime('now'))`
      ).run(invoiceId, invoice.tenantId, orderId, parseFloat(amount), paymentStatus, resultCode);
    }

    if (paymentStatus === "SUCCESS") {
      db.prepare(`UPDATE Invoice SET status = 'PAID', paidAt = datetime('now') WHERE id = ?`).run(invoiceId);
      return res.redirect(buildReturn("success", resultCode, invoiceId));
    }
    if (paymentStatus === "CANCELLED") {
      return res.redirect(buildReturn("cancelled", resultCode, invoiceId));
    }
    return res.redirect(buildReturn("failed", resultCode, invoiceId));
  } catch (err) {
    console.error("MoMo return error:", err);
    return res.redirect(buildReturn("failed", "SERVER_ERROR"));
  }
});

function extractInvoiceId(orderInfo) {
  if (!orderInfo) return NaN;
  const parts = orderInfo.split("_");
  if (parts.length < 2) return NaN;
  return parseInt(parts[1], 10);
}

module.exports = router;
