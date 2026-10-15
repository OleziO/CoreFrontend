<template>
  <div class="flex flex-col gap-28">
    <!-- Канал ліги: кожен командний турнір іде в ефір тут -->
    <section class="mt-stream" aria-labelledby="mt-stream-title">
      <span class="mt-stream__glow" aria-hidden="true" />
      <div class="mt-stream__head">
        <span class="mt-stream__logo" aria-hidden="true">
          <PhTwitchLogo :size="28" weight="fill" />
        </span>
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label mt-stream__eyebrow">// Офіційний канал ліги</span>
          <h2 id="mt-stream-title" class="mt-stream__title">twitch.tv/{{ TWITCH_CHANNEL }}</h2>
          <p class="mt-stream__text">
            Плей-оф командних турнірів транслюємо з коментарями. Розклад — у картках нижче.
          </p>
        </div>
        <div class="mt-stream__actions">
          <el-button v-if="!playerOpen" type="primary" class="mt-stream__watch" @click="playerOpen = true">
            <PhPlay :size="14" weight="fill" />
            <span class="ml-6">Дивитися тут</span>
          </el-button>
          <a :href="TWITCH_CHANNEL_URL" target="_blank" rel="noopener noreferrer" class="no-underline">
            <el-button>
              <span>Відкрити Twitch</span>
              <PhArrowSquareOut :size="14" class="ml-6 opacity-70" />
            </el-button>
          </a>
        </div>
      </div>
      <div v-if="playerOpen" class="mt-stream__player">
        <iframe
          :src="playerUrl"
          title="Трансляція Core League на Twitch"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        />
      </div>
    </section>

    <template v-if="tournamentStore.loading && !tournamentStore.tournamentsData.length">
      <div class="mt-grid">
        <span
          v-for="n in 3"
          :key="n"
          class="skeleton-bone block !rounded-2xl"
          :style="{ height: `${TOURNAMENT_CARD_HEIGHT}px` }"
        />
      </div>
    </template>

    <template v-else>
      <section v-for="group in groups" :key="group.key" class="flex flex-col gap-14" :aria-label="group.title">
        <header class="flex items-center gap-10">
          <span class="mt-dot" :class="`is-${group.key}`" aria-hidden="true" />
          <h3 class="mt-section-title">{{ group.title }}</h3>
          <span class="mt-count">{{ group.items.length }}</span>
        </header>
        <p v-if="!group.items.length" class="mt-empty">{{ group.empty }}</p>
        <div v-else class="mt-grid">
          <TournamentCard
            v-for="t in group.items"
            :key="t.id"
            :tournament="t"
            :width="TOURNAMENT_CARD_WIDTH"
          />
        </div>
      </section>

      <RouterLink :to="{ name: routeNames.tournaments }" class="mt-all no-underline">
        Усі командні турніри
        <PhArrowRight :size="14" weight="bold" aria-hidden="true" />
      </RouterLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhArrowRight, PhArrowSquareOut, PhPlay, PhTwitchLogo } from '@phosphor-icons/vue'
import { TWITCH_CHANNEL, TWITCH_CHANNEL_URL, buildTwitchPlayerUrl } from '@/config/streaming'
import { routeNames } from '@/router/route-names'
import { TOURNAMENT_CARD_HEIGHT, TOURNAMENT_CARD_WIDTH } from '@/views/tournaments/tournaments.enums'
import { useTournamentStore } from '@/views/tournaments/tournaments.store'
import { getTournamentPhase, sortTournamentsForList } from '@/views/tournaments/tournaments.utils'

/** Архів обрізаємо — повний список живе на сторінці «Турніри». */
const PAST_LIMIT = 6

const tournamentStore = useTournamentStore()

// Плеєр вантажимо лише на прохання: автоплей у фоні вкладки — зайвий трафік.
const playerOpen = ref(false)
const playerUrl = buildTwitchPlayerUrl(window.location.hostname)

const groups = computed(() => {
  const sorted = sortTournamentsForList(tournamentStore.tournamentsData)
  const byPhase = (phase: ReturnType<typeof getTournamentPhase>) =>
    sorted.filter(t => getTournamentPhase(t) === phase)
  return [
    {
      key: 'live',
      title: 'Зараз в ефірі',
      empty: 'Зараз жоден командний турнір не грається — загляньте в розклад нижче.',
      items: byPhase('live')
    },
    {
      key: 'upcoming',
      title: 'Скоро',
      empty: 'Анонсів поки немає — слідкуйте за Discord і Telegram ліги.',
      items: byPhase('upcoming')
    },
    {
      key: 'past',
      title: 'Записи ефірів',
      empty: 'Завершених турнірів ще немає.',
      items: byPhase('past').slice(0, PAST_LIMIT)
    }
  ]
})

onMounted(() => {
  tournamentStore.getTournaments().catch(() => { /* тост уже показав стор */ })
})
</script>

<style scoped>
.mt-stream {
  --tw: 145, 70, 255;

  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid rgba(var(--tw), 0.35);
  background:
    linear-gradient(90deg, transparent, rgba(var(--tw), 0.9), transparent) top / 100% 1px no-repeat,
    linear-gradient(120deg, rgba(var(--tw), 0.18) 0%, rgba(13, 15, 28, 0.92) 55%);
  box-shadow: var(--ds-elevation-3), 0 0 26px rgba(var(--tw), 0.18);
}

.mt-stream__glow {
  position: absolute;
  top: -120px;
  left: -60px;
  z-index: -1;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--tw), 0.35), transparent 70%);
}

.mt-stream__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.mt-stream__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 16px;
  color: #fff;
  background: rgb(var(--tw));
  box-shadow: 0 0 22px rgba(var(--tw), 0.6);
}

.mt-stream__eyebrow {
  color: rgb(190, 160, 255);
  text-shadow: 0 0 8px rgba(var(--tw), 0.6);
}

.mt-stream__title {
  font-family: var(--ds-font-display);
  font-size: 22px;
  line-height: 1.15;
  color: var(--ds-text-strong);
  overflow-wrap: anywhere;
}

.mt-stream__text {
  font-size: 13px;
  color: var(--ds-text-muted);
}

.mt-stream__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.mt-stream__watch {
  --el-button-bg-color: rgb(var(--tw));
  --el-button-border-color: rgb(var(--tw));
  --el-button-hover-bg-color: rgb(165, 100, 255);
  --el-button-hover-border-color: rgb(165, 100, 255);
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;
}

.mt-stream__player {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  border: 1px solid rgba(var(--tw), 0.3);
  background: #000;
}

.mt-stream__player iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.mt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 20px;
  justify-items: center;
}

.mt-section-title {
  font-family: var(--ds-font-display);
  font-size: 18px;
  color: var(--ds-text-strong);
}

.mt-count {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.06);
}

.mt-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ds-text-faint);
}

.mt-dot.is-live {
  background: rgb(239, 68, 68);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
  animation: mt-pulse 1.4s ease-in-out infinite;
}

.mt-dot.is-upcoming {
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7);
}

.mt-empty {
  padding: 18px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: var(--ds-text-faint);
}

.mt-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-primary);
}

@keyframes mt-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .mt-dot.is-live {
    animation: none;
  }
}
</style>
