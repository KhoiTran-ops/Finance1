const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowContract", function () {
  const Status = {
    CREATED: 0n,
    LOCKED: 1n,
    SHIPPED: 2n,
    DISPUTED: 3n,
    RELEASED: 4n,
    REFUNDED: 5n,
    CANCELLED: 6n
  };

  let owner;
  let buyer;
  let seller;
  let other;
  let token;
  let escrow;
  let escrowId;
  let amount;

  beforeEach(async function () {
    [owner, buyer, seller, other] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    token = await MockUSDC.deploy(owner.address);
    await token.waitForDeployment();

    const EscrowContract = await ethers.getContractFactory("EscrowContract");
    escrow = await EscrowContract.deploy(await token.getAddress(), owner.address);
    await escrow.waitForDeployment();

    escrowId = ethers.id("escrow-1");
    amount = ethers.parseUnits("250", 6);

    await token.mint(buyer.address, amount);
  });

  async function createEscrow() {
    return escrow.connect(buyer).createEscrow(escrowId, seller.address, amount);
  }

  async function createAndDeposit() {
    await createEscrow();
    await token.connect(buyer).approve(await escrow.getAddress(), amount);
    return escrow.connect(buyer).deposit(escrowId);
  }

  it("creates escrow with valid buyer, seller, and amount", async function () {
    await expect(createEscrow())
      .to.emit(escrow, "EscrowCreated")
      .withArgs(escrowId, buyer.address, seller.address, amount);

    const data = await escrow.getEscrow(escrowId);
    expect(data.buyer).to.equal(buyer.address);
    expect(data.seller).to.equal(seller.address);
    expect(data.amount).to.equal(amount);
    expect(data.status).to.equal(Status.CREATED);
  });

  it("rejects duplicate escrow IDs", async function () {
    await createEscrow();

    await expect(createEscrow())
      .to.be.revertedWithCustomError(escrow, "EscrowAlreadyExists")
      .withArgs(escrowId);
  });

  it("deposits ERC20 only after buyer approval", async function () {
    await createEscrow();

    await expect(escrow.connect(buyer).deposit(escrowId)).to.be.reverted;

    await token.connect(buyer).approve(await escrow.getAddress(), amount);
    await expect(escrow.connect(buyer).deposit(escrowId))
      .to.emit(escrow, "FundsDeposited")
      .withArgs(escrowId, buyer.address, amount);

    expect(await token.balanceOf(await escrow.getAddress())).to.equal(amount);
    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.LOCKED);
  });

  it("blocks non-seller from marking shipped", async function () {
    await createAndDeposit();

    await expect(escrow.connect(other).markShipped(escrowId))
      .to.be.revertedWithCustomError(escrow, "Unauthorized");

    await expect(escrow.connect(seller).markShipped(escrowId))
      .to.emit(escrow, "ItemShipped")
      .withArgs(escrowId, seller.address);

    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.SHIPPED);
  });

  it("releases funds to seller after buyer confirms delivery", async function () {
    await createAndDeposit();
    await escrow.connect(seller).markShipped(escrowId);

    await expect(escrow.connect(buyer).confirmDelivery(escrowId))
      .to.emit(escrow, "FundsReleased")
      .withArgs(escrowId, seller.address, amount);

    expect(await token.balanceOf(seller.address)).to.equal(amount);
    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.RELEASED);
  });

  it("allows buyer or seller to raise dispute only", async function () {
    await createAndDeposit();

    await expect(escrow.connect(other).raiseDispute(escrowId, "ipfs://bad"))
      .to.be.revertedWithCustomError(escrow, "Unauthorized");

    await expect(escrow.connect(buyer).raiseDispute(escrowId, "ipfs://evidence"))
      .to.emit(escrow, "DisputeRaised")
      .withArgs(escrowId, buyer.address, "ipfs://evidence");

    const data = await escrow.getEscrow(escrowId);
    expect(data.status).to.equal(Status.DISPUTED);
    expect(data.evidenceURI).to.equal("ipfs://evidence");
  });

  it("allows owner/admin to resolve dispute as release", async function () {
    await createAndDeposit();
    await escrow.connect(seller).raiseDispute(escrowId, "ipfs://seller-evidence");

    await expect(escrow.connect(other).resolveDispute(escrowId, true))
      .to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount")
      .withArgs(other.address);

    await expect(escrow.connect(owner).resolveDispute(escrowId, true))
      .to.emit(escrow, "FundsReleased")
      .withArgs(escrowId, seller.address, amount);

    expect(await token.balanceOf(seller.address)).to.equal(amount);
    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.RELEASED);
  });

  it("allows owner/admin to resolve dispute as refund", async function () {
    await createAndDeposit();
    await escrow.connect(buyer).raiseDispute(escrowId, "ipfs://buyer-evidence");

    await expect(escrow.connect(owner).resolveDispute(escrowId, false))
      .to.emit(escrow, "BuyerRefunded")
      .withArgs(escrowId, buyer.address, amount);

    expect(await token.balanceOf(buyer.address)).to.equal(amount);
    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.REFUNDED);
  });

  it("rejects invalid state transitions", async function () {
    await createEscrow();

    await expect(escrow.connect(seller).markShipped(escrowId))
      .to.be.revertedWithCustomError(escrow, "InvalidStatus")
      .withArgs(Status.CREATED);

    await expect(escrow.connect(buyer).confirmDelivery(escrowId))
      .to.be.revertedWithCustomError(escrow, "InvalidStatus")
      .withArgs(Status.CREATED);

    await token.connect(buyer).approve(await escrow.getAddress(), amount);
    await escrow.connect(buyer).deposit(escrowId);
    await escrow.connect(buyer).raiseDispute(escrowId, "ipfs://evidence");

    await expect(escrow.connect(buyer).deposit(escrowId))
      .to.be.revertedWithCustomError(escrow, "InvalidStatus")
      .withArgs(Status.DISPUTED);
  });

  it("allows buyer to cancel an unfunded escrow", async function () {
    await createEscrow();

    await expect(escrow.connect(buyer).cancelEscrow(escrowId))
      .to.emit(escrow, "EscrowCancelled")
      .withArgs(escrowId, buyer.address);

    expect((await escrow.getEscrow(escrowId)).status).to.equal(Status.CANCELLED);
  });
});
