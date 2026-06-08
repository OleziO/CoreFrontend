<template>
  <section class="sponsor-showcase w-full border-y border-white/[0.06] bg-white/[0.012]">
    <div
      class="mx-auto max-w-7xl px-10 sm:px-15 lg:px-20 xl:px-40"
      :class="variant === 'compact' ? 'py-16' : 'py-24'"
    >
      <!-- Є спонсори -->
      <SponsorBanner
        v-if="hasSponsors"
        :sponsors="bannerSponsors"
        :dense="variant === 'compact'"
        :thumbnails="variant === 'full'"
      />

      <!-- Запрошення, коли спонсорів ще немає -->
      <div
        v-else
        class="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-16"
      >
        <div class="flex flex-col gap-4">
          <span class="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#e8b931]/80">
            {{ title }}
          </span>
          <p class="text-sm leading-snug text-gray-400">{{ inviteText }}</p>
        </div>
        <a
          :href="inviteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex shrink-0 items-center gap-8 rounded-xl border border-[#e8b931]/35
                 px-20 py-12 text-sm font-semibold text-[#e8b931] transition-colors duration-200
                 hover:border-[#e8b931]/60 hover:bg-[#e8b931]/[0.06] hover:text-[#f5c842] cursor-pointer"
        >
          <PhHandshake :size="16" weight="fill" />
          Стати спонсором
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhHandshake } from '@phosphor-icons/vue'
import { getSponsors, getBannerSponsors, type TSponsor } from '@/config/sponsors'

const props = withDefaults(defineProps<{
  /** Список спонсорів. За замовчуванням береться з локального конфігу. */
  sponsors?: TSponsor[]
  /** `full` — банер + мініатюри; `compact` — вузький банер (список турнірів). */
  variant?: 'full' | 'compact'
  title?: string
  inviteUrl?: string
  inviteText?: string
}>(), {
  sponsors: () => getSponsors(),
  variant: 'full',
  title: 'Спонсори',
  inviteUrl: 'https://discord.gg/SvgsPHPU',
  inviteText: 'Місце для вашого бренду перед активною Dota 2 аудиторією.'
})

const hasSponsors = computed(() => props.sponsors.length > 0)
const bannerSponsors = computed(() => getBannerSponsors(props.sponsors))
</script>
