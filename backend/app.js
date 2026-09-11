// ============================================================
// app.js — Cấu hình Express application
// Nhiệm vụ: đăng ký middleware và routes
// Tách khỏi server.js để có thể import app trong tests
// mà không cần thật sự start server (listen)
// ============================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth.routes');
const escrowRoutes = require('./routes/escrow.routes');

// Import error handler (phải đặt CUỐI CÙNG)
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// ==================== GLOBAL MIDDLEWARE ====================
// Middleware chạy với MỌI request, theo đúng thứ tự từ trên xuống dưới

// 1. helmet: tự động set các HTTP security headers
//    Ví dụ: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
//    Ngăn chặn các tấn công phổ biến như clickjacking, MIME sniffing
app.use(helmet());

// 2. cors: cho phép frontend (chạy ở port/domain khác) gọi API
//    Không có cors thì browser sẽ block request do Same-Origin Policy
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true, // Cho phép gửi cookies và Authorization header
  })
);

// 3. morgan: log mọi HTTP request ra console
//    Format 'dev': "GET /api/auth/login 200 15ms"
//    Rất hữu ích khi debug
app.use(morgan('dev'));

// 4. express.json(): parse body của request có Content-Type: application/json
//    Sau middleware này, req.body sẽ là object JavaScript
//    Không có middleware này thì req.body = undefined
app.use(express.json());

// 5. express.urlencoded: parse body dạng form HTML
//    extended: false dùng querystring library (đơn giản hơn, đủ dùng)
app.use(express.urlencoded({ extended: false }));

// ==================== ROUTES ====================
// Prefix /api/ là convention để phân biệt API endpoint với các route khác
app.use('/api/auth', authRoutes);      // → auth.routes.js xử lý
app.use('/api/escrows', escrowRoutes); // → escrow.routes.js xử lý

// Health check endpoint — dùng để kiểm tra server còn sống không
// Frontend, DevOps, monitoring tools hay gọi endpoint này
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLER ====================
// PHẢI đặt SAU TẤT CẢ routes
// Express nhận ra đây là error handler vì có 4 tham số: (err, req, res, next)
// Khi bất kỳ middleware/controller nào gọi next(error) hoặc throw error,
// Express sẽ nhảy thẳng tới đây, bỏ qua các middleware còn lại
app.use(errorMiddleware);

module.exports = app;
