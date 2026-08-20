<template>
  <section class="sponsor-showcase w-full border-y border-white/[0.06] bg-white/[0.012]">
    <div
      class="mx-auto max-w-7xl px-10 sm:px-15 lg:px-20 xl:px-40"
      :class="variant === 'compact' ? 'py-16' : 'py-24'"
    >
      <SponsorBanner
        :sponsors="bannerSponsors"
        :dense="variant === 'compact'"
        :thumbnails="variant === 'full'"
      >
        <!-- Порожня карусель: запрошення замість банера -->
        <template #empty>
          <div class="flex flex-col items-center gap-8 px-16 text-center">
            <span class="text-[10px] uppercase tracking-[0.25em] text-gray-500">Місце вільне</span>
            <a
              :href="inviteUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex shrink-0 items-center gap-6 rounded-lg border border-[#e8b931]/35
                     px-14 py-8 text-[11px] font-semibold text-[#e8b931] transition-colors duration-200
                     hover:border-[#e8b931]/60 hover:bg-[#e8b931]/[0.06] hover:text-[#f5c842] cursor-pointer"
            >
              <PhHandshake :size="14" weight="fill" />
              Стати спонсором
            </a>
          </div>
        </template>
      </SponsorBanner>
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
  /** Куди веде заклик «Стати спонсором» у порожній каруселі. */
  inviteUrl?: string
}>(), {
  sponsors: () => getSponsors(),
  variant: 'full',
  inviteUrl: 'https://discord.gg/QeDj9TjmgM'
})

const bannerSponsors = computed(() => getBannerSponsors(props.sponsors))
</script>
