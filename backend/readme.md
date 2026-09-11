# Backend Architecture Documentation

## 1. Overview

Backend của dự án **Decentralized Service Escrow Platform** được xây dựng bằng:

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Ethers.js
- Cloudinary
- Multer

Backend chịu trách nhiệm:

- Xác thực người dùng
- Quản lý escrow (service contract)
- Upload bằng chứng công việc
- Xử lý tranh chấp
- Gửi thông báo
- Đồng bộ dữ liệu blockchain
- Lưu lịch sử giao dịch

---

## 2. Backend Folder Structure

```text
backend/
├── package.json
├── server.js
├── app.js
├── .env
├── .gitignore
│
├── config/
│   ├── db.js
│   ├── cloudinary.js
│   └── blockchain.js
│
├── models/
│   ├── User.js
│   ├── Escrow.js
│   ├── Dispute.js
│   ├── TransactionLog.js
│   └── Notification.js
│
├── routes/
│   ├── auth.routes.js
│   ├── escrow.routes.js
│   ├── dispute.routes.js
│   ├── upload.routes.js
│   ├── transaction.routes.js
│   └── notification.routes.js
│
├── controllers/
│   ├── auth.controller.js
│   ├── escrow.controller.js
│   ├── dispute.controller.js
│   ├── upload.controller.js
│   ├── transaction.controller.js
│   └── notification.controller.js
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── error.middleware.js
│   └── upload.middleware.js
│
├── services/
│   ├── blockchain.service.js
│   ├── eventListener.service.js
│   ├── notification.service.js
│   └── fileStorage.service.js
│
├── utils/
│   ├── generateToken.js
│   ├── asyncHandler.js
│   └── constants.js
│
└── abi/
    └── EscrowContract.json
```

---

## 3. Architecture Pattern

```text
Route → Controller → Service → Model → Database / Blockchain
```

Ví dụ:

```text
POST /api/escrows
        ↓
escrow.routes.js
        ↓
escrow.controller.js
        ↓
blockchain.service.js
        ↓
Escrow Smart Contract
        ↓
Escrow Model - MongoDB
```

---

## 4. Folder Responsibilities

| Folder/File | Vai trò |
|---|---|
| `server.js` | Khởi động backend server |
| `app.js` | Cấu hình Express app, middleware, routes |
| `config/` | Cấu hình database, Cloudinary, blockchain |
| `models/` | Định nghĩa MongoDB schemas |
| `routes/` | Khai báo API endpoints |
| `controllers/` | Xử lý request/response |
| `middleware/` | Middleware xác thực, phân quyền, upload, lỗi |
| `services/` | Xử lý business logic, blockchain, notification, file storage |
| `utils/` | Hàm tiện ích dùng chung |
| `abi/` | Lưu ABI của smart contract |

---

## 5. Development Responsibilities

Backend được chia thành 3 module lớn, mỗi thành viên chịu trách nhiệm một nhóm chức năng độc lập.

---

### Backend 1: Core API & Database

#### Responsibilities

Backend 1 phụ trách:

- Khởi tạo server và kết nối MongoDB
- Authentication
- User Management
- Escrow APIs (Service Contract)
- JWT Authentication Middleware
- Role-based Authorization

#### Files Responsible

```text
server.js
config/db.js

models/
├── User.js
└── Escrow.js

routes/
├── auth.routes.js
└── escrow.routes.js

controllers/
├── auth.controller.js
└── escrow.controller.js

middleware/
├── auth.middleware.js
└── role.middleware.js
```

#### APIs Implemented

```http
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
PATCH /api/auth/wallet

POST  /api/escrows
GET   /api/escrows
GET   /api/escrows/:id
PATCH /api/escrows/:id/submit
PATCH /api/escrows/:id/approve
```

#### Expected Output

- User (client/freelancer) đăng ký / đăng nhập
- Client tạo escrow (service contract)
- Client/Freelancer xem danh sách escrow
- Freelancer submit deliverable link
- Client approve công việc → trigger release funds

---

### Backend 2: Dispute & File Storage

#### Responsibilities

Backend 2 phụ trách:

- Upload file (bằng chứng công việc, ảnh deliverable)
- Dispute APIs
- Notification APIs

#### Files Responsible

```text
models/
├── Dispute.js
└── Notification.js

routes/
├── dispute.routes.js
├── upload.routes.js
└── notification.routes.js

controllers/
├── dispute.controller.js
├── upload.controller.js
└── notification.controller.js

config/
└── cloudinary.js

services/
├── fileStorage.service.js
└── notification.service.js

middleware/
└── upload.middleware.js
```

#### APIs Implemented

```http
POST /api/upload

POST  /api/disputes
GET   /api/disputes
GET   /api/disputes/:id
POST  /api/disputes/:id/response
PATCH /api/disputes/:id/resolve

GET   /api/notifications
PATCH /api/notifications/:id/read
```

#### Expected Output

- Client mở tranh chấp khi không hài lòng
- Client/Freelancer upload bằng chứng
- Freelancer phản hồi tranh chấp
- Admin xem và xử lý dispute
- User nhận thông báo trong app

---

### Backend 3: Blockchain Integration

#### Responsibilities

Backend 3 phụ trách:

- Kết nối smart contract
- Đọc trạng thái escrow từ blockchain
- Gọi hàm release/refund
- Lắng nghe event blockchain
- Lưu transaction logs

#### Files Responsible

```text
config/
└── blockchain.js

models/
└── TransactionLog.js

routes/
└── transaction.routes.js

controllers/
└── transaction.controller.js

services/
├── blockchain.service.js
└── eventListener.service.js

abi/
└── EscrowContract.json
```

#### Core Functions

```javascript
getEscrowStatus(escrowId)
releaseFunds(escrowId)
refundClient(escrowId)
```

#### Events Listened

```text
EscrowCreated
FundsDeposited
DisputeRaised
FundsReleased
ClientRefunded
AutoReleased
```

#### Event → Database Status

| Blockchain Event | Escrow Status |
|---|---|
| `FundsDeposited` | `LOCKED` |
| `DisputeRaised` | `DISPUTED` |
| `FundsReleased` | `RELEASED` |
| `ClientRefunded` | `REFUNDED` |

#### TransactionLog Format

```javascript
{
  escrowId,
  eventName,
  txHash,
  blockNumber,
  walletAddress,
  amount,
  createdAt
}
```

#### Expected Output

- Backend đọc được smart contract
- Backend nghe event blockchain
- Backend tự cập nhật trạng thái escrow
- Backend lưu txHash và lịch sử giao dịch
- Admin resolve dispute có thể gọi contract

---

## 6. Shared Escrow Status

Tất cả backend phải dùng thống nhất bộ status sau:

```text
CREATED
LOCKED
IN_PROGRESS
SUBMITTED
DISPUTED
RELEASED
REFUNDED
CANCELLED
```

---

## 7. Integration Workflow

```text
Backend 1: Client tạo escrow trong database
↓
Frontend gọi smart contract deposit
↓
Backend 3 nghe event FundsDeposited
↓
Backend 3 cập nhật Escrow.status = LOCKED
↓
Backend 1 cho Freelancer xem escrow đã LOCKED
↓
Freelancer thực hiện công việc và submit deliverable link
↓
Client review và approve hoặc mở dispute
↓
Backend 2 lưu dispute và evidence nếu có
↓
Admin xử lý dispute
↓
Backend 3 gọi smart contract refund/release
↓
Backend 3 nghe event → cập nhật status
↓
Backend 2 gửi notification
```

---

## 8. Branch Convention

```text
main
dev
feature/auth-escrow
feature/dispute-upload
feature/blockchain-listener
```

| Người | Branch |
|---|---|
| Backend 1 | `feature/auth-escrow` |
| Backend 2 | `feature/dispute-upload` |
| Backend 3 | `feature/blockchain-listener` |

Tất cả Pull Request merge vào:

```text
dev
```

---

## 9. Setup & Run

```bash
cd backend
npm install
npm run dev
```

---

## 10. Environment Variables

```env
PORT=5000
MONGO_URI=
JWT_SECRET=
AUTO_RELEASE_DAYS=7

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RPC_URL=
PRIVATE_KEY=
ESCROW_CONTRACT_ADDRESS=
```

---

## 11. Coding Rules

- Không code trực tiếp trên `main` hoặc `dev`.
- Mỗi người code trên branch riêng.
- Route chỉ định tuyến.
- Controller xử lý request/response.
- Service xử lý business logic.
- Model chỉ chứa schema.
- Middleware dùng cho xác thực, phân quyền, upload và lỗi.
- Nếu đổi cấu trúc thư mục, phải cập nhật `backend/README.md`.
