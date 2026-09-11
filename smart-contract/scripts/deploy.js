const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  console.log("PRIVATE_KEY loaded:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.substring(0, 6) + "..." : "UNDEFINED");
  console.log("RPC_URL loaded:", process.env.AMOY_RPC_URL || "UNDEFINED");
  const [deployer, demoBuyer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  const configuredToken = process.env.ESCROW_TOKEN_ADDRESS;

  let tokenAddress = configuredToken;
  let mockUSDC = null;

  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Network: ${networkName}`);

  if (!tokenAddress) {
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    tokenAddress = await mockUSDC.getAddress();
    console.log(`MockUSDC deployed: ${tokenAddress}`);

    if (demoBuyer) {
      const demoAmount = hre.ethers.parseUnits("10000", 6);
      const mintTx = await mockUSDC.mint(demoBuyer.address, demoAmount);
      await mintTx.wait();
      console.log(`Minted 10000 mUSDC to demo buyer: ${demoBuyer.address}`);
    }
  } else {
    console.log(`Using configured ERC20 token: ${tokenAddress}`);
  }

  const EscrowContract = await hre.ethers.getContractFactory("EscrowContract");
  const escrowContract = await EscrowContract.deploy(tokenAddress, deployer.address);
  await escrowContract.waitForDeployment();
  const escrowAddress = await escrowContract.getAddress();
  console.log(`EscrowContract deployed: ${escrowAddress}`);

  const deployment = {
    network: networkName,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    paymentToken: tokenAddress,
    mockUSDC: mockUSDC ? tokenAddress : null,
    escrowContract: escrowAddress,
    deployedAt: new Date().toISOString()
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}.json`),
    `${JSON.stringify(deployment, null, 2)}\n`
  );

  const artifact = await hre.artifacts.readArtifact("EscrowContract");
  const backendAbiDir = path.join(__dirname, "..", "..", "backend", "abi");
  fs.mkdirSync(backendAbiDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendAbiDir, "EscrowContract.json"),
    `${JSON.stringify(artifact.abi, null, 2)}\n`
  );

  console.log("Backend env values:");
  console.log(`RPC_URL=${process.env.AMOY_RPC_URL || "http://127.0.0.1:8545"}`);
  console.log("PRIVATE_KEY=<backend signer private key>");
  console.log(`ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
