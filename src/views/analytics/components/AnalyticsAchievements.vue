<template>
  <!-- Скелет тієї ж сітки — без стрибків layout -->
  <div v-if="isPending" class="achievements-grid" aria-busy="true">
    <span
      v-for="n in 12"
      :key="n"
      class="skeleton-bone block h-[168px] !rounded-xl"
      :style="{ '--skeleton-delay': `${n * 50}ms` }"
    />
  </div>

  <p v-else-if="isError" class="achievements-note achievements-note--error">
    Не вдалося завантажити дошку трофеїв
  </p>

  <div v-else class="flex flex-col gap-20">
    <section
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-10"
      :aria-label="group.label"
    >
      <header class="achievements-group">
        <span class="sys-label sys-label--muted">{{ group.label }}</span>
        <span class="achievements-group__hint">{{ group.hint }}</span>
        <span class="achievements-group__stat">
          {{ group.earned }} / {{ group.rows.length }} здобуто
        </span>
      </header>

      <div class="achievements-grid">
        <el-popover
          v-for="row in group.rows"
          :key="row.kind"
          trigger="hover"
          placement="top"
          :width="300"
          :show-after="120"
          :hide-after="80"
          popper-class="achievement-popover"
        >
          <template #reference>
            <article
              class="achievement-card"
              :class="{
                'achievement-card--gloomy': row.gloomy,
                'achievement-card--vacant': row.holders.length === 0
              }"
              :style="{ '--tile-tone': row.tone }"
              tabindex="0"
              :aria-label="`${row.label}: ${holdersCaption(row.holders.length)}`"
            >
              <span class="achievement-card__ring" aria-hidden="true">
                <component :is="row.icon" :size="26" weight="duotone" class="achievement-card__icon" />
              </span>
              <span class="achievement-card__label">{{ row.label }}</span>
              <span class="achievement-card__desc">{{ row.description }}</span>

              <span class="achievement-card__foot">
                <!-- Стек аватарок перших володарів — натяк, що є кого дивитись -->
                <span v-if="row.holders.length" class="achievement-card__avatars" aria-hidden="true">
                  <el-avatar
                    v-for="holder in row.holders.slice(0, AVATAR_STACK)"
                    :key="holder.playerId"
                    :src="resolvePublicOrApiUrl(holder.avatarUrl)"
                    :size="22"
                    class="achievement-card__avatar"
                  >
                    {{ initialOf(holder) }}
                  </el-avatar>
                </span>
                <span class="achievement-card__count">{{ holdersCaption(row.holders.length) }}</span>
              </span>
            </article>
          </template>

          <!-- Список володарів: аватар, ім'я, скільки разів / яке значення -->
          <div class="holders" :style="{ '--tile-tone': row.tone }">
            <header class="holders__head">
              <span class="holders__title">{{ row.label }}</span>
              <span class="holders__count">{{ holdersCaption(row.holders.length) }}</span>
            </header>

            <p v-if="!row.holders.length" class="holders__empty">
              Ще ніхто не здобув. {{ row.description }}.
            </p>

            <ul v-else class="holders__list">
              <li
                v-for="holder in row.holders.slice(0, HOLDERS_LIMIT)"
                :key="holder.playerId"
              >
                <RouterLink
                  class="holders__row"
                  :to="{ name: routeNames.player, params: { id: holder.playerId } }"
                >
                  <el-avatar
                    :src="resolvePublicOrApiUrl(holder.avatarUrl)"
                    :size="28"
                    class="holders__avatar"
                  >
                    {{ initialOf(holder) }}
                  </el-avatar>
                  <span class="holders__name">
                    <span class="truncate">{{ displayName(holder) }}</span>
                    <span v-if="holder.discordUsername" class="holders__handle truncate">
                      @{{ holder.discordUsername }}
                    </span>
                  </span>
                  <span class="holders__value">
                    {{ formatAchievementCaption(row.kind, holder.count, holder.value) }}
                  </span>
                </RouterLink>
              </li>
              <li v-if="row.holders.length > HOLDERS_LIMIT" class="holders__more">
                ще {{ pluralizePlayers(row.holders.length - HOLDERS_LIMIT) }}
              </li>
            </ul>
          </div>
        </el-popover>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import {
  achievementCatalog,
  achievementCategories,
  achievementKindOrder,
  formatAchievementCaption,
  pluralizePlayers
} from '@/views/players/player-achievements.utils'

/** Скільки аватарок показати на самій плитці. */
const AVATAR_STACK = 3
/** Скільки рядків у поповері, далі — «ще N гравців». */
const HOLDERS_LIMIT = 12

const props = withDefaults(defineProps<{
  achievements: TAnalyticsAchievement[]
  isPending?: boolean
  isError?: boolean
}>(), {
  isPending: false,
  isError: false
})

/**
 * Завжди повний каталог у фіксованому порядку, згрупований за категоріями:
 * види, яких бек не повернув (або ще ніхто не здобув), показуємо як «вакантні».
 */
const groups = computed(() => {
  const byKind = new Map(props.achievements.map((a) => [a.kind, a]))
  const rows = achievementKindOrder.map((kind) => {
    const meta = achievementCatalog[kind]
    return {
      kind,
      category: meta.category,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      tone: meta.tone,
      gloomy: meta.gloomy ?? false,
      holders: byKind.get(kind)?.holders ?? []
    }
  })
  return achievementCategories.map((category) => {
    const own = rows.filter((r) => r.category === category.key)
    return {
      ...category,
      rows: own,
      earned: own.filter((r) => r.holders.length > 0).length
    }
  })
})

function holdersCaption (n: number): string {
  return n === 0 ? 'ще нікого' : pluralizePlayers(n)
}

function displayName (holder: TAnalyticsAchievementHolder): string {
  return holder.discordName || holder.discordUsername || 'Гравець'
}

function initialOf (holder: TAnalyticsAchievementHolder): string {
  return displayName(holder).charAt(0).toUpperCase()
}
</script>

<style scoped>
.achievements-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

/* Шапка категорії: моно-ярлик, підказка та лічильник здобутих. */
.achievements-group {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
}

.achievements-group__hint {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--ds-text-faint);
}

.achievements-group__stat {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--ds-text-muted);
}

/* Плитка трофею: темна ніша з обводкою в тоні трофею; вакантна — приглушена. */
.achievement-card {
  --tile-tone: var(--ds-primary-rgb);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 100%;
  min-height: 168px;
  padding: 18px 14px 14px;
  border-radius: 12px;
  border: 1px solid rgba(var(--tile-tone), 0.24);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.14);
  text-align: center;
  cursor: default;
  outline: none;
  transition:
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out),
    opacity var(--ds-duration-base) ease;
}

.achievement-card--gloomy {
  border-style: dashed;
  background: rgba(0, 0, 0, 0.45);
}

.achievement-card--vacant {
  opacity: 0.6;
}

.achievement-card:focus-visible {
  box-shadow: 0 0 0 2px rgba(var(--tile-tone), 0.55);
}

@media (hover: hover) and (pointer: fine) {
  .achievement-card:hover {
    opacity: 1;
    transform: translateY(-2px);
    border-color: rgba(var(--tile-tone), 0.6);
    box-shadow: inset 0 1px 0 rgba(var(--tile-tone), 0.2), 0 0 18px rgba(var(--tile-tone), 0.26);
  }
}

.achievement-card__ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  border: 1px solid rgba(var(--tile-tone), 0.5);
  background: rgba(0, 0, 0, 0.45);
  box-shadow: 0 0 14px rgba(var(--tile-tone), 0.28), inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.achievement-card__icon {
  color: rgb(var(--tile-tone));
  filter: drop-shadow(0 0 6px rgba(var(--tile-tone), 0.6));
}

.achievement-card--gloomy .achievement-card__ring {
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.6);
}

.achievement-card--gloomy .achievement-card__icon {
  filter: none;
}

.achievement-card__label {
  font-family: var(--ds-font-display);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.2;
  color: var(--ds-text-strong);
}

.achievement-card__desc {
  font-size: 11px;
  line-height: 1.35;
  color: var(--ds-text-muted);
}

.achievement-card__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
}

.achievement-card__avatars {
  display: inline-flex;
  isolation: isolate;
}

/*
  Глобальний .el-avatar фіксує 56px і кільце — тут потрібні мініатюри в тоні трофею.
  Роздільник між сусідами — внутрішня рамка кожної аватарки (не зовнішня тінь),
  тож вона нічого не «відрізає» в сусіда; перша аватарка лежить зверху.
*/
.achievement-card__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.35);

  width: 24px;
  height: 24px;
  margin-left: -6px;
  border: 2px solid var(--ds-surface);
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.55);
  font-size: 9px;
  line-height: 1;
}

.achievement-card__avatar:nth-child(1) {
  z-index: 3;
  margin-left: 0;
}

.achievement-card__avatar:nth-child(2) {
  z-index: 2;
}

.achievement-card__avatar:nth-child(3) {
  z-index: 1;
}

.achievement-card__count {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--tile-tone), 0.9);
}

.achievement-card--vacant .achievement-card__count {
  color: var(--ds-text-faint);
}

.achievements-note {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--ds-text-faint);
}

.achievements-note--error {
  color: rgb(var(--ds-pink-rgb));
}

/*
  Поповер: шапка в тоні трофею, список рядків-посилань на профіль.
  Глобальний .el-popover — flex-контейнер, тож колонка мусить сама забрати всю ширину,
  інакше вона стискається до контенту, а скролбар списку «зависає» посеред поппера.
*/
.holders {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.holders__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--tile-tone), 0.25);
}

.holders__title {
  font-family: var(--ds-font-display);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--tile-tone));
}

.holders__count {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.holders__empty {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-muted);
}

/* Тонкий скролбар у тоні трофею впритул до правого краю; без горизонтального скролу. */
.holders__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  margin: 0 -6px 0 0;
  padding: 0 6px 0 0;
  overflow-x: hidden;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--tile-tone), 0.45) rgba(255, 255, 255, 0.05);
}

.holders__list::-webkit-scrollbar {
  width: 4px;
}

.holders__list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.holders__list::-webkit-scrollbar-thumb {
  background: rgba(var(--tile-tone), 0.45);
  border-radius: 4px;
}

.holders__row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background-color var(--ds-duration-base) ease;
}

.holders__row:hover,
.holders__row:focus-visible {
  background: rgba(var(--tile-tone), 0.1);
  outline: none;
}

.holders__avatar {
  --el-avatar-bg-color: rgba(var(--tile-tone), 0.3);

  flex-shrink: 0;
  width: 28px;
  height: 28px;
  box-shadow: 0 0 0 1px rgba(var(--tile-tone), 0.5);
  font-size: 12px;
}

.holders__name {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  font-size: 13px;
  line-height: 1.25;
  color: var(--ds-text-strong);
}

.holders__handle {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.holders__value {
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: rgb(var(--tile-tone));
}

.holders__more {
  padding: 6px 8px 2px;
  font-size: 11px;
  color: var(--ds-text-faint);
}
</style>
