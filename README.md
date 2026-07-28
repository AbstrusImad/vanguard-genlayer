# Vanguard

Decentralized work bounty platform on GenLayer Bradbury Testnet. Sponsors post tasks with GEN rewards, hunters submit solutions, and an AI arbiter (FORGE) under validator consensus evaluates quality and releases payment.

## Architecture

- **Intelligent Contract** (`contracts/contract.py`): Python contract on GenLayer with AI consensus evaluation
- **Frontend** (`frontend/`): Next.js 14 static export, React 18, TypeScript
- **Tests**: gltest (direct + integration), Vitest + RTL (frontend)

## Contract Methods

### Writes
| Method | Payable | Description |
|--------|---------|-------------|
| `create_bounty` | Yes | Post bounty with GEN reward lock |
| `submit_work` | No | Submit work for an open bounty |
| `evaluate_submission` | No | Trigger FORGE AI consensus evaluation |
| `cancel_bounty` | No | Cancel and refund (sponsor only) |
| `appeal_evaluation` | No | Appeal an approved evaluation (sponsor only) |
| `settle_bounty` | No | Release payment to hunter |

### Views
| Method | Description |
|--------|-------------|
| `get_bounties(start)` | Paginated bounty list |
| `get_bounty(id)` | Single bounty detail |
| `get_submissions(bounty_id)` | All submissions for a bounty |
| `get_reputation(addr)` | Hunter reputation record |
| `get_stats()` | Platform statistics |
| `get_chronicle(start)` | Paginated event log |

## Workflows

1. **Bounty Lifecycle**: Create → Submit → Evaluate → Settle (pay hunter)
2. **Cancel Flow**: Create → Cancel (refund sponsor)
3. **Appeal Flow**: Evaluate → Appeal → Re-evaluate → Settle or Cancel

## Local Setup

```bash
# Contract tests
cd vanguard
gltest tests/direct/test_contract.py --leader-only -v

# Frontend
cd frontend
npm install
npm run dev    # Development server
npm run build  # Production static export
npm run test   # Vitest tests
```

## Deployment

- **Network**: GenLayer Bradbury Testnet
- **Contract**: `0x96ad011A8a988AA2Ab4cDC61D683B0A76b7d03bc`
- **Deploy TX**: `0xd8a0da8980f1cebcbd832a3e1c7eadb150051aa11293802bd44dc44e14197692`
- **Status**: ACCEPTED / FINISHED_WITH_RETURN (Bradbury RPC read blocked)
- **Frontend**: GitHub Pages

## License

MIT
