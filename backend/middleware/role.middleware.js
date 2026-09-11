// ============================================================
// middleware/role.middleware.js — Phân quyền theo role
//
// Dùng SAU protect middleware (cần req.user đã được set)
// Cho phép truyền vào nhiều roles được phép truy cập
//
// Ví dụ dùng:
//   router.delete('/:id', protect, authorize('admin'), deleteEscrow)
//   router.post('/', protect, authorize('client', 'admin'), createEscrow)
// ============================================================

/**
 * Middleware kiểm tra role của user
 * @param {...string} roles - Danh sách roles được phép truy cập
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  // Trả về middleware function — đây là closure
  // roles được "capture" và dùng được bên trong hàm trả về
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // 403 Forbidden: khác với 401 Unauthorized
      // 401 = chưa xác thực (không có token)
      // 403 = đã xác thực nhưng không có quyền
      return next(
        Object.assign(new Error(`Role '${req.user.role}' is not authorized to access this route`), {
          statusCode: 403,
        })
      );
    }
    next();
  };
};

module.exports = { authorize };
