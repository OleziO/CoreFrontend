<template>
  <div class="find relative flex w-full flex-col text-white">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[280px]
             bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(var(--ds-primary-rgb),0.1),transparent_70%)]"
      aria-hidden="true"
    />

    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-16 pb-40 lg:px-24">
      <!-- ================= HEADER ================= -->
      <header class="find-head">
        <div class="flex min-w-0 flex-col gap-6">
          <span class="sys-label">// Пошук</span>
          <h1 class="find-head__title">Пошук команди</h1>
          <p class="find-head__subtitle">
            Команди публікують, кого шукають, — гравці подають заявки. Гравці без команди виставляють
            оголошення — капітани запрошують.
          </p>
        </div>

        <!-- Головна дія вкладки -->
        <template v-if="tab === 'teams'">
          <el-button v-if="myTeamPost" type="primary" @click="editPost(myTeamPost)">
            <PhPencilSimple :size="16" weight="bold" />
            <span class="ml-6">Моє оголошення</span>
          </el-button>
          <el-button v-else-if="findStore.canPostForTeam" type="primary" @click="createPost">
            <PhMegaphone :size="16" weight="bold" />
            <span class="ml-6">Шукаю гравців</span>
          </el-button>
        </template>
        <template v-else>
          <el-button v-if="myListing" type="primary" @click="editListing(myListing)">
            <PhPencilSimple :size="16" weight="bold" />
            <span class="ml-6">Моє оголошення</span>
          </el-button>
          <el-button v-else-if="canPublishListing" type="primary" @click="createListing">
            <PhMegaphone :size="16" weight="bold" />
            <span class="ml-6">Шукаю команду</span>
          </el-button>
        </template>
      </header>

      <!-- ================= TABS + TOOLBAR ================= -->
      <div class="find-toolbar">
        <div class="find-tabs" role="tablist" aria-label="Що шукаємо">
          <button
            v-for="item in TABS"
            :key="item.value"
            type="button"
            role="tab"
            class="find-tab"
            :class="{ 'is-active': tab === item.value }"
            :aria-selected="tab === item.value"
            @click="switchTab(item.value)"
          >
            <component :is="item.icon" :size="16" :weight="tab === item.value ? 'fill' : 'bold'" />
            <span>{{ item.label }}</span>
            <span v-if="tab === item.value && !activeList.loading.value" class="find-tab__count">
              {{ activeList.total.value }}
            </span>
          </button>
        </div>

        <div class="flex min-w-0 flex-1 items-center gap-8 md:max-w-[460px]">
          <el-badge :value="activeFiltersCount" :hidden="!activeFiltersCount">
            <el-button type="primary" class="btn-icon" aria-label="Фільтрувати" @click="openFilters">
              <PhSlidersHorizontal :size="20" weight="bold" />
            </el-button>
          </el-badge>
          <el-input
            v-model="search"
            class="flex-1"
            :placeholder="tab === 'teams' ? 'Пошук по назві команди' : 'Пошук по ніку'"
            clearable
          >
            <template #prepend>
              <PhMagnifyingGlass :size="16" />
            </template>
          </el-input>
        </div>
      </div>

      <!-- ================= LIST ================= -->
      <div v-if="activeList.loading.value" class="find-grid" aria-busy="true" aria-label="Завантажуємо">
        <span v-for="n in 6" :key="n" class="skeleton-bone block h-[280px] !rounded-2xl" />
      </div>

      <p v-else-if="activeList.failed.value" class="find-empty text-error">
        Не вдалося завантажити оголошення.
        <button type="button" class="text-primary" @click="activeList.reload()">Спробувати ще раз</button>
      </p>

      <p v-else-if="!activeList.items.value.length" class="find-empty">
        <PhBinoculars :size="28" weight="duotone" class="text-primary/50" />
        <span>{{ emptyText }}</span>
      </p>

      <template v-else>
        <div v-if="tab === 'teams'" class="find-grid">
          <FindTeamPostCard
            v-for="post in teamPosts.items.value"
            :key="post.id"
            :post="post"
            :busy="busyIds.has(post.id)"
            @apply="applyTo"
            @withdraw="withdrawApplication"
            @edit="editPost"
            @close="closePost"
          />
        </div>

        <div v-else class="find-grid">
          <FindPlayerListingCard
            v-for="listing in playerListings.items.value"
            :key="listing.id"
            :listing="listing"
            :mine="listing.player.id === authStore.user?.id"
            :can-invite="findStore.canInvite"
            :is-admin="findStore.isAdmin"
            :busy="busyIds.has(listing.id)"
            @invite="invitePlayer"
            @cancel-invite="cancelInvite"
            @edit="editListing"
            @remove="removeMyListing"
            @moderate="moderateListing"
          />
        </div>

        <div v-if="activeList.hasMore.value" class="flex justify-center">
          <el-button :loading="activeList.loadingMore.value" @click="activeList.loadMore()">
            Показати ще
            <span class="ml-6 text-white/45">
              {{ activeList.items.value.length }} / {{ activeList.total.value }}
            </span>
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  PhBinoculars,
  PhMagnifyingGlass,
  PhMegaphone,
  PhPencilSimple,
  PhSlidersHorizontal,
  PhUser,
  PhUsersThree
} from '@phosphor-icons/vue'
import { routeNames } from '@/router/route-names'
import type { TJoinRequest, TPlayerListing, TTeamPost } from '@/api/types/api.types'
import type { TFindTab } from '@/views/find/find.d'
import FindTeamPostCard from '@/views/find/components/FindTeamPostCard.vue'
import FindPlayerListingCard from '@/views/find/components/FindPlayerListingCard.vue'
import { findService } from '@/views/find/find.service'
import { useFindStore } from '@/views/find/find.store'
import { useFindPagedList } from '@/views/find/composables/use-find-paged-list'
import { useFindRequestActions } from '@/views/find/composables/use-find-request-actions'
import {
  FIND_ALL_FILTER_QUERY_KEYS,
  FIND_SEARCH_QUERY_KEY,
  FIND_TAB_QUERY_KEY,
  countActiveFindPlayersFilters,
  countActiveFindTeamsFilters,
  parseFindPlayersFilters,
  parseFindSearch,
  parseFindTab,
  parseFindTeamsFilters,
  toPlayerListingsParams,
  toTeamPostsParams
} from '@/views/find/find-filters.utils'

const TABS: { value: TFindTab; label: string; icon: Component }[] = [
  { value: 'teams', label: 'Команди', icon: PhUsersThree },
  { value: 'players', label: 'Гравці', icon: PhUser }
]

const SEARCH_DEBOUNCE_MS = 350

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const findStore = useFindStore()
const { open } = useAppModals()
const requestActions = useFindRequestActions()

// ─── Стан у query: вкладка, пошук, фільтри ───────────────────────────────────
const tab = computed(() => parseFindTab(route.query))
const teamsFilters = computed(() => parseFindTeamsFilters(route.query))
const playersFilters = computed(() => parseFindPlayersFilters(route.query))
const querySearch = computed(() => parseFindSearch(route.query))

const activeFiltersCount = computed(() => (tab.value === 'teams'
  ? countActiveFindTeamsFilters(teamsFilters.value)
  : countActiveFindPlayersFilters(playersFilters.value)))

/** Поле пошуку пише в query із затримкою — тоді й перезавантажується список. */
const search = ref(querySearch.value)
const debouncedSearch = refDebounced(search, SEARCH_DEBOUNCE_MS)
watch(debouncedSearch, (value) => {
  if (value.trim() === querySearch.value.trim()) return
  const query = { ...route.query }
  if (value.trim()) query[FIND_SEARCH_QUERY_KEY] = value.trim()
  else delete query[FIND_SEARCH_QUERY_KEY]
  router.replace({ name: routeNames.find, query })
})
watch(querySearch, (value) => {
  if (value !== search.value.trim()) search.value = value
})

/** Інша вкладка — інший набір фільтрів, тому старі скидаємо. */
function switchTab (next: TFindTab) {
  if (next === tab.value) return
  const query = { ...route.query }
  for (const key of FIND_ALL_FILTER_QUERY_KEYS) delete query[key]
  if (next === 'players') query[FIND_TAB_QUERY_KEY] = next
  else delete query[FIND_TAB_QUERY_KEY]
  search.value = ''
  router.replace({ name: routeNames.find, query })
}

function openFilters () {
  open(tab.value === 'teams' ? 'FindTeamsFilterModal' : 'FindPlayersFilterModal')
}

// ─── Списки ──────────────────────────────────────────────────────────────────
const teamPosts = useFindPagedList<TTeamPost>(offset =>
  findService.fetchTeamPosts(toTeamPostsParams(teamsFilters.value, querySearch.value), offset))
const playerListings = useFindPagedList<TPlayerListing>(offset =>
  findService.fetchPlayerListings(toPlayerListingsParams(playersFilters.value, querySearch.value), offset))

/** Обидва списки мають однаковий інтерфейс — шаблон працює з активним. */
const activeList = computed(() => (tab.value === 'teams' ? teamPosts : playerListings))

const listKey = computed(() => JSON.stringify([
  tab.value,
  querySearch.value,
  tab.value === 'teams' ? teamsFilters.value : playersFilters.value
]))
watch(listKey, () => activeList.value.reload(), { immediate: true })

const emptyText = computed(() => {
  const filtered = activeFiltersCount.value > 0 || !!querySearch.value
  if (tab.value === 'teams') return filtered ? 'Немає оголошень за цими фільтрами' : 'Поки що жодна команда не шукає гравців'
  return filtered ? 'Немає гравців за цими фільтрами' : 'Поки що ніхто не шукає команду'
})

// ─── Мій стан: оголошення команди / гравця ───────────────────────────────────
onMounted(() => {
  findStore.loadMe()
})

const myTeamPost = computed(() => findStore.managedTeams.find(m => m.post)?.post ?? null)
const myListing = computed(() => findStore.me?.listing ?? null)
/** Кнопка «Шукаю команду» має сенс лише без команди; інші причини пояснить модалка. */
const canPublishListing = computed(() =>
  !!findStore.me && !findStore.me.listingBlockReasons.includes('has_team'))

const busyIds = reactive(new Set<string>())

async function withBusy (id: string, action: () => Promise<void>) {
  if (busyIds.has(id)) return
  busyIds.add(id)
  try {
    await action()
  } catch {
    // тост уже показав findService
  } finally {
    busyIds.delete(id)
  }
}

const confirmAction = (text: string, title: string, confirmButtonText: string) =>
  ElMessageBox.confirm(text, title, {
    confirmButtonText,
    cancelButtonText: 'Скасувати',
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(() => true).catch(() => false)

// ─── Оголошення команд ───────────────────────────────────────────────────────
function createPost () {
  open('FindTeamPostModal', { onSaved: () => teamPosts.reload() })
}

function editPost (post: TTeamPost) {
  open('FindTeamPostModal', { post, onSaved: (saved: TTeamPost) => teamPosts.replaceItem(saved) })
}

async function closePost (post: TTeamPost) {
  const ok = await confirmAction(
    'Оголошення зникне зі списку, а заявки, що чекають на відповідь, буде скасовано.',
    'Закрити оголошення?',
    'Закрити'
  )
  if (!ok) return
  await withBusy(post.id, async () => {
    await findService.closeTeamPost(post.id)
    teamPosts.removeItem(post.id)
    findStore.refreshMe()
  })
}

function applyTo (post: TTeamPost) {
  open('FindApplyModal', { post, onApplied: (next: TTeamPost) => teamPosts.replaceItem(next) })
}

async function withdrawApplication (post: TTeamPost) {
  const requestId = post.myApplication?.id
  if (!requestId) return
  await withBusy(post.id, async () => {
    await requestActions.withdraw(requestId)
    teamPosts.replaceItem({ ...post, myApplication: null })
  })
}

// ─── Оголошення гравців ──────────────────────────────────────────────────────
function createListing () {
  open('FindListingModal', { onSaved: () => playerListings.reload() })
}

function editListing (listing: TPlayerListing) {
  open('FindListingModal', {
    listing,
    onSaved: (saved: TPlayerListing) => {
      if (playerListings.items.value.some(l => l.id === saved.id)) playerListings.replaceItem(saved)
      else playerListings.reload()
    }
  })
}

async function removeMyListing (listing: TPlayerListing) {
  const ok = await confirmAction('Капітани більше не бачитимуть вас у списку.', 'Зняти оголошення?', 'Зняти')
  if (!ok) return
  await withBusy(listing.id, async () => {
    await findService.deleteMyListing()
    playerListings.removeItem(listing.id)
    findStore.refreshMe()
  })
}

async function moderateListing (listing: TPlayerListing) {
  const name = listing.player.discordName || listing.player.discordUsername || 'гравця'
  const ok = await confirmAction(`Оголошення ${name} буде видалено.`, 'Видалити оголошення?', 'Видалити')
  if (!ok) return
  await withBusy(listing.id, async () => {
    await findService.deleteListing(listing.id)
    playerListings.removeItem(listing.id)
  })
}

const toBrief = (request: TJoinRequest) => ({
  id: request.id,
  kind: request.kind,
  status: request.status,
  expiresAt: request.expiresAt,
  createdAt: request.createdAt
})

function invitePlayer (listing: TPlayerListing) {
  open('FindInviteModal', {
    player: listing.player,
    onInvited: (request: TJoinRequest) => playerListings.replaceItem({ ...listing, myTeamInvite: toBrief(request) })
  })
}

async function cancelInvite (listing: TPlayerListing) {
  const requestId = listing.myTeamInvite?.id
  if (!requestId) return
  await withBusy(listing.id, async () => {
    await requestActions.withdraw(requestId)
    playerListings.replaceItem({ ...listing, myTeamInvite: null })
  })
}
</script>

<style scoped lang="scss">
.find-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 28px;
}

.find-head__title {
  font-family: var(--ds-font-display);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ds-text-strong);
  text-shadow: var(--ds-neon-text-subtle);
}

@media (min-width: 768px) {
  .find-head__title {
    font-size: 34px;
  }
}

.find-head__subtitle {
  max-width: 640px;
  font-size: 14px;
  color: var(--ds-text-muted);
}

.find-toolbar {
  @apply flex flex-col gap-12 md:flex-row md:items-center md:justify-between;
}

.find-tabs {
  @apply inline-flex shrink-0 gap-4 self-start rounded-xl border p-4;
  border-color: rgba(var(--ds-primary-rgb), 0.18);
  background: rgba(7, 8, 15, 0.45);
}

.find-tab {
  @apply inline-flex h-36 items-center gap-8 rounded-lg border-0 bg-transparent px-14 text-sm font-semibold;
  color: var(--ds-text-muted);
  cursor: pointer;
  transition: color var(--ds-duration-fast) ease, background-color var(--ds-duration-fast) ease;

  &.is-active {
    color: #fff;
    background: rgba(var(--ds-primary-rgb), 0.16);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-primary-rgb), 0.45);

    svg {
      color: var(--ds-primary);
    }
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-primary-rgb), 0.7) !important;
    outline-offset: 2px;
  }
}

.find-tab__count {
  @apply rounded-md px-6 text-[11px] leading-[18px];
  font-family: var(--ds-font-mono);
  background: rgba(var(--ds-primary-rgb), 0.18);
  color: var(--ds-primary);
}

.find-grid {
  @apply grid gap-16;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.find-empty {
  @apply m-0 flex flex-col items-center gap-10 rounded-2xl border px-16 py-48 text-center text-sm;
  border-color: var(--ds-border);
  color: var(--ds-text-muted);
}

@media (hover: hover) and (pointer: fine) {
  .find-tab:not(.is-active):hover {
    color: var(--ds-text);
    background: rgba(255, 255, 255, 0.04);
  }
}
</style>
