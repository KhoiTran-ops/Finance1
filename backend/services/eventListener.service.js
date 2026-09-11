// ============================================================
// services/eventListener.service.js — Lắng nghe blockchain events
//
// Đây là TRÁI TIM của Backend 3
//
// ⚠️ ĐÃ SỬA (xem ghi chú "FIX" bên dưới):
// Trước đây dùng contract.on('EventName', handler) — cơ chế này dựa
// vào eth_newFilter + eth_getFilterChanges (filter-based polling) của
// JSON-RPC. Với Alchemy (và nhiều RPC provider khác), filter có thể
// bị hết hạn hoặc bị route sang node khác trong cluster, gây lỗi:
//   "could not coalesce error ... filter not found"
//
// → Giải pháp: bỏ hoàn toàn contract.on(), thay bằng vòng lặp
//   setInterval gọi contract.queryFilter(eventName, fromBlock, toBlock)
//   theo từng khoảng block. Cách này KHÔNG tạo filter trên RPC node,
//   nên không bao giờ gặp lỗi "filter not found".
//
// Bonus: lastProcessedBlock được lưu vào MongoDB (EventListenerState)
// sau mỗi lần poll thành công, nên nếu server restart giữa lúc test,
// listener sẽ tự động tiếp tục từ block đã xử lý cuối cùng — không
// bỏ lỡ event nào xảy ra trong lúc server tắt.
//
// Cách hoạt động (luồng cũ, vẫn giữ nguyên):
// 1. Smart contract emit event khi có hành động xảy ra
// 2. ethers.js lắng nghe events qua polling (queryFilter theo block range)
// 3. Callback được gọi với dữ liệu event
// 4. Backend cập nhật MongoDB để đồng bộ với blockchain
//
// Tại sao cần event listener?
// Frontend gọi smart contract trực tiếp (không qua backend)
// Backend không biết khi nào có tiền được deposit/release
// → Phải lắng nghe blockchain để biết và cập nhật DB
//
// LƯU Ý QUAN TRỌNG VỀ escrowId:
// Contract EscrowContract.sol định nghĩa escrowId là `bytes32`,
// KHÔNG PHẢI uint256/Number. Mọi nơi xử lý escrowId trong file này
// phải giữ nguyên dạng hex string (ví dụ "0xabc123...000000"),
// tuyệt đối không convert qua Number() vì bytes32 vượt quá
// Number.MAX_SAFE_INTEGER và sẽ làm sai lệch giá trị.
// Field tương ứng trong MongoDB (Escrow.escrowIdOnChain) cũng phải
// là String, lưu nguyên dạng hex (lowercase) để so khớp chính xác.
// ============================================================

const { getContract }       = require('../config/blockchain');
const { getBlockTimestamp } = require('./blockchain.service');
const Escrow               = require('../models/Escrow');
const TransactionLog       = require('../models/TransactionLog');
const EventListenerState   = require('../models/EventListenerState');
const { ESCROW_STATUS }     = require('../utils/constants');

// ============================================================
// CONFIG polling
// ============================================================
const POLL_INTERVAL_MS = 8000; // 8s — đủ nhanh cho test, không spam rate-limit Alchemy free tier
// FIX: Alchemy free tier giới hạn eth_getLogs CHỈ 10 block/request trên Polygon Amoy
// (lỗi gặp thực tế: "Under the Free tier plan, you can make eth_getLogs requests
// with up to a 10 block range"). Đặt 10 để khớp đúng giới hạn này.
// Nếu sau này upgrade lên Alchemy PAYG hoặc đổi RPC provider khác có range lớn hơn,
// có thể tăng số này lên (ví dụ 500-2000) để poll nhanh hơn khi cần catch-up nhiều block.
const MAX_BLOCK_RANGE  = 10;
                                // Nếu lastProcessedBlock cách hiện tại quá xa (server tắt lâu), sẽ query theo từng đợt nhỏ thay vì 1 lần.

// Tên các event cần lắng nghe — PHẢI khớp 1:1 với EscrowContract.sol
const EVENT_NAMES = [
  'EscrowCreated',
  'FundsDeposited',
  'ItemShipped',
  'DisputeRaised',
  'FundsReleased',
  'BuyerRefunded',
  'EscrowCancelled',
];

let pollTimer = null;
let isPolling = false; // tránh chạy chồng 2 lần poll cùng lúc nếu 1 lần poll bị chậm (RPC lag)

// ============================================================
// HELPER: Chuẩn hoá escrowId (bytes32) về dạng hex string lowercase
// ethers.js v6 trả escrowId dạng string "0x..." sẵn, nhưng vẫn
// chuẩn hoá lowercase để tránh lệch case khi so khớp trong DB.
// ============================================================
const normalizeEscrowId = (escrowId) => String(escrowId).toLowerCase();

// ============================================================
// HELPER: Lưu TransactionLog vào DB
// Idempotent: nếu txHash đã tồn tại → bỏ qua, không throw error
// ============================================================
const saveTransactionLog = async ({
  escrowDbId,
  escrowIdOnChain,
  txHash,
  blockNumber,
  blockTimestamp,
  contractAddress,
  eventType,
  eventData,
}) => {
  try {
    // insertOne với upsert: nếu txHash đã tồn tại thì không làm gì
    // Tránh lưu trùng khi event được emit nhiều lần (edge case)
    // FIX: với cơ chế poll theo block range, idempotency theo txHash càng
    // quan trọng — vì nếu lastProcessedBlock được lưu lệch (hiếm, do crash
    // giữa lúc lưu), 1 block có thể được query lại 2 lần ở 2 lần poll khác nhau.
    await TransactionLog.findOneAndUpdate(
      { txHash },   // filter: tìm theo txHash
      {             // update nếu không tìm thấy
        $setOnInsert: {
          escrow: escrowDbId,
          escrowIdOnChain,
          txHash,
          blockNumber,
          blockTimestamp,
          contractAddress,
          eventType,
          eventData,
          processed: true,
        },
      },
      { upsert: true, new: true } // upsert: tạo mới nếu không tồn tại
    );
    console.log(`📝 TransactionLog saved: [${eventType}] txHash=${txHash.slice(0, 10)}...`);
  } catch (err) {
    // Log lỗi nhưng không throw — không muốn crash listener vì lỗi log
    console.error(`❌ Failed to save TransactionLog: ${err.message}`);
  }
};

// ============================================================
// HELPER: Tìm Escrow trong DB từ escrowIdOnChain (bytes32 hex string)
// ============================================================
const findEscrowByChainId = async (escrowIdOnChain) => {
  const normalizedId = normalizeEscrowId(escrowIdOnChain);
  const escrow = await Escrow.findOne({ escrowIdOnChain: normalizedId });
  if (!escrow) {
    console.warn(`⚠️  Escrow ${normalizedId} not found in DB. Event might be from old data.`);
  }
  return escrow;
};

// ============================================================
// EVENT HANDLER 1: EscrowCreated
//
// Khi nào xảy ra:
//   Client gọi smart contract createEscrow(escrowId, seller, amount)
//   → Contract lưu escrow on-chain và emit EscrowCreated
//
// Backend cần làm:
//   1. Tìm escrow trong DB bằng escrowIdOnChain
//      (Frontend phải gửi đúng escrowId == escrow._id đã encode sang bytes32
//      khi gọi contract, và lưu escrowIdOnChain vào DB ngay khi tạo escrow
//      qua API — nên ở đây escrow thường ĐÃ có escrowIdOnChain sẵn)
//   2. Cập nhật contractAddress
//   3. Lưu TransactionLog
//
// event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)
// ============================================================
const handleEscrowCreated = async (escrowId, client, freelancer, amount, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [EscrowCreated] escrowId=${normalizedId}, client=${client}, freelancer=${freelancer}, amount=${amount}`);

  try {
    const txHash       = event.log.transactionHash;
    const blockNumber  = event.log.blockNumber;
    const contractAddr = event.log.address;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return; // Không tìm thấy → bỏ qua

    escrow.contractAddress = contractAddr.toLowerCase();
    escrow.escrowIdOnChain = normalizedId;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} linked to on-chain escrowId ${normalizedId}`);

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: contractAddr,
      eventType: 'EscrowCreated',
      eventData: { client, freelancer, amount: amount.toString() },
    });
  } catch (err) {
    console.error(`❌ handleEscrowCreated error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 2: FundsDeposited
//
// Khi nào xảy ra:
//   Client gọi smart contract deposit(escrowId)
//   → Contract chuyển token vào contract và emit FundsDeposited
//
// Backend cần làm:
//   1. Tìm escrow trong DB bằng escrowIdOnChain
//   2. Cập nhật status → LOCKED
//   3. Lưu txHash và contractAddress
//   4. Lưu TransactionLog
//
// event FundsDeposited(bytes32 indexed escrowId, address indexed buyer, uint256 amount)
// ============================================================
const handleFundsDeposited = async (escrowId, client, amount, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [FundsDeposited] escrowId=${normalizedId}, amount=${amount}`);

  try {
    // event.log chứa thông tin raw về event (txHash, blockNumber, address)
    const txHash       = event.log.transactionHash;
    const blockNumber  = event.log.blockNumber;
    const contractAddr = event.log.address;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    // Tìm escrow trong DB
    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return; // Không tìm thấy → bỏ qua

    // Cập nhật escrow
    escrow.status          = ESCROW_STATUS.LOCKED;
    escrow.txHash          = txHash;
    escrow.contractAddress = contractAddr.toLowerCase();
    // escrowIdOnChain có thể chưa được set nếu frontend tạo escrow DB trước
    escrow.escrowIdOnChain = normalizedId;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} → LOCKED`);

    // Lưu log
    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: contractAddr,
      eventType:  'FundsDeposited',
      eventData:  { client, amount: amount.toString() },
    });
  } catch (err) {
    console.error(`❌ handleFundsDeposited error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 3: ItemShipped (Freelancer đã nộp/giao việc)
//
// Khi nào xảy ra:
//   Freelancer gọi smart contract markShipped(escrowId)
//   → Contract emit ItemShipped
//
// Backend cần làm:
//   Lưu TransactionLog. Việc cập nhật status sang SUBMITTED
//   trong luồng hiện tại được thực hiện qua API submitDeliverable
//   (Backend 1), nên ở đây chỉ ghi log on-chain, không ép status
//   để tránh đè lên dữ liệu deliverable đã lưu qua API.
//
// event ItemShipped(bytes32 indexed escrowId, address indexed seller)
// ============================================================
const handleItemShipped = async (escrowId, freelancer, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [ItemShipped] escrowId=${normalizedId}, freelancer=${freelancer}`);

  try {
    const txHash      = event.log.transactionHash;
    const blockNumber = event.log.blockNumber;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return;

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: event.log.address,
      eventType: 'ItemShipped',
      eventData: { freelancer },
    });
  } catch (err) {
    console.error(`❌ handleItemShipped error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 4: DisputeRaised
//
// Khi nào xảy ra:
//   Client hoặc Freelancer gọi smart contract raiseDispute(escrowId, evidenceURI)
//   → Contract emit DisputeRaised
//
// Backend cần làm:
//   1. Cập nhật Escrow.status → DISPUTED
//   2. Lưu TransactionLog
//   (Backend 2 sẽ xử lý dispute logic: evidence, admin resolve)
//
// event DisputeRaised(bytes32 indexed escrowId, address indexed raisedBy, string evidenceURI)
// ============================================================
const handleDisputeRaised = async (escrowId, raisedBy, evidenceURI, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [DisputeRaised] escrowId=${normalizedId}, raisedBy=${raisedBy}`);

  try {
    const txHash      = event.log.transactionHash;
    const blockNumber = event.log.blockNumber;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return;

    escrow.status = ESCROW_STATUS.DISPUTED;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} → DISPUTED`);

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: event.log.address,
      eventType: 'DisputeRaised',
      eventData: { raisedBy, evidenceURI },
    });
  } catch (err) {
    console.error(`❌ handleDisputeRaised error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 5: FundsReleased
//
// Khi nào xảy ra:
//   - Client gọi confirmDelivery(escrowId), hoặc
//   - Owner gọi resolveDispute(escrowId, true)
//
// Backend cần làm:
//   1. Cập nhật Escrow.status → RELEASED
//   2. Lưu TransactionLog
//
// event FundsReleased(bytes32 indexed escrowId, address indexed seller, uint256 amount)
// ============================================================
const handleFundsReleased = async (escrowId, freelancer, amount, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [FundsReleased] escrowId=${normalizedId}, freelancer=${freelancer}, amount=${amount}`);

  try {
    const txHash      = event.log.transactionHash;
    const blockNumber = event.log.blockNumber;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return;

    escrow.status = ESCROW_STATUS.RELEASED;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} → RELEASED`);

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: event.log.address,
      eventType: 'FundsReleased',
      eventData: { freelancer, amount: amount.toString() },
    });
  } catch (err) {
    console.error(`❌ handleFundsReleased error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 6: BuyerRefunded (Client được hoàn tiền)
//
// Khi nào xảy ra:
//   Owner gọi resolveDispute(escrowId, false) → contract refund cho client
//
// Backend cần làm:
//   1. Cập nhật Escrow.status → REFUNDED
//   2. Lưu TransactionLog
//
// event BuyerRefunded(bytes32 indexed escrowId, address indexed buyer, uint256 amount)
// ============================================================
const handleBuyerRefunded = async (escrowId, client, amount, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [BuyerRefunded] escrowId=${normalizedId}, client=${client}, amount=${amount}`);

  try {
    const txHash      = event.log.transactionHash;
    const blockNumber = event.log.blockNumber;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return;

    escrow.status = ESCROW_STATUS.REFUNDED;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} → REFUNDED`);

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: event.log.address,
      eventType: 'BuyerRefunded',
      eventData: { client, amount: amount.toString() },
    });
  } catch (err) {
    console.error(`❌ handleBuyerRefunded error: ${err.message}`);
  }
};

// ============================================================
// EVENT HANDLER 7: EscrowCancelled
//
// Khi nào xảy ra:
//   Client gọi cancelEscrow(escrowId) khi escrow đang ở CREATED
//   (chưa deposit) → contract emit EscrowCancelled
//
// Backend cần làm:
//   1. Cập nhật Escrow.status → CANCELLED
//   2. Lưu TransactionLog
//
// event EscrowCancelled(bytes32 indexed escrowId, address indexed buyer)
// ============================================================
const handleEscrowCancelled = async (escrowId, client, event) => {
  const normalizedId = normalizeEscrowId(escrowId);
  console.log(`\n🔔 [EscrowCancelled] escrowId=${normalizedId}, client=${client}`);

  try {
    const txHash      = event.log.transactionHash;
    const blockNumber = event.log.blockNumber;
    const blockTimestamp = await getBlockTimestamp(blockNumber);

    const escrow = await findEscrowByChainId(normalizedId);
    if (!escrow) return;

    escrow.status = ESCROW_STATUS.CANCELLED;
    await escrow.save();
    console.log(`✅ Escrow ${escrow._id} → CANCELLED`);

    await saveTransactionLog({
      escrowDbId:      escrow._id,
      escrowIdOnChain: normalizedId,
      txHash,
      blockNumber,
      blockTimestamp,
      contractAddress: event.log.address,
      eventType: 'EscrowCancelled',
      eventData: { client },
    });
  } catch (err) {
    console.error(`❌ handleEscrowCancelled error: ${err.message}`);
  }
};

// ============================================================
// FIX: Map tên event → handler tương ứng
// Dùng để gọi đúng handler khi xử lý log trả về từ queryFilter,
// vì queryFilter trả về EventLog có .fragment.name để biết là event nào.
// ============================================================
const EVENT_HANDLERS = {
  EscrowCreated:   handleEscrowCreated,
  FundsDeposited:  handleFundsDeposited,
  ItemShipped:     handleItemShipped,
  DisputeRaised:   handleDisputeRaised,
  FundsReleased:   handleFundsReleased,
  BuyerRefunded:   handleBuyerRefunded,
  EscrowCancelled: handleEscrowCancelled,
};

// ============================================================
// FIX: Helper race với timeout — đảm bảo 1 Promise không bao giờ
// treo vô thời hạn. Khai báo TRƯỚC để getLastProcessedBlock/
// saveLastProcessedBlock dùng được (hoisting của const không hoạt
// động như function declaration, nên phải đặt trước nơi sử dụng).
// ============================================================
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout sau ${ms}ms: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ============================================================
// FIX: Đọc lastProcessedBlock từ DB. Nếu chưa có (lần đầu chạy),
// mặc định bắt đầu từ block hiện tại trừ đi 1 (không quét lại lịch sử
// cũ — nếu cần backfill toàn bộ lịch sử, gọi riêng 1 script khác).
//
// FIX: bọc query MongoDB bằng withTimeout(..., 8000) — nếu Mongoose
// bị treo do mất kết nối (mongoose có cơ chế "buffering" mặc định:
// xếp hàng query và CHỜ VÔ THỜI HẠN cho tới khi kết nối khôi phục),
// ta sẽ phát hiện và throw lỗi rõ ràng sau 8s, thay vì im lặng treo
// tới khi đụng timeout tổng 30s của pollOnce.
// ============================================================
const getLastProcessedBlock = async (contractAddress, provider) => {
  const addr = contractAddress.toLowerCase();
  let state = await withTimeout(
    EventListenerState.findOne({ contractAddress: addr }),
    8000,
    'MongoDB findOne (EventListenerState)'
  );

  if (!state) {
    const currentBlock = await provider.getBlockNumber();
    state = await withTimeout(
      EventListenerState.create({
        contractAddress: addr,
        lastProcessedBlock: currentBlock,
      }),
      8000,
      'MongoDB create (EventListenerState)'
    );
    console.log(`🆕 EventListenerState khởi tạo lần đầu tại block ${currentBlock}`);
  }

  return state.lastProcessedBlock;
};

// ============================================================
// FIX: Lưu lastProcessedBlock mới vào DB sau khi poll xong 1 đợt thành công
// FIX: bọc bằng withTimeout(..., 8000) cùng lý do như trên — phát hiện
// sớm nếu MongoDB đang mất kết nối, thay vì treo vô thời hạn.
// ============================================================
const saveLastProcessedBlock = async (contractAddress, blockNumber) => {
  const addr = contractAddress.toLowerCase();
  await withTimeout(
    EventListenerState.findOneAndUpdate(
      { contractAddress: addr },
      { $set: { lastProcessedBlock: blockNumber } },
      { upsert: true }
    ),
    8000,
    'MongoDB findOneAndUpdate (EventListenerState)'
  );
};

// ============================================================
// FIX: 1 lần poll — query TẤT CẢ event của contract trong khoảng block
// [fromBlock, toBlock] bằng 1 lần gọi duy nhất (queryFilter('*', ...)),
// rồi tự phân loại theo log.fragment.name, xử lý theo đúng thứ tự
// block/log index, cuối cùng lưu lastProcessedBlock = toBlock.
//
// LƯU Ý: trước đây gọi queryFilter riêng cho từng event (7 lần/range).
// Với Alchemy free tier giới hạn eth_getLogs chỉ 10 block/request,
// việc catch-up nhiều block (ví dụ server tắt lâu, hoặc cố tình lùi
// lastProcessedBlock để bắt lại event cũ) sẽ cần rất nhiều vòng lặp
// → 7 request/vòng dễ dính rate-limit và rất chậm.
// Dùng queryFilter('*', fromBlock, toBlock) gộp thành 1 request/vòng,
// giảm 7 lần số request RPC cần thiết. contract.queryFilter('*', ...)
// vẫn tự decode args theo ABI như khi gọi theo tên event cụ thể, nên
// log.args và log.fragment.name vẫn dùng được như cũ.
//
// FIX: toàn bộ thân hàm được bọc bởi withTimeout(..., 30000) để đảm bảo
// nếu socket/RPC bị treo (sau ECONNRESET hoặc lý do mạng khác), poll
// này sẽ tự throw timeout sau 30s, rơi vào catch, và isPolling LUÔN
// được reset về false trong finally — không bao giờ kẹt vĩnh viễn.
// ============================================================
const pollOnce = async () => {
  if (isPolling) {
    console.log('⏳ Đợt poll trước vẫn đang chạy, bỏ qua lần này...');
    return;
  }
  isPolling = true;

  try {
    await withTimeout(pollOnceInner(), 30000, 'pollOnce');
  } catch (err) {
    // Không throw — để vòng lặp setInterval tiếp tục ở lần poll kế tiếp
    console.error(`❌ pollOnce error: ${err.message}`);
  } finally {
    isPolling = false;
  }
};

// ============================================================
// FIX: Logic poll thực sự được tách ra thành pollOnceInner, để
// pollOnce() bên ngoài chỉ lo việc quản lý isPolling + timeout.
// ============================================================
const pollOnceInner = async () => {
  const contract = getContract();
  const provider = contract.runner.provider;
  const contractAddress = await contract.getAddress();

  const currentBlock = await provider.getBlockNumber();
  let fromBlock = (await getLastProcessedBlock(contractAddress, provider)) + 1;

  if (fromBlock > currentBlock) {
    // Không có block mới nào kể từ lần poll trước
    return;
  }

  // FIX: chia nhỏ theo MAX_BLOCK_RANGE để tránh lỗi "block range too large"
  // nếu server tắt lâu và bị tụt lại nhiều block.
  while (fromBlock <= currentBlock) {
    const toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE - 1, currentBlock);

    // FIX: 1 lần gọi duy nhất lấy tất cả log của contract trong range này
    // (thay vì loop 7 lần theo EVENT_NAMES), rồi lọc ra log nào khớp event ta quan tâm.
    const rawLogs = await contract.queryFilter('*', fromBlock, toBlock);
    const allLogs = rawLogs.filter(
      (log) => log.fragment && EVENT_HANDLERS[log.fragment.name]
    );

    // Log gọn — chỉ in khi thực sự có event để tránh spam console mỗi 8s
    if (allLogs.length > 0) {
      console.log(`📦 Poll [${fromBlock}-${toBlock}]: tìm thấy ${allLogs.length} event`);
    }

    // Sort theo thứ tự xảy ra thật trên chain (quan trọng nếu nhiều event
    // cùng escrow xảy ra trong cùng đợt poll, ví dụ deposit rồi raise dispute)
    allLogs.sort((a, b) =>
      a.blockNumber !== b.blockNumber
        ? a.blockNumber - b.blockNumber
        : a.index - b.index
    );

    for (const log of allLogs) {
      const eventName = log.fragment.name;
      const handler = EVENT_HANDLERS[eventName];
      if (!handler) continue; // an toàn, không nên xảy ra

      // FIX: dựng lại đối số giống hệt format mà contract.on() truyền cho handler cũ:
      // (...args đã decode, event) — trong đó event.log = log gốc (có transactionHash, blockNumber, address)
      const args = [...log.args, { log }];
      await handler(...args);
    }

    await saveLastProcessedBlock(contractAddress, toBlock);
    fromBlock = toBlock + 1;

    // FIX: nếu phải catch-up nhiều vòng (range cách xa), nghỉ 1 nhịp nhỏ
    // giữa các request để giảm áp lực rate-limit lên Alchemy free tier.
    if (fromBlock <= currentBlock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};

// ============================================================
// MAIN: Khởi động event listener bằng polling (FIX — không còn contract.on)
//
// Thay vì contract.on('EventName', callback) dựa vào eth_newFilter +
// eth_getFilterChanges (dễ lỗi "filter not found" với Alchemy), ta
// chủ động gọi contract.queryFilter(...) theo chu kỳ POLL_INTERVAL_MS.
// Cách này không tạo filter trên RPC node nên không bao giờ bị
// "filter not found", và lastProcessedBlock lưu trong MongoDB đảm bảo
// không mất event khi restart server giữa lúc test.
// ============================================================
const startEventListeners = async () => {
  console.log('👂 Starting blockchain event listeners (polling mode)...');

  // Chạy ngay 1 lần đầu tiên, sau đó lặp lại theo interval
  await pollOnce();
  pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);

  console.log(`✅ Event listeners registered (poll mỗi ${POLL_INTERVAL_MS / 1000}s):`);
  console.log('   - EscrowCreated   → link escrowIdOnChain');
  console.log('   - FundsDeposited  → LOCKED');
  console.log('   - ItemShipped     → log only');
  console.log('   - DisputeRaised   → DISPUTED');
  console.log('   - FundsReleased   → RELEASED');
  console.log('   - BuyerRefunded   → REFUNDED');
  console.log('   - EscrowCancelled → CANCELLED');
};

/**
 * Dừng polling (dùng khi shutdown server)
 */
const stopEventListeners = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  console.log('🛑 Event listeners stopped.');
};

module.exports = { startEventListeners, stopEventListeners };