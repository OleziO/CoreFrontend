<template>
  <el-dialog
    v-model="modelValue"
    align-center
    class="media-dialog"
    width="480"
    destroy-on-close
  >
    <template #header>
      <div class="flex min-w-0 flex-col gap-4">
        <span class="media-dialog__eyebrow">
          <PhFlagBanner :size="12" weight="fill" aria-hidden="true" />
          // Запуск турніру
        </span>
        <h2 class="media-dialog__title">{{ bracket.name }}</h2>
      </div>
    </template>

    <div class="flex flex-col gap-14">
      <p class="media-dialog__text">
        Зареєстровано <b>{{ bracket.participantsCount }}</b> {{ playersWord }} → сітка на
        <b>{{ size }}</b> ({{ roundsWord }}<template v-if="byes">, {{ byes }} bye</template>).
        Реєстрація закриється, а бот одразу почне створювати лобі першого раунду.
      </p>

      <div class="flex flex-col gap-8" role="radiogroup" aria-label="Посів">
        <span class="media-dialog__label">Посів</span>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="radio"
          class="media-dialog__choice"
          :class="{ 'is-active': seeding === option.value }"
          :aria-checked="seeding === option.value"
          @click="seeding = option.value"
        >
          <component :is="option.icon" :size="20" weight="duotone" class="mt-2 shrink-0 text-[rgb(175,130,255)]" />
          <span class="flex min-w-0 flex-col gap-2">
            <span class="media-dialog__choice-title">{{ option.title }}</span>
            <span class="media-dialog__choice-text">{{ option.text }}</span>
          </span>
        </button>
      </div>

      <p class="media-dialog__hint">
        Скасувати старт не можна. Переконайтеся, що бот-хости онлайн — інакше матчі чекатимуть вільного бота.
      </p>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" class="media-dialog__primary" :loading="starting" @click="start">
        Згенерувати сітку й почати
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhChartLineUp, PhDiceFive, PhFlagBanner } from '@phosphor-icons/vue'
import type { Component } from 'vue'
import { duelBracketsService } from '@/views/media/media.service'
import { pluralizeUk } from '@/views/players/player-achievements.utils'
import type { TDuelBracket, TDuelBracketSeeding } from '@/api/types/api.types'

const props = defineProps<{
  bracket: TDuelBracket
  onStarted?: (bracket: TDuelBracket) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const seeding = ref<TDuelBracketSeeding>('random')
const starting = ref(false)

const options: Array<{ value: TDuelBracketSeeding; title: string; text: string; icon: Component }> = [
  {
    value: 'random',
    title: 'Випадковий',
    text: 'Пари визначає жереб — класика для стріму.',
    icon: PhDiceFive
  },
  {
    value: 'rating',
    title: 'За рейтингом дуелей',
    text: 'Найсильніші розведені по сітці й зустрінуться якомога пізніше; bye дістаються їм.',
    icon: PhChartLineUp
  }
]

const rounds = computed(() => Math.max(1, Math.ceil(Math.log2(Math.max(2, props.bracket.participantsCount)))))
const size = computed(() => 2 ** rounds.value)
const byes = computed(() => size.value - props.bracket.participantsCount)
const playersWord = computed(() => pluralizeUk(props.bracket.participantsCount, 'гравець', 'гравці', 'гравців'))
const roundsWord = computed(() => `${rounds.value} ${pluralizeUk(rounds.value, 'раунд', 'раунди', 'раундів')}`)

async function start () {
  if (starting.value) return
  starting.value = true
  try {
    props.onStarted?.(await duelBracketsService.start(props.bracket.id, seeding.value))
    modelValue.value = false
  } catch {
    // тост уже показав сервіс
  } finally {
    starting.value = false
  }
}
</script>

<style lang="scss" src="./media-dialog.scss"></style>
