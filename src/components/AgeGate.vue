<template>
  <div
    v-if="!confirmed"
    class="age-gate"
    role="dialog"
    aria-modal="true"
    :aria-label="HEADING"
  >
    <div class="age-gate__panel neon-card hud-corners">
      <!-- Question state -->
      <template v-if="!denied">
        <span class="sys-label age-gate__eyebrow" aria-hidden="true">SYS://ACCESS · 21+</span>
        <h1 class="age-gate__heading">
          {{ HEADING }}
        </h1>

        <div class="age-gate__actions">
          <el-button
            type="primary"
            size="large"
            class="age-gate__btn"
            @click="confirm"
          >
            <span class="age-gate__btn-content">
              <span class="age-gate__btn-label">Так</span>
              <span class="age-gate__btn-sub">Так, мені вже є 21</span>
            </span>
          </el-button>

          <el-button
            size="large"
            class="age-gate__btn"
            @click="deny"
          >
            <span class="age-gate__btn-content">
              <span class="age-gate__btn-label">Ні</span>
              <span class="age-gate__btn-sub">Ні, мені ще немає 21</span>
            </span>
          </el-button>
        </div>
      </template>

      <!-- Denied state -->
      <template v-else>
        <p class="age-gate__denial">
          {{ DENIAL_MESSAGE }}
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const STORAGE_KEY = 'age-gate'
const HEADING = 'Щоб увійти, вам має бути щонайменше 21 рік'
const DENIAL_MESSAGE = 'Доступ заборонено. Цей сайт призначений для осіб віком від 21 року.'

// Per-tab persistence: 'confirmed' grants access; anything else keeps the site
// blocked. Absence of the key = unanswered. 'denied' records the answer but, on a
// fresh page load, still re-shows the question (only 'confirmed' unlocks the site).
const status = useLocalStorage<'confirmed' | 'denied' | null>(STORAGE_KEY, null)

const confirmed = computed(() => status.value === 'confirmed')

// Transient, in-memory only: true right after clicking «Ні» this page load. Resets
// on refresh so the gate re-shows the question rather than the denial message.
const denied = ref(false)

function confirm () {
  status.value = 'confirmed'
}

function deny () {
  status.value = 'denied'
  denied.value = true
}
</script>

<style scoped>
.age-gate {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  /* Opaque base — nothing behind the gate leaks through. */
  background-color: var(--ds-background);
}

/* Surface, hairline, top light and halo come from `.neon-card` / `.hud-corners`. */
.age-gate__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560px;
  padding: 40px 32px;
  border-radius: 16px;
  text-align: center;
}

.age-gate__eyebrow {
  margin-bottom: 16px;
}

.age-gate__heading {
  margin: 0 0 32px;
  font-family: var(--ds-font-display);
  font-size: 24px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #ffffff;
  text-shadow: var(--ds-neon-text-subtle);
}

.age-gate__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

.age-gate__btn {
  flex: 1 1 200px;
  height: auto !important;
  min-height: 64px;
  padding: 14px 20px !important;
}

.age-gate__btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.age-gate__btn-label {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.age-gate__btn-sub {
  font-size: 13px;
  font-weight: 400;
  opacity: 0.85;
}

.age-gate__denial {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: #ef4444;
}

@media (max-width: 480px) {
  .age-gate__panel {
    padding: 32px 20px;
  }

  .age-gate__heading {
    font-size: 19px;
    margin-bottom: 24px;
  }

  .age-gate__actions {
    flex-direction: column;
  }

  .age-gate__btn {
    flex: 1 1 auto;
    width: 100%;
  }
}
</style>
