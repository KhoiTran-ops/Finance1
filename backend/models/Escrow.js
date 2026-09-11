// ============================================================
// models/Escrow.js — Schema cho Escrow (Service Contract)
//
// Escrow là hợp đồng giữ tiền trung gian cho dịch vụ freelance:
// 1. Client tạo escrow trong DB
// 2. Client deposit stablecoin vào smart contract
// 3. Backend 3 lắng nghe event, cập nhật status → LOCKED
// 4. Freelancer thực hiện công việc và submit deliverable
// 5. Client approve → smart contract release tiền cho freelancer
// ============================================================

const mongoose = require('mongoose');
const { ESCROW_STATUS } = require('../utils/constants');

const escrowSchema = new mongoose.Schema(
  {
    // ==================== BLOCKCHAIN DATA ====================
    // Các field này được điền sau khi smart contract được tương tác
    // Ban đầu khi tạo escrow trong DB, chúng có thể là null/undefined

    contractAddress: {
      type: String,
      lowercase: true, // Ethereum address nên lowercase
    },
    escrowIdOnChain: {
      type:String,
      lowercase: true,
      // ID của escrow trên smart contract (uint256)
      // Dùng để tham chiếu khi gọi contract functions
    },
    txHash: {
      type: String,
      // Transaction hash của lần deposit đầu tiên
      // Dùng để verify trên blockchain explorer (PolygonScan)
    },

    // ==================== PARTIES ====================

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Tham chiếu đến User model
      // Dùng để .populate('client') → thay ObjectId bằng full User object
      required: [true, 'Client is required'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer is required'],
    },

    // ==================== JOB INFORMATION ====================

    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    jobDescription: {
      type: String,
      trim: true,
    },
    amount: {
      type: String,
      required: [true, 'Amount is required'],
      // TẠI SAO String thay vì Number?
      // JavaScript Number chỉ an toàn đến 2^53 - 1 (Number.MAX_SAFE_INTEGER)
      // Ethereum dùng đơn vị Wei: 1 ETH = 10^18 Wei
      // Số như 1000000000000000000 (1 ETH) có thể mất precision khi dùng JS Number
      // Lưu dạng String rồi để ethers.js (BigInt) xử lý
    },
    deadline: {
      type: Date,
      // Deadline của công việc — freelancer cần submit trước ngày này
    },

    // ==================== STATUS ====================

    status: {
      type: String,
      enum: {
        values: Object.values(ESCROW_STATUS),
        message: 'Invalid escrow status: {VALUE}',
      },
      default: ESCROW_STATUS.CREATED,
    },

    // ==================== DELIVERABLE ====================
    // Thay thế shippingInfo — freelancer submit link/file thay vì gửi hàng vật lý

    deliverableInfo: {
      deliverableUrl: { type: String },   // Link Google Drive, GitHub, Figma, v.v.
      workProof: { type: String },         // Mô tả hoặc link bằng chứng công việc
      submittedAt: { type: Date },         // Thời điểm freelancer submit
      note: { type: String },              // Ghi chú thêm từ freelancer
    },

    // ==================== AUTO RELEASE ====================

    autoReleaseAt: {
      type: Date,
      // Nếu client không approve sau X ngày kể từ ngày freelancer submit,
      // smart contract tự động release tiền cho freelancer
      // Field này được set khi freelancer submit deliverable
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// ==================== INDEXES ====================
// Index giúp tăng tốc độ query
// Compound index: client + status — query "tất cả escrow LOCKED của user này" sẽ rất nhanh
// Không index tất cả vì index chiếm thêm storage và làm chậm write
escrowSchema.index({ client: 1, status: 1 });
escrowSchema.index({ freelancer: 1, status: 1 });

const Escrow = mongoose.model('Escrow', escrowSchema);

module.exports = Escrow;
