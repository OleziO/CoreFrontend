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
      <el-form-item v-if="!isVerified || isAdmin" label="MMR">
        <el-input
          v-model="form.mmr"
          type="text"
          inputmode="numeric"
          placeholder="0 – 22000"
          @input="onMmrInput"
        />
      </el-form-item>
      <el-button v-else type="primary" @click="openRequestMmrModal">
        Надіслати запит на оновлення MMP
      </el-button>

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

      <el-form-item label="Отримувати сповіщення Discord">
        <el-switch
          v-model="form.isNotification"
          style="--el-switch-on-color: #43bfee; --el-switch-off-color: #ff4949; --el-text-color-primary: #fff"
          active-text="Отримувати"
          inactive-text="Не отримувати"
        />
      </el-form-item>

      <!-- Discord -->
      <el-form-item label="Discord">
        <div
          class="flex items-center justify-between w-full
                 rounded-12 border border-white/10
                 bg-white/5 px-16 py-12"
        >
          <div class="flex items-center gap-8">
            <PhDiscordLogo size="20" class="text-indigo-500" />

            <span
              v-if="hasDiscord"
              class="text-sm text-green-500 font-medium"
            >
              Discord приєднано
            </span>

            <span
              v-else
              class="text-sm text-gray-400"
            >
              Discord не приєднано
            </span>
          </div>

          <el-button
            v-if="!hasDiscord"
            type="primary"
            size="small"
            @click="onConnectDiscord"
          >
            Приєднати
          </el-button>
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
          @click="onSubmit"
        >
          Зберегти
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { PhDiscordLogo } from '@phosphor-icons/vue'
import { ElMessage } from 'element-plus'
import { positionOptions } from '@/components/player-tags/player.constants'
import checkRoles from '@/core/helpers'
import { ERole } from '@/types/general.types'
import { useAuthStore } from '@/store/modules/auth'
import { useAppModals } from '@/composables/use-app-modals'
import type { TPlayer as Player } from '@/api/types/api.types'

interface IEditProfileForm {
  mmr: number | null
  positions: number[]
  isNotification?: boolean
}

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'submit', payload: IEditProfileForm): void
  (e: 'connect-discord'): void
  (e: 'updated', player: Player): void
}>()

const props = defineProps<{
  player: Player
  onUpdated?: (player: Player) => void
}>()

const authStore = useAuthStore()
// const playersStore = usePlayersStore()

const { open: openModal } = useAppModals()
// const playerStore = usePlayersStore()

const form = ref<IEditProfileForm>({
  mmr: props.player.rating ?? null,
  positions: [],
  isNotification: true
})

const hasDiscord = computed(() => !!props.player.discordId)

const isVerified = computed(() => {
  const roles = props.player.roles || []
  return !checkRoles(roles, ERole.GUEST)
})

const isAdmin = computed(() => {
  return checkRoles(authStore.user?.roles || [], ERole.MODERATOR) || checkRoles(props.player.roles || [], ERole.ADMIN)
})

const isValid = computed(() => {
  // Для верифицированных пользователей валидация MMP не требуется
  if (isVerified.value) {
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

function onConnectDiscord () {
  const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL
  const token = authStore.token

  if (!token) {
    ElMessage.error('Помилка: токен авторизації не знайдено')
    return
  }

  window.location.href = `${apiPublicUrl}/api/v1/discord/login?token=${token}`
}

function openRequestMmrModal () {
  modelValue.value = false

  nextTick(() => {
    openModal('ProfileRequestMmrModal')
  })
}

async function onSubmit () {
  if (!isValid.value) return

  // TODO: endpoint not in API yet (updateMyProfileData)
  ElMessage.info('Функціонал оновлення профілю ще не реалізований в API')

  emit('submit', form.value)
  modelValue.value = false
}

function onClose () {
  modelValue.value = false
}
</script>
