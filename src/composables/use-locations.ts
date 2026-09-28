import { locationsService } from '@/services/locations.service'
import type { TCountry } from '@/api/types/api.types'

/** Опція для селекта країни: локалізована назва + англійська для пошуку. */
export interface ICountryOption {
  value: string
  label: string
  englishName: string
}

const UK_REGION_NAMES = (() => {
  try {
    return new Intl.DisplayNames(['uk'], { type: 'region' })
  } catch {
    return null
  }
})()

/** Назва країни українською з ISO alpha-2; фолбек — англійська назва з довідника або сам код. */
export function getCountryDisplayName (code: string | null | undefined, englishName?: string | null): string {
  const normalized = String(code ?? '').trim().toUpperCase()
  if (!normalized) return ''
  try {
    const localized = UK_REGION_NAMES?.of(normalized)
    if (localized && localized !== normalized) return localized
  } catch {
    /* невалідний код регіону — падаємо на фолбек */
  }
  return englishName?.trim() || normalized
}

/**
 * Прапор як зображення (flagcdn.com, PNG за шириною). Emoji-прапори не рендеряться у Chrome на
 * Windows (видно лише літери коду), тому картинка. Порожньо для невалідного коду.
 */
export function getCountryFlagUrl (code: string | null | undefined, width: 20 | 40 | 80 = 40): string {
  const normalized = String(code ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return ''
  return `https://flagcdn.com/w${width}/${normalized.toLowerCase()}.png`
}

// Кеш на рівні модуля: країни спільні для всіх, міста — по коду країни.
const countries = ref<TCountry[]>([])
const countriesLoading = ref(false)
const citiesByCountry = ref<Record<string, string[]>>({})
const citiesLoadingFor = ref<string | null>(null)

/**
 * Оркестрація довідника локацій для редагування профілю та відображення.
 * Мережа — у `locationsService`; тут стан завантаження, опції для селектів і
 * резолв назв країн.
 */
export function useLocations () {
  const countryOptions = computed<ICountryOption[]>(() =>
    countries.value
      .map((c) => ({
        value: c.code,
        label: getCountryDisplayName(c.code, c.name),
        englishName: c.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'uk'))
  )

  const countryByCode = computed(() => {
    const map = new Map<string, TCountry>()
    for (const c of countries.value) map.set(c.code, c)
    return map
  })

  async function loadCountries (): Promise<TCountry[]> {
    if (countries.value.length) return countries.value
    countriesLoading.value = true
    try {
      countries.value = await locationsService.fetchCountries()
      return countries.value
    } finally {
      countriesLoading.value = false
    }
  }

  async function loadCities (countryCode: string | null | undefined): Promise<string[]> {
    const code = String(countryCode ?? '').trim().toUpperCase()
    if (!code) return []
    const cached = citiesByCountry.value[code]
    if (cached) return cached
    citiesLoadingFor.value = code
    try {
      const cities = await locationsService.fetchCities(code)
      citiesByCountry.value = { ...citiesByCountry.value, [code]: cities }
      return cities
    } finally {
      if (citiesLoadingFor.value === code) citiesLoadingFor.value = null
    }
  }

  function citiesOf (countryCode: string | null | undefined): string[] {
    const code = String(countryCode ?? '').trim().toUpperCase()
    return code ? (citiesByCountry.value[code] ?? []) : []
  }

  function countryLabel (code: string | null | undefined): string {
    const normalized = String(code ?? '').trim().toUpperCase()
    return getCountryDisplayName(normalized, countryByCode.value.get(normalized)?.name)
  }

  const citiesLoading = computed(() => citiesLoadingFor.value !== null)

  return {
    countries,
    countryOptions,
    countriesLoading,
    citiesLoading,
    loadCountries,
    loadCities,
    citiesOf,
    countryLabel
  }
}
