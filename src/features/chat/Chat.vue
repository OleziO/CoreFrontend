<template>
  <Teleport to="body">
    <ChatLauncher />
    <ChatPanel />
  </Teleport>
</template>

<script setup lang="ts">
import { useChatStore } from '@/features/chat/chat.store'
import ChatLauncher from '@/features/chat/components/ChatLauncher.vue'
import ChatPanel from '@/features/chat/components/ChatPanel.vue'

/** Чат сайту: кнопка в правому нижньому куті + неблокуюче вікно. Монтується один раз у лейауті. */
const chatStore = useChatStore()

onMounted(() => chatStore.start())
</script>
