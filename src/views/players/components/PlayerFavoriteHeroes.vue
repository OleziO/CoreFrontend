<template>
  <div
    class="
      rounded-xl !px-[50px]
      border border-gray-800/90
      bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
      p-12 2md:p-14
      shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
      flex flex-col items-stretch gap-10
    "
  >
    <h3
      class="flex items-center justify-center gap-2 text-center text-[11px]
        font-medium uppercase tracking-[0.18em] text-gray-500"
    >
      Улюблені герої
      <el-tooltip
        placement="top"
        effect="dark"
        :show-after="180"
        content="Дані беруться з OpenDota і можуть бути неактуальними."
      >
        <PhQuestion
          class="cursor-help text-gray-500"
          weight="bold"
          :size="14"
        />
      </el-tooltip>
    </h3>

    <!-- Steam не прив'язано: легкий стан, не помилка -->
    <p
      v-if="!hasAccount"
      class="text-center text-sm text-gray-500 py-10"
    >
      Steam не прив'язано — улюблені герої недоступні.
    </p>

    <!-- Завантаження: скелет тієї ж сітки/розміру, без стрибків layout -->
    <div
      v-else-if="isPending"
      class="grid grid-cols-3 gap-[20px]"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="min-h-[88px] rounded-lg border border-white/10
          bg-white/[0.04] animate-pulse"
      />
    </div>

    <p
      v-else-if="isError"
      class="text-center text-sm text-red-300/80 py-10"
    >
      Не вдалося завантажити героїв з OpenDota. Спробуйте пізніше.
    </p>

    <p
      v-else-if="isEmpty"
      class="text-center text-sm text-gray-500 py-10"
    >
      Немає даних про героїв.
    </p>

    <div
      v-else
      class="grid grid-cols-3 gap-[20px]"
    >
      <div
        v-for="h in heroes"
        :key="h.heroId"
        class="
          flex min-h-[88px] flex-col items-center justify-center gap-4
          rounded-lg border border-white/10
          bg-gradient-to-b from-white/[0.08] to-white/[0.02]
          px-6 py-20
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
          transition duration-200
          hover:-translate-y-px hover:border-white/15
        "
      >
        <img
          v-if="h.iconUrl && !brokenHeroIcons.has(h.heroId)"
          :src="h.iconUrl"
          :alt="h.name"
          width="32"
          height="32"
          loading="lazy"
          class="size-32 rounded-md object-contain"
          @error="onHeroIconError(h.heroId)"
        >
        <div
          v-else
          class="size-32 rounded-md bg-white/10 flex items-center justify-center
            text-sm font-semibold text-gray-300"
          :aria-label="h.name"
        >
          {{ h.name.charAt(0) }}
        </div>

        <span
          class="max-w-full truncate text-center text-[11px] font-medium text-white/95 mt-2"
          :title="h.name"
        >
          {{ h.name }}
        </span>

        <span class="text-[10px] tabular-nums text-gray-500">
          {{ h.games }} ігор
          <template v-if="h.winrate !== null">
            ·
            <span
              :class="h.winrate >= 50 ? 'text-green-300/90' : 'text-red-300/90'"
            >
              {{ h.winrate }}%
            </span>
          </template>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhQuestion } from '@phosphor-icons/vue'

interface IHero {
  heroId: string
  name: string
  iconUrl?: string | null
  games: number
  winrate: number | null
}

interface IProps {
  hasAccount: boolean
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  heroes: IHero[]
  skeletonCount?: number
}

withDefaults(defineProps<IProps>(), {
  skeletonCount: 3
})

/** Іконки героїв, що не завантажились — показуємо запасний бокс. */
const brokenHeroIcons = ref<Set<string>>(new Set())

function onHeroIconError (heroId: string) {
  brokenHeroIcons.value = new Set(brokenHeroIcons.value).add(heroId)
}
</script>
