// ============================================================
// config/blockchain.js — Khởi tạo kết nối tới Polygon Amoy Testnet
//
// File này là "cầu nối" giữa Node.js backend và blockchain
// Dùng thư viện ethers.js v6
//
// Hai khái niệm quan trọng:
// - Provider: chỉ ĐỌC dữ liệu từ blockchain (không cần private key)
// - Signer:   ĐỌC + GHI lên blockchain (cần private key để ký transaction)
// ============================================================

const { ethers } = require('ethers');
const EscrowABI   = require('../abi/EscrowContract.json');

// Singleton pattern — chỉ khởi tạo 1 lần, tái dùng ở nhiều nơi
let provider = null;
let signer   = null;
let contract = null;

/**
 * Khởi tạo provider, signer, và contract instance
 * Gọi 1 lần khi server start
 */
const initBlockchain = async () => {
  try {
    // ── PROVIDER ─────────────────────────────────────────────
    // JsonRpcProvider: kết nối tới node RPC (Alchemy)
    // Giống như "trình duyệt" để đọc dữ liệu blockchain
    // Alchemy cung cấp node RPC miễn phí cho testnet
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

    // Kiểm tra kết nối bằng cách lấy block number hiện tại
    // Nếu lỗi → throw → catch ở dưới
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Blockchain connected. Current block: ${blockNumber}`);

    // ── SIGNER ───────────────────────────────────────────────
    // Wallet: tạo từ private key → có thể ký transaction
    // Private key của admin wallet (lưu trong .env, KHÔNG commit lên Git)
    // Dùng để: resolveDispute khi admin xử lý tranh chấp
    signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    console.log(`✅ Signer wallet: ${signer.address}`);

    // ── CONTRACT INSTANCE ────────────────────────────────────
    // Contract: object đại diện cho smart contract đã deploy
    // Cần 3 thứ:
    //   1. Address: địa chỉ contract trên blockchain
    //   2. ABI: "giao diện" của contract (danh sách functions + events)
    //   3. Signer: để gọi write functions (resolveDispute, ...)
    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      EscrowABI.abi,
      signer   // dùng signer thay vì provider → có thể gọi write functions
    );
    console.log(`✅ Contract loaded at: ${process.env.CONTRACT_ADDRESS}`);

    return { provider, signer, contract };
  } catch (error) {
    console.error(`❌ Blockchain init error: ${error.message}`);
    // Không exit process — blockchain có thể connect lại sau
    // Khác với DB: app vẫn có thể phục vụ REST API kể cả khi blockchain lỗi
    throw error;
  }
};

/**
 * Getter functions — trả về instance đã khởi tạo
 * Dùng ở services sau khi initBlockchain() đã được gọi
 */
const getProvider = () => {
  if (!provider) throw new Error('Blockchain not initialized. Call initBlockchain() first.');
  return provider;
};

const getSigner = () => {
  if (!signer) throw new Error('Blockchain not initialized. Call initBlockchain() first.');
  return signer;
};

const getContract = () => {
  if (!contract) throw new Error('Blockchain not initialized. Call initBlockchain() first.');
  return contract;
};

module.exports = { initBlockchain, getProvider, getSigner, getContract };