// ============================================================
// config/db.js — Kết nối MongoDB qua Mongoose
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // mongoose.connect() trả về Promise
    // Kết quả trả về là mongoose connection object
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Lưu ý: Mongoose 7+ không cần các options cũ như useNewUrlParser, useUnifiedTopology
    // chúng đã bị deprecated và loại bỏ

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // Nếu kết nối DB thất bại, in lỗi và thoát process
    // process.exit(1): exit với code khác 0 = có lỗi xảy ra
    // Tại sao exit thay vì throw? Vì app không thể hoạt động không có DB
    // Nếu không exit, app sẽ start nhưng mọi query đều fail → confusing
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
