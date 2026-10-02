<template>
  <FindDialog
    v-model="modelValue"
    label="Шукаю команду"
    :title="listing ? 'Моє оголошення' : 'Нове оголошення'"
    @open="onOpen"
  >
    <div class="flex flex-col gap-18">
      <p v-if="blockReasons.length" class="find-note is-warning">
        <PhWarning :size="16" weight="bold" />
        <span>
          {{ findBlockReasonText(blockReasons) }}.
          <RouterLink :to="{ name: routeNames.profile }" class="text-primary" @click="modelValue = false">
            Перейти в профіль
          </RouterLink>
        </span>
      </p>

      <p v-else class="find-note">
        <PhInfo :size="16" weight="bold" />
        <span>
          MMR, позиції, формат і місто беруться з вашого профілю й оновлюються самі.
          Оголошення зникне, щойно ви приєднаєтесь до команди.
        </span>
      </p>

      <div class="find-field">
        <label class="find-field__label" for="find-listing-description">
          Про себе <span class="text-white/35">необовʼязково</span>
        </label>
        <el-input
          id="find-listing-description"
          v-model="description"
          type="textarea"
          :rows="4"
          :maxlength="FIND_TEXT_MAX_LENGTH"
          show-word-limit
          resize="none"
          placeholder="Досвід, улюблені герої, коли можете грати, яку команду шукаєте…"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button type="primary" :loading="saving" :disabled="blockReasons.length > 0" @click="submit">
        <PhCheck :size="16" weight="bold" />
        <span>{{ listing ? 'Зберегти' : 'Опублікувати' }}</span>
      </el-button>
    </template>
  </FindDialog>
</template>

<script setup lang="ts">
import { PhCheck, PhInfo, PhWarning } from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import type { TPlayerListing } from '@/api/types/api.types'
import FindDialog from '@/views/find/components/FindDialog.vue'
import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { FIND_TEXT_MAX_LENGTH, findBlockReasonText } from '@/views/find/find.utils'

const props = defineProps<{
  /** Наявне оголошення — редагування опису. */
  listing?: TPlayerListing | null
  onSaved?: (listing: TPlayerListing) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const findStore = useFindStore()

const description = ref('')
const saving = ref(false)

/** Редагувати своє оголошення можна завжди; нове — лише без блокувань. */
const blockReasons = computed(() => (props.listing ? [] : findStore.me?.listingBlockReasons ?? []))

function onOpen () {
  description.value = props.listing?.description ?? ''
  findStore.loadMe()
}

async function submit () {
  saving.value = true
  try {
    const saved = await findService.upsertMyListing({ description: description.value.trim() || null })
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
