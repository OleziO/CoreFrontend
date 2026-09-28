import type { MaybeRefOrGetter } from 'vue'
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  TITLE_SUFFIX
} from '@/config/seo'

/**
 * SEO-параметри сторінки. Задаються в `meta.seo` маршруту (статичні сторінки)
 * або через `useSeo()` у view (динамічні заголовки з даних API).
 */
export type TSeoOptions = {
  /** Заголовок без суфікса сайту; суфікс додається сам, якщо назви сайту ще немає. */
  title?: string
  description?: string
  /** Шлях канонічного URL без домену й query. За замовч. — `route.path`. */
  canonicalPath?: string
  /** Абсолютний URL зображення для соцмереж. */
  image?: string
  /**
   * Заборонити індексацію. За замовч. приватні маршрути (без `meta.public`)
   * не індексуються — їх все одно не видно без токена.
   */
  noindex?: boolean
}

type TRouteLike = Pick<RouteLocationNormalized, 'meta' | 'path'>

function upsertMeta (attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink (rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function resolveTitle (title: string | undefined): string {
  const trimmed = title?.trim()
  if (!trimmed) return DEFAULT_TITLE
  return trimmed.includes(SITE_NAME) ? trimmed : `${trimmed}${TITLE_SUFFIX}`
}

/** Записує title/description/canonical/robots/Open Graph/Twitter у `<head>`. Без Vue — чистий DOM. */
export function applySeo (options: TSeoOptions = {}): void {
  if (typeof document === 'undefined') return

  const title = resolveTitle(options.title)
  const description = options.description?.trim() || DEFAULT_DESCRIPTION
  const canonicalPath = options.canonicalPath ?? window.location.pathname
  const canonical = `${SITE_URL}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
  const image = options.image || DEFAULT_OG_IMAGE

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', options.noindex ? 'noindex, nofollow' : 'index, follow')
  upsertLink('canonical', canonical)

  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', image)

  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)
}

/** SEO маршруту: `meta.seo` + дефолти (canonical = path, noindex для приватних). */
export function resolveRouteSeo (route: TRouteLike): TSeoOptions {
  const seo = route.meta.seo ?? {}
  return {
    ...seo,
    canonicalPath: seo.canonicalPath ?? route.path,
    noindex: seo.noindex ?? !route.meta.public
  }
}

/** Викликається з `router.afterEach` — базовий SEO для кожної навігації. */
export function applyRouteSeo (route: TRouteLike): void {
  applySeo(resolveRouteSeo(route))
}

/**
 * Динамічний SEO у view (назва турніру/команди/гравця з API). Перекриває
 * `meta.seo` поточного маршруту та оновлюється разом із даними.
 *
 * Маршрут знімається один раз у setup: ефект не має залежати від `useRoute()`,
 * інакше при переході він спрацює зі старими даними на новому маршруті раніше,
 * ніж компонент розмонтується. Додатково вимикаємось у `onBeforeRouteLeave`.
 */
export function useSeo (source: MaybeRefOrGetter<TSeoOptions>): void {
  const route: RouteLocationNormalizedLoaded = useRoute()
  const routeDefaults = resolveRouteSeo({ meta: route.meta, path: route.path })
  let active = true

  onBeforeRouteLeave(() => {
    active = false
  })

  watchEffect(() => {
    const options = toValue(source)
    if (!active) return
    applySeo({ ...routeDefaults, ...options })
  })
}
