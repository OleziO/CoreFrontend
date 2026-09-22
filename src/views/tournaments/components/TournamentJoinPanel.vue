<template>
  <div
    class="w-full bg-gray-900/70 backdrop-blur-xl border border-white/[0.08]
    rounded-2xl p-7 sm:p-8 shadow-xl shadow-black/30 ring-1 ring-white/[0.04]
    flex flex-col gap-6 sm:gap-7 transition-[box-shadow,border-color] duration-300"
  >
    <div class="lg:grid lg:grid-cols-2 h-full flex flex-col gap-5 sm:gap-8">
      <div
        class="bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
         flex flex-col items-center gap-1.5"
      >
        <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Призовий фонд</span>
        <div class="flex items-center gap-2 text-yellow-400 font-bold text-lg">
          <el-icon><Trophy /></el-icon>
          <span class="truncate">{{ formatTournamentPrizeUah(tournament?.prizePool) }}</span>
        </div>
      </div>

      <div
        class="bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
         flex flex-col items-center gap-1.5"
      >
        <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Дата початку</span>
        <div class="flex items-center gap-5 text-cyan-400 font-bold text-lg">
          <el-icon><Calendar /></el-icon>
          <span class="whitespace-nowrap truncate">
            {{ formatDate(new Date(tournament?.tournamentStartsAt as string)) }}
          </span>
        </div>
      </div>

      <div
        class="col-span-2 bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
         flex flex-col items-center gap-1.5"
      >
        <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Учасники</span>
        <div class="flex items-center gap-2 text-purple-400 font-bold text-lg">
          <el-icon><User /></el-icon>
          <span>
            <template v-if="!tournament?.tournamentSlots">
              Необмежено
            </template>
            <template v-else>
              <span>{{ tournament.teams?.length || 0 }}</span>
              <span class="text-gray-500 mx-2">/</span>
              <span>{{ tournament.tournamentSlots }}</span>
            </template>
          </span>
        </div>
      </div>

      <div
        v-if="entryFee && entryFee > 0"
        class="col-span-2 bg-black/25 rounded-xl p-8 sm:p-10 border border-white/[0.06]
         flex flex-col items-center gap-1.5"
      >
        <span class="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Вступний внесок</span>
        <div class="flex items-center gap-2 text-emerald-400 font-bold text-lg">
          <el-icon><Wallet /></el-icon>
          <span class="truncate">{{ formatEntryFeeUah(entryFee) }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <template v-if="token">
        <template v-if="captainJoinContextOk">
          <div
            v-if="paymentRequired"
            class="flex flex-col gap-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06]
             px-10 py-10 text-center"
          >
            <p class="text-sm font-semibold text-emerald-300">
              Необхідно сплатити вступний внесок — {{ formatEntryFeeUah(entryFee) }}
            </p>

            <template v-if="paymentPolling">
              <p class="flex items-center justify-center gap-4 text-xs text-gray-300">
                <el-icon class="animate-spin"><Loading /></el-icon>
                Очікуємо підтвердження оплати…
              </p>
              <p v-if="paymentReference" class="text-xs text-gray-400">
                Призначення платежу:
                <span class="font-mono font-semibold text-white">{{ paymentReference }}</span>
              </p>
              <div class="flex flex-col gap-4">
                <el-button type="primary" @click="emit('recheck')">
                  Перевірити зараз
                </el-button>

                <el-button
                  v-if="paymentPageUrl"
                  type="primary"
                  tag="a"
                  :href="paymentPageUrl"
                  target="_blank"
                  rel="noopener"
                >
                  Відкрити сторінку оплати monobank
                </el-button>
              </div>
            </template>

            <template v-else>
              <p v-if="myTeamPaymentStatus === 'UNDERPAID'" class="text-xs font-semibold text-amber-300">
                Сплачено {{ formatEntryFeeUah(myTeamAmountPaid) }} з {{ formatEntryFeeUah(entryFee) }}
              </p>

              <p class="text-xs leading-snug text-gray-400">
                {{ paymentStatusHint }}
              </p>

              <el-button
                type="primary"
                size="large"
                :loading="paymentIntentLoading"
                class="!h-[48px] !w-full !text-base !font-bold !rounded-xl border-none"
                @click="emit('pay')"
              >
                {{ myTeamPaymentStatus === 'UNDERPAID' ? 'Доплатити внесок' : 'Оплатити внесок' }}
              </el-button>
            </template>
          </div>
          <div v-else-if="showJoinPrimary" class="flex flex-col gap-3">
            <el-button
              type="primary"
              size="large"
              :loading="joinLoading"
              class="!h-[52px] !w-full !text-base !font-bold !rounded-xl
               !bg-gradient-to-br !from-cyan-500 !to-blue-500
               shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5
                transition-all border-none"
              @click="emit('join')"
            >
              Приєднатися до турніру
            </el-button>
          </div>
          <div
            v-else-if="isMyTeamInThisTournament"
            class="flex flex-col gap-10 rounded-xl border border-white/10 bg-black/25 px-10 py-10"
          >
            <p class="text-sm text-center leading-snug text-gray-300">
              {{ joinSecondaryHint }}
            </p>
            <el-button
              type="danger"
              plain
              size="large"
              :loading="leaveTournamentLoading"
              class="!h-[48px] !w-full !text-base !font-semibold !rounded-xl"
              @click="emit('leave')"
            >
              Покинути турнір
            </el-button>
          </div>
          <p
            v-else
            class="text-sm text-center px-10 leading-snug rounded-xl border border-white/10
             bg-black/25 py-10 text-gray-300"
          >
            {{ joinSecondaryHint }}
          </p>
        </template>
        <template v-else>
          <el-button
            v-if="inactiveTournamentBanner"
            :disabled="true"
            type="info"
            size="large"
            class="!h-[52px] !w-full !text-base !font-bold !rounded-xl !opacity-85"
          >
            {{ inactiveTournamentBanner }}
          </el-button>
          <p
            v-if="mutedQualificationsHintForLoggedUser"
            class="text-xs text-center text-gray-500 leading-snug px-14"
          >
            {{ mutedQualificationsHintForLoggedUser }}
          </p>
        </template>
      </template>

      <el-button
        v-else
        size="large"
        class="!h-[52px] !w-full !text-base !font-bold !rounded-xl !bg-white/10
         !border-white/10 !text-white hover:!bg-white/20 hover:!border-white/20
         backdrop-blur-md transition-all"
        tag="a"
        :href="`${apiBaseUrl}/api/v1/steam/login`"
      >
        <span class="flex items-center gap-5 justify-center">
          <PhSteamLogo :size="28" />
          Увійти через Steam
        </span>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy, Calendar, User, Wallet, Loading } from '@element-plus/icons-vue'
import { PhSteamLogo } from '@phosphor-icons/vue'
import { formatDate } from '@/core/helpers'
import { formatTournamentPrizeUah, formatEntryFeeUah } from '@/core/utils/formatters'

interface IProps {
  tournament: TTournament | null
  token: string | null
  captainJoinContextOk: boolean
  showJoinPrimary: boolean
  isMyTeamInThisTournament: boolean
  joinLoading: boolean
  leaveTournamentLoading: boolean
  joinSecondaryHint: string
  inactiveTournamentBanner: string
  mutedQualificationsHintForLoggedUser: string
  apiBaseUrl: string
  entryFee?: number | null
  paymentRequired: boolean
  myTeamPaymentStatus: TTournamentPaymentStatus | null
  myTeamAmountPaid: number
  paymentIntentLoading: boolean
  paymentPolling: boolean
  paymentReference: string | null
  paymentPageUrl: string | null
}

const props = defineProps<IProps>()

const paymentStatusHint = computed(() => {
  if (props.myTeamPaymentStatus === 'UNDERPAID') {
    return 'Отримано неповну оплату. Доплатіть різницю, щоб приєднатися до турніру.'
  }
  return 'Натисніть «Оплатити внесок» — відкриється сторінка оплати monobank, а сторінка чекатиме підтвердження.'
})

const emit = defineEmits<{
  join: []
  leave: []
  pay: []
  recheck: []
}>()
</script>
