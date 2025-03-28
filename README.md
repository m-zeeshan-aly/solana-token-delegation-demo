# Solana Token Delegation Demo

## Overview

This script demonstrates advanced token delegation and transfer mechanisms on the Solana blockchain using the Token-2022 program. The demo showcases how a delegated wallet (W4) can perform token transfers on behalf of multiple other wallets (W1, W2, W3) with pre-approved delegation limits.

## Key Concepts

- **Token Delegation**: Allows one wallet to spend a predetermined amount of tokens on behalf of another wallet
- **Token-2022 Program**: An advanced token standard with enhanced features
- **Multi-wallet Interaction**: Demonstrates complex token interactions across multiple wallets

## Prerequisites

- Node.js (v14+ recommended)
- Solana CLI
- Solana Wallet with Devnet SOL

## Setup and Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd solana-token-delegation-demo
```

2. Install dependencies
```bash
npm install @solana/web3.js @solana/spl-token dotenv
```

3. Create a `.env` file in the project root (optional, script will generate one)

## How to Run

1. Ensure you're connected to Solana Devnet
```bash
solana config set --url devnet
```

2. Run the script
```bash
npm start
```

## Detailed Script Workflow

### Step 1: Wallet Generation
- Generates or loads 4 Solana wallets (W1, W2, W3, W4)
- Saves wallet keys in `.env` file for persistence

### Step 2: Initial Balance Check
- Verifies each wallet has minimum required SOL (0.2 SOL)
- Prompts user to fund wallets if balances are insufficient

### Step 3: Token Creation and Distribution
- Creates multiple tokens across different wallets
- Mints tokens to respective wallet accounts
- Transfers initial tokens between wallets

### Step 4: Delegation Setup
- Sets up token delegation from W1, W2, W3 to W4
- Approves W4 to spend a predefined amount (500 tokens) from each wallet's token accounts

### Step 5: Delegated Transfers
- W4 demonstrates transferring tokens using delegated authority
- Transfers tokens from original wallets to W4's accounts

## Token Delegation Benefits

1. **Controlled Access**: Set precise spending limits for delegate wallets
2. **Enhanced Security**: Avoid sharing private keys
3. **Flexible Token Management**: Enable third-party token movements with restrictions

## Example Use Cases

- Automated trading bots
- Escrow services
- Programmatic token distribution
- Managed investment accounts

## Error Handling

- Retry mechanisms for network requests
- Detailed error logging
- User-friendly prompts for wallet funding

## Important Notes

- This script runs on Solana Devnet
- Ensure you have sufficient SOL for transaction fees
- Wallet keys are saved locally; keep `.env` file secure

## Troubleshooting

- Check Solana network connectivity
- Verify wallet SOL balance
- Ensure all dependencies are correctly installed

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[Your License Here]

## Disclaimer

This is a demonstration script. Use in production environments requires thorough testing and security audits.
