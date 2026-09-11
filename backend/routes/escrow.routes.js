// ============================================================
// routes/escrow.routes.js — Định nghĩa các escrow endpoints
//
// Mount vào /api/escrows trong app.js
// Tất cả routes đều cần đăng nhập (protect)
// Một số routes có thêm phân quyền theo role (authorize)
// ============================================================

const express = require('express');
const {
  createEscrow,
  getEscrows,
  getEscrowById,
  submitDeliverable,
  approveWork,
} = require('../controllers/escrow.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// POST /api/escrows — Tạo escrow (chỉ client)
router.post('/', protect, authorize('client'), createEscrow);

// GET /api/escrows — Xem danh sách (client, freelancer, admin đều xem được)
router.get('/', protect, getEscrows);

// GET /api/escrows/:id — Xem chi tiết (kiểm tra quyền trong controller)
router.get('/:id', protect, getEscrowById);

// PATCH /api/escrows/:id/submit — Freelancer submit deliverable
router.patch('/:id/submit', protect, authorize('freelancer'), submitDeliverable);

// PATCH /api/escrows/:id/approve — Client approve công việc
router.patch('/:id/approve', protect, authorize('client'), approveWork);

module.exports = router;
