<template>
  <div class="home-page overflow-x-hidden bg-bg-primary">
    <!-- ═══════════════════════════════════════════════════════════
         HERO
    ══════════════════════════════════════════════════════════════ -->
    <section class="hero relative flex flex-col min-h-[calc(100svh-144px)] overflow-hidden">
      <!-- Atmospheric layers -->
      <div class="atm-glow-cyan" />
      <div class="atm-glow-purple" />
      <div class="atm-grid" />
      <div class="atm-vignette" />

      <!-- Hero content -->
      <div
        class="hero-enter relative z-10 flex flex-col items-center justify-center flex-1
               px-24 pt-24 pb-24 text-center"
      >
        <img
          :src="logo"
          alt="Core League"
          class="h-48 md:h-64 lg:h-80 mb-16 object-contain drop-shadow-[0_0_40px_rgba(67,191,238,0.35)]"
        >

        <span
          class="inline-block text-[10px] md:text-[11px] uppercase tracking-[0.4em]
                 text-[#43bfee] font-semibold mb-16 opacity-80"
        >
          Українська кіберспортивна ліга · Dota 2
        </span>

        <h1
          class="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-black uppercase
                 leading-[0.9] tracking-tight max-w-5xl text-white"
        >
          Грай.<br>
          <span class="hero-gradient-text">Змагайся.</span><br>
          Вигравай.
        </h1>

        <p class="mt-20 text-base md:text-lg text-gray-400 max-w-xl leading-relaxed">
          Організовані турніри, live трансляції та справжня кіберспортивна
          інфраструктура для українських команд.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-16 mt-24">
          <button
            v-if="!authStore.token"
            type="button"
            :disabled="authStore.loginLoading"
            class="discord-cta flex items-center gap-12 px-32 py-16 rounded-xl font-bold text-base text-white
                   bg-[#5865F2] hover:bg-[#4752C4] transition-all duration-200 cursor-pointer
                   shadow-[0_0_30px_rgba(88,101,242,0.45)] hover:shadow-[0_0_55px_rgba(88,101,242,0.65)]
                   disabled:opacity-60 disabled:cursor-not-allowed"
            @click="authStore.startDiscordLogin()"
          >
            <Icon name="discord" :size="22" />
            Увійти через Discord
          </button>
          <a
            v-else
            href="https://discord.gg/SvgsPHPU"
            target="_blank"
            rel="noopener noreferrer"
            class="discord-cta flex items-center gap-12 px-32 py-16 rounded-xl font-bold text-base text-white
                   bg-[#5865F2] hover:bg-[#4752C4] transition-all duration-200 cursor-pointer
                   shadow-[0_0_30px_rgba(88,101,242,0.45)] hover:shadow-[0_0_55px_rgba(88,101,242,0.65)]"
          >
            <Icon name="discord" :size="22" />
            Приєднатись до Discord
          </a>
          <RouterLink
            to="/tournaments"
            class="flex items-center gap-12 px-32 py-16 rounded-xl font-bold text-base text-white
                   border border-white/20 hover:border-[#43bfee]/50 hover:bg-[#43bfee]/5
                   transition-all duration-200 cursor-pointer"
          >
            <PhTrophy :size="20" weight="fill" />
            Переглянути турніри
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FEATURE STRIP
    ══════════════════════════════════════════════════════════════ -->
    <section class="py-50 relative">
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-6xl mx-auto px-24">
        <div class="text-center mb-56 reveal">
          <span class="text-[11px] uppercase tracking-[0.35em] text-[#43bfee] font-semibold">Що таке Core League</span>
          <h2 class="mt-16 text-3xl md:text-4xl font-black uppercase text-white">Платформа нового рівня</h2>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-20">
          <div
            v-for="(feat, idx) in features"
            :key="feat.title"
            class="reveal feature-card group p-24 rounded-2xl border border-white/8
                   bg-dark-card/80 hover:border-[#43bfee]/40 hover:bg-dark-card
                   transition-all duration-300 cursor-default"
            :style="{ transitionDelay: `${idx * 70}ms` }"
          >
            <div
              class="w-44 h-44 rounded-xl mb-20 flex items-center justify-center
                     bg-[#43bfee]/10 border border-[#43bfee]/20
                     group-hover:border-[#43bfee]/50 group-hover:bg-[#43bfee]/15
                     transition-all duration-300"
            >
              <component :is="feat.icon" :size="24" class="text-[#43bfee]" weight="duotone" />
            </div>
            <h3 class="font-bold text-white text-sm uppercase tracking-wide mb-8">{{ feat.title }}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">{{ feat.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         STATS
    ══════════════════════════════════════════════════════════════ -->
    <section ref="statsSectionRef" class="py-64 relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#43bfee]/5 via-transparent
               to-[#e8b931]/5 pointer-events-none"
      />
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#43bfee]/30 to-transparent" />
      <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#43bfee]/30 to-transparent" />
      <div class="max-w-5xl mx-auto px-24">
        <div class="grid grid-cols-3 gap-24 md:gap-48">
          <div
            v-for="stat in statsDisplay"
            :key="stat.label"
            class="reveal text-center"
          >
            <div class="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
              {{ stat.value }}
            </div>
            <div class="mt-8 text-[10px] uppercase tracking-[0.2em] text-gray-500">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         TOURNAMENTS (competitive content — surfaced above sponsors/FAQ)
    ══════════════════════════════════════════════════════════════ -->
    <section v-if="tournamentsLoading || activeTournaments.length" class="py-50">
      <div class="max-w-6xl mx-auto px-24">
        <div class="flex items-end justify-between mb-48 reveal">
          <div>
            <span
              class="text-[11px] uppercase tracking-[0.35em] text-[#43bfee]
                     font-semibold block mb-12"
            >Змагання</span>
            <h2 class="text-3xl md:text-4xl font-black uppercase text-white">Активні турніри</h2>
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

        <!-- Loading skeleton -->
        <div v-if="tournamentsLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-24">
          <div v-for="i in 3" :key="i" class="h-288 rounded-2xl bg-dark-card animate-pulse" />
        </div>

        <!-- Active tournament cards -->
        <div
          v-else
          class="grid md:grid-cols-2 lg:grid-cols-3 gap-24 justify-items-center"
        >
          <TournamentCard
            v-for="t in activeTournaments"
            :key="t.id"
            :tournament="t"
            class="reveal w-full"
          />
        </div>

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
    <section class="py-50 border-t border-white/8">
      <div class="max-w-5xl mx-auto px-24">
        <div class="text-center mb-56 reveal">
          <span
            class="text-[11px] uppercase tracking-[0.35em] text-[#e8b931] font-semibold block mb-16"
          >Підтримка</span>
          <h2 class="text-3xl md:text-4xl font-black uppercase text-white">Партнери та спонсори</h2>
        </div>

        <!-- Title sponsor -->
        <div class="mb-48 reveal">
          <p class="text-center text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-20">Титульний спонсор</p>
          <div class="flex justify-center">
            <div
              class="h-96 w-320 max-w-full rounded-2xl bg-white/[0.02] border border-dashed border-[#e8b931]/25
                     hover:border-[#e8b931]/50 hover:bg-[#e8b931]/[0.03]
                     flex items-center justify-center transition-colors duration-300 cursor-default"
            >
              <span class="text-gray-600 text-[11px] uppercase tracking-[0.25em]">Місце вільне</span>
            </div>
          </div>
        </div>

        <!-- Gold sponsors -->
        <div class="mb-40 reveal">
          <p class="text-center text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-20">Золоті партнери</p>
          <div class="flex justify-center gap-20 flex-wrap">
            <div
              v-for="i in 3"
              :key="i"
              class="h-72 w-208 max-w-full rounded-xl bg-white/[0.02] border border-dashed border-white/12
                     hover:border-[#e8b931]/35 hover:bg-white/[0.03]
                     flex items-center justify-center transition-colors duration-300 cursor-default"
            >
              <span class="text-gray-600 text-[10px] uppercase tracking-[0.2em]">Місце вільне</span>
            </div>
          </div>
        </div>

        <!-- Partners -->
        <div class="mb-48 reveal">
          <p class="text-center text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-20">Партнери</p>
          <div class="flex justify-center gap-16 flex-wrap">
            <!-- PLAYERS — чинний партнер -->
            <a
              href="https://players.com.ua/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PLAYERS"
              class="h-56 w-160 max-w-full rounded-lg overflow-hidden bg-white/[0.03] border border-[#e8b931]/30
                     hover:border-[#e8b931]/55 hover:bg-[#e8b931]/[0.04]
                     flex items-center justify-center transition-colors duration-300 cursor-pointer"
            >
              <img
                :src="playersPartnerLogo"
                alt="PLAYERS"
                loading="lazy"
                class="h-full w-full max-w-full object-cover rounded-[inherit]"
              >
            </a>
            <!-- Вільні місця -->
            <div
              v-for="i in 4"
              :key="i"
              class="h-56 w-160 max-w-full rounded-lg bg-white/[0.02] border border-dashed border-white/10
                     hover:border-white/25 hover:bg-white/[0.03]
                     flex items-center justify-center transition-colors duration-300 cursor-default"
            >
              <span class="text-gray-600 text-[10px] uppercase tracking-[0.15em]">Вільне</span>
            </div>
          </div>
        </div>

        <div class="text-center reveal">
          <a
            href="https://discord.gg/SvgsPHPU"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-8 text-sm text-gray-500 hover:text-[#43bfee]
                   transition-colors cursor-pointer"
          >
            Зацікавлені у партнерстві? Зв'яжіться з нами в Discord
            <PhArrowRight :size="15" />
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         COMMUNITY
    ══════════════════════════════════════════════════════════════ -->
    <section class="py-50 relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-br from-[#5865F2]/8 via-transparent
               to-[#43bfee]/5 pointer-events-none"
      />
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div class="max-w-5xl mx-auto px-24 relative">
        <div class="text-center mb-48 reveal">
          <span
            class="text-[11px] uppercase tracking-[0.35em] text-[#43bfee] font-semibold block mb-16"
          >Спільнота</span>
          <h2 class="text-3xl md:text-4xl font-black uppercase text-white">Приєднуйся до нас</h2>
        </div>

        <!-- Discord primary block -->
        <div class="reveal relative rounded-3xl overflow-hidden border border-[#5865F2]/25 mb-20">
          <div class="absolute inset-0 bg-gradient-to-br from-[#5865F2]/15 to-[#1e1f5e]/30 pointer-events-none" />
          <div
            class="absolute inset-0 pointer-events-none
                   bg-[radial-gradient(ellipse_at_top,rgba(88,101,242,0.18),transparent_60%)]"
          />
          <div class="relative z-10 flex flex-col md:flex-row items-center gap-32 p-32 md:p-48">
            <div class="flex-shrink-0">
              <div
                class="w-72 h-72 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/30
                          flex items-center justify-center"
              >
                <Icon name="discord" :size="36" />
              </div>
            </div>
            <div class="flex-1 text-center md:text-left">
              <h3 class="text-xl md:text-2xl font-black text-white mb-8">Core League Discord</h3>
              <p class="text-gray-400 text-sm leading-relaxed">
                Реєстрація на турніри, розклад матчів, підтримка та живе спілкування.
                <span v-if="discordMembers > 0" class="text-gray-300 font-medium">
                  Вже {{ discordMembers }}+ учасників.
                </span>
              </p>
            </div>
            <a
              href="https://discord.gg/SvgsPHPU"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-shrink-0 flex items-center gap-12 px-28 py-16 rounded-xl bg-[#5865F2]
                     hover:bg-[#4752C4] text-white font-bold transition-all duration-200
                     shadow-[0_0_28px_rgba(88,101,242,0.35)] hover:shadow-[0_0_45px_rgba(88,101,242,0.55)]
                     cursor-pointer whitespace-nowrap"
            >
              <Icon name="discord" :size="20" />
              Приєднатись
            </a>
          </div>
        </div>

        <!-- Other socials -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-12 reveal">
          <a
            v-for="social in socials"
            :key="social.label"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-12 py-16 px-12 rounded-xl bg-dark-card border border-white/8
                   hover:border-white/20 hover:bg-white/4 transition-all duration-200
                   group cursor-pointer"
          >
            <Icon :name="social.icon" :size="18" class="opacity-60 group-hover:opacity-100 transition-opacity" />
            <span class="text-sm text-gray-400 group-hover:text-white transition-colors font-medium">
              {{ social.label }}
            </span>
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         FAQ
    ══════════════════════════════════════════════════════════════ -->
    <section class="py-50 border-t border-white/8">
      <div class="max-w-3xl mx-auto px-24">
        <div class="text-center mb-56 reveal">
          <span
            class="text-[11px] uppercase tracking-[0.35em] text-[#43bfee] font-semibold block mb-16"
          >Відповіді на питання</span>
          <h2 class="text-3xl md:text-4xl font-black uppercase text-white">FAQ</h2>
        </div>

        <div class="space-y-12">
          <div
            v-for="(item, idx) in faqItems"
            :key="idx"
            class="reveal faq-item rounded-2xl bg-dark-card border border-white/8 overflow-hidden
                   hover:border-white/15 transition-colors duration-200"
          >
            <button
              class="w-full flex items-center justify-between px-24 py-20 text-left cursor-pointer"
              @click="toggleFaq(idx)"
            >
              <span class="font-semibold text-white text-sm pr-16 leading-relaxed">{{ item.q }}</span>
              <PhCaretDown
                :size="18"
                class="text-gray-500 flex-shrink-0 transition-transform duration-300"
                :class="openFaq === idx ? 'rotate-180 !text-[#43bfee]' : ''"
              />
            </button>
            <div
              class="overflow-hidden transition-all duration-300 ease-in-out"
              :style="{ maxHeight: openFaq === idx ? '360px' : '0px' }"
            >
              <p class="px-24 pb-24 text-gray-400 text-sm leading-relaxed">{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/images/core-league-logo-full.png'
import playersPartnerLogo from '@/assets/images/sponsor-players.png'
import {
  PhTrophy,
  PhArrowRight,
  PhCaretDown,
  PhShieldStar,
  PhBroadcast,
  PhDesktop,
  PhUsersThree
} from '@phosphor-icons/vue'
import type { TIconName } from '@/components/Icon.vue'

const authStore = useAuthStore()

// ── Feature strip ──────────────────────────────────────────────────────────
const features = [
  {
    icon: PhShieldStar,
    title: 'Структуровані дивізіони',
    description: 'Три дивізіони для гравців будь-якого рівня — від аматорів до просунутих команд.'
  },
  {
    icon: PhBroadcast,
    title: 'Live трансляції',
    description: 'Матчі транслюються на нашому Twitch каналі з коментарями.'
  },
  {
    icon: PhDesktop,
    title: 'Власна платформа',
    description: 'Реєстрація, управління командами та статистика — все в одному місці.'
  },
  {
    icon: PhUsersThree,
    title: 'Активна спільнота',
    description: 'Discord сервер з живим спілкуванням, підтримкою та новинами в реальному часі.'
  }
]

// ── Social links ───────────────────────────────────────────────────────────
const socials: Array<{ label: string; url: string; icon: TIconName }> = [
  { label: 'Twitch', url: 'https://www.twitch.tv/core_league', icon: 'twitch' },
  { label: 'YouTube', url: 'https://www.youtube.com/@Core_League', icon: 'youtube' },
  { label: 'Telegram', url: 'https://t.me/s/core_league', icon: 'telegram' },
  { label: 'Instagram', url: 'https://www.instagram.com/core__league/', icon: 'instagram' },
  { label: 'TikTok', url: 'https://www.tiktok.com/@core_league_dota2', icon: 'tiktok' }
]

// ── Stats ──────────────────────────────────────────────────────────────────
const playersCount = ref(0)
const teamsCount = ref(0)
const discordMembers = ref(0)

// Count-up animation: numbers tween from 0 → value once the section is in view.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const statsSectionRef = ref<HTMLElement | null>(null)
const statsVisible = ref(false)
const countOptions = {
  duration: prefersReducedMotion ? 0 : 1600,
  // easeOutExpo cubic-bezier — strong deceleration for a satisfying count-up.
  transition: [0.16, 1, 0.3, 1] as [number, number, number, number]
}

const playersTween = useTransition(() => (statsVisible.value ? playersCount.value : 0), countOptions)
const teamsTween = useTransition(() => (statsVisible.value ? teamsCount.value : 0), countOptions)
const discordTween = useTransition(() => (statsVisible.value ? discordMembers.value : 0), countOptions)

const statsDisplay = computed(() => [
  { value: playersCount.value ? `${Math.round(playersTween.value)}+` : '—', label: 'Гравців' },
  { value: teamsCount.value ? `${Math.round(teamsTween.value)}+` : '—', label: 'Команд' },
  { value: discordMembers.value ? `${Math.round(discordTween.value)}+` : '—', label: 'У Discord' }
])

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

// ── FAQ ────────────────────────────────────────────────────────────────────
const openFaq = ref<number | null>(null)

const faqItems = [
  {
    q: 'Як зареєструватися на Core League?',
    a: 'Натисніть кнопку "Увійти через Discord" у шапці сайту. Авторизація відбувається через ваш Discord-акаунт — жодних довгих форм. Після входу ваш профіль створюється автоматично.'
  },
  {
    q: 'Який рівень гри потрібен для участі?',
    a: 'Core League має три дивізіони (I, II, III), що охоплюють різні рівні MMR. Дивізіон III підходить для початківців та аматорів, тоді як Дивізіон I — для більш досвідчених команд. Детальні вимоги до MMR вказані в описі кожного турніру.'
  },
  {
    q: 'Як створити або приєднатися до команди?',
    a: 'Після реєстрації перейдіть у розділ "Команди". Там ви можете створити власну команду або прийняти запрошення від капітана існуючої команди. Для участі в турнірі команда має мати повний склад.'
  },
  {
    q: 'Чи безкоштовна участь у турнірах?',
    a: 'Так, участь у турнірах Core League безкоштовна. Наша ціль — зробити якісний кіберспорт доступним для всіх українських гравців Dota 2.'
  },
  {
    q: 'Де і як проводяться матчі?',
    a: 'Матчі проводяться в Dota 2 через функцію лоббі. Розклад, правила та деталі матчів публікуються в Discord. Адміністратори стежать за дотриманням регламенту і вирішують спірні ситуації.'
  },
  {
    q: 'Де можна дивитися трансляції матчів?',
    a: 'Матчі транслюються на нашому Twitch каналі — twitch.tv/core_league. Записи VOD доступні після завершення ефіру на YouTube каналі.'
  },
  {
    q: 'Як дізнаватися про нові турніри та новини?',
    a: 'Підпишіться на наш Discord та Telegram — там ми публікуємо всі анонси, розклади та результати. Також стежте за розділом "Турніри" на сайті.'
  },
  {
    q: 'Що робити, якщо стався технічний збій або конфлікт під час матчу?',
    a: 'Негайно повідомте адміністраторів у відповідному каналі Discord. Зробіть скриншот або запис ситуації — адміністратори розглянуть звернення та ухвалять рішення згідно з регламентом.'
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

  // Trigger the stat count-up once the stats section scrolls into view.
  if (statsSectionRef.value) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          statsVisible.value = true
          statsObserver.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    statsObserver.observe(statsSectionRef.value)
  }
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
    const res = await fetch('https://discord.com/api/v10/invites/SvgsPHPU?with_counts=true')
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

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<style scoped>
/* ─── Reveal animation ─────────────────────────────────────────────────── */
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

/* ─── Hero ─────────────────────────────────────────────────────────────── */
.hero {
  background: #0A0711;
}

.hero-gradient-text {
  background: linear-gradient(95deg, #43bfee 0%, #e8b931 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ─── Hero entrance stagger ────────────────────────────────────────────── */
@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-enter > * {
  opacity: 0;
  animation: hero-rise 0.7s cubic-bezier(0.16, 0.84, 0.44, 1) forwards;
}
.hero-enter > *:nth-child(1) { animation-delay: 0.05s; }
.hero-enter > *:nth-child(2) { animation-delay: 0.15s; }
.hero-enter > *:nth-child(3) { animation-delay: 0.25s; }
.hero-enter > *:nth-child(4) { animation-delay: 0.38s; }
.hero-enter > *:nth-child(5) { animation-delay: 0.5s; }

@media (prefers-reduced-motion: reduce) {
  .hero-enter > * {
    opacity: 1;
    animation: none;
  }
}

/* ─── Atmospheric layers ───────────────────────────────────────────────── */
.atm-glow-cyan {
  position: absolute;
  top: -20%;
  left: -15%;
  width: 65%;
  height: 75%;
  background: radial-gradient(ellipse at center, rgba(67, 191, 238, 0.13) 0%, transparent 68%);
  pointer-events: none;
  animation: glow-breathe 9s ease-in-out infinite;
}

.atm-glow-purple {
  position: absolute;
  top: -8%;
  right: -12%;
  width: 55%;
  height: 65%;
  background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 65%);
  pointer-events: none;
  animation: glow-breathe 11s ease-in-out infinite reverse;
}

.atm-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent);
  pointer-events: none;
}

.atm-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 0%, transparent 40%, #0A0711 80%);
  pointer-events: none;
}

/* ─── Keyframes ────────────────────────────────────────────────────────── */
@keyframes glow-breathe {
  0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
  50% { transform: scale(1.06) translateY(-2%); opacity: 0.8; }
}

@media (prefers-reduced-motion: reduce) {
  .atm-glow-cyan,
  .atm-glow-purple {
    animation: none;
  }
}
</style>
