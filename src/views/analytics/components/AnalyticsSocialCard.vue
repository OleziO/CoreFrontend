<template>
  <article
    class="social-card neon-card rounded-2xl"
    :class="`is-${social.source}`"
    :style="{ '--tile-delay': `${delay}ms` }"
  >
    <header class="social-card__head">
      <a
        :href="social.url"
        target="_blank"
        rel="noopener noreferrer"
        class="social-card__brand no-underline"
        :aria-label="`${social.label} — відкрити канал`"
      >
        <Icon :name="iconName" :size="20" />
        <span class="social-card__name">{{ social.label }}</span>
        <PhArrowUpRight :size="12" weight="bold" class="social-card__ext" />
      </a>

      <el-popover
        v-model:visible="editorOpen"
        placement="bottom-end"
        :width="248"
        trigger="click"
        popper-class="social-card__popper"
      >
        <template #reference>
          <button
            type="button"
            class="social-card__edit"
            :aria-label="`Ввести кількість підписників ${social.label} вручну`"
          >
            <PhPencilSimple :size="14" weight="bold" />
          </button>
        </template>

        <div class="flex flex-col gap-10">
          <span class="text-xs text-gray-400">Підписники вручну</span>
          <el-input-number
            v-model="draft"
            :min="0"
            :step="10"
            controls-position="right"
            class="w-full"
          />
          <p v-if="social.source === 'live'" class="text-[11px] leading-snug text-gray-500">
            Для цього каналу є живий лічильник — він має пріоритет над ручним значенням.
          </p>
          <div class="flex justify-end gap-8">
            <el-button size="small" text @click="editorOpen = false">
              Скасувати
            </el-button>
            <el-button size="small" type="primary" :loading="saving" @click="save">
              Зберегти
            </el-button>
          </div>
        </div>
      </el-popover>
    </header>

    <span class="social-card__value">{{ display }}</span>

    <footer class="social-card__meta">
      <span class="social-card__source">
        <span class="social-card__dot" aria-hidden="true" />
        {{ sourceLabel }}
      </span>
      <span v-if="time" class="social-card__time">{{ time }}</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { PhArrowUpRight, PhPencilSimple } from '@phosphor-icons/vue'
import { analyticsService } from '@/views/analytics/analytics.service'
import {
  analyticsSocialIconMap,
  analyticsSocialSourceLabelMap,
  formatAnalyticsCompact,
  formatAnalyticsTime
} from '../analytics.utils'

const props = withDefaults(defineProps<{
  social: TAnalyticsSocial
  delay?: number
}>(), {
  delay: 0
})

const emit = defineEmits<{
  /** Ручне значення збережено — батько перезапитує зведення. */
  (e: 'saved'): void
}>()

const iconName = computed(() => analyticsSocialIconMap[props.social.channel])
const sourceLabel = computed(() => analyticsSocialSourceLabelMap[props.social.source])
const time = computed(() => formatAnalyticsTime(props.social.fetchedAt))

const source = computed(() => props.social.followers ?? 0)
const animated = useTransition(source, {
  duration: 1100,
  transition: [0.16, 1, 0.3, 1]
})
const display = computed(() =>
  props.social.followers == null ? '—' : formatAnalyticsCompact(animated.value)
)

// ─── Ручне редагування ──────────────────────────────────────────────────────
const editorOpen = ref(false)
const saving = ref(false)
const draft = ref<number | undefined>(undefined)

watch(editorOpen, (open) => {
  if (open) draft.value = props.social.manualFollowers ?? props.social.followers ?? undefined
})

async function save () {
  saving.value = true
  try {
    await analyticsService.updateSocialFollowers(props.social.channel, draft.value ?? null)
    editorOpen.value = false
    emit('saved')
  } catch {
    // Тост уже показав сервіс — попап лишаємо відкритим для повторної спроби.
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.social-card {
  --card-status-rgb: 255, 255, 255;

  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 128px;
  padding: 16px 18px;
}

.social-card.is-live {
  --card-status-rgb: 34, 197, 94;
}

.social-card.is-manual {
  --card-status-rgb: var(--ds-gold-rgb);
}

.social-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.social-card__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--ds-text);
  transition: color var(--ds-duration-base) ease;
}

.social-card__brand:hover {
  color: var(--ds-primary);
}

.social-card__name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.social-card__ext {
  opacity: 0;
  transform: translate(-2px, 2px);
  transition:
    opacity var(--ds-duration-base) ease,
    transform var(--ds-duration-base) var(--ds-ease-out);
}

.social-card__brand:hover .social-card__ext,
.social-card__brand:focus-visible .social-card__ext {
  opacity: 1;
  transform: none;
}

.social-card__edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.03);
  color: var(--ds-text-faint);
  cursor: pointer;
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease;
}

.social-card__edit:hover,
.social-card__edit:focus-visible {
  color: var(--ds-primary);
  border-color: rgba(var(--ds-primary-rgb), 0.4);
  background: rgba(var(--ds-primary-rgb), 0.08);
  outline: none;
}

.social-card__value {
  font-family: var(--ds-font-body);
  font-size: 30px;
  font-weight: 700;
  line-height: 1.05;
  color: var(--ds-text-strong);
}

.social-card.is-unavailable .social-card__value {
  color: var(--ds-text-faint);
}

.social-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.social-card__source {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(var(--card-status-rgb), 0.9);
}

.social-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgb(var(--card-status-rgb));
  box-shadow: 0 0 8px rgba(var(--card-status-rgb), 0.8);
}

.social-card.is-live .social-card__dot {
  animation: social-dot-pulse 2.2s ease-in-out infinite;
}

@keyframes social-dot-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .social-card {
    animation: social-card-in 560ms var(--ds-ease-out) both;
    animation-delay: var(--tile-delay);
  }

  @keyframes social-card-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .social-card.is-live .social-card__dot {
    animation: none;
  }
}
</style>
