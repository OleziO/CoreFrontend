import { type Raw } from 'vue'

const modals = ref(new Map<PropertyKey, { component: unknown; props?: unknown; isOpen: boolean}>())

export function useModals<T extends Record<PropertyKey, ReturnType<typeof defineAsyncComponent>>> (_components: T) {
  type TComponentsType = typeof _components
  type TComponentNames = keyof TComponentsType

  type TInferProps<TComp> = TComp extends new (...args: unknown[]) => infer R
    ? R extends { $props: infer P } ? P: never
    : never

  type TComponentProps = {
    [K in TComponentNames]: TInferProps<TComponentsType[K]>
  }

  function open<K extends TComponentNames> (name: K, props?: TComponentProps[K]) {
    const comp = _components[name]
    if (comp == null) {
      console.error(`[useModals] Невідома модалка: ${String(name)}`)
      return
    }

    modals.value.set(name, {
      component: markRaw(comp) as Raw<typeof comp>,
      props,
      isOpen: true
    })
  }

  function close (name: TComponentNames) {
    const modal = modals.value.get(name)
    if (modal) {
      modal.isOpen = false
    }
  }

  const isOpen = computed(() => {
    return [...modals.value.entries()].reduce((acc, [name, { isOpen }]) => {
      acc[name as string] = isOpen
      return acc
    }, {} as Record<string, boolean>) as Record<TComponentNames, boolean>
  })
  return {
    modals: modals as Ref<Map<TComponentNames, { component: unknown; props?: unknown; isOpen: boolean}>>,
    isOpen,
    open,
    close
  }
}
