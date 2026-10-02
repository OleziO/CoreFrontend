<template>
  <FindDialog v-model="modelValue" label="Запрошення" :title="playerName" @open="onOpen">
    <div class="flex flex-col gap-18">
      <div v-if="teamOptions.length > 1" class="find-field">
        <label class="find-field__label" for="find-invite-team">Від імені команди</label>
        <el-select
          id="find-invite-team"
          v-model="teamId"
          filterable
          :loading="teamsLoading"
          placeholder="Оберіть команду"
          class="w-full"
        >
          <el-option v-for="team in teamOptions" :key="team.id" :label="team.name" :value="team.id" />
        </el-select>
      </div>
      <p v-else-if="selectedTeam" class="find-note">
        <PhUsersThree :size="16" weight="bold" />
        <span>Запрошення від команди <b class="text-white">{{ selectedTeam.name }}</b>.</span>
      </p>
      <p v-else-if="!teamsLoading" class="find-note is-warning">
        <PhWarning :size="16" weight="bold" />
        <span>Запрошувати можуть лише капітан чи тренер команди або адмін.</span>
      </p>

      <div v-if="selectedTeam" class="find-field">
        <span class="find-field__label">Роль у команді</span>
        <FindSlotPicker v-model="slot" :disabled-reasons="slotReasons" />
      </div>

      <div class="find-field">
        <label class="find-field__label" for="find-invite-message">
          Повідомлення <span class="text-white/35">необовʼязково</span>
        </label>
        <el-input
          id="find-invite-message"
          v-model="message"
          type="textarea"
          :rows="3"
          :maxlength="FIND_TEXT_MAX_LENGTH"
          show-word-limit
          resize="none"
          placeholder="Чому кличете саме цього гравця, коли тренування…"
        />
      </div>

      <p class="find-field__hint">
        Гравець отримає сповіщення й матиме тиждень, щоб відповісти.
        <template v-if="invitesLeft != null">
          Сьогодні команда ще може надіслати запрошень:
          <b class="text-white">{{ invitesLeft }}</b> з {{ FIND_DAILY_LIMIT }}.
          З VIP — без обмежень.
        </template>
      </p>
    </div>

    <template #footer>
      <el-button @click="modelValue = false">Скасувати</el-button>
      <el-button
        type="primary"
        :loading="sending"
        :disabled="!selectedTeam || !!slotReasons[slot] || invitesLeft === 0"
        @click="submit"
      >
        <PhUserPlus :size="16" weight="bold" />
        <span>Запросити</span>
      </el-button>
    </template>
  </FindDialog>
</template>

<script setup lang="ts">
import { PhUserPlus, PhUsersThree, PhWarning } from '@phosphor-icons/vue'
import type { TJoinRequest, TTeamMemberSlot } from '@/api/types/api.types'
import FindDialog from '@/views/find/components/FindDialog.vue'
import FindSlotPicker from '@/views/find/components/FindSlotPicker.vue'
import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { useFindTeamOptions } from '@/views/find/composables/use-find-team-options'
import {
  FIND_DAILY_LIMIT,
  FIND_TEXT_MAX_LENGTH,
  findFirstOpenSlot,
  findSlotDisabledReasons
} from '@/views/find/find.utils'

const props = defineProps<{
  player: { id: string; discordName?: string | null; discordUsername?: string | null }
  onInvited?: (request: TJoinRequest) => void
}>()

const modelValue = defineModel<boolean>({ default: false })

const findStore = useFindStore()
const { options: teamOptions, loading: teamsLoading, load: loadTeams } = useFindTeamOptions()

const playerName = computed(() => props.player.discordName || props.player.discordUsername || 'Гравець')

const teamId = ref<string | null>(null)
const slot = ref<TTeamMemberSlot>('main')
const message = ref('')
const sending = ref(false)

const selectedTeam = computed(() => teamOptions.value.find(t => t.id === teamId.value) ?? null)
const slotReasons = computed(() => (selectedTeam.value ? findSlotDisabledReasons(selectedTeam.value.roster) : {}))

/** Ліміт на добу — лише для моїх команд; адмін і VIP без обмежень (тоді `null`). */
const invitesLeft = computed(() => {
  if (findStore.isAdmin) return null
  return findStore.managedTeams.find(m => m.team.id === teamId.value)?.invitesLeft ?? null
})

watch(selectedTeam, (team) => {
  if (team && slotReasons.value[slot.value]) slot.value = findFirstOpenSlot(team.roster) ?? 'main'
})

async function onOpen () {
  message.value = ''
  await loadTeams()
  teamId.value = teamOptions.value[0]?.id ?? null
  slot.value = selectedTeam.value ? findFirstOpenSlot(selectedTeam.value.roster) ?? 'main' : 'main'
}

async function submit () {
  if (!teamId.value) return
  sending.value = true
  try {
    const request = await findService.invite({
      teamId: teamId.value,
      playerId: props.player.id,
      slot: slot.value,
      message: message.value.trim() || null
    })
    findStore.refreshMe()
    props.onInvited?.(request)
    modelValue.value = false
  } catch {
    // тост уже показав findService
  } finally {
    sending.value = false
  }
}
</script>
