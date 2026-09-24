<template>
  <div
    class="neon-card hud-corners flex w-full flex-col rounded-2xl p-20"
  >
    <!-- HEADER: аватар + імена ліворуч, ранг праворуч на одній осі -->
    <div class="flex items-center justify-between gap-16">
      <!-- LEFT -->
      <div class="flex min-w-0 items-center gap-14">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <el-avatar
            size="large"
            :src="player.avatarUrl ?? ''"
            class="ring-2 ring-gray-800 shadow-md"
          >
            <template #default>
              <PhUser size="26" weight="bold" class="text-white/70" />
            </template>
          </el-avatar>

          <el-tooltip
            :content="isVerified ? 'Верифікований' : 'Не верифікований'"
          >
            <StatusBadge
              :preset="isVerified ? 'verified' : 'unverified'"
              size="sm"
              icon-only
              class="absolute -bottom-2 -right-2"
            />
          </el-tooltip>
        </div>

        <!-- Names -->
        <div class="flex min-w-0 flex-col gap-4">
          <div class="flex min-w-0 items-center gap-8">
            <h2 class="truncate font-display text-lg uppercase tracking-wide leading-tight text-white">
              {{ player.discordName || '-' }}
            </h2>

            <PlayerModerationTags class="shrink-0" :tags="playerTags" />
          </div>

          <span
            v-if="player.discordUsername"
            class="flex w-fit items-center gap-6 text-xs leading-none text-gray-400
                 hover:text-primary transition cursor-pointer"
            @click.stop="getCopy(player.discordUsername, 'Discord')"
          >
            @{{ player.discordUsername }}
            <PhCopy size="13" />
          </span>
        </div>
      </div>

      <!-- Ранг (картинка); рейтинг MMR — у tooltip. Плитка трохи вища за аватар,
           щоб правий край мав таку ж вагу, як лівий -->
      <el-tooltip
        :content="ratingMmrLabel"
        placement="top"
      >
        <div
          class="flex h-64 min-w-[84px] shrink-0 flex-col items-center justify-center gap-4
                 rounded-xl border border-primary/15 bg-black/30 px-14 cursor-default"
        >
          <img
            v-if="rankImageSrc"
            :src="rankImageSrc"
            alt=""
            class="h-36 w-auto max-w-[72px] object-contain select-none"
            width="72"
            height="36"
            loading="lazy"
            draggable="false"
          >
          <span
            v-else
            class="text-lg font-semibold leading-none text-white tabular-nums"
          >
            {{ player.rating }}
          </span>
          <div class="flex items-center gap-4">
            <span class="text-[11px] uppercase leading-none tracking-[0.14em] text-gray-400">Ранг</span>
            <el-tooltip
              v-if="pendingMmrRequest?.status === 'pending'"
              content="Запит на оновлення MMR обробляється"
              placement="top"
            >
              <PhInfo size="12" class="text-primary cursor-help shrink-0" />
            </el-tooltip>
          </div>
        </div>
      </el-tooltip>
    </div>

    <!-- ACTIONS: усі кнопки в одному рядку, ділять ширину картки порівну (крім квадратної «Редагувати» на телефоні) -->
    <div
      v-if="showAdminVerificationActions || showAdditionalInfo || (isProfilePage && !player.steamId)"
      class="mt-24 flex w-full flex-wrap items-center gap-10"
    >
      <el-button
        v-if="showAdminVerificationActions"
        :loading="verifyLoading"
        :type="isVerified ? 'warning' : 'success'"
        plain
        class="min-w-0 flex-1 max-sm:!px-8"
        @click="emit('toggleVerification')"
      >
        <component
          :is="isVerified ? PhSealWarning : PhSealCheck"
          class="mr-10 shrink-0"
          weight="bold"
          size="16"
        />

        {{ isVerified ? 'Зняти верифікацію' : 'Верифікувати' }}
      </el-button>

      <!-- На телефоні «Редагувати» — квадратна кнопка-іконка, щоб поруч влізла кнопка верифікації -->
      <el-dropdown
        v-if="showAdditionalInfo && canRequestMmr"
        trigger="click"
        class="min-w-0 flex-1 max-xs:flex-none"
      >
        <el-button
          type="primary"
          class="w-full max-sm:!px-8 max-xs:aspect-square max-xs:!px-0"
          aria-label="Редагувати профіль"
        >
          <PhPencil :size="16" class="mr-10 shrink-0 max-xs:mr-0" />
          <span class="max-xs:hidden">Редагувати{{ showFullLabel ? ' профіль' : '' }}</span>
          <PhCaretDown class="ml-8 shrink-0 opacity-70 max-xs:hidden" size="12" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="emit('editProfile')">
              Редагування основної інформації
            </el-dropdown-item>
            <el-dropdown-item @click="emit('requestMmr')">
              Змінити MMR
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        v-else-if="showAdditionalInfo"
        type="primary"
        class="min-w-0 flex-1 max-sm:!px-8 max-xs:aspect-square max-xs:flex-none max-xs:!px-0"
        aria-label="Редагувати профіль"
        @click="emit('editProfile')"
      >
        <PhPencil :size="16" class="mr-10 shrink-0 max-xs:mr-0" />
        <span class="max-xs:hidden">Редагувати{{ showFullLabel ? ' профіль' : '' }}</span>
      </el-button>

      <el-button
        v-if="isProfilePage && !player.steamId"
        :loading="linkingSteam"
        plain
        class="btn-steam min-w-0 flex-1 max-sm:!px-8"
        @click="emit('linkSteam')"
      >
        <Icon :size="20" name="steam" class="shrink-0" />
        <span class="ml-8">{{ linkingSteam ? 'Переходимо у Steam…' : "Прив'язати Steam" }}</span>
      </el-button>
    </div>

    <!-- Розпірка: притискає рядок ролей до низу, коли картку розтягує сусідня статистика -->
    <div class="min-h-[16px] flex-1" aria-hidden="true" />

    <!-- Ролі + посилання. Тег — ярлик і обіймає текст; іконки-посилання беруть
         компактний 32px розмір, щоб рядок мав одну висоту -->
    <div
      class="-mx-20 flex w-[calc(100%+40px)] flex-wrap items-center justify-between
        gap-x-16 gap-y-12 border-t border-primary/[0.12] px-20 pt-16"
    >
      <div class="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:thin]">
        <PlayerRoleTag
          :max="2"
          :user="player"
        />
      </div>

      <!-- Зовнішні профілі: HUD-плитки з фірмовими іконками, eyebrow і підказками -->
      <div
        v-if="profileLinks.length"
        class="flex shrink-0 items-center gap-10"
      >
        <span class="sys-label sys-label--muted hidden !text-[9px] xs:inline">Профілі</span>
        <ul class="profile-links">
          <li
            v-for="link in profileLinks"
            :key="link.name"
          >
            <el-tooltip
              :content="link.name"
              placement="top"
              effect="dark"
              :show-after="180"
            >
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="profile-link"
                :aria-label="`Профіль гравця в ${link.name}`"
              >
                <Icon :size="16" :name="link.icon" />
              </a>
            </el-tooltip>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhSealCheck,
  PhSealWarning,
  PhUser,
  PhPencil,
  PhCopy,
  PhCaretDown,
  PhInfo
} from '@phosphor-icons/vue'
import { getCopy } from '@/core/helpers'
import type { TIconName } from '@/components/Icon.vue'
import type { TTag } from '@/services/tags.types'

interface IProps {
  player: TPlayer
  playerTags: TTag[]
  isVerified: boolean
  rankImageSrc: string | null
  ratingMmrLabel: string
  verifyLoading: boolean
  showAdminVerificationActions: boolean
  showAdditionalInfo: boolean
  linkingSteam: boolean
  isProfilePage: boolean
  links: { discord: string | undefined; steam: string | undefined; dotabuff: string | undefined }
  canRequestMmr?: boolean
  pendingMmrRequest?: import('@/views/players/mmr-requests.service').TMmrUpdateRequest | null
}

const props = defineProps<IProps>()

const emit = defineEmits<{
  toggleVerification: []
  editProfile: []
  linkSteam: []
  requestMmr: []
}>()

const windowSize = useWindowSize()
const showFullLabel = computed(() => windowSize.width.value > 650)

interface IProfileLink {
  name: string
  url: string
  icon: TIconName
}

/** Зовнішні профілі гравця — лише ті, для яких є прив'язаний акаунт і URL. */
const profileLinks = computed<IProfileLink[]>(() => {
  const items: IProfileLink[] = []
  const { steamId, discordId } = props.player
  const { steam, dotabuff, discord } = props.links

  if (steamId && steam) items.push({ name: 'Steam', url: steam, icon: 'steam' })
  if (steamId && dotabuff) items.push({ name: 'Dotabuff', url: dotabuff, icon: 'dotabuff' })
  if (discordId && discord) items.push({ name: 'Discord', url: discord, icon: 'discord' })

  return items
})
</script>

<style scoped lang="scss">
// External-profile tiles: 32px dark wells with a cyan hairline, so the row of
// brand marks reads as HUD chips rather than loose icons. Brand SVGs keep their
// own fills; the Discord mark (currentColor) inherits the white/primary text.
.profile-links {
  @apply m-0 flex list-none items-center gap-6 p-0;
}

.profile-link {
  @apply inline-flex size-32 items-center justify-center rounded-lg border no-underline;
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(var(--ds-primary-rgb), 0.16);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.12);
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.55);
    outline-offset: 2px;
  }
}

@media (hover: hover) and (pointer: fine) {
  .profile-link:hover {
    color: var(--ds-primary);
    border-color: rgba(var(--ds-primary-rgb), 0.5);
    box-shadow: inset 0 1px 0 rgba(var(--ds-primary-rgb), 0.2), var(--ds-glow-primary-soft);
    transform: translateY(-1px);
  }
}
</style>
