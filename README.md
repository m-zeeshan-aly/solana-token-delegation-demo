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
