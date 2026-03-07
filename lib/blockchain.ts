import { createPublicClient, createWalletClient, http, keccak256, stringToHex, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const contractArtifact = require('../artifacts/contracts/PromisePulse.sol/PromisePulse.json');

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as `0x${string}` | undefined;
const RPC_URL = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Vote option mapping: NOT_VISIBLE=0, IN_PROGRESS=1, PARTIALLY_DONE=2, DONE=3, NOT_SURE=4
export const VOTE_OPTION_MAP: Record<string, number> = {
  NOT_VISIBLE: 0,
  IN_PROGRESS: 1,
  PARTIALLY_DONE: 2,
  DONE: 3,
  NOT_SURE: 4,
};

// Status mapping for updateStatus
export const STATUS_MAP: Record<string, number> = {
  RECORDED: 0,
  UNDER_REVIEW: 1,
  IN_PROGRESS: 1,
  PARTIALLY_DONE: 2,
  DONE: 3,
};

const abi = contractArtifact.abi as unknown[];

function getContractConfig() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not set');
  }
  return { address: CONTRACT_ADDRESS as `0x${string}`, abi };
}

function getWalletClient() {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set for blockchain writes');
  }
  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  return createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http(RPC_URL),
  });
}

export function isBlockchainConfigured(): boolean {
  return !!(CONTRACT_ADDRESS && PRIVATE_KEY && RPC_URL);
}

export async function addPromiseOnChain(
  promiseHash: `0x${string}`,
  category: string,
  region: string,
  sourceCid: string
): Promise<{ txHash: Hash; promiseId: bigint } | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(RPC_URL),
    });
    const walletClient = getWalletClient();
    const { address } = getContractConfig();

    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: 'addPromise',
      args: [promiseHash, category, region, sourceCid],
    });
    if (!hash) return null;

    await publicClient.waitForTransactionReceipt({ hash });
    const result = await publicClient.readContract({
      address,
      abi,
      functionName: 'nextPromiseId',
    });
    const newId = BigInt(result as bigint) - BigInt(1);
    return { txHash: hash, promiseId: newId };
  } catch (err) {
    console.error('addPromiseOnChain error:', err);
    return null;
  }
}

export async function addEvidenceOnChain(
  promiseId: number,
  evidenceCid: string,
  evidenceType: string
): Promise<Hash | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const walletClient = getWalletClient();
    const { address } = getContractConfig();

    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: 'addEvidence',
      args: [BigInt(promiseId), evidenceCid, evidenceType],
    });
    return hash || null;
  } catch (err) {
    console.error('addEvidenceOnChain error:', err);
    return null;
  }
}

export async function openReviewRoundOnChain(
  promiseId: number,
  triggerCid: string,
  endTime: number
): Promise<{ txHash: Hash; reviewRoundId: bigint } | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(RPC_URL),
    });
    const walletClient = getWalletClient();
    const { address } = getContractConfig();

    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: 'openReviewRound',
      args: [BigInt(promiseId), triggerCid, BigInt(endTime)],
    });
    if (!hash) return null;

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const result = await publicClient.readContract({
      address,
      abi,
      functionName: 'nextReviewRoundId',
    });
    const newId = BigInt(result as bigint) - BigInt(1);
    return { txHash: hash, reviewRoundId: newId };
  } catch (err) {
    console.error('openReviewRoundOnChain error:', err);
    return null;
  }
}

export async function castVoteOnChain(
  reviewRoundId: number,
  voteOption: number
): Promise<Hash | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const walletClient = getWalletClient();
    const { address } = getContractConfig();

    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: 'castVote',
      args: [BigInt(reviewRoundId), voteOption],
    });
    return hash || null;
  } catch (err) {
    console.error('castVoteOnChain error:', err);
    return null;
  }
}

export async function updateStatusOnChain(
  promiseId: number,
  status: number
): Promise<Hash | null> {
  if (!isBlockchainConfigured()) return null;
  try {
    const walletClient = getWalletClient();
    const { address } = getContractConfig();

    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: 'updateStatus',
      args: [BigInt(promiseId), status],
    });
    return hash || null;
  } catch (err) {
    console.error('updateStatusOnChain error:', err);
    return null;
  }
}

export function hashPromiseText(text: string): `0x${string}` {
  return keccak256(stringToHex(text)) as `0x${string}`;
}
