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

    <!-- SOCIALS -->
    <ul class="footer__socials" aria-label="Соцмережі">
      <li v-for="social in socialLinks" :key="social.name">
        <a
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="footer__social"
          :aria-label="social.name"
          :title="social.name"
        >
          <component :is="social.icon" :size="18" />
        </a>
      </li>
    </ul>
  </footer>
</template>

<script setup lang="ts">
import {
  PhFileText,
  PhYoutubeLogo,
  PhTelegramLogo,
  PhDiscordLogo,
  PhInstagramLogo,
  PhTiktokLogo,
  PhTwitchLogo
} from '@phosphor-icons/vue'

/**
 * Тонка смуга внизу екрана лише для lg+: оферта й копірайт | соцмережі.
 * Навігації тут немає — на десктопі вона в хедері (Header), на мобільному
 * й планшеті футер не рендериться: навігація живе в MobileBottomTabBar,
 * соцмережі та оферта — в MobileMenu.
 */
const year = new Date().getFullYear()

const socialLinks: Array<{ name: string; url: string; icon: Component }> = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: PhYoutubeLogo },
  { name: 'Telegram', url: 'https://t.me/core_league_lviv', icon: PhTelegramLogo },
  { name: 'Discord', url: 'https://discord.gg/QeDj9TjmgM', icon: PhDiscordLogo },
  { name: 'Instagram', url: 'https://www.instagram.com/core_league_lviv/', icon: PhInstagramLogo },
  { name: 'TikTok', url: 'https://www.tiktok.com/@core_league_lviv', icon: PhTiktokLogo },
  { name: 'Twitch', url: 'https://www.twitch.tv/core_league', icon: PhTwitchLogo }
]
</script>

<style scoped lang="scss">
// Видимість керується тут, а не утилітою в шаблоні: scoped-селектор
// специфічніший за `.lg\:hidden` і переміг би її. Нижче lg футер прихований.
// `.app-main` прокручується всередині (див. _base.scss), тож смуга завжди
// внизу вікна без sticky.
.footer {
  display: none;
  border-top: 1px solid var(--ds-border);

  @screen lg {
    @apply relative flex h-44 w-full items-center justify-between gap-24 bg-surface/85 px-40 backdrop-blur-xl;
  }
}

// Neon hairline on the top edge (mirrors the header's bottom line), dimmer
// than before so the strip reads as a footer, not a second toolbar.
.footer::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, transparent 0%, rgba(46, 229, 255, 0.35) 50%, transparent 100%);
}

// ─── Socials ────────────────────────────────────────────────────────────────
.footer__socials {
  @apply m-0 flex list-none items-center justify-end gap-2 p-0;
}

.footer__social {
  @apply inline-flex size-32 items-center justify-center rounded-full text-white/55 no-underline;
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

// Коротка назва документа, коли у смузі тісно (lg…xl); повна — на xl+.
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
