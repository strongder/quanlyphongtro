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
