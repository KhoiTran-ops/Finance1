// ============================================================
// utils/generateToken.js — Tạo JWT token
//
// JWT (JSON Web Token) là chuỗi mã hóa gồm 3 phần: header.payload.signature
// Payload chứa thông tin user (id), server dùng để xác thực mà không cần query DB mỗi request
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token từ user ID
 * @param {string} userId - MongoDB ObjectId của user
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    // Payload: thông tin được mã hóa trong token
    // Chỉ lưu id, KHÔNG lưu password hay sensitive data
    // Lý do: payload có thể bị decode (chỉ cần base64 decode), chỉ signature là bí mật
    { id: userId },

    // Secret key từ .env — dùng để ký và verify token
    // Ai có secret này mới tạo được token hợp lệ
    process.env.JWT_SECRET,

    // Options
    {
      expiresIn: process.env.JWT_EXPIRE || '7d', // Token hết hạn sau 7 ngày
    }
  );
};

module.exports = generateToken;
