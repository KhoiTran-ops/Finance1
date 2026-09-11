# Smart Contract

Hardhat workspace for the escrow smart contracts.

## Setup

```bash
cd smart-contract
npm install
cp .env.example .env
```

## Commands

```bash
npm run compile
npm test
npm run deploy:local
npm run deploy:amoy
```

## Environment

```env
AMOY_RPC_URL=https://polygon-amoy.drpc.org
PRIVATE_KEY=
ESCROW_TOKEN_ADDRESS=
POLYGONSCAN_API_KEY=
```

If `ESCROW_TOKEN_ADDRESS` is empty, the deploy script deploys `MockUSDC` and uses it as the escrow payment token.

## Backend Values After Deploy

Use the deploy output for backend blockchain configuration:

```env
RPC_URL=<local-or-amoy-rpc-url>
PRIVATE_KEY=<backend-signer-private-key>
ESCROW_CONTRACT_ADDRESS=<deployed-escrow-contract-address>
```

The deploy script also exports the `EscrowContract` ABI to:

```text
backend/abi/EscrowContract.json
```
