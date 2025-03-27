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
Install Dependencies Install the required Node.js packages:
bash
npm install
(Optional) Configure Wallets

    By default, the script generates four new wallets (W1, W2, W3, W4) on the first run and saves their keys to a .env file.
    To use existing wallets, create a .env file in the project root with the following format:
    env

        W1_PUBLIC_KEY=your_w1_public_key
        W1_SECRET_KEY=your_w1_secret_key_base64
        W2_PUBLIC_KEY=your_w2_public_key
        W2_SECRET_KEY=your_w2_secret_key_base64
        W3_PUBLIC_KEY=your_w3_public_key
        W3_SECRET_KEY=your_w3_secret_key_base64
        W4_PUBLIC_KEY=your_w4_public_key
        W4_SECRET_KEY=your_w4_secret_key_base64
        Security Note: The .env file is ignored by Git via .gitignore to keep private keys secure—never commit it to the repository!

Running the Script

    Execute the Script Compile and run the TypeScript code using ts-node:
    bash

    npx ts-node src/index.ts
    Fund the Wallets
        The script will display the public keys for W1, W2, W3, and W4 (e.g., W1 Public Key: ABC123...).
        Visit a Solana Devnet faucet (e.g., faucet.solana.com), select “Devnet,” and airdrop at least 0.2 SOL to each of the four public keys.
        Wait 10-20 seconds for the funds to be credited on Devnet.
    Continue Execution
        After funding, press Enter when prompted by the script.
        The script will perform the following steps:
            Verify that all four wallets have at least 0.2 SOL.
            Create four token mints (Token1 by W1, Token2a and Token2b by W2, Token3 by W3).
            Mint 1000 tokens to each wallet’s respective token account.
            Transfer 200 tokens from W1 (Token1) and W2 (Token2a) to W3.
            Approve W4 as a delegate for 500 tokens across all token accounts held by W1, W2, and W3 (including W3’s holdings of Token1 and Token2a).
            Use W4 to transfer 200 tokens from each wallet’s account to its own corresponding token accounts.

Example Output

Here’s a sample of what you might see when running the script:
text
Starting Solana Token Delegation Demo
W1 Public Key: ABC123...
W2 Public Key: XYZ456...
W3 Public Key: DEF789...
W4 Public Key: GHI012...
Checking initial balances...
ABC123... balance: 0 SOL (attempt 1)
XYZ456... balance: 0 SOL (attempt 1)
DEF789... balance: 0 SOL (attempt 1)
GHI012... balance: 0 SOL (attempt 1)
Please fund these wallets with at least 0.2 SOL each on Devnet:
W1: ABC123...
W2: XYZ456...
W3: DEF789...
W4: GHI012...
Then press Enter to continue...

Verifying wallet balances...
ABC123... balance: 2.5 SOL (attempt 1)
XYZ456... balance: 2.5 SOL (attempt 1)
DEF789... balance: 2.5 SOL (attempt 1)
GHI012... balance: 2.5 SOL (attempt 1)
All wallet balances verified successfully

===== Starting Token Setup Process =====
Creating tokens for each wallet...
- W1 Token (TOKEN1...) created by W1 (ABC123...)
- W2 Token A (TOKEN2A...) created by W2 (XYZ456...)
- W2 Token B (TOKEN2B...) created by W2 (XYZ456...)
- W3 Token (TOKEN3...) created by W3 (DEF789...)
...
W4 transferred 200 of W1's token (TOKEN1...) from W1. Tx: TX123...
W4 transferred 200 of W3's token (TOKEN3...) from W3. Tx: TX456...
===== Token Setup Process Completed Successfully =====
Task completed successfully!
Verification

To confirm the results, use a blockchain explorer like Solscan set to Devnet:

    W1: ~800 Token1 remaining.
    W2: ~800 Token2a and ~800 Token2b remaining.
    W3: ~800 Token3, 0 Token1, 0 Token2a (after W4’s transfers).
    W4: 200 Token1 (from W1), 200 Token2a (from W2), 200 Token2b (from W2), 200 Token3 (from W3), plus 200 Token1 and 200 Token2a (from W3).

Project Structure
text
solana-delegate-task/
├── src/
│   └── index.ts     # Main script implementing the delegation logic
├── .gitignore       # Excludes sensitive files and build artifacts
├── package.json     # Lists project dependencies
└── README.md        # Project documentation (this file)
Dependencies

    @solana/web3.js: Core library for Solana blockchain interactions.
    @solana/spl-token: Functions for creating and managing tokens with the Token-2022 Program.
    dotenv: Loads environment variables from .env.

Where This Concept Helps

This token delegation workflow has practical applications in several blockchain use cases:

    Decentralized Finance (DeFi):
        Delegation enables trustless spending limits, such as allowing a smart contract or third party (e.g., W4) to spend tokens on behalf of users (W1-W3) without giving full control. This is common in lending protocols or automated trading systems.
    Multi-Party Transactions:
        Useful in escrow systems or collaborative agreements where one party (W4) needs temporary authority to move assets owned by others, as demonstrated by W3 delegating tokens it received from W1 and W2.
    Tokenized Asset Management:
        Applicable to NFT marketplaces, gaming economies, or loyalty programs where tokens represent assets, and delegation allows controlled transfers (e.g., W4 as a marketplace moving tokens).
    Educational Use:
        Teaches Solana developers how to manage multiple wallets, create custom tokens, and implement delegation—key skills for building decentralized applications (dApps).

Notes

    Network: Operates on Solana Devnet (https://api.devnet.solana.com), a free testing environment.
    Security: The .env file contains sensitive private keys—ensure it remains local and uncommitted.
    Troubleshooting:
        If Devnet RPC fails (e.g., balance checks return 0), increase RETRY_ATTEMPTS or try a custom endpoint in clusterApiUrl.
        Ensure all wallets are funded adequately, as token account creation and transactions require small SOL fees
