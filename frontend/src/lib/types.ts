export interface Bounty {
  id: string;
  sponsor: string;
  title: string;
  category: string;
  requirements: string;
  reward_atto: string | number;
  status: 'OPEN' | 'SUBMITTED' | 'EVALUATING' | 'AWARDED' | 'DISPUTED' | 'SETTLED' | 'CANCELLED';
  submission_ids: string[];
  evaluation: ConsensusResult | null;
  appeal_reason?: string;
}

export interface Submission {
  id: string;
  bounty_id: string;
  hunter: string;
  content: string;
  status: 'PENDING' | 'APPROVE' | 'REJECT';
  evaluation: ConsensusResult | null;
}

export interface ConsensusResult {
  decision: 'APPROVE' | 'REJECT';
  score: number;
  rationale: string;
}

export interface Reputation {
  address: string;
  approved: number;
  rejected: number;
  total_score: number;
}

export interface Stats {
  bounties: number;
  submissions: number;
  evaluations: number;
  appeals: number;
  total_awarded_gen: string;
}

export interface ChronicleEvent {
  event: string;
  id?: string;
  bounty?: string;
  submission?: string;
  hunter?: string;
  actor?: string;
  appellant?: string;
  reward?: string;
  refund?: string;
  paid?: string;
  score?: number;
}

export type ScreenId =
  | 'bounty-board'
  | 'bounty-detail'
  | 'create-bounty'
  | 'submit-work'
  | 'reputation-ledger'
  | 'chronicle';
