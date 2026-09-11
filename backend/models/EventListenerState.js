// ============================================================
// models/EventListenerState.js
//
// Lưu trạng thái "đã xử lý đến block nào" của event listener.
// Mục đích: khi server restart (crash, deploy lại, Ctrl+C trong lúc
// test...), listener biết phải queryFilter lại TỪ ĐÂU, tránh:
//   - Bỏ lỡ event xảy ra trong lúc server tắt
//   - Xử lý lại từ block 0 (rất chậm, tốn rate-limit RPC)
//
// Chỉ cần 1 document duy nhất cho mỗi contractAddress (trường hợp
// sau này đổi contract / deploy lại thì sẽ có state riêng).
// ============================================================

const mongoose = require('mongoose');

const eventListenerStateSchema = new mongoose.Schema(
  {
    // Địa chỉ contract đang lắng nghe — dùng làm key, lowercase để so khớp ổn định
    contractAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    // Block cuối cùng đã xử lý XONG (đã queryFilter và lưu DB thành công)
    // Lần poll tiếp theo sẽ bắt đầu từ lastProcessedBlock + 1
    lastProcessedBlock: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventListenerState', eventListenerStateSchema);