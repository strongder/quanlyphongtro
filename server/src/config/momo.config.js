// module.exports = {
//   partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
//   accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
//   secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
//   endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
//   redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://192.168.5.41:3000/api/momo/return',
//   ipnUrl:  'https://coast-geek-multimedia-edges.trycloudflare.com/api/momo/callback', //process.env.MOMO_IPN_URL || 'http://192.168.5.41:5000/api/momo/callback',
//   requestType: 'payWithMethod',
//   partnerName: 'QuanLyPhongTro',
//   storeId: 'QuanLyPhongTroStore',
//   lang: 'vi',
//   autoCapture: true
// };



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

module.exports = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  endpoint: process.env.MOMO_ENDPOINT,
  redirectUrl: `${process.env.DOMAIN}/api/momo/return`,
  ipnUrl: `${process.env.DOMAIN}/api/momo/callback`,
  requestType: 'payWithMethod',
  partnerName: 'QuanLyPhongTro',
  storeId: 'QuanLyPhongTroStore',
  lang: 'vi',
  autoCapture: true,
  baseReturn: `${process.env.DOMAIN}/momo-return`
};

