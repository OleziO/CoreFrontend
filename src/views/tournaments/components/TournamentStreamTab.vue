<template>
  <!-- Трансляція: HUD-панель у тому ж рецепті, що й сітка плей-оф -->
  <section
    class="stream hud-panel hud-corners hud-corners--fade rounded-2xl overflow-hidden"
    aria-label="Трансляція турніру"
  >
    <span class="hud-corners hud-corners--mirror hud-corners--fade absolute inset-0" aria-hidden="true" />
    <span class="stream__glow" aria-hidden="true" />

    <header class="stream__head">
      <div class="stream__reveal flex min-w-0 flex-col gap-10" style="--reveal-index: 0">
        <p class="stream__eyebrow sys-label">
          <span class="stream__tick" aria-hidden="true" />
          <span>Live</span>
          <span class="stream__sep" aria-hidden="true">/</span>
          <span>Twitch</span>
        </p>

        <div class="flex flex-wrap items-center gap-x-12 gap-y-8">
          <h2 class="stream__title">Трансляція турніру</h2>
          <a
            :href="TWITCH_CHANNEL_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="stream__meta"
          >
            <PhTwitchLogo :size="12" weight="fill" aria-hidden="true" />
            twitch.tv/{{ TWITCH_CHANNEL }}
          </a>
        </div>

        <p class="stream__hint">
          Матчі турніру транслюються з коментарями на нашому Twitch-каналі.
          Плеєр стартує без звуку — увімкніть його в правому нижньому куті.
        </p>
      </div>
    </header>

    <hr class="hud-line hud-line--pink m-0" aria-hidden="true">

    <!-- Сцена: плеєр ліворуч, поруч — картка донатів (той самий Monobank ФОП-еквайринг, що й внесок) -->
    <div class="stream__stage">
      <div class="stream__frame stream__reveal" style="--reveal-index: 1">
        <div class="stream__toolbar">
          <span class="stream__toolbar-label">
            <PhBroadcast :size="12" weight="bold" aria-hidden="true" />
            Twitch · {{ TWITCH_CHANNEL }}
          </span>
          <a
            :href="TWITCH_CHANNEL_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="stream__toolbar-link"
          >
            <span>Відкрити на Twitch</span>
            <PhArrowSquareOut :size="12" weight="bold" aria-hidden="true" />
          </a>
        </div>

        <div class="stream__viewport">
          <!-- Плейсхолдер тримає місце, доки iframe не віддасть `load` -->
          <div v-if="!playerLoaded" class="stream__placeholder" aria-hidden="true">
            <PhTwitchLogo :size="48" weight="duotone" class="stream__placeholder-icon" />
            <span class="stream__placeholder-text">Підключаємо трансляцію…</span>
          </div>
          <iframe
            :src="playerUrl"
            title="Трансляція турніру на Twitch"
            class="stream__iframe"
            :class="{ 'is-loaded': playerLoaded }"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            @load="playerLoaded = true"
          />
        </div>
      </div>

      <aside class="stream__donate stream__reveal" style="--reveal-index: 2" aria-label="Підтримати лігу">
        <span class="stream__donate-glow" aria-hidden="true" />
        <p class="stream__eyebrow stream__eyebrow--gold sys-label">
          <span class="stream__tick stream__tick--gold" aria-hidden="true" />
          <span>Підтримка</span>
          <span class="stream__sep stream__sep--gold" aria-hidden="true">/</span>
          <span>Донат</span>
        </p>
        <h3 class="stream__donate-title">Підтримати лігу</h3>
        <p class="stream__hint">
          Донати йдуть на призовий фонд і розвиток трансляцій. Оплата карткою на сторінці monobank —
          кошти надходять на рахунок ФОП організатора.
        </p>

        <div class="stream__donate-actions" role="group" aria-label="Сума донату">
          <el-button
            v-for="amountUah in DONATION_PRESETS_UAH"
            :key="amountUah"
            size="large"
            class="stream__donate-btn"
            :loading="loadingAmountUah === amountUah"
            :disabled="loadingAmountUah !== null && loadingAmountUah !== amountUah"
            @click="donate(amountUah)"
          >
            <PhHandHeart v-if="loadingAmountUah !== amountUah" :size="18" weight="fill" class="shrink-0" />
            <span class="whitespace-nowrap">{{ amountUah }} грн</span>
          </el-button>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
// Резолвер `Ph*` не знає частини іконок (Twitch, Broadcast) — імпортуємо напряму, як у Footer.vue.
import { PhArrowSquareOut, PhBroadcast, PhHandHeart, PhTwitchLogo } from '@phosphor-icons/vue'
import { TWITCH_CHANNEL, TWITCH_CHANNEL_URL, buildTwitchPlayerUrl } from '@/config/streaming'
import { getApiErrorMessage } from '@/core/utils/api-errors'

interface IProps {
  tournamentId: string
}

const props = defineProps<IProps>()

/** Пресети донату в гривнях; на бекенд відправляємо копійки, як і вступний внесок. */
const DONATION_PRESETS_UAH = [100, 300, 500] as const

// `parent` плеєра має збігатися з hostname сторінки — беремо його з адреси, а не з конфігу.
const playerUrl = buildTwitchPlayerUrl(window.location.hostname)

// Iframe віддає `load` навіть крос-доменно — до того тримаємо плейсхолдер і плавно проявляємо.
const playerLoaded = ref(false)

const loadingAmountUah = ref<number | null>(null)

async function donate (amountUah: number) {
  if (loadingAmountUah.value !== null) return
  loadingAmountUah.value = amountUah
  try {
    const intent = await tournamentsService.createDonationIntent(props.tournamentId, amountUah * 100)
    if (intent.pageUrl) {
      window.open(intent.pageUrl, '_blank', 'noopener')
      ElMessage.success('Дякуємо за підтримку! Завершіть оплату на сторінці monobank.')
    } else {
      ElMessage.warning('Сторінка оплати monobank не налаштована. Зверніться до організатора.')
    }
  } catch (e: unknown) {
    ElMessage.error(getApiErrorMessage(e, 'Не вдалося створити рахунок на донат'))
  } finally {
    loadingAmountUah.value = null
  }
}
</script>

<style scoped lang="scss">
// ─── Панель ─────────────────────────────────────────────────────────────────
.stream {
  --hud-corner-size: 14px;
  --hud-corner-inset: 10px;
  --hud-corner-radius: 3px;
  --hud-corner-color: rgba(var(--ds-primary-rgb), 0.55);
  --hud-corner-glow: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.4));
}

.stream__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 55% 80% at 0% 0%, rgba(var(--ds-secondary-rgb), 0.1), transparent 60%),
    radial-gradient(ellipse 40% 70% at 100% 100%, rgba(var(--ds-gold-rgb), 0.06), transparent 65%);
}

// Поява каскадом: шапка → плеєр → донати. Глушиться під `prefers-reduced-motion` у `_tokens.scss`.
@keyframes stream-in {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0);
  }
}

.stream__reveal {
  animation: stream-in 360ms var(--ds-ease-out) both;
  animation-delay: calc(var(--reveal-index, 0) * 60ms);
}

// ─── Шапка ──────────────────────────────────────────────────────────────────
.stream__head {
  @apply relative flex flex-col gap-16 px-36 py-30 sm:px-44 sm:py-34;
}

.stream__eyebrow {
  @apply m-0 inline-flex flex-wrap items-center gap-8;
}

.stream__tick {
  width: 16px;
  height: 2px;
  border-radius: 9999px;
  background: var(--ds-primary);
  box-shadow: 0 0 8px rgba(var(--ds-primary-rgb), 0.7);

  &--gold {
    background: rgb(var(--ds-gold-rgb));
    box-shadow: 0 0 8px rgba(var(--ds-gold-rgb), 0.7);
  }
}

.stream__sep {
  color: rgba(var(--ds-primary-rgb), 0.45);
  text-shadow: none;

  &--gold {
    color: rgba(var(--ds-gold-rgb), 0.5);
  }
}

.stream__eyebrow--gold {
  color: rgba(var(--ds-gold-rgb), 0.85);
  text-shadow: 0 0 10px rgba(var(--ds-gold-rgb), 0.3);
}

.stream__title {
  @apply m-0 font-display uppercase text-white;
  font-size: clamp(1.125rem, 0.95rem + 0.8vw, 1.5rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 20px rgba(var(--ds-primary-rgb), 0.18);
}

.stream__meta {
  @apply inline-flex items-center gap-6 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ds-text-muted);
  transition: color var(--ds-duration-fast) ease;

  svg {
    color: rgb(var(--ds-secondary-rgb));
  }
}

.stream__hint {
  @apply m-0 max-w-xl;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ds-text-muted);
}

// ─── Сцена ──────────────────────────────────────────────────────────────────
// Плеєр займає ~2/3 ширини, картка донатів — решту; на вужчих екранах — у стовпчик.
.stream__stage {
  @apply relative grid gap-16 px-16 py-16 sm:px-24 sm:py-20 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]
    lg:items-start lg:gap-20;
  background: rgba(0, 0, 0, 0.22);
}

.stream__frame {
  @apply min-w-0 overflow-hidden rounded-xl border;
  border-color: rgba(var(--ds-secondary-rgb), 0.22);
  background: rgba(7, 8, 15, 0.55);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.stream__toolbar {
  @apply flex flex-wrap items-center gap-x-14 gap-y-6 px-14 py-10;
  border-bottom: 1px solid rgba(var(--ds-secondary-rgb), 0.14);
  background: rgba(255, 255, 255, 0.02);
}

.stream__toolbar-label {
  @apply inline-flex items-center gap-6;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ds-text-faint);

  svg {
    color: rgba(var(--ds-secondary-rgb), 0.85);
  }
}

.stream__toolbar-link {
  @apply ml-auto inline-flex items-center gap-6 rounded-md px-8 py-4 no-underline;
  font-family: var(--ds-font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--ds-secondary-rgb));
  background: rgba(var(--ds-secondary-rgb), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--ds-secondary-rgb), 0.3);
  transition:
    background-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid rgba(var(--ds-secondary-rgb), 0.6);
    outline-offset: 2px;
  }
}

// Плеєр тримає пропорцію 16:9 на будь-якій ширині; висота випливає з неї.
.stream__viewport {
  @apply relative w-full;
  aspect-ratio: 16 / 9;
  background: #000;
}

.stream__placeholder {
  @apply absolute inset-0 flex flex-col items-center justify-center gap-10;
  background:
    repeating-linear-gradient(-45deg, rgba(var(--ds-secondary-rgb), 0.04) 0 1px, transparent 1px 12px),
    rgba(7, 8, 15, 0.7);
}

.stream__placeholder-icon {
  color: rgba(var(--ds-secondary-rgb), 0.7);
  filter: drop-shadow(0 0 14px rgba(var(--ds-secondary-rgb), 0.35));
}

.stream__placeholder-text {
  font-family: var(--ds-font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ds-text-faint);
}

.stream__iframe {
  @apply absolute inset-0 block h-full w-full border-0;
  opacity: 0;
  transition: opacity 240ms var(--ds-ease-out);

  &.is-loaded {
    opacity: 1;
  }
}

// ─── Донати ─────────────────────────────────────────────────────────────────
// Картка поруч із плеєром: золота рамка й м'який відблиск у куті.
.stream__donate {
  @apply relative flex flex-col gap-10 overflow-hidden rounded-xl border px-20 py-20 sm:px-24 sm:py-24;
  isolation: isolate;
  border-color: rgba(var(--ds-gold-rgb), 0.22);
  background: rgba(7, 8, 15, 0.55);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

// Під текстом і кнопками, а не над ними — тому власний стековий контекст на картці.
.stream__donate-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 70% 60% at 100% 0%, rgba(var(--ds-gold-rgb), 0.1), transparent 65%);
}

.stream__donate-title {
  @apply relative m-0 font-display uppercase text-white;
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  line-height: 1.1;
  letter-spacing: 0.04em;
  text-shadow: 0 0 20px rgba(var(--ds-gold-rgb), 0.2);
}

// Три суми в ряд на мобільному й планшеті, у стовпчик — у вузькій бічній картці.
.stream__donate-actions {
  @apply relative mt-6 grid grid-cols-3 gap-10 lg:grid-cols-1;

  :deep(.el-button) {
    @apply w-full;
  }

  :deep(.el-button > span) {
    @apply inline-flex items-center justify-center gap-8;
  }
}

// Золота кнопка донату: мономірна сума, тонка рамка й халo, що спалахує на ховері.
.stream__donate-btn {
  @apply m-0;
  --el-button-text-color: rgb(var(--ds-gold-rgb));
  --el-button-bg-color: rgba(var(--ds-gold-rgb), 0.08);
  --el-button-border-color: rgba(var(--ds-gold-rgb), 0.4);
  --el-button-hover-text-color: #0b0c14;
  --el-button-hover-bg-color: rgb(var(--ds-gold-rgb));
  --el-button-hover-border-color: rgb(var(--ds-gold-rgb));
  --el-button-active-text-color: #0b0c14;
  --el-button-active-bg-color: rgba(var(--ds-gold-rgb), 0.85);
  --el-button-active-border-color: rgba(var(--ds-gold-rgb), 0.85);
  --el-button-disabled-text-color: rgba(var(--ds-gold-rgb), 0.4);
  --el-button-disabled-bg-color: rgba(var(--ds-gold-rgb), 0.04);
  --el-button-disabled-border-color: rgba(var(--ds-gold-rgb), 0.18);
  font-family: var(--ds-font-mono);
  font-weight: 700;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  transition:
    color var(--ds-duration-fast) ease,
    background-color var(--ds-duration-fast) ease,
    border-color var(--ds-duration-fast) ease,
    box-shadow var(--ds-duration-fast) ease,
    transform var(--ds-duration-press) var(--ds-ease-out);

  &:active:not(.is-disabled) {
    transform: scale(0.97);
  }
}

@media (hover: hover) and (pointer: fine) {
  .stream__meta:hover {
    color: #fff;
  }

  .stream__toolbar-link:hover {
    background: rgba(var(--ds-secondary-rgb), 0.16);
    box-shadow: inset 0 0 0 1px rgba(var(--ds-secondary-rgb), 0.6), var(--ds-glow-secondary);
  }

  .stream__donate-btn:hover:not(.is-disabled) {
    box-shadow: var(--ds-glow-gold);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stream__meta,
  .stream__toolbar-link,
  .stream__donate-btn,
  .stream__iframe {
    transition: none;
  }

  .stream__toolbar-link:active,
  .stream__donate-btn:active:not(.is-disabled) {
    transform: none;
  }
}
</style>
