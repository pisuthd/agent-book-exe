/**
 * ENS Registration Script for Sepolia Testnet
 * 
 * This script demonstrates the commit-reveal registration process for .eth names.
 * Run with: npx ts-node scripts/register-ens.ts <name> [duration_years]
 * 
 * Example: npx ts-node scripts/register-ens.ts myname 1
 */

import 'dotenv/config';
import { config, publicClient, walletClient, account } from '../src/config';
import { encodeFunctionData, namehash, parseEther } from 'viem';

// ENS Sepolia Deployment Addresses (from docs.ens.domains)
// Source: https://docs.ens.domains/contract-reference/deployments
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const;
const ETH_REGISTRAR_CONTROLLER_ADDRESS = '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968' as const;
const PUBLIC_RESOLVER_ADDRESS = '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5' as const;

// ETHRegistrarController ABI (corrected from ENS docs)
const ETH_REGISTRAR_CONTROLLER_ABI = [{ "inputs": [{ "internalType": "contract BaseRegistrarImplementation", "name": "_base", "type": "address" }, { "internalType": "contract IPriceOracle", "name": "_prices", "type": "address" }, { "internalType": "uint256", "name": "_minCommitmentAge", "type": "uint256" }, { "internalType": "uint256", "name": "_maxCommitmentAge", "type": "uint256" }, { "internalType": "contract IReverseRegistrar", "name": "_reverseRegistrar", "type": "address" }, { "internalType": "contract IDefaultReverseRegistrar", "name": "_defaultReverseRegistrar", "type": "address" }, { "internalType": "contract ENS", "name": "_ens", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }], "name": "CommitmentNotFound", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }, { "internalType": "uint256", "name": "minimumCommitmentTimestamp", "type": "uint256" }, { "internalType": "uint256", "name": "currentTimestamp", "type": "uint256" }], "name": "CommitmentTooNew", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }, { "internalType": "uint256", "name": "maximumCommitmentTimestamp", "type": "uint256" }, { "internalType": "uint256", "name": "currentTimestamp", "type": "uint256" }], "name": "CommitmentTooOld", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "duration", "type": "uint256" }], "name": "DurationTooShort", "type": "error" }, { "inputs": [], "name": "InsufficientValue", "type": "error" }, { "inputs": [], "name": "MaxCommitmentAgeTooHigh", "type": "error" }, { "inputs": [], "name": "MaxCommitmentAgeTooLow", "type": "error" }, { "inputs": [{ "internalType": "string", "name": "name", "type": "string" }], "name": "NameNotAvailable", "type": "error" }, { "inputs": [], "name": "ResolverRequiredForReverseRecord", "type": "error" }, { "inputs": [], "name": "ResolverRequiredWhenDataSupplied", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }], "name": "UnexpiredCommitmentExists", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "label", "type": "string" }, { "indexed": true, "internalType": "bytes32", "name": "labelhash", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "baseCost", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "premium", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "expires", "type": "uint256" }, { "indexed": false, "internalType": "bytes32", "name": "referrer", "type": "bytes32" }], "name": "NameRegistered", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "string", "name": "label", "type": "string" }, { "indexed": true, "internalType": "bytes32", "name": "labelhash", "type": "bytes32" }, { "indexed": false, "internalType": "uint256", "name": "cost", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "expires", "type": "uint256" }, { "indexed": false, "internalType": "bytes32", "name": "referrer", "type": "bytes32" }], "name": "NameRenewed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [], "name": "MIN_REGISTRATION_DURATION", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "label", "type": "string" }], "name": "available", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }], "name": "commit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "commitments", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "defaultReverseRegistrar", "outputs": [{ "internalType": "contract IDefaultReverseRegistrar", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "ens", "outputs": [{ "internalType": "contract ENS", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "string", "name": "label", "type": "string" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }, { "internalType": "bytes32", "name": "secret", "type": "bytes32" }, { "internalType": "address", "name": "resolver", "type": "address" }, { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }, { "internalType": "uint8", "name": "reverseRecord", "type": "uint8" }, { "internalType": "bytes32", "name": "referrer", "type": "bytes32" }], "internalType": "struct IETHRegistrarController.Registration", "name": "registration", "type": "tuple" }], "name": "makeCommitment", "outputs": [{ "internalType": "bytes32", "name": "commitment", "type": "bytes32" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "maxCommitmentAge", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "minCommitmentAge", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "prices", "outputs": [{ "internalType": "contract IPriceOracle", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "recoverFunds", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "string", "name": "label", "type": "string" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }, { "internalType": "bytes32", "name": "secret", "type": "bytes32" }, { "internalType": "address", "name": "resolver", "type": "address" }, { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }, { "internalType": "uint8", "name": "reverseRecord", "type": "uint8" }, { "internalType": "bytes32", "name": "referrer", "type": "bytes32" }], "internalType": "struct IETHRegistrarController.Registration", "name": "registration", "type": "tuple" }], "name": "register", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "label", "type": "string" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }, { "internalType": "bytes32", "name": "referrer", "type": "bytes32" }], "name": "renew", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "label", "type": "string" }, { "internalType": "uint256", "name": "duration", "type": "uint256" }], "name": "rentPrice", "outputs": [{ "components": [{ "internalType": "uint256", "name": "base", "type": "uint256" }, { "internalType": "uint256", "name": "premium", "type": "uint256" }], "internalType": "struct IPriceOracle.Price", "name": "price", "type": "tuple" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "reverseRegistrar", "outputs": [{ "internalType": "contract IReverseRegistrar", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "interfaceID", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "label", "type": "string" }], "name": "valid", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "pure", "type": "function" }, { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }] as const;

// ENS commit-reveal timing constants (standard values)
const MIN_COMMITMENT_AGE = 60n; // 60 seconds
const MAX_COMMITMENT_AGE = 86400n; // 1 day

// Generate random secret bytes
function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function formatDuration(seconds: bigint): Promise<string> {
  const days = Number(seconds) / (24 * 60 * 60);
  if (days >= 365) {
    return `${(days / 365).toFixed(1)} years`;
  }
  return `${days.toFixed(0)} days`;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ENS Registration Script                     ║
╠══════════════════════════════════════════════════════════════╣
║  Usage: npx ts-node scripts/register-ens.ts <name> [years]   ║
║                                                                  ║
║  Example:                                                       ║
║    npx ts-node scripts/register-ens.ts myname 1                ║
║                                                                  ║
║  Notes:                                                         ║
║    - Name must be 3+ characters                                 ║
║    - Network: Sepolia (Chain ID: ${config.chainId})                        ║
║    - You need ETH for gas + registration fee                     ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  const label = args[0].toLowerCase().trim();
  const durationYears = args[1] ? parseInt(args[1]) : 1;

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ENS Registration Script                     ║
║                      Sepolia Testnet                          ║
╠══════════════════════════════════════════════════════════════╣
║  Name: ${label}.eth                                              ║
║  Duration: ${durationYears} year(s)                                      ║
║  Owner: ${account.address}    ║
╚══════════════════════════════════════════════════════════════╝
`);

  try {
    // Step 1: Check if name is valid
    console.log('📋 Step 1: Validating name...');
    const isValid = await publicClient.readContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'valid',
      args: [label]
    }) as boolean;

    if (!isValid) {
      console.error('❌ Error: Name must be at least 3 characters');
      process.exit(1);
    }
    console.log('✅ Name is valid (3+ characters)');

    // Step 2: Check availability
    console.log('\n🔍 Step 2: Checking availability...');
    const isAvailable = await publicClient.readContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'available',
      args: [label]
    }) as boolean;

    if (!isAvailable) {
      console.error('❌ Error: Name is not available (already registered or in grace period)');
      process.exit(1);
    }
    console.log('✅ Name is available!');

    // Step 3: Get pricing
    console.log('\n💰 Step 3: Calculating price...');
    const duration = BigInt(durationYears * 365 * 24 * 60 * 60); // Convert years to seconds
    const price = await publicClient.readContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'rentPrice',
      args: [label, duration]
    }) as { base: bigint; premium: bigint };

    const totalPrice = price.base + price.premium;
    console.log(`   Base cost: ${formatUnits(price.base, 18)} ETH`);
    console.log(`   Premium: ${formatUnits(price.premium, 18)} ETH`);
    console.log(`   Total: ${formatUnits(totalPrice, 18)} ETH`);

    // Step 4: Get commitment timing info
    console.log('\n⏱️  Step 4: Commitment timing (standard ENS values)...');
    console.log(`   Min wait: ${MIN_COMMITMENT_AGE} seconds (${formatDuration(MIN_COMMITMENT_AGE)})`);
    console.log(`   Max wait: ${MAX_COMMITMENT_AGE} seconds (${formatDuration(MAX_COMMITMENT_AGE)})`);

    const minCommitmentAge = MIN_COMMITMENT_AGE;
    const maxCommitmentAge = MAX_COMMITMENT_AGE;

    // Step 5: Generate secret and create commitment
    console.log('\n🔐 Step 5: Creating commitment...');
    const secret = generateSecret() as `0x${string}`;
    console.log(`   Secret: ${secret.slice(0, 10)}...${secret.slice(-6)}`);

    const registration: [
      string,
      `0x${string}`,
      bigint,
      `0x${string}`,
      `0x${string}`,
      readonly `0x${string}`[],
      number, // reverseRecord as uint8 (0 = none, 1 = Ethereum, etc.)
      `0x${string}` // referrer
    ] = [
        label,
        account.address,
        duration,
        secret,
        PUBLIC_RESOLVER_ADDRESS,
        [] as readonly `0x${string}`[],
        0, // reverseRecord: 0 = none
        '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}` // referrer
      ];

    const commitment = await publicClient.readContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'makeCommitment',
      args: [registration] as any
    }) as `0x${string}`;

    console.log(`   Commitment: ${commitment}`);

    // Step 6: Submit commitment transaction
    console.log('\n📤 Step 6: Submitting commitment transaction...');
    const commitHash = await walletClient.writeContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'commit',
      args: [commitment],
      account,
      chain: config.chain
    });

    console.log(`   Transaction: ${config.blockExplorer}/tx/${commitHash}`);
    await publicClient.waitForTransactionReceipt({ hash: commitHash });
    console.log('✅ Commitment submitted!');

    // Step 7: Wait for minimum commitment age
    const waitTimeMs = Number(minCommitmentAge) * 1000;
    console.log(`\n⏳ Step 7: Waiting ${Number(minCommitmentAge)} seconds for commitment to mature...`);
    console.log('   (This is required to prevent frontrunning attacks)');

    const waitStart = Date.now();
    for (let i = 0; i < waitTimeMs; i += 5000) {
      await sleep(5000);
      const elapsed = Math.floor((Date.now() - waitStart) / 1000);
      const remaining = Number(minCommitmentAge) - elapsed;
      process.stdout.write(`\r   Elapsed: ${elapsed}s | Remaining: ${remaining}s `);
    }
    console.log('\n✅ Commitment period complete!');

    // Step 8: Register the name
    console.log('\n🎉 Step 8: Registering name...');
    const registerHash = await walletClient.writeContract({
      address: ETH_REGISTRAR_CONTROLLER_ADDRESS,
      abi: ETH_REGISTRAR_CONTROLLER_ABI,
      functionName: 'register',
      args: [registration] as any,
      value: totalPrice,
      account,
      chain: config.chain
    } as any);

    console.log(`   Transaction: ${config.blockExplorer}/tx/${registerHash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: registerHash });
    console.log('✅ Name registered successfully!');

    // Summary
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Registration Complete!                     ║
╠══════════════════════════════════════════════════════════════╣
║  Name: ${label}.eth                                              ║
║  Transaction: ${config.blockExplorer}/tx/${registerHash}  ║
║  Gas Used: ${receipt.gasUsed.toString()}                                        ║
║                                                                  ║
║  You now own this ENS name on Sepolia testnet!                 ║
║  Note: This name only exists on Sepolia, not mainnet.          ║
╚══════════════════════════════════════════════════════════════╝
`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    if (error.code) console.error('   Code:', error.code);
    if (error.details) console.error('   Details:', error.details);
    process.exit(1);
  }
}

// Helper function to format ETH amounts
function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole}.${fractionStr} ETH`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });