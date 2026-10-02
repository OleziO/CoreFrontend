import type { IFindPage } from '@/views/find/find.d'

/**
 * Серверний список із кнопкою «Показати ще»: перша сторінка перезавантажується
 * при зміні фільтрів, наступні дописуються в кінець. Відповідь застарілого запиту
 * (фільтри змінились, поки він летів) відкидається.
 */
export function useFindPagedList<T extends { id: string }> (fetchPage: (offset: number) => Promise<IFindPage<T>>) {
  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const loadingMore = ref(false)
  const failed = ref(false)
  let generation = 0

  const hasMore = computed(() => items.value.length < total.value)

  async function reload (): Promise<void> {
    const current = ++generation
    loading.value = true
    failed.value = false
    try {
      const page = await fetchPage(0)
      if (current !== generation) return
      items.value = page.items
      total.value = page.total
    } catch {
      if (current !== generation) return
      failed.value = true
      items.value = []
      total.value = 0
    } finally {
      if (current === generation) loading.value = false
    }
  }

  async function loadMore (): Promise<void> {
    if (loading.value || loadingMore.value || !hasMore.value) return
    const current = generation
    loadingMore.value = true
    try {
      const page = await fetchPage(items.value.length)
      if (current !== generation) return
      const known = new Set(items.value.map(i => i.id))
      items.value = [...items.value, ...page.items.filter(i => !known.has(i.id))]
      total.value = page.total
    } catch {
      // тихо — кнопка лишається, можна натиснути ще раз
    } finally {
      loadingMore.value = false
    }
  }

  /** Підмінити картку свіжою відповіддю мутації (заявка, редагування). */
  function replaceItem (next: T): void {
    items.value = items.value.map(i => (i.id === next.id ? next : i))
  }

  function removeItem (id: string): void {
    const before = items.value.length
    items.value = items.value.filter(i => i.id !== id)
    if (items.value.length < before) total.value = Math.max(0, total.value - 1)
  }

  return { items, total, loading, loadingMore, failed, hasMore, reload, loadMore, replaceItem, removeItem }
}
