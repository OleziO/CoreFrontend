<template>
  <div class="dsadmin flex h-full min-h-0 flex-col gap-12">
    <div class="flex shrink-0 flex-wrap items-center gap-8">
      <el-button :loading="isLoading" title="Оновити" aria-label="Оновити" @click="reload">
        <PhArrowsClockwise v-if="!isLoading" :size="14" weight="bold" />
      </el-button>
      <span class="dsadmin__hint">
        Сезон — календарний місяць (Київ). Наприкінці таблиця фіксується, рейтинг обнуляється, VIP-призи
        видаються автоматично, а власні призи чекають тут на позначку «Видано».
      </span>
    </div>

    <div v-loading="isPending" class="custom-scroll min-h-0 flex-1 overflow-y-auto">
      <p v-if="!isPending && !seasons.length" class="dsadmin__empty">Сезонів ще немає</p>

      <div v-else class="flex flex-col gap-12">
        <!-- ─── Поточний сезон: призи місць ─────────────────────────────── -->
        <section v-if="current" class="dsadmin-card hud-panel">
          <header class="dsadmin-card__head">
            <span class="dsadmin-card__icon" aria-hidden="true">
              <PhTrophy :size="16" weight="bold" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <span class="dsadmin-card__title">{{ duelSeasonTitle(current) }} · поточний</span>
              <span class="dsadmin-card__meta">
                {{ formatDuelSeasonRange(current) }}
                <template v-if="current.closing"> · підбиваємо підсумки</template>
                <template v-else-if="timeLeft"> · {{ timeLeft }}</template>
              </span>
            </div>
          </header>

          <DuelTournamentPrizesEditor v-model="drafts" can-use-vip :show-errors="showErrors" />

          <div class="flex flex-wrap items-center gap-8">
            <el-button
              type="primary"
              :loading="saving"
              :disabled="saving || current.closing || !isDirty"
              @click="savePrizes"
            >
              Зберегти призи
            </el-button>
            <el-button v-if="isDirty && !saving" text @click="resetDrafts">Скасувати зміни</el-button>
            <span class="dsadmin__hint">Призи переносяться на наступний сезон — їх можна змінити до кінця місяця.</span>
          </div>
        </section>

        <!-- ─── Завершені сезони: переможці та видача призів ───────────── -->
        <section v-for="season in pastSeasons" :key="season.id" class="dsadmin-card hud-panel">
          <header class="dsadmin-card__head">
            <span class="dsadmin-card__icon is-ended" aria-hidden="true">
              <PhFlagCheckered :size="16" weight="duotone" />
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <span class="dsadmin-card__title">{{ duelSeasonTitle(season) }}</span>
              <span class="dsadmin-card__meta">
                {{ formatDuelSeasonRange(season) }}
                <template v-if="!season.prizesAwardedAt"> · переможців ще визначаємо</template>
                <template v-else-if="pendingCount(season)"> · не видано: {{ pendingCount(season) }}</template>
              </span>
            </div>
            <RouterLink
              :to="{ name: routeNames.leaderboard, query: { board: 'duels', season: season.id } }"
              class="dsadmin-card__link no-underline"
            >
              Таблиця
              <PhArrowRight :size="12" weight="bold" />
            </RouterLink>
          </header>

          <p v-if="!season.prizes.length" class="dsadmin__hint">Призів у цьому сезоні не було.</p>

          <ul v-else class="dsadmin-prizes">
            <li v-for="prize in season.prizes" :key="prize.place" class="dsadmin-prize">
              <span class="dsadmin-prize__place">#{{ prize.place }}</span>
              <DuelPrizeChip :prize="prize" />

              <span class="dsadmin-prize__winner">
                <RouterLink
                  v-if="prize.awardedPlayer"
                  :to="{ name: routeNames.player, params: { id: prize.awardedPlayer.id } }"
                  class="no-underline"
                >
                  {{ duelPlayerName(prize.awardedPlayer) }}
                </RouterLink>
                <template v-else-if="season.prizesAwardedAt">ніхто не посів</template>
                <template v-else>—</template>
              </span>

              <template v-if="prize.awardedPlayerId">
                <span v-if="prize.issuedAt" class="dsadmin-prize__status is-issued">
                  <PhCheckCircle :size="13" weight="fill" />
                  {{ prize.kind === 'vip' ? 'VIP видано' : 'Видано' }} {{ dayjs(prize.issuedAt).format('DD.MM') }}
                </span>
                <span v-else-if="prize.kind === 'vip'" class="dsadmin-prize__status is-warning">
                  VIP не видано автоматично — видайте у вкладці VIP
                </span>
                <el-button
                  size="small"
                  :type="prize.issuedAt ? undefined : 'primary'"
                  :plain="!prize.issuedAt"
                  :text="!!prize.issuedAt"
                  :loading="issuingKey === keyOf(season, prize)"
                  :disabled="!!issuingKey"
                  @click="toggleIssued(season, prize)"
                >
                  {{ prize.issuedAt ? 'Зняти позначку' : 'Позначити виданим' }}
                </el-button>
              </template>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhArrowRight, PhArrowsClockwise, PhCheckCircle, PhFlagCheckered, PhTrophy } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useGetDuelSeasons } from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import {
  duelPlayerName,
  duelPrizeDraftError,
  duelPrizeDraftToInput,
  duelPrizeDraftsFrom,
  duelSeasonTimeLeft,
  duelSeasonTitle,
  formatDuelSeasonRange
} from '@/views/duels/duels.utils'
import DuelPrizeChip from '@/views/duels/components/DuelPrizeChip.vue'
import DuelTournamentPrizesEditor from '@/views/duels/components/DuelTournamentPrizesEditor.vue'
import type { TDuelSeason, TDuelSeasonPrize } from '@/api/types/api.types'

const { data: seasons, isPending, isLoading, refetch } = useGetDuelSeasons()

function reload () {
  refetch().catch(() => { /* стан помилки покаже список */ })
}

const current = computed(() => seasons.value.find(s => s.status === 'ACTIVE') ?? null)
const pastSeasons = computed(() => seasons.value.filter(s => s.status === 'ENDED'))

const now = useNow({ interval: 60_000 })
const timeLeft = computed(() => (current.value ? duelSeasonTimeLeft(current.value.endsAt, now.value) : null))

// ─── Призи поточного сезону ─────────────────────────────────────────────────

const drafts = ref<TDuelPrizeDraft[]>([])
const showErrors = ref(false)
const saving = ref(false)

const draftsBody = (list: readonly TDuelPrizeDraft[]) =>
  JSON.stringify([...list].sort((a, b) => a.place - b.place).map(duelPrizeDraftToInput))
const savedBody = computed(() => draftsBody(duelPrizeDraftsFrom(current.value?.prizes)))
const isDirty = computed(() => draftsBody(drafts.value) !== savedBody.value)

function resetDrafts () {
  drafts.value = duelPrizeDraftsFrom(current.value?.prizes)
  showErrors.value = false
}

// Чернетку скидаємо лише з новим сезоном — фонове оновлення списку не стирає незбережені правки.
watch(() => current.value?.id, resetDrafts, { immediate: true })

async function savePrizes () {
  const season = current.value
  if (!season || saving.value) return
  showErrors.value = true
  if (drafts.value.some(d => duelPrizeDraftError(d, drafts.value))) return
  saving.value = true
  try {
    await duelsService.updateSeasonPrizes(
      season.id,
      [...drafts.value].sort((a, b) => a.place - b.place).map(duelPrizeDraftToInput)
    )
    await refetch()
    resetDrafts()
  } catch {
    // тост уже показав duelsService
  } finally {
    saving.value = false
  }
}

// ─── Видача призів завершених сезонів ───────────────────────────────────────

const issuingKey = ref<string | null>(null)
const keyOf = (season: TDuelSeason, prize: TDuelSeasonPrize) => `${season.id}:${prize.place}`

/** Скільки виграних місць ще чекають на видачу. */
const pendingCount = (season: TDuelSeason) =>
  season.prizes.filter(p => p.awardedPlayerId && !p.issuedAt).length

async function toggleIssued (season: TDuelSeason, prize: TDuelSeasonPrize) {
  if (issuingKey.value) return
  issuingKey.value = keyOf(season, prize)
  try {
    await duelsService.setSeasonPrizeIssued(season.id, prize.place, !prize.issuedAt)
    await refetch()
  } catch {
    // тост уже показав duelsService
  } finally {
    issuingKey.value = null
  }
}
</script>

<style scoped>
.dsadmin__hint {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.dsadmin__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.dsadmin-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 12px 14px;
}

.dsadmin-card__head {
  display: flex;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
}

.dsadmin-card__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: rgb(255, 206, 84);
  background: rgba(255, 206, 84, 0.14);
}

.dsadmin-card__icon.is-ended {
  color: var(--ds-text-muted);
  background: rgba(255, 255, 255, 0.06);
}

.dsadmin-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dsadmin-card__meta {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.dsadmin-card__link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-primary);
}

.dsadmin-prizes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dsadmin-prize {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  min-width: 0;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.dsadmin-prize__place {
  min-width: 28px;
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-text-muted);
}

.dsadmin-prize__winner {
  flex: 1 1 120px;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ds-text);
}

.dsadmin-prize__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.dsadmin-prize__status.is-issued {
  color: #4ade80;
}

.dsadmin-prize__status.is-warning {
  color: var(--ds-gold);
}
</style>
