<template>
  <button
    type="button"
    class="vip-header-btn"
    :class="{ 'is-member': vipStore.isVip }"
    :aria-label="vipStore.isVip ? 'Мій VIP-статус' : 'Стати VIP'"
    @click="openVip"
  >
    <PhCrown :size="15" weight="fill" class="vip-header-btn__icon" />
    <span class="vip-header-btn__text">VIP</span>
  </button>
</template>

<script setup lang="ts">
import { PhCrown } from '@phosphor-icons/vue'
import { useVipStore } from '@/store/modules/vip'

const vipStore = useVipStore()
const { open } = useAppModals()

function openVip () {
  open('VipModal')
}
</script>

<style scoped lang="scss">
// Header VIP chip: the gold → pink foil of the VIP badge. Non-members get a
// slow breathing glow to draw the eye; members get a calm lit state.
.vip-header-btn {
  --vip-gold: 255, 206, 84;
  --vip-rose: 255, 94, 170;

  position: relative;
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgba(var(--vip-gold), 0.6);
  background: linear-gradient(110deg, rgba(var(--vip-gold), 0.2), rgba(var(--vip-rose), 0.18));
  padding: 0 14px 0 11px;
  color: rgb(255, 226, 150);
  font-family: var(--ds-font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  cursor: pointer;
  animation: vip-header-breathe 3.2s ease-in-out infinite;
  transition: transform 160ms var(--ds-ease-out), border-color 200ms ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 30%, rgba(255, 255, 255, 0.4) 50%, transparent 70%);
    transform: translateX(-120%);
    animation: vip-header-sheen 4.2s ease-in-out infinite;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--vip-gold), 0.8);
    outline-offset: 2px;
  }

  &.is-member {
    animation: none;
    background: linear-gradient(110deg, rgba(var(--vip-gold), 0.32), rgba(var(--vip-rose), 0.28));
    box-shadow: 0 0 14px rgba(var(--vip-gold), 0.35);
  }

  @media (max-width: 991px) {
    height: 30px;
    padding: 0 10px 0 8px;
    font-size: 11px;
  }
}

.vip-header-btn__icon {
  flex-shrink: 0;
  color: rgb(255, 206, 84);
  filter: drop-shadow(0 0 4px rgba(255, 206, 84, 0.7));
}

@media (hover: hover) and (pointer: fine) {
  .vip-header-btn:hover {
    border-color: rgba(var(--vip-gold), 0.95);
    box-shadow: 0 0 18px rgba(var(--vip-gold), 0.45);
  }
}

@keyframes vip-header-breathe {
  0%,
  100% {
    box-shadow: 0 0 6px rgba(255, 206, 84, 0.18);
  }

  50% {
    box-shadow: 0 0 16px rgba(255, 206, 84, 0.42);
  }
}

@keyframes vip-header-sheen {
  0%,
  60% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(120%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vip-header-btn,
  .vip-header-btn::after {
    animation: none;
  }
}
</style>
