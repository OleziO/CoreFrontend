<template>
  <article class="bmatch" :class="[`is-${match.status.toLowerCase()}`, { 'is-mine': isMine }]">
    <span class="bmatch__glow" aria-hidden="true" />

    <!-- ─── Шапка ───────────────────────────────────────────────────────── -->
    <header class="bmatch__head">
      <div class="flex min-w-0 flex-col gap-4">
        <span class="bmatch__round">
          {{ bracketRoundLabel(match.round, rounds, match.isThirdPlace) }}
          <template v-if="!match.isThirdPlace && matchesInRound > 1"> · матч {{ match.position + 1 }}</template>
          <template v-if="match.duel"> · дуель #{{ match.duel.number }}</template>
        </span>
        <h3 class="bmatch__state">{{ stateLabel }}</h3>
      </div>
      <span v-if="match.status === 'LIVE' && match.duel?.state === 'LIVE'" class="bmatch__live">
        <span class="bmatch__live-dot" aria-hidden="true" />
        LIVE
      </span>
      <span v-else-if="isMine && isOpen" class="bmatch__mine">Ваш матч</span>
    </header>

    <!-- ─── Суперники та герої ─────────────────────────────────────────── -->
    <div class="bmatch__versus">
      <div
        v-for="(side, ix) in sides"
        :key="ix"
        class="bmatch__side"
        :class="{ 'is-winner': side.winner, 'is-loser': side.loser, 'is-right': ix === 1 }"
      >
        <RouterLink
          v-if="side.player"
          :to="{ name: routeNames.player, params: { id: side.player.id } }"
          class="bmatch__player no-underline"
        >
          <el-avatar :src="resolvePublicOrApiUrl(side.player.avatarUrl)" :size="44" class="bmatch__avatar">
            {{ duelPlayerInitial(side.player) }}
          </el-avatar>
          <span class="flex min-w-0 flex-col gap-2">
            <span class="bmatch__name">
              <PhCrown v-if="side.winner" :size="14" weight="fill" class="text-[var(--ds-gold)]" aria-hidden="true" />
              {{ duelPlayerName(side.player) }}
            </span>
            <span class="bmatch__sub">
              <template v-if="side.seed">Посів {{ side.seed }} · </template>{{ side.player.rating }} у дуелях
              <template v-if="side.lobbySide"> · {{ duelSideLabels[side.lobbySide] }}</template>
            </span>
          </span>
        </RouterLink>
        <div v-else class="bmatch__player is-empty">
          <span class="bmatch__avatar-empty" aria-hidden="true" />
          <span class="bmatch__name is-placeholder">{{ side.placeholder }}</span>
        </div>

        <DuelHeroTile
          v-if="match.duel?.heroes?.length"
          class="bmatch__hero"
          :hero="side.hero"
          :label="side.isMe ? 'Ваш герой' : 'Герой'"
          :highlighted="side.isMe"
        />

        <dl v-if="side.stats" class="bmatch__stats">
          <div>
            <dt>K/D/A</dt>
            <dd>{{ side.stats.kills ?? '–' }}/{{ side.stats.deaths ?? '–' }}/{{ side.stats.assists ?? '–' }}</dd>
          </div>
          <div><dt>LH/DN</dt><dd>{{ side.stats.lastHits ?? '–' }}/{{ side.stats.denies ?? '–' }}</dd></div>
          <div><dt>NW</dt><dd>{{ formatNetWorth(side.stats.netWorth) }}</dd></div>
        </dl>
      </div>
      <span class="bmatch__vs" aria-hidden="true">VS</span>
    </div>

    <p v-if="match.duel?.heroes?.length && isOpen" class="bmatch__hint">
      Герої випадкові — на піку беріть саме свого. Інший герой означає технічну поразку.
    </p>

    <!-- Чому матч стоїть -->
    <p v-if="match.note" class="bmatch__note" role="status">
      <PhWarningCircle :size="15" weight="fill" class="shrink-0" aria-hidden="true" />
      {{ match.note }}
    </p>

    <!-- ─── Лобі: гравцям матчу та організатору ────────────────────────── -->
    <div v-if="lobbyShown" class="bmatch__lobby">
      <div class="bmatch__lobby-row">
        <span class="bmatch__lobby-key">Лобі</span>
        <span class="bmatch__lobby-value">{{ match.duel!.lobbyName }}</span>
        <el-button
          text
          size="small"
          class="btn-icon"
          aria-label="Скопіювати назву"
          @click="copyText(match.duel!.lobbyName)"
        >
          <PhCopy :size="14" weight="bold" />
        </el-button>
      </div>
      <div class="bmatch__lobby-row">
        <span class="bmatch__lobby-key">Пароль</span>
        <span class="bmatch__lobby-value is-pass">{{ match.duel!.lobbyPassword }}</span>
        <el-button
          text
          size="small"
          class="btn-icon"
          aria-label="Скопіювати пароль"
          @click="copyText(match.duel!.lobbyPassword ?? '')"
        >
          <PhCopy :size="14" weight="bold" />
        </el-button>
      </div>
    </div>

    <!-- ─── Дії ─────────────────────────────────────────────────────────── -->
    <div v-if="hasActions" class="bmatch__actions">
      <!-- Гравець матчу: інвайт у лобі -->
      <template v-if="isMine && duelOpen">
        <el-button
          type="primary"
          class="bmatch__join"
          :loading="inviting"
          :disabled="inviting || match.duel?.state !== 'WAITING_PLAYERS' || inviteCooldown > 0"
          @click="joinLobby"
        >
          <PhGameController v-if="!inviting" :size="16" weight="fill" />
          <span class="ml-6">
            <template v-if="match.duel?.state === 'PENDING'">Чекаємо вільного бота…</template>
            <template v-else-if="match.duel?.state === 'LOBBY_CREATING'">Бот створює лобі…</template>
            <template v-else-if="inviteCooldown > 0">Інвайт надіслано · {{ inviteCooldown }} с</template>
            <template v-else-if="match.duel?.state === 'WAITING_PLAYERS'">Увійти в лобі</template>
            <template v-else>Гра триває</template>
          </span>
        </el-button>
        <RouterLink :to="{ name: routeNames.duels }" class="no-underline">
          <el-button plain>
            <PhArrowSquareOut :size="14" />
            <span class="ml-6">Сторінка дуелі</span>
          </el-button>
        </RouterLink>
      </template>

      <!-- Організатор: спостерігати з лобі -->
      <template v-if="canManage && canSpectate">
        <el-button
          v-if="!match.spectating"
          class="bmatch__spectate"
          :loading="busy === 'spectate'"
          :disabled="!!busy || !viewerHasSteam"
          :title="viewerHasSteam ? undefined : 'Прив’яжіть Steam у профілі'"
          @click="spectate"
        >
          <PhEye v-if="busy !== 'spectate'" :size="16" weight="bold" />
          <span class="ml-6">Спостерігати</span>
        </el-button>
        <span v-else class="bmatch__spectating">
          <PhEye :size="14" weight="fill" aria-hidden="true" />
          Ви глядач — прийміть інвайт і займіть слот Spectator / Broadcaster
        </span>
      </template>

      <!-- Організатор: рішення по матчу -->
      <template v-if="canManage && canDecide">
        <el-button
          v-for="side in decidable"
          :key="side.player.id"
          plain
          :loading="busy === `win:${side.player.id}`"
          :disabled="!!busy || duelRunning"
          :title="duelRunning ? 'Гра вже йде — результат зарахує бот' : undefined"
          @click="decide(side.player)"
        >
          <PhTrophy :size="14" weight="bold" />
          <span class="ml-6 max-w-[140px] truncate">Перемога: {{ duelPlayerName(side.player) }}</span>
        </el-button>
        <el-button
          v-if="match.status === 'NEEDS_DECISION'"
          type="warning"
          plain
          :loading="busy === 'replay'"
          :disabled="!!busy"
          @click="replay"
        >
          <PhArrowsClockwise :size="14" weight="bold" />
          <span class="ml-6">Переграти</span>
        </el-button>
      </template>
    </div>

    <p v-if="canManage && canSpectate && !match.spectating" class="bmatch__hint">
      Бот запросить вас у лобі. Займіть слот <b>Spectator</b> або <b>Broadcaster</b> — не Radiant/Dire і не
      «Unassigned»: гравців без слоту гра викидає зі старту. Доступно, поки гру не запущено.
    </p>
  </article>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  PhArrowSquareOut,
  PhArrowsClockwise,
  PhCopy,
  PhCrown,
  PhEye,
  PhGameController,
  PhTrophy,
  PhWarningCircle
} from '@phosphor-icons/vue'
import { resolvePublicOrApiUrl } from '@/core/helpers'
import { routeNames } from '@/router/route-names'
import DuelHeroTile from '@/views/duels/components/DuelHeroTile.vue'
import { duelsService } from '@/views/duels/duels.service'
import {
  DUEL_INVITE_REQUEST_COOLDOWN_SECONDS,
  duelHeroFor,
  duelPlayerInitial,
  duelPlayerName,
  duelSideLabels,
  duelStateLabels,
  duelStatsFor
} from '@/views/duels/duels.utils'
import { duelBracketsService } from '@/views/media/media.service'
import { bracketRoundLabel, duelBracketResultLabels } from '@/views/media/media.utils'
import type {
  TDuelBracket,
  TDuelBracketMatch,
  TDuelLobbySide,
  TDuelPlayer
} from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  match: TDuelBracketMatch
  bracketId: string
  rounds: number
  /** Скільки матчів у раунді (для підпису «матч N»). */
  matchesInRound?: number
  canManage?: boolean
  bracketLive?: boolean
  viewerHasSteam?: boolean
  meId?: string | null
}>(), {
  matchesInRound: 1,
  canManage: false,
  bracketLive: false,
  viewerHasSteam: false,
  meId: null
})

const emit = defineEmits<{
  /** Організатор змінив сітку — свіжий знімок турніру. */
  updated: [bracket: TDuelBracket]
  /** Щось змінилось без знімка (інвайт, глядач) — сторінка перечитає. */
  refresh: []
}>()

/** Стани дуелі, коли бот ще в лобі і може запросити глядача. */
const SPECTATE_STATES = ['PENDING', 'LOBBY_CREATING', 'WAITING_PLAYERS']
const OPEN_DUEL_STATES = ['PENDING', 'LOBBY_CREATING', 'WAITING_PLAYERS', 'LIVE']

const isOpen = computed(() => props.match.status !== 'DONE')
const isMine = computed(() =>
  !!props.meId && (props.match.player1?.id === props.meId || props.match.player2?.id === props.meId)
)
const duelOpen = computed(() =>
  props.match.status === 'LIVE' && !!props.match.duel && OPEN_DUEL_STATES.includes(props.match.duel.state)
)
const duelRunning = computed(() =>
  !!props.match.duel && ['LIVE', 'PROCESSING'].includes(props.match.duel.state) && props.match.status === 'LIVE'
)
const canSpectate = computed(() =>
  props.bracketLive && props.match.status === 'LIVE' && !!props.match.duel &&
  SPECTATE_STATES.includes(props.match.duel.state) && !isMine.value
)
const canDecide = computed(() =>
  props.bracketLive && isOpen.value && !!props.match.player1 && !!props.match.player2 &&
  props.match.status !== 'WAITING'
)
const lobbyShown = computed(() =>
  duelOpen.value && !!props.match.duel?.lobbyPassword && (isMine.value || props.canManage)
)
const hasActions = computed(() =>
  (isMine.value && duelOpen.value) ||
  (props.canManage && (canSpectate.value || canDecide.value))
)

const stateLabel = computed(() => {
  const m = props.match
  switch (m.status) {
    case 'LIVE': return m.duel ? duelStateLabels[m.duel.state] : 'Створюємо дуель'
    case 'READY': return m.note ? 'Чекаємо гравця' : 'Матч готовий — бот створить лобі'
    case 'NEEDS_DECISION': return 'Чекає рішення організатора'
    case 'DONE': return m.result ? duelBracketResultLabels[m.result] : 'Завершено'
    default: return 'Чекаємо суперників з попереднього раунду'
  }
})

const sides = computed(() => {
  const m = props.match
  const sideOf = (id: string): TDuelLobbySide | null => {
    if (m.duel?.radiantPlayerId === id) return 'radiant'
    if (m.duel?.direPlayerId === id) return 'dire'
    return m.duel?.lobbyPlayers?.find(p => p.playerId === id)?.side ?? null
  }
  const make = (player: TDuelPlayer | null, seed: number | null) => ({
    player,
    seed,
    placeholder: m.round === 1 || m.status === 'DONE' ? 'bye' : 'Визначиться в попередньому раунді',
    hero: m.duel && player ? duelHeroFor(m.duel, player.id) : null,
    stats: m.duel && player ? duelStatsFor(m.duel, player.id) : null,
    lobbySide: player && m.duel && OPEN_DUEL_STATES.includes(m.duel.state) ? sideOf(player.id) : null,
    winner: !!player && m.winnerId === player.id,
    loser: !!player && m.status === 'DONE' && m.winnerId !== player.id,
    isMe: !!player && player.id === props.meId
  })
  return [make(m.player1, m.seed1), make(m.player2, m.seed2)]
})

const decidable = computed(() =>
  sides.value.filter((s): s is typeof s & { player: TDuelPlayer } => !!s.player)
)

function formatNetWorth (value: number | null): string {
  if (value == null) return '–'
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

const { copy } = useClipboard({ legacy: true })
function copyText (text: string) {
  copy(text)
  ElMessage.success('Скопійовано')
}

// ─── Гравець: інвайт у лобі ──────────────────────────────────────────────────
const inviting = ref(false)
const inviteCooldown = ref(0)
const { pause: stopCooldown, resume: startCooldown } = useIntervalFn(() => {
  inviteCooldown.value = Math.max(0, inviteCooldown.value - 1)
  if (!inviteCooldown.value) stopCooldown()
}, 1000, { immediate: false })

async function joinLobby () {
  const duel = props.match.duel
  if (!duel || inviting.value) return
  inviting.value = true
  try {
    await duelsService.requestInvite(duel.id)
    inviteCooldown.value = DUEL_INVITE_REQUEST_COOLDOWN_SECONDS
    startCooldown()
    emit('refresh')
  } catch {
    // тост уже показав duelsService
  } finally {
    inviting.value = false
  }
}

// ─── Організатор ─────────────────────────────────────────────────────────────
const busy = ref<string | null>(null)

async function spectate () {
  if (busy.value) return
  busy.value = 'spectate'
  try {
    await duelBracketsService.spectate(props.bracketId, props.match.id)
    emit('refresh')
  } catch {
    // тост уже показав сервіс
  } finally {
    busy.value = null
  }
}

async function decide (player: TDuelPlayer) {
  if (busy.value) return
  try {
    await ElMessageBox.confirm(
      `${duelPlayerName(player)} проходить далі, суперник вибуває. Якщо лобі вже створене, ` +
        'бот його закриє. Змінити рішення потім не можна.',
      'Зафіксувати переможця?',
      { confirmButtonText: 'Так, зафіксувати', cancelButtonText: 'Ні', type: 'warning' }
    )
  } catch {
    return
  }
  busy.value = `win:${player.id}`
  try {
    emit('updated', await duelBracketsService.setWinner(props.bracketId, props.match.id, player.id))
  } catch {
    // тост уже показав сервіс
  } finally {
    busy.value = null
  }
}

async function replay () {
  if (busy.value) return
  busy.value = 'replay'
  try {
    emit('updated', await duelBracketsService.replay(props.bracketId, props.match.id))
  } catch {
    // тост уже показав сервіс
  } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.bmatch {
  --tw: 145, 70, 255;
  --tone: 148, 163, 184;

  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(var(--tone), 0.28);
  background:
    linear-gradient(90deg, transparent, rgba(var(--tone), 0.8), transparent) top / 100% 1px no-repeat,
    linear-gradient(160deg, rgba(24, 22, 46, 0.95), rgba(12, 14, 26, 0.97));
  box-shadow: var(--ds-elevation-3);
}

.bmatch.is-live {
  --tone: var(--tw);

  box-shadow: var(--ds-elevation-3), 0 0 26px rgba(var(--tw), 0.2);
}

.bmatch.is-ready {
  --tone: var(--ds-primary-rgb);
}

.bmatch.is-needs_decision {
  --tone: 245, 158, 11;
}

.bmatch.is-mine {
  border-color: rgba(var(--ds-gold-rgb), 0.45);
}

.bmatch__glow {
  position: absolute;
  top: -100px;
  left: 50%;
  z-index: -1;
  width: 360px;
  height: 200px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(var(--tone), 0.18), transparent 70%);
  pointer-events: none;
}

.bmatch__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.bmatch__round {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(var(--tone), 1);
}

.bmatch__state {
  font-family: var(--ds-font-display);
  font-size: 18px;
  line-height: 1.2;
  color: var(--ds-text-strong);
}

.bmatch__live,
.bmatch__mine {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.bmatch__live {
  color: #fff;
  background: rgb(220, 38, 38);
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.6);
}

.bmatch__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  animation: bmatch-pulse 1.3s ease-in-out infinite;
}

.bmatch__mine {
  color: var(--ds-gold);
  background: rgba(var(--ds-gold-rgb), 0.12);
  border: 1px solid rgba(var(--ds-gold-rgb), 0.35);
}

/* ─── VS ─────────────────────────────────────────────────────────────────── */
.bmatch__versus {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

.bmatch__vs {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--ds-font-display);
  font-size: 16px;
  letter-spacing: 0.08em;
  color: rgba(var(--tone), 1);
  text-shadow: 0 0 12px rgba(var(--tone), 0.8);
}

.bmatch__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.bmatch__side.is-right {
  align-items: flex-end;
  text-align: right;
}

.bmatch__side.is-right .bmatch__player {
  flex-direction: row-reverse;
}

/* Плитка героя — на всю ширину колонки з обох боків, а не за вмістом справа */
.bmatch__hero {
  align-self: stretch;
}

.bmatch__side.is-loser {
  opacity: 0.55;
}

.bmatch__player {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: 100%;
  color: inherit;
}

.bmatch__avatar {
  /* Глобальний .el-avatar фіксує 56px */
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(var(--tone), 0.5);
}

.bmatch__side.is-winner .bmatch__avatar {
  box-shadow: 0 0 0 2px rgba(var(--ds-gold-rgb), 0.9), 0 0 14px rgba(var(--ds-gold-rgb), 0.5);
}

.bmatch__avatar-empty {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.bmatch__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
  color: var(--ds-text-strong);
}

.bmatch__name.is-placeholder {
  font-weight: 400;
  font-style: italic;
  white-space: normal;
  color: var(--ds-text-faint);
}

.bmatch__sub {
  font-size: 11px;
  color: var(--ds-text-faint);
}

.bmatch__stats {
  display: flex;
  gap: 12px;
  margin: 0;
}

.bmatch__stats dt {
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--ds-text-faint);
}

.bmatch__stats dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.bmatch__hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ds-text-faint);
}

.bmatch__note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: rgb(253, 200, 110);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
}

/* ─── Лобі ───────────────────────────────────────────────────────────────── */
.bmatch__lobby {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(var(--tone), 0.2);
}

.bmatch__lobby-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.bmatch__lobby-key {
  width: 56px;
  flex-shrink: 0;
  font-family: var(--ds-font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.bmatch__lobby-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--ds-text-strong);
}

.bmatch__lobby-value.is-pass {
  font-family: var(--ds-font-mono);
  letter-spacing: 0.08em;
  color: rgb(200, 175, 255);
}

/* ─── Дії ────────────────────────────────────────────────────────────────── */
.bmatch__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.bmatch__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.bmatch__join {
  --el-button-bg-color: rgb(var(--tw));
  --el-button-border-color: rgb(var(--tw));
  --el-button-hover-bg-color: rgb(165, 100, 255);
  --el-button-hover-border-color: rgb(165, 100, 255);
  --el-button-text-color: #fff;
  --el-button-hover-text-color: #fff;

  box-shadow: 0 0 16px rgba(var(--tw), 0.45);
}

.bmatch__spectate {
  --el-button-text-color: rgb(200, 175, 255);
  --el-button-border-color: rgba(var(--tw), 0.6);
  --el-button-hover-text-color: #fff;
  --el-button-hover-bg-color: rgba(var(--tw), 0.35);
  --el-button-hover-border-color: rgb(var(--tw));
}

.bmatch__spectating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: rgb(200, 175, 255);
  background: rgba(var(--tw), 0.12);
}

@media (max-width: 520px) {
  .bmatch__versus {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .bmatch__vs {
    position: static;
    transform: none;
    text-align: center;
    order: 1;
  }

  .bmatch__side.is-right {
    order: 2;
    align-items: flex-start;
    text-align: left;
  }

  .bmatch__side.is-right .bmatch__player {
    flex-direction: row;
  }
}

@keyframes bmatch-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .bmatch__live-dot {
    animation: none;
  }
}
</style>
