<template>
  <div class="neon-card hud-corners flex w-full flex-col items-stretch gap-14 rounded-2xl p-16 2md:p-20">
    <h3 class="section-title">
      <span class="inline-flex items-center gap-6">
        Досягнення
        <el-tooltip
          placement="top"
          effect="dark"
          :show-after="180"
          content="Місця в турнірах платформи та рекорди серед усіх гравців. Рекорди ділять усі, хто їх повторив."
        >
          <PhQuestion
            class="cursor-help text-white/40 transition-colors hover:text-primary"
            weight="bold"
            :size="14"
          />
        </el-tooltip>
      </span>
    </h3>

    <!-- Завантаження: скелет тієї ж сітки/розміру, без стрибків layout -->
    <div
      v-if="isPending"
      class="flex flex-wrap items-center justify-center gap-14"
    >
      <div
        v-for="i in skeletonCount"
        :key="i"
        class="trophy-tile h-[136px] w-[150px] animate-pulse"
      />
    </div>

    <p
      v-else-if="isError"
      class="py-10 text-center text-sm text-error"
    >
      Не вдалося завантажити досягнення. Спробуйте пізніше.
    </p>

    <!-- Порожній стан: ілюстрація + текст, як у сусідніх блоках -->
    <el-empty
      v-else-if="isEmpty"
      description="Трофеїв ще немає — усе ще попереду."
      :image-size="120"
      class="achievements-empty"
    />

    <div
      v-else
      class="flex flex-wrap items-stretch justify-center gap-14"
    >
      <el-tooltip
        v-for="row in rows"
        :key="row.kind"
        placement="top"
        effect="dark"
        :show-after="180"
      >
        <template #content>
          <div class="flex max-w-[260px] flex-col gap-4">
            <span>{{ row.description }}</span>
            <ul
              v-if="row.tournaments.length"
              class="m-0 list-disc pl-16 text-white/80"
            >
              <li
                v-for="t in row.tournaments"
                :key="t.id"
              >
                {{ t.name }}
              </li>
            </ul>
          </div>
        </template>

        <div
          class="trophy-tile w-[150px]"
          :style="{ '--tile-tone': row.tone }"
          :class="{ 'trophy-tile--gloomy': row.gloomy }"
        >
          <span
            v-if="row.badge"
            class="trophy-tile__badge"
          >{{ row.badge }}</span>

          <div class="trophy-tile__ring">
            <component
              :is="row.icon"
              :size="28"
              weight="duotone"
              class="trophy-tile__icon"
            />
          </div>

          <span
            class="line-clamp-2 max-w-full text-center font-display text-[11px] uppercase leading-tight tracking-wide
              text-white"
            :title="row.label"
          >
            {{ row.label }}
          </span>

          <span class="text-center font-mono text-[10px] tabular-nums text-white/50">
            {{ row.caption }}
          </span>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhQuestion } from '@phosphor-icons/vue'
import type { TPlayerAchievement } from '@/api/types/api.types'
import {
  achievementCatalog,
  achievementKindOrder,
  formatAchievementCaption,
  isPlacementAchievement
} from '@/views/players/player-achievements.utils'

interface IProps {
  achievements: TPlayerAchievement[]
  isPending: boolean
  isError: boolean
  isEmpty: boolean
  skeletonCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  skeletonCount: 4
})

/** Порядок як у каталозі: спочатку п'єдестал, потім рекорди. Невідомі `kind` з беку пропускаємо. */
const rows = computed(() => {
  return props.achievements
    .filter((a) => a.kind in achievementCatalog)
    .sort((a, b) => achievementKindOrder.indexOf(a.kind) - achievementKindOrder.indexOf(b.kind))
    .map((a) => {
      const meta = achievementCatalog[a.kind]
      return {
        kind: a.kind,
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
        tone: meta.tone,
        gloomy: meta.gloomy ?? false,
        badge: isPlacementAchievement(a.kind) && a.count > 1 ? `×${a.count}` : '',
        caption: formatAchievementCaption(a.kind, a.count, a.value),
        tournaments: a.tournaments
      }
    })
})
</script>

<style scoped lang="scss">
// Trophy tile: the hero-tile recipe with a tone per trophy — gold / silver /
// bronze for the podium, status colours for platform records. The gloomy
// variant (most losses) drops the glow so the joke reads as a joke.
.trophy-tile {
  @apply relative flex flex-col items-center justify-center gap-6 overflow-hidden
    rounded-xl border px-8 pb-14 pt-16;
  --tile-tone: var(--ds-primary-rgb);
  border-color: rgba(var(--tile-tone), 0.22);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.14);
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);

  &--gloomy {
    background: rgba(0, 0, 0, 0.45);
    border-style: dashed;
  }
}

@media (hover: hover) and (pointer: fine) {
  .trophy-tile:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--tile-tone), 0.55);
    box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.2), 0 0 18px rgba(var(--tile-tone), 0.24);
  }
}

.trophy-tile__badge {
  @apply absolute right-8 top-6;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: rgba(var(--tile-tone), 0.85);
}

.trophy-tile__ring {
  @apply flex size-52 items-center justify-center rounded-full;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(var(--tile-tone), 0.5);
  box-shadow: 0 0 14px rgba(var(--tile-tone), 0.28), inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.trophy-tile__icon {
  color: rgb(var(--tile-tone));
  filter: drop-shadow(0 0 6px rgba(var(--tile-tone), 0.6));
}

.trophy-tile--gloomy .trophy-tile__ring {
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.trophy-tile--gloomy .trophy-tile__icon {
  filter: none;
}

/* Компактніший варіант глобального .el-empty під розмір картки */
.achievements-empty {
  @apply py-6;

  :deep(.el-empty__description) {
    @apply mt-2;
    font-size: 12px;
  }
}
</style>
