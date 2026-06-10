<template>
  <div
    class="rounded-xl w-full bg-surface p-20 flex flex-col gap-20 relative
           border border-white/[0.08] transition-all duration-300 ease-out"
    :class="teamProfileCardShadowClass"
  >
    <div class="flex flex-col gap-14">
      <div class="flex items-start gap-16">
        <div class="relative mt-15 shrink-0">
          <el-avatar
            :size="118"
            shape="square"
            :src="teamLogoSrc ?? ''"
            class="!size-118 rounded-2xl bg-white/[0.06] ring-2 ring-gray-700
              shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          >
            <template #default>
              <PhUser :size="32" weight="bold" class="text-white/70" />
            </template>
          </el-avatar>

          <el-tooltip
            :content="team?.isVerified ? 'Верифікована команда' : 'Не верифікована'"
          >
            <StatusBadge
              v-if="team"
              :preset="team.isVerified ? 'verified' : 'unverified'"
              size="md"
              icon-only
              class="absolute -bottom-4 -right-4 ring-2 ring-gray-900"
            />
          </el-tooltip>
        </div>

        <div class="flex flex-1 min-w-0 flex-col gap-6 mt-15">
          <div class="flex flex-wrap items-center gap-10">
            <el-tooltip placement="top" :content="team?.name">
              <h1
                class="text-xl md:max-w-300 max-w-150 font-bold uppercase
                  whitespace-nowrap leading-tight truncate"
              >
                {{ team?.name }}
              </h1>
            </el-tooltip>
          </div>

          <div
            v-if="teamDivisionForDisplay"
            class="flex items-center"
          >
            <DivisionTag
              :division="teamDivisionForDisplay"
              variant="card"
            />
          </div>

          <div
            class="flex min-w-0 flex-nowrap items-center justify-between gap-10"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <span class="text-[10px] shrink-0 font-semibold uppercase tracking-[0.16em] text-gray-600">
                Dota ID
              </span>
              <button
                type="button"
                class="group/dota-id inline-flex min-w-0 max-w-full cursor-pointer items-center gap-8
                       rounded-lg border border-transparent px-8 py-4 font-mono text-xs tabular-nums
                       outline-none transition-all duration-200
                       hover:border-white/10 hover:bg-white/[0.04]"
                :class="dotaTeamIdTrimmed
                  ? 'text-gray-400 hover:text-primary'
                  : 'cursor-default text-gray-600'"
                @click="dotaTeamIdTrimmed && copyDotaTeamId()"
              >
                <span class="min-w-0 truncate">{{ dotaTeamIdTrimmed || '—' }}</span>
                <PhCopy
                  v-if="dotaTeamIdTrimmed"
                  size="14"
                  class="shrink-0 opacity-55 transition-opacity group-hover/dota-id:opacity-100"
                />
              </button>
            </div>
            <el-button
              v-if="team?.dotaTeamId?.trim()"
              class="!size-36 shrink-0 hover:bg-white/10"
              tag="a"
              target="_blank"
              rel="noopener noreferrer"
              :href="getDotabuffTeamUrl(team.dotaTeamId)"
              title="Dotabuff"
            >
              <Icon :size="16" name="dotabuff" />
            </el-button>
          </div>
        </div>
      </div>

      <div
        v-if="canEditTeamProfile || (isAdmin && team)"
        class="mt-12 flex w-full flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-12"
      >
        <el-button
          v-if="canEditTeamProfile"
          type="primary"
          class="h-30 w-full shrink-0 lg:flex-1 max-sm:text-xs max-sm:!px-8"
          @click="emit('edit-team')"
        >
          <PhPencil />
          <span class="ml-8">Редагувати{{ windowWidth > 650 ? ' команду' : '' }}</span>
        </el-button>

        <el-button
          v-if="isAdmin && team && !team.isVerified"
          type="success"
          class="h-30 w-full shrink-0 lg:flex-1 max-sm:text-xs max-sm:!px-8"
          :loading="verifyTeamLoading"
          @click="emit('verify-team')"
        >
          <PhSealCheck :size="20" class="shrink-0" />
          <span class="ml-8">Верифікувати команду</span>
        </el-button>

        <el-button
          v-else-if="isAdmin && team?.isVerified"
          type="warning"
          class="h-30 w-full shrink-0 lg:flex-1 max-sm:text-xs max-sm:!px-8"
          :loading="verifyTeamLoading"
          @click="emit('unverify-team')"
        >
          <PhSealWarning :size="20" class="shrink-0" />
          <span class="ml-8">Зняти верифікацію</span>
        </el-button>
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="flex flex-col gap-10">
      <el-dropdown
        v-if="canEditTeamRoster"
        trigger="click"
        :placement="isMobile ? 'left-start' : 'bottom'"
        popper-class="header-dropdown"
        class="absolute top-10 right-15 cursor-pointer text-white hover:text-white/50"
        @click.stop
      >
        <PhDotsThree size="26" weight="bold" @click.stop />

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-if="canVerifyPlayers"
              @click="emit('verify-players')"
            >
              <PhUserCheck :size="20" />
              <span class="ml-8">Верифікувати гравців</span>
            </el-dropdown-item>
            <el-dropdown-item @click="emit('transfer-captain')">
              <PhCrown :size="20" />
              <span class="ml-8">Передати капітанство</span>
            </el-dropdown-item>
            <el-dropdown-item
              class="header-user-menu__item--danger"
              divided
              @click="emit('disband-team')"
            >
              <PhTrash :size="20" />
              <span class="ml-8">Розпустити команду</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhCopy, PhCrown, PhDotsThree, PhPencil, PhSealCheck, PhSealWarning, PhTrash, PhUser, PhUserCheck
} from '@phosphor-icons/vue'
import { useClipboard } from '@vueuse/core'
import { resolvePublicOrApiUrl, getDotabuffTeamUrl } from '@/core/helpers'
import { resolveTeamDivisionForDisplay } from '@/components/tournaments-tags/tournament.constants'

const props = defineProps<{
  team: TTeam | null
  canEditTeamProfile: boolean
  canEditTeamRoster: boolean
  isAdmin: boolean
  canVerifyPlayers: boolean
  verifyTeamLoading: boolean
  isMobile: boolean
  windowWidth: number
}>()

const emit = defineEmits<{
  'edit-team': []
  'verify-players': []
  'verify-team': []
  'unverify-team': []
  'transfer-captain': []
  'disband-team': []
}>()

const { copy } = useClipboard({ legacy: true })

const teamLogoSrc = computed(() => resolvePublicOrApiUrl(props.team?.logoUrl))
const dotaTeamIdTrimmed = computed(() => props.team?.dotaTeamId?.trim() ?? '')

const mainRosterAvgRatingRounded = computed(() => {
  const mains = props.team?.mainPlayers ?? []
  if (!mains.length) return null
  const sum = mains.reduce((acc, p) => acc + (Number(p.rating) || 0), 0)
  return Math.round(sum / mains.length)
})

const teamDivisionForDisplay = computed(() =>
  props.team
    ? resolveTeamDivisionForDisplay(props.team.division, mainRosterAvgRatingRounded.value)
    : null
)

// Verification is now signaled by the StatusBadge (icon + label), so the card
// uses a neutral elevation — verified teams keep a subtle primary hover glow.
const teamProfileCardShadowClass = computed(() =>
  props.team?.isVerified
    ? 'shadow-elevation-3 hover:shadow-glow-primary'
    : 'shadow-elevation-3'
)

function copyDotaTeamId () {
  const id = dotaTeamIdTrimmed.value
  if (!id) return
  copy(id)
  ElMessage.success('Dota ID скопійовано')
}
</script>
