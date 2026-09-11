// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EscrowContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        CREATED,
        LOCKED,
        SHIPPED,
        DISPUTED,
        RELEASED,
        REFUNDED,
        CANCELLED
    }

    struct Escrow {
        bool exists;
        address buyer;
        address seller;
        uint256 amount;
        Status status;
        string evidenceURI;
        uint256 createdAt;
        uint256 updatedAt;
    }

    IERC20 public immutable paymentToken;

    mapping(bytes32 => Escrow) private escrows;

    event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event FundsDeposited(bytes32 indexed escrowId, address indexed buyer, uint256 amount);
    event ItemShipped(bytes32 indexed escrowId, address indexed seller);
    event DisputeRaised(bytes32 indexed escrowId, address indexed raisedBy, string evidenceURI);
    event FundsReleased(bytes32 indexed escrowId, address indexed seller, uint256 amount);
    event BuyerRefunded(bytes32 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowCancelled(bytes32 indexed escrowId, address indexed buyer);

    error EscrowAlreadyExists(bytes32 escrowId);
    error EscrowNotFound(bytes32 escrowId);
    error InvalidAddress();
    error InvalidAmount();
    error InvalidStatus(Status currentStatus);
    error Unauthorized();

    constructor(address tokenAddress, address initialOwner) Ownable(initialOwner) {
        if (tokenAddress == address(0) || initialOwner == address(0)) {
            revert InvalidAddress();
        }

        paymentToken = IERC20(tokenAddress);
    }

    function createEscrow(bytes32 escrowId, address seller, uint256 amount) external {
        if (escrows[escrowId].exists) {
            revert EscrowAlreadyExists(escrowId);
        }
        if (escrowId == bytes32(0) || seller == address(0) || seller == msg.sender) {
            revert InvalidAddress();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        escrows[escrowId] = Escrow({
            exists: true,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            status: Status.CREATED,
            evidenceURI: "",
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit EscrowCreated(escrowId, msg.sender, seller, amount);
    }

    function deposit(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        _onlyBuyer(escrow);
        _requireStatus(escrow, Status.CREATED);

        escrow.status = Status.LOCKED;
        escrow.updatedAt = block.timestamp;
        paymentToken.safeTransferFrom(msg.sender, address(this), escrow.amount);

        emit FundsDeposited(escrowId, msg.sender, escrow.amount);
    }

    function markShipped(bytes32 escrowId) external {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        _onlySeller(escrow);
        _requireStatus(escrow, Status.LOCKED);

        escrow.status = Status.SHIPPED;
        escrow.updatedAt = block.timestamp;

        emit ItemShipped(escrowId, msg.sender);
    }

    function confirmDelivery(bytes32 escrowId) external nonReentrant {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        _onlyBuyer(escrow);
        _requireStatus(escrow, Status.SHIPPED);

        _releaseFunds(escrowId, escrow);
    }

    function raiseDispute(bytes32 escrowId, string calldata evidenceURI) external {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) {
            revert Unauthorized();
        }
        if (escrow.status != Status.LOCKED && escrow.status != Status.SHIPPED) {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = Status.DISPUTED;
        escrow.evidenceURI = evidenceURI;
        escrow.updatedAt = block.timestamp;

        emit DisputeRaised(escrowId, msg.sender, evidenceURI);
    }

    function resolveDispute(bytes32 escrowId, bool releaseToSeller) external onlyOwner nonReentrant {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        _requireStatus(escrow, Status.DISPUTED);

        if (releaseToSeller) {
            _releaseFunds(escrowId, escrow);
        } else {
            _refundBuyer(escrowId, escrow);
        }
    }

    function cancelEscrow(bytes32 escrowId) external {
        Escrow storage escrow = _getExistingEscrow(escrowId);
        _onlyBuyer(escrow);
        _requireStatus(escrow, Status.CREATED);

        escrow.status = Status.CANCELLED;
        escrow.updatedAt = block.timestamp;

        emit EscrowCancelled(escrowId, msg.sender);
    }

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        Escrow memory escrow = escrows[escrowId];
        if (!escrow.exists) {
            revert EscrowNotFound(escrowId);
        }

        return escrow;
    }

    function _releaseFunds(bytes32 escrowId, Escrow storage escrow) private {
        escrow.status = Status.RELEASED;
        escrow.updatedAt = block.timestamp;
        paymentToken.safeTransfer(escrow.seller, escrow.amount);

        emit FundsReleased(escrowId, escrow.seller, escrow.amount);
    }

    function _refundBuyer(bytes32 escrowId, Escrow storage escrow) private {
        escrow.status = Status.REFUNDED;
        escrow.updatedAt = block.timestamp;
        paymentToken.safeTransfer(escrow.buyer, escrow.amount);

        emit BuyerRefunded(escrowId, escrow.buyer, escrow.amount);
    }

    function _getExistingEscrow(bytes32 escrowId) private view returns (Escrow storage) {
        Escrow storage escrow = escrows[escrowId];
        if (!escrow.exists) {
            revert EscrowNotFound(escrowId);
        }

        return escrow;
    }

    function _onlyBuyer(Escrow storage escrow) private view {
        if (msg.sender != escrow.buyer) {
            revert Unauthorized();
        }
    }

    function _onlySeller(Escrow storage escrow) private view {
        if (msg.sender != escrow.seller) {
            revert Unauthorized();
        }
    }

    function _requireStatus(Escrow storage escrow, Status expectedStatus) private view {
        if (escrow.status != expectedStatus) {
            revert InvalidStatus(escrow.status);
        }
    }
}
