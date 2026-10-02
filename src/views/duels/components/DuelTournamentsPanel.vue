<template>
  <section class="dtour neon-card hud-corners rounded-2xl" aria-labelledby="duel-tournaments-title">
    <header class="dtour__head">
      <div class="flex min-w-0 flex-col gap-4">
        <span id="duel-tournaments-title" class="sys-label sys-label--muted">// Турніри</span>
        <span class="dtour__lead">
          Закриті турніри за паролем
          <span class="dtour__meta">· своя таблиця · ±{{ DUEL_RATING_DELTA }}</span>
        </span>
        <span v-if="blockedReason" class="dtour__blocked">{{ blockedReason }}</span>
      </div>
      <el-button v-if="canCreate" type="primary" plain class="dtour__cta" @click="emit('create')">
        <PhPlus :size="16" weight="bold" class="mr-6" />
        Створити турнір
      </el-button>
    </header>

    <template v-if="isPending">
      <span v-for="n in 2" :key="n" class="skeleton-bone block h-[56px] !rounded-xl" />
    </template>

    <p v-else-if="!active.length && !ended.length" class="dtour__empty">
      Зараз немає турнірів. Їх проводять медіа ліги — пароль дають на стрімі чи в Discord.
    </p>

    <template v-else>
      <ul v-if="active.length" class="dtour__list" aria-label="Активні турніри">
        <li
          v-for="t in active"
          :key="t.id"
          class="dtour__row"
          :class="{ 'is-joined': t.joined, 'is-queued': t.id === queuedTournamentId }"
        >
          <span class="dtour__icon" aria-hidden="true">
            <PhTrophy :size="18" weight="duotone" />
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <RouterLink :to="tournamentRoute(t.id)" class="dtour__name truncate no-underline">
              {{ t.name }}
            </RouterLink>
            <span class="dtour__hint truncate">
              {{ pluralizeDuelPlayers(t.participantsCount) }}
              <template v-if="t.createdBy"> · {{ duelPlayerName(t.createdBy) }}</template>
              <template v-if="t.joined"> · <span class="text-success">ви учасник</span></template>
            </span>
          </div>

          <div class="dtour__actions">
            <el-button
              v-if="!isLoggedIn"
              size="small"
              plain
              @click="emit('login')"
            >
              Увійти
            </el-button>
            <el-button
              v-else-if="!t.joined"
              size="small"
              type="primary"
              plain
              @click="emit('enter', t)"
            >
              <PhKey :size="14" weight="bold" class="mr-4" />
              Пароль
            </el-button>
            <span v-else-if="t.id === queuedTournamentId" class="dtour__queued">
              <span class="dtour__radar" aria-hidden="true" />
              У черзі
            </span>
            <el-button
              v-else
              size="small"
              type="primary"
              :loading="joining && pendingId === t.id"
              :disabled="!canQueue || joining"
              :title="blockedReason || undefined"
              @click="onQueue(t)"
            >
              <PhSword :size="14" weight="fill" class="mr-4" />
              Шукати
            </el-button>
          </div>
        </li>
      </ul>

      <ul v-if="ended.length" class="dtour__list" aria-label="Завершені турніри">
        <li v-for="t in ended" :key="t.id" class="dtour__row is-ended">
          <span class="dtour__icon" aria-hidden="true">
            <PhFlagCheckered :size="18" weight="duotone" />
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <RouterLink :to="tournamentRoute(t.id)" class="dtour__name truncate no-underline">
              {{ t.name }}
            </RouterLink>
            <span class="dtour__hint truncate">
              {{ t.endedAt ? `Завершено ${dayjs(t.endedAt).format('DD.MM.YYYY')}` : 'Завершено' }}
              · {{ pluralizeDuelPlayers(t.participantsCount) }}
            </span>
          </div>
          <RouterLink :to="tournamentRoute(t.id)" class="no-underline">
            <el-button size="small" plain>Таблиця</el-button>
          </RouterLink>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhFlagCheckered, PhKey, PhPlus, PhSword, PhTrophy } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { DUEL_RATING_DELTA, duelPlayerName, pluralizeDuelPlayers } from '@/views/duels/duels.utils'
import type { TDuelTournament } from '@/api/types/api.types'

/** Скільки завершених турнірів показуємо під активними — решта доступні за прямим посиланням. */
const ENDED_LIMIT = 3

const props = defineProps<{
  tournaments: TDuelTournament[]
  isPending: boolean
  isLoggedIn: boolean
  /** Медіа або адмін — може створювати турніри. */
  canCreate: boolean
  /** `status.canQueue`: Steam прив’язано, немає активної дуелі, боти онлайн. */
  canQueue: boolean
  /** Чому не можна шукати суперника — коротко, під заголовком. */
  blockedReason: string
  /** Турнір, у черзі якого я зараз стою. */
  queuedTournamentId: string | null
  joining: boolean
}>()

const emit = defineEmits<{
  create: []
  login: []
  enter: [tournament: TDuelTournament]
  queue: [tournament: TDuelTournament]
}>()

const active = computed(() => props.tournaments.filter(t => t.status === 'ACTIVE'))
const ended = computed(() => props.tournaments.filter(t => t.status === 'ENDED').slice(0, ENDED_LIMIT))

/** Який рядок показує спінер — `joining` спільний для всієї черги. */
const pendingId = ref<string | null>(null)
function onQueue (t: TDuelTournament) {
  pendingId.value = t.id
  emit('queue', t)
}

const tournamentRoute = (id: string) => ({ name: routeNames.duelTournament, params: { id } })
</script>

<style scoped>
.dtour {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
}

.dtour__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.dtour__lead {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dtour__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--ds-text-faint);
  white-space: nowrap;
}

.dtour__blocked {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ds-text-faint);
}

.dtour__blocked::before {
  content: '';
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: var(--ds-gold);
  box-shadow: 0 0 6px rgba(var(--ds-gold-rgb), 0.7);
}

.dtour__cta {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .dtour__cta {
    width: 100%;
  }
}

.dtour__empty {
  padding: 8px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.dtour__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dtour__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;
}

.dtour__row.is-joined {
  border-color: rgba(var(--ds-primary-rgb), 0.28);
}

.dtour__row.is-queued {
  border-color: rgba(var(--ds-primary-rgb), 0.5);
  background: rgba(var(--ds-primary-rgb), 0.06);
}

.dtour__row.is-ended {
  opacity: 0.7;
}

.dtour__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--ds-gold-rgb), 0.1);
  color: var(--ds-gold);
}

.dtour__row.is-ended .dtour__icon {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ds-text-muted);
}

.dtour__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dtour__name:hover {
  color: rgb(var(--ds-primary-rgb));
}

.dtour__hint {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.dtour__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.dtour__queued {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--ds-primary-rgb));
}

.dtour__radar {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: rgba(var(--ds-primary-rgb), 0.9);
  box-shadow: 0 0 10px rgba(var(--ds-primary-rgb), 0.8);
}

@media (prefers-reduced-motion: no-preference) {
  .dtour__radar {
    animation: dtour-pulse 1.6s ease-in-out infinite;
  }
}

@keyframes dtour-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}
</style>
