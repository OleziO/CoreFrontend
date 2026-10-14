<template>
  <div
    class="join-panel hud-corners hud-corners--fade w-full rounded-2xl p-20 sm:p-24
    flex flex-col gap-16 sm:gap-20"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0" aria-hidden="true" />

    <!-- Показники: приз — головне число панелі, рейка дата/учасники, квиток внеску -->
    <div class="join-stats">
      <div class="join-stats__prize join-stats__cell" :class="{ 'is-empty': !hasPrize }">
        <span class="join-stats__prize-icon" aria-hidden="true">
          <PhTrophy :size="22" weight="duotone" />
        </span>
        <div class="flex min-w-0 flex-1 flex-col gap-5">
          <span class="join-stats__label" :class="hasPrize ? 'join-stats__label--gold' : ''">
            Призовий фонд
          </span>
          <span class="join-stats__prize-value truncate">{{ prizeLabel }}</span>
        </div>
      </div>

      <div class="join-stats__row">
        <div class="join-stats__cell">
          <span class="join-stats__label">
            <PhCalendarBlank :size="12" weight="bold" />
            Дата початку
          </span>
          <span class="join-stats__value">{{ startLabel }}</span>
          <span class="join-stats__sub">{{ startRelativeLabel }}</span>
        </div>

        <div class="join-stats__cell">
          <span class="join-stats__label">
            <PhUsersThree :size="12" weight="bold" />
            Учасники
          </span>
          <span class="join-stats__value">
            <template v-if="!slots">Необмежено</template>
            <template v-else>
              {{ teamsCount }}<span class="join-stats__value-dim">/{{ slots }}</span>
            </template>
          </span>
          <!-- Заповненість слотів: до 16 — окремі поділки, більше — суцільна смуга -->
          <div
            v-if="slots"
            class="join-stats__sub join-stats__slots"
            :class="{ 'is-full': isFull }"
            role="progressbar"
            :aria-valuenow="teamsCount"
            :aria-valuemin="0"
            :aria-valuemax="slots"
            aria-label="Зайняті слоти"
          >
            <template v-if="slots <= SEGMENTED_SLOTS_MAX">
              <span
                v-for="index in slots"
                :key="index"
                class="join-stats__tick"
                :class="{ 'is-filled': index <= teamsCount }"
                :style="{ '--tick-index': index }"
              />
            </template>
            <span v-else class="join-stats__bar">
              <span class="join-stats__bar-fill" :style="{ transform: `scaleX(${fillRatio})` }" />
            </span>
          </div>
          <span v-else class="join-stats__sub">без обмеження слотів</span>
        </div>
      </div>

      <!-- Внесок як квиток: корінець з іконкою, перфорація, сума з гравця та з команди -->
      <div v-if="hasEntryFee" class="join-ticket join-stats__cell">
        <span class="join-ticket__stub" aria-hidden="true">
          <PhTicket :size="20" weight="duotone" />
        </span>
        <div class="join-ticket__body">
          <span class="join-stats__label join-stats__label--primary">Вступний внесок</span>
          <span class="join-ticket__value">
            <s v-if="isVip" class="join-ticket__old">{{ fullFeePerPlayerLabel }}</s>
            {{ feePerPlayerLabel }}
            <span class="join-ticket__unit">з гравця</span>
            <span v-if="isVip" class="join-ticket__vip">VIP −{{ VIP_TOURNAMENT_DISCOUNT_PERCENT }}%</span>
          </span>
          <span v-if="isVip" class="join-ticket__note">
            ({{ feePerTeamLabel }} з команди — VIP-ціна діє, коли внесок оплачує капітан із VIP)
          </span>
          <span v-else class="join-ticket__note">
            ({{ feePerTeamLabel }} з команди. Капітан оплачує повну суму за команду)
          </span>
          <button
            v-if="!isVip"
            type="button"
            class="join-ticket__upsell"
            @click="open('VipModal')"
          >
            <PhCrown :size="12" weight="fill" />
            З VIP — на {{ VIP_TOURNAMENT_DISCOUNT_PERCENT }}% дешевше
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-10">
      <template v-if="token">
        <template v-if="captainJoinContextOk">
          <div
            v-if="paymentRequired"
            class="flex flex-col gap-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06]
             px-10 py-10 text-center"
          >
            <p class="text-sm font-semibold text-emerald-300">
              Необхідно сплатити вступний внесок — {{ formatEntryFeeUah(dueFee) }}
              <span v-if="isVip" class="join-ticket__vip">VIP −{{ VIP_TOURNAMENT_DISCOUNT_PERCENT }}%</span>
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
                  Відкрити сторінку оплати
                </el-button>
              </div>
            </template>

            <template v-else>
              <p v-if="myTeamPaymentStatus === 'UNDERPAID'" class="text-xs font-semibold text-amber-300">
                Сплачено {{ formatEntryFeeUah(myTeamAmountPaid) }} з {{ formatEntryFeeUah(dueFee) }}
              </p>

              <p class="text-xs leading-snug text-gray-400">
                {{ paymentStatusHint }}
              </p>

              <el-button
                type="primary"
                size="large"
                :loading="paymentIntentLoading"
                class="btn-cta w-full"
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
              class="btn-cta w-full"
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
              class="btn-cta w-full"
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
            class="btn-cta w-full"
          >
            {{ inactiveTournamentBanner }}
          </el-button>
          <p v-if="mutedQualificationsHintForLoggedUser" class="join-panel__hint">
            <PhInfo :size="14" weight="bold" aria-hidden="true" />
            <span>{{ mutedQualificationsHintForLoggedUser }}</span>
          </p>
        </template>
      </template>

      <el-button
        v-else
        size="large"
        class="btn-cta w-full"
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
import { Loading } from '@element-plus/icons-vue'
import { PhSteamLogo, PhTrophy, PhCalendarBlank, PhUsersThree, PhTicket, PhInfo, PhCrown } from '@phosphor-icons/vue'
import { formatDate, isPlayerVip } from '@/core/helpers'
import { getVipEntryFee, VIP_TOURNAMENT_DISCOUNT_PERCENT } from '@/core/vip.constants'
import { formatEntryFeeUah } from '@/core/utils/formatters'
import { TEAM_SIZE } from '@/views/tournaments/tournaments.enums'

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

// Понад стільки слотів окремі поділки стають тоншими за 1px — переходимо на суцільну смугу.
const SEGMENTED_SLOTS_MAX = 16
const DAY_MS = 86_400_000

const hasPrize = computed(() => Number(props.tournament?.prizePool) > 0)
// Розряди через пробіл («12 000 грн») — як у картці списку: велике число читається з відстані.
const prizeLabel = computed(() =>
  hasPrize.value ? `${Number(props.tournament?.prizePool).toLocaleString('uk-UA')} грн` : 'Без призового'
)

const startDate = computed(() => {
  const starts = props.tournament?.tournamentStartsAt
  if (!starts) return null
  const date = new Date(starts)
  return Number.isNaN(date.getTime()) ? null : date
})
const startLabel = computed(() => (startDate.value ? formatDate(startDate.value) : '—'))

// «сьогодні» / «завтра» / «через 4 дні» — Intl сам відмінює; минуле — турнір уже йде.
const relativeDays = new Intl.RelativeTimeFormat('uk', { numeric: 'auto' })
const startRelativeLabel = computed(() => {
  if (!startDate.value) return ''
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(startDate.value) - startOfDay(new Date())) / DAY_MS)
  return days < 0 ? 'вже розпочався' : relativeDays.format(days, 'day')
})

const slots = computed(() => props.tournament?.tournamentSlots ?? 0)
const teamsCount = computed(() => props.tournament?.teams?.length ?? 0)
const isFull = computed(() => slots.value > 0 && teamsCount.value >= slots.value)
const fillRatio = computed(() => (slots.value ? Math.min(1, teamsCount.value / slots.value) : 0))

const authStore = useAuthStore()
const { open } = useAppModals()

const hasEntryFee = computed(() => !!props.entryFee && props.entryFee > 0)
/** VIP-перк: −10% на внесок (оплачує капітан, тож знижка — за його VIP; бек рахує так само). */
const isVip = computed(() => isPlayerVip(authStore.user))
const dueFee = computed(() => getVipEntryFee(props.entryFee ?? 0, isVip.value))
// `entryFee` — квиток команди в копійках; з гравця — п'ята частина (див. TEAM_SIZE).
const feePerPlayerLabel = computed(() => formatEntryFeeUah(dueFee.value / TEAM_SIZE))
const fullFeePerPlayerLabel = computed(() => formatEntryFeeUah((props.entryFee ?? 0) / TEAM_SIZE))
const feePerTeamLabel = computed(() => formatEntryFeeUah(dueFee.value))

const paymentStatusHint = computed(() => {
  if (props.myTeamPaymentStatus === 'UNDERPAID') {
    return 'Отримано неповну оплату. Доплатіть різницю, щоб приєднатися до турніру.'
  }
  return 'Натисніть «Оплатити внесок» — відкриється сторінка оплати, а ця сторінка чекатиме підтвердження.'
})

const emit = defineEmits<{
  join: []
  leave: []
  pay: []
  recheck: []
}>()
</script>

<style scoped lang="scss">
// ─── Панель ─────────────────────────────────────────────────────────────────
// Скло поверх банера героя: індиго-градієнт з розмиттям, ціанова волосина,
// світлова лінія зверху і золоте «повітря» за призом (шари фону — обидва
// псевдоелементи лишаються для `.hud-corners`), HUD-кутники з м'яким сяйвом.
.join-panel {
  position: relative;
  isolation: isolate;
  --hud-corner-size: 18px;
  --hud-corner-inset: 8px;
  --hud-corner-radius: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.6);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.45));
  background:
    linear-gradient(90deg, transparent 0%, rgba(var(--ds-primary-rgb), 0.6) 50%, transparent 100%)
      top / 100% 1px no-repeat,
    radial-gradient(ellipse 70% 45% at 18% 0%, rgba(var(--ds-gold-rgb), 0.1), transparent 70%),
    radial-gradient(ellipse 60% 50% at 100% 100%, rgba(var(--ds-primary-rgb), 0.08), transparent 70%),
    linear-gradient(160deg, rgba(20, 23, 41, 0.84) 0%, rgba(7, 8, 15, 0.9) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--ds-border);
  box-shadow: var(--ds-elevation-4), var(--ds-glow-primary-soft);
}

// Підказка-футер: волосина зверху прив'язує її до панелі, а не лишає плавати.
.join-panel__hint {
  @apply flex items-start justify-center gap-6 px-6 pt-12 text-center;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);

  svg {
    flex: none;
    margin-top: 1px;
    color: rgba(var(--ds-primary-rgb), 0.7);
  }
}

// ─── Показники ──────────────────────────────────────────────────────────────
.join-stats {
  @apply flex flex-col gap-14;
}

// Поява каскадом (60 мс між клітинками); під `prefers-reduced-motion`
// глушиться глобально в `_tokens.scss`.
@keyframes join-stat-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.join-stats__cell {
  @apply flex min-w-0 flex-col gap-5;
  animation: join-stat-in 320ms var(--ds-ease-out) both;
}

// Один реєстр підписів для всієї панелі: моно, капс, помірний трекінг.
.join-stats__label {
  @apply inline-flex items-center gap-5;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    flex: none;
    color: rgba(var(--ds-primary-rgb), 0.75);
  }

  &--gold {
    color: var(--ds-gold);
    text-shadow: var(--ds-neon-text-gold);
  }

  &--primary {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.join-stats__value {
  font-family: var(--ds-font-mono);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ds-text-strong);
}

.join-stats__value-dim {
  color: var(--ds-text-faint);
  font-weight: 600;
}

// Другий рядок клітинки (відлік / шкала слотів) — однакова висота, щоб
// обидві клітинки рейки стояли на одній базовій лінії.
.join-stats__sub {
  @apply flex items-center;
  min-height: 14px;
  font-size: 11px;
  line-height: 1.2;
  color: var(--ds-text-faint);
}

// ─── Рейка: дата / учасники ─────────────────────────────────────────────────
.join-stats__row {
  @apply grid grid-cols-1;

  .join-stats__cell {
    @apply py-8;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  .join-stats__cell:nth-child(1) {
    animation-delay: 60ms;
  }

  .join-stats__cell:nth-child(2) {
    animation-delay: 120ms;
  }

  // Від `xs` — один рядок: волосина між клітинками, а не під ними.
  @screen xs {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .join-stats__cell {
      @apply px-14 py-4;
      border-top: 0;
    }

    .join-stats__cell:first-child {
      padding-left: 0;
    }

    .join-stats__cell:last-child {
      padding-right: 0;
    }

    .join-stats__cell + .join-stats__cell {
      border-left: 1px solid rgba(255, 255, 255, 0.08);
    }
  }
}

// ─── Приз ───────────────────────────────────────────────────────────────────
// Головне число панелі: той самий золотий рецепт, що й у картці списку.
.join-stats__prize {
  @apply flex-row items-center gap-12 rounded-xl border px-14 py-12;
  border-color: rgba(var(--ds-gold-rgb), 0.3);
  background:
    linear-gradient(90deg, rgba(var(--ds-gold-rgb), 0.14), transparent 70%),
    rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-gold-rgb), 0.18);

  &.is-empty {
    border-color: rgba(var(--ds-primary-rgb), 0.14);
    background: rgba(0, 0, 0, 0.3);
    box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.1);
  }
}

.join-stats__prize-icon {
  @apply inline-flex size-44 shrink-0 items-center justify-center rounded-lg;
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.12);
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
  filter: drop-shadow(0 0 6px rgba(var(--ds-gold-rgb), 0.45));

  .is-empty & {
    color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    filter: none;
  }
}

.join-stats__prize-value {
  font-family: var(--ds-font-mono);
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-gold);
  text-shadow: var(--ds-neon-text-gold);

  .is-empty & {
    font-size: 16px;
    font-weight: 600;
    color: var(--ds-text-muted);
    text-shadow: none;
  }
}

// ─── Квиток внеску ──────────────────────────────────────────────────────────
// Внесок — це квиток команди, тож і виглядає як квиток: ціановий корінець з
// іконкою, пунктирна перфорація, два вирізи по краях (маска, а не заливка —
// панель скляна, суцільне коло тут виглядало б плямою).
.join-ticket {
  --ticket-stub: 58px;
  --ticket-notch: 7px;
  @apply flex-row items-stretch gap-0 rounded-xl border;
  animation-delay: 180ms;
  border-color: rgba(var(--ds-primary-rgb), 0.32);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.18);
  -webkit-mask:
    radial-gradient(circle var(--ticket-notch) at var(--ticket-stub) 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle var(--ticket-notch) at var(--ticket-stub) 100%, transparent 98%, #000)
      bottom / 100% 51% no-repeat;
  mask:
    radial-gradient(circle var(--ticket-notch) at var(--ticket-stub) 0, transparent 98%, #000) top / 100% 51% no-repeat,
    radial-gradient(circle var(--ticket-notch) at var(--ticket-stub) 100%, transparent 98%, #000)
      bottom / 100% 51% no-repeat;
}

.join-ticket__stub {
  @apply inline-flex shrink-0 items-center justify-center;
  width: var(--ticket-stub);
  color: var(--ds-primary);
  background: linear-gradient(180deg, rgba(var(--ds-primary-rgb), 0.16), rgba(var(--ds-primary-rgb), 0.08));
  border-right: 1px dashed rgba(var(--ds-primary-rgb), 0.45);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.5));
}

.join-ticket__body {
  @apply flex min-w-0 flex-1 flex-col gap-4 px-14 py-12;
}

.join-ticket__value {
  @apply inline-flex flex-wrap items-baseline gap-x-6;
  font-family: var(--ds-font-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

.join-ticket__unit {
  font-family: var(--ds-font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--ds-text-muted);
  text-shadow: none;
}

.join-ticket__note {
  font-size: 12px;
  line-height: 1.45;
  color: var(--ds-text-faint);
}

// VIP price: the full fee struck through, a gold «VIP −10%» chip; non-VIPs get a quiet upsell.
.join-ticket__old {
  font-size: 15px;
  font-weight: 500;
  color: var(--ds-text-faint);
  text-decoration-thickness: 1px;
}

.join-ticket__vip {
  @apply inline-flex items-center rounded-full px-8 py-2 align-middle;
  border: 1px solid rgba(255, 206, 84, 0.55);
  background: linear-gradient(110deg, rgba(255, 206, 84, 0.18), rgba(255, 94, 170, 0.14));
  font-family: var(--ds-font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(255, 222, 140);
}

.join-ticket__upsell {
  @apply mt-4 inline-flex w-fit cursor-pointer items-center gap-5 border-0 bg-transparent p-0 text-left;
  font-size: 12px;
  font-weight: 600;
  color: rgb(255, 214, 102);
  transition: color var(--ds-duration-fast) ease;

  &:hover {
    color: rgb(255, 230, 170);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 206, 84, 0.7);
    outline-offset: 2px;
  }
}

// ─── Заповненість слотів ────────────────────────────────────────────────────
.join-stats__slots {
  @apply w-full;
  gap: 3px;
}

.join-stats__tick,
.join-stats__bar {
  flex: 1;
  min-width: 0;
  height: 4px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.1);
}

// Зайняті поділки загоряються по черзі слідом за появою клітинки.
@keyframes join-tick-in {
  from {
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
}

.join-stats__tick {
  transition: background-color var(--ds-duration-base) ease, box-shadow var(--ds-duration-base) ease;

  &.is-filled {
    background: var(--ds-primary);
    box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.55);
    animation: join-tick-in 240ms ease-out both;
    animation-delay: calc(280ms + var(--tick-index, 0) * 40ms);
  }
}

.join-stats__bar {
  overflow: hidden;
}

// Масштаб замість width — анімація не чіпає layout.
.join-stats__bar-fill {
  display: block;
  height: 100%;
  transform-origin: left center;
  background: var(--ds-primary);
  box-shadow: 0 0 6px rgba(var(--ds-primary-rgb), 0.55);
  transition: transform 300ms var(--ds-ease-out);
}

// Повний склад — золото, як і призова мова: місць більше немає.
.join-stats__slots.is-full {
  .join-stats__tick.is-filled,
  .join-stats__bar-fill {
    background: var(--ds-gold);
    box-shadow: 0 0 6px rgba(var(--ds-gold-rgb), 0.55);
  }
}
</style>
