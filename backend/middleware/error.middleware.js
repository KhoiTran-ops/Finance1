// ============================================================
// middleware/error.middleware.js — Global error handler
//
// Express nhận ra đây là error handling middleware vì có 4 tham số
// Đặt CUỐI CÙNG trong app.js, sau tất cả routes
//
// Khi nào được gọi?
// 1. Controller throw error (asyncHandler bắt rồi gọi next(error))
// 2. Middleware gọi next(error) trực tiếp
// ============================================================

const errorMiddleware = (err, req, res, next) => {
  // Lấy statusCode từ response nếu đã set, không thì dùng 500
  // Controller thường set res.status(400) trước khi throw error
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // ---- Xử lý các Mongoose errors phổ biến ----

  // CastError: truyền sai kiểu dữ liệu vào query
  // Ví dụ: GET /api/escrows/invalid-id (không phải ObjectId hợp lệ)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // Duplicate key: vi phạm unique constraint
  // Ví dụ: đăng ký email đã tồn tại
  // err.code === 11000 là MongoDB error code cho duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value: '${err.keyValue[field]}' for field '${field}'`;
  }

  // ValidationError: dữ liệu không pass schema validation của Mongoose
  // Ví dụ: bỏ trống required field, sai enum value
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Gộp tất cả lỗi validation thành một string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // JsonWebTokenError: token không hợp lệ (bị giả mạo, sai secret)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // TokenExpiredError: token đã hết hạn
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired, please login again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Chỉ trả về stack trace trong môi trường development
    // Production không nên expose stack trace vì lộ thông tin nội bộ
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
