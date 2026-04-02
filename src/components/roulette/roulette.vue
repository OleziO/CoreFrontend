<!-- eslint-disable max-len -->
<template>
  <div class="w-full flex flex-col items-center justify-center font-['Poppins'] text-white relative">
    <div class="flex w-full justify-center relative py-8">
      <div class="container relative mx-auto w-full max-w-[1200px] px-4">
        <div class="absolute left-1/2 top-0 z-[30] flex -translate-x-1/2 justify-center text-center">
          <svg class="h-[5px] w-[100px]" viewBox="0 0 100 5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0.5L100 0.499999" stroke="url(#paint0_linear_307_2149)" />
            <path d="M54.5764 -1.26122e-07L45.3387 -1.59643e-08C44.8761 -1.04472e-08 44.6616 0.5743 45.011 0.877585L49.445 4.7266C49.6275 4.88494 49.897 4.89025 50.0855 4.73921L54.889 0.89019C55.2577 0.594769 55.0488 -1.31756e-07 54.5764 -1.26122e-07Z" fill="white" />
            <defs>
              <linearGradient id="paint0_linear_307_2149" x1="5.96244e-09" y1="1" x2="100" y2="0.999999" gradientUnits="userSpaceOnUse">
                <stop stop-color="white" stop-opacity="0" />
                <stop offset="0.619792" stop-color="white" />
                <stop offset="1" stop-color="white" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="flex h-[250px] w-full justify-center">
          <svg viewBox="0 0 44 180" class="-mt-[11px] min-h-[268px] min-w-[40px] fill-[#040507] shrink-0">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16 0C7.16344 0 0 7.16344 0 16V70C11.0457 70 20 78.9543 20 90C20 101.046 11.0457
              110 0 110V164C0 172.837 7.16344 180 16
              180H42V156H44V144H42V136H44V124H42V116H44V104H42V96H44V84H42V76H44V64H42V56H44V44H42V36H44V24H42V16H44V4H42V0H16Z"
            />
          </svg>

          <div class="w-full overflow-hidden relative">
            <div class="relative mx-auto flex w-full items-center justify-center overflow-hidden h-full">
              <div ref="containerRef" class="relative flex h-[246px] min-h-[246px] w-full items-center bg-[#1b1b21]">
                <div
                  class="absolute bottom-0 left-0 top-0 z-20
                        w-[20%] bg-gradient-to-r from-[#0b0e14] to-transparent pointer-events-none"
                />
                <div
                  class="absolute bottom-0 right-0 top-0 z-20
                        w-[20%] bg-gradient-to-l from-[#0b0e14] to-transparent pointer-events-none"
                />

                <div
                  class="relative flex w-max items-center gap-[1px]"
                  :style="{
                    transform: `translateX(${currentTranslateX}px)`,
                    transition: transitionDuration,
                    willChange: 'transform'
                  }"
                >
                  <div
                    v-for="(item, index) in reelItems"
                    :key="index"
                    class="item-box relative flex flex-col items-center justify-center transition-all duration-500"
                    :class="{
                      'scale-110 z-[25]': (index === WIN_INDEX && showWinHighlight),
                      'z-[25] scale-105': index === highlightIndex && !(index === WIN_INDEX && showWinHighlight)
                    }"
                  >
                    <div class="flex">
                      <div
                        class="relative flex h-[196px] w-[163px] flex-col
                            items-center justify-center gap-[15px] overflow-hidden
                            rounded-[6px] border border-solid bg-[#1a1a20] text-[14px] font-normal text-[#93979c]"
                        :style="{ borderColor: item.color.border }"
                      >
                        <div
                          class="absolute left-1/2 top-[18px]
                              h-[85px] w-[85px] -translate-x-1/2 rounded-full blur-[64px]"
                          :style="{ backgroundColor: item.color.background }"
                        />

                        <div class="relative">
                          <img
                            :src="item.fullAvatarUrl"
                            class="relative z-[9] h-[80px] w-[80px] rounded-full object-cover shadow-sm"
                            :alt="item.steam_name"
                          >
                        </div>

                        <div
                          class="relative flex-col items-center
                              justify-center gap-[2px] text-center text-[15px]
                              font-bold leading-normal tracking-[-0.3px] text-white px-2"
                          :class="(index === WIN_INDEX && showWinHighlight) ? 'flex' : 'hidden'"
                        >
                          <span class="truncate max-w-[140px]">{{ item.steam_name }}</span>
                          <span class="text-[12px] font-medium leading-[20px] tracking-[-0.24px] text-[#cbcbdd]">
                            {{ item.mmr }} MMP
                          </span>
                        </div>

                        <div class="absolute bottom-0 left-1/2 h-[2px] w-[55px] -translate-x-1/2 rounded-[6px]">
                          <div class="h-full w-full" :style="{ backgroundColor: item.color.background }" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <svg viewBox="0 0 44 180" class="-mt-[11px] min-h-[268px] min-w-[40px] fill-[#040507] shrink-0">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M28 0C36.8366 0 44 7.16344 44 16V70C32.9543 70 24 78.9543 24 90C24 101.046 32.9543 110 44 110V164C44
              172.837 36.8366 180 28
              180H2V156H0V144H2V136H0V124H2V116H0V104H2V96H0V84H2V76H0V64H2V56H0V44H2V36H0V24H2V16H0V4H2V0H28Z"
            />
          </svg>
        </div>
      </div>
    </div>

    <button
      class="mt-4 rounded-[30px] px-[50px] py-3 text-[16px] font-semibold text-white transition"
      :class="buttonDisabled || isRolling
        ? 'bg-[#1a1d23] text-gray-500 cursor-not-allowed'
        : 'bg-[#282d32] cursor-pointer hover:bg-[#32383e] hover:scale-105 active:scale-95'"
      :disabled="buttonDisabled || isRolling"
      @click="startRoll"
    >
      {{ buttonText }}
    </button>

    <audio ref="audioRef" :src="rollSound" />
    <audio ref="audioWinRef" :src="winSound" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

// Вставьте ваши импорты звуков и данных обратно, если они нужны
// import { tournamentData } from './mock-data'
// import rollSound from './reel-1.mp3'
// import winSound from './basic_win.mp3'

export type TRoulettePlayer = {
  id: number
  steam_name: string
  mmr: number | null
  color: { background: string; border: string }
  fullAvatarUrl: string
}

const props = withDefaults(defineProps<{
  players?: TRoulettePlayer[]
  winnerPlayer?: TPlayer | null
  onRollStart?: () => Promise<void> | void
  buttonDisabled?: boolean
  buttonText?: string
}>(), {
  players: undefined,
  winnerPlayer: null,
  onRollStart: undefined,
  buttonDisabled: false,
  buttonText: 'Roll'
})

// Вставьте ваши импорты звуков и данных обратно, если они нужны
const rollSound = ''
const winSound = ''

// !!! ВАЖНО: Эта константа должна совпадать с шириной карточки в CSS (163px + 1px gap)
const CARD_WIDTH = 164
const TOTAL_ITEMS = 70
const WIN_INDEX = 60
const DURATION_SECONDS = 8
const DURATION_MS = DURATION_SECONDS * 1000

const reelItems = ref<TRoulettePlayer[]>([])
const currentTranslateX = ref(0)
const isRolling = ref(false)
const test = ref(false)
const highlightIndex = ref<number | null>(null)
const transitionDuration = ref('none')
const showWinHighlight = ref(false)
const allPlayersList = ref<TRoulettePlayer[]>([])

const audioRef = ref<HTMLAudioElement | null>(null)
const audioWinRef = ref<HTMLAudioElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// --- Logic (Оставляем 1 в 1 как в оригинале) ---

const processData = (): TRoulettePlayer[] => {
  if (props.players && props.players.length > 0) {
    return props.players
  }
  // Fallback для обратной совместимости
  const players: TRoulettePlayer[] = []
  for (let i = 0; i < 10; i++) {
    players.push({ id: i, steam_name: `Player ${i}`, mmr: 1000 + i * 10, color: { background: '#39FF88', border: '#39FF88' }, fullAvatarUrl: 'https://via.placeholder.com/80' })
  }
  return players
}

const getRandomPlayer = (): TRoulettePlayer | null => {
  if (!allPlayersList.value.length) return null
  return allPlayersList.value[Math.floor(Math.random() * allPlayersList.value.length)]
}

const getWinner = (): TRoulettePlayer | null => {
  if (props.winnerPlayer && allPlayersList.value.length > 0) {
    const winner = allPlayersList.value.find(p => p.id === props.winnerPlayer?.id)
    return winner || getRandomPlayer()
  }
  return getRandomPlayer()
}

const prepareReel = (winningItem: TRoulettePlayer | null) => {
  const newReel: TRoulettePlayer[] = []
  if (!winningItem) return
  for (let i = 0; i < TOTAL_ITEMS; i++) {
    if (i === WIN_INDEX) {
      newReel.push(winningItem)
    } else {
      const randomPlayer = getRandomPlayer()
      if (randomPlayer) {
        newReel.push(randomPlayer)
      }
    }
  }
  reelItems.value = newReel
}

const winner = ref<TRoulettePlayer | null>(null)

const startRoll = async () => {
  if (isRolling.value) return

  // Вызываем переданную функцию перед запуском анимации (для вызова API)
  if (props.onRollStart) {
    await props.onRollStart()
  }

  isRolling.value = true
  showWinHighlight.value = false
  highlightIndex.value = null
  test.value = false
  transitionDuration.value = 'none'
  currentTranslateX.value = 0

  winner.value = getWinner()
  prepareReel(winner.value)

  await nextTick()

  if (audioRef.value) {
    audioRef.value.currentTime = 0
    audioRef.value.play().catch(() => {})
  }

  setTimeout(() => {
    if (!containerRef.value) return

    const containerWidth = containerRef.value.offsetWidth
    const winnerCenterPosition = (WIN_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2)
    const viewPortCenter = containerWidth / 2
    const randomJitter = Math.floor(Math.random() * 100) - 50

    const finalPosition = -(winnerCenterPosition - viewPortCenter + randomJitter)

    currentTranslateX.value = finalPosition
    transitionDuration.value = `transform ${DURATION_SECONDS}s cubic-bezier(0.1, 0.1, 0.25, 1.0)`
    test.value = true

    requestAnimationFrame(trackHighlightPosition)

    setTimeout(() => {
      isRolling.value = false
      transitionDuration.value = 'transform 0.2s ease-out'
    }, DURATION_MS)
  }, 50)
}

const trackHighlightPosition = () => {
  if (!isRolling.value && !test.value) return

  if (containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    const centerLine = containerRect.left + containerRect.width / 2
    const items = containerRef.value.querySelectorAll('.item-box')

    items.forEach((item: Element, index: number) => {
      const rect = item.getBoundingClientRect()
      if (rect.right < containerRect.left || rect.left > containerRect.right) return

      const itemCenter = rect.left + rect.width / 2
      const distance = Math.abs(centerLine - itemCenter)

      if (distance < 50) {
        highlightIndex.value = index
      }
    })
  }
  requestAnimationFrame(trackHighlightPosition)
}

watch(() => [props.players, props.winnerPlayer?.id], () => {
  if (props.players && props.players.length > 0) {
    allPlayersList.value = processData()
  }
}, { immediate: true })

onMounted(() => {
  allPlayersList.value = processData()
  prepareReel(getRandomPlayer())
})

const emit = defineEmits(['rollComplete'])

watch(test, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      showWinHighlight.value = true
      if (audioWinRef.value) {
        audioWinRef.value.currentTime = 0
        audioWinRef.value.play().catch(() => {})
      }
      // Вызываем событие после завершения анимации
      emit('rollComplete')
      // Информация о победителе остается видимой до следующего ролла
    }, DURATION_MS + 200)
  }
})

// Экспортируем метод, чтобы родитель мог его дернуть
defineExpose({ startRoll, isRolling })
</script>
