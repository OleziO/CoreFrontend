<template>
  <span class="chat-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <el-avatar
      :src="resolvePublicOrApiUrl(player?.avatarUrl)"
      :size="size"
      class="chat-avatar__img"
      :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(9, Math.round(size * 0.42))}px` }"
    >
      {{ playerInitial(player) }}
    </el-avatar>
    <span v-if="online" class="chat-avatar__online" :class="{ 'is-small': size < 24 }" aria-label="онлайн" />
  </span>
</template>

<script setup lang="ts">
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { playerInitial } from '@/features/chat/chat.utils'

/** Аватар у чаті: глобальний reset `.el-avatar` фіксує 56px, тож розмір задаємо явно. */
defineProps<{
  player: { avatarUrl?: string | null; discordName?: string | null; discordUsername?: string | null } | null | undefined
  size: number
  online?: boolean
}>()
</script>

<style scoped>
.chat-avatar {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.chat-avatar__img {
  --tw-ring-shadow: 0 0 #0000;
  box-shadow: none;
  background: rgba(var(--ds-primary-rgb), 0.12);
  color: var(--ds-text-strong);
  font-weight: 700;
}

.chat-avatar__online {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: var(--ds-success);
  box-shadow: 0 0 0 2px var(--ds-surface);
}

.chat-avatar__online.is-small {
  width: 8px;
  height: 8px;
}
</style>
