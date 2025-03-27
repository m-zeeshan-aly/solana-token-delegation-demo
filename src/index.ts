import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  createApproveInstruction,
  createTransferInstruction,
  TOKEN_2022_PROGRAM_ID,
  mintTo,
} from "@solana/spl-token";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configuration constants
const MIN_REQUIRED_SOL = 0.2; // Minimum SOL required per wallet
const RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;
const TEST_TOKEN_DECIMALS = 6;
const TEST_TOKEN_AMOUNT = 1000;
const DELEGATE_AMOUNT = 500;
const TRANSFER_AMOUNT = 200;

// Improved RPC connection setup
const connection = new Connection(
  clusterApiUrl('devnet'), 
  {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  }
);


// Token-2022 Program ID
const TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

// Helper function to save keys to .env
function saveKeysToEnv(w1: Keypair, w2: Keypair): void {
  const envContent = `
W1_PUBLIC_KEY=${w1.publicKey.toBase58()}
W1_SECRET_KEY=${Buffer.from(w1.secretKey).toString("base64")}
W2_PUBLIC_KEY=${w2.publicKey.toBase58()}
W2_SECRET_KEY=${Buffer.from(w2.secretKey).toString("base64")}
  `.trim();
  
  fs.writeFileSync(".env", envContent);
  console.log("Saved W1 and W2 keys to .env file");
}

// Helper function to load Keypair from .env
function loadKeypair(publicKeyEnv: string, secretKeyEnv: string): Keypair {
  if (!process.env[publicKeyEnv] || !process.env[secretKeyEnv]) {
    throw new Error(`Missing ${publicKeyEnv} or ${secretKeyEnv} in .env file`);
  }

  try {
    const publicKey = new PublicKey(process.env[publicKeyEnv]!);
    const secretKey = Buffer.from(process.env[secretKeyEnv]!, "base64");
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error(`Failed to load keypair: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Improved balance check with proper error handling
async function getReliableBalance(pubkey: PublicKey): Promise<number> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      const balance = await connection.getBalance(pubkey, "confirmed");
      console.log(`${pubkey.toBase58()} balance: ${balance / LAMPORTS_PER_SOL} SOL (attempt ${attempt})`);
      
      if (balance > 0) {
        return balance;
      }

      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Balance check attempt ${attempt} failed: ${lastError.message}`);
      
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError || new Error(`Failed to get balance after ${RETRY_ATTEMPTS} attempts`);
}

async function verifyBalances(w1: Keypair, w2: Keypair): Promise<void> {
  console.log("\nVerifying wallet balances...");
  
  const [w1Balance, w2Balance] = await Promise.all([
    getReliableBalance(w1.publicKey),
    getReliableBalance(w2.publicKey)
  ]);

  const minRequiredLamports = MIN_REQUIRED_SOL * LAMPORTS_PER_SOL;
  
  if (w1Balance < minRequiredLamports || w2Balance < minRequiredLamports) {
    throw new Error(
      `Insufficient SOL in wallets. Required at least ${MIN_REQUIRED_SOL} SOL each.\n` +
      `W1 has ${w1Balance / LAMPORTS_PER_SOL} SOL\n` +
      `W2 has ${w2Balance / LAMPORTS_PER_SOL} SOL`
    );
  }

  console.log("Wallet balances verified successfully");
}

async function setupTestToken(w1: Keypair, w2: Keypair): Promise<void> {
  console.log("\nCreating test token...");
  
  // Step 1: Create mint
  const usdtMint = await createMint(
    connection,
    w1, // Payer
    w1.publicKey, // Mint authority
    null, // Freeze authority (none)
    TEST_TOKEN_DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log("Test Token Mint Address:", usdtMint.toBase58());

  // Step 2: Create token accounts
  const [w1TokenAccount, w2TokenAccount] = await Promise.all([
    getOrCreateAssociatedTokenAccount(
      connection,
      w1,
      usdtMint,
      w1.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    ),
    getOrCreateAssociatedTokenAccount(
      connection,
      w1,
      usdtMint,
      w2.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
  ]);

  console.log("W1 Token Account:", w1TokenAccount.address.toBase58());
  console.log("W2 Token Account:", w2TokenAccount.address.toBase58());

  // Step 3: Mint tokens to W1
  const mintAmount = TEST_TOKEN_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  const mintTxId = await mintTo(
    connection,
    w1,
    usdtMint,
    w1TokenAccount.address,
    w1, // Mint authority
    mintAmount,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  console.log(`Minted ${TEST_TOKEN_AMOUNT} tokens to W1. Tx: ${mintTxId}`);

  // Step 4: Approve W2 as delegate
  const delegateAmount = DELEGATE_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  const approveTx = new Transaction().add(
    createApproveInstruction(
      w1TokenAccount.address,
      w2.publicKey,
      w1.publicKey,
      delegateAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  const approveTxId = await sendAndConfirmTransaction(connection, approveTx, [w1]);
  console.log(`Approved W2 as delegate for ${DELEGATE_AMOUNT} tokens. Tx: ${approveTxId}`);

  // Step 5: W2 transfers tokens from W1 to itself
  const transferAmount = TRANSFER_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  const transferTx = new Transaction().add(
    createTransferInstruction(
      w1TokenAccount.address,
      w2TokenAccount.address,
      w2.publicKey,
      transferAmount,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  const transferTxId = await sendAndConfirmTransaction(connection, transferTx, [w2]);
  console.log(`W2 transferred ${TRANSFER_AMOUNT} tokens from W1 to itself. Tx: ${transferTxId}`);
}

async function main(): Promise<void> {
  try {
    console.log("Starting Solana Token Delegation Demo");
    
    // Step 1: Load or create wallets
    let w1: Keypair, w2: Keypair;
    
    if (process.env.W1_PUBLIC_KEY && process.env.W2_PUBLIC_KEY) {
      console.log("Loading existing wallets from .env");
      w1 = loadKeypair("W1_PUBLIC_KEY", "W1_SECRET_KEY");
      w2 = loadKeypair("W2_PUBLIC_KEY", "W2_SECRET_KEY");
    } else {
      console.log("Generating new wallets");
      w1 = Keypair.generate();
      w2 = Keypair.generate();
      saveKeysToEnv(w1, w2);
    }

    console.log("W1 Public Key:", w1.publicKey.toBase58());
    console.log("W2 Public Key:", w2.publicKey.toBase58());

    // Step 2: Check initial balances
    console.log("\nChecking initial balances...");
    await getReliableBalance(w1.publicKey);
    await getReliableBalance(w2.publicKey);

    // Step 3: Wait for user to fund wallets
    console.log(
      `\nPlease fund these wallets with at least ${MIN_REQUIRED_SOL} SOL each on Devnet:\n` +
      `W1: ${w1.publicKey.toBase58()}\n` +
      `W2: ${w2.publicKey.toBase58()}\n` +
      "Then press Enter to continue..."
    );
    await new Promise(resolve => process.stdin.once("data", resolve));

    // Step 4: Verify funding
    await verifyBalances(w1, w2);

    // Step 5: Execute token operations
    await setupTestToken(w1, w2);

    console.log("\nTask completed successfully!");
  } catch (error) {
    console.error("\nError:", error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && "getLogs" in error) {
      try {
        const logs = await (error as any).getLogs();
        console.error("Transaction logs:", logs);
      } catch (logError) {
        console.error("Failed to get transaction logs:", logError);
      }
    }
    
    process.exit(1);
  }
}

main();