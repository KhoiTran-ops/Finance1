require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { AMOY_RPC_URL, PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    amoy: {
      url: AMOY_RPC_URL || "https://polygon-amoy.drpc.org",
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
   etherscan: {
    apiKey: POLYGONSCAN_API_KEY || ""
  },
  sourcify: {
    enabled: false
  }
};
