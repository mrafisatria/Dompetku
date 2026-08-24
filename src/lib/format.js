const amountFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

export function sanitizeAmountInput(value) {
  return String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
}

export function formatAmountInput(value) {
  const digits = sanitizeAmountInput(value)
  return digits ? amountFormatter.format(Number(digits)) : ''
}
