<template>
  <span
    class="status-badge inline-flex items-center font-medium rounded-full border leading-none align-middle"
    :class="[toneClass, sizeClass]"
    role="img"
    :aria-label="resolvedLabel"
  >
    <component
      :is="resolvedIcon"
      v-if="resolvedIcon"
      :size="iconSize"
      weight="fill"
      class="shrink-0"
      :class="{ 'animate-pulse': resolvedPulse }"
      aria-hidden="true"
    />
    <span v-if="!iconOnly" class="truncate">{{ resolvedLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import {
  STATUS_PRESETS,
  STATUS_TONE_CLASS,
  type TStatusPresetKey,
  type TStatusTone
} from './status.presets'

interface IProps {
  /** Domain preset providing default tone/icon/label (e.g. 'verified', 'live'). */
  preset?: TStatusPresetKey
  /** Explicit tone override; falls back to the preset's tone, else 'neutral'. */
  tone?: TStatusTone
  /** Explicit label override; falls back to the preset's label. */
  label?: string
  /** Explicit Phosphor icon override; falls back to the preset's icon. */
  icon?: Component
  size?: 'sm' | 'md'
  /** Render the icon only — label is still exposed to assistive tech. */
  iconOnly?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  size: 'md'
})

const preset = computed(() => (props.preset ? STATUS_PRESETS[props.preset] : undefined))

const resolvedTone = computed<TStatusTone>(() => props.tone ?? preset.value?.tone ?? 'neutral')
const resolvedIcon = computed<Component | undefined>(() => props.icon ?? preset.value?.icon)
const resolvedLabel = computed(() => props.label ?? preset.value?.label ?? '')
const resolvedPulse = computed(() => props.pulse ?? preset.value?.pulse ?? false)

const toneClass = computed(() => STATUS_TONE_CLASS[resolvedTone.value])

const sizeClass = computed(() =>
  props.size === 'sm' ? 'gap-4 px-8 py-2 text-caption' : 'gap-6 px-10 py-4 text-small'
)

const iconSize = computed(() => (props.size === 'sm' ? 13 : 15))
</script>
