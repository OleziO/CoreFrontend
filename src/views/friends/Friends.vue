<template>
  <div class="friends relative flex w-full flex-col text-white">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-primary-rgb),0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <header class="friends-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Спільнота</span>
          <h1 class="friends-head__title">Друзі</h1>
          <p class="friends-head__subtitle">
            Додавайте гравців у друзі та викликайте їх на дружні дуелі Solo Mid:
            <span class="text-success">+{{ DUEL_FRIEND_RATING_DELTA }}</span> /
            <span class="text-error">−{{ DUEL_FRIEND_RATING_DELTA }}</span>,
            до {{ DUEL_CHALLENGE_DAILY_LIMIT }} прийнятих дуелей на день.
          </p>
        </div>
        <RouterLink :to="{ name: routeNames.duels }" class="no-underline">
          <el-button>
            <PhSword :size="16" weight="bold" />
            <span class="ml-6">До дуелей</span>
          </el-button>
        </RouterLink>
      </header>

      <p v-if="friendsStore.error && !friendsStore.loaded" class="friends-panel__empty text-error">
        Не вдалося завантажити друзів. Спробуйте оновити сторінку.
      </p>

      <div class="grid gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <!-- Ліва колонка: вхідні запити → друзі -->
        <div class="flex min-w-0 flex-col gap-16">
          <section v-if="friendsStore.incoming.length" class="friends-panel neon-card hud-corners rounded-2xl">
            <header class="flex items-center justify-between gap-10">
              <h2 class="sys-label sys-label--gold">// Запити до вас</h2>
              <span class="friends-panel__meta">{{ friendsStore.incoming.length }}</span>
            </header>
            <ul class="friends-panel__list">
              <FriendRequestRow
                v-for="request in friendsStore.incoming"
                :key="request.id"
                :request="request"
                direction="incoming"
                :busy="friendsStore.isBusy(request.id)"
                @accept="friendsStore.acceptRequest(request.id)"
                @decline="friendsStore.declineRequest(request.id)"
              />
            </ul>
          </section>

          <section class="friends-panel neon-card hud-corners rounded-2xl">
            <header class="flex items-center justify-between gap-10">
              <h2 class="sys-label sys-label--muted">// Мої друзі</h2>
              <span class="friends-panel__meta">{{ pluralizeFriends(friendsStore.friends.length) }}</span>
            </header>
            <template v-if="friendsStore.loading && !friendsStore.loaded">
              <span v-for="n in 4" :key="n" class="skeleton-bone block h-[60px] !rounded-xl" />
            </template>
            <p v-else-if="!friendsStore.friends.length" class="friends-panel__empty">
              Друзів ще немає — знайдіть гравця праворуч і надішліть запит.
            </p>
            <ul v-else class="friends-panel__list">
              <FriendRow
                v-for="friend in friendsStore.friends"
                :key="friend.friendshipId"
                :friend="friend"
                :busy="friendsStore.isBusy(friend.player.id)"
                :challenging="isChallengeBusy(friend.player.id)"
                :can-challenge="canChallenge"
                @challenge="onChallenge(friend.player.id)"
                @remove="confirmRemove(friend)"
              />
            </ul>
          </section>
        </div>

        <!-- Права колонка: пошук → надіслані запити -->
        <div class="flex min-w-0 flex-col gap-16">
          <FriendPlayerSearch />

          <section v-if="friendsStore.outgoing.length" class="friends-panel neon-card hud-corners rounded-2xl">
            <header class="flex items-center justify-between gap-10">
              <h2 class="sys-label sys-label--muted">// Надіслані запити</h2>
              <span class="friends-panel__meta">{{ friendsStore.outgoing.length }}</span>
            </header>
            <ul class="friends-panel__list">
              <FriendRequestRow
                v-for="request in friendsStore.outgoing"
                :key="request.id"
                :request="request"
                direction="outgoing"
                :busy="friendsStore.isBusy(request.id)"
                @cancel="friendsStore.cancelRequest(request.id)"
              />
            </ul>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSword } from '@phosphor-icons/vue'
import { ElMessageBox } from 'element-plus'
import { routeNames } from '@/router/route-names'
import { pluralizeUk } from '@/views/players/player-achievements.utils'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { DUEL_CHALLENGE_DAILY_LIMIT, DUEL_FRIEND_RATING_DELTA } from '@/views/duels/duels.utils'
import { useSeo } from '@/composables/use-seo'
import FriendRow from '@/views/friends/components/FriendRow.vue'
import FriendRequestRow from '@/views/friends/components/FriendRequestRow.vue'
import FriendPlayerSearch from '@/views/friends/components/FriendPlayerSearch.vue'
import type { TFriend } from '@/api/types/api.types'

useSeo(() => ({ title: 'Друзі' }))

const router = useRouter()
const friendsStore = useFriendsStore()
const { isBusy: isChallengeBusy, challenge } = useDuelChallenges()

/** Викликати можна завжди — бекенд сам пояснить, чому ні (активна дуель, ліміт, Steam). */
const canChallenge = true

const pluralizeFriends = (n: number) => pluralizeUk(n, 'друг', 'друзі', 'друзів')

onMounted(() => {
  friendsStore.fetchOverview({ force: true }).catch(() => { /* стан помилки показує сторінка */ })
})

async function onChallenge (playerId: string) {
  if (await challenge(playerId)) router.push({ name: routeNames.duels })
}

async function confirmRemove (friend: TFriend) {
  const name = friend.player.discordName || friend.player.discordUsername || 'гравця'
  try {
    await ElMessageBox.confirm(
      `Видалити ${name} з друзів? Дружні дуелі з цим гравцем стануть недоступні.`,
      'Видалити з друзів',
      { confirmButtonText: 'Видалити', cancelButtonText: 'Скасувати', type: 'warning' }
    )
  } catch {
    return
  }
  await friendsStore.removeFriend(friend.player.id)
}
</script>

<style scoped>
.friends-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
}

.friends-head__title {
  font-family: var(--ds-font-display);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 768px) {
  .friends-head__title {
    font-size: 34px;
  }
}

.friends-head__subtitle {
  max-width: 640px;
  font-size: 14px;
  color: var(--ds-text-muted);
}

.friends-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  overflow: hidden;
}

.friends-panel__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-faint);
}

.friends-panel__empty {
  padding: 16px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.friends-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
