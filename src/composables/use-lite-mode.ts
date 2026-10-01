/**
 * «Економний режим» для слабких ПК і повільного інтернету.
 *
 * Прапорець `data-lite="1"` на `<html>` виставляє інлайн-скрипт в `index.html` ДО першого
 * кадру (евристика: deviceMemory / hardwareConcurrency / Save-Data / 2g-3g / reduced-motion
 * або збережений вибір користувача в localStorage). CSS реагує на нього у `_lite.scss` і
 * `_tokens.scss` (без backdrop-blur, без фонових нескінченних анімацій, без плівки/сканлайнів).
 *
 * Цей composable — JS-дзеркало того ж прапорця: компоненти з важкою логікою (ротація
 * зображень у hero, паралакс, таймери) вимикають її, коли режим активний.
 */

const LITE_STORAGE_KEY = 'core-league:lite'

const isLiteRef = ref(readLiteFromDocument())

function readLiteFromDocument (): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.lite === '1'
}

/**
 * Явний вибір користувача: `true` / `false` — зафіксувати, `null` — повернути авто-визначення
 * (застосується після перезавантаження; поточна сторінка перемикається одразу).
 */
function setLiteMode (value: boolean | null): void {
  try {
    if (value === null) localStorage.removeItem(LITE_STORAGE_KEY)
    else localStorage.setItem(LITE_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // приватний режим / заблоковане сховище — лишаємо лише поточний стан
  }
  const next = value ?? readLiteFromDocument()
  if (next) document.documentElement.dataset.lite = '1'
  else delete document.documentElement.dataset.lite
  isLiteRef.value = next
}

export function useLiteMode () {
  return {
    isLite: readonly(isLiteRef),
    setLiteMode
  }
}
