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

