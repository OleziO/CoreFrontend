<template>
  <FindDialog v-model="modelValue" label="Заявка" :title="post.team.name" @open="onOpen">
    <div class="flex flex-col gap-18">
      <p class="find-note">
        <PhInfo :size="16" weight="bold" />
        <span>
          Капітан побачить ваш профіль: MMR <b class="text-white">{{ myRating }}</b>, позиції та формат.
          Якщо заявку приймуть — ви одразу потрапите до складу.
        </span>
      </p>

      <div class="find-field">
        <span class="find-field__label">
          На яку позицію
          <span v-if="showErrors && position == null" class="text-error">Оберіть позицію</span>
        </span>
        <FilterChips v-model="positionModel" :options="positionChipOptions" :multiple="false" />
        <p class="find-field__hint">Лише ваші позиції, які шукає команда.</p>
      </div>

      <div class="find-field">
        <label class="find-field__label" for="find-apply-message">
          Про себе <span class="text-white/35">необовʼязково</span>
        </label>
        <el-input
          id="find-apply-message"
          v-model="message"
          type="textarea"
          :rows="3"
          :maxlength="FIND_TEXT_MAX_LENGTH"
          show-word-limit
          resize="none"
          placeholder="Досвід, улюблені герої, коли можете грати…"
        />
      </div>

      <p v-if="applicationsLeft != null" class="find-field__hint">
        Сьогодні ще можна подати заявок: <b class="text-white">{{ applicationsLeft }}</b> з {{ FIND_DAILY_LIMIT }}.
        З VIP — без обмежень.
      </p>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" :loading="sending" :disabled="applicationsLeft === 0" @click="submit">
        <PhPaperPlaneTilt :size="16" weight="bold" />
        <span>Надіслати заявку</span>
      </el-button>
    </template>
  </FindDialog>
</template>

<script setup lang="ts">
import { PhInfo, PhPaperPlaneTilt } from '@phosphor-icons/vue'
import { positionOptions } from '@/components/player-tags/player.enums'
import { getPlayerDotaPositions } from '@/core/helpers'
import type { IFilterChipOption } from '@/components/filters/filters.d'
import type { TTeamPost } from '@/api/types/api.types'
import FindDialog from '@/views/find/components/FindDialog.vue'
import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { FIND_DAILY_LIMIT, FIND_TEXT_MAX_LENGTH } from '@/views/find/find.utils'

type TPosition = 1 | 2 | 3 | 4 | 5

const props = defineProps<{
  post: TTeamPost
  onApplied?: (post: TTeamPost) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const findStore = useFindStore()

const myRating = computed(() => authStore.user?.rating ?? 0)

/** Мої позиції ∩ позиції оголошення — лише з них можна обрати. */
const matching = computed<TPosition[]>(() => {
  const wanted = new Set<number>(props.post.positions)
  return getPlayerDotaPositions(authStore.user)
    .filter(p => wanted.has(p))
    .map(p => p as TPosition)
})

const positionChipOptions = computed<IFilterChipOption<TPosition>[]>(() =>
  positionOptions
    .filter(p => matching.value.includes(p.value as TPosition))
    .map(p => ({ value: p.value as TPosition, label: p.label, icon: p.icon, hint: String(p.value) }))
)

const position = ref<TPosition | null>(null)
/** FilterChips працює з масивом навіть в одиночному режимі. */
const positionModel = computed<TPosition[]>({
  get: () => (position.value != null ? [position.value] : []),
  set: (next) => {
    position.value = next[0] ?? null
  }
})

const message = ref('')
const sending = ref(false)
const showErrors = ref(false)

const applicationsLeft = computed(() => findStore.me?.applicationsLeft ?? null)

function onOpen () {
  showErrors.value = false
  message.value = ''
  position.value = matching.value.length === 1 ? (matching.value[0] ?? null) : null
  findStore.loadMe()
}

async function submit () {
  showErrors.value = true
  if (position.value == null) return
  sending.value = true
  try {
    const post = await findService.apply(props.post.id, {
      position: position.value,
      message: message.value.trim() || null
    })
    findStore.refreshMe()
    props.onApplied?.(post)
    modelValue.value = false
  } catch {
    // тост уже показав findService
  } finally {
    sending.value = false
  }
}
</script>
