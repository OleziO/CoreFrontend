<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="challenge-dialog"
    width="480"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="sys-label">// Дружня дуель</span>
        <h2 class="challenge-dialog__title">Кого викликати?</h2>
      </div>
    </template>

    <div class="flex flex-col gap-12">
      <p class="challenge-dialog__text">
        Друг отримає сповіщення і матиме 5 хвилин, щоб прийняти. На кону
        <span class="text-success">+{{ DUEL_FRIEND_RATING_DELTA }}</span> /
        <span class="text-error">−{{ DUEL_FRIEND_RATING_DELTA }}</span>.
      </p>

      <el-input
        v-model="search"
        placeholder="Пошук серед друзів"
        clearable
        :prefix-icon="PhMagnifyingGlass"
      />

      <div v-if="friendsStore.loading && !friendsStore.loaded" class="flex flex-col gap-8">
        <span v-for="n in 3" :key="n" class="skeleton-bone block h-[52px] !rounded-xl" />
      </div>

      <p v-else-if="!friendsStore.friends.length" class="challenge-dialog__empty">
        У вас ще немає друзів.
        <RouterLink :to="{ name: routeNames.friends }" class="text-primary" @click="close">
          Знайти гравців
        </RouterLink>
      </p>

      <p v-else-if="!rows.length" class="challenge-dialog__empty">Нікого не знайдено</p>

      <ul v-else class="challenge-dialog__list">
        <li v-for="row in rows" :key="row.player.id" class="challenge-dialog__row">
          <el-avatar :src="resolvePublicOrApiUrl(row.player.avatarUrl)" :size="36" class="shrink-0">
            {{ (row.player.discordName || '?').charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <span class="challenge-dialog__name">
              {{ row.player.discordName || row.player.discordUsername || 'Гравець' }}
            </span>
            <span class="challenge-dialog__meta">
              1v1: {{ row.player.duelRating }}
              <template v-if="!row.player.steamId"> · Steam не прив’язано</template>
            </span>
          </div>
          <el-button
            type="primary"
            size="small"
            :loading="isBusy(row.player.id)"
            :disabled="isBusy(row.player.id) || !row.player.steamId"
            @click="send(row.player.id)"
          >
            <PhSword v-if="!isBusy(row.player.id)" :size="14" weight="fill" class="mr-4" />
            Викликати
          </el-button>
        </li>
      </ul>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhMagnifyingGlass, PhSword } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { useDuelChallenges } from '@/views/duels/composables/use-duel-challenges'
import { DUEL_FRIEND_RATING_DELTA } from '@/views/duels/duels.utils'

const modelValue = defineModel<boolean>({ default: false })

const friendsStore = useFriendsStore()
const { isBusy, challenge } = useDuelChallenges()

const search = ref('')

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return friendsStore.friends
  return friendsStore.friends.filter((f) =>
    (f.player.discordName ?? '').toLowerCase().includes(q) ||
    (f.player.discordUsername ?? '').toLowerCase().includes(q)
  )
})

// Модалка монтується вже відкритою (async-компонент з реєстру), тож `@open` el-dialog
// не надійний — стежимо за моделлю самі.
watch(modelValue, (visible) => {
  if (!visible) return
  search.value = ''
  friendsStore.fetchOverview().catch(() => { /* модалка покаже порожній стан */ })
}, { immediate: true })

function close () {
  modelValue.value = false
}

async function send (playerId: string) {
  if (await challenge(playerId)) close()
}
</script>

<!-- Not scoped: el-dialog is teleported to <body>. -->
<style lang="scss">
.el-dialog.challenge-dialog {
  margin: 0 auto;
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);

  .challenge-dialog__title {
    font-family: var(--ds-font-display);
    font-size: 20px;
    line-height: 1.2;
    color: var(--ds-text-strong);
  }

  .challenge-dialog__text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--ds-text-muted);
  }

  .challenge-dialog__empty {
    padding: 16px 0;
    text-align: center;
    font-size: 13px;
    color: var(--ds-text-faint);
  }

  .challenge-dialog__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 50vh;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .challenge-dialog__row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
  }

  .challenge-dialog__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--ds-text-strong);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .challenge-dialog__meta {
    font-family: var(--ds-font-mono);
    font-size: 11px;
    color: var(--ds-text-faint);
  }
}
</style>
