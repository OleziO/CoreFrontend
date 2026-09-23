<template>
  <div
    class="sponsor-banner"
    role="group"
    aria-roledescription="Карусель спонсорів"
    aria-label="Спонсори"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <!-- Великий банер -->
    <div
      class="relative w-full overflow-hidden rounded-2xl border bg-black/40"
      :class="[
        dense ? 'h-[88px] sm:h-[110px]' : 'aspect-[1900/420] max-h-[280px]',
        isEmpty ? 'border-dashed border-white/12' : 'border-white/[0.08]'
      ]"
    >
      <!-- Порожнє місце: спонсорів немає — показуємо плейсхолдер -->
      <div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center">
        <slot name="empty">
          <span class="text-[10px] uppercase tracking-[0.2em] text-gray-600">Місце вільне</span>
        </slot>
      </div>

      <Transition v-else name="sponsor-fade">
        <component
          :is="activeSponsor?.websiteUrl ? 'a' : 'div'"
          :key="activeSponsor?.id"
          :href="activeSponsor?.websiteUrl || undefined"
          :target="activeSponsor?.websiteUrl ? '_blank' : undefined"
          :rel="activeSponsor?.websiteUrl ? 'noopener noreferrer' : undefined"
          class="absolute inset-0 flex items-center justify-center"
          :class="activeSponsor?.websiteUrl ? 'cursor-pointer' : 'cursor-default'"
          :aria-label="activeSponsor?.name"
        >
          <img
            v-if="activeSponsor?.bannerUrl && !failedAssets.has(`b:${activeSponsor.id}`)"
            :src="activeSponsor.bannerUrl"
            :alt="activeSponsor.name"
            class="h-full w-full object-cover"
            @error="failedAssets.add(`b:${activeSponsor!.id}`)"
          >
          <!-- Fallback: лого на темному тлі, якщо банера немає -->
          <div
            v-else
            class="flex h-full w-full items-center justify-center
                   bg-[radial-gradient(ellipse_at_center,rgba(232,185,49,0.10),transparent_70%)]"
          >
            <img
              v-if="activeSponsor && activeSponsor.logoUrl && !failedAssets.has(activeSponsor.id)"
              :src="resolvePublicOrApiUrl(activeSponsor.logoUrl)"
              :alt="activeSponsor.name"
              class="max-h-[50%] w-auto max-w-[55%] object-contain opacity-90"
              @error="failedAssets.add(activeSponsor!.id)"
            >
            <span v-else class="text-lg font-bold tracking-wide text-white/90">
              {{ activeSponsor?.name }}
            </span>
          </div>
        </component>
      </Transition>

      <!-- Підпис «Спонсори» -->
      <span
        class="pointer-events-none absolute left-12 top-10 z-20 rounded-md bg-black/45 px-8 py-3
               text-[9px] uppercase tracking-[0.28em] font-semibold text-[#e8b931]/90 backdrop-blur-sm"
      >
        Спонсори
      </span>

      <!-- Стрілки -->
      <template v-if="sponsorList.length > 1">
        <button type="button" class="nav-arrow left-8" aria-label="Попередній спонсор" @click.prevent="prev">
          <PhCaretLeft :size="18" weight="bold" />
        </button>
        <button type="button" class="nav-arrow right-8" aria-label="Наступний спонсор" @click.prevent="next">
          <PhCaretRight :size="18" weight="bold" />
        </button>
      </template>
    </div>

    <!-- Плейсхолдери мініатюр, поки спонсорів немає -->
    <div
      v-if="thumbnails && isEmpty"
      class="mt-10 flex flex-wrap items-center justify-center gap-8"
    >
      <div v-for="i in EMPTY_THUMB_COUNT" :key="i" class="thumb thumb--empty">
        <span class="text-[10px] uppercase tracking-[0.15em] text-gray-600">Вільне</span>
      </div>
    </div>

    <!-- Мініатюри-банери (повна видимість усіх спонсорів) -->
    <div
      v-else-if="thumbnails && sponsorList.length > 1"
      class="mt-10 flex flex-wrap items-center justify-center gap-8"
    >
      <button
        v-for="(sponsor, idx) in sponsorList"
        :key="sponsor.id"
        type="button"
        class="thumb"
        :class="idx === currentIndex ? 'thumb--active' : ''"
        :aria-label="`Показати спонсора: ${sponsor.name}`"
        :aria-current="idx === currentIndex ? 'true' : undefined"
        @click="goTo(idx)"
      >
        <img
          v-if="sponsor.bannerUrl && !failedAssets.has(`t:${sponsor.id}`)"
          :src="sponsor.bannerUrl"
          :alt="sponsor.name"
          loading="lazy"
          class="h-full w-full object-cover"
          @error="failedAssets.add(`t:${sponsor.id}`)"
        >
        <span v-else class="px-8 text-[11px] font-semibold text-white/80">{{ sponsor.name }}</span>
      </button>
    </div>

    <!-- Крапки-індикатори (ширина ∝ вага), коли мініатюр немає -->
    <div
      v-else-if="sponsorList.length > 1"
      class="mt-8 flex items-center justify-center gap-6"
    >
      <button
        v-for="(sponsor, idx) in sponsorList"
        :key="sponsor.id"
        type="button"
        class="h-3 rounded-full transition-all duration-300 cursor-pointer"
        :style="{ width: `${dotWidth(sponsor)}px` }"
        :class="idx === currentIndex ? 'bg-[#e8b931]' : 'bg-white/25 hover:bg-white/45'"
        :aria-label="`Показати спонсора: ${sponsor.name}`"
        :aria-current="idx === currentIndex ? 'true' : undefined"
        @click="goTo(idx)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { getBannerSponsors, getRotationWeight, type TSponsor } from '@/config/sponsors'

const props = withDefaults(defineProps<{
  /** Спонсори для ротації. За замовч. — усі з конфігу, від найвагоміших. */
  sponsors?: TSponsor[]
  /** Зменшена висота — для вузької смуги (список турнірів). */
  dense?: boolean
  /** Показувати стрічку мініатюр-банерів під каруселлю. */
  thumbnails?: boolean
}>(), {
  sponsors: () => getBannerSponsors(),
  dense: false,
  thumbnails: false
})

const sponsorList = computed(() => props.sponsors)
const isEmpty = computed(() => sponsorList.value.length === 0)

/** Скільки вільних місць малювати в стрічці мініатюр, поки спонсорів немає. */
const EMPTY_THUMB_COUNT = 3

const hovered = ref(false)
const focused = ref(false)
const paused = computed(() => hovered.value || focused.value)

const { currentIndex, current, next, prev, goTo } = useWeightedRotation(sponsorList, {
  weightOf: getRotationWeight,
  paused
})

const activeSponsor = computed(() => current.value ?? sponsorList.value[0])

// Зображення, які не завантажились — показуємо назву/лого замість «битої» картинки.
const failedAssets = reactive(new Set<string>())

// Ширина крапки-індикатора пропорційна вазі — візуальний сигнал пріоритету.
const maxWeight = computed(() =>
  sponsorList.value.reduce((m, s) => Math.max(m, getRotationWeight(s)), 1)
)

function dotWidth (sponsor: TSponsor): number {
  const ratio = getRotationWeight(sponsor) / maxWeight.value
  return Math.round(10 + ratio * 18)
}
</script>

<style scoped>
.nav-arrow {
  position: absolute;
  top: 50%;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transform: translateY(-50%);
  border-radius: 9999px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.nav-arrow:not(:disabled):active {
  transform: translateY(-50%) scale(0.96);
}
.nav-arrow:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(232, 185, 49, 0.5);
}
.nav-arrow:focus-visible {
  outline: 2px solid #2ee5ff;
  outline-offset: 2px;
}

.thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 96px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
  opacity: 0.55;
  cursor: pointer;
  transition: opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.thumb:hover {
  opacity: 0.9;
}
.thumb--empty {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  opacity: 1;
  cursor: default;
}
.thumb--active {
  opacity: 1;
  border-color: rgba(232, 185, 49, 0.8);
  box-shadow: 0 0 0 1px rgba(232, 185, 49, 0.45);
}
.thumb:focus-visible {
  outline: 2px solid #2ee5ff;
  outline-offset: 2px;
}

.sponsor-fade-enter-active,
.sponsor-fade-leave-active {
  transition: opacity 0.4s ease;
}
.sponsor-fade-enter-from,
.sponsor-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sponsor-fade-enter-active,
  .sponsor-fade-leave-active {
    transition: none;
  }
}
</style>
