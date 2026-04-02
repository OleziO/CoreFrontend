<template>
  <el-dialog
    :model-value="modelValue"
    destroy-on-close
    width="600"
    title="Фільтри гравців"
    @open="getFiltersFromQuery"
    @close="onReset"
  >
    <el-form
      :model="filters"
      label-position="top"
      class="flex flex-col"
    >
      <!-- Rating -->
      <el-form-item label="Рейтинг">
        <div class="flex flex-1 items-center gap-12">
          <el-input
            v-model="filters.ratingFrom"
            type="text"
            inputmode="numeric"
            placeholder="Від"
            class="!flex-1"
            @input="onNumericInput('ratingFrom')"
          />
          <span>-</span>
          <el-input
            v-model="filters.ratingTo"
            type="text"
            inputmode="numeric"
            placeholder="До"
            class="!flex-1"
            @input="onNumericInput('ratingTo')"
          />
        </div>
      </el-form-item>

      <!-- Positions -->
      <el-form-item label="Позиції">
        <el-select
          v-model="filters.positions"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="5"
          placeholder="Оберіть позиції"
          class="w-full"
        >
          <el-option
            v-for="pos in positionOptions"
            :key="pos.label"
            :label="pos.label"
            :value="pos.value"
          >
            <div class="flex gap-10 items-center">
              <component
                :is="pos.icon"
                :size="15"
              />

              <span>{{ pos.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Roles -->
      <el-form-item label="Теги">
        <el-select
          v-model="filters.roles"
          multiple
          collapse-tags
          :show-arrow="false"
          collapse-tags-tooltip
          :max-collapse-tags="2"
          placeholder="Оберіть теги"
          class="w-full"
        >
          <el-option
            v-for="(label, value) in roleLabelMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>

      <!-- Team status -->
      <el-form-item label="Статус">
        <el-select
          v-model="filters.teamStatus"
          multiple
          collapse-tags
          :show-arrow="false"
          :max-collapse-tags="5"
          placeholder="Оберіть статус"
          class="w-full"
        >
          <el-option
            v-for="opt in teamStatusOptions"
            :key="opt.label"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <!-- Verification -->
      <el-form-item label="Верифікація">
        <el-select
          v-model="filters.verificationStatus"
          multiple
          collapse-tags
          :show-arrow="false"
          :max-collapse-tags="5"
          placeholder="Оберіть статус верифікації"
          class="w-full"
        >
          <el-option
            v-for="opt in verificationOptions"
            :key="opt.label"
            :label="opt.label"
            :value="opt.value"
          >
            <div class="flex gap-10 items-center">
              <component
                :is="opt.value === ERole.PLAYER ? PhSealCheck : PhSealWarning"
                :size="15"
                :class="opt.value === ERole.PLAYER
                  ? 'text-green-600'
                  : 'text-red-600'"
              />

              <span>{{ opt.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button
          @click.stop="() => onReset(false)"
        >
          <span class="text-sm font-medium">Очистити</span>
        </el-button>

        <el-button
          type="primary"
          @click.stop="onApply"
        >
          <PhMagnifyingGlass size="14" weight="bold" />
          <span class="ml-5 text-sm font-medium">Застосувати</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { routeNames } from '@/router/route-names'
import { PhSealCheck, PhSealWarning, PhMagnifyingGlass } from '@phosphor-icons/vue'
import { DEFAULT_PLAYER_FILTERS, MAX_RATING, positionOptions, roleLabelMap, teamStatusOptions, verificationOptions } from '@/components/player-tags/player.constants'

import { parseQueryArray } from '@/core/helpers'
import { ERole } from '@/types/general.types'

const modelValue = defineModel<boolean>({ default: false })

const router = useRouter()

interface IPlayerFilters {
  ratingFrom: number | null
  ratingTo: number | null
  positions: number[]
  roles: string[]
  teamStatus: boolean[]
  verificationStatus: string[]
}

const route = useRoute()

const filters = ref<IPlayerFilters>(DEFAULT_PLAYER_FILTERS)

function onReset (withClose = true) {
  filters.value.ratingFrom = null
  filters.value.ratingTo = null
  filters.value.positions = []
  filters.value.roles = []
  filters.value.teamStatus = []
  filters.value.verificationStatus = []

  if (withClose) modelValue.value = false
}

function onApply () {
  const { ratingFrom, ratingTo, verificationStatus, teamStatus, positions, roles } = filters.value

  const rating = [ratingFrom, ratingTo].filter((v) => v != null).sort((a, b) => a - b)

  const query = Object.fromEntries(
    Object.entries({
      ratingFrom: rating[0],
      ratingTo: rating[1],
      positions: positions?.length ? positions.join(',') : undefined,
      roles: roles?.length ? roles.join(',') : undefined,
      teamStatus: teamStatus?.filter((v) => v != null).map(Number).join(',') || undefined,
      verificationStatus: verificationStatus?.filter((v) => v != null).join(',') || undefined
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }).filter(([_, value]) => value != null && value !== '')
  )

  router.push({ name: routeNames.players, query })

  onReset(false)
  modelValue.value = false
}

function onNumericInput (key: 'ratingFrom' | 'ratingTo') {
  const value = String(filters.value[key] ?? '')

  const numeric = value.replace(/\D+/g, '')

  filters.value[key] = numeric === '' ? null : Math.min(Number(numeric), MAX_RATING)
}

function getFiltersFromQuery () {
  const query = route.query

  filters.value = {
    ratingFrom: query.ratingFrom != null ? Number(query.ratingFrom) : null,
    ratingTo: query.ratingTo != null ? Number(query.ratingTo) : null,
    positions: parseQueryArray(query.positions, Number),
    roles: parseQueryArray(query.roles),
    teamStatus: parseQueryArray(query.teamStatus, v => Boolean(Number(v))),
    verificationStatus: parseQueryArray(query.verificationStatus)
  }
}

onMounted(() => {
  getFiltersFromQuery()
})

</script>
