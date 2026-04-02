<template>
  <el-dialog
    v-model="modelValue"
    width="80%"
    class="!p-0 !bg-transparent !rounded-2xl overflow-hidden gaming-modal"
    :show-close="false"
    align-center
    destroy-on-close
  >
    <div
      class="relative border border-white/10 rounded-2xl
             shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden p-10"
    >
      <div
        class="relative flex items-center justify-between px-6 py-5
               border-b border-white/5 shrink-0 z-20"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <Dices :size="20" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white leading-none">{{ team.team_name }}</h3>
            <span class="text-xs text-gray-500 font-medium">Team #{{ team.id }}</span>
          </div>
        </div>

        <button
          class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          @click="modelValue = false"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto flex flex-col gap-5 custom-scrollbar relative p-10">
        <div
          class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]
        from-primary/5 via-transparent to-transparent pointer-events-none"
        />

        <div class="flex items-center justify-between relative z-10">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Users :size="14" />
            Склад команди
          </h3>
          <span class="text-xs font-mono text-gray-600 bg-white/5 px-5 py-0.5 rounded">
            {{ teamPlayers?.length || 0 }} / 5
          </span>
        </div>

        <div
          v-if="teamPlayers && teamPlayers.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-10"
        >
          <div
            v-for="entry in teamPlayers"
            :key="entry!.id"
            class="rounded-xl p-2 border border-white/5
                   hover:border-primary/30  hover:-translate-y-0.5
                   transition-all duration-300 shadow-sm"
          >
            <PlayerCard
              v-if="entry?.id"
              :player="entry"
              skip-team-fetch
              :show-regular-cap="false"
              class="!bg-transparent !shadow-none !border-none"
            />
          </div>
        </div>

        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center py-12
          border border-dashed border-white/10 rounded-xl bg-white/[0.02] relative z-10"
        >
          <div class="p-4 rounded-full bg-white/5 mb-3">
            <Users :size="32" class="text-gray-600" />
          </div>
          <p class="text-gray-400 font-medium">Гравців у команді не знайдено</p>
          <p class="text-xs text-gray-600 mt-1">Використовуйте рулетку нижче, щоб додати гравців</p>
        </div>
      </div>

      <div class="border-t p-10 border-white/10 shrink-0 w-full relative z-20">
        <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div class="w-full flex flex-col items-center justify-center py-6 relative overflow-hidden">
          <div
            v-if="roulettePlayers"
            class="w-full origin-bottom transform scale-[0.85] sm:scale-100 transition-transform duration-300"
          >
            <Roulette
              :players="roulettePlayers"
              :winnerPlayer="winnerPlayer"
              :on-roll-start="handleRollStart"
              :button-disabled="!canRoll || isRecruiting"
              :button-text="rollButtonText"
              @roll-complete="handleRollComplete"
            />
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>
<script setup lang="ts">

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()

const props = defineProps<{
  tournament: TMixTournament
}>()

const team = defineModel<TMixTeam>('team', { required: true })

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL
const winnerPlayer = ref<TPlayer | null>(null)
const isRecruiting = ref(false)

const poolColors: Record<string | number, string> = {
  null: '#7D7D7D',
  1: '#39FF88',
  2: '#40E0D0',
  3: '#FFD700',
  4: '#3FA1FC',
  5: '#FF4444'
}

const playersStore = usePlayersStore()

const playersMap = computed(() => {
  return new Map(playersStore.players.map(p => [p.id, p]))
})

// Получаем игроков команды из mix_pools
const teamPlayers = computed(() => {
  return team.value.slots.map(item => playersMap.value.get(item.player_id || 0) || null).filter(Boolean)
})

// Преобразуем mix_pools в формат для рулетки
const roulettePlayers = computed(() => {
  const mixPools = props.tournament.mix_pools || []

  return mixPools
    .map((entry: TMixPoolEntry) => {
      const player = playersMap.value.get(entry!.player_id)
      const poolKey = entry.pool ? entry.pool : 'null'
      const poolColor = poolColors[poolKey] || poolColors.null
      return {
        id: entry!.player_id,
        steam_name: player?.steam_name || '',
        mmr: player?.mmr || 0,
        color: {
          background: poolColor,
          border: poolColor
        },
        fullAvatarUrl: `${apiPublicUrl}${player?.avatar_url}`
      }
    })
})

// Функция вызывается перед запуском анимации рулетки (при нажатии на кнопку Roll)
const handleRollStart = async () => {
  if (isRecruiting.value) return

  try {
    isRecruiting.value = true
    winnerPlayer.value = null

    // Вызываем API для получения победителя
    const response = await mixTournamentsService.recruitPlayer(props.tournament.id)

    // Предполагаем, что API возвращает объект игрока с полем id
    if (response) {
      winnerPlayer.value = response
    }
  } finally {
    isRecruiting.value = false
  }
}

const mixStore = useMixTournamentStore()

// Получаем запись текущего пользователя (капитана команды)
const currentUserEntry = computed(() => {
  if (!authStore.user?.id || !props.tournament.mix_pools) return null
  return props.tournament.mix_pools.find(
    (entry: TMixPoolEntry) => entry.player_id === authStore.user?.id && entry.team_id === team.value.id
  )
})

// Проверяем количество использованных пулов
const mixPoolUsedCount = computed(() => {
  const entry = currentUserEntry.value
  if (!entry || !entry.mix_pool_used) return 0
  return entry.mix_pool_used.length
})

// Проверяем, можно ли еще делать ролл
const canRoll = computed(() => {
  return mixPoolUsedCount.value < 5
})

// Текст кнопки
const rollButtonText = computed(() => {
  if (isRecruiting.value) {
    return 'Rolling...'
  }
  if (!canRoll.value) {
    return 'Гравців відібрано'
  }
  return 'Roll'
})

const handleRollComplete = async () => {
  try {
    if (winnerPlayer.value) {
      await mixStore.getMixTournament(props.tournament.id)
    }
  } finally {
    isRecruiting.value = false
  }
}

</script>

<style scoped>
  /* Стили диалога Element Plus */
  :global(.gaming-modal .el-dialog__header) {
    display: none;
  }
  :global(.gaming-modal .el-dialog__body) {
    padding: 0 !important;
    height: 100%;
  }

  /* Кастомный скроллбар для списка игроков */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #0b0e14;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  </style>
