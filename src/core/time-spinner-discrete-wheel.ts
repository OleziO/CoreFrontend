/**
 * Element Plus time spinner крутить нативний scroll — одне «клацання» колеса
 * дає великий deltaY і пролітає кілька значень. Тут: один wheel event = ±1 рядок.
 */
const WRAP_SELECTOR = '.el-time-spinner .el-scrollbar__wrap'

function getItemHeight (wrap: HTMLElement): number {
  const li = wrap.querySelector<HTMLElement>('li.el-time-spinner__item')
  if (!li) return 32
  const h = li.getBoundingClientRect().height
  return h > 0 ? h : 32
}

export function installTimeSpinnerDiscreteWheel (): void {
  if (typeof document === 'undefined') return

  document.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      const target = e.target
      if (!(target instanceof Element)) return

      const wrap = target.closest<HTMLElement>(WRAP_SELECTOR)
      if (!wrap) return

      const dir = Math.sign(e.deltaY)
      if (dir === 0) return

      const itemH = getItemHeight(wrap)
      const maxScroll = Math.max(0, wrap.scrollHeight - wrap.clientHeight)

      e.preventDefault()
      e.stopPropagation()

      let next = wrap.scrollTop + dir * itemH
      next = Math.max(0, Math.min(maxScroll, next))
      next = Math.round(next / itemH) * itemH
      wrap.scrollTop = next
    },
    { capture: true, passive: false }
  )
}
