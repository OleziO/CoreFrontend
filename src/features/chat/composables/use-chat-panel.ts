import type { IChatPanelGeometry } from '@/features/chat/chat.d'

/** З цієї ширини чат — плаваюче вікно; нижче — повноекранний лист. */
const DESKTOP_FROM = 768
/** Нижче `lg` (992px) внизу закріплений `MobileBottomTabBar` (64px), з `lg` — смуга футера (56px). */
const TAB_BAR_UNTIL = 992
const TAB_BAR_HEIGHT = 64
const FOOTER_HEIGHT = 56
const GUTTER = 16
const DEFAULT_WIDTH = 500
const DEFAULT_HEIGHT = 600
const MIN_WIDTH = 340
const MIN_HEIGHT = 380
/** Відступ знизу для вікна за замовчуванням: над кнопкою чату (16px + 56px + проміжок). */
const LAUNCHER_CLEARANCE = 16 + 56 + 12

export type TResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * Геометрія плаваючого вікна чату: перетягування за шапку, зміна розміру за краї й кути,
 * збереження в localStorage та втискання у вʼюпорт при зміні розміру вікна браузера.
 * Поки користувач нічого не рухав, вікно стоїть у правому нижньому куті над кнопкою.
 */
export function useChatPanel () {
  const { width: vw, height: vh } = useWindowSize()
  const saved = useLocalStorage<IChatPanelGeometry | null>('chat:panel-geometry', null, {
    serializer: { read: v => (v ? JSON.parse(v) as IChatPanelGeometry : null), write: v => JSON.stringify(v) }
  })
  const interacting = ref(false)

  const isMobile = computed(() => vw.value < DESKTOP_FROM)
  const bottomInset = computed(() => (vw.value < TAB_BAR_UNTIL ? TAB_BAR_HEIGHT : FOOTER_HEIGHT))

  function clamp (g: IChatPanelGeometry): IChatPanelGeometry {
    const maxW = Math.max(MIN_WIDTH, vw.value - GUTTER * 2)
    const maxH = Math.max(MIN_HEIGHT, vh.value - bottomInset.value - GUTTER * 2)
    const width = Math.min(Math.max(g.width, MIN_WIDTH), maxW)
    const height = Math.min(Math.max(g.height, MIN_HEIGHT), maxH)
    const x = Math.min(Math.max(g.x, GUTTER), vw.value - width - GUTTER)
    const y = Math.min(Math.max(g.y, GUTTER), vh.value - bottomInset.value - height - GUTTER)
    return { x, y, width, height }
  }

  const defaultGeometry = computed<IChatPanelGeometry>(() => {
    const width = Math.min(DEFAULT_WIDTH, vw.value - GUTTER * 2)
    const room = vh.value - bottomInset.value - LAUNCHER_CLEARANCE - GUTTER
    const height = Math.min(DEFAULT_HEIGHT, Math.round(vh.value * 0.8), room)
    return clamp({
      x: vw.value - width - 24,
      y: vh.value - bottomInset.value - LAUNCHER_CLEARANCE - height,
      width,
      height
    })
  })

  const geometry = computed<IChatPanelGeometry>(() => (saved.value ? clamp(saved.value) : defaultGeometry.value))

  const panelStyle = computed<Record<string, string>>(() => {
    if (isMobile.value) return {} as Record<string, string>
    const g = geometry.value
    return { left: `${g.x}px`, top: `${g.y}px`, width: `${g.width}px`, height: `${g.height}px` }
  })

  /** Спільний цикл pointer-подій: `apply` отримує зсув від точки натискання. */
  type TApply = (dx: number, dy: number, start: IChatPanelGeometry) => IChatPanelGeometry

  function track (event: PointerEvent, apply: TApply) {
    if (isMobile.value || event.button !== 0) return
    event.preventDefault()
    const start = { ...geometry.value }
    const originX = event.clientX
    const originY = event.clientY
    interacting.value = true

    const onMove = (e: PointerEvent) => {
      saved.value = clamp(apply(e.clientX - originX, e.clientY - originY, start))
    }
    const onUp = () => {
      interacting.value = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  /** Перетягування за шапку; кнопки й вкладки в шапці лишаються клікабельними. */
  function startDrag (event: PointerEvent) {
    if ((event.target as HTMLElement | null)?.closest('button, a, input, [role="tab"]')) return
    track(event, (dx, dy, s) => ({ ...s, x: s.x + dx, y: s.y + dy }))
  }

  function startResize (event: PointerEvent, dir: TResizeDirection) {
    track(event, (dx, dy, s) => {
      const g = { ...s }
      if (dir.includes('e')) g.width = s.width + dx
      if (dir.includes('s')) g.height = s.height + dy
      if (dir.includes('w')) {
        const width = Math.max(MIN_WIDTH, s.width - dx)
        g.x = s.x + (s.width - width)
        g.width = width
      }
      if (dir.includes('n')) {
        const height = Math.max(MIN_HEIGHT, s.height - dy)
        g.y = s.y + (s.height - height)
        g.height = height
      }
      return g
    })
  }

  /** Подвійний клік по шапці повертає вікно на місце за замовчуванням. */
  function resetGeometry () {
    saved.value = null
  }

  return { isMobile, panelStyle, interacting, startDrag, startResize, resetGeometry }
}
