<template>
  <li class="friend-row">
    <RouterLink
      :to="{ name: routeNames.player, params: { id: friend.player.id } }"
      class="friend-row__identity no-underline"
    >
      <el-avatar :src="resolvePublicOrApiUrl(friend.player.avatarUrl)" :size="40" class="friend-row__avatar">
        {{ initial }}
      </el-avatar>
      <span class="flex min-w-0 flex-col gap-2">
        <span class="friend-row__name">{{ name }}</span>
        <span class="friend-row__meta">
          1v1: {{ friend.player.duelRating }}
          <template v-if="mmrLabel"> · {{ mmrLabel }}</template>
          <template v-if="!friend.player.steamId"> · без Steam</template>
        </span>
      </span>
    </RouterLink>

    <div class="flex shrink-0 items-center gap-6">
      <el-tooltip
        :content="friend.player.steamId ? 'Викликати на дружню дуель (±10)' : 'У друга не прив’язаний Steam'"
        placement="top"
        effect="dark"
        :show-after="180"
      >
        <el-button
          type="primary"
          size="small"
          plain
          :loading="challenging"
          :disabled="challenging || !canChallenge || !friend.player.steamId"
          @click="emit('challenge')"
        >
          <PhSword v-if="!challenging" :size="14" weight="fill" class="mr-4" />
          Дуель
        </el-button>
      </el-tooltip>
      <el-tooltip content="Видалити з друзів" placement="top" effect="dark" :show-after="180">
        <el-button
          size="small"
          text
          class="btn-icon"
          aria-label="Видалити з друзів"
          :loading="busy"
          :disabled="busy"
          @click="emit('remove')"
        >
          <PhUserMinus v-if="!busy" :size="16" weight="bold" />
        </el-button>
      </el-tooltip>
    </div>
  </li>
</template>

<script setup lang="ts">
import { PhSword, PhUserMinus } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { formatPlayerRatingMmr, resolvePublicOrApiUrl } from '@/core/helpers'
import type { TFriend } from '@/api/types/api.types'

const props = defineProps<{
  friend: TFriend
  busy: boolean
  challenging: boolean
  canChallenge: boolean
}>()

const emit = defineEmits<{
  challenge: []
  remove: []
}>()

const name = computed(() => props.friend.player.discordName || props.friend.player.discordUsername || 'Гравець')
const initial = computed(() => name.value.charAt(0).toUpperCase())
const mmrLabel = computed(() => (props.friend.player.rating ? formatPlayerRatingMmr(props.friend.player.rating) : ''))
</script>

<style scoped>
.friend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

@media (hover: hover) and (pointer: fine) {
  .friend-row:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.3);
    background: rgba(var(--ds-primary-rgb), 0.05);
  }
}

.friend-row__identity {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.friend-row__avatar {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
}

.friend-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-row__meta {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  color: var(--ds-text-faint);
}
</style>
