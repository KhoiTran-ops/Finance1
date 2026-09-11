// ============================================================
// services/blockchain.service.js — Gọi smart contract functions
//
// Service layer chứa logic tương tác với blockchain
// Controller sẽ gọi service, không gọi blockchain trực tiếp
//
// Phân biệt:
// - READ functions  (view/pure): không tốn gas, không cần ký
// - WRITE functions (state change): tốn gas, cần private key ký
//
// LƯU Ý: escrowIdOnChain ở đây luôn là bytes32 hex string
// (ví dụ "0xabc123...000000"), KHÔNG phải Number.
// ============================================================

const { getContract, getProvider } = require('../config/blockchain');
const { ethers } = require('ethers');

/**
 * ── READ: Lấy trạng thái escrow từ smart contract ──────────
 * Dùng để đồng bộ: so sánh status trên chain vs DB
 *
 * Struct Escrow trong contract trả về theo đúng thứ tự:
 *   (bool exists, address buyer, address seller, uint256 amount,
 *    uint8 status, string evidenceURI, uint256 createdAt, uint256 updatedAt)
 *
 * @param {string} escrowIdOnChain - bytes32 hex string
 * @returns {Object} { exists, client, freelancer, amount, status, evidenceURI, createdAt, updatedAt }
 */
const getEscrowOnChain = async (escrowIdOnChain) => {
  const contract = getContract();

  // Gọi view function — chỉ đọc, không tốn gas
  // getEscrow() revert với EscrowNotFound nếu escrowId không tồn tại
  const result = await contract.getEscrow(escrowIdOnChain);

  // Status trên chain là số (uint8), map sang string cho dễ đọc
  // Phải đồng bộ với enum Status trong EscrowContract.sol
  const STATUS_MAP = {
    0: 'CREATED',
    1: 'LOCKED',
    2: 'SHIPPED',
    3: 'DISPUTED',
    4: 'RELEASED',
    5: 'REFUNDED',
    6: 'CANCELLED',
  };

  return {
    exists: result.exists,
    client: result.buyer,
    freelancer: result.seller,
    amount: result.amount.toString(), // BigInt → String để tránh mất precision
    status: STATUS_MAP[Number(result.status)] || 'UNKNOWN',
    evidenceURI: result.evidenceURI,
    createdAt: new Date(Number(result.createdAt) * 1000),
    updatedAt: new Date(Number(result.updatedAt) * 1000),
  };
};

/**
 * ── WRITE: Client confirm đã nhận deliverable → release tiền cho freelancer ──
 * Gọi khi Client xác nhận hài lòng với công việc (escrow đang ở SHIPPED on-chain)
 *
 * Tương ứng hàm confirmDelivery(bytes32 escrowId) trong contract.
 * CHỈ buyer (client) trên contract mới được gọi hàm này — nếu signer
 * (admin wallet) không phải buyer, transaction sẽ revert Unauthorized.
 * Trong luồng hiện tại, việc gọi hàm này nên được thực hiện trực tiếp
 * từ phía Client (qua frontend/ethers.js với wallet của Client), không
 * phải từ backend admin wallet — function này chỉ dùng cho mục đích
 * test/script nội bộ nếu cần.
 *
 * @param {string} escrowIdOnChain - bytes32 hex string
 * @returns {Object} { txHash, blockNumber }
 */
const confirmDelivery = async (escrowIdOnChain) => {
  const contract = getContract();

  console.log(`📤 Calling confirmDelivery for escrow ${escrowIdOnChain}...`);

  const tx = await contract.confirmDelivery(escrowIdOnChain);
  console.log(`⏳ Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait(1);
  console.log(`✅ confirmDelivery confirmed at block: ${receipt.blockNumber}`);

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

/**
 * ── WRITE: Admin resolve dispute ───────────────────────────
 * Gọi khi admin xử lý tranh chấp — release cho freelancer hoặc
 * refund cho client, tuỳ kết quả phân định.
 *
 * Tương ứng hàm resolveDispute(bytes32 escrowId, bool releaseToSeller)
 * trong contract — hàm này có modifier onlyOwner, nên signer dùng
 * trong getContract() (ADMIN_PRIVATE_KEY) PHẢI là địa chỉ Owner
 * của contract (initialOwner lúc deploy).
 *
 * @param {string} escrowIdOnChain - bytes32 hex string
 * @param {boolean} releaseToFreelancer - true: release cho freelancer, false: refund client
 * @returns {Object} { txHash, blockNumber }
 */
const resolveDispute = async (escrowIdOnChain, releaseToFreelancer) => {
  const contract = getContract();

  console.log(`📤 Calling resolveDispute for escrow ${escrowIdOnChain} (releaseToFreelancer=${releaseToFreelancer})...`);

  const tx = await contract.resolveDispute(escrowIdOnChain, releaseToFreelancer);
  console.log(`⏳ Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait(1);
  console.log(`✅ resolveDispute confirmed at block: ${receipt.blockNumber}`);

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
};

/**
 * ── HELPER: Lấy thông tin block ────────────────────────────
 * Dùng để lấy timestamp thực của block khi xử lý event
 *
 * @param {number} blockNumber
 * @returns {Date} timestamp của block
 */
const getBlockTimestamp = async (blockNumber) => {
  const provider = getProvider();
  const block = await provider.getBlock(blockNumber);
  // block.timestamp là Unix timestamp (giây)
  // Nhân 1000 để chuyển sang milliseconds cho JavaScript Date
  return new Date(block.timestamp * 1000);
};

/**
 * ── HELPER: Format đơn vị token theo decimals ──────────────
 * MockUSDC dùng 6 decimals (không phải 18 như ETH/MATIC),
 * nên KHÔNG dùng ethers.formatEther (mặc định 18 decimals).
 *
 * @param {string|BigInt} rawAmount - số lượng thô (chưa chia decimals)
 * @param {number} decimals - số decimals của token (mặc định 6 cho MockUSDC)
 * @returns {string} VD: "100.0" (USDC)
 */
const formatAmount = (rawAmount, decimals = 6) => {
  return ethers.formatUnits(rawAmount.toString(), decimals);
};

module.exports = {
  getEscrowOnChain,
  confirmDelivery,
  resolveDispute,
  getBlockTimestamp,
  formatAmount,
};