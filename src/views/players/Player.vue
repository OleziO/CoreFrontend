<template>
  <div
    v-loading.fullscreen="loading"
    class="w-full relative overflow-y-auto px-20 lg:px-40"
  >
    <div
      class="mx-auto flex flex-col 2md:justify-center items-center py-20 relative"
    >
      <!-- Загальний контейнер для всіх карточок -->
      <div class="w-full xl:max-w-[1040px] flex flex-col gap-24 relative">
        <AppBackButton />

        <!-- ================= PLAYER CARD ================= -->
        <div class="flex gap-20 flex-wrap 2lg:flex-nowrap nm:pt-60 pt-20">
          <div
            v-if="player"
            class="
            relative w-full
            rounded-2xl flex flex-col justify-between
            border border-gray-800/80
            bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
            p-20
            shadow-[0_15px_40px_rgba(0,0,0,0.45)]
          "
          >
            <!-- HEADER -->
            <div class="flex mt-10 items-center justify-between gap-20 px-10">
              <!-- LEFT -->
              <div class="flex items-center gap-16 min-w-0">
                <!-- Avatar -->
                <div class="relative">
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
                    <div
                      class="absolute -bottom-4 -right-4 flex h-20 w-20 items-center justify-center
                   rounded-full ring-2 ring-gray-900"
                      :class="isVerified ? 'bg-green-600' : 'bg-red-600'"
                    >
                      <component
                        :is="isVerified ? PhSealCheck : PhSealWarning"
                        size="12"
                        weight="fill"
                      />
                    </div>
                  </el-tooltip>
                </div>

                <!-- Names -->
                <div class="min-w-0">
                  <h2 class="truncate text-lg font-semibold text-white">
                    {{ player.discordName || '-' }}
                  </h2>

                  <span
                    v-if="player.discordUsername"
                    class="mt-4 flex w-fit items-center gap-6 text-xs text-gray-400
                 hover:text-primary transition cursor-pointer"
                    @click.stop="getCopy(player.discordUsername, 'Discord скопійовано')"
                  >
                    @{{ player.discordUsername }}
                    <PhCopy size="13" />
                  </span>
                </div>
              </div>

              <!-- Ранг (картинка); рейтинг MMR — у tooltip -->
              <el-tooltip
                v-if="rankImageSrc"
                :content="ratingMmrLabel"
                placement="top"
              >
                <div class="flex flex-col items-center shrink-0 cursor-default">
                  <img
                    :src="rankImageSrc"
                    alt=""
                    class="h-36 w-auto object-contain select-none"
                    width="64"
                    height="36"
                    loading="lazy"
                    draggable="false"
                  >
                  <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Рейтинг</span>
                </div>
              </el-tooltip>
              <el-tooltip
                v-else
                :content="ratingMmrLabel"
                placement="top"
              >
                <div class="flex flex-col items-center shrink-0">
                  <span class="text-lg font-semibold text-white tabular-nums">{{ player.rating }}</span>
                  <span class="mt-2 text-[10px] uppercase tracking-widest text-gray-400">Рейтинг</span>
                </div>
              </el-tooltip>
            </div>

            <div class="flex w-full flex-col gap-10 mt-20 p-8">
              <div class="flex w-full gap-10">
                <el-button
                  v-if="showAdminVerificationActions"
                  :loading="verifyLoading"
                  :type="isVerified ? 'warning' : 'success'"
                  class="h-30 flex-1 shrink-0 max-sm:text-xs max-sm:!px-8"
                  @click="togglePlayerVerification"
                >
                  <component
                    :is="isVerified ? PhSealWarning : PhSealCheck"
                    class="mr-8 shrink-0"
                    weight="bold"
                    size="16"
                  />

                  {{ isVerified ? 'Зняти верифікацію' : 'Верифікувати' }}
                </el-button>

                <el-button
                  v-if="showAdditionalInfo"
                  type="primary"
                  class="h-30 flex-1 shrink-0 max-sm:text-xs max-sm:!px-8"
                  :class="{ 'w-full': !showAdminVerificationActions }"
                  @click="openEditProfileModal"
                >
                  <PhPencil />

                  <span class="ml-8">Редагувати {{ window.width.value > 650 ? ' профіль' : '' }}</span>
                </el-button>
              </div>

              <el-button
                v-if="isProfilePage && !player.steamId"
                :loading="linkingSteam"
                class="h-30 w-full"
                @click="handleSteamLink"
              >
                <Icon :size="16" name="steam" />

                <span class="ml-8">
                  Прив'язати Steam
                </span>
              </el-button>
            </div>

            <!-- Ролі + посилання (висота тегів як на картці; кнопки трохи вищі — по центру рядка) -->
            <div
              class="-mx-20 flex w-[calc(100%+40px)] flex-wrap items-center justify-between
                gap-x-88 gap-y-32 border-t border-gray-800/60 px-20 pt-16 md:flex-nowrap"
            >
              <div
                class="flex min-w-0 flex-1 items-center overflow-x-auto px-12 [scrollbar-width:thin]"
              >
                <PlayerRoleTag
                  v-if="player"
                  stretch-in-grid
                  :user="player"
                />
              </div>

              <div
                class="flex shrink-0 items-center justify-end gap-10
                  max-sm:w-full max-sm:justify-end max-sm:flex-wrap"
              >
                <el-button
                  v-if="player.steamId"
                  class="!size-36 shrink-0 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.steam"
                >
                  <Icon :size="16" name="steam" />
                </el-button>

                <el-button
                  v-if="player.steamId"
                  class="!size-36 shrink-0 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.dotabuff"
                >
                  <Icon :size="16" name="dotabuff" />
                </el-button>

                <el-button
                  v-if="player.discordId"
                  class="!size-36 shrink-0 hover:bg-white/10"
                  tag="a"
                  target="_blank"
                  :href="links.discord"
                >
                  <Icon :size="16" name="discord" />
                </el-button>
              </div>
            </div>
          </div>

          <!-- Статистика матчів -->
          <div
            class="
              rounded-2xl
              border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
              p-20 2md:p-24
              shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
              flex flex-col items-stretch gap-16
            "
          >
            <h3
              class="text-center text-[14px] font-medium uppercase tracking-[0.22em] text-gray-500"
            >
              Статистика
            </h3>

            <div
              class="
                grid w-full grid-cols-2 gap-10 mt-20
                2md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1fr)]
                2md:items-stretch 2md:gap-10
              "
            >
              <!-- Матчі: на мобільному на всю ширину; перемоги та поразки — в один рядок під ним -->
              <div
                class="col-span-2 2md:col-span-1 2md:min-w-0
                  group flex min-h-0 min-w-0 flex-col
                "
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                        tracking-widest text-gray-500"
                  >
                    Матчі
                  </span>

                  <p
                    class="inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-1.5
                      text-center text-base font-medium tabular-nums leading-none tracking-tight
                      text-white/95"
                  >
                    <span>{{ matchStats.total }}</span>
                    <span :class="matchStats.winrateClass">
                      ({{ matchStats.winrateText }}%)
                    </span>
                  </p>
                </div>
              </div>

              <!-- Перемоги -->
              <div
                class="2md:min-w-0 group flex min-w-0 flex-col"
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                      tracking-widest text-gray-500"
                  >
                    Перемоги
                  </span>
                  <span
                    class="text-base font-medium tabular-nums leading-none
                      text-green-300/90"
                  >
                    {{ matchStats.wins }}
                  </span>
                </div>
              </div>

              <!-- Поразки -->
              <div
                class="2md:min-w-0 group flex min-w-0 flex-col"
              >
                <div
                  class="
                    flex h-full min-h-[96px] flex-col items-center justify-center
                    gap-8 rounded-xl border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-14 py-16
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200
                    hover:-translate-y-px hover:border-white/15
                  "
                >
                  <span
                    class="text-center text-[10px] font-medium uppercase leading-tight
                      tracking-widest text-gray-500"
                  >
                    Поразки
                  </span>
                  <span
                    class="text-base font-medium tabular-nums leading-none
                      text-red-300/90"
                  >
                    {{ matchStats.losses }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Улюблені герої (OpenDota + Steam CDN) -->
        <div
          class="
            rounded-xl !px-[50px]
            border border-gray-800/90
            bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90
            p-12 2md:p-14
            shadow-[0_10px_30px_rgba(0,0,0,0.35)] w-full
            flex flex-col items-stretch gap-10
          "
        >
          <h3
            class="flex items-center justify-center gap-2 text-center text-[11px]
              font-medium uppercase tracking-[0.18em] text-gray-500"
          >
            Улюблені герої
            <el-tooltip
              placement="top"
              effect="dark"
              :show-after="180"
              content="Дані беруться з OpenDota і можуть бути неактуальними."
            >
              <PhQuestion
                class="cursor-help text-gray-500"
                weight="bold"
                :size="14"
              />
            </el-tooltip>
          </h3>

          <!-- Steam не прив'язано: легкий стан, не помилка -->
          <p
            v-if="!favoriteHeroesHasAccount"
            class="text-center text-sm text-gray-500 py-10"
          >
            Steam не прив'язано — улюблені герої недоступні.
          </p>

          <!-- Завантаження: скелет тієї ж сітки/розміру, без стрибків layout -->
          <div
            v-else-if="favoriteHeroesPending"
            class="grid grid-cols-3 gap-[20px]"
          >
            <div
              v-for="i in favoriteHeroesSkeletons"
              :key="i"
              class="min-h-[88px] rounded-lg border border-white/10
                bg-white/[0.04] animate-pulse"
            />
          </div>

          <p
            v-else-if="favoriteHeroesError"
            class="text-center text-sm text-red-300/80 py-10"
          >
            Не вдалося завантажити героїв з OpenDota. Спробуйте пізніше.
          </p>

          <p
            v-else-if="favoriteHeroesEmpty"
            class="text-center text-sm text-gray-500 py-10"
          >
            Немає даних про героїв.
          </p>

          <div
            v-else
            class="grid grid-cols-3 gap-[20px]"
          >
            <div
              v-for="h in favoriteHeroes"
              :key="h.heroId"
              class="
                flex min-h-[88px] flex-col items-center justify-center gap-4
                rounded-lg border border-white/10
                bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                px-6 py-20
                shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                transition duration-200
                hover:-translate-y-px hover:border-white/15
              "
            >
              <img
                v-if="h.iconUrl && !brokenHeroIcons.has(h.heroId)"
                :src="h.iconUrl"
                :alt="h.name"
                width="32"
                height="32"
                loading="lazy"
                class="size-32 rounded-md object-contain"
                @error="onHeroIconError(h.heroId)"
              >
              <div
                v-else
                class="size-32 rounded-md bg-white/10 flex items-center justify-center
                  text-sm font-semibold text-gray-300"
                :aria-label="h.name"
              >
                {{ h.name.charAt(0) }}
              </div>

              <span
                class="max-w-full truncate text-center text-[11px] font-medium text-white/95 mt-2"
                :title="h.name"
              >
                {{ h.name }}
              </span>

              <span class="text-[10px] tabular-nums text-gray-500">
                {{ h.games }} ігор
                <template v-if="h.winrate !== null">
                  ·
                  <span
                    :class="h.winrate >= 50 ? 'text-green-300/90' : 'text-red-300/90'"
                  >
                    {{ h.winrate }}%
                  </span>
                </template>
              </span>
            </div>
          </div>
        </div>

        <!-- Профіль /me: команда (50%) + позиції (50%); на мобільному — стовпчик -->
        <div
          v-if="isProfilePage && player"
          class="grid w-full grid-cols-1 gap-16 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <template v-if="playerTeamLinkId">
                <RouterLink
                  :to="{ name: routeNames.team, params: { id: playerTeamLinkId } }"
                  class="group flex w-full max-w-full min-w-0 cursor-pointer items-start gap-16 rounded-xl
                    border border-white/10 bg-white/[0.03] px-12 py-12 no-underline
                    transition hover:border-white/15 hover:bg-white/[0.06]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <div
                    class="relative h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]
                      shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-gray-800/80"
                  >
                    <img
                      v-if="profileTeamLogoSrc"
                      :src="profileTeamLogoSrc"
                      alt=""
                      class="pointer-events-none h-full w-full object-cover"
                    >
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-white/35"
                    >
                      <PhUsersThree :size="24" weight="duotone" />
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3
                      class="truncate text-lg font-semibold text-white transition group-hover:text-primary/90"
                    >
                      {{ profileTeam?.name ?? 'Команда' }}
                    </h3>
                    <span
                      v-if="profileTeamDotaTeamIdDisplay"
                      class="mt-4 flex w-fit max-w-full items-center gap-6 text-xs text-gray-400
                        transition hover:text-primary cursor-pointer"
                      @click.stop.prevent="
                        getCopy(profileTeamDotaTeamIdDisplay, 'Dota ID команди скопійовано')
                      "
                    >
                      {{ profileTeamDotaTeamIdDisplay }}
                      <PhCopy size="13" />
                    </span>
                  </div>
                </RouterLink>
              </template>
              <template v-else>
                <div class="flex w-full justify-center">
                  <el-button type="primary" @click="openCreateTeamModal">
                    Створити команду
                  </el-button>
                </div>
              </template>
            </div>
          </div>

          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8"
            >
              <div
                v-if="profilePositionRows.length"
                class="flex w-full flex-wrap justify-center gap-8"
              >
                <div
                  v-for="row in profilePositionRows"
                  :key="row.id"
                  class="inline-flex items-center gap-8 rounded-lg border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-12 py-7 text-left
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200 hover:-translate-y-px hover:border-white/15"
                >
                  <component
                    :is="row.icon"
                    :size="22"
                    weight="duotone"
                    class="shrink-0 text-primary"
                  />
                  <span class="text-sm font-medium leading-tight text-white">{{ row.label }}</span>
                </div>
              </div>
              <p
                v-else
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500"
              >
                Позиції не вказані. Їх можна додати при редагуванні профілю.
              </p>
            </div>
          </div>
        </div>

        <!-- Чужий профіль `/players/:id`: команда + позиції (публічно), як layout на `/me` -->
        <div
          v-else-if="player && !isProfilePage"
          class="grid w-full grid-cols-1 gap-16 md:grid-cols-2 md:items-stretch"
        >
          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Команда
            </h2>
            <div
              v-loading="profileTeamLoading"
              class="
                flex w-full min-w-0 flex-1 flex-col items-stretch justify-center gap-10 text-left text-sm
                leading-relaxed text-gray-400
              "
            >
              <RouterLink
                v-if="playerTeamLinkId"
                :to="{ name: routeNames.team, params: { id: playerTeamLinkId } }"
                class="group flex w-full max-w-full min-w-0 cursor-pointer items-start gap-16 rounded-xl
                  border border-white/10 bg-white/[0.03] px-12 py-12 no-underline
                  transition hover:border-white/15 hover:bg-white/[0.06]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div
                  class="relative h-56 w-56 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]
                    shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-gray-800/80"
                >
                  <img
                    v-if="profileTeamLogoSrc"
                    :src="profileTeamLogoSrc"
                    alt=""
                    class="pointer-events-none h-full w-full object-cover"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-white/35"
                  >
                    <PhUsersThree :size="24" weight="duotone" />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-lg font-semibold text-white transition group-hover:text-primary/90">
                    {{ profileTeam?.name ?? 'Команда' }}
                  </h3>
                  <span
                    v-if="profileTeamDotaTeamIdDisplay"
                    class="mt-4 flex w-fit max-w-full items-center gap-6 text-xs text-gray-400
                      transition hover:text-primary cursor-pointer"
                    @click.stop.prevent="
                      getCopy(profileTeamDotaTeamIdDisplay, 'Dota ID команди скопійовано')
                    "
                  >
                    {{ profileTeamDotaTeamIdDisplay }}
                    <PhCopy size="13" />
                  </span>
                </div>
              </RouterLink>
              <span v-else class="block w-full text-center text-sm text-gray-500">
                Інформація про команду недоступна
              </span>
            </div>
          </div>

          <div
            class="flex min-h-0 min-w-0 flex-col items-center gap-10 rounded-2xl border border-gray-800/90
              bg-gradient-to-br from-gray-900/90 via-gray-900/50 to-gray-950/90 md:h-full
              px-16 py-14 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] 2md:px-18 2md:py-16"
          >
            <h2 class="shrink-0 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Позиції
            </h2>
            <div
              class="flex min-h-0 min-w-0 w-full flex-1 flex-col items-center justify-center gap-8"
            >
              <div
                v-if="profilePositionRows.length"
                class="flex w-full flex-wrap justify-center gap-8"
              >
                <div
                  v-for="row in profilePositionRows"
                  :key="row.id"
                  class="inline-flex items-center gap-8 rounded-lg border border-white/10
                    bg-gradient-to-b from-white/[0.08] to-white/[0.02]
                    px-12 py-7 text-left
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                    transition duration-200 hover:-translate-y-px hover:border-white/15"
                >
                  <component
                    :is="row.icon"
                    :size="22"
                    weight="duotone"
                    class="shrink-0 text-primary"
                  />
                  <span class="text-sm font-medium leading-tight text-white">{{ row.label }}</span>
                </div>
              </div>
              <p
                v-else
                class="mx-auto max-w-[90%] text-center text-sm text-gray-500"
              >
                Позиції не вказані
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  PhCopy,
  PhSealCheck,
  PhQuestion,
  // PhInfo,
  PhUser,
  PhSealWarning,
  PhPencil,
  PhUsersThree
} from '@phosphor-icons/vue'

import {
  getCopy,
  getSteamProfileUrl,
  getDotabuffProfileUrl,
  getDiscordProfileUrl,
  getPlayerMatchStats,
  getPlayerRankImageSrcFromPlayerRank,
  formatPlayerRatingMmr,
  getPlayerDotaPositions,
  isPlayerVerified,
  resolvePublicOrApiUrl
} from '@/core/helpers'
import { positionOptions } from '@/components/player-tags/player.constants'
import { routeNames } from '@/router/route-names'
import { playersService } from '@/views/players/players.service'
import type { TPlayer, TTeamResponse } from '@/api/types/api.types'
import type { TCreateTeamPayload } from '@/views/teams/teams.service'
import { teamsService } from '@/views/teams/teams.service'
import { usePlayerFavoriteHeroes } from '@/composables/query/use-player-heroes'

const route = useRoute()
const router = useRouter()
const player = ref<TPlayer | null>(null)

const { open, close } = useAppModals()
const window = useWindowSize()

const playerStore = usePlayersStore()
const teamsStore = useTeamsStore()
const me = useAuthStore()

const loading = ref(false)
const linkingSteam = ref(false)
const verifyLoading = ref(false)

const links = computed(() => {
  return {
    discord: getDiscordProfileUrl(player.value?.discordId),
    steam: getSteamProfileUrl(player.value?.steamId),
    dotabuff: getDotabuffProfileUrl(player.value?.steamId)
  }
})

const rankImageSrc = computed(() => getPlayerRankImageSrcFromPlayerRank(player.value?.rank))
const ratingMmrLabel = computed(() => formatPlayerRatingMmr(player.value?.rating))

const isVerified = computed(() => isPlayerVerified(player.value))

const matchStats = computed(() => getPlayerMatchStats(player.value))

const {
  hasAccount: favoriteHeroesHasAccount,
  heroes: favoriteHeroes,
  isPending: favoriteHeroesPending,
  isError: favoriteHeroesError,
  isEmpty: favoriteHeroesEmpty
} = usePlayerFavoriteHeroes(() => player.value?.steamId)

/** Скільки скелетів показати при завантаженні (= ліміт у composable). */
const favoriteHeroesSkeletons = 3
/** Іконки героїв, що не завантажились — показуємо запасний бокс. */
const brokenHeroIcons = ref<Set<string>>(new Set())
function onHeroIconError (heroId: string) {
  brokenHeroIcons.value = new Set(brokenHeroIcons.value).add(heroId)
}

const showAdditionalInfo = computed(() => {
  return route.name === routeNames.profile || me.isAdmin.isAdmin || me.isAdmin.isModerator
})

/** Адмін/модер: верифікація на `/players/:id` (навіть своєму id) та на профілі `/me`. */
const showAdminVerificationActions = computed(() => {
  if (!(me.isAdmin.isAdmin || me.isAdmin.isModerator)) return false
  if (!player.value || !me.user) return false
  if (route.name === routeNames.profile) return true
  if (route.name === routeNames.player) return true
  return false
})

const isProfilePage = computed(() => route.name === routeNames.profile)

const playerTeamLinkId = computed(() => {
  const id = player.value?.teamId
  if (id == null || id === '') return null
  return String(id)
})

/** Командний профіль із бекенду для картки в профілі гравця. */
const profileTeam = shallowRef<TTeamResponse | null>(null)
const profileTeamLoading = ref(false)

watch(
  playerTeamLinkId,
  async (teamId) => {
    profileTeam.value = null
    if (!teamId) return
    profileTeamLoading.value = true
    try {
      profileTeam.value = await teamsService.fetchTeam(teamId)
    } catch {
      profileTeam.value = null
    } finally {
      profileTeamLoading.value = false
    }
  },
  { immediate: true }
)

const profileTeamLogoSrc = computed(() =>
  resolvePublicOrApiUrl(profileTeam.value?.logoUrl)
)

/** Dota Team ID з API для підпису та копіювання */
const profileTeamDotaTeamIdDisplay = computed(() => {
  const raw = profileTeam.value?.dotaTeamId
  if (raw == null || String(raw).trim() === '') return null
  return String(raw).trim()
})

/** Позиції Dota з `positionOptions` (ті самі іконки, що в фільтрах) — для /me */
const profilePositionRows = computed(() => {
  if (!player.value) return []
  const ids = getPlayerDotaPositions(player.value)
  return ids
    .map((id) => {
      const opt = positionOptions.find((o) => o.value === id)
      if (!opt) return null
      return { id, label: opt.label, icon: opt.icon }
    })
    .filter((x): x is { id: number; label: string; icon: (typeof positionOptions)[0]['icon'] } => x != null)
})

// const isAdminOrModerator = computed(() => {
//   return (me.isAdmin.isAdmin || me.isAdmin.isModerator) && route.name !== routeNames.profile
// })

// TODO: endpoint not in API yet (/players/me)
// const canRequestVerification = computed(() => false)

// TODO: endpoint not in API yet (invitePlayerToTeam)
// const canInvitePlayer = computed(() => false)
// const inviting = ref(false)

watch(() => route.name, async () => {
  if (route.name === routeNames.player || route.name === routeNames.profile) { await onOpen() }
})

async function onOpen () {
  const id = String(route.params.id)
  const isMePage = route.name === routeNames.profile

  loading.value = true
  try {
    player.value = isMePage ? (me.user as unknown as TPlayer) : await playerStore.findPlayer(id)
    if (!player.value) throw new Error()
  } catch {
    router.push('/')
  } finally {
    loading.value = false
  }
}

async function handleSteamLink () {
  linkingSteam.value = true
  try {
    await me.linkSteam()
  } catch {
    ElMessage.error('Не вдалося отримати посилання для Steam. Спробуйте ще раз.')
    linkingSteam.value = false
  }
}

async function togglePlayerVerification () {
  if (!player.value || verifyLoading.value) return

  verifyLoading.value = true
  try {
    const wantVerified = !isVerified.value
    const updated = await playersService.setPlayerVerificationByAdmin(
      player.value.id,
      wantVerified
    )

    if (updated) {
      player.value = updated
      const list = playerStore.players
      const ix = list.findIndex(p => p.id === updated.id)
      if (ix !== -1) {
        list.splice(ix, 1, updated)
      }
    }
  } finally {
    verifyLoading.value = false
  }
}

async function handleCreateTeam (dto: TCreateTeamPayload) {
  const created = await teamsStore.createTeam(dto)
  if (!created) {
    throw new Error('CREATE_TEAM_FAILED')
  }
  close('TeamCreateModal')
  await me.fetchUser()
  player.value = me.user as unknown as TPlayer
  await router.push({ name: routeNames.team, params: { id: created.id } })
}

function openCreateTeamModal () {
  open('TeamCreateModal', {
    onSubmit: handleCreateTeam
  })
}

function openEditProfileModal () {
  if (!player.value) return

  open('PLayerEditProfileModal', {
    player: player.value,
    onUpdated: async (updated: TPlayer) => {
      player.value = updated
      if (route.name === routeNames.profile) {
        await me.fetchUser()
        player.value = me.user as unknown as TPlayer
      }
    }
  })
}

onMounted(async () => {
  await onOpen()

  const steamLinked = route.query.steam_linked
  const steamError = route.query.steam_error

  if (steamLinked === 'true') {
    ElMessage.success("Steam акаунт успішно прив'язано!")
    await me.fetchUser()
    player.value = me.user as unknown as TPlayer
    router.replace({ name: routeNames.profile })
  } else if (steamError) {
    ElMessage.error(`Помилка прив'язки Steam: ${steamError}`)
    router.replace({ name: routeNames.profile })
  }
})
</script>
