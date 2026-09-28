import apiClient from '@/api/client'
import { ElMessage } from 'element-plus'
import type { TCountry } from '@/api/types/api.types'

/**
 * Довідник локацій для профілю (країна + місто). Бекенд проксіює countriesnow.space
 * і вже прибирає заборонені країни (RU / BY / IR) — клієнт лише кешує на сесію.
 *
 * Singleton, auto-imported як `locationsService`. Стан завантаження та вибір — у
 * композаблі `useLocations`; тут тільки мережа + тости.
 */

let countriesCache: TCountry[] | null = null
const citiesCache = new Map<string, string[]>()

class LocationsService {
  /** Дозволені країни; одна мережа на сесію. */
  async fetchCountries (force = false): Promise<TCountry[]> {
    if (countriesCache && !force) return countriesCache
    try {
      countriesCache = await apiClient.get('/locations/countries')
      return countriesCache
    } catch (e) {
      ElMessage.error('Не вдалося завантажити список країн')
      throw e
    }
  }

  /** Міста однієї країни за ISO alpha-2; кешуються по коду. */
  async fetchCities (countryCode: string, force = false): Promise<string[]> {
    const code = countryCode.trim().toUpperCase()
    const cached = citiesCache.get(code)
    if (cached && !force) return cached
    try {
      const { cities } = await apiClient.get('/locations/cities', { params: { countryCode: code } })
      citiesCache.set(code, cities)
      return cities
    } catch (e) {
      ElMessage.error('Не вдалося завантажити список міст')
      throw e
    }
  }
}

export const locationsService = new LocationsService()
