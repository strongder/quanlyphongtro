const { baseReturn } = require("./momo.config");

module.exports = {
  vnp_Url: process.env.VNPAY_URL,
  vnp_TmnCode: process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'ZXRMXXYP7GC4P5M7O40KC13PT69C2BL6',
  vnp_ReturnUrl: `${process.env.DOMAIN}/api/vnpay/callback`,
  appScheme: "quanlyphongtro://", // Separate app scheme (not in ReturnUrl)
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_OrderType: "other",
  baseReturn: `${process.env.DOMAIN}/vnpay-return`
};




// # thay doi moi khi chay
// DOMAIN=https://bouquet-mine-buffalo-choir.trycloudflare.com

// JWT_SECRET=0884c20a9dfa6dbeb02c743a37c91e4e
// ENCRYPTION_KEY=b5c9e1fe28218006b93fa4ea398430562c851841aba92cb9bc681799dd365865

// # VNPay Configuration (Sandbox)
// VNPAY_TMN_CODE=J0U1HNEO
// VNPAY_HASH_SECRET=ZXRMXXYP7GC4P5M7O40KC13PT69C2BL6
// VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html


// # MoMo Configuration (Sandbox)
// MOMO_PARTNER_CODE=MOMO
// MOMO_ACCESS_KEY=F8BBA842ECF85
// MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
// MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
