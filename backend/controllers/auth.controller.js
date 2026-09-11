// ============================================================
// controllers/auth.controller.js — Xử lý authentication
//
// Controller nhận req, xử lý business logic, trả về res
// ============================================================

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// ==================== POST /api/auth/register ====================
/**
 * Đăng ký tài khoản mới
 * Body: { name, email, password, role? }
 * Response: { success, token, user }
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Kiểm tra email đã tồn tại chưa
  // Mặc dù schema có unique: true nhưng lỗi duplicate key từ Mongoose
  // không có message thân thiện → check trước để trả lỗi rõ ràng hơn
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400); // Set status trước khi throw để error middleware dùng
    throw new Error('Email is already registered');
  }

  // Tạo user mới — password sẽ được hash tự động qua pre('save') hook
  const user = await User.create({ name, email, password, role });

  // Trả về token ngay sau khi đăng ký
  // User không cần login lại → trải nghiệm tốt hơn
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // KHÔNG trả về password (dù đã hash)
    },
  });
});

// ==================== POST /api/auth/login ====================
/**
 * Đăng nhập
 * Body: { email, password }
 * Response: { success, token, user }
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Tìm user theo email, cần lấy thêm password để so sánh
  // .select('+password'): override select: false trong schema
  // Dấu '+' nghĩa là "thêm field này vào kết quả"
  const user = await User.findOne({ email }).select('+password');

  // Kiểm tra user tồn tại VÀ password đúng trong cùng 1 điều kiện
  // Tại sao? Bảo mật: không muốn tiết lộ "email không tồn tại" hay "sai password"
  // Attacker biết email tồn tại → có thể brute force password
  // Thông báo chung chung: "Invalid credentials" → an toàn hơn
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    },
  });
});

// ==================== GET /api/auth/me ====================
/**
 * Lấy thông tin user đang đăng nhập
 * Header: Authorization: Bearer <token>
 * Response: { success, user }
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user đã được gán bởi protect middleware
  // Không cần query DB lại vì protect đã query rồi
  res.json({
    success: true,
    user: req.user,
  });
});

// ==================== PATCH /api/auth/wallet ====================
/**
 * Cập nhật wallet address cho user
 * Body: { walletAddress }
 * Response: { success, user }
 */
const updateWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    res.status(400);
    throw new Error('Wallet address is required');
  }

  // Validate format Ethereum address (bắt đầu bằng 0x, 42 ký tự)
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(walletAddress)) {
    res.status(400);
    throw new Error('Invalid Ethereum wallet address format');
  }

  // findByIdAndUpdate: tìm và cập nhật trong 1 query
  // { new: true }: trả về document SAU KHI update, không phải trước
  // { runValidators: true }: chạy schema validators khi update
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { walletAddress: walletAddress.toLowerCase() },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    },
  });
});

module.exports = { register, login, getMe, updateWallet };
