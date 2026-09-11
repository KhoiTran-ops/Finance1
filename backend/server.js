// ============================================================
// server.js — Entry point
//
// Thứ tự khởi động:
// 1. Load .env
// 2. Kết nối MongoDB
// 3. Khởi tạo blockchain (provider + contract)
// 4. Start HTTP server
// 5. Bắt đầu lắng nghe blockchain events
//
// Tại sao thứ tự này?
// - DB phải sẵn sàng trước event listener (listener cần ghi vào DB)
// - HTTP server start trước listener: app nhận request trong khi
//   listener setup (thường chỉ vài ms)
// - Listener start SAU server: không block HTTP server
// ============================================================

require('dotenv').config();

const app            = require('./app');
const connectDB      = require('./config/db');
const { initBlockchain }       = require('./config/blockchain');
const { startEventListeners }  = require('./services/eventListener.service');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // ── BƯỚC 1: Kết nối MongoDB ──────────────────────────────
  await connectDB();

  // ── BƯỚC 2: Khởi tạo blockchain ──────────────────────────
  // Nếu blockchain không connect được → log lỗi nhưng vẫn start server
  // App vẫn phục vụ REST API, chỉ mất tính năng blockchain
  try {
    await initBlockchain();

    // ── BƯỚC 3: Bắt đầu lắng nghe events ──────────────────
    startEventListeners();
  } catch (blockchainError) {
    console.warn('⚠️  Blockchain init failed. Running without blockchain features.');
    console.warn('   Reason:', blockchainError.message);
    console.warn('   Check BLOCKCHAIN_RPC_URL and ADMIN_PRIVATE_KEY in .env');
    // Không exit — app vẫn chạy được
  }

  // ── BƯỚC 4: Start HTTP server ─────────────────────────────
  app.listen(PORT, () => {
    console.log(`\n✅ Server is running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\nAPI Endpoints:`);
    console.log(`  Auth:         http://localhost:${PORT}/api/auth`);
    console.log(`  Escrows:      http://localhost:${PORT}/api/escrows`);
    console.log(`  Transactions: http://localhost:${PORT}/api/transactions`);
    console.log(`  Health:       http://localhost:${PORT}/health`);
  });

  // ── GRACEFUL SHUTDOWN ─────────────────────────────────────
  // Khi nhận tín hiệu dừng (Ctrl+C hoặc server restart)
  // Dừng listeners và đóng kết nối sạch sẽ
  const { stopEventListeners } = require('./services/eventListener.service');

  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    stopEventListeners();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received. Shutting down...');
    stopEventListeners();
    process.exit(0);
  });
};

// Gọi hàm khởi động
startServer().catch((err) => {
  console.error('❌ Fatal startup error:', err.message);
  process.exit(1);
});