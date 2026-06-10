<template>
  <div class="min-h-screen bg-gray-950 text-white py-40 px-20">
    <div
      class="max-w-[600px] mx-auto bg-gradient-to-br from-gray-900 via-gray-850 to-gray-950
        rounded-3xl border border-gray-800 shadow-[0_0_25px_rgba(0,0,0,0.4)]
        p-40 flex flex-col gap-30 relative overflow-hidden"
    >
      <div class="flex items-center gap-30 border-b border-gray-800 pb-30">
        <el-avatar
          :src="user?.avatarUrl ?? ''"
          size="large"
          class="ring-2 ring-gray-700 shadow-md"
        />
        <div class="flex flex-col justify-center">
          <h1 class="text-2xl font-semibold text-white leading-tight">
            {{ user?.discordName }}
          </h1>
          <p class="text-gray-400 text-sm">@{{ user?.discordUsername }}</p>
        </div>
      </div>

      <div
        class="bg-elevated-surface/60 border border-white/10 rounded-2xl p-20 flex flex-col gap-10"
      >
        <div class="flex flex-col items-start justify-between w-full gap-20">
          <h2 class="text-lg font-semibold text-white">
            Інтеграція з discord
          </h2>
          <div class="flex items-center gap-x-20">
            <p class="text-green-500 text-sm">
              {{ user?.discordId
                ?
                  "Ваш обліковий запис Discord успішно прив'язаний."
                : "Ваш обліковий запис Discord ще не прив'язаний." }}
            </p>
            <a
              :href="`${apiPublicUrl}/api/v1/discord/login?token=${authStore.token}`"
            >
              <el-button
                type="primary"
                class="bg-primary hover:bg-primary/90 transition-all duration-300"
                tag="a"
              >
                Оновити discord
              </el-button>
            </a>
          </div>
        </div>
      </div>

      <div
        class="bg-elevated-surface/60 border border-white/10 rounded-2xl p-20 flex flex-col gap-10"
      >
        <div class="flex flex-col items-start gap-20">
          <h2 class="text-lg font-semibold text-white">
            Ігрові дані
          </h2>
          <div class="flex items-center gap-x-20 justify-between w-full">
            <p
              class="text-sm"
              :class="user?.rating ? 'text-success' : 'text-warning'"
            >
              {{ user?.rating
                ?
                  "Дані гравця успішно додані"
                : "Дані гравця не були додані, це не дозволить вступити до команди" }}
            </p>
            <el-button
              type="primary"
              class="bg-primary hover:bg-primary/90 transition-all duration-300"
              tag="a"
              @click="showPositionModal = true"
            >
              Оновити позицію
            </el-button>
          </div>
        </div>
      </div>

      <RoleGuard :exclude-roles="['unverified']">
        <div
          class="bg-elevated-surface/60 border border-white/10 rounded-2xl p-20 flex flex-col gap-10"
        >
          <div class="flex flex-col items-start gap-20">
            <h2 class="text-lg font-semibold text-white">
              Запит на оновлення MMR
            </h2>
            <div class="flex items-center gap-x-20 justify-between w-full">
              <p class="text-gray-400 text-sm">
                Надішліть запит на оновлення вашого MMR з доказом
              </p>
              <el-button
                type="primary"
                class="bg-primary hover:bg-primary/90 transition-all duration-300"
                @click="showRequestMmrModal = true"
              >
                Надіслати запит
              </el-button>
            </div>
          </div>
        </div>
      </RoleGuard>

      <RoleGuard :roles="['unverified']">
        <div
          class="bg-elevated-surface/60 border border-white/10 rounded-2xl p-20 flex flex-col gap-10"
        >
          <div class="flex flex-col items-start gap-20">
            <h2 class="text-lg font-semibold text-white">
              Оновлення MMR
            </h2>
            <div class="flex items-center gap-x-20 justify-between w-full">
              <p class="text-gray-400 text-sm">
                Вкажіть ваш новий MMR
              </p>
              <el-button
                type="primary"
                class="bg-primary hover:bg-primary/90 transition-all duration-300"
                @click="showMmrUnverifiedModal = true"
              >
                Оновити MMR
              </el-button>
            </div>
          </div>
        </div>
      </RoleGuard>

      <!-- <RoleGuard :roles="['admin', 'moderator']">
        <div
          class="bg-elevated-surface/60 border border-white/10 rounded-2xl p-20 flex flex-col gap-10"
        >
          <div class="flex flex-col items-start gap-20">
            <h2 class="text-lg font-semibold text-white">
              Оновити рейтинг гравця
            </h2>
            <div class="flex items-center gap-x-20 justify-between w-full">
              <p class="text-green-500 text-sm">
                {{ user?.mmr
                  ?
                    user?.mmr + ' MMR'
                  : "Гравець ще не вказав свій MMR" }}
              </p>
              <el-button
                type="primary"
                class="bg-primary hover:bg-primary/90 transition-all duration-300"
                tag="a"
                @click="showMmrModal = true"
              >
                Оновити MMR гравця
              </el-button>
            </div>
          </div>
        </div>
      </RoleGuard> -->
    </div>
  </div>
  <ProfileUpdatePositionModal
    v-model:showPositionModal="showPositionModal"
    v-model:selectedPositions="selectedPositions"
  />
  <ProfileUpdateMmrModal
    v-model:showMmrModal="showMmrModal"
    v-model:selectedMmr="selectedMmr"
  />
  <ProfileRequestMmrModal
    v-model:showRequestMmrModal="showRequestMmrModal"
  />
  <ProfileUpdateMmrUnverifiedModal
    v-model:showMmrUnverifiedModal="showMmrUnverifiedModal"
  />
</template>

<script setup lang="ts">

const apiPublicUrl = import.meta.env.VITE_API_PUBLIC_URL

const authStore = useAuthStore()

const showPositionModal = ref(false)
const showMmrModal = ref(false)
const showRequestMmrModal = ref(false)
const showMmrUnverifiedModal = ref(false)

const selectedPositions = ref<number[] | undefined>()
const selectedMmr = ref<number | null | undefined>()

const user = computed(() => {
  return authStore.user
})

onMounted(() => {
  // TODO: positions and mmr not in API yet
  selectedPositions.value = []
  selectedMmr.value = authStore.user?.rating ?? null
})
</script>
