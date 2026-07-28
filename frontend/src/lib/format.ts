const ATTO = 10n ** 18n;

export function genToAtto(gen: string): bigint {
  const s = gen.trim();
  if (!s || s.split('.').length > 2 || /[^0-9.]/.test(s)) return -1n;
  const [whole = '0', frac = ''] = s.split('.');
  const fracPadded = (frac + '0'.repeat(18)).slice(0, 18);
  return BigInt(whole || '0') * ATTO + BigInt(fracPadded || '0');
}

export function attoToGen(atto: string | number): string {
  const v = BigInt(atto);
  const whole = v / ATTO;
  const frac = v % ATTO;
  const tail = frac.toString().padStart(18, '0').replace(/0+$/, '');
  return tail ? `${whole}.${tail}` : whole.toString();
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr || '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function statusColor(status: string): string {
  switch (status) {
    case 'OPEN': return 'var(--c-open)';
    case 'SUBMITTED': return 'var(--c-submitted)';
    case 'EVALUATING': return 'var(--c-evaluating)';
    case 'AWARDED': return 'var(--c-awarded)';
    case 'DISPUTED': return 'var(--c-disputed)';
    case 'SETTLED': return 'var(--c-settled)';
    case 'CANCELLED': return 'var(--c-cancelled)';
    case 'APPROVE': return 'var(--c-awarded)';
    case 'REJECT': return 'var(--c-disputed)';
    default: return 'var(--c-muted)';
  }
}
