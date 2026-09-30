<template>
  <li class="request-row" :class="`is-${direction}`">
    <RouterLink
      :to="{ name: routeNames.player, params: { id: other.id } }"
      class="request-row__identity no-underline"
    >
      <el-avatar :src="resolvePublicOrApiUrl(other.avatarUrl)" :size="36" class="request-row__avatar">
        {{ initial }}
      </el-avatar>
      <span class="flex min-w-0 flex-col gap-2">
        <span class="request-row__name">{{ name }}</span>
        <span class="request-row__meta">
          {{ direction === 'incoming' ? 'хоче додати вас у друзі' : 'ще не відповів' }} · {{ when }}
        </span>
      </span>
    </RouterLink>

    <div v-if="direction === 'incoming'" class="flex shrink-0 items-center gap-6">
      <el-button type="success" size="small" :loading="busy" :disabled="busy" @click="emit('accept')">
        <PhCheck v-if="!busy" :size="14" weight="bold" class="mr-4" />
        Прийняти
      </el-button>
      <el-button size="small" plain :disabled="busy" @click="emit('decline')">
        Відхилити
      </el-button>
    </div>
    <el-button v-else size="small" plain :loading="busy" :disabled="busy" @click="emit('cancel')">
      Скасувати
    </el-button>
  </li>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { PhCheck } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import type { TFriendRequest } from '@/api/types/api.types'

const props = defineProps<{
  request: TFriendRequest
  /** `incoming` — мене просять (прийняти / відхилити); `outgoing` — я попросив (скасувати). */
  direction: 'incoming' | 'outgoing'
  busy: boolean
}>()

const emit = defineEmits<{
  accept: []
  decline: []
  cancel: []
}>()

const other = computed(() => (props.direction === 'incoming' ? props.request.requester : props.request.addressee))
const name = computed(() => other.value.discordName || other.value.discordUsername || 'Гравець')
const initial = computed(() => name.value.charAt(0).toUpperCase())
const when = computed(() => {
  const d = dayjs(props.request.createdAt)
  return d.isValid() ? d.format('DD.MM HH:mm') : ''
})
</script>

<style scoped>
.request-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.request-row.is-incoming {
  border-color: rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.05);
}

.request-row__identity {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: inherit;
}

.request-row__avatar {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.08);
}

.request-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-row__meta {
  font-size: 12px;
  color: var(--ds-text-muted);
}
</style>
