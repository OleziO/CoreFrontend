import { useQuery, type UseQueryOptions } from '@pinia/colada'

// TODO: think about another solution to show loading with placeholder
export const useQueryWrapper = <T>(
  options: UseQueryOptions<T, TAppAxiosError, T>,
  placeholder?: any,
  onError?: (error: TAppAxiosError) => void) => {
  const query = useQuery<T, TAppAxiosError, T>({
    ...options,
    placeholderData: placeholder
  })

  watch(query.error, (error) => {
    if (error) {
      if (onError) {
        return onError(error)
      }
    }
  })

  return {
    ...query,
    data: computed(() => query.data.value || placeholder as T),
    isPending: computed(() => query.isPending.value || query.isPlaceholderData.value)
  }
}

export type TQueryWrapper<T = any> = typeof useQueryWrapper<T>
export type TQueryWrapperReturnType<T = any> = ReturnType<TQueryWrapper<T>>
