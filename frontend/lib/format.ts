const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

export function formatDateShort(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDate()
  const month = MONTHS_SHORT[d.getUTCMonth()]
  return `${day}-${month}`
}

export function formatDateFull(date: Date): string {
  const d = new Date(date)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

export function formatPrice(value: number): string {
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}
