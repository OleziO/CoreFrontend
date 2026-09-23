<template>
  <span
    class="status-badge inline-flex items-center border leading-none align-middle"
    :class="[toneClass, sizeClass, iconOnly ? 'status-badge--seal rounded-full' : 'status-badge--chip rounded']"
    role="img"
    :aria-label="resolvedLabel"
  >
    <component
      :is="resolvedIcon"
      v-if="resolvedIcon"
      :size="iconSize"
      :weight="iconWeight"
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
  STATUS_TONE_SOLID_CLASS,
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
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Render the icon only — label is still exposed to assistive tech. */
  iconOnly?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  size: 'md'
})

const preset = computed(() => (props.preset ? STATUS_PRESETS[props.preset] : undefined))

const resolvedTone = computed<TStatusTone>(() => props.tone ?? preset.value?.tone ?? 'neutral')
// Icon-only seals prefer the preset's heavy `sealIcon` (bold stroke glyph);
// text chips keep the descriptive filled icon.
const resolvedIcon = computed<Component | undefined>(() =>
  props.icon ?? (props.iconOnly ? preset.value?.sealIcon : undefined) ?? preset.value?.icon
)
const iconWeight = computed(() => (props.iconOnly && !props.icon && preset.value?.sealIcon ? 'bold' : 'fill'))
const resolvedLabel = computed(() => props.label ?? preset.value?.label ?? '')
const resolvedPulse = computed(() => props.pulse ?? preset.value?.pulse ?? false)

// Icon-only seals render as a solid colored circle with a white glyph for
// maximum contrast; text badges keep the subtler translucent tint.
const toneClass = computed(() =>
  (props.iconOnly ? STATUS_TONE_SOLID_CLASS : STATUS_TONE_CLASS)[resolvedTone.value]
)

const sizeClass = computed(() => {
  // Icon-only badges sit on avatars as a seal — keep padding square so the
  // wrapper renders as a clean circle rather than a lopsided pill.
  // Padding shrinks as the glyph grows so the disc diameter stays the same.
  if (props.iconOnly) {
    return { xs: 'p-1', sm: 'p-3', md: 'p-5', lg: 'p-7' }[props.size]
  }

  return {
    xs: 'gap-4 px-6 py-3 text-[9px]',
    sm: 'gap-5 px-8 py-4 text-[10px]',
    md: 'gap-6 px-10 py-5 text-[11px]',
    lg: 'gap-8 px-12 py-6 text-[12px]'
  }[props.size]
})

const iconSize = computed(() =>
  (props.iconOnly ? { xs: 14, sm: 17, md: 20, lg: 26 } : { xs: 12, sm: 15, md: 18, lg: 24 })[props.size]
)
</script>

<style scoped lang="scss">
// Text badge in the HUD register: mono uppercase label on a dark well with a
// tone-coloured hairline; the glyph and text carry a faint neon halo in the
// same tone (currentColor), so the chip glows without a second colour token.
.status-badge--chip {
  font-family: var(--ds-font-mono);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 0 8px currentColor;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  > svg {
    filter: drop-shadow(0 0 4px currentColor);
  }
}
</style>
