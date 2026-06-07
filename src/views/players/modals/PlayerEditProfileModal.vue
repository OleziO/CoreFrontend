<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="520"
    title="Редагування профілю"
    @close="onClose"
  >
    <el-form
      :model="form"
      label-position="top"
      class="flex flex-col gap-16"
    >
      <el-form-item v-if="showMmrField" label="MMR">
        <el-input
          v-model="form.mmr"
          type="text"
          inputmode="numeric"
          placeholder="0 – 22000"
          :disabled="mmrInputDisabled"
          @input="onMmrInput"
        />
      </el-form-item>

      <!-- Positions -->
      <el-form-item label="Позиції">
        <el-select
          v-model="form.positions"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="2"
          placeholder="Оберіть позиції"
          class="w-full"
        >
          <el-option
            v-for="pos in positionOptions"
            :key="pos.value"
            :label="pos.label"
            :value="pos.value"
          >
            <div class="flex gap-10 items-center">
              <component :is="pos.icon" :size="15" />
              <span>{{ pos.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Roles (admin only) -->
      <el-form-item v-if="canManageRoles" label="Ролі">
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
      </el-form-item>

      <!-- Steam -->
      <el-form-item label="Steam">
        <div
          class="flex items-center justify-between w-full
                 rounded-12 border border-white/10
                 bg-white/5 px-16 py-12"
        >
          <div class="flex items-center gap-8 min-w-0">
            <Icon :size="20" name="steam" />

            <span
              v-if="hasSteam"
              class="text-sm text-green-500 font-medium"
            >
              Steam приєднано
            </span>

            <span
              v-else
              class="text-sm text-gray-400"
            >
              Steam не приєднано
            </span>
          </div>

          <div class="flex shrink-0 items-center gap-8">
            <el-button
              v-if="hasSteam && canStaffDisconnectSteam"
              type="danger"
              plain
              size="small"
              :loading="disconnectingSteam"
              @click="onDisconnectSteam"
            >
              Від'єднати
            </el-button>

            <el-button
              v-if="!hasSteam"
              type="primary"
              size="small"
              :loading="linkingSteam"
              @click="onConnectSteam"
            >
              Приєднати Steam
            </el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button @click="onClose">
          Скасувати
        </el-button>

        <el-button
          type="primary"
          :disabled="!isValid"
          :loading="saving"
          @click="onSubmit"
        >
          Зберегти
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { positionOptions } from '@/components/player-tags/player.enums'
import { isPlayerVerified } from '@/core/helpers'
import { useAuthStore } from '@/store/modules/auth'
import { playersService } from '@/views/players/players.service'
import type {
  TAdminPlayerRoleItem,
  TAdminPlayerRolesResult,
  TUpdatePlayerDto
} from '@/api/types/api.types'

interface IEditProfileForm {
  mmr: number | null
  positions: number[]
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

function applyFormFromPlayer (p: TPlayer) {
  const positions = pickPositions(p as TPlayerWithOptionalLegacy)
  form.value = {
    mmr: p.rating ?? null,
    positions: positions.length ? positions : [],
    isNotification: true
  }
}

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: IEditProfileForm): void
  (e: 'updated', player: TPlayer): void
}>()

const props = defineProps<{
  player: TPlayer
  onUpdated?: (player: TPlayer) => void
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

const form = ref<IEditProfileForm>({
  mmr: props.player.rating ?? null,
  positions: pickPositions(props.player as TPlayerWithOptionalLegacy),
  isNotification: true
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
}, { immediate: true })

const effectivePlayer = computed(() => playerAfterSteamMutation.value ?? props.player)

const hasSteam = computed(() => {
  const id = effectivePlayer.value.steamId
  return id != null && String(id).trim() !== ''
})

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
    const updated = await playersService.updatePlayer(props.player.id, {
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

/** Відповідь ендпоінта ролей — джерело істини: переписуємо roles + verifiedAt. */
function mergeRolesIntoPlayer (player: TPlayer, result: TAdminPlayerRolesResult): TPlayer {
  return {
    ...player,
    verifiedAt: result.verifiedAt,
    roles: result.roles as unknown as TPlayer['roles']
  }
}

async function onSubmit () {
  if (!isValid.value) return

  const payload: Partial<TUpdatePlayerDto> = {
    positions: formPositionsToApi(form.value.positions)
  }
  if (!mmrInputDisabled.value) {
    payload.rating = form.value.mmr ?? 0
  }

  saving.value = true
  try {
    let updated = await playersService.updatePlayer(props.player.id, payload)

    if (canManageRoles.value && rolesChanged.value) {
      const result = await playersService.setPlayerRolesByAdmin(props.player.id, buildRolesPayload())
      updated = mergeRolesIntoPlayer(updated, result)
    }

    ElMessage.success('Профіль оновлено')
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
