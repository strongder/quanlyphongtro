import rateLimit from "express-rate-limit";

// giới hạn cho tất cả các route
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,     // 1 phút
    max: 100,                // giới hạn mỗi IP 100 yêu cầu mỗi windowMs
    message: {
      status: 429,
      error: "Quá nhiều yêu cầu từ IP này. Vui lòng thử lại sau."
    },
    standardHeaders: true,   // Gửi thông tin giới hạn trong header `RateLimit-*`
    legacyHeaders: false,    // Tắt header `X-RateLimit-*`
});
// Giới hạn cho /login
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 phút
  max: 5,                  // tối đa 5 lần thử
  message: {
    status: 429,
    error: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 1 phút."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// giới hạn cho otp
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 3,                  // tối đa 3 yêu cầu
    message: {
        status: 429,
        error: "Bạn đã yêu cầu OTP quá nhiều lần. Vui lòng thử lại sau 5 phút."
    },
  standardHeaders: true,
  legacyHeaders: false,
});