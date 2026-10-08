<template>
  <div class="m3-skills">
    <div class="m3-skills__mana" :title="`Мана ${mana} / ${MATCH3_MANA_MAX}: +1 за кожну прибрану фішку`">
      <span class="m3-skills__mana-label">
        <PhDrop :size="12" weight="fill" aria-hidden="true" />
        Мана
      </span>
      <span
        class="m3-skills__mana-track"
        role="progressbar"
        aria-label="Мана"
        :aria-valuenow="mana"
        aria-valuemin="0"
        :aria-valuemax="MATCH3_MANA_MAX"
      >
        <span class="m3-skills__mana-fill" :style="{ width: `${(mana / MATCH3_MANA_MAX) * 100}%` }" />
        <span
          v-for="meta in MATCH3_SKILLS"
          :key="meta.skill"
          class="m3-skills__mana-tick"
          :style="{ left: `${(MATCH3_SKILL_COST[meta.skill] / MATCH3_MANA_MAX) * 100}%` }"
          aria-hidden="true"
        />
      </span>
      <span class="m3-skills__mana-value">{{ mana }}</span>
    </div>

    <div class="m3-skills__list">
      <el-tooltip
        v-for="meta in MATCH3_SKILLS"
        :key="meta.skill"
        :content="meta.description"
        placement="top"
        effect="dark"
        :show-after="250"
      >
        <button
          type="button"
          class="m3-skill"
          :class="[`m3-skill--${meta.skill}`, { 'is-active': active === meta.skill }]"
          :disabled="!available[meta.skill]"
          :aria-pressed="meta.skill === 'refresher' ? undefined : active === meta.skill"
          @click="emit('toggle', meta.skill)"
        >
          <span class="m3-skill__icon" aria-hidden="true">
            <PhSparkle v-if="meta.skill === 'blink'" weight="fill" />
            <PhLightning v-else-if="meta.skill === 'laguna'" weight="fill" />
            <PhArrowsClockwise v-else weight="bold" />
          </span>
          <span class="m3-skill__text">
            <span class="m3-skill__name">{{ meta.name }}</span>
            <span class="m3-skill__cost">{{ MATCH3_SKILL_COST[meta.skill] }} мани</span>
          </span>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhArrowsClockwise, PhDrop, PhLightning, PhSparkle } from '@phosphor-icons/vue'
import { MATCH3_MANA_MAX, MATCH3_SKILL_COST } from '@/features/match3/match3-engine.utils'
import type { TMatch3Skill } from '@/features/match3/match3-engine.utils'
import { MATCH3_SKILLS } from '@/features/match3/match3.utils'

defineProps<{
  mana: number
  /** Навичка, що чекає на ціль (Blink / Laguna). */
  active: TMatch3Skill | null
  available: Record<TMatch3Skill, boolean>
}>()

const emit = defineEmits<{
  toggle: [skill: TMatch3Skill]
}>()
</script>

<style scoped>
.m3-skills {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.m3-skills__mana {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 28px;
  align-items: center;
  gap: 10px;
}

.m3-skills__mana-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #38bdf8;
}

.m3-skills__mana-track {
  position: relative;
  height: 8px;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background: rgba(0, 0, 0, 0.4);
}

.m3-skills__mana-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.7);
  transition: width 320ms var(--ds-ease-out);
}

.m3-skills__mana-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.35);
}

.m3-skills__mana-value {
  font-family: var(--ds-font-mono);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ds-text-strong);
}

.m3-skills__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.m3-skill {
  --skill: 56, 189, 248;

  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(var(--skill), 0.4);
  background: rgba(var(--skill), 0.08);
  color: var(--ds-text-strong);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    border-color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out),
    opacity var(--ds-duration-fast) ease;
}

.m3-skill--laguna {
  --skill: 251, 146, 60;
}

.m3-skill--refresher {
  --skill: 52, 211, 153;
}

.m3-skill:not(:disabled):active {
  transform: scale(0.96);
}

@media (hover: hover) and (pointer: fine) {
  .m3-skill:not(:disabled):hover {
    border-color: rgba(var(--skill), 0.8);
    background: rgba(var(--skill), 0.16);
  }
}

.m3-skill.is-active {
  border-color: rgb(var(--skill));
  background: rgba(var(--skill), 0.22);
  box-shadow: 0 0 16px rgba(var(--skill), 0.5);
}

.m3-skill:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.m3-skill__icon {
  display: inline-flex;
  flex-shrink: 0;
  font-size: 18px;
  color: rgb(var(--skill));
}

.m3-skill__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.m3-skill__name {
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m3-skill__cost {
  font-family: var(--ds-font-mono);
  font-size: 10px;
  color: var(--ds-text-muted);
}

@media (max-width: 420px) {
  .m3-skill {
    flex-direction: column;
    gap: 4px;
    padding: 8px 4px;
    text-align: center;
  }

  .m3-skill__text {
    align-items: center;
  }
}
</style>
