export const useTogglerStore = defineStore('toggler', () => {
  const showMobileMenu = ref(false)

  return {
    showMobileMenu
  }
})
