export function useGetFile () {
  const file = ref<File | null>(null)
  const preview = ref<string | null | undefined>(null)

  function load (e: Event) {
    const input = e.target as HTMLInputElement
    const f = input.files?.[0]

    if (!f) return
    file.value = f

    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = URL.createObjectURL(f)
  }

  function reset () {
    if (preview.value) URL.revokeObjectURL(preview.value)
    
    preview.value = null
    file.value = null
  }

  return {
    file,
    preview,
    load,
    reset
  }
}
