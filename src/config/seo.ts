/**
 * SEO-константи сайту. Єдине джерело для composables/use-seo.ts і роут-мети.
 * Статичні теги в index.html дублюють ці значення для ботів без JS
 * (прев'ю в Telegram/Discord, перший прохід Googlebot).
 *
 * Домен — з редіректу в public/images/.htaccess (www.core-league-dota2.org);
 * перевизначається через VITE_SITE_URL.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.core-league-dota2.org').replace(/\/+$/, '')

export const SITE_NAME = 'Core League'

/** Дописується до заголовка сторінки, якщо він ще не містить назву сайту. */
export const TITLE_SUFFIX = ` — ${SITE_NAME}`

export const DEFAULT_TITLE = 'Core League — турніри з Dota 2 у Львові та Україні'

export const DEFAULT_DESCRIPTION =
  'Core League — українська кіберспортивна ліга з Dota 2. Онлайн та LAN-турніри 5×5 у Львові й по всій Україні, ' +
  'призові фонди, рейтинг гравців і live-трансляції. Збери команду та реєструйся на турнір.'

/** Абсолютний URL зображення для og:image / twitter:image (1024×1024). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/core_logo_ny.jpg`
