// ============================================================
// models/User.js — Schema và Model cho User
//
// Mongoose Schema định nghĩa cấu trúc document trong MongoDB collection
// Model là class để tương tác với collection (CRUD operations)
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    // ---- Thông tin cơ bản ----
    name: {
      type: String,
      required: [true, 'Name is required'], // [type, error message]
      trim: true, // Tự động xóa khoảng trắng đầu/cuối trước khi lưu
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,     // Tạo unique index trong MongoDB
      lowercase: true,  // Tự động convert sang lowercase trước khi lưu
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      // select: false — QUAN TRỌNG!
      // Mặc định khi query User, password KHÔNG được trả về
      // Phải dùng .select('+password') nếu cần (chỉ khi login)
      // Bảo vệ password khỏi bị lộ ra ngoài vô tình
    },

    // ---- Role & Phân quyền ----
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES), // ['client', 'freelancer', 'admin']
        message: 'Role must be client, freelancer or admin',
      },
      default: USER_ROLES.CLIENT, // Mặc định là client khi đăng ký
    },

    // ---- Blockchain ----
    walletAddress: {
      type: String,
      lowercase: true, // Ethereum addresses nên lưu lowercase để so sánh nhất quán
      sparse: true,    // sparse index: cho phép null/undefined, nhưng nếu có giá trị thì phải unique
      unique: true,    // Không có 2 user dùng chung 1 wallet
    },
  },
  {
    // timestamps: true tự động thêm 2 fields:
    // createdAt: thời điểm document được tạo
    // updatedAt: thời điểm document được cập nhật lần cuối
    timestamps: true,
  }
);

// ==================== MIDDLEWARE (HOOKS) ====================

// pre('save'): chạy TRƯỚC KHI document được lưu vào MongoDB
// Áp dụng cho cả tạo mới (create) và cập nhật (save)
// PHẢI dùng function thường (không dùng arrow function)
// Lý do: arrow function không có 'this', còn ở đây 'this' trỏ đến document đang được lưu
userSchema.pre('save', async function () {
  // isModified('password'): kiểm tra xem field password có bị thay đổi không
  // Tại sao cần check? Vì pre('save') chạy mỗi lần gọi .save()
  // Ví dụ: nếu user update name, không nên hash lại password
  // Nếu không check: password đã hash sẽ bị hash tiếp → không bao giờ login được
  if (!this.isModified('password')) return;

  // genSalt(12): tạo salt với 12 rounds
  // Salt là chuỗi ngẫu nhiên thêm vào password trước khi hash
  // Mục đích: cùng password sẽ cho hash khác nhau mỗi lần → chống rainbow table attack
  // 12 rounds: cân bằng giữa security (cao hơn = khó crack hơn) và performance (cao hơn = chậm hơn)
  // 12 rounds ≈ 250ms → đủ chậm để brute force khó, đủ nhanh cho user
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ==================== INSTANCE METHODS ====================

// comparePassword: method được gọi trên một user instance cụ thể
// Ví dụ: const isMatch = await user.comparePassword('mypassword123')
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare() so sánh plaintext với hash
  // Tự động handle salt (salt được lưu trong hash string)
  // Trả về true/false
  return bcrypt.compare(candidatePassword, this.password);
};

// Tạo Model từ Schema
// mongoose.model('User', userSchema) tạo collection 'users' trong MongoDB (tự động lowercase + plural)
const User = mongoose.model('User', userSchema);

module.exports = User;
