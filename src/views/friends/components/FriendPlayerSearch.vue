<template>
  <section class="search-panel neon-card hud-corners rounded-2xl">
    <header class="flex flex-col gap-4">
      <h2 class="sys-label sys-label--muted">// Знайти гравця</h2>
      <p class="search-panel__text">Введіть нік у Discord — покажемо гравців, яких ще немає у ваших друзях.</p>
    </header>

    <el-input
      v-model="query"
      placeholder="Нік гравця"
      clearable
      :prefix-icon="PhMagnifyingGlass"
    />

    <template v-if="playersStore.loading && !playersStore.listLoaded">
      <span v-for="n in 3" :key="n" class="skeleton-bone block h-[52px] !rounded-xl" />
    </template>

    <p v-else-if="trimmed.length < MIN_QUERY" class="search-panel__empty">
      Почніть вводити нік (мінімум {{ MIN_QUERY }} символи)
    </p>

    <p v-else-if="!matches.length" class="search-panel__empty">Нікого не знайдено</p>

    <ul v-else class="search-panel__list">
      <li v-for="player in matches" :key="player.id" class="search-panel__row">
        <RouterLink
          :to="{ name: routeNames.player, params: { id: player.id } }"
          class="search-panel__identity no-underline"
        >
          <el-avatar :src="resolvePublicOrApiUrl(player.avatarUrl)" :size="36" class="shrink-0 bg-white/10">
            {{ (player.discordName || '?').charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="flex min-w-0 flex-col gap-2">
            <span class="search-panel__name">{{ player.discordName || '—' }}</span>
            <span v-if="player.discordUsername" class="search-panel__meta">@{{ player.discordUsername }}</span>
          </span>
        </RouterLink>
        <el-button
          type="primary"
          size="small"
          plain
          :loading="friendsStore.isBusy(player.id)"
          :disabled="friendsStore.isBusy(player.id)"
          @click="friendsStore.sendRequest(player.id)"
        >
          <PhUserPlus v-if="!friendsStore.isBusy(player.id)" :size="14" weight="bold" class="mr-4" />
          Додати
        </el-button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass, PhUserPlus } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'

const MIN_QUERY = 2
const MAX_RESULTS = 8

const playersStore = usePlayersStore()
const friendsStore = useFriendsStore()
const authStore = useAuthStore()

const query = ref('')
const trimmed = computed(() => query.value.trim().toLowerCase())

/** Список гравців уже кешується стором — фільтруємо локально, без окремого ендпоінта пошуку. */
watch(
  () => trimmed.value.length >= MIN_QUERY,
  (active) => {
    if (active) playersStore.getPlayers().catch(() => { /* порожній стан */ })
  },
  { immediate: true }
)

/** Гравці, яким ще можна надіслати запит: не я, не друзі, без відкритого запиту в будь-який бік. */
const matches = computed<TPlayer[]>(() => {
  const q = trimmed.value
  if (q.length < MIN_QUERY) return []
  const meId = authStore.user?.id
  return playersStore.players
    .filter((p) => p.id !== meId && friendsStore.relationWith(p.id).relation === 'none')
    .filter((p) =>
      (p.discordName ?? '').toLowerCase().includes(q) ||
      (p.discordUsername ?? '').toLowerCase().includes(q)
    )
    .slice(0, MAX_RESULTS)
})
</script>

<style scoped>
.search-panel {
  --hud-corner-inset: 8px;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.search-panel__text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

.search-panel__empty {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.search-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.search-panel__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.search-panel__identity {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.search-panel__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-panel__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}
</style>
