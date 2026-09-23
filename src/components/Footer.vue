<template>
  <footer class="footer">
    <!-- LEGAL + COPYRIGHT -->
    <div class="footer__meta">
      <a
        href="/dogovir.pdf"
        target="_blank"
        rel="noopener noreferrer"
        class="footer__legal"
        title="Договір публічної оферти"
      >
        <PhFileText :size="16" class="shrink-0" />
        <span class="footer__legal-label">Договір публічної оферти</span>
        <span class="footer__legal-label--short">Оферта</span>
      </a>
      <span class="footer__copy">© {{ year }} Core League</span>
    </div>

    <!-- NAV — desktop bar only, app-tab style -->
    <nav class="footer__nav" aria-label="Навігація у футері">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="footer__nav-link"
        :class="{ 'is-active': isActive(item.name) }"
        :aria-current="isActive(item.name) ? 'page' : undefined"
        active-class=""
        exact-active-class=""
      >
        <component
          :is="item.icon"
          :size="24"
          :weight="isActive(item.name) ? 'fill' : 'regular'"
          class="shrink-0"
        />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <!-- SOCIALS -->
    <ul class="footer__socials">
      <li v-for="social in socialLinks" :key="social.name">
        <a
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="footer__social"
          :aria-label="social.name"
          :title="social.name"
        >
          <component :is="social.icon" :size="20" />
        </a>
      </li>
    </ul>
  </footer>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import {
  PhHouse,
  PhTrophy,
  PhUsersThree,
  PhUser,
  PhFileText,
  PhYoutubeLogo,
  PhTelegramLogo,
  PhDiscordLogo,
  PhInstagramLogo,
  PhTiktokLogo,
  PhTwitchLogo
} from '@phosphor-icons/vue'

/**
 * Липка смуга внизу екрана лише для lg+: оферта | навігація | соцмережі.
 * На мобільному й планшеті футер не рендериться: навігація живе в
 * MobileBottomTabBar, соцмережі та оферта — в MobileMenu.
 */
const route = useRoute()
const year = new Date().getFullYear()

const navItems: Array<{ name: string; label: string; icon: Component }> = [
  { name: routeNames.rootPage, label: 'Головна', icon: PhHouse },
  { name: routeNames.tournaments, label: 'Турніри', icon: PhTrophy },
  { name: routeNames.teams, label: 'Команди', icon: PhUsersThree },
  { name: routeNames.players, label: 'Гравці', icon: PhUser }
]

// Сторінка деталей підсвічує свій розділ (як у мобільному таббарі).
const detailOf: Record<string, string> = {
  [routeNames.tournaments]: routeNames.tournament,
  [routeNames.teams]: routeNames.team,
  [routeNames.players]: routeNames.player
}

function isActive (name: string): boolean {
  return route.name === name || route.name === detailOf[name]
}

const socialLinks: Array<{ name: string; url: string; icon: Component }> = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: PhYoutubeLogo },
  { name: 'Telegram', url: 'https://t.me/core_league_dota2', icon: PhTelegramLogo },
  { name: 'Discord', url: 'https://discord.gg/QeDj9TjmgM', icon: PhDiscordLogo },
  { name: 'Instagram', url: 'https://www.instagram.com/core__league/', icon: PhInstagramLogo },
  { name: 'TikTok', url: 'https://www.tiktok.com/@core_league_lviv', icon: PhTiktokLogo },
  { name: 'Twitch', url: 'https://www.twitch.tv/core_league', icon: PhTwitchLogo }
]
</script>

<style scoped lang="scss">
// Видимість керується тут, а не утилітою в шаблоні: scoped-селектор
// специфічніший за `.lg\:hidden` і переміг би її. Нижче lg футер прихований.
.footer {
  display: none;
  border-top: 1px solid var(--ds-border);

  @screen lg {
    @apply sticky bottom-0 z-50 grid h-72 w-full items-center gap-24 bg-surface/85 px-40 backdrop-blur-xl;
    grid-template-columns: 1fr auto 1fr;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.3);
  }
}

// Neon hairline on the top edge (mirrors the header's bottom line).
.footer::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, rgba(46, 229, 255, 0.55) 50%, transparent 100%);
}

// ─── Nav — як таби мобільного застосунку ────────────────────────────────────
// Іконка над підписом, велика зона натискання, активний розділ — м'яка
// «пігулка» в кольорі бренду.
.footer__nav {
  @apply flex items-center justify-center gap-8;
}

.footer__nav-link {
  @apply inline-flex h-60 min-w-[120px] flex-col items-center justify-center gap-4
    rounded-2xl px-20 no-underline text-caption font-medium text-white/55;
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(46, 229, 255, 0.55);
    outline-offset: 2px;
  }

  &.is-active {
    @apply text-primary;
    background-color: rgba(46, 229, 255, 0.1);
    box-shadow: inset 0 0 0 1px rgba(46, 229, 255, 0.22), var(--ds-glow-primary-soft);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

// ─── Socials ────────────────────────────────────────────────────────────────
.footer__socials {
  @apply m-0 flex list-none flex-wrap items-center justify-end gap-4 p-0;
}

.footer__social {
  @apply inline-flex size-40 items-center justify-center rounded-full text-white/60 no-underline;
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(46, 229, 255, 0.55);
    outline-offset: 2px;
  }
}

// ─── Legal + copyright ──────────────────────────────────────────────────────
.footer__meta {
  @apply flex flex-wrap items-center justify-start gap-x-16 gap-y-6 text-caption text-white/45;
}

.footer__legal {
  @apply inline-flex items-center gap-6 text-caption text-white/50 no-underline;
  transition: color var(--ds-duration-fast) ease;

  &:focus-visible {
    outline: 2px solid rgba(46, 229, 255, 0.55);
    outline-offset: 2px;
  }
}

// Повна назва документа на мобільному та на широких екранах; коротка — коли
// у смузі стає тісно (lg…xl).
.footer__legal-label--short {
  display: none;
}

@screen lg {
  .footer__legal-label {
    display: none;
  }

  .footer__legal-label--short {
    display: inline;
  }
}

@screen xl {
  .footer__legal-label {
    display: inline;
  }

  .footer__legal-label--short {
    display: none;
  }
}

// ─── Hover — лише для справжнього курсора, без «залипання» на тачі ──────────
@media (hover: hover) and (pointer: fine) {
  .footer__nav-link:hover:not(.is-active) {
    @apply text-white;
    background-color: rgba(255, 255, 255, 0.05);
  }

  .footer__social:hover {
    @apply text-primary;
    background-color: rgba(46, 229, 255, 0.08);
    box-shadow: var(--ds-glow-primary-soft);
  }

  .footer__legal:hover {
    @apply text-primary;
  }
}
</style>
