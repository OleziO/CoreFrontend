<template>
  <!--
    Мініатюра сітки double elimination: верхня сітка 8 → 4 → 2 → 1 і нижня 4 → 2 → 1.
    Слоти — тонкі рамки, з'єднувачі — ціанові волосини. З класом `is-loading`
    колонки пульсують каскадом зліва направо — читається як «сітка збирається».
  -->
  <svg
    class="bracket-skeleton"
    viewBox="0 0 360 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Верхня сітка -->
    <g class="bracket-skeleton__col" style="--col: 0">
      <rect v-for="y in [8, 30, 60, 82]" :key="'a' + y" x="6" :y="y" width="70" height="14" rx="3" />
      <path d="M76 15h10v22h-10M86 26h10M76 67h10v22h-10M86 78h10" />
    </g>
    <g class="bracket-skeleton__col" style="--col: 1">
      <rect x="96" y="19" width="70" height="14" rx="3" />
      <rect x="96" y="71" width="70" height="14" rx="3" />
      <path d="M166 26h10v52h-10M176 52h10" />
    </g>
    <g class="bracket-skeleton__col" style="--col: 2">
      <rect x="186" y="45" width="70" height="14" rx="3" />
      <path d="M256 52h10v40h-10M266 72h10" />
    </g>
    <g class="bracket-skeleton__col bracket-skeleton__col--final" style="--col: 3">
      <rect x="276" y="65" width="78" height="14" rx="3" />
    </g>

    <!-- Роздільник між сітками -->
    <path class="bracket-skeleton__divider" d="M6 118h348" />

    <!-- Нижня сітка -->
    <g class="bracket-skeleton__col" style="--col: 0">
      <rect x="6" y="132" width="70" height="14" rx="3" />
      <rect x="6" y="154" width="70" height="14" rx="3" />
      <path d="M76 139h10v22h-10M86 150h10" />
    </g>
    <g class="bracket-skeleton__col" style="--col: 1">
      <rect x="96" y="143" width="70" height="14" rx="3" />
      <rect x="96" y="176" width="70" height="14" rx="3" />
      <path d="M166 150h10v33h-10M176 166h10" />
    </g>
    <g class="bracket-skeleton__col" style="--col: 2">
      <rect x="186" y="159" width="70" height="14" rx="3" />
      <path d="M256 166h10v-74h-10" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.bracket-skeleton {
  display: block;
  color: rgba(var(--ds-primary-rgb), 0.35);
}

.bracket-skeleton__col {
  rect {
    fill: rgba(255, 255, 255, 0.03);
    stroke: rgba(255, 255, 255, 0.14);
    stroke-width: 1;
  }

  path {
    stroke: currentColor;
    stroke-width: 1;
    stroke-linecap: round;
  }
}

// Фінальний слот — єдиний акцент: ціанова рамка з м'яким сяйвом.
.bracket-skeleton__col--final rect {
  stroke: rgba(var(--ds-primary-rgb), 0.6);
  fill: rgba(var(--ds-primary-rgb), 0.06);
  filter: drop-shadow(0 0 6px rgba(var(--ds-primary-rgb), 0.35));
}

.bracket-skeleton__divider {
  stroke: rgba(var(--ds-pink-rgb), 0.3);
  stroke-width: 1;
  stroke-dasharray: 2 6;
}

// Каскадна пульсація колонок під час завантаження — лише opacity, без руху.
@keyframes bracket-skeleton-pulse {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 1;
  }
}

.is-loading .bracket-skeleton__col {
  animation: bracket-skeleton-pulse 1.4s ease-in-out infinite;
  animation-delay: calc(var(--col, 0) * 140ms);
}

@media (prefers-reduced-motion: reduce) {
  .is-loading .bracket-skeleton__col {
    animation: none;
    opacity: 0.7;
  }
}
</style>
