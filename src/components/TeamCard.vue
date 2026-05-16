<template>
  <div
    class="group/card relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border
           bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950 shadow-[0_0_20px_rgba(0,0,0,0.45)]
           transition-all duration-300 ease-out hover:border-primary/60"
    :class="team.isVerified
      ? 'border-green-800 hover:shadow-green-800'
      : 'border-red-800 hover:shadow-red-800'"
    @click="goToTeamPage(team.id)"
  >
    <!-- Логотип з тими самими px-12 / pt-12, що й інші блоки картки -->
    <div class="shrink-0 px-12 pt-12">
      <div
        class="
          relative aspect-[8/7] w-full overflow-hidden rounded-xl border border-gray-700/55 bg-gray-950/55
          shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]
        "
      >
        <img
          v-if="teamLogoSrc && !logoLoadFailed"
          :src="teamLogoSrc"
          alt=""
          class="pointer-events-none h-full w-full select-none object-cover object-center"
          @error="logoLoadFailed = true"
        >
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/[0.07] to-black/25"
        >
          <PhUsersThree :size="64" weight="duotone" class="text-white/28" />
        </div>

        <el-tooltip
          :content="team.isVerified ? 'Верифікована команда' : 'Не верифікована'"
          placement="bottom"
          effect="dark"
          :show-after="140"
        >
          <div
            class="absolute bottom-10 right-10 z-[1] flex h-[30px] w-[30px] items-center justify-center rounded-full
                   shadow-md ring-2 ring-black/60"
            :class="team.isVerified ? 'bg-green-700 text-white' : 'bg-red-700 text-white'"
            @click.stop
          >
            <component
              :is="team.isVerified ? PhSealCheck : PhSealWarning"
              :size="16"
              weight="fill"
            />
          </div>
        </el-tooltip>
      </div>
    </div>

    <div class="flex shrink-0 flex-col items-center px-12 pt-10">
      <el-tooltip placement="top" :content="team.name" effect="dark">
        <h2
          class="line-clamp-2 w-full max-w-full px-2 text-center text-[15px] font-semibold leading-snug tracking-tight
                 text-white transition-colors duration-300 group-hover/card:text-primary"
        >
          {{ team.name }}
        </h2>
      </el-tooltip>

      <div
        v-if="showDivisionBadge || mainAvgRating != null"
        class="mt-8 grid w-full min-w-0 items-center gap-8 px-2"
        :class="showDivisionBadge && mainAvgRating != null
          ? 'grid-cols-[minmax(min-content,1fr)_auto]'
          : 'grid-cols-1 justify-items-center'"
        @click.stop
      >
        <div
          v-if="showDivisionBadge"
          :class="mainAvgRating != null ? 'min-w-0 justify-self-stretch' : 'justify-self-center'"
        >
          <DivisionTag
            v-if="resolvedDivisionKey"
            :division="resolvedDivisionKey"
            variant="card"
            full-width
          />
        </div>
        <el-tooltip
          v-if="mainAvgRating != null"
          placement="top"
          effect="dark"
          content="Середній рейтинг гравців основи"
        >
          <span
            class="inline-flex shrink-0 cursor-default items-center gap-5 rounded-md border border-white/[0.06]
                   bg-white/[0.04] px-8 py-4 text-[11px] tabular-nums text-gray-400"
          >
            <PhChartBar :size="13" weight="bold" class="text-gray-500" />
            <span class="font-semibold text-white/90">{{ mainAvgRating }}</span>
          </span>
        </el-tooltip>
      </div>
    </div>

    <!-- Один компактний блок: Dota ID + копія + Dotabuff (як на сторінці команди) -->
    <div class="mt-10 shrink-0 px-12">
      <div
        class="flex min-h-[36px] min-w-0 items-center justify-between gap-8 rounded-xl border border-gray-700/55
               bg-black/25 px-10 py-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
      >
        <div class="flex min-w-0 flex-1 items-center gap-8">
          <span class="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-600">
            Dota ID
          </span>
          <el-tooltip
            :disabled="!dotaTeamIdDisplay"
            content="Натисніть, щоб скопіювати"
            placement="top"
            effect="dark"
          >
            <button
              type="button"
              class="group/id flex min-w-0 flex-1 items-center gap-6 rounded-md border-0 bg-transparent p-0 text-left
                     outline-none transition-colors"
              :class="dotaTeamIdDisplay
                ? 'cursor-pointer text-gray-400 hover:text-primary'
                : 'cursor-default text-gray-600'"
              @click.stop="dotaTeamIdDisplay && copyDotaTeamId()"
            >
              <span class="min-w-0 truncate font-mono text-[11px] tabular-nums">
                {{ dotaTeamIdDisplay || '—' }}
              </span>
              <PhCopy
                v-if="dotaTeamIdDisplay"
                size="12"
                class="shrink-0 text-gray-600 opacity-70 transition-opacity group-hover/id:opacity-100"
              />
            </button>
          </el-tooltip>
        </div>

        <el-button
          v-if="dotaTeamIdDisplay"
          class="!size-30 shrink-0 hover:bg-white/10"
          tag="a"
          target="_blank"
          rel="noopener noreferrer"
          :href="getDotabuffTeamUrl(team.dotaTeamId)"
          title="Dotabuff"
          @click.stop
        >
          <Icon :size="14" name="dotabuff" />
        </el-button>
      </div>
    </div>

    <div
      class="mx-12 mt-10 shrink-0 border-t border-dashed"
      :class="team.isVerified ? 'border-green-800/45' : 'border-red-800/45'"
    />

    <div class="shrink-0 px-12 pb-12 pt-10">
      <el-badge
        :value="computedPlayersCount"
        :hidden="!computedPlayersCount"
        :offset="[-6, 2]"
        class="block w-full"
        type="primary"
      >
        <el-button
          type="primary"
          class="w-full !h-[38px] !rounded-xl !shadow-none"
          @click.stop="openTeamDrawer(team)"
        >
          <PhUsersThree size="16" weight="bold" />
          <span class="ml-8 text-[13px] font-semibold">
            Учасники
          </span>
        </el-button>
      </el-badge>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { routeNames } from '@/router/route-names'
import { useClipboard } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { PhChartBar, PhCopy, PhSealCheck, PhSealWarning, PhUsersThree } from '@phosphor-icons/vue'
import type { TTeam as FullTeam, TTeamResponse } from '@/api/types/api.types'
import { getDotabuffTeamUrl, resolvePublicOrApiUrl } from '@/core/helpers'
import {
  resolveTeamDivisionForDisplay,
  type TTournamentDivisionValue
} from '@/components/tournaments-tags/tournament.constants'

const props = withDefaults(defineProps<{
  team: TTeamResponse | FullTeam
  width?: number
  /** Тег дивізіону команди — лише на сторінці списку команд, не на вкладці «Команди» турніру. */
  showDivisionTag?: boolean
}>(), {
  showDivisionTag: false
})

const mainAvgRating = computed(() => {
  const mains = props.team.mainPlayers ?? []
  if (!mains.length) return null
  const sum = mains.reduce((acc, p) => acc + (Number(p.rating) || 0), 0)
  return Math.round(sum / mains.length)
})

const resolvedDivisionKey = computed((): TTournamentDivisionValue | null =>
  resolveTeamDivisionForDisplay(props.team.division, mainAvgRating.value)
)

const showDivisionBadge = computed(() => {
  return props.showDivisionTag && resolvedDivisionKey.value != null
})

const { copy } = useClipboard({ legacy: true })

const router = useRouter()

const { open } = useAppModals()

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(props.team.logoUrl))

const logoLoadFailed = ref(false)
watch(teamLogoSrc, () => {
  logoLoadFailed.value = false
})

const dotaTeamIdDisplay = computed(() => props.team.dotaTeamId?.trim() ?? '')

const computedPlayersCount = computed(
  () => (props.team.mainPlayers?.length ?? 0) + (props.team.reservedPlayers?.length ?? 0)
)

function copyDotaTeamId () {
  const id = dotaTeamIdDisplay.value
  if (!id) return
  copy(id)
  ElMessage.success('Dota ID скопійовано')
}

function openTeamDrawer (team: TTeamResponse | FullTeam) {
  open('TeamsPlayersDrawer', { team })
}

function goToTeamPage (id: string) {
  router.push({ name: routeNames.team, params: { id } })
}

</script>
