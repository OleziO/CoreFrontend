<template>
  <footer class="footer">
    <!-- ─── LEFT: brand + legal ─────────────────────────────────────────── -->
    <div class="footer__brand">
      <RouterLink :to="{ name: routeNames.rootPage }" class="footer__mark" aria-label="Core League — головна">
        <span class="footer__mark-dot" aria-hidden="true" />
        Core League
      </RouterLink>

      <span class="footer__sep" aria-hidden="true" />

      <span class="footer__copy">© {{ year }}</span>

      <!-- Статична сторінка поза SPA — звичайне посилання з повним переходом -->
      <a
        :href="legalPageHref('offer')"
        class="footer__legal"
        title="Договір публічної оферти"
      >
        <PhFileText :size="14" class="shrink-0" />
        <span class="footer__legal-label">Договір публічної оферти</span>
        <span class="footer__legal-label--short">Оферта</span>
      </a>
    </div>

    <!-- ─── CENTER: Telegram-група з новинами — головна дія футера ─────── -->
    <a
      :href="telegramUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="footer__community"
    >
      <span class="footer__community-icon">
        <PhTelegramLogo :size="16" weight="fill" />
      </span>
      <span class="footer__community-text">
        <span class="footer__community-title">Новини в Telegram</span>
        <span class="footer__community-sub">Dota 2 · новини Core League</span>
      </span>
      <span class="footer__community-go" aria-hidden="true">
        <PhArrowUpRight :size="13" weight="bold" />
      </span>
    </a>

    <!-- ─── RIGHT: socials ─────────────────────────────────────────────── -->
    <div class="footer__end">
      <ul class="footer__socials" aria-label="Соцмережі">
        <li v-for="social in socialLinks" :key="social.name">
          <a
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__social"
            :style="{ '--brand': social.color }"
            :aria-label="social.name"
            :title="social.name"
          >
            <component :is="social.icon" :size="17" />
          </a>
        </li>
      </ul>
    </div>

    <!-- «Нагору» плаває над правим кутом футера: у смузі не лишає порожнього місця,
         поки прихована, і нічого не зсуває, коли з'являється -->
    <button
      type="button"
      class="footer__top"
      :class="{ 'is-visible': showBackToTop }"
      :tabindex="showBackToTop ? 0 : -1"
      :aria-hidden="!showBackToTop"
      aria-label="Нагору"
      title="Нагору"
      @click="scrollToTop"
    >
      <PhArrowUp :size="16" weight="bold" />
    </button>
  </footer>
</template>

<script setup lang="ts">
import {
  PhArrowUp,
  PhArrowUpRight,
  PhFileText,
  PhYoutubeLogo,
  PhTelegramLogo,
  PhDiscordLogo,
  PhInstagramLogo,
  PhTiktokLogo,
  PhTwitchLogo
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { legalPageHref } from '@/config/legal-pages'

/**
 * Смуга внизу екрана лише для lg+: бренд і оферта | Telegram-група з новинами |
 * соцмережі й «нагору». Навігації тут немає — на десктопі вона в хедері, на
 * мобільному й планшеті футер не рендериться: навігація живе в
 * MobileBottomTabBar, соцмережі — в MobileMenu. Повний юридичний блок
 * (документи, реквізити, картки) — `LegalFooter` наприкінці кожної сторінки.
 */
const year = new Date().getFullYear()

/** Telegram-група: новини Dota 2 і все про проєкт. */
const telegramUrl = 'https://t.me/core_league_lviv'

/** `color` — фірмовий колір мережі, ним підсвічується іконка при наведенні. */
const socialLinks: Array<{ name: string; url: string; icon: Component; color: string }> = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: PhYoutubeLogo, color: '#ff3b3b' },
  { name: 'Telegram', url: telegramUrl, icon: PhTelegramLogo, color: '#2aabee' },
  { name: 'Discord', url: 'https://discord.gg/QeDj9TjmgM', icon: PhDiscordLogo, color: '#7983f5' },
  { name: 'Instagram', url: 'https://www.instagram.com/core_league_lviv/', icon: PhInstagramLogo, color: '#f0568a' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@core_league_lviv', icon: PhTiktokLogo, color: '#25f4ee' },
  { name: 'Twitch', url: 'https://www.twitch.tv/core_league', icon: PhTwitchLogo, color: '#a970ff' }
]

// ─── Back to top ────────────────────────────────────────────────────────────
// Скролиться не вікно, а `.app-main` (single-scroll, див. _base.scss) —
// він сусід футера в PageLayout, тож беремо його після монтування.
const scrollEl = ref<HTMLElement | null>(null)
const { y: scrollY } = useScroll(scrollEl)
const showBackToTop = computed(() => scrollY.value > 480)
const reducedMotion = usePreferredReducedMotion()

onMounted(() => {
  scrollEl.value = document.querySelector<HTMLElement>('.app-main')
})

function scrollToTop () {
  scrollEl.value?.scrollTo({ top: 0, behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
}
</script>

<style scoped lang="scss">
// Видимість керується тут, а не утилітою в шаблоні: scoped-селектор
// специфічніший за `.lg\:hidden` і переміг би її. Нижче lg футер прихований.
// `.app-main` прокручується всередині (див. _base.scss), тож смуга завжди
// внизу вікна без sticky.
.footer {
  display: none;
}

// Same glass recipe as the header, mirrored: lamps sit on the strip's top
// edge (cyan left, pink right) so header and footer frame the page as a pair.
@screen lg {
  .footer {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 24px;
    height: 56px;
    padding: 0 40px;
    background:
      radial-gradient(ellipse 320px 90px at 0% 0%, rgba(var(--ds-primary-rgb), 0.08), transparent 70%),
      radial-gradient(ellipse 280px 80px at 100% 0%, rgba(var(--ds-pink-rgb), 0.06), transparent 70%),
      linear-gradient(0deg, rgba(7, 8, 15, 0.94) 0%, rgba(13, 15, 28, 0.86) 100%);
    backdrop-filter: blur(20px) saturate(130%);
    -webkit-backdrop-filter: blur(20px) saturate(130%);
  }
}

// Cyan → pink hairline on the top edge — the header's bottom line, mirrored.
.footer::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(var(--ds-primary-rgb), 0.45) 30%,
    rgba(var(--ds-pink-rgb), 0.35) 70%,
    transparent 100%
  );
}

.footer__sep {
  width: 1px;
  height: 18px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
}

// ─── Brand + legal ──────────────────────────────────────────────────────────
.footer__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  justify-self: start;
}

.footer__mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.82);
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 3px;
    border-radius: 4px;
  }
}

// A small "online" lamp — the brand's one lit pixel down here.
.footer__mark-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
}

.footer__copy {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--ds-text-faint);
}

.footer__legal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  text-decoration: none;
  white-space: nowrap;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

// Коротка назва документа, коли у смузі тісно (lg…xl); повна — на xl+.
.footer__legal-label {
  display: none;
}

@screen xl {
  .footer__legal-label {
    display: inline;
  }

  .footer__legal-label--short {
    display: none;
  }
}

// ─── Telegram CTA ───────────────────────────────────────────────────────────
.footer__community {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 5px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(255, 255, 255, 0.03);
  text-decoration: none;
  white-space: nowrap;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

.footer__community-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 9999px;
  color: #fff;
  background: linear-gradient(135deg, #2aabee, #229ed9);
  box-shadow: 0 0 12px rgba(42, 171, 238, 0.45);
}

.footer__community-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 1;
}

.footer__community-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.footer__community-sub {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

// Підзаголовок лише на xl+ — на lg кнопка компактна, щоб влізли бічні колонки.
@media (max-width: 1279px) {
  .footer__community-sub {
    display: none;
  }
}

// Arrow sits in a round chip that mirrors the icon on the left, so the pill
// is symmetric; on hover the chip lights up while the arrow stays centred.
.footer__community-go {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-left: 2px;
  border-radius: 9999px;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease;

  svg {
    display: block;
  }
}

// ─── Socials ────────────────────────────────────────────────────────────────
.footer__end {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
}

.footer__socials {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

// ─── Back to top — floating above the footer's right corner ─────────────────
.footer__top {
  position: absolute;
  right: 40px;
  bottom: calc(100% + 16px);
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(13, 15, 28, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--ds-elevation-3);
  color: var(--ds-primary);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition:
    opacity var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out),
    visibility 0s linear var(--ds-duration-base),
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease;

  &.is-visible {
    opacity: 1;
    visibility: visible;
    transform: none;
    transition-delay: 0s;
  }

  &.is-visible:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

// ─── Hover — лише для справжнього курсора, без «залипання» на тачі ──────────
@media (hover: hover) and (pointer: fine) {
  .footer__mark:hover {
    color: var(--ds-primary);
  }

  .footer__legal:hover {
    color: var(--ds-primary);
  }

  .footer__community:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.45);
    background: rgba(var(--ds-primary-rgb), 0.07);
    box-shadow: var(--ds-glow-primary-soft);
  }

  .footer__community:hover .footer__community-go {
    color: var(--ds-primary-contrast);
    background: var(--ds-primary);
    box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.55);
  }

  // Іконка спалахує фірмовим кольором своєї мережі.
  .footer__social:hover {
    color: var(--brand);
    background-color: rgba(255, 255, 255, 0.06);
  }

  .footer__top.is-visible:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.14);
    box-shadow: var(--ds-glow-primary-soft);
  }
}
</style>
