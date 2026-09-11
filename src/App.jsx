import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Code2,
  Coins,
  CreditCard,
  FileCheck2,
  FileText,
  Fingerprint,
  Gavel,
  Github,
  Globe2,
  GraduationCap,
  Home,
  Layers3,
  LockKeyhole,
  LogIn,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  Moon,
  Palette,
  PenTool,
  Radio,
  ReceiptText,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  TrendingUp,
  UploadCloud,
  User,
  Users,
  Vote,
  Wallet,
  X,
  Zap
} from "lucide-react";

const routes = [
  "landing",
  "login",
  "register",
  "dashboard",
  "create",
  "details",
  "submit",
  "approval",
  "disputes",
  "wallet",
  "notifications",
  "profile"
];

const routeSet = new Set(routes);

const translations = {
  en: {
    brand: "EscrowX",
    product: "Decentralized Service Escrow Platform",
    tagline: "Smart escrow for freelance and digital service payments.",
    nav: {
      landing: "Landing Page",
      login: "Login",
      register: "Register",
      dashboard: "Dashboard",
      create: "Create Job",
      details: "Escrow Details",
      submit: "Deliverables",
      approval: "Approval",
      disputes: "Dispute Center",
      wallet: "Wallet",
      notifications: "Notifications",
      profile: "User Profile"
    },
    common: {
      createJob: "Create Job",
      viewDashboard: "View Dashboard",
      connectWallet: "Connect MetaMask",
      signTransaction: "Sign Transaction",
      createEscrow: "Create Escrow",
      submitWork: "Submit Work",
      approveWork: "Approve Work",
      openDispute: "Open Dispute",
      voteRelease: "Vote Release Funds",
      voteRefund: "Vote Refund Client",
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      confirmPassword: "Confirm Password",
      walletAddress: "Wallet Address",
      role: "Role",
      client: "Client",
      freelancer: "Freelancer",
      amount: "Amount",
      deadline: "Deadline",
      status: "Status",
      service: "Service",
      action: "Action",
      contract: "Smart Contract",
      copied: "Copied"
    },
    status: {
      created: "CREATED",
      deposited: "DEPOSITED",
      locked: "LOCKED",
      delivered: "DELIVERED",
      approved: "APPROVED",
      released: "RELEASED",
      active: "Active",
      completed: "Completed",
      pending: "Pending",
      inProgress: "In progress",
      submitted: "Submitted",
      reviewing: "Reviewing",
      resolved: "Resolved",
      open: "Open",
      refunded: "Refunded",
      connected: "Connected",
      disconnected: "Disconnected"
    },
    landing: {
      title: "Smart Escrow for Secure Freelance Payments",
      subtitle: "Client deposits stablecoins into smart contracts. Funds are automatically released when work is approved.",
      heroEyebrow: "Web3 SaaS escrow for services",
      metrics: [
        ["Total Escrow Volume", "$2.84M"],
        ["Active Jobs", "1,248"],
        ["Dispute Resolution Rate", "97.8%"],
        ["Average Completion Time", "3.6 days"]
      ],
      howTitle: "How it works",
      howSubtitle: "A transparent payment workflow from job creation to final settlement.",
      steps: [
        ["Create Service Contract", "Client defines scope, budget, deadline, and freelancer wallet."],
        ["Deposit Stablecoins", "USDT or VNDC is locked inside an escrow smart contract."],
        ["Freelancer Delivers Work", "Deliverables and proof are submitted for client review."],
        ["Client Approves", "Approval triggers the release transaction preview."],
        ["Funds Released", "The smart contract pays the freelancer automatically."]
      ],
      categoriesTitle: "Service categories",
      categoriesSubtitle: "Built for freelance and digital service workflows.",
      benefitsTitle: "Why EscrowX",
      benefits: [
        ["Trustless payments", "Funds are locked by code before work starts."],
        ["Transparent workflow", "Every milestone has a readable contract state."],
        ["Faster settlement", "Approved work can be paid without manual banking delays."],
        ["Reduced fraud", "Neither side can quietly move escrowed funds."],
        ["Blockchain verification", "Wallets, balances, and signatures are modeled as on-chain actions."]
      ]
    },
    dashboard: {
      title: "Escrow Operations Dashboard",
      subtitle: "Monitor freelance service contracts, settlement status, and dispute exposure.",
      cards: [
        ["Total Escrow Value", "842,500 USDT", "+18.4% this month"],
        ["Active Jobs", "128", "42 awaiting delivery"],
        ["Completed Jobs", "1,920", "99.1% success rate"],
        ["Open Disputes", "7", "3 jury votes pending"]
      ],
      tabs: {
        active: "Active Jobs",
        completed: "Completed Jobs",
        disputes: "Disputes"
      },
      feedTitle: "Live contract feed",
      adoptionTitle: "Service demand"
    },
    auth: {
      loginTitle: "Access EscrowX",
      loginSubtitle: "Sign in with email or connect MetaMask to continue.",
      registerTitle: "Create your escrow identity",
      registerSubtitle: "Set up a client or freelancer profile with wallet-ready credentials.",
      emailMethod: "Email + Password",
      walletMethod: "MetaMask Wallet",
      roleHelp: "Choose how you will use EscrowX first. You can switch later."
    },
    create: {
      title: "Create Service Escrow",
      subtitle: "Define the freelance job and lock stablecoins before work begins.",
      serviceName: "Service Name",
      description: "Job Description",
      budget: "Budget",
      freelancerWallet: "Freelancer Wallet Address",
      deadline: "Deadline",
      previewTitle: "Contract Preview",
      previewCopy: "EscrowX will prepare a smart contract draft and simulate a stablecoin deposit request."
    },
    details: {
      title: "Escrow Details",
      subtitle: "Smart contract state, parties, value, and workflow timeline.",
      jobId: "Job ID",
      client: "Client",
      freelancer: "Freelancer",
      escrowAmount: "Escrow Amount",
      contractAddress: "Smart Contract Address",
      workflow: "Workflow Timeline",
      timelineNote: "Labels wrap safely on desktop and mobile."
    },
    submit: {
      title: "Deliverable Submission",
      subtitle: "Freelancer submits work proof before the client approval window begins.",
      deliverableUrl: "Deliverable URL",
      workProof: "Work Proof",
      notes: "Notes",
      proofPlaceholder: "IPFS hash, Figma link, GitHub commit, or signed delivery note"
    },
    approval: {
      title: "Approval Center",
      subtitle: "Client reviews submitted work and decides whether to release or dispute funds.",
      deliverableTitle: "Submitted deliverable",
      qualityScore: "Review confidence",
      approvalCopy: "Approving work simulates a signed release transaction to the freelancer."
    },
    dispute: {
      title: "Dispute Center",
      subtitle: "Review evidence, vote on the outcome, and keep funds locked until resolution.",
      evidence: "Submitted Evidence",
      screenshots: "Screenshots",
      deliverables: "Deliverable Links",
      juryProgress: "Jury voting progress",
      outcome: "Outcome simulation",
      outcomeCopy: "Decision animation appears after a release or refund vote."
    },
    wallet: {
      title: "Wallet Integration",
      subtitle: "Mock MetaMask connection, balances, and signing flow.",
      address: "Wallet address",
      connection: "Connection status",
      balance: "Wallet Balance",
      eth: "ETH",
      usdt: "USDT",
      modalTitle: "Simulated Transaction Approval",
      method: "Method",
      network: "Network",
      gas: "Gas sponsor",
      approveBiometric: "Approve with biometric"
    },
    notifications: {
      title: "Notifications",
      subtitle: "Toast events for escrow deposits, submissions, approvals, releases, and disputes.",
      triggerDemo: "Trigger demo toast",
      deposit: ["Deposit Success", "650 USDT has been locked in the service escrow contract."],
      submitted: ["Work Submitted", "Deliverables were submitted for client review."],
      approved: ["Work Approved", "Client approval is ready for transaction signing."],
      released: ["Funds Released", "Smart contract released payment to the freelancer."],
      disputeOpened: ["Dispute Opened", "Funds remain locked while evidence is reviewed."],
      disputeResolved: ["Dispute Resolved", "Jury decision finalized the escrow outcome."]
    },
    profile: {
      title: "User Profile",
      subtitle: "Reputation, wallet identity, and service escrow performance.",
      name: "Nguyen An",
      role: "Freelancer",
      reputation: "Reputation Score",
      completedJobs: "Completed Jobs",
      successRate: "Success Rate",
      verification: "Verification level",
      security: "Security settings"
    },
    footer: {
      company: "Company",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      rights: "© 2026 EscrowX. Decentralized service escrow platform prototype."
    }
  },
  vi: {
    brand: "EscrowX",
    product: "Nền tảng ký quỹ dịch vụ phi tập trung",
    tagline: "Ký quỹ thông minh cho thanh toán freelance và dịch vụ số.",
    nav: {
      landing: "Trang chủ",
      login: "Đăng nhập",
      register: "Đăng ký",
      dashboard: "Bảng điều khiển",
      create: "Tạo công việc",
      details: "Chi tiết ký quỹ",
      submit: "Nộp sản phẩm",
      approval: "Phê duyệt",
      disputes: "Trung tâm tranh chấp",
      wallet: "Ví",
      notifications: "Thông báo",
      profile: "Hồ sơ người dùng"
    },
    common: {
      createJob: "Tạo công việc",
      viewDashboard: "Xem bảng điều khiển",
      connectWallet: "Kết nối MetaMask",
      signTransaction: "Ký giao dịch",
      createEscrow: "Tạo ký quỹ",
      submitWork: "Nộp sản phẩm",
      approveWork: "Phê duyệt sản phẩm",
      openDispute: "Mở tranh chấp",
      voteRelease: "Bỏ phiếu giải ngân",
      voteRefund: "Bỏ phiếu hoàn tiền",
      email: "Email",
      password: "Mật khẩu",
      fullName: "Họ và tên",
      confirmPassword: "Xác nhận mật khẩu",
      walletAddress: "Địa chỉ ví",
      role: "Vai trò",
      client: "Khách hàng",
      freelancer: "Freelancer",
      amount: "Số tiền",
      deadline: "Hạn hoàn thành",
      status: "Trạng thái",
      service: "Dịch vụ",
      action: "Thao tác",
      contract: "Hợp đồng thông minh",
      copied: "Đã sao chép"
    },
    status: {
      created: "ĐÃ TẠO",
      deposited: "ĐÃ NẠP TIỀN",
      locked: "ĐANG KHÓA",
      delivered: "ĐÃ BÀN GIAO",
      approved: "ĐÃ PHÊ DUYỆT",
      released: "ĐÃ GIẢI NGÂN",
      active: "Đang hoạt động",
      completed: "Đã hoàn thành",
      pending: "Đang chờ",
      inProgress: "Đang thực hiện",
      submitted: "Đã nộp",
      reviewing: "Đang xem xét",
      resolved: "Đã xử lý",
      open: "Đang mở",
      refunded: "Đã hoàn tiền",
      connected: "Đã kết nối",
      disconnected: "Chưa kết nối"
    },
    landing: {
      title: "Ký quỹ thông minh cho thanh toán dịch vụ freelance an toàn",
      subtitle: "Khách hàng nạp stablecoin vào hợp đồng thông minh. Tiền được tự động giải ngân khi sản phẩm được phê duyệt.",
      heroEyebrow: "Web3 SaaS cho ký quỹ dịch vụ",
      metrics: [
        ["Tổng giá trị ký quỹ", "2,84 triệu USD"],
        ["Công việc đang chạy", "1.248"],
        ["Tỷ lệ xử lý tranh chấp", "97,8%"],
        ["Thời gian hoàn thành trung bình", "3,6 ngày"]
      ],
      howTitle: "Cách hoạt động",
      howSubtitle: "Quy trình thanh toán minh bạch từ lúc tạo việc đến khi tất toán.",
      steps: [
        ["Tạo hợp đồng dịch vụ", "Khách hàng nhập phạm vi, ngân sách, hạn và ví freelancer."],
        ["Nạp stablecoin", "USDT hoặc VNDC được khóa trong hợp đồng ký quỹ."],
        ["Freelancer bàn giao", "Sản phẩm và bằng chứng được gửi để khách hàng xem xét."],
        ["Khách hàng phê duyệt", "Phê duyệt sẽ tạo giao dịch giải ngân cần ký."],
        ["Tiền được giải ngân", "Hợp đồng thông minh tự động trả tiền cho freelancer."]
      ],
      categoriesTitle: "Danh mục dịch vụ",
      categoriesSubtitle: "Phù hợp cho freelance và các dịch vụ số.",
      benefitsTitle: "Vì sao chọn EscrowX",
      benefits: [
        ["Thanh toán không cần niềm tin tuyệt đối", "Tiền được khóa bằng mã trước khi bắt đầu làm việc."],
        ["Quy trình minh bạch", "Mỗi mốc đều có trạng thái hợp đồng dễ hiểu."],
        ["Tất toán nhanh hơn", "Sản phẩm được duyệt có thể thanh toán không chờ ngân hàng."],
        ["Giảm gian lận", "Hai bên không thể tự ý rút tiền đang ký quỹ."],
        ["Xác thực blockchain", "Ví, số dư và chữ ký được mô phỏng như thao tác on-chain."]
      ]
    },
    dashboard: {
      title: "Bảng điều khiển ký quỹ",
      subtitle: "Theo dõi hợp đồng dịch vụ, trạng thái tất toán và rủi ro tranh chấp.",
      cards: [
        ["Tổng giá trị ký quỹ", "842.500 USDT", "+18,4% tháng này"],
        ["Công việc đang chạy", "128", "42 việc đang chờ bàn giao"],
        ["Công việc hoàn thành", "1.920", "Tỷ lệ thành công 99,1%"],
        ["Tranh chấp mở", "7", "3 lượt bỏ phiếu đang chờ"]
      ],
      tabs: {
        active: "Công việc đang chạy",
        completed: "Công việc hoàn thành",
        disputes: "Tranh chấp"
      },
      feedTitle: "Luồng hợp đồng trực tiếp",
      adoptionTitle: "Nhu cầu dịch vụ"
    },
    auth: {
      loginTitle: "Truy cập EscrowX",
      loginSubtitle: "Đăng nhập bằng email hoặc kết nối MetaMask để tiếp tục.",
      registerTitle: "Tạo danh tính ký quỹ",
      registerSubtitle: "Thiết lập hồ sơ khách hàng hoặc freelancer với thông tin ví.",
      emailMethod: "Email + mật khẩu",
      walletMethod: "Ví MetaMask",
      roleHelp: "Chọn cách bạn dùng EscrowX trước. Bạn có thể đổi sau."
    },
    create: {
      title: "Tạo ký quỹ dịch vụ",
      subtitle: "Mô tả công việc freelance và khóa stablecoin trước khi bắt đầu.",
      serviceName: "Tên dịch vụ",
      description: "Mô tả công việc",
      budget: "Ngân sách",
      freelancerWallet: "Địa chỉ ví freelancer",
      deadline: "Hạn hoàn thành",
      previewTitle: "Xem trước hợp đồng",
      previewCopy: "EscrowX sẽ tạo bản nháp hợp đồng thông minh và mô phỏng yêu cầu nạp stablecoin."
    },
    details: {
      title: "Chi tiết ký quỹ",
      subtitle: "Trạng thái hợp đồng, các bên tham gia, giá trị và timeline xử lý.",
      jobId: "Mã công việc",
      client: "Khách hàng",
      freelancer: "Freelancer",
      escrowAmount: "Số tiền ký quỹ",
      contractAddress: "Địa chỉ hợp đồng",
      workflow: "Timeline quy trình",
      timelineNote: "Nhãn trạng thái tự xuống dòng trên desktop và mobile."
    },
    submit: {
      title: "Nộp sản phẩm",
      subtitle: "Freelancer gửi bằng chứng trước khi khách hàng phê duyệt.",
      deliverableUrl: "Đường dẫn sản phẩm",
      workProof: "Bằng chứng công việc",
      notes: "Ghi chú",
      proofPlaceholder: "IPFS hash, link Figma, commit GitHub hoặc biên bản bàn giao"
    },
    approval: {
      title: "Trung tâm phê duyệt",
      subtitle: "Khách hàng xem sản phẩm và quyết định giải ngân hoặc mở tranh chấp.",
      deliverableTitle: "Sản phẩm đã nộp",
      qualityScore: "Độ tin cậy đánh giá",
      approvalCopy: "Phê duyệt sẽ mô phỏng giao dịch giải ngân có chữ ký cho freelancer."
    },
    dispute: {
      title: "Trung tâm tranh chấp",
      subtitle: "Xem bằng chứng, bỏ phiếu kết quả và giữ tiền khóa đến khi xử lý xong.",
      evidence: "Bằng chứng đã nộp",
      screenshots: "Ảnh chụp màn hình",
      deliverables: "Liên kết sản phẩm",
      juryProgress: "Tiến độ bỏ phiếu của hội đồng",
      outcome: "Mô phỏng kết quả",
      outcomeCopy: "Hiệu ứng quyết định xuất hiện sau khi bỏ phiếu giải ngân hoặc hoàn tiền."
    },
    wallet: {
      title: "Tích hợp ví",
      subtitle: "Mô phỏng kết nối MetaMask, số dư và quy trình ký giao dịch.",
      address: "Địa chỉ ví",
      connection: "Trạng thái kết nối",
      balance: "Số dư ví",
      eth: "ETH",
      usdt: "USDT",
      modalTitle: "Mô phỏng phê duyệt giao dịch",
      method: "Phương thức",
      network: "Mạng",
      gas: "Nhà tài trợ phí gas",
      approveBiometric: "Duyệt bằng sinh trắc học"
    },
    notifications: {
      title: "Thông báo",
      subtitle: "Toast cho nạp tiền, nộp sản phẩm, phê duyệt, giải ngân và tranh chấp.",
      triggerDemo: "Kích hoạt toast mẫu",
      deposit: ["Nạp tiền thành công", "650 USDT đã được khóa trong hợp đồng ký quỹ dịch vụ."],
      submitted: ["Đã nộp sản phẩm", "Sản phẩm đã được gửi để khách hàng xem xét."],
      approved: ["Sản phẩm được phê duyệt", "Phê duyệt của khách hàng đã sẵn sàng để ký giao dịch."],
      released: ["Đã giải ngân", "Hợp đồng thông minh đã trả tiền cho freelancer."],
      disputeOpened: ["Đã mở tranh chấp", "Tiền vẫn được khóa trong khi bằng chứng được xem xét."],
      disputeResolved: ["Tranh chấp đã xử lý", "Quyết định của hội đồng đã hoàn tất kết quả ký quỹ."]
    },
    profile: {
      title: "Hồ sơ người dùng",
      subtitle: "Uy tín, định danh ví và hiệu suất dịch vụ ký quỹ.",
      name: "Nguyễn An",
      role: "Freelancer",
      reputation: "Điểm uy tín",
      completedJobs: "Công việc hoàn thành",
      successRate: "Tỷ lệ thành công",
      verification: "Cấp xác thực",
      security: "Cài đặt bảo mật"
    },
    footer: {
      company: "Công ty",
      terms: "Điều khoản dịch vụ",
      privacy: "Chính sách bảo mật",
      rights: "© 2026 EscrowX. Nguyên mẫu nền tảng ký quỹ dịch vụ phi tập trung."
    }
  }
};

const serviceCategories = [
  { icon: Palette, en: "UI/UX Design", vi: "Thiết kế UI/UX" },
  { icon: PenTool, en: "Logo Design", vi: "Thiết kế logo" },
  { icon: Code2, en: "Web Development", vi: "Phát triển web" },
  { icon: ShieldCheck, en: "Smart Contract Development", vi: "Phát triển smart contract" },
  { icon: FileText, en: "Content Writing", vi: "Viết nội dung" },
  { icon: Globe2, en: "Translation", vi: "Dịch thuật" },
  { icon: Megaphone, en: "Marketing", vi: "Marketing" },
  { icon: GraduationCap, en: "Online Tutoring", vi: "Gia sư trực tuyến" }
];

const jobs = {
  active: [
    {
      id: "JOB-2401",
      service: { en: "Logo Design for Startup", vi: "Thiết kế logo cho startup" },
      freelancer: "Linh Dao",
      amount: "450 USDT",
      deadline: "Jun 24, 2026",
      status: "locked"
    },
    {
      id: "JOB-2402",
      service: { en: "Landing Page Development", vi: "Phát triển landing page" },
      freelancer: "Minh Pham",
      amount: "1,250 USDT",
      deadline: "Jun 28, 2026",
      status: "inProgress"
    },
    {
      id: "JOB-2403",
      service: { en: "Smart Contract Audit", vi: "Kiểm toán smart contract" },
      freelancer: "Quang Le",
      amount: "2,800 USDT",
      deadline: "Jul 02, 2026",
      status: "submitted"
    }
  ],
  completed: [
    {
      id: "JOB-2394",
      service: { en: "Social Media Content Package", vi: "Gói nội dung mạng xã hội" },
      freelancer: "Hoa Tran",
      amount: "620 USDT",
      result: "released",
      tx: "0x7af3...19c2"
    },
    {
      id: "JOB-2388",
      service: { en: "English-Vietnamese Translation", vi: "Dịch Anh - Việt" },
      freelancer: "An Nguyen",
      amount: "320 USDT",
      result: "released",
      tx: "0xd41b...62aa"
    }
  ],
  disputes: [
    {
      id: "JOB-2379",
      service: { en: "Smart Contract Audit", vi: "Kiểm toán smart contract" },
      freelancer: "Bao Nguyen",
      amount: "1,900 USDT",
      status: "reviewing"
    },
    {
      id: "JOB-2365",
      service: { en: "Landing Page Development", vi: "Phát triển landing page" },
      freelancer: "Mai Ho",
      amount: "980 USDT",
      status: "open"
    }
  ]
};

const feed = [
  { en: "JOB-2401 locked 450 USDT", vi: "JOB-2401 đã khóa 450 USDT", tone: "cyan" },
  { en: "JOB-2403 submitted audit report", vi: "JOB-2403 đã nộp báo cáo kiểm toán", tone: "violet" },
  { en: "JOB-2394 released funds to freelancer", vi: "JOB-2394 đã giải ngân cho freelancer", tone: "emerald" },
  { en: "JOB-2379 entered jury review", vi: "JOB-2379 chuyển sang hội đồng xem xét", tone: "amber" }
];

const demand = [
  ["Web Development", 34],
  ["Design", 26],
  ["Smart Contracts", 18],
  ["Content", 12],
  ["Translation", 10]
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function text(value, language) {
  if (typeof value === "string") return value;
  return value?.[language] || value?.en || "";
}

function getInitialRoute() {
  if (typeof window === "undefined") return "landing";
  const route = window.location.hash.replace(/^#\/?/, "") || "landing";
  return routeSet.has(route) ? route : "landing";
}

function routeHash(route) {
  return route === "landing" ? "#/" : `#/${route}`;
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return fallback;
    return window.localStorage.getItem(key) || fallback;
  });

  useEffect(() => {
    window.localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue];
}

function getTheme(mode) {
  const isDark = mode === "dark";
  return {
    isDark,
    page: isDark
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-50 text-slate-950",
    background: isDark
      ? "bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(59,130,246,0.2),transparent_26%),linear-gradient(135deg,#020617_0%,#071426_48%,#020617_100%)]"
      : "bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eef6ff_52%,#f8fafc_100%)]",
    sidebar: isDark
      ? "border-white/10 bg-slate-950/78 backdrop-blur-xl"
      : "border-slate-200 bg-white/88 backdrop-blur-xl",
    header: isDark
      ? "border-white/10 bg-slate-950/72 backdrop-blur-xl"
      : "border-slate-200 bg-white/80 backdrop-blur-xl",
    card: isDark
      ? "border-white/10 bg-slate-900/58 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl"
      : "border-slate-200 bg-white/92 text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-xl",
    soft: isDark ? "border-white/10 bg-white/7" : "border-slate-200 bg-slate-50",
    softHover: isDark ? "hover:border-cyan-300/30 hover:bg-cyan-300/8" : "hover:border-blue-200 hover:bg-blue-50",
    heading: isDark ? "text-white" : "text-slate-950",
    text: isDark ? "text-slate-100" : "text-slate-900",
    muted: isDark ? "text-slate-400" : "text-slate-600",
    faint: isDark ? "text-slate-500" : "text-slate-500",
    border: isDark ? "border-white/10" : "border-slate-200",
    accentText: isDark ? "text-cyan-300" : "text-blue-700",
    accentBg: isDark
      ? "border-cyan-300/35 bg-cyan-300 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.28)]"
      : "border-blue-600 bg-blue-600 text-white shadow-[0_14px_26px_rgba(37,99,235,0.22)]",
    input: isDark
      ? "border-white/10 bg-slate-950/60 text-slate-100 placeholder:text-slate-500 caret-cyan-400 selection:bg-cyan-300 selection:text-slate-950 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 caret-blue-600 selection:bg-blue-200 selection:text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/35"
  };
}

function Button({ children, icon: Icon, theme, variant = "primary", size = "md", className = "", type = "button", ...props }) {
  const variants = {
    primary: theme.isDark
      ? "border border-cyan-300/40 bg-cyan-400 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.28)] hover:bg-cyan-300"
      : "border border-blue-600 bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.2)] hover:bg-blue-700",
    secondary: theme.isDark
      ? "border border-white/15 bg-white/8 text-slate-100 hover:border-cyan-300/45 hover:bg-cyan-300/10"
      : "border border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50",
    ghost: theme.isDark ? "text-slate-300 hover:bg-white/8 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    danger: "border border-rose-400/45 bg-rose-500/90 text-white hover:bg-rose-500",
    success: "border border-emerald-300/40 bg-emerald-400 text-slate-950 hover:bg-emerald-300"
  };
  const sizes = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-12 px-5 text-base"
  };

  return (
    <button
      type={type}
      className={classNames(
        "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="min-w-0">{children}</span>
    </button>
  );
}

function Card({ children, theme, className = "" }) {
  return (
    <motion.div
      className={classNames("rounded-lg border p-5", theme.card, className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function Badge({ children, theme, tone = "neutral", className = "" }) {
  const tones = {
    neutral: theme.isDark ? "border-slate-400/20 bg-slate-400/10 text-slate-300" : "border-slate-300 bg-slate-100 text-slate-700",
    cyan: theme.isDark ? "border-cyan-300/25 bg-cyan-400/12 text-cyan-200" : "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-300/25 bg-emerald-400/12 text-emerald-500",
    violet: "border-violet-300/25 bg-violet-400/12 text-violet-500",
    amber: "border-amber-300/25 bg-amber-400/12 text-amber-600",
    rose: "border-rose-300/25 bg-rose-400/12 text-rose-500"
  };

  return (
    <span className={classNames("inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

function Field({ label, icon: Icon, theme, children }) {
  return (
    <label className={classNames("grid gap-2 text-sm font-bold", theme.text)}>
      <span className="flex items-center gap-2">
        {Icon ? <Icon className={classNames("h-4 w-4", theme.accentText)} /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput({ theme, ...props }) {
  return <input className={classNames("min-h-11 rounded-lg border px-3 text-sm transition", theme.input)} {...props} />;
}

function SelectInput({ theme, ...props }) {
  return <select className={classNames("min-h-11 rounded-lg border px-3 text-sm transition", theme.input)} {...props} />;
}

function TextArea({ theme, ...props }) {
  return <textarea className={classNames("min-h-28 rounded-lg border px-3 py-3 text-sm transition", theme.input)} {...props} />;
}

function SectionTitle({ eyebrow, title, children, theme }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className={classNames("text-xs font-black uppercase tracking-[0.2em]", theme.accentText)}>{eyebrow}</p> : null}
        <h2 className={classNames("mt-1 text-2xl font-black leading-tight", theme.heading)}>{title}</h2>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, theme, tone = "cyan" }) {
  const toneClasses = {
    cyan: "from-cyan-400/22 to-blue-500/10 text-cyan-400",
    emerald: "from-emerald-400/22 to-cyan-500/10 text-emerald-400",
    violet: "from-violet-400/22 to-cyan-500/10 text-violet-400",
    amber: "from-amber-400/22 to-blue-500/10 text-amber-400"
  };
  return (
    <Card theme={theme} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={classNames("text-sm", theme.muted)}>{label}</p>
          <p className={classNames("mt-2 text-2xl font-black", theme.heading)}>{value}</p>
          <p className={classNames("mt-1 text-xs", theme.faint)}>{detail}</p>
        </div>
        <div className={classNames("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ value, theme }) {
  return (
    <div className={classNames("h-2 overflow-hidden rounded-full", theme.isDark ? "bg-white/8" : "bg-slate-200")}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function Sidebar({ c, theme, route, navigate, open, setOpen }) {
  const nav = [
    [Home, "landing"],
    [LogIn, "login"],
    [User, "register"],
    [LayoutDashboardIcon, "dashboard"],
    [Briefcase, "create"],
    [ReceiptText, "details"],
    [UploadCloud, "submit"],
    [CheckCircle2, "approval"],
    [Gavel, "disputes"],
    [Wallet, "wallet"],
    [Bell, "notifications"],
    [BadgeCheck, "profile"]
  ];

  const panel = (
    <aside className={classNames("flex h-full w-72 flex-col border-r", theme.sidebar)}>
      <div className="flex h-20 items-center gap-3 px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-300/35 bg-cyan-300/12 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <p className={classNames("text-lg font-black", theme.heading)}>{c.brand}</p>
          <p className={classNames("text-xs", theme.faint)}>{c.product}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {nav.map(([Icon, id]) => {
          const active = route === id;
          return (
            <button
              key={id}
              className={classNames(
                "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-bold transition",
                active ? theme.accentBg : `${theme.soft} ${theme.softHover} ${theme.muted}`
              )}
              onClick={() => {
                navigate(id);
                setOpen(false);
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{c.nav[id]}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4">
        <div className={classNames("rounded-lg border p-4", theme.soft)}>
          <p className={classNames("text-sm font-black", theme.heading)}>{c.tagline}</p>
          <p className={classNames("mt-2 text-xs leading-5", theme.faint)}>USDT / VNDC · Polygon · MetaMask</p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{panel}</div>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-slate-950/70" onClick={() => setOpen(false)} aria-label="Close menu" />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 26, stiffness: 260 }} className="relative h-full">
              {panel}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function LayoutDashboardIcon(props) {
  return <Layers3 {...props} />;
}

function Header({ c, theme, language, setLanguage, themeName, setThemeName, setMobileOpen, wallet, navigate }) {
  return (
    <header className={classNames("sticky top-0 z-20 border-b", theme.header)}>
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button theme={theme} icon={Menu} variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileOpen(true)} />
          <div className="min-w-0">
            <p className={classNames("truncate text-sm font-black", theme.heading)}>{c.brand}</p>
            <p className={classNames("truncate text-xs", theme.faint)}>{c.product}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={classNames("flex rounded-lg border p-1", theme.soft)}>
            {["en", "vi"].map((code) => (
              <button
                key={code}
                className={classNames(
                  "min-h-8 rounded-md px-3 text-xs font-black transition",
                  language === code ? theme.accentBg : theme.muted
                )}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            theme={theme}
            icon={themeName === "dark" ? Sun : Moon}
            variant="secondary"
            size="sm"
            onClick={() => setThemeName(themeName === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          />
          <Button theme={theme} icon={Wallet} size="sm" variant={wallet.connected ? "secondary" : "primary"} onClick={() => navigate("wallet")}>
            <span className="hidden sm:inline">{wallet.connected ? wallet.short : c.common.connectWallet}</span>
            <span className="sm:hidden">{wallet.connected ? "0x" : "Wallet"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function LandingPage({ c, theme, language, navigate }) {
  return (
    <div className="space-y-10">
      <section className={classNames("relative overflow-hidden rounded-lg border p-6 sm:p-8 lg:p-10", theme.card)}>
        <div className="hero-grid absolute inset-0 opacity-80" />
        <div className="absolute right-[-80px] top-[-120px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Badge theme={theme} tone="cyan">{c.landing.heroEyebrow}</Badge>
            <h1 className={classNames("mt-5 max-w-4xl text-4xl font-black leading-[1.12] tracking-tight sm:text-6xl", theme.heading)}>
              {c.landing.title}
            </h1>
            <p className={classNames("mt-5 max-w-2xl text-base leading-7 sm:text-lg", theme.muted)}>{c.landing.subtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button theme={theme} icon={Rocket} size="lg" onClick={() => navigate("create")}>{c.common.createJob}</Button>
              <Button theme={theme} icon={LayoutDashboardIcon} size="lg" variant="secondary" onClick={() => navigate("dashboard")}>{c.common.viewDashboard}</Button>
            </div>
          </motion.div>
          <motion.div
            className={classNames("rounded-lg border p-5", theme.soft)}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className={classNames("font-black", theme.heading)}>Escrow Contract Console</p>
                <p className={classNames("text-sm", theme.faint)}>0xE5c8...42F9 · Polygon</p>
              </div>
              <Badge theme={theme} tone="emerald">{c.status.locked}</Badge>
            </div>
            <div className="grid gap-3">
              {c.landing.steps.map(([label, detail], index) => (
                <motion.div
                  key={label}
                  className={classNames("flex items-start gap-3 rounded-lg border p-3", theme.soft)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.16 + index * 0.06 }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-300">
                    {index < 2 ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={classNames("text-sm font-black", theme.heading)}>{label}</p>
                    <p className={classNames("mt-1 text-xs leading-5", theme.faint)}>{detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {c.landing.metrics.map(([label, value], index) => (
          <StatCard key={label} theme={theme} icon={[CircleDollarSign, Briefcase, Gavel, TimerReset][index]} label={label} value={value} detail="EscrowX network" tone={["cyan", "emerald", "violet", "amber"][index]} />
        ))}
      </div>

      <Card theme={theme}>
        <SectionTitle theme={theme} eyebrow={c.landing.howSubtitle} title={c.landing.howTitle} />
        <div className="grid gap-3 lg:grid-cols-5">
          {c.landing.steps.map(([label, detail], index) => (
            <motion.div key={label} className={classNames("relative rounded-lg border p-4", theme.soft)} whileHover={{ y: -4 }}>
              <div className={classNames("mb-4 flex h-10 w-10 items-center justify-center rounded-lg", index < 2 ? "bg-cyan-400/12 text-cyan-300" : "bg-blue-400/12 text-blue-300")}>
                <span className="text-sm font-black">0{index + 1}</span>
              </div>
              <p className={classNames("font-black leading-tight", theme.heading)}>{label}</p>
              <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>{detail}</p>
              {index < c.landing.steps.length - 1 ? <ArrowRight className={classNames("absolute right-3 top-5 hidden h-4 w-4 lg:block", theme.accentText)} /> : null}
            </motion.div>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme} eyebrow={c.landing.categoriesSubtitle} title={c.landing.categoriesTitle} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map(({ icon: Icon, en, vi }) => (
            <motion.div key={en} className={classNames("rounded-lg border p-4 transition", theme.soft, theme.softHover)} whileHover={{ y: -4 }}>
              <Icon className={classNames("h-6 w-6", theme.accentText)} />
              <p className={classNames("mt-3 font-black", theme.heading)}>{language === "vi" ? vi : en}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme} title={c.landing.benefitsTitle} />
        <div className="grid gap-4 md:grid-cols-5">
          {c.landing.benefits.map(([label, detail], index) => (
            <div key={label} className={classNames("rounded-lg border p-4", theme.soft)}>
              <ShieldCheck className={classNames("h-5 w-5", index % 2 ? "text-blue-400" : "text-cyan-400")} />
              <p className={classNames("mt-3 font-black leading-tight", theme.heading)}>{label}</p>
              <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>{detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuthPage({ type, c, theme, navigate, addToast }) {
  const isLogin = type === "login";
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <Card theme={theme} className="p-6">
        <Badge theme={theme} tone="cyan">{isLogin ? c.auth.emailMethod : c.auth.roleHelp}</Badge>
        <h1 className={classNames("mt-5 text-3xl font-black", theme.heading)}>{isLogin ? c.auth.loginTitle : c.auth.registerTitle}</h1>
        <p className={classNames("mt-3 leading-7", theme.muted)}>{isLogin ? c.auth.loginSubtitle : c.auth.registerSubtitle}</p>
        <div className="mt-6 grid gap-3">
          <div className={classNames("rounded-lg border p-4", theme.soft)}>
            <div className="flex items-center gap-3">
              <Fingerprint className={classNames("h-5 w-5", theme.accentText)} />
              <p className={classNames("font-black", theme.heading)}>Smart wallet session</p>
            </div>
            <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>MetaMask, email login, and role-based dashboards are mocked for demo flow.</p>
          </div>
          <div className={classNames("rounded-lg border p-4", theme.soft)}>
            <div className="flex items-center gap-3">
              <LockKeyhole className={classNames("h-5 w-5", theme.accentText)} />
              <p className={classNames("font-black", theme.heading)}>Non-custodial escrow</p>
            </div>
            <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>Funds stay inside contract state until approval or dispute resolution.</p>
          </div>
        </div>
      </Card>
      <Card theme={theme} className="p-6">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addToast("approved");
            navigate("dashboard");
          }}
        >
          {!isLogin ? (
            <Field theme={theme} label={c.common.fullName} icon={User}>
              <TextInput theme={theme} placeholder="Nguyen An" />
            </Field>
          ) : null}
          <Field theme={theme} label={c.common.email} icon={Mail}>
            <TextInput theme={theme} type="email" placeholder="founder@escrowx.io" />
          </Field>
          <Field theme={theme} label={c.common.password} icon={LockKeyhole}>
            <TextInput theme={theme} type="password" placeholder="••••••••" />
          </Field>
          {!isLogin ? (
            <>
              <Field theme={theme} label={c.common.confirmPassword} icon={LockKeyhole}>
                <TextInput theme={theme} type="password" placeholder="••••••••" />
              </Field>
              <Field theme={theme} label={c.common.walletAddress} icon={Wallet}>
                <TextInput theme={theme} placeholder="0x8A91...A4F2" />
              </Field>
              <Field theme={theme} label={c.common.role} icon={Users}>
                <SelectInput theme={theme} defaultValue={c.common.client}>
                  <option>{c.common.client}</option>
                  <option>{c.common.freelancer}</option>
                </SelectInput>
              </Field>
            </>
          ) : null}
          <Button theme={theme} type="submit" icon={isLogin ? LogIn : Rocket}>{isLogin ? c.nav.login : c.nav.register}</Button>
          {isLogin ? <Button theme={theme} icon={Wallet} variant="secondary" onClick={() => navigate("wallet")}>{c.auth.walletMethod}</Button> : null}
        </form>
      </Card>
    </div>
  );
}

function DashboardPage({ c, theme, language, navigate }) {
  const [tab, setTab] = useState("active");
  return (
    <div className="space-y-6">
      <PageIntro title={c.dashboard.title} subtitle={c.dashboard.subtitle} theme={theme} />
      <div className="grid gap-4 md:grid-cols-4">
        {c.dashboard.cards.map(([label, value, detail], index) => (
          <StatCard key={label} theme={theme} icon={[CircleDollarSign, Briefcase, FileCheck2, AlertTriangle][index]} label={label} value={value} detail={detail} tone={["cyan", "emerald", "violet", "amber"][index]} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <Card theme={theme}>
          <SectionTitle theme={theme} title={c.nav.dashboard}>
            {["active", "completed", "disputes"].map((key) => (
              <Button key={key} theme={theme} size="sm" variant={tab === key ? "primary" : "secondary"} onClick={() => setTab(key)}>
                {c.dashboard.tabs[key]}
              </Button>
            ))}
          </SectionTitle>
          {tab === "active" ? <JobsTable type="active" c={c} theme={theme} language={language} navigate={navigate} /> : null}
          {tab === "completed" ? <JobsTable type="completed" c={c} theme={theme} language={language} navigate={navigate} /> : null}
          {tab === "disputes" ? <JobsTable type="disputes" c={c} theme={theme} language={language} navigate={navigate} /> : null}
        </Card>
        <div className="grid gap-4">
          <Card theme={theme}>
            <SectionTitle theme={theme} title={c.dashboard.feedTitle} />
            <div className="grid gap-3">
              {feed.map((item) => (
                <div key={item.en} className={classNames("flex items-center gap-3 rounded-lg border p-3", theme.soft)}>
                  <span className={classNames("h-2.5 w-2.5 rounded-full", item.tone === "cyan" ? "bg-cyan-400" : item.tone === "emerald" ? "bg-emerald-400" : item.tone === "amber" ? "bg-amber-400" : "bg-violet-400")} />
                  <p className={classNames("text-sm", theme.text)}>{text(item, language)}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card theme={theme}>
            <SectionTitle theme={theme} title={c.dashboard.adoptionTitle} />
            <div className="grid gap-4">
              {demand.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className={theme.text}>{label}</span>
                    <span className={theme.accentText}>{value}%</span>
                  </div>
                  <ProgressBar value={value} theme={theme} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function JobsTable({ type, c, theme, language, navigate }) {
  const rows = jobs[type];
  return (
    <div className={classNames("overflow-hidden rounded-lg border", theme.border)}>
      <div className={classNames("hidden grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] md:grid", theme.soft, theme.faint)}>
        <span>{c.common.service}</span>
        <span>{c.common.freelancer}</span>
        <span>{c.common.amount}</span>
        <span>{c.common.status}</span>
        <span>{c.common.action}</span>
      </div>
      {rows.map((job) => (
        <div key={job.id} className={classNames("grid gap-3 border-t px-4 py-4 md:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr] md:items-center", theme.border)}>
          <div>
            <p className={classNames("font-black", theme.heading)}>{text(job.service, language)}</p>
            <p className={classNames("text-xs", theme.faint)}>{job.id}</p>
          </div>
          <p className={classNames("text-sm", theme.muted)}>{job.freelancer}</p>
          <p className={classNames("font-bold", theme.accentText)}>{job.amount}</p>
          <Badge theme={theme} tone={type === "disputes" ? "amber" : job.status === "released" ? "emerald" : "cyan"}>{c.status[job.status || job.result]}</Badge>
          <Button theme={theme} size="sm" variant="secondary" icon={type === "disputes" ? Gavel : ReceiptText} onClick={() => navigate(type === "disputes" ? "disputes" : "details")}>
            {type === "disputes" ? c.nav.disputes : c.nav.details}
          </Button>
        </div>
      ))}
    </div>
  );
}

function PageIntro({ title, subtitle, theme }) {
  return (
    <div>
      <h1 className={classNames("text-3xl font-black tracking-tight", theme.heading)}>{title}</h1>
      <p className={classNames("mt-2 max-w-3xl leading-7", theme.muted)}>{subtitle}</p>
    </div>
  );
}

function CreateJobPage({ c, theme, navigate, addToast }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card theme={theme}>
        <PageIntro title={c.create.title} subtitle={c.create.subtitle} theme={theme} />
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addToast("deposit");
            navigate("details");
          }}
        >
          <Field theme={theme} label={c.create.serviceName} icon={Briefcase}>
            <TextInput theme={theme} defaultValue="Landing Page Development" />
          </Field>
          <Field theme={theme} label={c.create.description} icon={FileText}>
            <TextArea theme={theme} defaultValue="Build a responsive Web3 landing page for a SaaS launch with pricing, FAQ, and wallet CTA." />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field theme={theme} label={c.create.budget} icon={Coins}>
              <TextInput theme={theme} defaultValue="1,250 USDT" />
            </Field>
            <Field theme={theme} label={c.create.deadline} icon={Clock3}>
              <TextInput theme={theme} type="date" defaultValue="2026-06-28" />
            </Field>
            <Field theme={theme} label="Token" icon={CreditCard}>
              <SelectInput theme={theme} defaultValue="USDT">
                <option>USDT</option>
                <option>VNDC</option>
              </SelectInput>
            </Field>
          </div>
          <Field theme={theme} label={c.create.freelancerWallet} icon={Wallet}>
            <TextInput theme={theme} defaultValue="0x70A1...B9C4" />
          </Field>
          <Button theme={theme} type="submit" icon={Rocket}>{c.common.createEscrow}</Button>
        </form>
      </Card>
      <Card theme={theme}>
        <SectionTitle theme={theme} eyebrow={c.common.contract} title={c.create.previewTitle} />
        <div className={classNames("rounded-lg border p-4", theme.soft)}>
          <p className={classNames("text-sm leading-6", theme.muted)}>{c.create.previewCopy}</p>
          <div className="mt-5 grid gap-3 text-sm">
            {[
              ["Token", "USDT / VNDC"],
              ["Network", "Polygon"],
              [c.common.status, c.status.created],
              [c.common.contract, "0xE5c8...42F9"]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <span className={theme.faint}>{label}</span>
                <span className={classNames("text-right font-bold", theme.text)}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function EscrowDetailsPage({ c, theme, navigate }) {
  const workflow = ["created", "deposited", "locked", "delivered", "approved", "released"];
  return (
    <div className="space-y-6">
      <PageIntro title={c.details.title} subtitle={c.details.subtitle} theme={theme} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard theme={theme} icon={Briefcase} label={c.details.jobId} value="JOB-2402" detail="Landing Page Development" tone="cyan" />
        <StatCard theme={theme} icon={CircleDollarSign} label={c.details.escrowAmount} value="1,250 USDT" detail="Polygon" tone="emerald" />
        <StatCard theme={theme} icon={Clock3} label={c.common.deadline} value="Jun 28" detail="11 days remaining" tone="amber" />
        <StatCard theme={theme} icon={ShieldCheck} label={c.common.status} value={c.status.locked} detail="Contract funded" tone="violet" />
      </div>
      <Card theme={theme}>
        <SectionTitle theme={theme} eyebrow={c.details.timelineNote} title={c.details.workflow}>
          <Button theme={theme} icon={UploadCloud} variant="secondary" onClick={() => navigate("submit")}>{c.nav.submit}</Button>
          <Button theme={theme} icon={CheckCircle2} onClick={() => navigate("approval")}>{c.nav.approval}</Button>
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {workflow.map((state) => (
            <div
              key={state}
              className={classNames(
                "flex min-h-[76px] items-center justify-center rounded-lg border px-3 py-4 text-center text-[11px] font-black leading-tight break-words whitespace-normal",
                state === "locked" ? theme.accentBg : `${theme.soft} ${theme.faint}`
              )}
            >
              {c.status[state]}
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            [c.details.client, "0x91B4...3F21"],
            [c.details.freelancer, "0x70A1...B9C4"],
            [c.details.contractAddress, "0xE5c8...42F9"],
            [c.common.deadline, "2026-06-28 18:00 ICT"]
          ].map(([label, value]) => (
            <div key={label} className={classNames("rounded-lg border p-4", theme.soft)}>
              <p className={classNames("text-xs font-black uppercase tracking-[0.16em]", theme.faint)}>{label}</p>
              <p className={classNames("mt-2 break-all font-mono text-sm font-bold", theme.text)}>{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SubmissionPage({ c, theme, addToast }) {
  return (
    <div className="mx-auto max-w-4xl">
      <Card theme={theme}>
        <PageIntro title={c.submit.title} subtitle={c.submit.subtitle} theme={theme} />
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addToast("submitted");
          }}
        >
          <Field theme={theme} label={c.submit.deliverableUrl} icon={Globe2}>
            <TextInput theme={theme} defaultValue="https://figma.com/file/escrowx-landing" />
          </Field>
          <Field theme={theme} label={c.submit.workProof} icon={UploadCloud}>
            <TextInput theme={theme} placeholder={c.submit.proofPlaceholder} />
          </Field>
          <Field theme={theme} label={c.submit.notes} icon={FileText}>
            <TextArea theme={theme} defaultValue="Delivered responsive landing page, component library, and handoff notes for the client." />
          </Field>
          <Button theme={theme} icon={UploadCloud} type="submit">{c.common.submitWork}</Button>
        </form>
      </Card>
    </div>
  );
}

function ApprovalPage({ c, theme, navigate, addToast }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
      <Card theme={theme}>
        <PageIntro title={c.approval.title} subtitle={c.approval.subtitle} theme={theme} />
        <div className={classNames("mt-6 rounded-lg border p-5", theme.soft)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={classNames("text-xl font-black", theme.heading)}>{c.approval.deliverableTitle}</p>
              <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>Figma prototype, React repository, Lighthouse report, deployment URL.</p>
            </div>
            <Badge theme={theme} tone="cyan">{c.status.submitted}</Badge>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className={theme.text}>{c.approval.qualityScore}</span>
              <span className={theme.accentText}>92%</span>
            </div>
            <ProgressBar value={92} theme={theme} />
          </div>
        </div>
      </Card>
      <Card theme={theme}>
        <SectionTitle theme={theme} title={c.common.action} />
        <p className={classNames("text-sm leading-6", theme.muted)}>{c.approval.approvalCopy}</p>
        <div className="mt-5 grid gap-3">
          <Button theme={theme} icon={CheckCircle2} variant="success" onClick={() => addToast("approved")}>{c.common.approveWork}</Button>
          <Button theme={theme} icon={AlertTriangle} variant="danger" onClick={() => {
            addToast("disputeOpened");
            navigate("disputes");
          }}>{c.common.openDispute}</Button>
        </div>
      </Card>
    </div>
  );
}

function DisputeCenterPage({ c, theme, addToast }) {
  const [outcome, setOutcome] = useState(null);
  function vote(kind) {
    setOutcome(kind);
    addToast(kind === "release" ? "disputeResolved" : "disputeResolved");
  }

  return (
    <div className="space-y-6">
      <PageIntro title={c.dispute.title} subtitle={c.dispute.subtitle} theme={theme} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card theme={theme}>
          <SectionTitle theme={theme} title={c.dispute.evidence} />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [FileText, c.dispute.deliverables, "https://github.com/client/job-2379"],
              [UploadCloud, c.dispute.screenshots, "ipfs://QmAuditEvidence42"],
              [ReceiptText, "Milestone Log", "Oracle checkpoint #18"]
            ].map(([Icon, label, value]) => (
              <div key={label} className={classNames("rounded-lg border p-4", theme.soft)}>
                <Icon className={classNames("h-5 w-5", theme.accentText)} />
                <p className={classNames("mt-3 font-black", theme.heading)}>{label}</p>
                <p className={classNames("mt-2 break-all text-xs", theme.muted)}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className={theme.text}>{c.dispute.juryProgress}</span>
              <span className={theme.accentText}>4 / 5</span>
            </div>
            <ProgressBar value={80} theme={theme} />
          </div>
        </Card>
        <Card theme={theme}>
          <SectionTitle theme={theme} title={c.dispute.outcome} />
          <p className={classNames("text-sm leading-6", theme.muted)}>{c.dispute.outcomeCopy}</p>
          <div className="mt-5 grid gap-3">
            <Button theme={theme} icon={Vote} variant="success" onClick={() => vote("release")}>{c.common.voteRelease}</Button>
            <Button theme={theme} icon={Gavel} variant="secondary" onClick={() => vote("refund")}>{c.common.voteRefund}</Button>
          </div>
          <AnimatePresence mode="wait">
            {outcome ? (
              <motion.div
                key={outcome}
                className={classNames("mt-6 rounded-lg border p-5 text-center", outcome === "release" ? "border-emerald-300/25 bg-emerald-400/12" : "border-amber-300/25 bg-amber-400/12")}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
              >
                <Sparkles className={classNames("mx-auto h-8 w-8", outcome === "release" ? "text-emerald-400" : "text-amber-400")} />
                <p className={classNames("mt-3 font-black", theme.heading)}>{outcome === "release" ? c.status.released : c.status.refunded}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

function WalletPage({ c, theme, wallet, setWallet, openSignModal, addToast }) {
  function connectWallet() {
    setWallet({ connected: true, address: "0x8A91B4c2E7d9136f2A4F2", short: "0x8A91...A4F2", eth: "1.42", usdt: "8,430", status: c.status.connected });
    addToast("deposit");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card theme={theme}>
        <PageIntro title={c.wallet.title} subtitle={c.wallet.subtitle} theme={theme} />
        <div className={classNames("mt-6 rounded-lg border p-5", theme.soft)}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-300">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className={classNames("text-sm", theme.faint)}>{c.wallet.connection}</p>
              <p className={classNames("font-black", theme.heading)}>{wallet.connected ? c.status.connected : c.status.disconnected}</p>
            </div>
          </div>
          <p className={classNames("mt-5 break-all font-mono text-sm", theme.text)}>{wallet.connected ? wallet.address : "0x0000...0000"}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button theme={theme} icon={Wallet} onClick={connectWallet}>{c.common.connectWallet}</Button>
            <Button theme={theme} icon={Fingerprint} variant="secondary" onClick={openSignModal}>{c.common.signTransaction}</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <StatCard theme={theme} icon={Coins} label={c.wallet.eth} value={`${wallet.eth} ETH`} detail="Polygon gas reserve" tone="cyan" />
        <StatCard theme={theme} icon={CircleDollarSign} label={c.wallet.usdt} value={`${wallet.usdt} USDT`} detail="Available stablecoin" tone="emerald" />
        <Card theme={theme}>
          <SectionTitle theme={theme} title={c.common.signTransaction} />
          <div className="grid gap-3 text-sm">
            {[
              [c.wallet.method, "releaseFunds(jobId)"],
              [c.common.amount, "1,250 USDT"],
              [c.wallet.network, "Polygon"],
              [c.wallet.gas, "EscrowX sponsored"]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <span className={theme.faint}>{label}</span>
                <span className={classNames("text-right font-bold", theme.text)}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button theme={theme} icon={Wallet} onClick={openSignModal}>{c.common.signTransaction}</Button>
            <Button theme={theme} icon={Fingerprint} variant="secondary" onClick={openSignModal}>{c.wallet.approveBiometric}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function NotificationsPage({ c, theme, addToast }) {
  const keys = ["deposit", "submitted", "approved", "released", "disputeOpened", "disputeResolved"];
  return (
    <div className="space-y-6">
      <PageIntro title={c.notifications.title} subtitle={c.notifications.subtitle} theme={theme} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {keys.map((key) => {
          const [title, message] = c.notifications[key];
          return (
            <Card key={key} theme={theme} className="p-4">
              <Bell className={classNames("h-5 w-5", theme.accentText)} />
              <p className={classNames("mt-3 font-black", theme.heading)}>{title}</p>
              <p className={classNames("mt-2 text-sm leading-6", theme.muted)}>{message}</p>
              <Button theme={theme} size="sm" variant="secondary" className="mt-4" onClick={() => addToast(key)}>{c.notifications.triggerDemo}</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePage({ c, theme }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1fr]">
      <Card theme={theme} className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/12 text-3xl font-black text-cyan-300">
          NA
        </div>
        <h1 className={classNames("mt-4 text-2xl font-black", theme.heading)}>{c.profile.name}</h1>
        <p className={classNames("mt-1", theme.muted)}>{c.profile.role}</p>
        <p className={classNames("mt-4 break-all font-mono text-sm", theme.accentText)}>0x8A91B4c2E7d9136f2A4F2</p>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard theme={theme} icon={BadgeCheck} label={c.profile.reputation} value="98/100" detail={c.profile.verification} tone="cyan" />
        <StatCard theme={theme} icon={FileCheck2} label={c.profile.completedJobs} value="124" detail="UI/UX · Web · Audit" tone="emerald" />
        <StatCard theme={theme} icon={TrendingUp} label={c.profile.successRate} value="99.1%" detail={c.profile.security} tone="violet" />
        <Card theme={theme} className="md:col-span-3">
          <SectionTitle theme={theme} title={c.profile.security} />
          <div className="grid gap-3 md:grid-cols-3">
            {["MetaMask linked", "Email verified", "2FA enabled"].map((item) => (
              <div key={item} className={classNames("flex items-center gap-3 rounded-lg border p-3", theme.soft)}>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className={classNames("text-sm font-bold", theme.text)}>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Footer({ c, theme }) {
  const links = [
    [Mail, "contact@escrowx.io"],
    [MessageCircle, "Discord"],
    [Send, "Telegram"],
    [Github, "GitHub"],
    [Globe2, "Twitter/X"],
    [FileText, c.footer.terms],
    [ShieldCheck, c.footer.privacy]
  ];

  return (
    <footer className={classNames("mt-10 rounded-lg border p-6", theme.card)}>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className={classNames("text-xl font-black", theme.heading)}>{c.brand}</p>
          <p className={classNames("mt-2 max-w-xl text-sm leading-6", theme.muted)}>{c.product}</p>
          <p className={classNames("mt-4 text-xs", theme.faint)}>{c.footer.rights}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(([Icon, label]) => (
            <a key={label} className={classNames("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition", theme.soft, theme.softHover, theme.text)} href={label.includes("@") ? `mailto:${label}` : "#/"}>
              <Icon className={classNames("h-4 w-4", theme.accentText)} />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function ToastStack({ toasts, removeToast, theme }) {
  return (
    <div className="fixed right-4 top-20 z-50 grid w-[min(360px,calc(100vw-32px))] gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={classNames("rounded-lg border p-4 shadow-2xl", theme.card)}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-300">
                <toast.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={classNames("font-black", theme.heading)}>{toast.title}</p>
                <p className={classNames("mt-1 text-sm leading-5", theme.muted)}>{toast.message}</p>
              </div>
              <button className={theme.faint} onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SignTransactionModal({ open, onClose, c, theme, addToast }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-slate-950/75" onClick={onClose} aria-label="Close transaction modal" />
          <motion.div
            className={classNames("relative w-full max-w-lg rounded-lg border p-6", theme.card)}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={classNames("text-xl font-black", theme.heading)}>{c.wallet.modalTitle}</p>
                <p className={classNames("mt-2 text-sm", theme.muted)}>JOB-2402 · releaseFunds</p>
              </div>
              <button className={theme.faint} onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                [c.wallet.method, "releaseFunds(jobId)"],
                [c.common.amount, "1,250 USDT"],
                [c.common.contract, "0xE5c8...42F9"],
                [c.wallet.network, "Polygon"],
                [c.wallet.gas, "EscrowX sponsored"]
              ].map(([label, value]) => (
                <div key={label} className={classNames("flex justify-between gap-3 rounded-lg border p-3", theme.soft)}>
                  <span className={theme.faint}>{label}</span>
                  <span className={classNames("text-right font-bold", theme.text)}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button theme={theme} icon={Wallet} onClick={() => {
                addToast("released");
                onClose();
              }}>{c.common.signTransaction}</Button>
              <Button theme={theme} icon={Fingerprint} variant="secondary" onClick={() => {
                addToast("released");
                onClose();
              }}>{c.wallet.approveBiometric}</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function App() {
  const [language, setLanguage] = useStoredState("escrowx-language", "en");
  const [themeName, setThemeName] = useStoredState("escrowx-theme", "dark");
  const [route, setRoute] = useState(getInitialRoute);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [wallet, setWallet] = useState({
    connected: false,
    address: "",
    short: "Wallet",
    eth: "0.00",
    usdt: "0",
    status: translations.en.status.disconnected
  });
  const [toasts, setToasts] = useState([]);

  const theme = useMemo(() => getTheme(themeName), [themeName]);
  const c = translations[language];

  useEffect(() => {
    function syncRoute() {
      setRoute(getInitialRoute());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.addEventListener("hashchange", syncRoute);
    if (!window.location.hash) window.location.hash = "/";
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    setWallet((current) => ({ ...current, status: current.connected ? c.status.connected : c.status.disconnected }));
  }, [c.status.connected, c.status.disconnected]);

  function navigate(nextRoute) {
    const nextHash = routeHash(nextRoute);
    if (window.location.hash === nextHash) {
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = nextHash;
    }
  }

  function addToast(kind) {
    const copy = c.notifications[kind] || c.notifications.deposit;
    const iconMap = {
      deposit: CircleDollarSign,
      submitted: UploadCloud,
      approved: CheckCircle2,
      released: Coins,
      disputeOpened: AlertTriangle,
      disputeResolved: Gavel
    };
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [
      { id, title: copy[0], message: copy[1], icon: iconMap[kind] || Bell },
      ...current.slice(0, 4)
    ]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5200);
  }

  function removeToast(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  const pageProps = {
    c,
    theme,
    language,
    navigate,
    addToast,
    wallet,
    setWallet,
    openSignModal: () => setSignOpen(true)
  };

  const pages = {
    landing: <LandingPage {...pageProps} />,
    login: <AuthPage {...pageProps} type="login" />,
    register: <AuthPage {...pageProps} type="register" />,
    dashboard: <DashboardPage {...pageProps} />,
    create: <CreateJobPage {...pageProps} />,
    details: <EscrowDetailsPage {...pageProps} />,
    submit: <SubmissionPage {...pageProps} />,
    approval: <ApprovalPage {...pageProps} />,
    disputes: <DisputeCenterPage {...pageProps} />,
    wallet: <WalletPage {...pageProps} />,
    notifications: <NotificationsPage {...pageProps} />,
    profile: <ProfilePage {...pageProps} />
  };

  return (
    <div className={classNames("min-h-screen overflow-hidden", theme.page)}>
      <div className={classNames("fixed inset-0 -z-10", theme.background)} />
      <div className="app-grid pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <Sidebar c={c} theme={theme} route={route} navigate={navigate} open={mobileOpen} setOpen={setMobileOpen} />
      <div className="lg:pl-72">
        <Header
          c={c}
          theme={theme}
          language={language}
          setLanguage={setLanguage}
          themeName={themeName}
          setThemeName={setThemeName}
          setMobileOpen={setMobileOpen}
          wallet={wallet}
          navigate={navigate}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {pages[route] || pages.landing}
            </motion.div>
          </AnimatePresence>
          <Footer c={c} theme={theme} />
        </main>
      </div>
      <ToastStack toasts={toasts} removeToast={removeToast} theme={theme} />
      <SignTransactionModal open={signOpen} onClose={() => setSignOpen(false)} c={c} theme={theme} addToast={addToast} />
    </div>
  );
}

export default App;
