// ============================================================
// middleware/auth.middleware.js — Xác thực JWT token
//
// Middleware này bảo vệ các routes cần đăng nhập
// Luồng: Request → auth.middleware → controller
// Nếu token hợp lệ: gán req.user và gọi next()
// Nếu không hợp lệ: throw error → error middleware trả 401
// ============================================================

const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Middleware bảo vệ route — yêu cầu JWT token hợp lệ
 * Dùng: router.get('/me', protect, controller)
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Token được gửi trong header: "Authorization: Bearer eyJhbGci..."
  // Optional chaining (?.) để tránh lỗi nếu header không tồn tại
  if (req.headers.authorization?.startsWith('Bearer')) {
    // Split 'Bearer eyJhbGci...' thành ['Bearer', 'eyJhbGci...']
    // Lấy phần từ index 1 là token thực sự
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401); // 401 = Unauthorized (chưa xác thực)
    throw new Error('Not authorized, no token provided');
  }

  // jwt.verify() vừa decode vừa kiểm tra signature và expiry
  // Nếu token giả hoặc hết hạn → throw JsonWebTokenError → asyncHandler bắt → next(error)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // decoded = { id: 'userId', iat: 1234567890, exp: 1234567890 }

  // Query DB để lấy thông tin user mới nhất
  // Tại sao không chỉ dùng decoded.id? Vì user có thể đã bị xóa hoặc bị ban sau khi token được cấp
  // select('-password'): loại bỏ field password khỏi kết quả
  req.user = await User.findById(decoded.id).select('-password');

  if (!req.user) {
    res.status(401);
    throw new Error('User belonging to this token no longer exists');
  }

  // Gọi next() để chuyển sang middleware/controller tiếp theo
  next();
});

module.exports = { protect };
