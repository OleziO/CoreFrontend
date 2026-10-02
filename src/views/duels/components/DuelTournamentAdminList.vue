<template>
  <div class="dtadmin flex h-full min-h-0 flex-col gap-12">
    <div class="flex shrink-0 flex-wrap items-center gap-8">
      <el-button :loading="isLoading" title="Оновити" aria-label="Оновити" @click="reload">
        <PhArrowsClockwise v-if="!isLoading" :size="14" weight="bold" />
      </el-button>
      <span class="dtadmin__hint">
        Стрім-турніри 1v1: {{ tournaments.length }}. Видалення закриває чергу, скасовує нестартовані дуелі
        й прибирає таблицю — незворотно.
      </span>
    </div>

    <div v-loading="isPending" class="custom-scroll min-h-0 flex-1 overflow-y-auto">
      <p v-if="!isPending && !tournaments.length" class="dtadmin__empty">Турнірів ще немає</p>

      <ul v-else class="dtadmin__list">
        <li v-for="t in tournaments" :key="t.id" class="dtadmin-row hud-panel">
          <span class="dtadmin-row__icon" :class="{ 'is-ended': t.status !== 'ACTIVE' }" aria-hidden="true">
            <PhBroadcast v-if="t.status === 'ACTIVE'" :size="16" weight="bold" />
            <PhFlagCheckered v-else :size="16" weight="duotone" />
          </span>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <RouterLink
              :to="{ name: routeNames.duelTournament, params: { id: t.id } }"
              class="dtadmin-row__name truncate no-underline"
            >
              {{ t.name }}
            </RouterLink>
            <span class="dtadmin-row__meta truncate">
              {{ t.status === 'ACTIVE' ? 'Триває' : 'Завершено' }}
              · {{ pluralizeDuelPlayers(t.participantsCount) }}
              <template v-if="t.createdBy"> · стрімер {{ duelPlayerName(t.createdBy) }}</template>
              · {{ dayjs(t.createdAt).format('DD.MM.YYYY') }}
            </span>
          </div>

          <div v-if="t.prizes?.length" class="dtadmin-row__prizes">
            <DuelPrizeChip v-for="prize in t.prizes.slice(0, 3)" :key="prize.place" :prize="prize" />
            <span v-if="t.prizes.length > 3" class="dtadmin-row__more">+{{ t.prizes.length - 3 }}</span>
          </div>

          <el-button
            type="danger"
            plain
            size="small"
            :loading="deletingId === t.id"
            :disabled="!!deletingId"
            :aria-label="`Видалити турнір ${t.name}`"
            @click="remove(t)"
          >
            <PhTrash v-if="deletingId !== t.id" :size="14" weight="bold" class="mr-4" />
            Видалити
          </el-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { ElMessageBox } from 'element-plus'
import { PhArrowsClockwise, PhBroadcast, PhFlagCheckered, PhTrash } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useGetDuelTournaments } from '@/views/duels/duels.queries'
import { duelsService } from '@/views/duels/duels.service'
import { duelPlayerName, pluralizeDuelPlayers } from '@/views/duels/duels.utils'
import DuelPrizeChip from '@/views/duels/components/DuelPrizeChip.vue'
import type { TDuelTournament } from '@/api/types/api.types'

const authStore = useAuthStore()

const {
  data: tournaments,
  isPending,
  isLoading,
  refetch
} = useGetDuelTournaments(() => authStore.user?.id ?? null)

function reload () {
  refetch().catch(() => { /* стан помилки покаже список */ })
}

const deletingId = ref<string | null>(null)

async function remove (t: TDuelTournament) {
  if (deletingId.value) return
  try {
    await ElMessageBox.confirm(
      `Турнір «${t.name}» і його таблицю буде видалено назавжди. Черга закриється, нестартовані дуелі ` +
        'скасуються; ігри, що вже йдуть, дограються без зміни рейтингу. Нерозіграні призи не видаються.',
      'Видалити турнір?',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Ні', type: 'error', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }
  deletingId.value = t.id
  try {
    await duelsService.deleteTournament(t.id)
    reload()
  } catch {
    // тост уже показав duelsService
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.dtadmin__hint {
  font-size: 12px;
  color: var(--ds-text-faint);
}

.dtadmin__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.dtadmin__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.dtadmin-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
  padding: 10px 12px;
}

.dtadmin-row__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: rgba(124, 58, 237, 0.16);
  color: rgb(196, 167, 255);
}

.dtadmin-row__icon.is-ended {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ds-text-muted);
}

.dtadmin-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.dtadmin-row__name:hover {
  color: rgb(var(--ds-primary-rgb));
}

.dtadmin-row__meta {
  font-size: 12px;
  color: var(--ds-text-muted);
}

.dtadmin-row__prizes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.dtadmin-row__more {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}
</style>
