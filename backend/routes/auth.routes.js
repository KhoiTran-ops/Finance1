// ============================================================
// routes/auth.routes.js — Định nghĩa các auth endpoints
//
// Router là mini Express app chỉ xử lý routes
// Được mount vào app.js với prefix /api/auth
// Kết quả: GET /api/auth/me, POST /api/auth/login, ...
// ============================================================

const express = require('express');
const { register, login, getMe, updateWallet } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes — không cần đăng nhập
router.post('/register', register);
router.post('/login', login);

// Protected routes — cần JWT token hợp lệ
// protect chạy trước, nếu pass thì chạy controller
router.get('/me', protect, getMe);
router.patch('/wallet', protect, updateWallet);

module.exports = router;
