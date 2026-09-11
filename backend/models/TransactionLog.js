// ============================================================
// models/TransactionLog.js — Schema lưu log các on-chain events
//
// Mục đích:
// - Ghi lại lịch sử mọi transaction/event liên quan đến escrow
//   đã được Backend 3 (eventListener.service.js) xử lý
// - Dùng để audit, debug, hoặc hiển thị "lịch sử giao dịch"
//   cho người dùng trên frontend (VD: timeline của 1 escrow)
// - txHash là duy nhất — đảm bảo idempotent: nếu event được
//   emit/xử lý nhiều lần (do RPC trả trùng), không tạo log trùng
// ============================================================

const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema(
  {
    // ==================== LIÊN KẾT ESCROW ====================

    escrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escrow',
      required: [true, 'Escrow reference is required'],
      index: true,
      // Dùng để query "toàn bộ log của 1 escrow" — populate('escrow')
      // sẽ trả về document Escrow tương ứng
    },
    escrowIdOnChain: {
      type: String,
      lowercase: true,
      required: [true, 'escrowIdOnChain is required'],
      // ID escrow trên smart contract — dạng bytes32 hex string
      // (ví dụ "0xabc123...000000"), KHÔNG phải Number, vì bytes32
      // vượt quá Number.MAX_SAFE_INTEGER và sẽ mất precision.
    },

    // ==================== THÔNG TIN TRANSACTION ====================

    txHash: {
      type: String,
      required: [true, 'Transaction hash is required'],
      unique: true,
      lowercase: true,
      // Hash giao dịch trên blockchain — duy nhất cho mỗi transaction
      // Dùng làm khoá idempotent: findOneAndUpdate({txHash}, ..., {upsert:true})
      // đảm bảo không lưu trùng log cho cùng 1 transaction
    },
    blockNumber: {
      type: Number,
      required: [true, 'Block number is required'],
      // Số block chứa transaction này — dùng để verify trên PolygonScan
    },
    blockTimestamp: {
      type: Date,
      required: [true, 'Block timestamp is required'],
      // Thời điểm thực tế block được mine (lấy từ provider.getBlock())
      // Khác với createdAt (thời điểm backend ghi log vào DB)
    },
    contractAddress: {
      type: String,
      lowercase: true,
      required: [true, 'Contract address is required'],
      // Địa chỉ smart contract đã emit event này
    },

    // ==================== THÔNG TIN EVENT ====================

    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: [
          'EscrowCreated',
          'FundsDeposited',
          'ItemShipped',
          'DisputeRaised',
          'FundsReleased',
          'BuyerRefunded',
          'EscrowCancelled',
        ],
        message: 'Invalid event type: {VALUE}',
      },
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Dữ liệu raw đi kèm event, khác nhau tuỳ eventType, ví dụ:
      // FundsDeposited: { client, amount } | DisputeRaised: { raisedBy, evidenceURI }
      // Dùng Mixed vì cấu trúc không cố định giữa các loại event
    },
    processed: {
      type: Boolean,
      default: true,
      // Đánh dấu log này đã được xử lý xong. Hiện tại luôn true vì
      // eventListener chỉ lưu log sau khi đã xử lý xong; field này
      // để dự phòng cho việc retry/queue xử lý lại trong tương lai.
    },
  },
  {
    timestamps: true, // createdAt: lúc backend ghi log; updatedAt: lúc backend sửa log
  }
);

// ==================== INDEXES ====================
transactionLogSchema.index({ escrow: 1, eventType: 1 });
transactionLogSchema.index({ escrowIdOnChain: 1 });

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

module.exports = TransactionLog;