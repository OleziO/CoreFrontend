<template>
  <li class="notif-item" :class="{ 'is-unread': !item.readAt, 'is-actionable': isPending }">
    <span class="notif-item__icon" :class="`is-${tone}`" aria-hidden="true">
      <component :is="icon" :size="16" weight="bold" />
    </span>

    <div class="flex min-w-0 flex-1 flex-col gap-4">
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
      <span class="notif-item__meta">
        {{ when }}
        <template v-if="statusLabel"> · {{ statusLabel }}</template>
        <template v-else-if="isPending && expiresIn"> · ще {{ expiresIn }}</template>
      </span>

      <!-- Дії: лише поки запит / виклик відкритий -->
      <div v-if="isPending && item.refId" class="mt-4 flex flex-wrap items-center gap-6">
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
        <PhArrowRight :size="12" weight="bold" />
      </RouterLink>
    </div>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhArrowRight, PhCheck, PhSword, PhUserPlus, PhUsersThree, PhXCircle, PhTimer } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { formatDuelCountdown, secondsUntil } from '@/views/duels/duels.utils'
import type { TNotification, TNotificationStatus, TNotificationType } from '@/api/types/api.types'

const props = defineProps<{
  item: TNotification
}>()

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

const when = computed(() => {
  const d = dayjs(props.item.createdAt)
  return d.isValid() ? d.format('DD.MM HH:mm') : ''
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
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 10px;
  border-radius: 12px;
  transition: background-color var(--ds-duration-fast) ease;
}

.notif-item.is-unread {
  background: rgba(var(--ds-primary-rgb), 0.06);
}

.notif-item.is-actionable {
  box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.25);
}

.notif-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--ds-text-muted);
}

.notif-item__icon.is-primary {
  color: var(--ds-primary);
  background: rgba(var(--ds-primary-rgb), 0.12);
}

.notif-item__icon.is-success {
  color: rgb(34, 197, 94);
  background: rgba(34, 197, 94, 0.12);
}

.notif-item__text {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ds-text);
}

.notif-item__actor {
  margin-right: 4px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.notif-item__meta {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--ds-text-faint);
}

.notif-item__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ds-primary);
}
</style>
