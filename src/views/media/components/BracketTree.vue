<template>
  <div class="btree">
    <div class="btree__scroll">
      <div class="btree__grid" :style="{ '--rounds': rounds }">
        <div v-for="round in roundNumbers" :key="round" class="btree__col">
          <div class="btree__head">
            <span class="btree__head-label">{{ bracketRoundLabel(round, rounds) }}</span>
            <span class="btree__head-meta">{{ pluralizeMatches(matchesOf(round).length) }}</span>
          </div>
          <div class="btree__body">
            <div
              v-for="(pair, pairIndex) in pairsOf(round)"
              :key="pairIndex"
              class="btree__pair"
              :class="{ 'has-next': round < rounds, 'is-twin': pair.length === 2 }"
            >
              <div
                v-for="match in pair"
                :key="match.id"
                class="btree__cell"
                :class="{ 'has-prev': round > 1, 'has-next': round < rounds, 'is-done': match.status === 'DONE' }"
              >
                <BracketNode
                  :match="match"
                  :selected="match.id === selectedId"
                  :me-id="meId"
                  :waiting-labels="waitingLabelsOf(match)"
                  @select="emit('select', $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Матч за третє місце — окремо під сіткою: у нього інші «годувальники» (програвші півфіналів) -->
    <div v-if="thirdPlace" class="btree__third">
      <span class="btree__third-label">
        <PhMedal :size="14" weight="fill" aria-hidden="true" />
        Матч за 3 місце
      </span>
      <div class="btree__third-node">
        <BracketNode
          :match="thirdPlace"
          :selected="thirdPlace.id === selectedId"
          :me-id="meId"
          :waiting-labels="['Програвший 1/2', 'Програвший 1/2']"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhMedal } from '@phosphor-icons/vue'
import BracketNode from '@/views/media/components/BracketNode.vue'
import { bracketRoundShortLabel, bracketRoundLabel } from '@/views/media/media.utils'
import { pluralizeUk } from '@/views/players/player-achievements.utils'
import type { TDuelBracketMatch } from '@/api/types/api.types'

const props = withDefaults(defineProps<{
  matches: TDuelBracketMatch[]
  rounds: number
  selectedId?: string | null
  meId?: string | null
}>(), {
  selectedId: null,
  meId: null
})

const emit = defineEmits<{ select: [matchId: string] }>()

const roundNumbers = computed(() => Array.from({ length: props.rounds }, (_, i) => i + 1))

const thirdPlace = computed(() => props.matches.find(m => m.isThirdPlace) ?? null)

const pluralizeMatches = (n: number) => `${n} ${pluralizeUk(n, 'матч', 'матчі', 'матчів')}`

function matchesOf (round: number): TDuelBracketMatch[] {
  return props.matches
    .filter(m => m.round === round && !m.isThirdPlace)
    .sort((a, b) => a.position - b.position)
}

/** Пари сусідніх матчів, що годують один матч наступного раунду — для вертикальної лінії-з’єднувача. */
function pairsOf (round: number): TDuelBracketMatch[][] {
  const list = matchesOf(round)
  const pairs: TDuelBracketMatch[][] = []
  for (let i = 0; i < list.length; i += 2) pairs.push(list.slice(i, i + 2))
  return pairs
}

/** «Переможець 1/4 #2» — звідки прийде гравець у порожній слот. */
function waitingLabelsOf (match: TDuelBracketMatch): [string, string] {
  if (match.round === 1) return ['bye', 'bye']
  const prev = bracketRoundShortLabel(match.round - 1, props.rounds)
  return [
    `Переможець ${prev} #${match.position * 2 + 1}`,
    `Переможець ${prev} #${match.position * 2 + 2}`
  ]
}
</script>

<style scoped>
.btree {
  --tw: 145, 70, 255;
  --col-w: 230px;
  --gap: 44px;
  --line: rgba(255, 255, 255, 0.12);
  --line-done: rgba(var(--tw), 0.6);

  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.btree__scroll {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--tw), 0.5) transparent;
}

.btree__grid {
  display: grid;
  grid-template-columns: repeat(var(--rounds), var(--col-w));
  column-gap: var(--gap);
  width: max-content;
}

.btree__col {
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
}

.btree__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--tw), 0.1);
  border: 1px solid rgba(var(--tw), 0.2);
}

.btree__head-label {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(200, 175, 255);
}

.btree__head-meta {
  font-size: 10px;
  color: var(--ds-text-faint);
}

.btree__body {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.btree__pair {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.btree__cell {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  padding: 8px 0;
}

/* Короткі «вуса» праворуч / ліворуч від вузла до середини проміжку між раундами. */
.btree__cell.has-next::after,
.btree__cell.has-prev::before {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(var(--gap) / 2);
  height: 1px;
  background: var(--line);
}

.btree__cell.has-next::after {
  right: calc(var(--gap) / -2);
}

.btree__cell.has-prev::before {
  left: calc(var(--gap) / -2);
}

.btree__cell.is-done.has-next::after {
  background: var(--line-done);
  box-shadow: 0 0 6px rgba(var(--tw), 0.5);
}

/* Вертикаль між центрами двох матчів пари (центри — на 25% і 75% висоти пари). */
.btree__pair.has-next.is-twin::after {
  content: '';
  position: absolute;
  top: 25%;
  bottom: 25%;
  right: calc(var(--gap) / -2);
  width: 1px;
  background: var(--line);
}

.btree__third {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(205, 127, 50, 0.4);
  background: rgba(205, 127, 50, 0.05);
}

.btree__third-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(222, 160, 100);
}

.btree__third-node {
  width: var(--col-w);
  max-width: 100%;
}

@media (max-width: 640px) {
  .btree {
    --col-w: 200px;
    --gap: 30px;
  }
}
</style>
