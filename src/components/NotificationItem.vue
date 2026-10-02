<template>
  <li
    class="notif-item"
    :class="[`tone-${tone}`, { 'is-unread': !item.readAt, 'is-actionable': isPending }]"
    :style="{ '--i': Math.min(index, 10) }"
  >
    <!-- Хто: аватар актора з маленьким бейджем типу події в куті -->
    <span class="notif-item__avatar-wrap" aria-hidden="true">
      <el-avatar :src="resolvePublicOrApiUrl(item.actor?.avatarUrl)" :size="32" class="notif-item__avatar">
        {{ actorInitial }}
      </el-avatar>
      <span class="notif-item__type">
        <component :is="icon" :size="10" weight="bold" />
      </span>
    </span>

    <div class="notif-item__body">
      <p class="notif-item__text">
        <RouterLink
          v-if="item.actor"
          :to="{ name: routeNames.player, params: { id: item.actor.id } }"
          class="notif-item__actor no-underline"
          @click="emit('navigate')"
        >
          {{ actorName }}
        </RouterLink>
        <span>{{ text }}</span>
        <RouterLink
          v-if="item.team"
          :to="{ name: routeNames.team, params: { id: item.team.id } }"
          class="notif-item__actor notif-item__team no-underline"
          @click="emit('navigate')"
        >
          {{ item.team.name }}
        </RouterLink>
      </p>

      <!-- Другий рядок лише коли є що сказати: результат, таймер або перехід -->
      <div v-if="statusLabel || expiresIn || isDuelReady" class="notif-item__meta">
        <span v-if="statusLabel" class="notif-item__status" :class="`is-${item.status}`">{{ statusLabel }}</span>
        <span v-else-if="expiresIn" class="notif-item__status is-timer">
          <PhTimer :size="10" weight="bold" aria-hidden="true" />
          {{ expiresIn }}
        </span>
        <RouterLink
          v-if="isDuelReady"
          :to="{ name: routeNames.duels }"
          class="notif-item__link no-underline"
          @click="emit('navigate')"
        >
          Перейти до дуелі
          <PhArrowRight :size="11" weight="bold" class="notif-item__link-arrow" />
        </RouterLink>
      </div>

      <!-- Дії: лише поки запит / виклик відкритий -->
      <div v-if="isPending && item.refId" class="notif-item__actions">
        <el-button v-if="isTeamRequest" size="small" plain :disabled="busy" @click="onView">
          <PhEye :size="13" weight="bold" class="mr-4" />
          Переглянути
        </el-button>
        <el-button
          type="primary"
          size="small"
          :loading="busy"
          :disabled="busy"
          @click="onAccept"
        >
          <PhCheck v-if="!busy" :size="13" weight="bold" class="mr-4" />
          Прийняти
        </el-button>
        <el-button size="small" text :disabled="busy" @click="onDecline">
          Відхилити
        </el-button>
      </div>
    </div>

    <!-- Коли: коротко, у правому куті; крапка — непрочитане, гасне після відкриття панелі -->
    <span class="notif-item__aside">
      <time :datetime="item.createdAt" :title="whenAbsolute">{{ whenShort }}</time>
      <span class="notif-item__dot" aria-hidden="true" />
    </span>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import {
  PhArrowRight, PhCheck, PhEnvelopeSimple, PhEye, PhPaperPlaneTilt, PhSword, PhUserPlus, PhUsersThree, PhXCircle,
  PhTimer
} from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { formatDuelCountdown, secondsUntil } from '@/views/duels/duels.utils'
import { useFindRequestActions } from '@/views/find/composables/use-find-request-actions'
import type { TNotification, TNotificationStatus, TNotificationType } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  item: TNotification
  /** Порядок у списку — для каскаду появи. */
  index?: number
  /** День групи, в якій рядок показано: підпис групи вже каже «коли», тож час скорочуємо. */
  day?: 'today' | 'yesterday' | 'earlier'
}>(), {
  index: 0,
  day: undefined
})

const emit = defineEmits<{
  /** Користувач перейшов за посиланням — панель закривається. */
  navigate: []
}>()

const router = useRouter()
const store = useNotificationsStore()
const friendsStore = useFriendsStore()
const { accept: acceptChallenge, decline: declineChallenge } = useDuelChallenges()
const findRequests = useFindRequestActions()
const { open: openModal } = useAppModals()

const now = useNow({ interval: 1000 })

const actorName = computed(() => props.item.actor?.discordName || props.item.actor?.discordUsername || 'Гравець')
const actorInitial = computed(() => actorName.value.charAt(0).toUpperCase())
const isPending = computed(() => props.item.status === 'pending')
const isDuelReady = computed(() => props.item.type === 'duel_challenge_accepted')
/** Заявка до команди / запрошення: окрім «Прийняти» є «Переглянути» з усіма деталями. */
const isTeamRequest = computed(() => props.item.type === 'team_application' || props.item.type === 'team_invite')
const busy = computed(() => store.isBusy(props.item.id))

const texts: Record<TNotificationType, string> = {
  friend_request: 'хоче додати вас у друзі',
  friend_request_accepted: 'прийняв ваш запит у друзі',
  duel_challenge: 'викликає вас на дружню дуель (±10)',
  duel_challenge_accepted: 'прийняв виклик — дуель уже створюється',
  duel_challenge_declined: 'відхилив ваш виклик на дуель',
  duel_challenge_expired: 'не відповів на виклик — він прострочений',
  team_application: 'подав заявку до команди',
  team_application_accepted: 'прийняв вашу заявку — ви в команді',
  team_application_declined: 'відхилив вашу заявку до команди',
  team_invite: 'запрошує вас до команди',
  team_invite_accepted: 'прийняв запрошення до команди',
  team_invite_declined: 'відхилив запрошення до команди'
}
const text = computed(() => texts[props.item.type])

const icons = {
  friend_request: PhUserPlus,
  friend_request_accepted: PhUsersThree,
  duel_challenge: PhSword,
  duel_challenge_accepted: PhSword,
  duel_challenge_declined: PhXCircle,
  duel_challenge_expired: PhTimer,
  team_application: PhPaperPlaneTilt,
  team_application_accepted: PhUsersThree,
  team_application_declined: PhXCircle,
  team_invite: PhEnvelopeSimple,
  team_invite_accepted: PhUsersThree,
  team_invite_declined: PhXCircle
} satisfies Record<TNotificationType, unknown>
const icon = computed(() => icons[props.item.type])

const tone = computed(() => {
  switch (props.item.type) {
    case 'friend_request_accepted':
    case 'duel_challenge_accepted':
    case 'team_application_accepted':
    case 'team_invite_accepted':
      return 'success'
    case 'duel_challenge':
    case 'team_invite':
      return 'gold'
    case 'duel_challenge_declined':
    case 'duel_challenge_expired':
    case 'team_application_declined':
    case 'team_invite_declined':
      return 'muted'
    default:
      return 'primary'
  }
})

const statusLabels: Record<TNotificationStatus, string> = {
  pending: '',
  accepted: 'прийнято',
  declined: 'відхилено',
  cancelled: 'скасовано',
  expired: 'прострочено'
}
const statusLabel = computed(() => (props.item.status ? statusLabels[props.item.status] : ''))

const whenAbsolute = computed(() => {
  const d = dayjs(props.item.createdAt)
  return d.isValid() ? d.format('DD.MM.YYYY HH:mm') : ''
})

/**
 * Короткий час для правого кута. Група вже сказала, який це день, тому:
 * сьогодні — «щойно» / «5 хв» / «2 год»; вчора — «21:13»; раніше — «12.09».
 * Без групи (рядок чекає на відповідь) — повна відносна форма, бо день невідомий.
 */
const whenShort = computed(() => {
  const d = dayjs(props.item.createdAt)
  if (!d.isValid()) return ''
  const current = dayjs(now.value)
  const minutes = current.diff(d, 'minute')
  const isToday = current.isSame(d, 'day')
  const isYesterday = current.subtract(1, 'day').isSame(d, 'day')

  if (isToday) {
    if (minutes < 1) return 'щойно'
    if (minutes < 60) return `${minutes} хв`
    return `${current.diff(d, 'hour')} год`
  }
  if (props.day === 'yesterday') return d.format('HH:mm')
  if (props.day === 'earlier') return d.format('DD.MM')
  if (isYesterday) return `вчора, ${d.format('HH:mm')}`
  return d.format('DD.MM, HH:mm')
})

const expiresIn = computed(() => {
  if (props.item.type !== 'duel_challenge' || !props.item.expiresAt || !isPending.value) return ''
  const left = secondsUntil(props.item.expiresAt, now.value)
  return left > 0 ? formatDuelCountdown(left) : ''
})

function onView () {
  const refId = props.item.refId
  if (!refId) return
  emit('navigate')
  openModal('FindRequestModal', { requestId: refId })
}

async function onAccept () {
  const refId = props.item.refId
  if (!refId) return
  if (isTeamRequest.value) {
    await store.runAction(props.item.id, () => findRequests.accept(refId))
    return
  }
  if (props.item.type === 'friend_request') {
    await store.runAction(props.item.id, () => friendsStore.acceptRequest(refId))
    return
  }
  if (props.item.type === 'duel_challenge') {
    const ok = await store.runAction(props.item.id, () => acceptChallenge(refId))
    if (ok) {
      emit('navigate')
      router.push({ name: routeNames.duels })
    }
  }
}

async function onDecline () {
  const refId = props.item.refId
  if (!refId) return
  if (isTeamRequest.value) {
    await store.runAction(props.item.id, () => findRequests.decline(refId))
  } else if (props.item.type === 'friend_request') {
    await store.runAction(props.item.id, () => friendsStore.declineRequest(refId))
  } else if (props.item.type === 'duel_challenge') {
    await store.runAction(props.item.id, () => declineChallenge(refId))
  }
}
</script>

<style scoped>
/*
  Рядок на всю ширину панелі, між рядками — волосинка. Без «карток» із заокругленням:
  межа між сповіщеннями має читатися одразу, а не вгадуватися за відступами.
  `--notif-*` приходять з попперу (NotificationCenter.vue).
*/
.notif-item {
  --tone: var(--ds-primary-rgb);

  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
  padding: 11px var(--notif-inset, 16px);
  transition: background-color var(--ds-duration-fast) ease;
}

.notif-item + .notif-item {
  border-top: 1px solid var(--notif-hairline, rgba(255, 255, 255, 0.07));
}

.notif-item.tone-success {
  --tone: 34, 197, 94;
}

.notif-item.tone-gold {
  --tone: var(--ds-gold-rgb);
}

.notif-item.tone-muted {
  --tone: 148, 163, 184;
}

/* Непрочитане — ледь тепліша підкладка; гасне разом із крапкою після відкриття панелі */
.notif-item.is-unread {
  background: rgba(var(--ds-primary-rgb), 0.035);
}

/* Відкритий запит — помітніша ціанова підкладка; кнопки самі кажуть, що тут треба відповісти */
.notif-item.is-actionable {
  background: rgba(var(--ds-primary-rgb), 0.06);
}

@media (hover: hover) and (pointer: fine) {
  .notif-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .notif-item.is-actionable:hover {
    background: rgba(var(--ds-primary-rgb), 0.09);
  }
}

.notif-item__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.notif-item__avatar {
  --el-avatar-bg-color: rgba(var(--tone), 0.22);

  width: 32px;
  height: 32px;
  font-size: 12px;
}

/* Бейдж типу події: сидить на куті аватара, обведений кольором панелі, щоб не зливатись */
.notif-item__type {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: rgb(var(--tone));
  color: #07080f;
  box-shadow: 0 0 0 2px rgb(var(--notif-surface, 11, 13, 25));
}

.notif-item.tone-muted .notif-item__type {
  background: rgb(44, 50, 70);
  color: rgba(255, 255, 255, 0.65);
}

.notif-item__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}

.notif-item__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
  text-wrap: pretty;
  transition: color 500ms ease;
}

.notif-item.is-unread .notif-item__text,
.notif-item.is-actionable .notif-item__text {
  color: var(--ds-text);
}

.notif-item__actor {
  margin-right: 4px;
  font-weight: 600;
  color: var(--ds-text-strong);
  transition: color var(--ds-duration-fast) ease;
}

/* Назва команди йде після тексту, а не перед ним */
.notif-item__team {
  margin-right: 0;
  margin-left: 4px;
}

@media (hover: hover) and (pointer: fine) {
  .notif-item__actor:hover {
    color: var(--ds-primary);
  }
}

.notif-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  line-height: 1.3;
}

/* Результат — просто слово потрібного кольору, без рамок */
.notif-item__status {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--ds-text-faint);
}

.notif-item__status.is-accepted {
  color: #4ade80;
}

.notif-item__status.is-timer {
  font-family: var(--ds-font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--ds-gold);
}

.notif-item__link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: var(--ds-primary);
}

.notif-item__link-arrow {
  transition: transform var(--ds-duration-fast) var(--ds-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .notif-item__link:hover .notif-item__link-arrow {
    transform: translateX(3px);
  }
}

.notif-item__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
}

.notif-item__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* Правий кут: час + крапка непрочитаного; вирівняно по першому рядку тексту */
.notif-item__aside {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding-top: 5px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.notif-item__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.7);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 500ms ease, transform 500ms var(--ds-ease-out);
}

.notif-item.is-unread .notif-item__dot {
  opacity: 1;
  transform: none;
}

/* Каскад появи при відкритті панелі: коротко, лише перші рядки */
@media (prefers-reduced-motion: no-preference) {
  .notif-item {
    animation: notif-item-in 200ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i, 0) * 30ms);
  }

  @keyframes notif-item-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
