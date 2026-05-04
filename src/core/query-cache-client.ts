import { useQueryCache } from '@pinia/colada'

type TQueryCache = ReturnType<typeof useQueryCache>

let queryCacheInstance: TQueryCache | null = null

function getQueryCache (): TQueryCache {
  if (!queryCacheInstance) {
    queryCacheInstance = useQueryCache()
  }
  return queryCacheInstance
}

/**
 * Ледаче підключення до Pinia Colada: модуль може імпортуватися під час
 * `createApp(App)` до `app.use(pinia)`, тому `useQueryCache()` не викликаємо на верхньому рівні файлу.
 */
export const queryCache = new Proxy({} as TQueryCache, {
  get (_target, prop, receiver) {
    const cache = getQueryCache()
    const value = Reflect.get(cache, prop, receiver)
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(cache)
    }
    return value
  }
})
