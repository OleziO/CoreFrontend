<template>
  <FindDialog v-model="modelValue" :label="kindLabel" :title="title" :width="560" @open="load">
    <!-- Завантаження -->
    <div v-if="loading && !request" class="flex flex-col gap-10" aria-busy="true">
      <span class="skeleton-bone block h-[64px] !rounded-xl" />
      <span class="skeleton-bone block h-[96px] !rounded-xl" />
    </div>

    <p v-else-if="!request" class="find-note is-warning">
      <PhWarning :size="16" weight="bold" />
      <span>Не вдалося завантажити запит — можливо, його вже скасовано.</span>
    </p>

    <div v-else class="flex flex-col gap-16">
      <!-- Стан запиту -->
      <div class="flex flex-wrap items-center gap-8">
        <span class="req-status" :class="`is-${request.status.toLowerCase()}`">{{ statusLabel }}</span>
        <span v-if="request.status === 'PENDING'" class="find-field__hint">
          Дійсний до {{ formatFindExpiresAt(request.expiresAt) }}
        </span>
      </div>

      <!-- Заявка: хто подає -->
      <section v-if="isApplication" class="req-block">
        <RouterLink
          :to="{ name: routeNames.player, params: { id: request.player.id } }"
          class="req-who no-underline"
          @click="modelValue = false"
        >
          <el-avatar :size="48" :src="request.player.avatarUrl ?? ''">
            <PhUser :size="20" weight="bold" />
          </el-avatar>
          <span class="flex min-w-0 flex-col gap-2">
            <span class="req-who__name">{{ playerName }}</span>
            <span v-if="request.player.discordUsername" class="find-field__hint">
              @{{ request.player.discordUsername }}
            </span>
          </span>
        </RouterLink>

        <dl class="req-facts">
          <div>
            <dt class="sys-label sys-label--muted">MMR</dt>
            <dd class="flex items-center gap-6">
              <img v-if="rankImageSrc" :src="rankImageSrc" alt="" class="h-24 w-auto" width="32" height="24">
              <b class="req-mono">{{ request.player.rating }}</b>
            </dd>
          </div>
          <div>
            <dt class="sys-label sys-label--muted">Позиція в заявці</dt>
            <dd>{{ request.position ? getDotaPositionLabel(request.position) : '—' }}</dd>
          </div>
          <div>
            <dt class="sys-label sys-label--muted">Усі позиції</dt>
            <dd>{{ positionsLine }}</dd>
          </div>
          <div>
            <dt class="sys-label sys-label--muted">Формат</dt>
            <dd>{{ formatsLine }}</dd>
          </div>
          <div v-if="locationLine" class="col-span-2">
            <dt class="sys-label sys-label--muted">Локація</dt>
            <dd>{{ locationLine }}</dd>
          </div>
        </dl>
      </section>

      <!-- Запрошення: яка команда кличе -->
      <section v-else class="req-block">
        <RouterLink
          :to="{ name: routeNames.team, params: { id: request.team.id } }"
          class="req-who no-underline"
          @click="modelValue = false"
        >
          <span class="req-logo">
            <img v-if="teamLogoSrc" :src="teamLogoSrc" alt="">
            <PhUsersThree v-else :size="22" weight="duotone" class="text-primary/50" />
          </span>
          <span class="flex min-w-0 flex-col gap-2">
            <span class="req-who__name">{{ request.team.name }}</span>
            <span class="find-field__hint">
              {{ request.team.isVerified ? 'Верифікована команда' : 'Не верифікована команда' }}
              <template v-if="request.team.avgRating != null"> · сер. MMR {{ request.team.avgRating }}</template>
            </span>
          </span>
        </RouterLink>

        <dl class="req-facts">
          <div>
            <dt class="sys-label sys-label--muted">Роль</dt>
            <dd>{{ findSlotLabel(request.slot) }}</dd>
          </div>
          <div>
            <dt class="sys-label sys-label--muted">Запросив</dt>
            <dd>{{ inviterName }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="sys-label sys-label--muted">Склад</dt>
            <dd class="flex flex-col gap-4">
              <span><span class="text-white/45">Основа:</span> {{ rosterLine(request.team.mainPlayers) }}</span>
              <span v-if="request.team.reservedPlayers.length">
                <span class="text-white/45">Запас:</span> {{ rosterLine(request.team.reservedPlayers) }}
              </span>
              <span v-if="request.team.coach">
                <span class="text-white/45">Тренер:</span> {{ rosterLine([request.team.coach]) }}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <!-- Повідомлення -->
      <div v-if="request.message" class="find-field">
        <span class="find-field__label">{{ isApplication ? 'Про себе' : 'Повідомлення' }}</span>
        <p class="req-message">{{ request.message }}</p>
      </div>

      <!-- Оголошення, на яке подано заявку -->
      <p v-if="isApplication && request.post" class="find-field__hint">
        Оголошення: {{ postPositionsLine }} · MMR {{ formatFindMmrRange(request.post.mmrMin, request.post.mmrMax) }}
        · потрібно {{ request.post.playersNeeded }}
      </p>

      <!-- Прийняти заявку: менеджер обирає, куди взяти гравця -->
      <div v-if="isApplication && request.canRespond" class="find-field">
        <span class="find-field__label">Куди взяти гравця</span>
        <FindSlotPicker v-model="slot" :disabled-reasons="slotReasons" />
      </div>
    </div>

    <template #footer>
      <el-button v-if="request?.canWithdraw" :loading="busy === 'withdraw'" :disabled="!!busy" @click="withdraw">
        {{ isApplication ? 'Відкликати заявку' : 'Скасувати запрошення' }}
      </el-button>
      <template v-if="request?.canRespond">
        <el-button :loading="busy === 'decline'" :disabled="!!busy" @click="decline">Відхилити</el-button>
        <el-button
          type="primary"
          :loading="busy === 'accept'"
          :disabled="!!busy || (isApplication && !!slotReasons[slot])"
          @click="accept"
        >
          <PhCheck :size="16" weight="bold" />
          <span>Прийняти</span>
        </el-button>
      </template>
      <el-button v-else @click="modelValue = false">Закрити</el-button>
    </template>
  </FindDialog>
</template>

<script setup lang="ts">
import { PhCheck, PhUser, PhUsersThree, PhWarning } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import {
  getPlayerDotaPositions,
  getPlayerRankImageSrcFromPlayerRank,
  getPlayerWantToPlay,
  resolvePublicOrApiUrl
} from '@/core/helpers'
import { getDotaPositionLabel, getTournamentFormatLabel } from '@/components/player-tags/player.enums'
import { useLocations } from '@/composables/use-locations'
import type { TJoinRequest, TPlayerResponseDto, TTeamMemberSlot } from '@/api/types/api.types'
import FindDialog from '@/views/find/components/FindDialog.vue'
import FindSlotPicker from '@/views/find/components/FindSlotPicker.vue'
import { findService } from '@/views/find/find.service'
import { useFindRequestActions } from '@/views/find/composables/use-find-request-actions'
import {
  findFirstOpenSlot,
  findSlotDisabledReasons,
  findSlotLabel,
  formatFindExpiresAt,
  formatFindMmrRange,
  type IFindRosterState
} from '@/views/find/find.utils'

const props = defineProps<{
  requestId: string
  onChanged?: (request: TJoinRequest) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const actions = useFindRequestActions()

const request = ref<TJoinRequest | null>(null)
const loading = ref(false)
const busy = ref<'accept' | 'decline' | 'withdraw' | null>(null)
const slot = ref<TTeamMemberSlot>('main')

const isApplication = computed(() => request.value?.kind !== 'INVITE')
const kindLabel = computed(() => (isApplication.value ? 'Заявка до команди' : 'Запрошення до команди'))
const title = computed(() => {
  if (!request.value) return 'Запит'
  return isApplication.value ? playerName.value : request.value.team.name
})

const STATUS_LABELS: Record<TJoinRequest['status'], string> = {
  PENDING: 'Очікує відповіді',
  ACCEPTED: 'Прийнято',
  DECLINED: 'Відхилено',
  CANCELLED: 'Скасовано',
  EXPIRED: 'Прострочено'
}
const statusLabel = computed(() => (request.value ? STATUS_LABELS[request.value.status] : ''))

const nameOf = (p: Pick<TPlayerResponseDto, 'discordName' | 'discordUsername'>) =>
  p.discordName || p.discordUsername || 'Гравець'

const playerName = computed(() => (request.value ? nameOf(request.value.player) : ''))
const inviterName = computed(() => (request.value?.createdBy ? nameOf(request.value.createdBy) : '—'))
const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(request.value?.player.rank))
const teamLogoSrc = computed(() => resolvePublicOrApiUrl(request.value?.team.logoUrl))

const positionsLine = computed(() => {
  const ids = getPlayerDotaPositions(request.value?.player)
  return ids.length ? ids.map(getDotaPositionLabel).join(', ') : 'Не вказано'
})

const formatsLine = computed(() => {
  const formats = getPlayerWantToPlay(request.value?.player)
  return formats.length ? formats.map(getTournamentFormatLabel).join(' · ') : 'Не вказано'
})

const { countryLabel } = useLocations()
const locationLine = computed(() => {
  const p = request.value?.player
  if (!p) return ''
  const code = String(p.countryCode ?? '').trim().toUpperCase()
  return [String(p.city ?? '').trim(), code ? countryLabel(code) : ''].filter(Boolean).join(', ')
})

const postPositionsLine = computed(() => (request.value?.post?.positions ?? []).map(getDotaPositionLabel).join(', '))

const rosterLine = (players: TPlayerResponseDto[]) => (players.length ? players.map(nameOf).join(', ') : '—')

const roster = computed<IFindRosterState | null>(() => {
  const team = request.value?.team
  if (!team) return null
  return {
    mainCount: team.mainPlayers.length,
    reservedCount: team.reservedPlayers.length,
    hasCoach: !!team.coach,
    isPlayingTournament: team.isPlayingTournament
  }
})
const slotReasons = computed(() => (roster.value ? findSlotDisabledReasons(roster.value) : {}))

async function load () {
  loading.value = true
  try {
    request.value = await findService.fetchRequest(props.requestId)
    slot.value = roster.value ? findFirstOpenSlot(roster.value) ?? 'main' : 'main'
  } catch {
    request.value = null
  } finally {
    loading.value = false
  }
}

async function run (kind: 'accept' | 'decline' | 'withdraw', action: () => Promise<TJoinRequest>) {
  busy.value = kind
  try {
    request.value = await action()
    props.onChanged?.(request.value)
    if (kind !== 'withdraw') modelValue.value = false
  } catch {
    // тост уже показав findService; стан могли змінити деінде — перечитуємо
    await load()
  } finally {
    busy.value = null
  }
}

const accept = () => run('accept', () =>
  actions.accept(props.requestId, isApplication.value ? slot.value : undefined))
const decline = () => run('decline', () => actions.decline(props.requestId))
const withdraw = () => run('withdraw', () => actions.withdraw(props.requestId))
</script>

<style scoped lang="scss">
.req-status {
  @apply inline-flex items-center rounded-md border px-8 py-2 text-xs font-semibold;
  border-color: var(--ds-border);
  color: var(--ds-text-muted);

  &.is-pending {
    border-color: rgba(var(--ds-gold-rgb), 0.45);
    color: var(--ds-gold);
  }

  &.is-accepted {
    border-color: rgba(34, 197, 94, 0.45);
    color: #4ade80;
  }
}

.req-block {
  @apply flex flex-col gap-12 rounded-xl border p-12;
  border-color: rgba(var(--ds-primary-rgb), 0.14);
  background: rgba(0, 0, 0, 0.3);
}

.req-who {
  @apply flex items-center gap-12;
  color: inherit;
}

.req-who__name {
  @apply truncate font-display text-[15px] uppercase tracking-wide text-white;
  transition: color var(--ds-duration-fast) ease;
}

.req-logo {
  @apply inline-flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border;
  border-color: rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(0, 0, 0, 0.35);

  img {
    @apply h-full w-full object-cover;
  }
}

.req-facts {
  @apply m-0 grid grid-cols-2 gap-10;

  dt {
    font-size: 9px !important;
  }

  dd {
    @apply m-0 mt-4 text-sm;
    color: var(--ds-text);
    overflow-wrap: anywhere;
  }
}

.req-mono {
  font-family: var(--ds-font-mono);
  color: var(--ds-primary);
}

.req-message {
  @apply m-0 whitespace-pre-line rounded-xl border p-12 text-sm leading-relaxed;
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.35);
  color: var(--ds-text);
  overflow-wrap: anywhere;
}

@media (hover: hover) and (pointer: fine) {
  .req-who:hover .req-who__name {
    color: var(--ds-primary);
  }
}
</style>
