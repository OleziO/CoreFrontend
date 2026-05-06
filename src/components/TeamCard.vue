<template>
  <div

    class="group/card relative  flex h-[332px] w-full max-w-[280px]

          cursor-pointer flex-col rounded-2xl border bg-gradient-to-br

          from-gray-900 via-gray-850 to-gray-950 px-18 pb-18 pt-26

          shadow-[0_0_20px_rgba(0,0,0,0.5)]

          transition-all duration-300 ease-out

          hover:border-primary/60"

    :class="team.isVerified

      ? 'border-green-800 hover:shadow-green-800'

      : 'border-red-800 hover:shadow-red-800'"

    @click="goToTeamPage(team.id)"
  >
    <!-- Логотип: ті ж border / shadow-сигнали, що el-avatar у PlayerCard -->

    <div class="mb-17 flex shrink-0 justify-center">
      <div class="relative shrink-0">
        <div

          class="relative flex size-[84px] overflow-hidden rounded-2xl

                 border-2 border-gray-700 bg-gray-950/40 shadow-sm

                 transition-colors duration-300 ease-out group-hover/card:border-gray-600

                 [&_img]:pointer-events-none [&_img]:select-none"
        >
          <img

            v-if="teamLogoSrc"

            :src="teamLogoSrc"

            alt=""

            class="h-full w-full object-cover"
          >

          <div

            v-else

            class="flex h-full w-full items-center justify-center text-white/35"
          >
            <PhUsersThree :size="36" weight="duotone" />
          </div>
        </div>

        <el-tooltip

          :content="team.isVerified ? 'Верифікована команда' : 'Не верифікована'"

          placement="bottom"

          effect="dark"

          :show-after="160"
        >
          <div

            class="absolute -right-2 -top-10 z-[1] flex h-[24px] w-[24px]

                   items-center justify-center rounded-full

                   shadow-md ring-2 ring-[#16181f]"

            :class="team.isVerified

              ? 'bg-green-700 text-white'

              : 'bg-red-700 text-white'"

            @click.stop
          >
            <component

              :is="team.isVerified ? PhSealCheck : PhSealWarning"

              :size="13"

              weight="fill"
            />
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- Ієрархія як у PlayerCard: імʼя (h3-блок) → друга строка-деталь (Discord / Dota id) -->

    <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col text-center">
      <el-tooltip placement="top" :content="team.name" effect="dark">
        <h2

          class="w-full truncate text-[15px] font-semibold leading-tight tracking-tight

                 text-white transition-colors duration-300 group-hover/card:text-primary"
        >
          {{ team.name }}
        </h2>
      </el-tooltip>

      <div
        v-if="showDivisionBadge"
        class="mt-8 flex w-full justify-center px-8"
        @click.stop
      >
        <DivisionTag
          :division="team.division"
          variant="card"
          class="w-full max-w-[220px]"
        />
      </div>

      <span

        class="mt-11 text-[10px] font-medium uppercase leading-none tracking-[0.14em]

               text-gray-600"
      >

        Dota ID

      </span>

      <el-tooltip

        :disabled="!dotaTeamIdDisplay"

        content="Натисніть, щоб скопіювати ід команди"

        placement="top"

        effect="dark"
      >
        <button

          type="button"

          class="group/id relative mt-10 flex min-h-[38px] w-full items-center justify-center

                 rounded-xl border px-14 py-10 font-mono text-xs tabular-nums outline-none

                 transition-all duration-300 ease-out"

          :class="dotaTeamIdDisplay

            ? [

              'cursor-pointer',

              'border-gray-700/70',

              'bg-white/[0.03]',

              'text-gray-500',

              'hover:border-primary/45',

              'hover:bg-primary/[0.06]',

              'hover:text-primary',

              'focus-visible:border-primary/50',

              'focus-visible:ring-2 focus-visible:ring-primary/35',

            ]

            : [

              'cursor-default',

              'border-gray-700/35',

              'bg-transparent',

              'text-gray-600',

            ]"

          @click.stop="dotaTeamIdDisplay && copyDotaTeamId()"
        >
          <span class="mx-auto block min-w-0 max-w-[calc(100%-36px)] truncate text-center">

            {{ dotaTeamIdDisplay || '—' }}

          </span>

          <PhCopy

            v-if="dotaTeamIdDisplay"

            size="13"

            class="pointer-events-none absolute right-13 top-1/2 shrink-0 -translate-y-1/2

                   text-gray-600 opacity-60 transition-opacity duration-200

                   group-hover/id:text-primary group-hover/id:opacity-100"
          />
        </button>
      </el-tooltip>

      <div

        class="my-17 w-full shrink-0 border-t border-dashed px-px"

        :class="team.isVerified ? 'border-green-800/50' : 'border-red-800/50'"
      />

      <div class="mt-auto w-full shrink-0">
        <el-badge

          :value="computedPlayersCount"

          :hidden="!computedPlayersCount"

          :offset="[-6, 2]"

          class="block w-full"

          type="primary"
        >
          <el-button

            type="primary"

            class="w-full !h-[40px] !rounded-xl !shadow-none"

            @click.stop="openTeamDrawer(team)"
          >
            <PhUsersThree size="17" weight="bold" />

            <span class="ml-9 text-[13px] font-semibold">

              Учасники

            </span>
          </el-button>
        </el-badge>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { computed } from 'vue'

import { routeNames } from '@/router/route-names'

import { useClipboard } from '@vueuse/core'

import { ElMessage } from 'element-plus'

import {

  PhCopy,

  PhSealCheck,

  PhSealWarning,

  PhUsersThree

} from '@phosphor-icons/vue'

import type { TTeam as Team } from '@/api/types/api.types'

import { resolvePublicOrApiUrl } from '@/core/helpers'
import { TOURNAMENT_DIVISION_VALUES } from '@/components/tournaments-tags/tournament.constants'

const props = withDefaults(defineProps<{

  team: Team

  width?: number

  /** Тег дивізіону команди — лише на сторінці списку команд, не на вкладці «Команди» турніру. */
  showDivisionTag?: boolean

}>(), {

  showDivisionTag: false

})

const knownDivisionKeys = TOURNAMENT_DIVISION_VALUES as readonly string[]

const showDivisionBadge = computed(() => {
  const d = props.team.division
  return props.showDivisionTag && !!d && knownDivisionKeys.includes(d)
})

const { copy } = useClipboard({ legacy: true })

const router = useRouter()

const { open } = useAppModals()

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(props.team.logoUrl))

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

function openTeamDrawer (team: Team) {
  open('TeamsPlayersDrawer', { team })
}

function goToTeamPage (id: string) {
  router.push({ name: routeNames.team, params: { id } })
}

</script>
