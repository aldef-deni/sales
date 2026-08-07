/** Format ringkas untuk KPI dan sumbu grafik: "Rp 1,2 M", "Rp 340 jt". */
export function money(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `Rp ${trim(amount / 1_000_000_000)} M`
  if (abs >= 1_000_000) return `Rp ${trim(amount / 1_000_000)} jt`
  if (abs >= 1_000) return `Rp ${trim(amount / 1_000)} rb`
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`
}

/** Format penuh untuk tooltip, di mana ketelitian lebih berguna daripada keringkasan. */
export function moneyFull(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`
}

function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(rounded)
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)}%`
}

export function num(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('id-ID').format(value)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
