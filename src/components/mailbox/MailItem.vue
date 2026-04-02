<template>
  <div
    class="
      flex flex-col gap-8
      p-16
      rounded-2xl
      border border-white/10
      bg-white/5
      hover:bg-white/10
      transition-all duration-200
      cursor-pointer
    "
    :class="{ 'opacity-60': mailItem.is_readed }"
    @click="$emit('click', mailItem)"
  >
    <!-- Заголовок письма -->
    <div class="flex items-start justify-between gap-12">
      <div class="flex flex-col gap-4 flex-1">
        <div class="flex items-center gap-8">
          <span
            v-if="!mailItem.is_readed"
            class="w-8 h-8 rounded-full bg-red-600"
          />
          <h3 class="text-base font-semibold text-white">
            {{ mailItem.mail.type }}
          </h3>
        </div>
        <span class="text-xs text-white/60">
          {{ formatMailDate(mailItem.mail.created_on) }}
        </span>
      </div>
      <el-tag
        v-if="mailItem.mail.target_group"
        size="small"
        class="bg-white/10 border-white/10 text-white/80"
      >
        {{ mailItem.mail.target_group }}
      </el-tag>
    </div>

    <!-- Текст письма -->
    <p class="text-sm text-white/80 leading-relaxed">
      {{ mailItem.mail.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/core/helpers'

defineProps<{
  mailItem: TMailBoxItem
}>()

defineEmits<{
  click: [mailItem: TMailBoxItem]
}>()

// Форматирование даты из строки
function formatMailDate (dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return formatDate(date)
}
</script>
