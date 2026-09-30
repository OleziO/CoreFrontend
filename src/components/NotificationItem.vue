<template>
  <li
    class="notif-item"
    :class="[`tone-${tone}`, { 'is-unread': !item.readAt, 'is-actionable': isPending }]"
    :style="{ '--i': Math.min(index, 10) }"
  >
    <!-- Непрочитане: тонка світна риска зліва; гасне, щойно панель позначила все прочитаним -->
    <span class="notif-item__unread" aria-hidden="true" />

    <!-- Хто: аватар актора з маленьким бейджем типу події в куті -->
    <span class="notif-item__avatar-wrap" aria-hidden="true">
      <el-avatar :src="resolvePublicOrApiUrl(item.actor?.avatarUrl)" :size="36" class="notif-item__avatar">
        {{ actorInitial }}
      </el-avatar>
      <span class="notif-item__type">
        <component :is="icon" :size="11" weight="bold" />
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
      </p>

      <div class="notif-item__meta">
        <time :datetime="item.createdAt" :title="whenAbsolute">{{ whenRelative }}</time>
        <span v-if="statusLabel" class="notif-item__pill" :class="`is-${item.status}`">{{ statusLabel }}</span>
        <span v-else-if="isPending && expiresIn" class="notif-item__pill is-timer">
          <PhTimer :size="10" weight="bold" aria-hidden="true" />
          {{ expiresIn }}
        </span>
      </div>

      <!-- Дії: лише поки запит / виклик відкритий -->
      <div v-if="isPending && item.refId" class="notif-item__actions">
        <el-button
          type="success"
          size="small"
          :loading="busy"
          :disabled="busy"
          @click="onAccept"
        >
          <PhCheck v-if="!busy" :size="14" weight="bold" class="mr-4" />
          Прийняти
        </el-button>
        <el-button size="small" plain :disabled="busy" @click="onDecline">
          Відхилити
        </el-button>
      </div>

      <RouterLink
        v-else-if="item.type === 'duel_challenge_accepted'"
        :to="{ name: routeNames.duels }"
        class="notif-item__link no-underline"
        @click="emit('navigate')"
      >
        Перейти до дуелі
        <PhArrowRight :size="12" weight="bold" class="notif-item__link-arrow" />
      </RouterLink>
    </div>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhArrowRight, PhCheck, PhSword, PhUserPlus, PhUsersThree, PhXCircle, PhTimer } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { formatDuelCountdown, secondsUntil } from '@/views/duels/duels.utils'
import type { TNotification, TNotificationStatus, TNotificationType } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  item: TNotification
  /** Порядок у списку — для каскаду появи. */
  index?: number
}>(), {
  index: 0
})

const emit = defineEmits<{
  /** Користувач перейшов за посиланням — панель закривається. */
  navigate: []
}>()

const router = useRouter()
const store = useNotificationsStore()
const friendsStore = useFriendsStore()
const { accept: acceptChallenge, decline: declineChallenge } = useDuelChallenges()

const now = useNow({ interval: 1000 })

const actorName = computed(() => props.item.actor?.discordName || props.item.actor?.discordUsername || 'Гравець')
const actorInitial = computed(() => actorName.value.charAt(0).toUpperCase())
const isPending = computed(() => props.item.status === 'pending')
const busy = computed(() => store.isBusy(props.item.id))

const texts: Record<TNotificationType, string> = {
  friend_request: 'хоче додати вас у друзі',
  friend_request_accepted: 'прийняв ваш запит у друзі',
  duel_challenge: 'викликає вас на дружню дуель (±10)',
  duel_challenge_accepted: 'прийняв виклик — дуель уже створюється',
  duel_challenge_declined: 'відхилив ваш виклик на дуель',
  duel_challenge_expired: 'не відповів на виклик — він прострочений'
}
const text = computed(() => texts[props.item.type])

const icons = {
  friend_request: PhUserPlus,
  friend_request_accepted: PhUsersThree,
  duel_challenge: PhSword,
  duel_challenge_accepted: PhSword,
  duel_challenge_declined: PhXCircle,
  duel_challenge_expired: PhTimer
} satisfies Record<TNotificationType, unknown>
const icon = computed(() => icons[props.item.type])

const tone = computed(() => {
  switch (props.item.type) {
    case 'friend_request_accepted':
    case 'duel_challenge_accepted':
      return 'success'
    case 'duel_challenge':
      return 'gold'
    case 'duel_challenge_declined':
    case 'duel_challenge_expired':
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

/** «щойно», «5 хв тому», «вчора, 21:13», далі — дата: читається швидше за DD.MM HH:mm. */
const whenRelative = computed(() => {
  const d = dayjs(props.item.createdAt)
  if (!d.isValid()) return ''
  const current = dayjs(now.value)
  const minutes = current.diff(d, 'minute')
  if (minutes < 1) return 'щойно'
  if (minutes < 60) return `${minutes} хв тому`
  if (current.isSame(d, 'day')) return `${current.diff(d, 'hour')} год тому`
  if (current.subtract(1, 'day').isSame(d, 'day')) return `вчора, ${d.format('HH:mm')}`
  return d.format('DD.MM, HH:mm')
})

const expiresIn = computed(() => {
  if (props.item.type !== 'duel_challenge' || !props.item.expiresAt) return ''
  const left = secondsUntil(props.item.expiresAt, now.value)
  return left > 0 ? formatDuelCountdown(left) : ''
})

async function onAccept () {
  const refId = props.item.refId
  if (!refId) return
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
  if (props.item.type === 'friend_request') {
    await store.runAction(props.item.id, () => friendsStore.declineRequest(refId))
  } else if (props.item.type === 'duel_challenge') {
    await store.runAction(props.item.id, () => declineChallenge(refId))
  }
}
</script>

<style scoped>
.notif-item {
  --tone: var(--ds-primary-rgb);

  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  padding: 10px 12px 10px 14px;
  border-radius: 12px;
  transition: background-color var(--ds-duration-fast) ease, box-shadow var(--ds-duration-fast) ease;
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

/* Відкритий запит — картка з ціановою рамкою, її видно з першого погляду */
.notif-item.is-actionable {
  background: rgba(var(--ds-primary-rgb), 0.05);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.22);
}

@media (hover: hover) and (pointer: fine) {
  .notif-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .notif-item.is-actionable:hover {
    background: rgba(var(--ds-primary-rgb), 0.08);
  }
}

.notif-item__unread {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 4px;
  width: 2px;
  border-radius: 2px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.8);
  opacity: 0;
  transition: opacity 500ms ease;
}

.notif-item.is-unread .notif-item__unread {
  opacity: 1;
}

.notif-item__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.notif-item__avatar {
  --el-avatar-bg-color: rgba(var(--tone), 0.25);

  width: 36px;
  height: 36px;
  font-size: 13px;
  box-shadow: 0 0 0 1px rgba(var(--tone), 0.35);
}

/* Бейдж типу події: сидить на куті аватара, обведений кольором панелі, щоб не зливатись */
.notif-item__type {
  position: absolute;
  right: -5px;
  bottom: -5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: rgb(var(--tone));
  color: #07080f;
  box-shadow: 0 0 0 2px rgb(16, 19, 36), 0 0 10px rgba(var(--tone), 0.5);
}

.notif-item.tone-muted .notif-item__type {
  background: rgb(51, 58, 78);
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 2px rgb(16, 19, 36);
}

.notif-item__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.notif-item__text {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text-muted);
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

@media (hover: hover) and (pointer: fine) {
  .notif-item__actor:hover {
    color: var(--ds-primary);
  }
}

.notif-item__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--ds-text-faint);
}

.notif-item__pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.notif-item__pill.is-accepted {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}

.notif-item__pill.is-timer {
  border-color: rgba(var(--ds-gold-rgb), 0.4);
  background: rgba(var(--ds-gold-rgb), 0.1);
  color: var(--ds-gold);
}

.notif-item__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.notif-item__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.notif-item__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  margin-top: 4px;
  font-size: 12px;
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

/* Каскад появи при відкритті панелі: коротко, лише перші рядки */
@media (prefers-reduced-motion: no-preference) {
  .notif-item {
    animation: notif-item-in 220ms var(--ds-ease-out) both;
    animation-delay: calc(var(--i, 0) * 35ms);
  }

  @keyframes notif-item-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}
</style>
