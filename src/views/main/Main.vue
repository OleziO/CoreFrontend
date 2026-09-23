<template>
  <div class="home-page overflow-x-hidden">
    <!-- ═══════════════════════════════════════════════════════════
         HERO (src/views/main/components/HomeHero.vue)
    ══════════════════════════════════════════════════════════════ -->
    <HomeHero
      :tournaments="activeTournaments"
      :players-count="playersCount"
      :teams-count="teamsCount"
      :discord-members="discordMembers"
    />

    <!-- ═══════════════════════════════════════════════════════════
         FEATURE STRIP
    ══════════════════════════════════════════════════════════════ -->
    <section class="py-50 relative">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-6xl mx-auto px-24">
        <!-- Header: title left, lead line right, mono module counter as the HUD tell -->
        <div class="reveal mb-28 flex flex-col gap-16 md:flex-row md:items-end md:justify-between">
          <div>
            <span class="sys-label mb-12 flex items-center gap-12">
              <span>// Що таке Core League</span>
              <span class="hud-line h-px w-40" aria-hidden="true" />
              <span class="sys-label--muted">{{ pad(features.length) }} модулі</span>
            </span>
            <h2 class="font-display text-3xl md:text-4xl uppercase tracking-wide text-white neon-text-subtle">
              Платформа нового рівня
            </h2>
          </div>
          <p class="max-w-[380px] text-sm leading-relaxed text-gray-400 md:text-right">
            Турніри, трансляції, статистика і спільнота — усе, що потрібно команді, в одній системі.
          </p>
        </div>

        <!-- Zigzag bento: 7/5 then 5/7 on lg, so the eye travels instead of scanning a row -->
        <div class="grid gap-16 md:grid-cols-2 lg:grid-cols-12">
          <div
            v-for="(feat, idx) in features"
            :key="feat.title"
            class="reveal"
            :class="feat.span"
            :style="{ transitionDelay: `${idx * 70}ms` }"
          >
            <component
              :is="feat.href ? 'a' : 'RouterLink'"
              :href="feat.href"
              :to="feat.to"
              :target="feat.href ? '_blank' : undefined"
              :rel="feat.href ? 'noopener noreferrer' : undefined"
              class="feature-card neon-card rounded-2xl p-24 md:p-28"
              :style="{ '--feat-rgb': feat.rgb }"
            >
              <span class="feature-card__ghost" aria-hidden="true">{{ pad(idx + 1) }}</span>

              <span class="flex items-start justify-between gap-16">
                <span class="feature-card__index">{{ pad(idx + 1) }}</span>
                <span class="feature-card__well">
                  <component :is="feat.icon" :size="22" weight="duotone" />
                </span>
              </span>

              <h3 class="feature-card__title">{{ feat.title }}</h3>
              <p class="feature-card__desc">{{ feat.description }}</p>

              <span class="feature-card__cta">
                <span>{{ feat.cta }}</span>
                <PhArrowUpRight v-if="feat.href" :size="14" weight="bold" class="feature-card__arrow is-external" />
                <PhArrowRight v-else :size="14" weight="bold" class="feature-card__arrow" />
              </span>
            </component>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         TOURNAMENTS (competitive content — surfaced above sponsors/FAQ)
    ══════════════════════════════════════════════════════════════ -->
    <section v-if="tournamentsLoading || activeTournaments.length" class="py-50">
      <div class="max-w-6xl mx-auto px-24">
        <div class="reveal mb-28 flex items-end justify-between gap-16">
          <div>
            <span class="sys-label mb-12 flex items-center gap-12">
              <span>// Змагання</span>
              <span class="hud-line h-px w-40" aria-hidden="true" />
              <span v-if="!tournamentsLoading" class="sys-label--muted">
                {{ pad(activeTournaments.length) }} активних
              </span>
            </span>
            <h2 class="font-display text-3xl md:text-4xl uppercase tracking-wide text-white neon-text-subtle">
              Активні турніри
            </h2>
          </div>
          <RouterLink
            to="/tournaments"
            class="hidden md:flex items-center gap-8 text-sm text-gray-400 hover:text-white
                   transition-colors group cursor-pointer"
          >
            Всі турніри
            <PhArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
          </RouterLink>
        </div>

        <!-- Loading skeleton: spotlight-shaped -->
        <div v-if="tournamentsLoading" class="h-[380px] rounded-2xl bg-dark-card animate-pulse" />

        <template v-else>
          <!-- Nearest tournament gets the spotlight; the rest follow as cards -->
          <TournamentSpotlight :tournament="activeTournaments[0]" class="reveal" />

          <div
            v-if="restTournaments.length"
            class="mt-24 grid gap-24 md:grid-cols-2 lg:grid-cols-3 justify-items-center"
          >
            <TournamentCard
              v-for="(t, idx) in restTournaments"
              :key="t.id"
              :tournament="t"
              class="reveal w-full"
              :style="{ transitionDelay: `${idx * 70}ms` }"
            />
            <!-- Fill tile: keeps the row balanced and gives the list a way out -->
            <RouterLink
              to="/tournaments"
              class="reveal tournaments-more neon-card w-full rounded-2xl p-24"
              :style="{ transitionDelay: `${restTournaments.length * 70}ms`, minHeight: `${TOURNAMENT_CARD_HEIGHT}px` }"
            >
              <span class="tournaments-more__ghost" aria-hidden="true">{{ pad(activeTournaments.length) }}</span>
              <span class="sys-label !text-[10px]">// Архів і розклад</span>
              <span class="tournaments-more__title">Усі турніри</span>
              <span class="tournaments-more__desc">Минулі сезони, майбутні анонси та повний розклад.</span>
              <span class="tournaments-more__cta">
                <span>Перейти</span>
                <PhArrowRight :size="14" weight="bold" class="tournaments-more__arrow" />
              </span>
            </RouterLink>
          </div>
        </template>

        <div class="mt-32 text-center md:hidden reveal">
          <RouterLink
            to="/tournaments"
            class="inline-flex items-center gap-8 text-sm text-gray-400 hover:text-white
                   transition-colors cursor-pointer"
          >
            Всі турніри <PhArrowRight :size="16" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         SPONSORS
    ══════════════════════════════════════════════════════════════ -->
    <section class="relative py-50">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-6xl mx-auto px-24">
        <!-- Header: gold register, slot counter, partnership CTA on the right -->
        <div class="reveal mb-28 flex flex-col gap-16 md:flex-row md:items-end md:justify-between">
          <div>
            <span class="sys-label sys-label--gold mb-12 flex items-center gap-12">
              <span>// Підтримка</span>
              <span class="hud-line h-px w-40" aria-hidden="true" />
              <span class="sys-label--muted">{{ pad(sponsorsFilled) }}/{{ pad(sponsorsTotal) }} слотів</span>
            </span>
            <h2 class="font-display text-3xl md:text-4xl uppercase tracking-wide text-white neon-text-gold">
              Партнери та спонсори
            </h2>
          </div>
          <a
            :href="PARTNERSHIP_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="sponsor-cta self-start md:self-auto"
          >
            <PhPaperPlaneTilt :size="16" weight="fill" />
            <span>Стати партнером</span>
            <PhArrowUpRight :size="14" weight="bold" class="sponsor-cta__arrow" />
          </a>
        </div>

        <!-- Tiers: each row is a rack of slots; filled ones carry the logo, open ones are for sale -->
        <div class="flex flex-col gap-16">
          <div
            v-for="(tier, tierIdx) in sponsorTiers"
            :key="tier.key"
            class="reveal sponsor-tier"
            :class="`is-${tier.key}`"
            :style="{ '--tier-rgb': tier.rgb, transitionDelay: `${tierIdx * 90}ms` }"
          >
            <div class="sponsor-tier__head">
              <span class="sponsor-tier__label">{{ tier.label }}</span>
              <span class="sponsor-tier__rule" aria-hidden="true" />
              <span class="sponsor-tier__meta">{{ pad(tier.sponsors.length) }} / {{ pad(tier.slots) }}</span>
            </div>

            <div class="sponsor-tier__grid" :class="tier.gridClass">
              <a
                v-for="sponsor in tier.sponsors"
                :key="sponsor.name"
                :href="sponsor.url"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="sponsor.name"
                class="sponsor-slot sponsor-slot--filled hud-corners"
                :class="{ 'sponsor-slot--dark': sponsor.dark }"
              >
                <img :src="sponsor.logo" :alt="sponsor.name" loading="lazy" class="sponsor-slot__logo">
              </a>

              <a
                v-for="n in tier.slots - tier.sponsors.length"
                :key="`open-${n}`"
                :href="PARTNERSHIP_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="sponsor-slot sponsor-slot--open hud-corners"
                :style="{ '--scan-delay': `${(n - 1) * 1.3}s` }"
                :aria-label="`Вільний слот ${tier.label.toLowerCase()} — стати партнером`"
              >
                <span class="sponsor-slot__scan" aria-hidden="true" />
                <span class="sponsor-slot__index">slot {{ pad(tier.sponsors.length + n) }}</span>
                <span class="sponsor-slot__state">Вільно</span>
                <span class="sponsor-slot__hint">Стати партнером <PhArrowUpRight :size="11" weight="bold" /></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         COMMUNITY
    ══════════════════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden py-50">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-6xl mx-auto px-24 relative">
        <!-- Header -->
        <div class="reveal mb-28 flex flex-col gap-16 md:flex-row md:items-end md:justify-between">
          <div>
            <span class="sys-label mb-12 flex items-center gap-12">
              <span>// Спільнота</span>
              <span class="hud-line h-px w-40" aria-hidden="true" />
              <span class="sys-label--muted">{{ pad(socials.length + 1) }} каналів</span>
            </span>
            <h2 class="font-display text-3xl md:text-4xl uppercase tracking-wide text-white neon-text-subtle">
              Приєднуйся до нас
            </h2>
          </div>
          <p class="max-w-[380px] text-sm leading-relaxed text-gray-400 md:text-right">
            Discord — для гри та реєстрацій. Соцмережі — для новин, трансляцій і хайлайтів.
          </p>
        </div>

        <!-- Discord: the whole panel is the link -->
        <a
          href="https://discord.gg/QeDj9TjmgM"
          target="_blank"
          rel="noopener noreferrer"
          class="reveal community-discord neon-card hud-corners hud-corners--fade rounded-2xl"
        >
          <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0 z-[3]" aria-hidden="true" />
          <span class="community-discord__glow" aria-hidden="true" />
          <span class="scanlines" aria-hidden="true" />

          <span class="relative z-[2] grid items-center gap-24 p-24 md:grid-cols-[auto_1fr_auto] md:p-32">
            <span class="community-discord__well">
              <Icon name="discord" :size="34" />
            </span>

            <span class="flex min-w-0 flex-col gap-8">
              <span class="community-discord__kicker">
                <span class="community-discord__dot" aria-hidden="true" />
                Discord · онлайн-центр ліги
              </span>
              <span class="font-display text-2xl uppercase tracking-wide text-white md:text-[26px]">
                Core League Discord
              </span>
              <span class="max-w-[520px] text-sm leading-relaxed text-gray-400">
                Реєстрація на турніри, розклад матчів, підтримка та живе спілкування.
              </span>
            </span>

            <span class="flex flex-col items-start gap-16 md:items-end">
              <span v-if="discordMembers > 0" class="community-discord__count">
                <b>{{ discordMembers.toLocaleString('uk-UA') }}+</b>
                <small>учасників</small>
              </span>
              <span class="community-discord__cta">
                <Icon name="discord" :size="18" />
                <span>Приєднатись</span>
                <PhArrowUpRight :size="14" weight="bold" class="community-discord__arrow" />
              </span>
            </span>
          </span>
        </a>

        <!-- Socials: brand-hued tiles with the handle as the second line -->
        <div class="mt-16 grid grid-cols-2 gap-12 sm:grid-cols-3 lg:grid-cols-5">
          <a
            v-for="(social, idx) in socials"
            :key="social.label"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="reveal community-link"
            :style="{ '--link-rgb': social.rgb, transitionDelay: `${idx * 60}ms` }"
          >
            <span class="community-link__well">
              <Icon :name="social.icon" :size="18" />
            </span>
            <span class="flex min-w-0 flex-col">
              <span class="community-link__label">{{ social.label }}</span>
              <span class="community-link__handle truncate">{{ social.handle }}</span>
            </span>
            <PhArrowUpRight :size="14" weight="bold" class="community-link__arrow" />
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FAQ
    ══════════════════════════════════════════════════════════════ -->
    <section class="relative py-50">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-6xl mx-auto px-24">
        <div class="grid gap-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-48">
          <!-- Left: header + contact, sticky on desktop -->
          <div class="reveal flex flex-col gap-24 lg:sticky lg:top-88 lg:self-start">
            <div>
              <span class="sys-label mb-12 flex items-center gap-12">
                <span>// Відповіді на питання</span>
                <span class="hud-line h-px w-40" aria-hidden="true" />
                <span class="sys-label--muted">{{ pad(faqItems.length) }} питань</span>
              </span>
              <h2 class="font-display text-4xl uppercase tracking-wide text-white neon-text-subtle md:text-5xl">
                FAQ
              </h2>
              <p class="mt-16 max-w-[400px] text-sm leading-relaxed text-gray-400">
                Коротко про реєстрацію, команди, верифікацію, внески та формат матчів.
                Якщо чогось не знайшли — пишіть, відповімо особисто.
              </p>
            </div>

            <a
              href="https://t.me/CoreLeague_Admin"
              target="_blank"
              rel="noopener noreferrer"
              class="faq-contact neon-card hud-corners rounded-2xl p-20"
            >
              <span class="faq-contact__well">
                <PhPaperPlaneTilt :size="18" weight="fill" />
              </span>
              <span class="flex min-w-0 flex-col gap-4">
                <span class="text-[15px] font-semibold text-white">Не знайшли відповідь?</span>
                <span class="text-sm leading-relaxed text-gray-400">
                  Напишіть адміністрації в Telegram — відповімо.
                </span>
              </span>
              <PhArrowUpRight :size="16" weight="bold" class="faq-contact__arrow" />
            </a>
          </div>

          <!-- Right: numbered accordion -->
          <ol class="faq-list">
            <!-- `reveal` lives on the li with static classes only: Vue rewrites the
                 class attribute when a binding changes, which would drop the
                 observer-added `revealed`. The open state sits on the inner div. -->
            <li
              v-for="(item, idx) in faqItems"
              :key="idx"
              class="reveal"
              :style="{ transitionDelay: `${idx * 50}ms` }"
            >
              <div class="faq-item" :class="{ 'is-open': openFaq === idx }">
                <button
                  :id="`faq-btn-${idx}`"
                  type="button"
                  class="faq-item__head"
                  :aria-expanded="openFaq === idx"
                  :aria-controls="`faq-panel-${idx}`"
                  @click="toggleFaq(idx)"
                >
                  <span class="faq-item__index">{{ pad(idx + 1) }}</span>
                  <span class="faq-item__q">{{ item.q }}</span>
                  <span class="faq-item__caret" aria-hidden="true">
                    <PhPlus :size="14" weight="bold" />
                  </span>
                </button>
                <div
                  :id="`faq-panel-${idx}`"
                  class="faq-item__panel"
                  role="region"
                  :aria-labelledby="`faq-btn-${idx}`"
                >
                  <div class="faq-item__panel-inner">
                    <p class="faq-item__a">{{ item.a }}</p>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import playersPartnerLogo from '@/assets/images/sponsor-players.png'
// Явний імпорт: новий каталог components/ не підхоплюється сканером
// unplugin-vue-components без перезапуску dev-сервера.
import HomeHero from '@/views/main/components/HomeHero.vue'
import TournamentSpotlight from '@/views/main/components/TournamentSpotlight.vue'
import { TOURNAMENT_CARD_HEIGHT } from '@/views/tournaments/tournaments.enums'
import {
  PhArrowRight,
  PhArrowUpRight,
  PhPaperPlaneTilt,
  PhPlus,
  PhShieldStar,
  PhBroadcast,
  PhDesktop,
  PhUsersThree
} from '@phosphor-icons/vue'
import type { TIconName } from '@/components/Icon.vue'
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { routeNames } from '@/router/route-names'

// ── Feature strip ──────────────────────────────────────────────────────────
interface IFeature {
  icon: Component
  title: string
  description: string
  cta: string
  /** Accent hue as an `r, g, b` triplet (a token var) — drives the card's whole register. */
  rgb: string
  /** Grid span on lg: 7/5 then 5/7 for the zigzag. */
  span: string
  to?: RouteLocationRaw
  href?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

const features: IFeature[] = [
  {
    icon: PhShieldStar,
    title: 'Турніри для всіх рівнів',
    description: 'Відкрита реєстрація — будь-яка верифікована команда може заявитися на турнір.',
    cta: 'До турнірів',
    rgb: 'var(--ds-primary-rgb)',
    span: 'lg:col-span-7',
    to: { name: routeNames.tournaments }
  },
  {
    icon: PhBroadcast,
    title: 'Live трансляції',
    description: 'Матчі транслюються на нашому Twitch каналі з коментарями.',
    cta: 'Дивитись на Twitch',
    rgb: 'var(--ds-secondary-rgb)',
    span: 'lg:col-span-5',
    href: 'https://www.twitch.tv/core_league'
  },
  {
    icon: PhDesktop,
    title: 'Власна платформа',
    description: 'Реєстрація, управління командами та статистика — все в одному місці.',
    cta: 'Гравці та команди',
    rgb: 'var(--ds-gold-rgb)',
    span: 'lg:col-span-5',
    to: { name: routeNames.players }
  },
  {
    icon: PhUsersThree,
    title: 'Активна спільнота',
    description: 'Discord сервер з живим спілкуванням, підтримкою та новинами в реальному часі.',
    cta: 'Приєднатись у Discord',
    rgb: 'var(--ds-pink-rgb)',
    span: 'lg:col-span-7',
    href: 'https://discord.gg/QeDj9TjmgM'
  }
]

// ── Sponsors ───────────────────────────────────────────────────────────────
const PARTNERSHIP_URL = 'https://t.me/CoreLeague_Admin'

interface ISponsor {
  name: string
  url: string
  logo: string
  /** Logo is light-on-dark: render the well black instead of white. */
  dark?: boolean
}

interface ISponsorTier {
  key: 'title' | 'gold' | 'partner'
  label: string
  /** Total slots in the rack; open ones render as "for sale" tiles. */
  slots: number
  sponsors: ISponsor[]
  /** Accent hue as an `r, g, b` triplet. */
  rgb: string
  gridClass: string
}

const sponsorTiers: ISponsorTier[] = [
  {
    key: 'title',
    label: 'Титульний спонсор',
    slots: 1,
    rgb: 'var(--ds-gold-rgb)',
    gridClass: 'grid-cols-1 max-w-[360px] mx-auto',
    sponsors: [
      {
        name: 'BETKING',
        url: 'https://77953937.uatracer.link/',
        logo: '/sponsors/BETKING_Logo_Compact_Secondary_Secondary_Red_On_White.png'
      }
    ]
  },
  {
    key: 'gold',
    label: 'Золоті партнери',
    slots: 3,
    rgb: 'var(--ds-gold-rgb)',
    gridClass: 'grid-cols-1 sm:grid-cols-3',
    sponsors: []
  },
  {
    key: 'partner',
    label: 'Партнери',
    slots: 5,
    rgb: 'var(--ds-primary-rgb)',
    gridClass: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    sponsors: [
      { name: 'PLAYERS', url: 'https://players.com.ua/', logo: playersPartnerLogo },
      { name: 'CyberHUB', url: 'https://www.instagram.com/cyberhub_lviv/', logo: '/sponsors/CyberHUB_logo.png', dark: true }
    ]
  }
]

const sponsorsFilled = sponsorTiers.reduce((sum, t) => sum + t.sponsors.length, 0)
const sponsorsTotal = sponsorTiers.reduce((sum, t) => sum + t.slots, 0)

// ── Social links ───────────────────────────────────────────────────────────
interface ISocialLink {
  label: string
  handle: string
  url: string
  icon: TIconName
  /** Brand hue as an `r, g, b` triplet. */
  rgb: string
}

const socials: ISocialLink[] = [
  { label: 'Twitch', handle: '/core_league', url: 'https://www.twitch.tv/core_league', icon: 'twitch', rgb: '145, 70, 255' },
  { label: 'YouTube', handle: '@Core_League', url: 'https://www.youtube.com/@Core_League', icon: 'youtube', rgb: '255, 64, 64' },
  { label: 'Telegram', handle: '@core_league_dota2', url: 'https://t.me/core_league_dota2', icon: 'telegram', rgb: '42, 171, 238' },
  {
    label: 'Instagram',
    handle: '@core__league',
    url: 'https://www.instagram.com/core__league/',
    icon: 'instagram',
    rgb: 'var(--ds-pink-rgb)'
  },
  {
    label: 'TikTok',
    handle: '@core_league_lviv',
    url: 'https://www.tiktok.com/@core_league_lviv',
    icon: 'tiktok',
    rgb: 'var(--ds-primary-rgb)'
  }
]

// ── Stats ──────────────────────────────────────────────────────────────────
const playersCount = ref(0)
const teamsCount = ref(0)
const discordMembers = ref(0)

// ── Tournaments ────────────────────────────────────────────────────────────
const allTournaments = ref<TTournament[]>([])
const tournamentsLoading = ref(true)

// Турнір "активний", доки не завершений за статусом і його запланований
// кінець (tournamentEndsAt) ще в майбутньому — мірою часу, а не лише статусу.
function isTournamentEnded (t: TTournament): boolean {
  if (t.tournamentStatus === 'COMPLETED') return true
  return !!t.tournamentEndsAt && Date.parse(t.tournamentEndsAt) < Date.now()
}

const activeTournaments = computed(() =>
  allTournaments.value
    .filter(t => !isTournamentEnded(t))
    .slice(0, 3)
)

// Everything after the spotlighted first tournament.
const restTournaments = computed(() => activeTournaments.value.slice(1))

// ── FAQ ────────────────────────────────────────────────────────────────────
const openFaq = ref<number | null>(null)

const faqItems = [
  {
    q: 'Як зареєструватися на Core League?',
    a: 'Натисніть кнопку "Увійти через Discord" у шапці сайту. Авторизація відбувається через ваш Discord-акаунт — жодних довгих форм. Після входу ваш профіль створюється автоматично, після чого можна прив’язати Steam-акаунт і вступати до команди.'
  },
  {
    q: 'Як створити або приєднатися до команди?',
    a: 'Після реєстрації перейдіть у розділ "Команди" — там можна створити власну команду або прийняти запрошення капітана. Склад — 5 гравців; дозволено до 3 замін, заявлених і верифікованих до старту турніру. Один гравець може бути лише в одній команді; після вибуття команди він не переходить до іншої в межах цього турніру.'
  },
  {
    q: 'Як проходить верифікація?',
    a: 'Верифікація проходить у голосовому каналі ⁠🎙️・Верифікація в Discord. Нова команда верифікується одночасно мінімум 3 гравцями (вона вважається сформованою, коли верифікацію пройшли щонайменше 3 гравці); далі учасники можуть верифікуватися поодинці. Під час верифікації гравець надає всю інформацію щодо своїх акаунтів. Неявка на верифікацію — бан на 12 годин і пропуск наступного слоту.'
  },
  {
    q: 'Скільки коштує участь і як формується призовий фонд?',
    a: 'Внесок залежить від місця на кваліфікаціях: ТОП 1–4 — 100 грн з гравця (500 грн з команди), ТОП 5–8 — 150 грн (750 грн), ТОП 9+ — 200 грн (1000 грн). Призовий фонд складається з 10 000 грн від організації та 60% усіх внесків команд. Капітан оплачує внесок одним платежем не пізніше ніж за 2 дні до Play-off — кнопкою «Оплатити внесок» на сторінці турніру, через сторінку оплати monobank. Зарахування відбувається автоматично.'
  },
  {
    q: 'Коли і де проводяться матчі?',
    a: 'Розклад: п’ятниця — матчі о 19:00; субота та неділя — матчі о 16:00. Матчі граються в Dota 2 через офіційне лобі ліги, створене капітаном верхньої команди.'
  },
  {
    q: 'Як влаштована турнірна сітка?',
    a: 'Сітка розміщена на сторінці турніру на сайті й оновлюється після кожного матчу. Верхня сітка: усі раунди — BO1, фінал — BO3, гранд-фінал — BO3. Нижня сітка: усі раунди — BO1, фінал — BO3.'
  },
  {
    q: 'Де можна дивитися трансляції матчів?',
    a: 'Матчі транслюються на нашому Twitch каналі — twitch.tv/core_league.'
  },
  {
    q: 'Як дізнаватися про нові турніри та новини?',
    a: 'Підпишіться на наш Discord та Telegram — там ми публікуємо всі анонси, розклади та результати. Також стежте за розділом "Турніри" на сайті.'
  },
  {
    q: 'Що робити у разі технічного збою, порушення чи конфлікту під час матчу?',
    a: 'Скаргу подають протягом 25 хвилин після завершення гри в каналі ⚠️・скарги одним повідомленням — звернення в особисті чати модерації не розглядаються. Зробіть скриншот або запис ситуації (Адміністрація рекомендує запис екрана та звуку через OBS). Доказові матеріали мають бути не пізніше поточного ігрового дня; термін розгляду — 1–2 доби.'
  }
]

function toggleFaq (idx: number) {
  openFaq.value = openFaq.value === idx ? null : idx
}

// ── Scroll reveal ──────────────────────────────────────────────────────────
let revealObserver: IntersectionObserver | null = null

// Спостерігаємо за ще не показаними `.reveal`. Безпечно викликати повторно —
// використовуємо після появи асинхронного контенту (карток турнірів), щоб
// пізні вузли теж анімувалися, а не зависали на opacity: 0.
function observeReveals () {
  if (!revealObserver) return
  document
    .querySelectorAll('.home-page .reveal:not(.revealed)')
    .forEach(el => revealObserver!.observe(el))
}

function initReveal () {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          revealObserver!.unobserve(e.target)
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
  )
  observeReveals()
}

// ── Data fetching ──────────────────────────────────────────────────────────
async function fetchAllStats () {
  const [players, teams, tournaments] = await Promise.allSettled([
    playersService.fetchPlayers(),
    teamsService.fetchAllTeams(),
    tournamentsService.fetchTournaments()
  ])

  if (players.status === 'fulfilled' && Array.isArray(players.value)) {
    playersCount.value = players.value.length
  }
  if (teams.status === 'fulfilled' && Array.isArray(teams.value)) {
    teamsCount.value = teams.value.length
  }
  if (tournaments.status === 'fulfilled' && Array.isArray(tournaments.value)) {
    allTournaments.value = tournaments.value as TTournament[]
  }

  tournamentsLoading.value = false

  // Картки турнірів монтуються наступним тіком — повторно запускаємо
  // спостереження reveal, щоб вони анімувалися при появі.
  await nextTick()
  observeReveals()
}

async function fetchDiscordMembers () {
  try {
    const res = await fetch('https://discord.com/api/v10/invites/QeDj9TjmgM?with_counts=true')
    const data = await res.json()
    if (typeof data.approximate_member_count === 'number') {
      discordMembers.value = data.approximate_member_count
    }
  } catch {
    // silent fail — Discord API may be unavailable
  }
}

onMounted(() => {
  fetchAllStats()
  fetchDiscordMembers()
  initReveal()
})

// Будь-який пізній ре-рендер (HMR, розкриття FAQ, догрузка даних) може створити
// нові `.reveal`-вузли — підхоплюємо їх, інакше вони лишаться на opacity: 0.
onUpdated(observeReveals)

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<style scoped>
/* ─── Reveal animation ─────────────────────────────────────────────────── */
/* ─── Feature cards ───────────────────────────────────────────────────────
   Each card carries its own hue in `--feat-rgb`; every accent (index, well,
   ghost numeral, hover edge) derives from it, so the four read as one family
   in four registers. Hover: lift + hue glow, well flips solid, arrow nudges. */
.feature-card {
  --neon-card-line-color: var(--feat-rgb);
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 236px;
  height: 100%;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  /* Slower than the neon-card default so the lift and glow ease in together. */
  transition:
    transform 420ms var(--ds-ease-out),
    border-color 420ms ease,
    box-shadow 420ms ease;
}

.feature-card:active {
  transform: scale(0.985);
  transition-duration: var(--ds-duration-press);
}

/* Oversized mono numeral bleeding off the bottom-right corner: texture, not content. */
.feature-card__ghost {
  position: absolute;
  right: -8px;
  bottom: -26px;
  font-family: var(--ds-font-mono);
  font-size: 136px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(var(--feat-rgb), 0.05);
  pointer-events: none;
  user-select: none;
  transition: transform 700ms var(--ds-ease-out), color 420ms ease;
}

.feature-card__index {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: rgb(var(--feat-rgb));
}

.feature-card__index::after {
  content: '';
  width: 28px;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--feat-rgb), 0.8), transparent);
}

.feature-card__well {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 12px;
  color: rgb(var(--feat-rgb));
  background: rgba(var(--feat-rgb), 0.1);
  border: 1px solid rgba(var(--feat-rgb), 0.28);
  box-shadow: inset 0 1px 0 rgba(var(--feat-rgb), 0.2);
  transition:
    color 520ms var(--ds-ease-out),
    border-color 520ms ease,
    box-shadow 520ms ease,
    transform 520ms var(--ds-ease-out);
}

/* The solid fill lives on an overlay that fades in (opacity, compositor-only),
   so the well brightens gradually instead of snapping from tint to solid. */
.feature-card__well::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 45%), rgb(var(--feat-rgb));
  opacity: 0;
  transition: opacity 520ms var(--ds-ease-out);
}

.feature-card__title {
  margin-top: 28px;
  font-family: var(--ds-font-display);
  font-size: 15px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
}

.feature-card__desc {
  margin-top: 8px;
  max-width: 46ch;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.62);
}

.feature-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 24px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  transition: color 360ms ease;
}

.feature-card__arrow {
  color: rgb(var(--feat-rgb));
  transition: transform 420ms var(--ds-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .feature-card:hover {
    border-color: rgba(var(--feat-rgb), 0.6);
    box-shadow: var(--ds-elevation-4), 0 0 26px rgba(var(--feat-rgb), 0.28);
    transform: translateY(-4px);
  }

  .feature-card:hover .feature-card__well {
    color: var(--ds-background);
    border-color: rgba(var(--feat-rgb), 0.7);
    box-shadow: 0 0 18px rgba(var(--feat-rgb), 0.55);
    transform: scale(1.06);
  }

  .feature-card:hover .feature-card__well::before {
    opacity: 1;
  }

  .feature-card:hover .feature-card__ghost {
    color: rgba(var(--feat-rgb), 0.1);
    transform: translate(-6px, -8px);
  }

  .feature-card:hover .feature-card__cta {
    color: #fff;
  }

  .feature-card:hover .feature-card__arrow {
    transform: translateX(4px);
  }

  .feature-card:hover .feature-card__arrow.is-external {
    transform: translate(3px, -3px);
  }
}

/* ─── FAQ ────────────────────────────────────────────────────────────────────
   Numbered accordion. The panel animates `grid-template-rows` 0fr → 1fr so any
   answer length works (no max-height cap); the plus turns into a cross, the
   index and a left rail light up on the open item. */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.faq-item {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--ds-border);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.025), transparent 60%), rgba(7, 8, 15, 0.45);
  transition: border-color 360ms ease, box-shadow 360ms ease;
}

/* Left rail, grows from the top when the item opens. */
.faq-item::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: var(--ds-primary);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.9);
  transform: scaleY(0);
  transform-origin: top center;
  transition: transform 360ms var(--ds-ease-out);
}

.faq-item.is-open {
  border-color: rgba(var(--ds-primary-rgb), 0.45);
  box-shadow: var(--ds-elevation-3), 0 0 22px rgba(var(--ds-primary-rgb), 0.12);
}

.faq-item.is-open::before {
  transform: scaleY(1);
}

.faq-item__head {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
}

.faq-item__head:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: -4px;
  border-radius: 12px;
}

.faq-item__index {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--ds-text-faint);
  transition: color 360ms ease, text-shadow 360ms ease;
}

.is-open .faq-item__index {
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
}

.faq-item__q {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.88);
  transition: color 360ms ease;
}

.is-open .faq-item__q {
  color: #fff;
}

.faq-item__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--ds-text-faint);
  border: 1px solid var(--ds-border);
  background: rgba(7, 8, 15, 0.5);
  transition:
    transform 360ms var(--ds-ease-out),
    color 360ms ease,
    background-color 360ms ease,
    border-color 360ms ease;
}

.is-open .faq-item__caret {
  transform: rotate(45deg);
  color: var(--ds-background);
  background: var(--ds-primary);
  border-color: transparent;
  box-shadow: 0 0 14px rgba(var(--ds-primary-rgb), 0.5);
}

.faq-item__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms var(--ds-ease-out);
}

.is-open .faq-item__panel {
  grid-template-rows: 1fr;
}

.faq-item__panel-inner {
  min-height: 0;
  overflow: hidden;
}

.faq-item__a {
  margin: 0;
  padding: 0 20px 20px 68px;
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.62);
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 240ms ease, transform 320ms var(--ds-ease-out);
}

.is-open .faq-item__a {
  opacity: 1;
  transform: none;
  transition-delay: 60ms;
}

.faq-contact {
  --hud-corner-inset: 6px;
  --hud-corner-size: 12px;
  --hud-corner-weight: 1px;

  display: flex;
  align-items: center;
  gap: 16px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.faq-contact__well {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.1);
  border: 1px solid rgba(var(--ds-primary-rgb), 0.3);
  transition: background-color 360ms ease, color 360ms ease, border-color 360ms ease;
}

.faq-contact__arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--ds-primary);
  transition: transform 360ms var(--ds-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .faq-item:not(.is-open):hover {
    border-color: rgba(var(--ds-primary-rgb), 0.3);
  }

  .faq-item:not(.is-open):hover .faq-item__index,
  .faq-item:not(.is-open):hover .faq-item__caret {
    color: var(--ds-primary);
  }

  .faq-item:not(.is-open):hover .faq-item__caret {
    border-color: rgba(var(--ds-primary-rgb), 0.45);
  }

  .faq-contact:hover .faq-contact__well {
    color: var(--ds-background);
    background: var(--ds-primary);
    border-color: transparent;
  }

  .faq-contact:hover .faq-contact__arrow {
    transform: translate(2px, -2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .faq-item::before,
  .faq-item__caret,
  .faq-item__panel,
  .faq-item__a,
  .faq-contact__arrow {
    transition: none;
  }

  .faq-item__a {
    transform: none;
  }

  .faq-contact:hover .faq-contact__arrow {
    transform: none;
  }
}

/* ─── Community ──────────────────────────────────────────────────────────────
   Discord panel: one big link in blurple with a live register and the member
   count as the number that matters. Social tiles each carry their brand hue
   in `--link-rgb` (rail, well, arrow, hover halo). */
.community-discord {
  --discord-rgb: 88, 101, 242;
  --neon-card-line-color: var(--discord-rgb);
  --hud-corner-inset: 10px;
  --hud-corner-size: 22px;
  --hud-corner-weight: 2px;
  --hud-corner-color: rgba(var(--discord-rgb), 0.7);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--discord-rgb), 0.5));

  position: relative;
  display: block;
  overflow: hidden;
  border-color: rgba(var(--discord-rgb), 0.35);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 420ms var(--ds-ease-out),
    border-color 420ms ease,
    box-shadow 420ms ease;
}

.community-discord:active {
  transform: scale(0.99);
}

.community-discord__glow {
  position: absolute;
  top: -60%;
  left: -8%;
  width: 55%;
  height: 220%;
  background: radial-gradient(ellipse at center, rgba(var(--discord-rgb), 0.32), transparent 60%);
  filter: blur(28px);
  opacity: 0.8;
  pointer-events: none;
  transition: opacity 600ms ease, transform 900ms var(--ds-ease-out);
}

.community-discord__well {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(180deg, rgba(var(--discord-rgb), 0.32), rgba(var(--discord-rgb), 0.12));
  border: 1px solid rgba(var(--discord-rgb), 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 26px rgba(var(--discord-rgb), 0.3);
  transition: transform 420ms var(--ds-ease-out), box-shadow 420ms ease;
}

.community-discord__kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #aab3ff;
}

.community-discord__dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3ba55d;
  box-shadow: 0 0 8px rgba(59, 165, 93, 0.9);
  animation: dot-pulse 2.2s ease-in-out infinite;
}

.community-discord__count {
  display: flex;
  flex-direction: column;
  align-items: inherit;
  line-height: 1;
}

.community-discord__count b {
  font-family: var(--ds-font-mono);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px rgba(var(--discord-rgb), 0.6);
}

.community-discord__count small {
  margin-top: 6px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.community-discord__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px;
  border-radius: 12px;
  font-family: var(--ds-font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
  background: linear-gradient(180deg, #7c86ff 0%, #5865f2 55%, #4752c4 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 0 0 1px rgba(var(--discord-rgb), 0.6),
    0 0 24px rgba(var(--discord-rgb), 0.35);
  transition: box-shadow 420ms ease;
}

.community-discord__arrow {
  transition: transform 420ms var(--ds-ease-out);
}

.community-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 14px 18px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(var(--link-rgb), 0.22);
  background: rgba(7, 8, 15, 0.55);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 420ms var(--ds-ease-out),
    border-color 420ms ease,
    box-shadow 420ms ease;
}

.community-link::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 2px;
  background: rgb(var(--link-rgb));
  box-shadow: 0 0 8px rgba(var(--link-rgb), 0.9);
  opacity: 0.7;
  transition: opacity 420ms ease;
}

.community-link:active {
  transform: scale(0.98);
}

.community-link:focus-visible,
.community-discord:focus-visible {
  outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
  outline-offset: 3px;
}

.community-link__well {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  color: rgb(var(--link-rgb));
  background: rgba(var(--link-rgb), 0.12);
  border: 1px solid rgba(var(--link-rgb), 0.3);
  transition: background-color 420ms ease, color 420ms ease, border-color 420ms ease;
}

.community-link__label {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
}

.community-link__handle {
  margin-top: 3px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--ds-text-faint);
  transition: color 420ms ease;
}

.community-link__arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(var(--link-rgb), 0.7);
  transition: transform 420ms var(--ds-ease-out), color 420ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .community-discord:hover {
    border-color: rgba(var(--discord-rgb), 0.75);
    box-shadow: var(--ds-elevation-4), 0 0 36px rgba(var(--discord-rgb), 0.35);
    transform: translateY(-3px);
  }

  .community-discord:hover .community-discord__glow {
    opacity: 1;
    transform: translateX(6%);
  }

  .community-discord:hover .community-discord__well {
    transform: scale(1.05);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 36px rgba(var(--discord-rgb), 0.5);
  }

  .community-discord:hover .community-discord__cta {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.36),
      0 0 0 1px rgba(var(--discord-rgb), 0.9),
      0 0 40px rgba(var(--discord-rgb), 0.55);
  }

  .community-discord:hover .community-discord__arrow,
  .community-link:hover .community-link__arrow {
    transform: translate(2px, -2px);
  }

  .community-link:hover {
    border-color: rgba(var(--link-rgb), 0.65);
    box-shadow: var(--ds-elevation-3), 0 0 22px rgba(var(--link-rgb), 0.22);
    transform: translateY(-3px);
  }

  .community-link:hover::before {
    opacity: 1;
  }

  .community-link:hover .community-link__well {
    color: var(--ds-background);
    background: rgb(var(--link-rgb));
    border-color: transparent;
  }

  .community-link:hover .community-link__handle {
    color: rgba(255, 255, 255, 0.7);
  }

  .community-link:hover .community-link__arrow {
    color: rgb(var(--link-rgb));
  }
}

@media (prefers-reduced-motion: reduce) {
  .community-discord__dot {
    animation: none;
  }

  .community-discord,
  .community-discord__glow,
  .community-discord__well,
  .community-discord__arrow,
  .community-link,
  .community-link__arrow {
    transition: none;
  }

  .community-discord:hover,
  .community-discord:hover .community-discord__glow,
  .community-discord:hover .community-discord__well,
  .community-discord:hover .community-discord__arrow,
  .community-link:hover,
  .community-link:hover .community-link__arrow {
    transform: none;
  }
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.8); }
}

/* ─── Sponsors ───────────────────────────────────────────────────────────────
   Each tier is a rack of slots in its own hue (`--tier-rgb`). Filled slots sit
   on a white well (the logos are on-white assets); open slots are sold as
   "slot NN · Вільно" tiles with a slow scan line, and link to the contact. */
.sponsor-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.06);
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-gold);
  text-decoration: none;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);
}

.sponsor-cta:active {
  transform: scale(0.97);
}

.sponsor-cta:focus-visible {
  outline: 2px solid rgba(var(--ds-gold-rgb), 0.7);
  outline-offset: 3px;
}

.sponsor-cta__arrow {
  transition: transform var(--ds-duration-base) var(--ds-ease-out);
}

.sponsor-tier {
  --hud-corner-inset: 6px;
  --hud-corner-size: 10px;
  --hud-corner-weight: 1px;
  --hud-corner-color: rgba(var(--tier-rgb), 0.55);
}

.sponsor-tier__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.sponsor-tier__label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgb(var(--tier-rgb));
  white-space: nowrap;
}

.sponsor-tier__rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(var(--tier-rgb), 0.45), transparent);
}

.sponsor-tier__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.sponsor-tier__grid {
  display: grid;
  gap: 12px;
}

.sponsor-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 64px;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(var(--tier-rgb), 0.22);
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 360ms ease,
    background-color 360ms ease,
    box-shadow 360ms ease,
    transform 360ms var(--ds-ease-out);
}

.sponsor-slot:active {
  transform: scale(0.98);
}

.sponsor-slot:focus-visible {
  outline: 2px solid rgba(var(--tier-rgb), 0.7);
  outline-offset: 3px;
}

.is-gold .sponsor-slot { height: 84px; }
.is-title .sponsor-slot { height: 120px; }

.sponsor-slot--filled {
  padding: 12px 20px;
  background: #fff;
  border-color: rgba(var(--tier-rgb), 0.4);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 0 0 1px rgba(7, 8, 15, 0.6);
}

.sponsor-slot--dark {
  background: #000;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(7, 8, 15, 0.6);
}

.sponsor-slot__logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 500ms var(--ds-ease-out);
}

.sponsor-slot--open {
  background:
    repeating-linear-gradient(
      -45deg,
      rgba(var(--tier-rgb), 0.05) 0 1px,
      transparent 1px 10px
    ),
    rgba(7, 8, 15, 0.45);
}

/* Slow scan line: a thin light bar riding down the tile on transform only. */
.sponsor-slot__scan {
  position: absolute;
  inset: 0 0 auto 0;
  height: 28px;
  background: linear-gradient(180deg, transparent, rgba(var(--tier-rgb), 0.14), transparent);
  transform: translateY(-100%);
  animation: sponsor-scan 6s linear infinite;
  animation-delay: var(--scan-delay, 0s);
  pointer-events: none;
}

@keyframes sponsor-scan {
  0% { transform: translateY(-100%); }
  45%, 100% { transform: translateY(520%); }
}

.sponsor-slot__index {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(var(--tier-rgb), 0.6);
  transition: color 360ms ease;
}

.sponsor-slot__state {
  font-family: var(--ds-font-display);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
  transition: color 360ms ease, transform 360ms var(--ds-ease-out);
}

.sponsor-slot__hint {
  position: absolute;
  bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--tier-rgb));
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 360ms ease, transform 360ms var(--ds-ease-out);
}

.is-partner .sponsor-slot__hint { display: none; }

@media (hover: hover) and (pointer: fine) {
  .sponsor-cta:hover {
    border-color: rgba(var(--ds-gold-rgb), 0.7);
    background: rgba(var(--ds-gold-rgb), 0.12);
    box-shadow: var(--ds-glow-gold);
  }

  .sponsor-cta:hover .sponsor-cta__arrow {
    transform: translate(2px, -2px);
  }

  .sponsor-slot:hover {
    border-color: rgba(var(--tier-rgb), 0.7);
    box-shadow: 0 0 0 1px rgba(var(--tier-rgb), 0.2), 0 0 26px rgba(var(--tier-rgb), 0.22);
    transform: translateY(-3px);
  }

  .sponsor-slot--filled:hover .sponsor-slot__logo {
    transform: scale(1.04);
  }

  .sponsor-slot--open:hover {
    background:
      repeating-linear-gradient(-45deg, rgba(var(--tier-rgb), 0.08) 0 1px, transparent 1px 10px),
      rgba(var(--tier-rgb), 0.06);
  }

  .sponsor-slot--open:hover .sponsor-slot__index {
    color: rgb(var(--tier-rgb));
  }

  .sponsor-slot--open:hover .sponsor-slot__state {
    color: #fff;
    transform: translateY(-6px);
  }

  .is-partner .sponsor-slot--open:hover .sponsor-slot__state {
    transform: none;
  }

  .sponsor-slot--open:hover .sponsor-slot__hint {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sponsor-slot__scan {
    display: none;
  }

  .sponsor-slot,
  .sponsor-slot__logo,
  .sponsor-slot__state,
  .sponsor-slot__hint,
  .sponsor-cta__arrow {
    transition: none;
  }

  .sponsor-slot:hover,
  .sponsor-slot--filled:hover .sponsor-slot__logo,
  .sponsor-slot--open:hover .sponsor-slot__state,
  .sponsor-cta:hover .sponsor-cta__arrow {
    transform: none;
  }
}

/* ─── "All tournaments" fill tile ─────────────────────────────────────────── */
.tournaments-more {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 420ms var(--ds-ease-out),
    border-color 420ms ease,
    box-shadow 420ms ease;
}

.tournaments-more__ghost {
  position: absolute;
  right: -10px;
  bottom: -30px;
  font-family: var(--ds-font-mono);
  font-size: 160px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(var(--ds-primary-rgb), 0.05);
  pointer-events: none;
  user-select: none;
  transition: transform 700ms var(--ds-ease-out), color 420ms ease;
}

.tournaments-more__title {
  margin-top: 12px;
  font-family: var(--ds-font-display);
  font-size: 22px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.tournaments-more__desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.62);
}

.tournaments-more__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
  transition: color 360ms ease;
}

.tournaments-more__arrow {
  color: var(--ds-primary);
  transition: transform 420ms var(--ds-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .tournaments-more:hover {
    transform: translateY(-4px);
  }

  .tournaments-more:hover .tournaments-more__ghost {
    color: rgba(var(--ds-primary-rgb), 0.1);
    transform: translate(-6px, -8px);
  }

  .tournaments-more:hover .tournaments-more__cta {
    color: #fff;
  }

  .tournaments-more:hover .tournaments-more__arrow {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tournaments-more,
  .tournaments-more__ghost,
  .tournaments-more__arrow {
    transition: none;
  }

  .tournaments-more:hover,
  .tournaments-more:hover .tournaments-more__ghost,
  .tournaments-more:hover .tournaments-more__arrow {
    transform: none;
  }

  .feature-card,
  .feature-card__ghost,
  .feature-card__arrow,
  .feature-card__well {
    transition: none;
  }

  .feature-card:hover,
  .feature-card:hover .feature-card__ghost,
  .feature-card:hover .feature-card__arrow,
  .feature-card:hover .feature-card__well {
    transform: none;
  }
}

.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

</style>
