# Vanguard Design System

## Product Identity

Vanguard is a decentralized work bounty platform on GenLayer Bradbury Testnet. The audience is freelancers, DAOs, grant programs, and open-source communities.

**Emotional target**: Confident, professional, mission-oriented. The interface feels like a dark cargo terminal — efficient, focused, with warm amber accents that guide attention to critical actions and rewards.

**Surface mode**: Operate — scanning, comparison, repeated action, clear system status.

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--c-bg` | `#0c0c10` | Page background, deep charcoal |
| `--c-surface` | `#16161d` | Panels, cards, sidebar |
| `--c-surface-2` | `#1e1e28` | Nested surfaces, hover states |
| `--c-border` | `#2a2a36` | Borders, dividers |
| `--c-accent` | `#e09f3e` | Primary actions, rewards, brand |
| `--c-accent-dim` | `#b07e2e` | Hover accent, secondary highlight |
| `--c-text` | `#e8e0d0` | Primary text, warm bone |
| `--c-muted` | `#7a7a88` | Secondary text, labels |

### Semantic States

| State | Color | Usage |
|-------|-------|-------|
| Open | `#e09f3e` (amber) | Bounty accepting submissions |
| Submitted | `#5b9bd5` (blue) | Work submitted, awaiting evaluation |
| Evaluating | `#c084fc` (purple) | AI consensus in progress |
| Awarded | `#22c55e` (green) | Evaluation approved |
| Disputed | `#ef4444` (red) | Appeal filed, re-evaluation needed |
| Settled | `#06b6d4` (cyan) | Payment released |
| Cancelled | `#6b7280` (gray) | Bounty cancelled, refunded |

## Typography

| Role | Family | Weight | Usage |
|------|--------|--------|-------|
| Display | Syne | 700–800 | Brand, page titles, section headers |
| Body | Nunito Sans | 300–700 | All body text, forms, descriptions |
| Mono | Fira Code | 400–500 | Addresses, amounts, IDs, code, status pills |

## Spacing & Density

- Base gap: `16px`
- Small gap: `8px`
- Large gap: `24px`
- Sidebar width: `220px` (desktop), `180px` (tablet), hidden (mobile)
- Content max-width: `1200px` (wide desktop)

## Radius & Borders

- Small: `4px` — form inputs, pills, small elements
- Default: `8px` — panels, cards, buttons
- Large: `12px` — modals, overlays
- All borders: `1px solid var(--c-border)`

## Icon System

All icons from **lucide-react**, 14–18px, inheriting current color.

| Icon | Purpose | Context |
|------|---------|---------|
| LayoutGrid | Bounty listing | Sidebar nav |
| PlusCircle | Post bounty | Sidebar nav |
| Award | Reputation | Sidebar nav |
| ScrollText | Chronicle | Sidebar nav |
| Wallet | Wallet connection | Topbar chip |
| RefreshCw | Data refresh | Topbar button |
| ArrowLeft | Back navigation | Detail view |
| FileCheck | Submit work | Action buttons |
| XCircle | Cancel | Danger actions |
| Scale | Appeal | Danger actions |
| DollarSign | Settle/Pay | Primary actions |
| Search | Reputation lookup | Form actions |
| PackageSearch | Empty bounties | Empty state |

## Diagrams

**Lifecycle Diagram** — Horizontal flow showing bounty state transitions: OPEN → SUBMITTED → EVALUATING → AWARDED → SETTLED (with DISPUTED and CANCELLED branches). Active state highlighted with amber border.

## Motion

| ID | Trigger | Behavior | Reduced Motion |
|----|---------|----------|----------------|
| scan-sweep | AI evaluation pending | Amber gradient sweeps vertically across panel | Static amber pulse |
| panel-enter | Screen navigation | Subtle opacity/translate via framer-motion | Instant swap |
| spin | Loading state | 360° border-top rotation | Static spinner |

## Responsive Layout

| Breakpoint | Sidebar | Content | Bounty Rows |
|------------|---------|---------|-------------|
| 360px | Hidden | Full width | Single column, hidden ID/category |
| 768px | Hidden | Full width | Single column |
| 1024px | 180px | Fluid | 5-column grid |
| 1440px+ | 220px | Max 1200px | 5-column grid |

## Accessibility

- All interactive elements have `data-control-id` and accessible names
- Focus-visible styles with amber ring
- Semantic landmarks: `role="navigation"`, `role="dialog"`, `aria-label`, `aria-current`
- `prefers-reduced-motion` disables animations
- Contrast ratio: text on bg exceeds WCAG AA (4.5:1)
