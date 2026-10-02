<template>
  <FindDialog
    v-model="modelValue"
    label="Пошук гравців"
    :title="isEdit ? 'Редагувати оголошення' : 'Нове оголошення'"
    @open="onOpen"
  >
    <div class="flex flex-col gap-18">
      <!-- Від імені якої команди: лише коли є вибір (адмін або кілька команд) -->
      <div v-if="!isEdit && teamOptions.length > 1" class="find-field">
        <label class="find-field__label" for="find-post-team">Команда</label>
        <el-select
          id="find-post-team"
          v-model="selectedTeamId"
          filterable
          :loading="teamsLoading"
          placeholder="Оберіть команду"
          class="w-full"
        >
          <el-option v-for="team in teamOptions" :key="team.id" :label="team.name" :value="team.id" />
        </el-select>
      </div>
      <p v-else-if="!isEdit && teamOptions.length === 0 && !teamsLoading" class="find-note is-warning">
        <PhWarning :size="16" weight="bold" />
        <span>Оголошення може створити лише капітан чи тренер команди або адмін.</span>
      </p>

      <div class="find-field">
        <span class="find-field__label">
          Позиції, яких шукаєте
          <span v-if="showErrors && !form.positions.length" class="text-error">Оберіть хоча б одну</span>
        </span>
        <FilterChips v-model="form.positions" :options="positionChipOptions" />
      </div>

      <div class="find-field">
        <span id="find-post-needed-label" class="find-field__label">Потрібно гравців</span>
        <!-- 1–5: одна кнопка на число замість степера — вибір в один дотик -->
        <div
          role="radiogroup"
          aria-labelledby="find-post-needed-label"
          class="needed-picker"
          @keydown.left.prevent="stepNeeded(-1)"
          @keydown.right.prevent="stepNeeded(1)"
        >
          <button
            v-for="n in FIND_PLAYERS_NEEDED_MAX"
            :key="n"
            type="button"
            role="radio"
            class="needed-picker__option"
            :class="{ 'is-selected': form.playersNeeded === n }"
            :aria-checked="form.playersNeeded === n"
            :tabindex="form.playersNeeded === n ? 0 : -1"
            @click="form.playersNeeded = n"
          >
            {{ n }}
          </button>
        </div>
      </div>

      <div class="find-field">
        <span class="find-field__label">
          Діапазон MMR
          <span v-if="showErrors && mmrError" class="text-error">{{ mmrError }}</span>
        </span>
        <FilterRange
          v-model:from="form.mmrMin"
          v-model:to="form.mmrMax"
          :max="FIND_MMR_MAX"
          unit="MMR"
          aria-label="Діапазон MMR"
        />
        <p class="find-field__hint">Вкажіть мінімум, максимум або обидва — інші гравці не зможуть подати заявку.</p>
      </div>

      <div class="find-field">
        <span class="find-field__label">Формат <span class="text-white/35">необовʼязково</span></span>
        <FilterChips v-model="form.formats" :options="formatChipOptions" />
      </div>

      <div class="find-field">
        <label class="find-field__label" for="find-post-description">
          Опис <span class="text-white/35">необовʼязково</span>
        </label>
        <el-input
          id="find-post-description"
          v-model="form.description"
          type="textarea"
          :rows="3"
          :maxlength="FIND_TEXT_MAX_LENGTH"
          show-word-limit
          resize="none"
          placeholder="Розклад тренувань, цілі команди, що очікуєте від гравця…"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" :loading="saving" :disabled="!selectedTeamId" @click="submit">
        <PhCheck :size="16" weight="bold" />
        <span>{{ isEdit ? 'Зберегти' : 'Опублікувати' }}</span>
      </el-button>
    </template>
  </FindDialog>
</template>

<script setup lang="ts">
import { PhCheck, PhWarning } from '@phosphor-icons/vue'
import { positionOptions, wantToPlayOptions } from '@/components/player-tags/player.enums'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import type { TTeamPost, TTournamentFormat } from '@/api/types/api.types'
import FindDialog from '@/views/find/components/FindDialog.vue'
import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { useFindTeamOptions } from '@/views/find/composables/use-find-team-options'
import { FIND_MMR_MAX, FIND_PLAYERS_NEEDED_MAX, FIND_TEXT_MAX_LENGTH } from '@/views/find/find.utils'

type TPosition = 1 | 2 | 3 | 4 | 5

const props = defineProps<{
  /** Редагування наявного оголошення; без нього — створення. */
  post?: TTeamPost
  /** Команда за замовчуванням для нового оголошення. */
  teamId?: string
  onSaved?: (post: TTeamPost) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const findStore = useFindStore()
const { options: teamOptions, loading: teamsLoading, load: loadTeams } = useFindTeamOptions()

const isEdit = computed(() => !!props.post)

const positionChipOptions: IFilterChipOption<TPosition>[] = positionOptions.map(pos => ({
  value: pos.value as TPosition,
  label: pos.label,
  icon: pos.icon,
  hint: String(pos.value)
}))

const formatChipOptions: IFilterChipOption<TTournamentFormat>[] = wantToPlayOptions.map(opt => ({
  value: opt.value,
  label: opt.label,
  icon: opt.icon
}))

interface IForm {
  positions: TPosition[]
  playersNeeded: number
  mmrMin: number | null
  mmrMax: number | null
  formats: TTournamentFormat[]
  description: string
}

const form = reactive<IForm>({
  positions: [],
  playersNeeded: 1,
  mmrMin: null,
  mmrMax: null,
  formats: [],
  description: ''
})

const selectedTeamId = ref<string | null>(null)
const saving = ref(false)
const showErrors = ref(false)

/** Стрілки ←/→ у групі радіо-кнопок; фокус іде за вибором. */
function stepNeeded (delta: number) {
  const next = Math.min(FIND_PLAYERS_NEEDED_MAX, Math.max(1, form.playersNeeded + delta))
  form.playersNeeded = next
  nextTick(() => {
    document.querySelector<HTMLElement>('.needed-picker__option.is-selected')?.focus()
  })
}

const mmrError = computed(() => {
  if (form.mmrMin == null && form.mmrMax == null) return 'Вкажіть мінімум або максимум'
  if (form.mmrMin != null && form.mmrMax != null && form.mmrMin > form.mmrMax) return 'Мінімум більший за максимум'
  return ''
})

async function onOpen () {
  showErrors.value = false
  if (props.post) {
    selectedTeamId.value = props.post.team.id
    form.positions = [...props.post.positions]
    form.playersNeeded = props.post.playersNeeded
    form.mmrMin = props.post.mmrMin ?? null
    form.mmrMax = props.post.mmrMax ?? null
    form.formats = [...props.post.formats]
    form.description = props.post.description ?? ''
    return
  }
  await loadTeams()
  selectedTeamId.value = props.teamId ?? teamOptions.value[0]?.id ?? null
}

async function submit () {
  showErrors.value = true
  if (!selectedTeamId.value || !form.positions.length || mmrError.value) return

  const body = {
    positions: form.positions,
    playersNeeded: form.playersNeeded,
    mmrMin: form.mmrMin,
    mmrMax: form.mmrMax,
    formats: form.formats,
    description: form.description.trim() || null
  }

  saving.value = true
  try {
    const saved = props.post
      ? await findService.updateTeamPost(props.post.id, body)
      : await findService.createTeamPost({ ...body, teamId: selectedTeamId.value })
    findStore.refreshMe()
    props.onSaved?.(saved)
    modelValue.value = false
  } catch {
    // тост уже показав findService
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
// Players-needed picker: a row of five numbered tiles in the same well /
// cyan-lit vocabulary as the slot picker and the position pips on the cards.
.needed-picker {
  @apply grid gap-6;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  max-width: 260px;
}

.needed-picker__option {
  @apply relative inline-flex h-40 items-center justify-center overflow-hidden rounded-lg border p-0;
  font-family: var(--ds-font-mono);
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
  border-color: var(--ds-border);
  background: rgba(7, 8, 15, 0.45);
  cursor: pointer;
  transition:
    color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  // Top rail lights up on the chosen tile.
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 2px;
    background: var(--ds-primary);
    box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.9);
    opacity: 0;
    transition: opacity var(--ds-duration-fast) ease;
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: 2px;
  }

  &.is-selected {
    color: #fff;
    border-color: rgba(var(--ds-primary-rgb), 0.6);
    background: rgba(var(--ds-primary-rgb), 0.12);
    box-shadow: 0 0 14px rgba(var(--ds-primary-rgb), 0.18);

    &::before {
      opacity: 1;
    }
  }
}

@media (hover: hover) and (pointer: fine) {
  .needed-picker__option:not(.is-selected):hover {
    color: var(--ds-text);
    border-color: rgba(var(--ds-primary-rgb), 0.4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .needed-picker__option {
    transition: none;
  }
}
</style>
