<template>
  <el-dialog
    v-model="modelValue"
    class="profile-dialog"
    :width="dialogWidth"
    align-center
    destroy-on-close
    :show-close="false"
  >
    <!-- Header -->
    <template #header="{ close }">
      <div class="profile-dialog__head">
        <div class="flex min-w-0 flex-col gap-4">
          <span class="sys-label">// Профіль</span>
          <h2 class="profile-dialog__title">Редагування профілю</h2>
        </div>
        <button type="button" class="profile-dialog__close" aria-label="Закрити" @click="close">
          <PhX :size="16" weight="bold" />
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-16">
      <!-- MMR -->
      <section v-if="showMmrField" class="flex flex-col gap-10">
        <div class="profile-section__head">
          <label for="profile-mmr" class="sys-label !text-[10px]">// MMR</label>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__count" :class="{ 'is-on': form.mmr != null }">
            {{ form.mmr ?? 0 }}<span class="profile-section__of">/{{ MAX_RATING }}</span>
          </span>
        </div>

        <el-input
          id="profile-mmr"
          v-model="form.mmr"
          class="profile-mmr"
          type="text"
          inputmode="numeric"
          placeholder="0 – 22000"
          :disabled="mmrInputDisabled"
          @input="onMmrInput"
        >
          <template #prefix>
            <PhChartLineUp :size="16" weight="bold" class="text-primary" />
          </template>
        </el-input>

        <span class="profile-mmr__bar" aria-hidden="true">
          <span class="profile-mmr__fill" :style="{ transform: `scaleX(${mmrFill})` }" />
        </span>

        <p v-if="mmrInputDisabled" class="profile-note">
          Ваш MMR підтверджено — змінити його може лише адміністрація.
        </p>
      </section>

      <!-- Positions -->
      <section class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label !text-[10px]">// Позиції</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__count" :class="{ 'is-on': form.positions.length }">
            {{ pad(form.positions.length) }}<span class="profile-section__of">/{{ pad(positionOptions.length) }}</span>
          </span>
        </div>

        <div role="group" aria-label="Позиції" class="pos-grid">
          <button
            v-for="pos in positionOptions"
            :key="pos.value"
            type="button"
            class="pos-pick"
            :class="{ 'is-on': form.positions.includes(pos.value) }"
            :aria-pressed="form.positions.includes(pos.value)"
            @click="togglePosition(pos.value)"
          >
            <span class="pos-pick__num">{{ pos.value }}</span>
            <component :is="pos.icon" :size="18" weight="fill" class="pos-pick__icon" />
            <span class="pos-pick__label">{{ pos.label }}</span>
          </button>
        </div>
      </section>

      <!-- Location -->
      <section class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label !text-[10px]">// Локація</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__count" :class="{ 'is-on': form.countryCode }">
            {{ form.countryCode ?? '--' }}
          </span>
        </div>

        <div class="location-grid">
          <el-select
            v-model="form.countryCode"
            :loading="countriesLoading"
            :filter-method="onCountryFilter"
            filterable
            clearable
            :show-arrow="false"
            placeholder="Країна"
            class="w-full"
            aria-label="Країна"
            @change="onCountryChange"
            @visible-change="onCountryVisibleChange"
          >
            <template #prefix>
              <PhMapPin :size="16" weight="bold" class="text-primary" />
            </template>
            <el-option
              v-for="country in filteredCountryOptions"
              :key="country.value"
              :label="country.label"
              :value="country.value"
            >
              <span class="location-option">
                <img
                  class="location-flag"
                  :src="getCountryFlagUrl(country.value, 40)"
                  :srcset="`${getCountryFlagUrl(country.value, 80)} 2x`"
                  alt=""
                  loading="lazy"
                  width="24"
                  height="18"
                >
                <span class="truncate">{{ country.label }}</span>
              </span>
            </el-option>
          </el-select>

          <el-select
            v-model="form.city"
            :loading="citiesLoading"
            :disabled="!form.countryCode"
            :filter-method="onCityFilter"
            filterable
            clearable
            :show-arrow="false"
            :placeholder="form.countryCode ? 'Місто' : 'Спочатку оберіть країну'"
            class="w-full"
            aria-label="Місто"
            @visible-change="onCityVisibleChange"
          >
            <el-option
              v-for="city in visibleCityOptions"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>

        <p class="profile-note">
          Міста беруться з довідника; якщо вашого немає — оберіть найближче.
        </p>
      </section>

      <!-- Want to play -->
      <section class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label !text-[10px]">// Хочу грати</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__count" :class="{ 'is-on': form.wantToPlay.length }">
            {{ pad(form.wantToPlay.length) }}<span class="profile-section__of">/{{ pad(formatCount) }}</span>
          </span>
        </div>

        <div role="group" aria-label="Хочу грати" class="fmt-grid">
          <button
            v-for="fmt in wantToPlayOptions"
            :key="fmt.value"
            type="button"
            class="pos-pick fmt-pick"
            :class="{ 'is-on': form.wantToPlay.includes(fmt.value) }"
            :aria-pressed="form.wantToPlay.includes(fmt.value)"
            @click="toggleFormat(fmt.value)"
          >
            <component :is="fmt.icon" :size="18" weight="fill" class="pos-pick__icon" />
            <span class="pos-pick__label fmt-pick__label">{{ fmt.label }}</span>
          </button>
        </div>

        <!-- LAN: міста України, куди гравець готовий приїхати -->
        <div v-if="wantsLan" class="flex flex-col gap-8">
          <label for="profile-lan-cities" class="profile-note !text-gray-300">
            Міста, куди можу приїхати на LAN-турнір
          </label>
          <el-select
            id="profile-lan-cities"
            v-model="form.lanCities"
            :loading="citiesLoading"
            :filter-method="onLanCityFilter"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            :show-arrow="false"
            placeholder="Оберіть міста"
            class="w-full"
            @visible-change="onLanCityVisibleChange"
          >
            <el-option
              v-for="city in visibleLanCityOptions"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>
      </section>

      <!-- Roles (admin only) -->
      <section v-if="canManageRoles" class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label sys-label--gold !text-[10px]">// Ролі</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__tag">Staff</span>
        </div>
        <el-select
          v-model="selectedRoleNames"
          :loading="rolesLoading"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="3"
          placeholder="Оберіть ролі"
          class="w-full"
        >
          <el-option
            v-for="role in playersStore.userRolesCatalog"
            :key="role.id"
            :label="role.name"
            :value="role.name"
          />
        </el-select>
      </section>

      <!-- Tags (admin / moderator only) -->
      <section v-if="canManageTags" class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label sys-label--gold !text-[10px]">// Теги</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
          <span class="profile-section__tag">Staff</span>
        </div>
        <el-select
          v-model="selectedTagIds"
          :loading="tagsLoading"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="3"
          placeholder="Оберіть теги"
          class="w-full"
        >
          <el-option
            v-for="tag in tagsCatalog"
            :key="tag.id"
            :label="tag.title"
            :value="tag.id"
          />
        </el-select>
      </section>

      <!-- Steam -->
      <section class="flex flex-col gap-10">
        <div class="profile-section__head">
          <span class="sys-label !text-[10px]">// Steam</span>
          <span class="hud-line h-px min-w-12 flex-1" aria-hidden="true" />
        </div>

        <div class="steam-card" :class="{ 'is-linked': hasSteam }">
          <div class="steam-card__row">
            <span class="steam-card__well">
              <Icon :size="22" name="steam" />
            </span>

            <span class="flex min-w-0 flex-1 flex-col gap-3">
              <span class="steam-card__status">
                <span class="steam-card__dot" aria-hidden="true" />
                {{ hasSteam ? 'Steam приєднано' : 'Steam не приєднано' }}
              </span>

              <!-- Linked: the id itself, copyable, plus a jump to the Steam profile -->
              <span v-if="hasSteam" class="steam-card__id">
                <button
                  type="button"
                  class="steam-card__copy"
                  title="Скопіювати Steam ID"
                  @click="getCopy(steamId, 'Steam ID')"
                >
                  <span class="truncate">{{ steamId }}</span>
                  <PhCopy :size="12" />
                </button>
                <a
                  :href="steamProfileUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="steam-card__open"
                  title="Відкрити профіль у Steam"
                  aria-label="Відкрити профіль у Steam"
                >
                  <PhArrowSquareOut :size="14" weight="bold" />
                </a>
              </span>
              <span v-else class="steam-card__hint">
                Потрібен для верифікації та статистики матчів.
              </span>
            </span>

            <el-button
              v-if="hasSteam && canStaffDisconnectSteam"
              type="danger"
              plain
              class="steam-card__btn"
              :loading="disconnectingSteam"
              @click="onDisconnectSteam"
            >
              <PhLinkBreak :size="16" weight="bold" />
              <span>Від'єднати</span>
            </el-button>
          </div>

          <!-- Unlinked: one clear action and what will happen -->
          <template v-if="!hasSteam">
            <el-button
              class="btn-steam steam-card__btn w-full"
              :loading="linkingSteam"
              @click="onConnectSteam"
            >
              <Icon :size="16" name="steam" />
              <span>{{ linkingSteam ? 'Переходимо у Steam…' : 'Приєднати Steam' }}</span>
            </el-button>
            <p class="steam-card__hint m-0 text-center">
              Ви перейдете на сайт Steam для входу й повернетесь сюди автоматично.
            </p>
          </template>
        </div>
      </section>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="profile-dialog__foot">
        <el-button @click="onClose">Скасувати</el-button>
        <el-button type="primary" :disabled="!isValid" :loading="saving" @click="onSubmit">
          <PhFloppyDisk :size="16" weight="fill" />
          <span>Зберегти</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PhArrowSquareOut,
  PhChartLineUp,
  PhCopy,
  PhFloppyDisk,
  PhLinkBreak,
  PhMapPin,
  PhX
} from '@phosphor-icons/vue'
import { MAX_RATING, positionOptions, wantToPlayOptions } from '@/components/player-tags/player.enums'
import { getApiErrorMessage } from '@/core/utils/api-errors'
import { getCopy, getPlayerLanCities, getPlayerWantToPlay, isPlayerVerified } from '@/core/helpers'
import { getCountryFlagUrl, useLocations, type ICountryOption } from '@/composables/use-locations'
import { useAuthStore } from '@/store/modules/auth'
import type { TTag } from '@/services/tags.types'
import type {
  TAdminPlayerRoleItem,
  TTournamentFormat,
  TUpdatePlayerDto
} from '@/api/types/api.types'

interface IEditProfileForm {
  mmr: number | null
  positions: number[]
  /** ISO alpha-2 з довідника /locations/countries; null — не вказано. */
  countryCode: string | null
  city: string | null
  wantToPlay: TTournamentFormat[]
  /** Міста України для LAN-турнірів; має сенс лише коли обрано LAN. */
  lanCities: string[]
  isNotification?: boolean
}

type TPositionSlot = 1 | 2 | 3 | 4 | 5

/**
 * Підтримка відповіді GET: масив `positions` + рідкісні/legacy-поля.
 * `TPlayer` з OpenAPI — `positions: (1..5)[] | null`
 */
type TPlayerWithOptionalLegacy = TPlayer & {
  position?: TPositionSlot | null
  positionIds?: number[] | string[]
  preferredPositions?: number[] | string[]
}

const SLOT: TPositionSlot[] = [1, 2, 3, 4, 5]

function toSlot (n: number): n is TPositionSlot {
  return SLOT.includes(n as TPositionSlot)
}

function coercePositionSlot (x: unknown): number {
  if (typeof x === 'number') return x
  if (typeof x === 'string') return parseInt(x, 10)
  return NaN
}

function pickPositions (p: TPlayerWithOptionalLegacy): number[] {
  const fromApi = p.positions
  if (Array.isArray(fromApi) && fromApi.length) {
    return fromApi
      .map(coercePositionSlot)
      .filter((n): n is number => Number.isInteger(n) && toSlot(n))
  }

  const one = p.position
  if (one != null && toSlot(one)) {
    return [one]
  }

  const raw = p.positionIds ?? p.preferredPositions
  if (!raw || !Array.isArray(raw) || !raw.length) return []
  return raw
    .map(coercePositionSlot)
    .filter((n): n is number => Number.isInteger(n) && toSlot(n))
}

/** PATCH/PUT: `positions: (1–5)[] | null` — `null` якщо прибрати всі. */
function formPositionsToApi (selected: number[]): TPositionSlot[] | null {
  const out: TPositionSlot[] = []
  const seen = new Set<number>()
  for (const n of selected) {
    if (toSlot(n) && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  out.sort((a, b) => a - b)
  return out.length ? out : null
}

function normalizeCountryCode (code: string | null | undefined): string | null {
  const c = String(code ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(c) ? c : null
}

function normalizeCity (city: string | null | undefined): string | null {
  const c = String(city ?? '').trim()
  return c || null
}

function applyFormFromPlayer (p: TPlayer) {
  const positions = pickPositions(p as TPlayerWithOptionalLegacy)
  form.value = {
    mmr: p.rating ?? null,
    positions: positions.length ? positions : [],
    countryCode: normalizeCountryCode(p.countryCode),
    city: normalizeCity(p.city),
    wantToPlay: getPlayerWantToPlay(p),
    lanCities: getPlayerLanCities(p),
    isNotification: true
  }
}

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: IEditProfileForm): void
  (e: 'updated', player: TPlayer): void
  (e: 'tagsUpdated', tags: TTag[]): void
}>()

const props = defineProps<{
  player: TPlayer
  onUpdated?: (player: TPlayer) => void
  onTagsUpdated?: (tags: TTag[]) => void
}>()

const authStore = useAuthStore()
const playersStore = usePlayersStore()

/** Тільки адмін керує ролями (бекенд `/admin/players/:id/roles` вимагає admin-роль). */
const canManageRoles = computed(() => authStore.isAdmin.isAdmin)

const rolesLoading = ref(false)
/** v-model мультиселекту — імена ролей (як у фільтрі гравців). */
const selectedRoleNames = ref<string[]>([])
/** Імена ролей на момент відкриття — щоб не смикати ендпоінт без змін (і не переставляти verifiedAt). */
const originalRoleNames = ref<string[]>([])

function playerRoleNames (p: TPlayer): string[] {
  return (p.roles ?? []).map((r) => r.name)
}

const rolesChanged = computed(() => {
  const a = [...selectedRoleNames.value].sort()
  const b = [...originalRoleNames.value].sort()
  return a.length !== b.length || a.some((name, i) => name !== b[i])
})

/** Теги — модерація: керують адмін та модератор (v2-ендпоінти `/players/:id/tags`). */
const canManageTags = computed(() => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator)

const tagsLoading = ref(false)
const tagsCatalog = ref<TTag[]>([])
/** v-model мультиселекту — id тегів. */
const selectedTagIds = ref<string[]>([])
/** Теги на момент відкриття — щоб відправити лише різницю (assign/remove). */
const originalTagIds = ref<string[]>([])

const tagsChanged = computed(() => {
  const a = [...selectedTagIds.value].sort()
  const b = [...originalTagIds.value].sort()
  return a.length !== b.length || a.some((id, i) => id !== b[i])
})

async function loadTags () {
  if (!canManageTags.value) return
  tagsLoading.value = true
  try {
    const [catalog, current] = await Promise.all([
      tagsService.fetchCatalog(),
      tagsService.fetchPlayerTags(props.player.id)
    ])
    tagsCatalog.value = catalog
    selectedTagIds.value = current.map((tag) => tag.id)
    originalTagIds.value = current.map((tag) => tag.id)
  } catch (e) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося завантажити теги'))
  } finally {
    tagsLoading.value = false
  }
}

const { width } = useWindowSize()
const dialogWidth = computed(() => (width.value < 640 ? 'calc(100vw - 24px)' : 520))

const pad = (n: number) => String(Math.min(n, 99)).padStart(2, '0')

/** Заповнення шкали MMR: 0..1 від MAX_RATING. */
const mmrFill = computed(() => Math.min(Math.max((form.value.mmr ?? 0) / MAX_RATING, 0), 1))

function togglePosition (slot: number) {
  const list = form.value.positions
  form.value.positions = list.includes(slot)
    ? list.filter((n) => n !== slot)
    : [...list, slot].sort((a, b) => a - b)
}

const form = ref<IEditProfileForm>({
  mmr: props.player.rating ?? null,
  positions: pickPositions(props.player as TPlayerWithOptionalLegacy),
  countryCode: normalizeCountryCode(props.player.countryCode),
  city: normalizeCity(props.player.city),
  wantToPlay: getPlayerWantToPlay(props.player),
  lanCities: getPlayerLanCities(props.player),
  isNotification: true
})

// ─── Локація (країна → місто) ────────────────────────────────────────────────
const {
  countryOptions,
  countriesLoading,
  citiesLoading,
  loadCountries,
  loadCities,
  citiesOf
} = useLocations()

/**
 * Довідник міст великий (тисячі записів), а класичний `el-select` рендерить кожну опцію в DOM —
 * тому показуємо лише перші `CITY_RENDER_LIMIT` збігів; уточнення запиту звужує список.
 */
const CITY_RENDER_LIMIT = 200
const cityQuery = ref('')

function onCityFilter (query: string) {
  cityQuery.value = query
}

function onCityVisibleChange (visible: boolean) {
  if (!visible) cityQuery.value = ''
}

const visibleCityOptions = computed<string[]>(() => {
  const all = citiesOf(form.value.countryCode)
  const q = cityQuery.value.trim().toLowerCase()
  const matched = q ? all.filter((name) => name.toLowerCase().includes(q)) : all
  const selected = form.value.city
  const head = matched.slice(0, CITY_RENDER_LIMIT)
  // Без запиту обране місто завжди в списку, навіть якщо не потрапило у зріз — інакше селект не покаже підпис.
  if (!q && selected && !head.includes(selected) && all.includes(selected)) head.unshift(selected)
  return head
})

/** Пошук країни за українською назвою, англійською (не показується, але шукається) та кодом. */
const countryQuery = ref('')

function onCountryFilter (query: string) {
  countryQuery.value = query
}

function onCountryVisibleChange (visible: boolean) {
  if (!visible) countryQuery.value = ''
}

const filteredCountryOptions = computed<ICountryOption[]>(() => {
  const q = countryQuery.value.trim().toLowerCase()
  if (!q) return countryOptions.value
  return countryOptions.value.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.englishName.toLowerCase().includes(q) ||
      o.value.toLowerCase() === q
  )
})

async function loadLocationCatalogs () {
  try {
    await loadCountries()
    if (form.value.countryCode) await loadCities(form.value.countryCode)
    if (wantsLan.value) await loadCities(LAN_COUNTRY_CODE)
  } catch {
    /* тост уже показав locationsService */
  }
}

/** Зміна країни знімає місто — воно належить попередній країні. */
async function onCountryChange (code: string | null | undefined) {
  form.value.countryCode = normalizeCountryCode(code)
  form.value.city = null
  if (!form.value.countryCode) return
  try {
    await loadCities(form.value.countryCode)
  } catch {
    /* тост уже показав locationsService */
  }
}

// ─── «Хочу грати» ────────────────────────────────────────────────────────────
const formatCount = wantToPlayOptions.length

/** LAN-турніри проходять в Україні — міста беремо з довідника UA. */
const LAN_COUNTRY_CODE = 'UA'
const wantsLan = computed(() => form.value.wantToPlay.includes('LAN'))

function toggleFormat (format: TTournamentFormat) {
  const list = form.value.wantToPlay
  form.value.wantToPlay = list.includes(format)
    ? list.filter((f) => f !== format)
    : wantToPlayOptions.map((o) => o.value).filter((v) => v === format || list.includes(v))
  if (format === 'LAN' && wantsLan.value) {
    loadCities(LAN_COUNTRY_CODE).catch(() => { /* тост уже показав locationsService */ })
  }
}

const lanCityQuery = ref('')

function onLanCityFilter (query: string) {
  lanCityQuery.value = query
}

function onLanCityVisibleChange (visible: boolean) {
  if (!visible) lanCityQuery.value = ''
}

/** Той самий зріз, що й для міста профілю: класичний селект рендерить усі опції в DOM. */
const visibleLanCityOptions = computed<string[]>(() => {
  const all = citiesOf(LAN_COUNTRY_CODE)
  const q = lanCityQuery.value.trim().toLowerCase()
  const matched = q ? all.filter((name) => name.toLowerCase().includes(q)) : all
  const head = matched.slice(0, CITY_RENDER_LIMIT)
  if (!q) {
    // Обрані міста завжди в списку, інакше теги не матимуть підписів.
    for (const selected of form.value.lanCities) {
      if (!head.includes(selected)) head.unshift(selected)
    }
  }
  return head
})

const saving = ref(false)
const linkingSteam = ref(false)
const disconnectingSteam = ref(false)

/** Після PATCH проп з `open()` не оновлюється — мержимо відповідь API для блоку Steam. */
const playerAfterSteamMutation = ref<TPlayer | null>(null)

function applyRolesFromPlayer (p: TPlayer) {
  const names = playerRoleNames(p)
  selectedRoleNames.value = [...names]
  originalRoleNames.value = [...names]
}

async function loadRolesCatalog () {
  if (!canManageRoles.value) return
  rolesLoading.value = true
  try {
    await playersStore.fetchUserRoles()
  } catch {
    /* помилка вже в playersService */
  } finally {
    rolesLoading.value = false
  }
}

watch(modelValue, (open) => {
  if (!open) return
  playerAfterSteamMutation.value = null
  applyFormFromPlayer(props.player)
  applyRolesFromPlayer(props.player)
  loadRolesCatalog()
  loadTags()
  loadLocationCatalogs()
}, { immediate: true })

const effectivePlayer = computed(() => playerAfterSteamMutation.value ?? props.player)

const steamId = computed(() => String(effectivePlayer.value.steamId ?? '').trim())
const hasSteam = computed(() => steamId.value !== '')
const steamProfileUrl = computed(() => `https://steamcommunity.com/profiles/${steamId.value}`)

/** Адміністрація може відв'язати Steam у гравця (PATCH профілю). */
const canStaffDisconnectSteam = computed(
  () => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
)

/** Статус «верифікований» у гравця, чий профіль редагується (як і в картках / Player.vue). */
const targetPlayerVerified = computed(() => isPlayerVerified(props.player))

/** Адмін/модератор можуть змінити MMR у будь-кого (відкритий профіль / інший користувач через кнопку з Player.vue). */
const viewerCanEditAnyoneMmr = computed(
  () => authStore.isAdmin.isAdmin || authStore.isAdmin.isModerator
)

/** Гість редагує власний MMR; верифікованому поле приховано, окрім випадку перегляду стаффом чужого / свого профілю. */
const showMmrField = computed(
  () => !targetPlayerVerified.value || viewerCanEditAnyoneMmr.value
)

/** Верифікований звичайний користувач не може міняти власний MMR вручну (інпут не показуємо). */
const mmrInputDisabled = computed(
  () => targetPlayerVerified.value && !viewerCanEditAnyoneMmr.value
)

const isValid = computed(() => {
  if (!showMmrField.value || mmrInputDisabled.value) {
    return true
  }
  return form.value.mmr !== null &&
    form.value.mmr >= 0 &&
    form.value.mmr <= 22000
})

function onMmrInput () {
  const value = String(form.value.mmr ?? '')
  const numeric = value.replace(/\D+/g, '')

  form.value.mmr =
    numeric === ''
      ? null
      : Math.min(Number(numeric), 22000)
}

// async function toggleDiscordNotification (isTrue: boolean) {
//   // TODO: endpoint not in API yet (toggleDiscordNotification)
//   form.value.isNotification = isTrue
// }

async function onConnectSteam () {
  linkingSteam.value = true
  try {
    await authStore.linkSteam()
  } catch {
    ElMessage.error('Не вдалося отримати посилання для Steam. Спробуйте ще раз.')
    linkingSteam.value = false
  }
}

async function onDisconnectSteam () {
  try {
    await ElMessageBox.confirm(
      'Від\'єднати Steam у цього гравця? Пізніше він зможе знову прив\'язати акаунт.',
      'Від\'єднати Steam',
      {
        type: 'warning',
        confirmButtonText: 'Від\'єднати',
        cancelButtonText: 'Скасувати'
      }
    )
  } catch {
    return
  }

  disconnectingSteam.value = true
  try {
    const updated = await playersStore.updatePlayer(props.player.id, {
      steamId: ''
    })
    playerAfterSteamMutation.value = updated
    ElMessage.success('Steam від\'єднано')
    emit('updated', updated)
    props.onUpdated?.(updated)
  } catch (e) {
    const data = (e as { response?: { data?: { message?: string } } })?.response?.data
    ElMessage.error(data?.message || 'Не вдалося від\'єднати Steam')
  } finally {
    disconnectingSteam.value = false
  }
}

/** Імена → елементи DTO; `isAdminRole` беремо з каталогу, із фолбеком на поточні ролі гравця. */
function buildRolesPayload (): TAdminPlayerRoleItem[] {
  const adminFlagByName = new Map<string, boolean>()
  for (const r of playersStore.userRolesCatalog) adminFlagByName.set(r.name, r.isAdminRole)
  for (const r of props.player.roles ?? []) {
    if (!adminFlagByName.has(r.name)) adminFlagByName.set(r.name, r.isAdminRole)
  }

  return selectedRoleNames.value.map((name) => ({
    name: name as TAdminPlayerRoleItem['name'],
    isAdminRole: adminFlagByName.get(name) ?? false
  }))
}

/** Відправляє лише різницю тегів (assign/remove), потім перечитує актуальний список. */
async function syncPlayerTags () {
  const toAdd = selectedTagIds.value.filter((id) => !originalTagIds.value.includes(id))
  const toRemove = originalTagIds.value.filter((id) => !selectedTagIds.value.includes(id))

  await Promise.all([
    ...toAdd.map((id) => tagsService.assignTag(props.player.id, id)),
    ...toRemove.map((id) => tagsService.removeTag(props.player.id, id))
  ])

  const finalTags = await tagsService.fetchPlayerTags(props.player.id)
  originalTagIds.value = finalTags.map((tag) => tag.id)
  selectedTagIds.value = finalTags.map((tag) => tag.id)
  emit('tagsUpdated', finalTags)
  props.onTagsUpdated?.(finalTags)
}

/**
 * Discord-ролі LAN-міст ставить бекенд після збереження, але мовчки. Для власного профілю
 * питаємо звіт і показуємо причину, якщо Discord відмовив (права бота, ієрархія ролей тощо).
 */
async function reportLanRoleSync (lanCities: string[] | null | undefined) {
  const isOwnProfile = props.player.id === authStore.user?.id
  if (!isOwnProfile || !lanCities?.length) return
  try {
    const report = await playersService.syncMyLanRoles()
    if (report.errors.length) {
      ElMessage({
        type: 'warning',
        duration: 8000,
        showClose: true,
        message: `Discord-ролі міст не призначено: ${report.errors[0]}`
      })
    }
  } catch {
    /* Discord-звіт необов'язковий — профіль уже збережено */
  }
}

async function onSubmit () {
  if (!isValid.value) return

  const countryCode = normalizeCountryCode(form.value.countryCode)
  const payload: Partial<TUpdatePlayerDto> = {
    positions: formPositionsToApi(form.value.positions),
    countryCode,
    city: countryCode ? normalizeCity(form.value.city) : null,
    wantToPlay: form.value.wantToPlay.length ? [...form.value.wantToPlay] : null,
    lanCities: wantsLan.value && form.value.lanCities.length ? [...form.value.lanCities] : null
  }
  if (!mmrInputDisabled.value) {
    payload.rating = form.value.mmr ?? 0
  }

  saving.value = true
  try {
    let updated = await playersStore.updatePlayer(props.player.id, payload)

    if (canManageRoles.value && rolesChanged.value) {
      updated = await playersStore.setPlayerRoles(props.player.id, buildRolesPayload())
    }

    if (canManageTags.value && tagsChanged.value) {
      await syncPlayerTags()
    }

    ElMessage.success('Профіль оновлено')
    await reportLanRoleSync(payload.lanCities)
    emit('submit', form.value)
    emit('updated', updated)
    props.onUpdated?.(updated)
    modelValue.value = false
  } catch (e) {
    const data = (e as { response?: { data?: { message?: string } } })?.response?.data
    ElMessage.error(data?.message || 'Не вдалося оновити профіль')
  } finally {
    saving.value = false
  }
}

function onClose () {
  modelValue.value = false
}
</script>

<style scoped lang="scss">
.profile-section__head {
  @apply flex items-center gap-12;
}

.profile-section__count {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ds-text-faint);
  font-variant-numeric: tabular-nums;
  transition: color var(--ds-duration-base) ease;

  &.is-on {
    color: var(--ds-primary);
    text-shadow: var(--ds-neon-text-subtle);
  }
}

.profile-section__of {
  color: var(--ds-text-faint);
  text-shadow: none;
}

.profile-section__tag {
  @apply inline-flex items-center rounded-md border px-8 py-2;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-gold);
  border-color: rgba(var(--ds-gold-rgb), 0.35);
  background: rgba(var(--ds-gold-rgb), 0.08);
}

.profile-note {
  @apply m-0 text-xs leading-relaxed;
  color: var(--ds-text-faint);
}

// ─── MMR ────────────────────────────────────────────────────────────────────
.profile-mmr {
  :deep(.el-input__inner) {
    font-family: var(--ds-font-mono);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }
}

.profile-mmr__bar {
  @apply block h-2 w-full overflow-hidden rounded-full;
  background: rgba(255, 255, 255, 0.08);
}

.profile-mmr__fill {
  @apply block h-full w-full origin-left rounded-full;
  background: linear-gradient(90deg, rgba(var(--ds-primary-rgb), 0.6), var(--ds-primary));
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.6);
  transition: transform 360ms var(--ds-ease-out);
}

// ─── Positions ──────────────────────────────────────────────────────────────
.pos-grid {
  @apply grid gap-8;
  grid-template-columns: repeat(5, minmax(0, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.pos-pick {
  @apply relative flex flex-col items-center gap-6 overflow-hidden rounded-xl border px-4 py-10 text-center;
  color: var(--ds-text-muted);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition:
    color var(--ds-duration-base) ease,
    border-color var(--ds-duration-base) ease,
    background-color var(--ds-duration-base) ease,
    box-shadow var(--ds-duration-base) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  // Top rail lights when the position is on.
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-base) ease;
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: 2px;
  }

  &.is-on {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.08);
    box-shadow: 0 0 18px rgba(var(--ds-primary-rgb), 0.14);

    &::before {
      opacity: 1;
    }

    .pos-pick__num {
      color: var(--ds-primary);
    }

    .pos-pick__icon {
      color: var(--ds-primary);
      filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.55));
    }
  }
}

.pos-pick__num {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ds-text-faint);
  transition: color var(--ds-duration-base) ease;
}

.pos-pick__icon {
  transition: color var(--ds-duration-base) ease, filter var(--ds-duration-base) ease;
}

.pos-pick__label {
  @apply font-display text-[11px] uppercase leading-tight tracking-wide;
}

// ─── Location ───────────────────────────────────────────────────────────────
.location-grid {
  @apply grid gap-8;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.location-option {
  @apply grid min-w-0 items-center gap-10;
  grid-template-columns: 24px minmax(0, 1fr);
}

.location-flag {
  @apply block h-[18px] w-[24px] shrink-0 rounded-[3px] object-cover;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

// ─── Want to play ───────────────────────────────────────────────────────────
.fmt-grid {
  @apply grid gap-8;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

// Same well as a position toggle, laid out as a row with the icon before the label.
.fmt-pick {
  @apply flex-row justify-start gap-10 px-14 py-12 text-left;
}

.fmt-pick__label {
  font-size: 12px;
  letter-spacing: 0.06em;
}

// ─── Steam ──────────────────────────────────────────────────────────────────
.steam-card {
  --steam-rgb: 102, 192, 244;

  @apply flex flex-col gap-10 rounded-xl border p-12;
  border-color: var(--ds-border-neutral);
  background: rgba(7, 8, 15, 0.45);
  transition: border-color var(--ds-duration-base) ease, background-color var(--ds-duration-base) ease;

  &.is-linked {
    --steam-rgb: 34, 197, 94;

    border-color: rgba(var(--steam-rgb), 0.35);
    background: linear-gradient(135deg, rgba(var(--steam-rgb), 0.08), transparent 70%), rgba(7, 8, 15, 0.45);
  }
}

.steam-card__row {
  @apply flex items-center gap-12;
}

.steam-card__well {
  @apply inline-flex size-40 shrink-0 items-center justify-center rounded-lg border;
  color: #fff;
  border-color: rgba(var(--steam-rgb), 0.3);
  background: rgba(var(--steam-rgb), 0.08);
}

.steam-card__btn {
  @apply shrink-0;
  margin-left: 0 !important;

  :deep(> span) {
    @apply inline-flex items-center gap-8;
  }
}

.steam-card__id {
  @apply flex min-w-0 items-center gap-6;
}

.steam-card__copy {
  @apply inline-flex min-w-0 items-center gap-6 rounded border-0 bg-transparent p-0 text-left;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ds-text-faint);
  cursor: pointer;
  transition: color var(--ds-duration-base) ease;

  svg {
    @apply shrink-0;
    opacity: 0.5;
    transition: opacity var(--ds-duration-base) ease;
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }
}

.steam-card__open {
  @apply inline-flex size-22 shrink-0 items-center justify-center rounded-md border no-underline;
  color: var(--ds-text-muted);
  border-color: var(--ds-border-neutral);
  background: rgba(255, 255, 255, 0.04);
  transition: color var(--ds-duration-base) ease, border-color var(--ds-duration-base) ease;

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6);
    outline-offset: 2px;
  }
}

.steam-card__status {
  @apply flex items-center gap-8 font-display text-[13px] uppercase leading-tight tracking-wide text-white;
}

.steam-card__dot {
  @apply inline-block size-6 shrink-0 rounded-full;
  background: rgba(255, 255, 255, 0.3);

  .is-linked & {
    background: var(--ds-success);
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
  }
}

.steam-card__hint {
  font-size: 12px;
  line-height: 1.4;
  color: var(--ds-text-faint);
}

@media (hover: hover) and (pointer: fine) {
  .steam-card__copy:hover {
    color: #fff;

    svg {
      opacity: 1;
    }
  }

  .steam-card__open:hover {
    color: #fff;
    border-color: rgba(var(--steam-rgb), 0.6);
  }

  .pos-pick:not(.is-on):hover {
    color: var(--ds-text);
    border-color: rgba(var(--ds-primary-rgb), 0.4);
    background: rgba(255, 255, 255, 0.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pos-pick,
  .pos-pick__icon,
  .profile-mmr__fill {
    transition: none;
  }
}
</style>

<style lang="scss">
// Not scoped: `.el-dialog` renders outside this component's root.
.el-dialog.profile-dialog {
  background: rgba(16, 19, 36, 0.62);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  // Форма має вміщатися без прокрутки: замість глобальних 70vh даємо діалогу
  // майже всю висоту вікна; тіло прокручується лише на дуже низьких екранах.
  max-height: calc(100vh - 32px);

  .el-dialog__header {
    border-bottom: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .el-dialog__footer {
    border-top: 1px solid rgba(var(--ds-primary-rgb), 0.12);
  }

  .profile-dialog__close:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.6) !important;
    outline-offset: 2px;
  }
}

.profile-dialog__head {
  @apply flex items-start justify-between gap-12;
}

.profile-dialog__title {
  @apply m-0 truncate font-display text-xl uppercase leading-none tracking-wide text-white;
}

.profile-dialog__close {
  @apply inline-flex size-28 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/55;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;
}

.profile-dialog__foot {
  @apply flex items-center justify-end gap-10;

  .el-button {
    margin-left: 0 !important;
  }

  .el-button > span {
    @apply inline-flex items-center gap-8;
  }
}

@media (hover: hover) and (pointer: fine) {
  .profile-dialog__close:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
