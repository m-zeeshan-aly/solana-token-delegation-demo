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
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 3000;
const TEST_TOKEN_DECIMALS = 6;
const TEST_TOKEN_AMOUNT = 1000;
const DELEGATE_AMOUNT = 500;
const TRANSFER_AMOUNT = 200;
const WALLET_COUNT = 4; // Now managing 4 wallets

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
function saveKeysToEnv(wallets: Keypair[]): void {
  let envContent = '';
  
  wallets.forEach((wallet, index) => {
    envContent += `W${index+1}_PUBLIC_KEY=${wallet.publicKey.toBase58()}\n`;
    envContent += `W${index+1}_SECRET_KEY=${Buffer.from(wallet.secretKey).toString("base64")}\n`;
  });

  fs.writeFileSync(".env", envContent.trim());
  console.log(`Saved ${wallets.length} wallet keys to .env file`);
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
async function getBalance(pubkey: PublicKey): Promise<number> {
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
      console.log("\n");
    }
  }

  // throw lastError || new Error(`Failed to get balance after ${RETRY_ATTEMPTS} attempts`);
  console.log(`Failed to get balance after ${RETRY_ATTEMPTS} attempts`)
  return 0;
}



async function verifyBalances(wallets: Keypair[]): Promise<void> {
  console.log("\nVerifying wallet balances...");
  
  const balancePromises = wallets.map(wallet => getBalance(wallet.publicKey));
  const balances = await Promise.all(balancePromises);

  const minRequiredLamports = MIN_REQUIRED_SOL * LAMPORTS_PER_SOL;
  let allFunded = true;
  
  balances.forEach((balance, index) => {
    if (balance < minRequiredLamports) {
      console.error(`W${index+1} has insufficient funds: ${balance / LAMPORTS_PER_SOL} SOL`);
      allFunded = false;
    }
  });

  if (!allFunded) {
    throw new Error(
      `Insufficient SOL in wallets. Required at least ${MIN_REQUIRED_SOL} SOL each.`
    );
  }

  console.log("All wallet balances verified successfully");
}

async function setupTestTokens(w1: Keypair, w2: Keypair, w3: Keypair, w4: Keypair): Promise<void> {
  console.log("\n===== Starting Token Setup Process =====\n");

  // Step 1: Create tokens for each wallet
  console.log("🚀 Creating tokens for each wallet...");
  const [token1, token2a, token2b, token3] = await Promise.all([
    createMint(
      connection,
      w1,
      w1.publicKey,
      null,
      TEST_TOKEN_DECIMALS,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    ),
    createMint(
      connection,
      w2,
      w2.publicKey,
      null,
      TEST_TOKEN_DECIMALS,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    ),
    createMint(
      connection,
      w2,
      w2.publicKey,
      null,
      TEST_TOKEN_DECIMALS,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    ),
    createMint(
      connection,
      w3,
      w3.publicKey,
      null,
      TEST_TOKEN_DECIMALS,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    )
  ]);

  console.log("\n✅ Token Creation Complete:");
  console.log(`- W1 Token (${token1.toBase58()}) created by W1 (${w1.publicKey.toBase58()})`);
  console.log(`- W2 Token A (${token2a.toBase58()}) created by W2 (${w2.publicKey.toBase58()})`);
  console.log(`- W2 Token B (${token2b.toBase58()}) created by W2 (${w2.publicKey.toBase58()})`);
  console.log(`- W3 Token (${token3.toBase58()}) created by W3 (${w3.publicKey.toBase58()})`);

  // Step 2: Create token accounts
  console.log("\n🔨 Creating token accounts for all wallets...");
  const [
    w1Token1Account, w4Token1Account,
    w2Token2aAccount, w4Token2aAccount,
    w2Token2bAccount, w4Token2bAccount,
    w3Token3Account, w4Token3Account,
    w3Token1Account, w3Token2aAccount
  ] = await Promise.all([
    getOrCreateAssociatedTokenAccount(connection, w1, token1, w1.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w1, token1, w4.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w2, token2a, w2.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w2, token2a, w4.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w2, token2b, w2.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w2, token2b, w4.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w3, token3, w3.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w3, token3, w4.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w1, token1, w3.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID),
    getOrCreateAssociatedTokenAccount(connection, w2, token2a, w3.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID)
  ]);

  console.log("\n✅ Token Accounts Created:");
  console.log(`- W1's Token Account for ${token1.toBase58()}: ${w1Token1Account.address.toBase58()}`);
  console.log(`- W2's Token Account for ${token2a.toBase58()}: ${w2Token2aAccount.address.toBase58()}`);
  console.log(`- W2's Token Account for ${token2b.toBase58()}: ${w2Token2bAccount.address.toBase58()}`);
  console.log(`- W3's Token Account for ${token3.toBase58()}: ${w3Token3Account.address.toBase58()}`);
  console.log(`- W3's Token Account for W1's token: ${w3Token1Account.address.toBase58()}`);
  console.log(`- W3's Token Account for W2's Token A: ${w3Token2aAccount.address.toBase58()}`);
  console.log(`- W4's Token Accounts created for all tokens`);

  // Step 3: Mint tokens and transfer to W3
  console.log("\n💰 Minting and distributing tokens...");
  const mintAmount = TEST_TOKEN_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  const transferAmount = TRANSFER_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  
  // Mint tokens
  console.log(`\nMinting ${TEST_TOKEN_AMOUNT} tokens to each wallet's token account:`);
  const [mintTx1, mintTx2a, mintTx2b, mintTx3] = await Promise.all([
    mintTo(connection, w1, token1, w1Token1Account.address, w1, mintAmount, [], undefined, TOKEN_PROGRAM_ID),
    mintTo(connection, w2, token2a, w2Token2aAccount.address, w2, mintAmount, [], undefined, TOKEN_PROGRAM_ID),
    mintTo(connection, w2, token2b, w2Token2bAccount.address, w2, mintAmount, [], undefined, TOKEN_PROGRAM_ID),
    mintTo(connection, w3, token3, w3Token3Account.address, w3, mintAmount, [], undefined, TOKEN_PROGRAM_ID)
  ]);

  console.log(`- Minted ${TEST_TOKEN_AMOUNT} of W1's token (${token1.toBase58()}) to W1. Tx: ${mintTx1}`);
  console.log(`- Minted ${TEST_TOKEN_AMOUNT} of W2's Token A (${token2a.toBase58()}) to W2. Tx: ${mintTx2a}`);
  console.log(`- Minted ${TEST_TOKEN_AMOUNT} of W2's Token B (${token2b.toBase58()}) to W2. Tx: ${mintTx2b}`);
  console.log(`- Minted ${TEST_TOKEN_AMOUNT} of W3's token (${token3.toBase58()}) to W3. Tx: ${mintTx3}`);

  // Transfer tokens to W3
  console.log(`\nTransferring ${TRANSFER_AMOUNT} tokens to W3 from W1 and W2:`);
  const [transferTx1, transferTx2a] = await Promise.all([
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w1Token1Account.address,
          w3Token1Account.address,
          w1.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w1]
    ),
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w2Token2aAccount.address,
          w3Token2aAccount.address,
          w2.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w2]
    )
  ]);

  console.log(`- Transferred ${TRANSFER_AMOUNT} of W1's token (${token1.toBase58()}) to W3. Tx: ${transferTx1}`);
  console.log(`- Transferred ${TRANSFER_AMOUNT} of W2's Token A (${token2a.toBase58()}) to W3. Tx: ${transferTx2a}`);

  // Step 4: Set up delegations to W4
  console.log("\n🔐 Setting up delegations to W4...");
  const delegateAmount = DELEGATE_AMOUNT * 10 ** TEST_TOKEN_DECIMALS;
  
  console.log(`\nApproving W4 (${w4.publicKey.toBase58()}) as delegate for ${DELEGATE_AMOUNT} tokens:`);
  const [approveTx1, approveTx2a, approveTx2b, approveTx3, approveTx1w3, approveTx2aw3] = await Promise.all([
    // W1 approves W4 for token1
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w1Token1Account.address,
          w4.publicKey,
          w1.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w1]
    ),
    // W2 approves W4 for token2a
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w2Token2aAccount.address,
          w4.publicKey,
          w2.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w2]
    ),
    // W2 approves W4 for token2b
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w2Token2bAccount.address,
          w4.publicKey,
          w2.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w2]
    ),
    // W3 approves W4 for token3
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w3Token3Account.address,
          w4.publicKey,
          w3.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w3]
    ),
    // W3 approves W4 for token1 (from W1)
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w3Token1Account.address,
          w4.publicKey,
          w3.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w3]
    ),
    // W3 approves W4 for token2a (from W2)
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createApproveInstruction(
          w3Token2aAccount.address,
          w4.publicKey,
          w3.publicKey,
          delegateAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w3]
    )
  ]);

  console.log(`\n✅ Delegation Approvals Complete:`);
  console.log(`- W1 approved W4 for ${DELEGATE_AMOUNT} of token ${token1.toBase58()}. Tx: ${approveTx1}`);
  console.log(`- W2 approved W4 for ${DELEGATE_AMOUNT} of token ${token2a.toBase58()}. Tx: ${approveTx2a}`);
  console.log(`- W2 approved W4 for ${DELEGATE_AMOUNT} of token ${token2b.toBase58()}. Tx: ${approveTx2b}`);
  console.log(`- W3 approved W4 for ${DELEGATE_AMOUNT} of its own token ${token3.toBase58()}. Tx: ${approveTx3}`);
  console.log(`- W3 approved W4 for ${DELEGATE_AMOUNT} of W1's token ${token1.toBase58()}. Tx: ${approveTx1w3}`);
  console.log(`- W3 approved W4 for ${DELEGATE_AMOUNT} of W2's Token A ${token2a.toBase58()}. Tx: ${approveTx2aw3}`);


  // After approving W4 as delegate, add a 3-minute delay before transferring
  // console.log("\n⏳ Waiting 3 minutes to test delegate access persistence...");
  // await new Promise(resolve => setTimeout(resolve, 180_000)); // 180,000 ms = 3 minutes


  // Step 5: W4 transfers tokens from all wallets to itself
  console.log("\n🔄 W4 executing transfers using delegated authority...");
  console.log(`Transferring ${TRANSFER_AMOUNT} tokens from each wallet to W4:`);
  
  const [transfer1, transfer2a, transfer2b, transfer3, transfer1w3, transfer2aw3] = await Promise.all([
    // W4 transfers token1 from W1
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w1Token1Account.address,
          w4Token1Account.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    ),
    // W4 transfers token2a from W2
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w2Token2aAccount.address,
          w4Token2aAccount.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    ),
    // W4 transfers token2b from W2
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w2Token2bAccount.address,
          w4Token2bAccount.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    ),
    // W4 transfers token3 from W3
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w3Token3Account.address,
          w4Token3Account.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    ),
    // W4 transfers token1 from W3 (originally from W1)
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w3Token1Account.address,
          w4Token1Account.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    ),
    // W4 transfers token2a from W3 (originally from W2)
    sendAndConfirmTransaction(
      connection,
      new Transaction().add(
        createTransferInstruction(
          w3Token2aAccount.address,
          w4Token2aAccount.address,
          w4.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      ),
      [w4]
    )
  ]);

  console.log("\n✅ All Transfers Complete:");
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W1's token (${token1.toBase58()}) from W1. Tx: ${transfer1}`);
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W2's Token A (${token2a.toBase58()}) from W2. Tx: ${transfer2a}`);
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W2's Token B (${token2b.toBase58()}) from W2. Tx: ${transfer2b}`);
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W3's token (${token3.toBase58()}) from W3. Tx: ${transfer3}`);
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W1's token (${token1.toBase58()}) from W3. Tx: ${transfer1w3}`);
  console.log(`- W4 transferred ${TRANSFER_AMOUNT} of W2's Token A (${token2a.toBase58()}) from W3. Tx: ${transfer2aw3}`);

  console.log("\n===== Token Setup Process Completed Successfully =====");
}



async function main(): Promise<void> {
  try {
    console.log("Starting Solana Token Delegation Demo");
    
    // Step 1: Load or create wallets
    const wallets: Keypair[] = [];
    let shouldSaveToEnv = false;
    
    // Check if all wallet keys exist in .env
    const allWalletsExist = Array.from({length: WALLET_COUNT}, (_, i) => 
      process.env[`W${i+1}_PUBLIC_KEY`] && process.env[`W${i+1}_SECRET_KEY`]
    ).every(Boolean);

    if (allWalletsExist) {
      console.log("Loading existing wallets from .env");
      for (let i = 0; i < WALLET_COUNT; i++) {
        wallets.push(loadKeypair(`W${i+1}_PUBLIC_KEY`, `W${i+1}_SECRET_KEY`));
      }
    } else {
      console.log("Generating new wallets");
      for (let i = 0; i < WALLET_COUNT; i++) {
        wallets.push(Keypair.generate());
      }
      shouldSaveToEnv = true;
    }

    // Display all wallet addresses
    wallets.forEach((wallet, index) => {
      console.log(`W${index+1} Public Key:`, wallet.publicKey.toBase58());
    });

    // Save to .env if we generated new wallets
    if (shouldSaveToEnv) {
      saveKeysToEnv(wallets);
    }

    // Step 2: Check initial balances
    console.log("\nChecking initial balances...");
    
    

    for (const wallet of wallets) {
      await getBalance(wallet.publicKey);
    }

    // Step 3: Wait for user to fund wallets
    console.log(
      `\nPlease fund these wallets with at least ${MIN_REQUIRED_SOL} SOL each on Devnet:\n` +
      wallets.map((wallet, index) => `W${index+1}: ${wallet.publicKey.toBase58()}`).join('\n') +
      "\n\nThen press Enter to continue..."
    );
    await new Promise(resolve => process.stdin.once("data", resolve));

    // Step 4: Verify funding
    await verifyBalances(wallets);

    // Step 5: Execute token operations (using W1 and W2 as before)
    await setupTestTokens(wallets[0], wallets[1],wallets[2],wallets[3]);
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






