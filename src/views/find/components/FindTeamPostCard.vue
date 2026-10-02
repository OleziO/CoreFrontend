<template>
  <article
    class="find-card neon-card hud-corners flex w-full flex-col gap-14 rounded-2xl px-16 py-16"
    :class="{ 'is-vip': post.team.isVip }"
  >
    <!-- Команда: логотип, назва, бейджі -->
    <header class="flex items-center gap-12">
      <RouterLink
        :to="{ name: routeNames.team, params: { id: post.team.id } }"
        class="find-card__logo no-underline"
        :aria-label="post.team.name"
      >
        <img v-if="logoSrc && !logoFailed" :src="logoSrc" alt="" @error="logoFailed = true">
        <PhUsersThree v-else :size="24" weight="duotone" class="text-primary/40" />
      </RouterLink>

      <div class="flex min-w-0 flex-1 flex-col gap-4">
        <RouterLink
          :to="{ name: routeNames.team, params: { id: post.team.id } }"
          class="find-card__title no-underline"
          :title="post.team.name"
        >
          {{ post.team.name }}
        </RouterLink>
        <span class="find-card__sub">
          <template v-if="post.team.avgRating != null">
            <b>{{ formatMmr(post.team.avgRating) }}</b> сер. MMR ·
          </template>
          основа {{ post.team.mainCount }}/5
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-6">
        <el-tooltip v-if="post.team.isVip" content="VIP-команда" placement="top" effect="dark">
          <VipBadge size="xs" static />
        </el-tooltip>
        <el-tooltip
          :content="post.team.isVerified ? 'Верифікована команда' : 'Не верифікована команда'"
          placement="top"
          effect="dark"
        >
          <StatusBadge :preset="post.team.isVerified ? 'verified' : 'unverified'" size="sm" icon-only />
        </el-tooltip>
      </div>
    </header>

    <!-- Кого шукають -->
    <dl class="find-card__facts">
      <div class="find-card__fact find-card__fact--wide">
        <dt class="sys-label sys-label--muted">Шукаємо</dt>
        <dd class="flex flex-wrap gap-6">
          <span v-for="pos in positionChips" :key="pos.value" class="find-chip">
            <component :is="pos.icon" :size="12" weight="bold" />
            {{ pos.label }}
          </span>
        </dd>
      </div>
      <div class="find-card__fact">
        <dt class="sys-label sys-label--muted">MMR</dt>
        <dd class="find-card__mono">{{ formatFindMmrRange(post.mmrMin, post.mmrMax) }}</dd>
      </div>
      <div class="find-card__fact">
        <dt class="sys-label sys-label--muted">Потрібно</dt>
        <dd class="find-card__mono">{{ post.playersNeeded }}</dd>
      </div>
      <div v-if="post.formats.length" class="find-card__fact find-card__fact--wide">
        <dt class="sys-label sys-label--muted">Формат</dt>
        <dd>{{ formatsLabel }}</dd>
      </div>
    </dl>

    <p v-if="post.description" class="find-card__text">{{ post.description }}</p>

    <div class="min-h-0 flex-1" aria-hidden="true" />

    <!-- Дії -->
    <footer class="find-card__actions">
      <template v-if="post.canManage">
        <el-button plain class="flex-1" @click="emit('edit', post)">
          <PhPencilSimple :size="14" weight="bold" class="mr-6" />
          Редагувати
        </el-button>
        <el-button plain type="danger" class="flex-1" :loading="busy" @click="emit('close', post)">
          Закрити
        </el-button>
      </template>

      <template v-else-if="post.myApplication">
        <span class="find-card__state">
          <PhClockCountdown :size="14" weight="bold" />
          Заявку подано
        </span>
        <el-button plain class="flex-1" :loading="busy" @click="emit('withdraw', post)">
          Відкликати
        </el-button>
      </template>

      <el-tooltip
        v-else
        :disabled="canApply"
        :content="blockText"
        placement="top"
        effect="dark"
      >
        <!-- Обгортка: disabled-кнопка не ловить hover, тож підказку тримає span -->
        <span class="flex flex-1">
          <el-button type="primary" class="flex-1" :disabled="!canApply" @click="emit('apply', post)">
            <PhPaperPlaneTilt :size="14" weight="bold" class="mr-6" />
            Подати заявку
          </el-button>
        </span>
      </el-tooltip>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { PhClockCountdown, PhPaperPlaneTilt, PhPencilSimple, PhUsersThree } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { getTournamentFormatLabel, positionOptions } from '@/components/player-tags/player.enums'
import VipBadge from '@/components/VipBadge.vue'
import { findBlockReasonText, formatFindMmrRange } from '@/views/find/find.utils'
import type { TTeamPost } from '@/api/types/api.types'

const props = defineProps<{
  post: TTeamPost
  /** Дія над карткою в процесі (закриття / відкликання). */
  busy?: boolean
}>()

const emit = defineEmits<{
  apply: [post: TTeamPost]
  withdraw: [post: TTeamPost]
  edit: [post: TTeamPost]
  close: [post: TTeamPost]
}>()

const mmrFormat = new Intl.NumberFormat('uk-UA')
const formatMmr = (value: number) => mmrFormat.format(value)

const logoSrc = computed(() => resolvePublicOrApiUrl(props.post.team.logoUrl))
const logoFailed = ref(false)
watch(logoSrc, () => {
  logoFailed.value = false
})

const positionChips = computed(() => {
  const wanted = new Set<number>(props.post.positions)
  return positionOptions.filter(p => wanted.has(p.value))
})

const formatsLabel = computed(() => props.post.formats.map(getTournamentFormatLabel).join(' · '))

const canApply = computed(() => props.post.blockReasons.length === 0)
const blockText = computed(() => findBlockReasonText(props.post.blockReasons))
</script>

<style scoped lang="scss">
.find-card {
  min-height: 100%;

  &.is-vip {
    border-color: rgba(var(--ds-gold-rgb), 0.35);
  }
}

.find-card__logo {
  @apply inline-flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border;
  border-color: rgba(var(--ds-primary-rgb), 0.25);
  background: rgba(0, 0, 0, 0.35);

  img {
    @apply h-full w-full object-cover;
  }
}

.find-card__title {
  @apply truncate font-display text-[15px] uppercase leading-tight tracking-wide text-white;
  transition: color var(--ds-duration-fast) ease;
}

.find-card__sub {
  @apply truncate text-xs;
  color: var(--ds-text-faint);

  b {
    font-family: var(--ds-font-mono);
    font-weight: 600;
    color: var(--ds-primary);
  }
}

.find-card__facts {
  @apply m-0 grid grid-cols-2 gap-10 rounded-xl border p-12;
  border-color: rgba(var(--ds-primary-rgb), 0.12);
  background: rgba(0, 0, 0, 0.3);
}

.find-card__fact {
  @apply flex min-w-0 flex-col gap-4;

  &--wide {
    @apply col-span-2;
  }

  dt {
    font-size: 9px !important;
  }

  dd {
    @apply m-0 min-w-0 text-sm;
    color: var(--ds-text);
  }
}

.find-card__mono {
  font-family: var(--ds-font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong) !important;
}

.find-chip {
  @apply inline-flex items-center gap-4 rounded-md border px-6 py-2 text-xs;
  border-color: rgba(var(--ds-primary-rgb), 0.3);
  background: rgba(var(--ds-primary-rgb), 0.08);
  color: var(--ds-text-strong);

  svg {
    color: var(--ds-primary);
  }
}

.find-card__text {
  @apply m-0 line-clamp-4 whitespace-pre-line text-sm leading-relaxed;
  color: var(--ds-text-muted);
  overflow-wrap: anywhere;
}

.find-card__actions {
  @apply flex items-center gap-8;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.find-card__state {
  @apply inline-flex flex-1 items-center gap-6 text-xs font-semibold;
  color: var(--ds-gold);
}

@media (hover: hover) and (pointer: fine) {
  .find-card__title:hover {
    color: var(--ds-primary);
  }
}
</style>
