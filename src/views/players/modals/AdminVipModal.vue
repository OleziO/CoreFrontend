<template>
  <el-dialog
    v-model="modelValue"
    width="460"
    align-center
    append-to-body
    class="rounded-[12px]"
    title="VIP гравця"
  >
    <div v-if="player" class="flex flex-col gap-20">
      <!-- Поточний стан: хто + до коли -->
      <div class="admin-vip__status">
        <span class="flex min-w-0 flex-col gap-4">
          <span class="truncate font-display text-[15px] uppercase tracking-wide text-white">
            {{ player.discordName || player.discordUsername || '—' }}
          </span>
          <span class="text-xs text-white/50">{{ statusLabel }}</span>
        </span>
        <VipBadge v-if="isVip" size="sm" static />
        <span v-else class="sys-label sys-label--muted !text-[9px]">Без VIP</span>
      </div>

      <!-- Колір рамки: та сама палітра, що у гравця; лише поки VIP активний -->
      <div v-if="isVip" class="flex flex-col gap-10">
        <span class="sys-label sys-label--muted !text-[9px]">Колір рамки</span>
        <div class="admin-vip__swatches" role="radiogroup" aria-label="Колір рамки">
          <button
            v-for="color in VIP_FRAME_PALETTE"
            :key="color.hex"
            type="button"
            role="radio"
            class="admin-vip__swatch"
            :class="{ 'is-active': frameColor === color.hex }"
            :style="{ '--swatch': color.hex }"
            :aria-checked="frameColor === color.hex"
            :aria-label="color.label"
            :title="color.label"
            :disabled="busy"
            @click="pickColor(color.hex)"
          />
          <button
            type="button"
            role="radio"
            class="admin-vip__swatch admin-vip__swatch--reset"
            :class="{ 'is-active': !frameColor }"
            :aria-checked="!frameColor"
            aria-label="Стандартна рамка"
            title="Стандартна рамка"
            :disabled="busy"
            @click="pickColor(null)"
          >
            <PhProhibit :size="14" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Видача: місяці додаються до поточного періоду (або від сьогодні) -->
      <div class="flex flex-col gap-10">
        <span class="sys-label sys-label--muted !text-[9px]">
          {{ isVip ? 'Продовжити на' : 'Видати на' }}
        </span>
        <div class="grid grid-cols-3 gap-8">
          <el-button
            v-for="option in VIP_ADMIN_GRANT_OPTIONS"
            :key="option.months"
            plain
            class="!m-0"
            :disabled="isLifetime || busy"
            @click="grant(player, option.months)"
          >
            + {{ option.label }}
          </el-button>
          <el-button
            plain
            class="vip-lifetime-btn !m-0"
            :disabled="isLifetime || busy"
            @click="grant(player, 'lifetime')"
          >
            <PhInfinity :size="14" weight="bold" class="mr-6 shrink-0" /> Назавжди
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-10">
        <el-button
          v-if="player && isVip"
          type="danger"
          plain
          :disabled="busy"
          @click="revoke(player)"
        >
          <PhX :size="14" weight="bold" class="mr-6 shrink-0" /> Зняти VIP
        </el-button>
        <span v-else />

        <el-button :loading="busy" @click="modelValue = false">
          Закрити
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhInfinity, PhProhibit, PhX } from '@phosphor-icons/vue'
import { VIP_ADMIN_GRANT_OPTIONS, VIP_FRAME_PALETTE, isVipLifetime } from '@/core/vip.constants'
import { useVipStore } from '@/store/modules/vip'
import { isPlayerVip } from '@/core/helpers'
import { useAdminVipActions } from '@/composables/use-admin-vip-actions'
import VipBadge from '@/components/VipBadge.vue'

const props = defineProps<{
  playerId: string
}>()

const modelValue = defineModel<boolean>({ default: false })

const playersStore = usePlayersStore()
const vipStore = useVipStore()
const { isBusy, grant, revoke } = useAdminVipActions()

/** Зі стору, а не знімок із пропсів: після видачі / зняття стан оновлюється тут же. */
const player = computed(() => playersStore.players.find(p => p.id === props.playerId) ?? null)

const isVip = computed(() => isPlayerVip(player.value))
const isLifetime = computed(() => isVip.value && isVipLifetime(player.value?.vipUntil))
const busy = computed(() => isBusy(props.playerId))

const frameColor = computed(() => player.value?.vipFrameColor?.toUpperCase() ?? null)

function pickColor (color: string | null) {
  if (color === frameColor.value) return
  vipStore.setFrameColorByAdmin(props.playerId, color)
}

const dateFormat = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const statusLabel = computed(() => {
  if (!isVip.value) return 'VIP не активний'
  if (isLifetime.value) return 'Безстроковий VIP'
  const until = player.value?.vipUntil
  return until ? `VIP до ${dateFormat.format(new Date(until))}` : 'VIP активний'
})
</script>

<style scoped lang="scss">
.admin-vip__status {
  @apply flex items-center justify-between gap-12 rounded-lg px-14 py-12;
  border: 1px solid rgba(255, 206, 84, 0.25);
  background: linear-gradient(120deg, rgba(255, 206, 84, 0.06), rgba(255, 94, 170, 0.05));
}

.admin-vip__swatches {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.admin-vip__swatch {
  flex: 0 1 30px;
  min-width: 22px;
  aspect-ratio: 1;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  background: var(--swatch);
  box-shadow: 0 0 10px color-mix(in srgb, var(--swatch) 40%, transparent);
  cursor: pointer;
  transition: transform 160ms var(--ds-ease-out), border-color 160ms ease;

  &:hover:not(:disabled) {
    transform: scale(1.08);
  }

  &.is-active {
    border-color: #fff;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.6), 0 0 16px var(--swatch);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 206, 84, 0.8);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }

  &--reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.55);
    box-shadow: none;
  }
}

.vip-lifetime-btn {
  --el-button-text-color: rgb(255, 222, 140);
  --el-button-border-color: rgba(255, 206, 84, 0.45);
  --el-button-hover-text-color: rgb(255, 230, 170);
  --el-button-hover-border-color: rgba(255, 206, 84, 0.8);
  --el-button-hover-bg-color: rgba(255, 206, 84, 0.08);
}
</style>
