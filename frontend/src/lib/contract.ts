import { createAccount, createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import type { Bounty, Submission, Stats, Reputation, ChronicleEvent } from './types';

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x96ad011A8a988AA2Ab4cDC61D683B0A76b7d03bc') as `0x${string}`;
export const DEPLOY_TX = (process.env.NEXT_PUBLIC_DEPLOY_TX || '0xd8a0da8980f1cebcbd832a3e1c7eadb150051aa11293802bd44dc44e14197692') as `0x${string}`;
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const NETWORK_NAME = 'GenLayer Bradbury Testnet';
export const HAS_LIVE_CONTRACT = !/^0x0{40}$/i.test(CONTRACT_ADDRESS);

export const readClient = createClient({ chain: testnetBradbury });
export const makeWalletClient = (account: `0x${string}`) => createClient({ chain: testnetBradbury, account });
export const makeLocalClient = (privateKey: `0x${string}`) => createClient({ chain: testnetBradbury, account: createAccount(privateKey) });
export type SignerClient = ReturnType<typeof makeWalletClient>;

export const explorerTx = (hash: string) => `${EXPLORER}/transactions/${hash}`;
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`;

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|-32429/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

export const fetchBounties = () => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_bounties', args: [0] }) as unknown as Promise<Bounty[]>);
export const fetchBounty = (id: string) => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_bounty', args: [id] }) as unknown as Promise<Bounty>);
export const fetchSubmissions = (bountyId: string) => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_submissions', args: [bountyId] }) as unknown as Promise<Submission[]>);
export const fetchStats = () => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_stats', args: [] }) as unknown as Promise<Stats>);
export const fetchReputation = (addr: string) => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_reputation', args: [addr] }) as unknown as Promise<Reputation>);
export const fetchChronicle = () => withRpcRetry(() => readClient.readContract({ address: CONTRACT_ADDRESS, functionName: 'get_chronicle', args: [0] }) as unknown as Promise<ChronicleEvent[]>);

type WalletClient = ReturnType<typeof makeWalletClient>;

export const sendCreateBounty = (client: WalletClient, title: string, category: string, requirements: string, rewardAtto: bigint) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'create_bounty', args: [title, category, requirements], value: rewardAtto });
export const sendSubmitWork = (client: WalletClient, bountyId: string, content: string) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'submit_work', args: [bountyId, content], value: 0n });
export const sendEvaluate = (client: WalletClient, bountyId: string) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'evaluate_submission', args: [bountyId], value: 0n });
export const sendCancel = (client: WalletClient, bountyId: string) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'cancel_bounty', args: [bountyId], value: 0n });
export const sendAppeal = (client: WalletClient, bountyId: string, reason: string) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'appeal_evaluation', args: [bountyId, reason], value: 0n });
export const sendSettle = (client: WalletClient, bountyId: string) =>
  client.writeContract({ address: CONTRACT_ADDRESS, functionName: 'settle_bounty', args: [bountyId], value: 0n });

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING', '2': 'PROPOSING', '3': 'COMMITTING', '4': 'REVEALING',
  '5': 'ACCEPTED', '6': 'UNDETERMINED', '7': 'FINALIZED', '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT', '13': 'LEADER_TIMEOUT',
};
export const statusName = (s: unknown) => STATUS_NAME[String(s)] ?? String(s).toUpperCase();
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface LeaderDraft { decision?: string; score?: number; rationale?: string }

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function extractLeaderDraft(tx: unknown): LeaderDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const b64 = pick(pick(first, 'eq_outputs'), '0');
    if (typeof b64 !== 'string') return null;
    const text = atob(b64);
    for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] !== '{') continue;
      try {
        const obj = JSON.parse(text.slice(i));
        if (obj && typeof obj === 'object' && 'decision' in obj) return obj as LeaderDraft;
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollUntilDecided(client: WalletClient, hash: `0x${string}`, onUpdate?: (status: string, draft: LeaderDraft | null) => void) {
  let draft: LeaderDraft | null = null;
  for (let i = 0; i < 150; i++) {
    const tx = await client.getTransaction({ hash } as Parameters<typeof client.getTransaction>[0]).catch(() => null);
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = (tx && extractLeaderDraft(tx)) ?? draft;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}

export function friendlyError(e: unknown) {
  const msg = String(e);
  if (/user rejected|denied|rejected the request/i.test(msg)) return 'You cancelled the signature.';
  if (/LackOfFundForMaxFee|insufficient/i.test(msg)) return 'The wallet needs more test GEN for the fee reserve.';
  if (/rate limit|429|-32429/i.test(msg)) return 'Bradbury is rate-limiting calls. Wait and retry.';
  const expected = msg.match(/\[EXPECTED\][^\n"']*/);
  if (expected) return expected[0].replace('[EXPECTED]', '').trim();
  return 'Transaction failed. Check the explorer for details.';
}
