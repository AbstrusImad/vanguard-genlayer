# Vanguard Product Notes

Vanguard is a GenLayer-native work bounty platform. Sponsors post tasks with GEN rewards locked in the contract, hunters submit solutions, and an AI arbiter (FORGE) running under validator consensus evaluates submission quality against the bounty specification. Approved submissions trigger automatic GEN payment to the hunter. Failed evaluations return the bounty to open status for new submissions.

Roles:
- Sponsor: posts bounties, funds them with GEN, can cancel unfilled bounties, can appeal approved evaluations.
- Hunter: browses open bounties, submits work, earns GEN and reputation for approved submissions.
- Observer: reads bounty listings, evaluations, and reputation scores without transacting.

Platform scope:
- Entities: bounties, submissions, evaluations, reputation records.
- Actions: create bounty (with GEN deposit), submit work, evaluate submission (AI consensus), cancel bounty, appeal evaluation.
- Lifecycle: draft, open, submitted, evaluating, awarded, disputed, settled, expired.
- Durable outputs: on-chain payment receipts, hunter reputation scores, evaluation records.

Value transfer: Sponsors lock GEN when creating a bounty via payable write. On approval, the contract transfers GEN to the hunter. On cancel (no submissions), GEN returns to sponsor. On dispute resolution, the bounty either pays the hunter or refunds the sponsor.

There is no off-chain backend. The Intelligent Contract is the authoritative source for all bounty state, payments, and reputation. The frontend provides wallet connection, navigation, forms, and live reads from the contract.

Audience: freelancers, DAOs, grant programs, and open-source communities that want transparent, AI-evaluated task completion with automatic payment.

Primary workflow: connect account, create a funded bounty, receive a submission, trigger AI evaluation, see payment released and reputation updated.
