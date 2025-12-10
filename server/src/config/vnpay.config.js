module.exports = {
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_TmnCode: "J0U1HNEO",
  vnp_HashSecret: "ZXRMXXYP7GC4P5M7O40KC13PT69C2BL6",
  vnp_ReturnUrl: "http://192.168.5.41:3000/api/vnpay/callback",
  appScheme: "quanlyphongtro://", // Separate app scheme (not in ReturnUrl)
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_OrderType: "other"
};


// PORT=3000
// SERVER_IP=192.168.1.100 # Thay đổi thành IP của máy chủ nếu cần
// DOMAIN=https://adsf.cloudflaretunrer.com         # Thay ip thành domain nếu có ví dụ: http://mydomain.com

// JWT_SECRET=0884c20a9dfa6dbeb02c743a37c91e4e
// ENCRYPTION_KEY=b5c9e1fe28218006b93fa4ea398430562c851841aba92cb9bc681799dd365865

// # VNPay Configuration (Sandbox)
// # VNPAY_TMN_CODE=J0U1HNEO
// # VNPAY_HASH_SECRET=002IHFWBH304CSXDEE7TZQ7QNJAJJ48J
// VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
// VNPAY_RETURN_URL=http://192.168.5.41:5000/api/payment/vnpay/callback

// # MoMo Configuration (Sandbox)
// MOMO_PARTNER_CODE=MOMO
// MOMO_ACCESS_KEY=F8BBA842ECF85
// MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
// MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
// MOMO_REDIRECT_URL=http://192.168.5.41:3000/api/momo/return
// MOMO_IPN_URL=http://192.168.5.41:5000/api/api/momo/callback