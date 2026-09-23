<template>
  <section class="roster neon-card rounded-2xl">
    <div class="grid min-h-0 h-fit grid-cols-1 gap-24 2sm:grid-cols-2">
      <!-- MAIN ROSTER -->
      <div class="roster__col">
        <header class="roster__head">
          <span class="sys-label !text-[10px]">// Основа</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="roster__count">
            {{ pad(team?.mainPlayers?.length ?? 0) }}<span class="roster__of">/{{ pad(MAIN_SLOTS) }}</span>
          </span>
        </header>

        <ol class="roster__rack">
          <li
            v-for="(player, idx) in team?.mainPlayers"
            :key="player.id"
            class="roster-slot is-filled"
          >
            <span class="roster-slot__index">{{ pad(idx + 1) }}</span>
            <div class="roster-slot__card">
              <PlayerCard :player="player" :is-captain="player.id === team?.captain?.id" />

              <template v-if="showRemoveButton(player)">
                <el-popover
                  v-if="isAdmin"
                  trigger="click"
                  placement="top-end"
                  :width="300"
                  popper-class="roster-popper"
                >
                  <template #reference>
                    <button
                      type="button"
                      class="roster-slot__remove"
                      :disabled="removePlayerLoadingId === player.id"
                      aria-label="Прибрати з команди"
                      @click.stop
                    >
                      <PhX :size="14" weight="bold" class="pointer-events-none" />
                    </button>
                  </template>
                  <div class="remove-pop">
                    <div class="remove-pop__head">
                      <span class="remove-pop__well"><PhWarning :size="14" weight="fill" /></span>
                      <span class="sys-label sys-label--pink !text-[9px]">// Прибрати гравця</span>
                    </div>
                    <p class="remove-pop__text">
                      {{ hasActiveTournaments ? tournamentRemovePlayerWarning : removePlayerPenaltyPrompt }}
                    </p>
                    <div class="remove-pop__actions">
                      <el-button
                        type="danger"
                        class="remove-pop__btn"
                        :loading="removePlayerLoadingId === player.id"
                        @click.stop="emit('remove-player', player.id, ERemovePlayerPenalty.SUBTRACT)"
                      >
                        <PhTrendDown :size="16" weight="bold" />
                        <span>З втратою пойнтів</span>
                      </el-button>
                      <el-button
                        plain
                        class="remove-pop__btn"
                        :loading="removePlayerLoadingId === player.id"
                        @click.stop="emit('remove-player', player.id, ERemovePlayerPenalty.NONE)"
                      >
                        <PhShieldCheck :size="16" weight="bold" />
                        <span>Без втрати пойнтів</span>
                      </el-button>
                    </div>
                  </div>
                </el-popover>
                <el-popconfirm
                  v-else-if="hasActiveTournaments"
                  width="320"
                  placement="top-end"
                  :title="tournamentRemovePlayerWarning"
                  confirm-button-text="Видалити"
                  cancel-button-text="Скасувати"
                  @confirm="emit('remove-player', player.id)"
                >
                  <template #reference>
                    <button
                      type="button"
                      class="roster-slot__remove"
                      :disabled="removePlayerLoadingId === player.id"
                      aria-label="Прибрати з команди"
                      @click.stop
                    >
                      <PhX :size="14" weight="bold" class="pointer-events-none" />
                    </button>
                  </template>
                </el-popconfirm>
                <button
                  v-else
                  type="button"
                  class="roster-slot__remove"
                  :disabled="removePlayerLoadingId === player.id"
                  aria-label="Прибрати з команди"
                  @click.stop="confirmAndRemovePlayer(player.id)"
                >
                  <PhX :size="14" weight="bold" class="pointer-events-none" />
                </button>
              </template>
            </div>
          </li>

          <li v-for="i in mainSlotCounts" :key="`open-${i}`" class="roster-slot">
            <span class="roster-slot__index">{{ pad((team?.mainPlayers?.length ?? 0) + i) }}</span>
            <button
              v-if="canEditTeamRoster"
              type="button"
              class="roster-slot__open"
              @click="emit('add-player', 'main')"
            >
              <span class="roster-slot__plus"><PhPlus :size="14" weight="bold" /></span>
              <span class="roster-slot__open-label">Додати гравця</span>
              <span class="roster-slot__open-tag">Вільно</span>
            </button>
            <div v-else class="roster-slot__open is-static">
              <span class="roster-slot__open-label">Вільно</span>
            </div>
          </li>
        </ol>
      </div>

      <!-- RESERVE + COACH -->
      <div class="roster__col gap-24">
        <div class="roster__col">
          <header class="roster__head">
            <span class="sys-label !text-[10px]">// Запас</span>
            <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
            <span class="roster__count">
              {{ pad(team?.reservedPlayers?.length ?? 0) }}<span class="roster__of">/{{ pad(RESERVE_SLOTS) }}</span>
            </span>
          </header>

          <ol class="roster__rack">
            <li
              v-for="(player, idx) in team?.reservedPlayers"
              :key="player.id"
              class="roster-slot is-filled"
            >
              <span class="roster-slot__index">{{ pad(idx + 1) }}</span>
              <div class="roster-slot__card">
                <PlayerCard :player="player" :is-captain="player.id === team?.captain?.id" />

                <template v-if="showRemoveButton(player)">
                  <el-popover
                    v-if="isAdmin"
                    trigger="click"
                    placement="top-end"
                    :width="300"
                    popper-class="roster-popper"
                  >
                    <template #reference>
                      <button
                        type="button"
                        class="roster-slot__remove"
                        :disabled="removePlayerLoadingId === player.id"
                        aria-label="Прибрати з команди"
                        @click.stop
                      >
                        <PhX :size="14" weight="bold" class="pointer-events-none" />
                      </button>
                    </template>
                    <div class="remove-pop">
                      <div class="remove-pop__head">
                        <span class="remove-pop__well"><PhWarning :size="14" weight="fill" /></span>
                        <span class="sys-label sys-label--pink !text-[9px]">// Прибрати гравця</span>
                      </div>
                      <p class="remove-pop__text">
                        {{ hasActiveTournaments ? tournamentRemovePlayerWarning : removePlayerPenaltyPrompt }}
                      </p>
                      <div class="remove-pop__actions">
                        <el-button
                          type="danger"
                          class="remove-pop__btn"
                          :loading="removePlayerLoadingId === player.id"
                          @click.stop="emit('remove-player', player.id, ERemovePlayerPenalty.SUBTRACT)"
                        >
                          <PhTrendDown :size="16" weight="bold" />
                          <span>З втратою пойнтів</span>
                        </el-button>
                        <el-button
                          plain
                          class="remove-pop__btn"
                          :loading="removePlayerLoadingId === player.id"
                          @click.stop="emit('remove-player', player.id, ERemovePlayerPenalty.NONE)"
                        >
                          <PhShieldCheck :size="16" weight="bold" />
                          <span>Без втрати пойнтів</span>
                        </el-button>
                      </div>
                    </div>
                  </el-popover>
                  <el-popconfirm
                    v-else-if="hasActiveTournaments"
                    width="320"
                    placement="top-end"
                    :title="tournamentRemovePlayerWarning"
                    confirm-button-text="Видалити"
                    cancel-button-text="Скасувати"
                    @confirm="emit('remove-player', player.id)"
                  >
                    <template #reference>
                      <button
                        type="button"
                        class="roster-slot__remove"
                        :disabled="removePlayerLoadingId === player.id"
                        aria-label="Прибрати з команди"
                        @click.stop
                      >
                        <PhX :size="14" weight="bold" class="pointer-events-none" />
                      </button>
                    </template>
                  </el-popconfirm>
                  <button
                    v-else
                    type="button"
                    class="roster-slot__remove"
                    :disabled="removePlayerLoadingId === player.id"
                    aria-label="Прибрати з команди"
                    @click.stop="confirmAndRemovePlayer(player.id)"
                  >
                    <PhX :size="14" weight="bold" class="pointer-events-none" />
                  </button>
                </template>
              </div>
            </li>

            <li v-for="i in reserveSlotCounts" :key="`open-${i}`" class="roster-slot">
              <span class="roster-slot__index">{{ pad((team?.reservedPlayers?.length ?? 0) + i) }}</span>
              <button
                v-if="canEditTeamRoster"
                type="button"
                class="roster-slot__open"
                @click="emit('add-player', 'reserved')"
              >
                <span class="roster-slot__plus"><PhPlus :size="14" weight="bold" /></span>
                <span class="roster-slot__open-label">Додати гравця</span>
                <span class="roster-slot__open-tag">Вільно</span>
              </button>
              <div v-else class="roster-slot__open is-static">
                <span class="roster-slot__open-label">Вільно</span>
              </div>
            </li>
          </ol>
        </div>

        <div v-if="team?.coach || canEditTeamRoster" class="roster__col">
          <header class="roster__head">
            <span class="sys-label !text-[10px]">// Тренер</span>
            <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
            <span class="roster__count">
              {{ pad(team?.coach ? 1 : 0) }}<span class="roster__of">/01</span>
            </span>
          </header>

          <ol class="roster__rack">
            <li v-if="team?.coach" class="roster-slot is-filled">
              <span class="roster-slot__index">01</span>
              <div class="roster-slot__card">
                <PlayerCard :player="team.coach" />
                <button
                  v-if="canEditTeamRoster"
                  type="button"
                  class="roster-slot__remove"
                  :disabled="removeCoachLoading"
                  aria-label="Прибрати тренера"
                  @click.stop="confirmAndRemoveCoach()"
                >
                  <PhX :size="14" weight="bold" class="pointer-events-none" />
                </button>
              </div>
            </li>
            <li v-else class="roster-slot">
              <span class="roster-slot__index">01</span>
              <button type="button" class="roster-slot__open" @click="emit('add-player', 'coach')">
                <span class="roster-slot__plus"><PhPlus :size="14" weight="bold" /></span>
                <span class="roster-slot__open-label">Додати тренера</span>
                <span class="roster-slot__open-tag">Вільно</span>
              </button>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { PhPlus, PhShieldCheck, PhTrendDown, PhWarning, PhX } from '@phosphor-icons/vue'
import { ERemovePlayerPenalty } from '@/views/teams/teams.enums'

const props = defineProps<{
  team: TTeam | null
  canEditTeamRoster: boolean
  isAdmin: boolean
  removePlayerLoadingId: string | null
  removeCoachLoading: boolean
}>()

const emit = defineEmits<{
  'remove-player': [playerId: string, penalty?: ERemovePlayerPenalty]
  'remove-coach': []
  'add-player': [slot: 'main' | 'reserved' | 'coach']
}>()

const hasActiveTournaments = computed(() => !!props.team?.tournaments?.length)

const tournamentRemovePlayerWarning =
  'Гравець бере участь у турнірі. Після виходу він втратить 70% зароблених очок у цьому турнірі. Продовжити?'

const removePlayerPenaltyPrompt = 'Прибрати гравця зі складу команди?'

const MAIN_SLOTS = 5
const RESERVE_SLOTS = 3

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

const mainSlotCounts = computed(() => {
  const count = props.team?.mainPlayers?.length ?? 0
  return Math.max(0, MAIN_SLOTS - count)
})

const reserveSlotCounts = computed(() => {
  const count = props.team?.reservedPlayers?.length ?? 0
  return Math.max(0, RESERVE_SLOTS - count)
})

function showRemoveButton (player: { id: string }) {
  if (!props.canEditTeamRoster) return false
  if (props.isAdmin) return true
  const capId = props.team?.captain?.id
  if (!capId) return true
  return player.id !== capId
}

async function confirmAndRemovePlayer (playerId: string) {
  const confirmed = await ElMessageBox.confirm(
    'Гравця буде прибрано зі складу цієї команди.',
    'Прибрати з команди?',
    {
      confirmButtonText: 'Прибрати',
      cancelButtonText: 'Скасувати',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => true).catch(() => false)
  if (confirmed) emit('remove-player', playerId)
}

async function confirmAndRemoveCoach () {
  const confirmed = await ElMessageBox.confirm(
    'Тренера буде прибрано з команди.',
    'Прибрати тренера?',
    {
      confirmButtonText: 'Прибрати',
      cancelButtonText: 'Скасувати',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(() => true).catch(() => false)
  if (confirmed) emit('remove-coach')
}
</script>

<style lang="scss" scoped>
.roster {
  @apply relative flex w-full flex-1 flex-col p-20 2xs:min-w-[400px] lg:self-stretch;
  min-height: 0;
  overflow-y: auto;
}

.roster__col {
  @apply flex h-fit w-full min-w-0 flex-1 flex-col gap-12;
}

.roster__head {
  @apply flex items-center gap-12;
}

.roster__count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
  font-variant-numeric: tabular-nums;
}

.roster__of {
  color: var(--ds-text-faint);
  text-shadow: none;
}

// ─── Rack ───────────────────────────────────────────────────────────────────
.roster__rack {
  @apply m-0 flex list-none flex-col gap-10 rounded-xl p-12;
  border: 1px solid var(--ds-border);
  background: rgba(7, 8, 15, 0.35);
}

.roster-slot {
  @apply grid items-center gap-10;
  grid-template-columns: 20px minmax(0, 1fr);
}

.roster-slot__index {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;
}

.is-filled .roster-slot__index {
  color: rgba(var(--ds-primary-rgb), 0.75);
}

.roster-slot__card {
  @apply relative min-w-0 overflow-visible rounded-2xl;
}

// Remove: an in-card icon button. Hidden until the row is hovered on pointer
// devices; always present on touch, and on keyboard focus.
.roster-slot__remove {
  @apply absolute right-8 top-8 z-30 inline-flex size-28 items-center justify-center rounded-lg;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(7, 8, 15, 0.85);
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition:
    opacity var(--ds-duration-base) ease,
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.75);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.38;
    pointer-events: none;
  }
}

// ─── Open slot ──────────────────────────────────────────────────────────────
.roster-slot__open {
  @apply flex h-56 w-full items-center gap-12 rounded-xl border px-14 text-left;
  color: rgba(255, 255, 255, 0.72);
  border-color: rgba(var(--ds-primary-rgb), 0.2);
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-primary-rgb), 0.05) 0 1px, transparent 1px 10px),
    rgba(7, 8, 15, 0.4);
  cursor: pointer;
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active:not(.is-static) {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7);
    outline-offset: 2px;
  }

  &.is-static {
    justify-content: center;
    color: var(--ds-text-faint);
    cursor: default;
  }
}

.roster-slot__plus {
  @apply inline-flex size-28 shrink-0 items-center justify-center rounded-lg;
  color: var(--ds-primary);
  border: 1px solid rgba(var(--ds-primary-rgb), 0.35);
  background: rgba(var(--ds-primary-rgb), 0.1);
  transition: background-color var(--ds-duration-base) ease, color var(--ds-duration-base) ease;
}

.roster-slot__open-label {
  font-size: 14px;
  font-weight: 600;
}

.roster-slot__open-tag {
  margin-left: auto;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

// ─── Pointer-only hover ─────────────────────────────────────────────────────
@media (hover: hover) and (pointer: fine) {
  .roster-slot__remove {
    opacity: 0;
  }

  .roster-slot:hover .roster-slot__remove,
  .roster-slot:focus-within .roster-slot__remove {
    opacity: 1;
  }

  .roster-slot__remove:hover:not(:disabled) {
    color: #fecaca;
    border-color: rgba(248, 113, 113, 0.5);
    background: rgba(69, 10, 10, 0.92);
  }

  .roster-slot__open:not(.is-static):hover {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.55);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.15);

    .roster-slot__plus {
      color: var(--ds-background);
      background: var(--ds-primary);
    }

    .roster-slot__open-tag {
      color: var(--ds-primary);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .roster-slot__remove,
  .roster-slot__open,
  .roster-slot__plus {
    transition: none;
  }
}
</style>

<style lang="scss">
// Remove-player popover (teleported popper, so not scoped).
.el-popover.roster-popper {
  padding: 14px;
  border-color: rgba(var(--ds-pink-rgb), 0.3);
  background: rgba(16, 19, 36, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--ds-elevation-4), 0 0 24px rgba(var(--ds-pink-rgb), 0.12);
}

.remove-pop {
  @apply flex flex-col gap-10;
}

.remove-pop__head {
  @apply flex items-center gap-8;
}

.remove-pop__well {
  @apply inline-flex size-24 items-center justify-center rounded-md;
  color: var(--ds-pink);
  background: rgba(var(--ds-pink-rgb), 0.12);
  border: 1px solid rgba(var(--ds-pink-rgb), 0.35);
}

.remove-pop__text {
  @apply m-0 text-[13px] leading-relaxed;
  color: rgba(255, 255, 255, 0.78);
}

.remove-pop__actions {
  @apply flex flex-col gap-8 pt-2;

  .remove-pop__btn {
    width: 100%;
    margin-left: 0 !important;
  }

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}
</style>
