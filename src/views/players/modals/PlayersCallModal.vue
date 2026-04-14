<template>
  <el-dialog
    :model-value="modelValue"

    destroy-on-close
    width="500"
    title="Звязатися з гравцями"
    @close="onReset"
  >
    <el-form
      v-loading.fullscreen="loading"
      :model="form"
      label-position="top"
      class="flex flex-col gap-16"
    >
      <!-- Select: Тип пошуку -->
      <el-form-item label="Тип пошуку">
        <el-select
          v-model="form.searchType"
          placeholder="Оберіть тип пошуку"
          class="w-full"
          no-data-text="Немає доступних чатів"
          :show-arrow="false"
        >
          <el-option
            v-for="opt in chats"
            :key="opt.discord_id"
            :label="opt.label || ''"
            :value="opt.discord_id"
          />
        </el-select>
      </el-form-item>

      <!-- Фільтри з query -->
      <el-form-item v-if="filterTags.length" label="Фільтри">
        <div class="flex flex-wrap gap-8 mb-8">
          <el-tag
            v-for="tag in filterTags"
            :key="tag"
            type="info"
            size="small"
            class="bg-white/10 border-white/10 text-white rounded-lg"
          >
            {{ tag }}
          </el-tag>
        </div>
      </el-form-item>

      <!-- Textarea: повідомлення -->
      <el-form-item label="Повідомлення">
        <el-input
          v-model="form.message"
          type="textarea"
          maxlength="100"
          show-word-limit
          resize="none"
          placeholder="Введіть повідомлення (до 100 символів)"
          class="w-full"
          :rows="4"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-12 pt-12">
        <el-button @click.stop="onReset">
          <span class="text-sm font-medium">Скасувати</span>
        </el-button>

        <el-tooltip
          content="Оберіть чат для відправки сповіщення."
          placement="top"
          :disabled="Boolean(form.searchType && playerIds.length)"
        >
          <el-button
            type="primary"
            :disabled="!form.searchType || !playerIds.length"
            @click.stop="onSend"
          >
            <span class="text-sm font-medium">
              Сповістити {{ playerIds.length + (playerIds.length > 1 ? ' гравців' : ' гравця') }}
            </span>
          </el-button>
        </el-tooltip>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { roleLabelMap, EUserIsTeam, hasTeamLabelMap, verificationOptions, positionOptions } from '@/components/player-tags/player.constants'
import type { ERole } from '@/types/general.types'

interface IMessageForm {
  searchType: string | null
  message: string
}

defineProps<{ playerIds: string[] }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const modelValue = ref(false)
const loading = ref(false)
const form = ref<IMessageForm>({
  searchType: null,
  message: ''
})

// TODO: endpoint not in API yet (/constants/chats)
const chats = computed(() => [] as any[])
const route = useRoute()

const filterTags = computed<string[]>(() => {
  const query = route.query
  const tags: string[] = []

  if (query.ratingFrom || query.ratingTo) {
    const min = query.ratingFrom ?? ''
    const max = query.ratingTo ?? ''
    tags.push(`${min}-${max} MMP`)
  }

  if (query.positions) {
    String(query.positions).split(',').forEach(posValue => {
      const pos = positionOptions.find(p => String(p.value) === posValue)
      if (pos) tags.push(pos.label)
    })
  }

  if (query.roles) {
    String(query.roles).split(',').forEach(r => {
      if (r in roleLabelMap) tags.push(roleLabelMap[r as ERole])
    })
  }

  if (query.teamStatus) {
    String(query.teamStatus).split(',').forEach(s => {
      const val = Number(s)
      if (val in hasTeamLabelMap) tags.push(hasTeamLabelMap[val as EUserIsTeam])
    })
  }

  if (query.verificationStatus) {
    String(query.verificationStatus).split(',').forEach(v => {
      const opt = verificationOptions.find(o => o.value === v)
      if (opt) tags.push(opt.label)
    })
  }

  return tags
})

// Скидання форми + закриття діалогу
function onReset () {
  form.value.searchType = null
  form.value.message = ''
  emit('update:modelValue', false)
}

async function onSend () {
  // TODO: endpoint not in API yet (callPlayers)
  ElMessage.info('Функціонал callPlayers ще не реалізований в API')
  loading.value = true
  try {
    onReset()
  } catch {
    ElMessage.error('Не вдалося надіслати повідомлення')
  } finally {
    loading.value = false
  }
}
</script>
