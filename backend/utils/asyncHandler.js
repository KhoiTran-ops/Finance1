// ============================================================
// utils/asyncHandler.js — Wrapper để xử lý lỗi async/await
//
// VẤN ĐỀ: Express không tự bắt lỗi từ async functions
// Nếu không có asyncHandler, mỗi controller phải viết:
//   try { ... } catch(error) { next(error) }
//
// VỚI asyncHandler, chỉ cần:
//   const doSomething = asyncHandler(async (req, res) => {
//     // throw error ở đây sẽ tự được bắt và chuyển tới error middleware
//   });
// ============================================================

/**
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Promise.resolve() bọc fn() để đảm bảo luôn là Promise
  // dù fn() có phải async function hay không
  // .catch(next) = nếu Promise reject, gọi next(error)
  // next(error) sẽ trigger error middleware trong app.js
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
