<template>
  <div class="grid w-full grid-cols-1 gap-16 md:grid-cols-2 md:items-stretch">
    <!-- Локація -->
    <div
      class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
        px-16 py-16 text-center 2md:px-20 2md:py-18"
      :class="accentClass"
    >
      <h2 class="section-title shrink-0">
        Локація
      </h2>
      <div class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8">
        <div
          v-if="countryCode"
          class="location-tile inline-flex w-full min-w-[240px] max-w-[340px] items-center gap-14 rounded-xl
            px-18 py-12 text-left"
        >
          <span class="location-tile__flag shrink-0">
            <img
              v-if="flagUrl"
              class="block h-[30px] w-[40px] rounded-[4px] object-cover"
              :src="flagUrl"
              :srcset="`${getCountryFlagUrl(countryCode, 80)} 2x`"
              alt=""
              width="40"
              height="30"
            >
            <PhMapPin
              v-else
              :size="24"
              weight="duotone"
              class="text-primary"
            />
          </span>
          <span class="flex min-w-0 flex-1 flex-col gap-4">
            <span class="truncate font-display text-[13px] uppercase tracking-wider leading-tight text-white">
              {{ countryName }}
            </span>
            <span
              v-if="city"
              class="flex min-w-0 items-center gap-4 text-xs leading-tight text-gray-400"
            >
              <PhMapPin :size="12" weight="fill" class="shrink-0 text-primary/80" />
              <span class="truncate">{{ city }}</span>
            </span>
          </span>
          <span class="location-tile__code shrink-0">{{ countryCode }}</span>
        </div>
        <p
          v-else
          class="mx-auto max-w-[90%] text-center text-sm text-gray-500 px-12 py-12 rounded-xl border
            border-dashed border-primary/20 bg-black/20"
        >
          {{ isProfilePage ? 'Локацію не вказано. Її можна додати при редагуванні профілю.' : 'Локацію не вказано' }}
        </p>

        <!-- Міста, куди гравець готовий приїхати на LAN -->
        <div
          v-if="lanCities.length"
          class="flex w-full flex-col items-center gap-6 pt-4"
        >
          <span class="text-[11px] uppercase tracking-wider text-gray-500">
            Готовий приїхати на LAN
          </span>
          <div class="flex w-full flex-wrap justify-center gap-6">
            <span
              v-for="lanCity in lanCities"
              :key="lanCity"
              class="pref-chip inline-flex items-center gap-6 rounded-md px-10 py-6 text-xs text-white"
            >
              <PhGameController :size="14" weight="duotone" class="pref-chip__icon shrink-0 text-primary" />
              {{ lanCity }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Хочу грати -->
    <div
      class="neon-card hud-corners flex min-h-0 min-w-0 flex-col items-center gap-14 rounded-2xl md:h-full
        px-16 py-16 text-center 2md:px-20 2md:py-18"
      :class="accentClass"
    >
      <h2 class="section-title shrink-0">
        Хочу грати
      </h2>
      <div class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8">
        <div
          v-if="formatRows.length"
          class="flex w-full flex-wrap justify-center gap-8"
        >
          <div
            v-for="row in formatRows"
            :key="row.value"
            class="pref-chip inline-flex items-center gap-8 rounded-lg px-12 py-8 text-left"
          >
            <component
              :is="row.icon"
              :size="22"
              weight="duotone"
              class="pref-chip__icon shrink-0 text-primary"
            />
            <span class="font-display text-[12px] uppercase tracking-wide leading-tight text-white">
              {{ row.label }}
            </span>
          </div>
        </div>
        <p
          v-else
          class="mx-auto max-w-[90%] text-center text-sm text-gray-500 px-12 py-12 rounded-xl border
            border-dashed border-primary/20 bg-black/20"
        >
          {{ isProfilePage ? 'Формати не вказані. Їх можна додати при редагуванні профілю.' : 'Формати не вказані' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhGameController, PhMapPin } from '@phosphor-icons/vue'
import { wantToPlayOptions } from '@/components/player-tags/player.enums'
import { getPlayerLanCities, getPlayerWantToPlay } from '@/core/helpers'
import { getCountryFlagUrl, useLocations } from '@/composables/use-locations'

/**
 * Дві картки під рядком «Команда / Позиції»: локація (країна + місто) та формати
 * «Хочу грати». Спільні для /me та /players/:id — різниться лише підказка для порожнього стану.
 */
const props = defineProps<{
  player: TPlayer
  isProfilePage?: boolean
  /** `role-frame--gold` / `role-frame--violet` з `getPlayerRoleAccentClass` — на кожній картці, як у Player.vue. */
  accentClass?: string
}>()

const { countryLabel } = useLocations()

const countryCode = computed(() => String(props.player.countryCode ?? '').trim().toUpperCase())
const city = computed(() => String(props.player.city ?? '').trim())
const countryName = computed(() => countryLabel(countryCode.value))
const flagUrl = computed(() => getCountryFlagUrl(countryCode.value, 40))
const lanCities = computed(() => getPlayerLanCities(props.player))

const formatRows = computed(() => {
  const selected = new Set(getPlayerWantToPlay(props.player))
  return wantToPlayOptions.filter((o) => selected.has(o.value))
})
</script>

<style scoped lang="scss">
// Той самий вигляд, що й position-chip у Player.vue: cyan-tinted well + світна іконка.
.pref-chip {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(var(--ds-primary-rgb), 0.06);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition:
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.pref-chip__icon {
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));
}

// Location tile: wider glass card with the flag in a lit well and the ISO code as a quiet tag.
.location-tile {
  border: 1px solid rgba(var(--ds-primary-rgb), 0.28);
  background:
    linear-gradient(
      135deg,
      rgba(var(--ds-primary-rgb), 0.12) 0%,
      rgba(var(--ds-primary-rgb), 0.03) 60%,
      transparent 100%
    ),
    rgba(7, 8, 15, 0.45);
  box-shadow:
    inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.16),
    0 8px 24px rgba(0, 0, 0, 0.35);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.location-tile__flag {
  @apply inline-flex items-center justify-center rounded-lg p-4;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);

  img {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
    filter: drop-shadow(0 0 8px rgba(var(--ds-primary-rgb), 0.3));
  }
}

.location-tile__code {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--ds-primary);
  text-shadow: var(--ds-neon-text-subtle);
  opacity: 0.85;
}

@media (hover: hover) {
  .location-tile:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow:
      inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.22),
      0 0 18px rgba(var(--ds-primary-rgb), 0.16);
    transform: translateY(-1px);
  }
}

@media (hover: hover) {
  .pref-chip:hover {
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    background: rgba(var(--ds-primary-rgb), 0.1);
    transform: translateY(-1px);
  }
}
</style>
