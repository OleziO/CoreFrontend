<template>
  <section class="sponsor-showcase w-full">
    <div
      class="mx-auto max-w-7xl px-10 sm:px-15 lg:px-20 xl:px-40"
      :class="variant === 'compact' ? 'py-16' : 'py-24'"
    >
      <SponsorBanner
        :sponsors="bannerSponsors"
        :dense="variant === 'compact'"
        :label="label"
        :invite-url="inviteUrl"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { getSponsors, getBannerSponsors, type TSponsor } from '@/config/sponsors'

const props = withDefaults(defineProps<{
  /** Список спонсорів. За замовчуванням береться з локального конфігу. */
  sponsors?: TSponsor[]
  /** `full` — повний банер; `compact` — вузька смуга (список турнірів). */
  variant?: 'full' | 'compact'
  /** Підпис у шапці карусели. */
  label?: string
  /** Куди веде заклик «Стати спонсором» (шапка + порожній слот). */
  inviteUrl?: string
}>(), {
  sponsors: () => getSponsors(),
  variant: 'full',
  label: 'Спонсори турніру',
  inviteUrl: 'https://discord.gg/QeDj9TjmgM'
})

const bannerSponsors = computed(() => getBannerSponsors(props.sponsors))
</script>
