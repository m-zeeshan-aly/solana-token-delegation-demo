# solana-token-delegation-demo
A comprehensive demonstration of token creation, delegation, and transfer on the Solana blockchain. This project showcases how to: - Create multiple tokens with different owners - Set up token accounts for multiple wallets - Implement token delegation between wallets - Execute transfers using delegated authority.

# Solana Multi-Wallet Token Delegation Demo

This project demonstrates advanced token delegation on Solana using the Token-2022 Program. It manages four wallets (W1, W2, W3, W4) on Devnet, creating multiple tokens, distributing them, and setting up a chain of delegation where W4 can transfer tokens from all others using delegated authority.

## Features
- Manages 4 wallets (W1-W4).
- Creates 4 token mints:
  - W1: Token1
  - W2: Token2a and Token2b
  - W3: Token3
- Mints 1000 tokens to each wallet’s account.
- W1 and W2 transfer 200 tokens each to W3.
- W1, W2, and W3 approve W4 as a delegate for 500 tokens across all accounts.
- W4 transfers 200 tokens from each wallet (including W3’s holdings) to itself.
- Includes balance retry logic for Devnet RPC reliability.

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- A Solana Devnet faucet (e.g., [faucet.solana.com](https://faucet.solana.com/))
- Git

## Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/personalusername/solana-delegate-task.git
   cd solana-delegate-task

    Install Dependencies
    bash

npm install
(Optional) Configure Wallets

    The script generates 4 new wallets (W1-W4) and saves them to .env on the first run.
    To use existing wallets, create a .env file with:
    env

        W1_PUBLIC_KEY=your_w1_public_key
        W1_SECRET_KEY=your_w1_secret_key_base64
        W2_PUBLIC_KEY=your_w2_public_key
        W2_SECRET_KEY=your_w2_secret_key_base64
        W3_PUBLIC_KEY=your_w3_public_key
        W3_SECRET_KEY=your_w3_secret_key_base64
        W4_PUBLIC_KEY=your_w4_public_key
        W4_SECRET_KEY=your_w4_secret_key_base64
        Note: .env is ignored by Git—keep it private!

Running the Script

    Compile and Run
    bash

    npx ts-node src/index.ts
    Fund Wallets
        The script prints public keys for W1, W2, W3, and W4 (e.g., W1 Public Key: ABC123...).
        Visit faucet.solana.com, select “Devnet,” and airdrop at least 0.2 SOL to each key.
        Wait 10-20 seconds for funds to propagate.
    Proceed
        Press Enter when prompted.
        The script will:
            Check and verify balances for all 4 wallets.
            Create 4 token mints (Token1, Token2a, Token2b, Token3).
            Mint 1000 tokens to W1, W2 (x2), and W3.
            Transfer 200 tokens from W1 and W2 to W3.
            Approve W4 as a delegate for 500 tokens from all accounts.
            Use W4 to transfer 200 tokens from each wallet to itself.

Example Output
text
Starting Solana Token Delegation Demo
W1 Public Key: ABC123...
W2 Public Key: XYZ456...
W3 Public Key: DEF789...
W4 Public Key: GHI012...
Checking initial balances...
Please fund these wallets with at least 0.2 SOL each on Devnet:
W1: ABC123...
W2: XYZ456...
W3: DEF789...
W4: GHI012...
Then press Enter to continue...
Verifying wallet balances...
===== Starting Token Setup Process =====
Creating tokens for each wallet...
Test Token Mint Address: TOKEN1...
W1 Token Account: ATA1...
W4 transferred 200 tokens from W1. Tx: TX123...
Task completed successfully!
Verification

    Check balances on solscan.io (Devnet):
        W1: ~800 Token1.
        W2: ~800 Token2a, ~800 Token2b.
        W3: ~800 Token3, 200 Token1, 200 Token2a (before W4 transfers).
        W4: 200 of each token after transfers.

Project Structure
text
solana-delegate-task/
├── src/
│   └── index.ts     # Main script
├── .gitignore       # Ignored files
├── package.json     # Dependencies
└── README.md        # This file
Dependencies

    @solana/web3.js: Core Solana blockchain interactions.
    @solana/spl-token: Token-2022 Program functions.
    dotenv: Loads .env variables.

Where This Concept Helps

    Decentralized Finance (DeFi): Delegation enables trustless token management (e.g., allowing a smart contract or third party to spend tokens on behalf of a user without full control).
    Multi-Party Transactions: Useful in escrow or multi-signature scenarios where one party (W4) acts on behalf of others.
    Tokenized Assets: Demonstrates how to manage multiple tokens and delegate access, applicable to NFT marketplaces or gaming economies.
    Learning Solana: Teaches token creation, account management, and delegation—key skills for Solana dApp development.

Notes

    Network: Uses Solana Devnet (https://api.devnet.solana.com).
    Security: Never commit .env—it contains private keys!
    Troubleshooting: If Devnet RPC fails, adjust RETRY_ATTEMPTS or use a custom endpoint in clusterApiUrl.
