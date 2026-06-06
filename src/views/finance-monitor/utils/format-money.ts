import type { FeedItemSign } from '../finance.types'

export const kopecksToUah = (kopecks: number): number => kopecks / 100

export const uahToKopecks = (uah: number): number => Math.round(uah * 100)

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value)

export const formatUah = (
  kopecks: number,
  sign?: FeedItemSign,
  options?: { showSign?: boolean }
): string => {
  const showSign = options?.showSign ?? true
  const absUah = Math.abs(kopecksToUah(kopecks))
  const prefix = showSign
    ? sign === 'POSITIVE'
      ? '+ '
      : sign === 'NEGATIVE'
        ? '- '
        : kopecks < 0
          ? '- '
          : kopecks > 0
            ? '+ '
            : ''
    : ''

  return `${prefix}₴${formatNumber(absUah)}`
}

export const formatCompactK = (kopecks: number): string => {
  const roundedUah = Math.floor(kopecksToUah(kopecks) / 100) * 100
  const thousands = roundedUah / 1000
  const formatted = Number.isInteger(thousands)
    ? `${thousands}k`
    : `${thousands.toFixed(1)}k`

  return formatted.replace(/\.0k$/, 'k')
}

export const signColorClass = (sign: FeedItemSign): string =>
  sign === 'POSITIVE' ? 'text-green-400' : 'text-red-400'
