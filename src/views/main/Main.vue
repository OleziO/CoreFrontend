<template>
  <div class="overflow-auto h-full w-full font-inter">
    <!-- Первый блок -->
    <div
      ref="hero"
      class="relative
      flex flex-col justify-center items-center h-full w-full"
    >
      <div class="absolute inset-0 pointer-events-none" />
      <div class="max-w-[1440px] md:px-20 px-10 mx-auto relative w-full h-full flex justify-center items-center">
        <div class="relative flex flex-col justify-center items-center">
          <h1
            class="lg:text-6xl md:text-5xl sm:text-4xl text-2xl
           uppercase text-center font-bold"
          >
            Вітаємо в Core League
          </h1>
          <p class="mt-10 lg:text-2xl sm:text-xl text-xs font-medium">Платформа для ваших турнірів по Dota 2.</p>
          <el-button
            v-if="!authStore.token"
            type="primary"
            class="max-w-[320px] w-full mt-10"
            tag="a"
            :href="`${apiBaseUrl}/api/v1/steam/login`"
          >
            Увійти через стім
          </el-button>
          <RouterLink to="/tournaments">
            <el-button
              v-if="authStore.token"
              type="primary"
              class="max-w-[320px] px-20 py-10 rounded-md w-full mt-10"
            >
              Долучитись до турнірів
            </el-button>
          </RouterLink>
        </div>
        <div class="absolute bottom-20">
          <button
            class="rounded-full flex justify-center items-center border animate-pulse border-white p-10"
            @click="scrollToSection(second)"
          >
            <PhCaretDown />
          </button>
        </div>
      </div>
    </div>

    <!-- Второй блок -->
    <div
      ref="second" class="relative"
    >
      <div class="max-w-[1440px] h-full md:px-40 px-10 mx-auto py-50">
        <h1 class="lg:text-4xl md:text-3xl text-center text-2xl uppercase font-bold">Про нас</h1>
        <div class="flex flex-col justify-center gap-20 py-40">
          <div
            class="bg-gradient-to-r from-primary to-indigo-800 flex gap-10 items-center w-full
                   h-full 2xl:p-30 lg:p-20 p-10 rounded-lg"
          >
            <p
              class="xl:text-2xl text-base
           text-center font-light"
            >
              Core League - українська аматорська ліга в дисципліні Dota 2
            </p>
          </div>
          <div class="grid lg:grid-cols-2 gap-30">
            <div
              class="bg-gradient-to-r from-primary to-indigo-800 flex gap-10 items-center w-full
                      h-full 2xl:p-30 lg:p-20 p-10 rounded-lg"
            >
              <div class="bg-[#1c1c25] rounded-full size-50 p-10 md:flex hidden justify-center items-center">
                <PhTarget color="#fff" :size="30" />
              </div>
              <div class="text-left font-light">
                <p class="font-bold xl:text-2xl text-lg uppercase">Ціль організації</p>
                <p class="mt-10 xl:text-lg text-sm">Створення власного онлайн простору для гравців-однодумців</p>
              </div>
            </div>
            <div
              class="bg-gradient-to-r from-primary to-indigo-800 flex gap-10 items-center w-full
                    h-full 2xl:p-30 lg:p-20 p-10 rounded-lg"
            >
              <div class="bg-[#1c1c25] rounded-full size-50 p-10 md:flex hidden justify-center items-center">
                <PhShieldCheck color="#fff" :size="30" />
              </div>
              <div class="text-left font-light">
                <p class="font-bold xl:text-2xl text-lg uppercase">Наші цінності</p>
                <p class="mt-10 xl:text-lg text-sm">Якість та доступність українською - головні тезиси ліги</p>
              </div>
            </div>
            <div
              class="bg-gradient-to-r from-primary to-indigo-800
               flex gap-10 items-center w-full rounded-lg h-full 2xl:p-30 lg:p-20 p-10"
            >
              <div class="bg-[#1c1c25] rounded-full size-50 p-10 md:flex hidden justify-center items-center">
                <PhQuestionMark color="#fff" :size="30" />
              </div>
              <div class="text-left font-light">
                <p class="font-bold xl:text-2xl text-lg uppercase">Для кого ми</p>
                <p class="mt-10 xl:text-lg text-sm">
                  Ми створюємо рівні умови для кожної команди та постійно
                  вдосконалюємо формат змагань.
                </p>
              </div>
            </div>
            <div
              class="bg-gradient-to-r from-primary to-indigo-800
               flex gap-10 items-center w-full h-full 2xl:p-30 lg:p-20 p-10 rounded-lg"
            >
              <div class="bg-[#1c1c25] rounded-full size-50 p-10 md:flex hidden justify-center items-center">
                <PhBrowser color="#fff" :size="30" />
              </div>
              <div class="text-left font-light">
                <p class="font-bold xl:text-2xl text-lg uppercase">Наша платформа</p>
                <p class="mt-10 lg:text-lg text-sm">
                  Ми створюємо зручну платформу для гравців: легка реєстрація,
                  просте управління командами та контроль рівня учасників.
                </p>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-r from-primary to-indigo-800 2xl:p-30 lg:p-20 p-10 rounded-lg">
            <p class="xl:text-2xl text-sm text-left font-light">
              Core League - це не тільки про турніри
              - ми платформа для зростання гравців, та просування культури геймінгу в Україні.
              Місце де тебе поважають та популяризують
            </p>
          </div>
        </div>
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            class="rounded-full flex justify-center items-center border animate-pulse border-white p-10"
            @click="scrollToSection(third)"
          >
            <PhCaretDown />
          </button>
        </div>
      </div>
    </div>

    <!-- Третий блок -->
    <div ref="third" class="relative">
      <div class="absolute inset-0 pointer-events-none" />
      <div class="relative py-40 h-full max-w-[1440px] md:px-40 px-10 mx-auto w-full">
        <h2
          class="lg:text-4xl md:text-3xl text-center text-2xl uppercase font-bold"
        >
          Наша ціль
        </h2>

        <div class="grid xl:grid-cols-2 h-full lg:my-0 py-20 justify-center mx-auto items-center gap-16 lg:gap-24">
          <div class="relative max-w-[700px] w-full">
            <div
              class="absolute inset-0
                 rounded-full
                 bg-blue-500/30 blur-3xl"
            />
            <el-image
              :src="playersMacbook"
            />
          </div>
          <div class="flex flex-col gap-40 py-20">
            <div class="relative">
              <span
                class="absolute z-10 -top-18 mb-6 py-10 px-20
                 text-xs uppercase tracking-widest font-semibold
                 bg-[#2e2d77]"
              >
                Власний сайт
              </span>

              <div
                class="relative rounded-2xl
                 bg-[#0b1424]
                 xl:p-40 lg:p-30 p-20
                 text-slate-300
                 leading-relaxed"
              >
                <p class="xl:text-xl lg:text-lg text-base sm:text-lg font-light">
                  Український сервіс за мотивами FACEIT вже в розробці. CORE постійно зростає та маштабується.
                  Залишатись лігою виключно на просторах DISCORD та соц. мереж не наша історія. Dota 2 стала
                  відправною точкою для подальшого розвитку Соге League - попереду CS2, VALORANT, PUBG
                  та інші дисципліни.
                </p>

                <div
                  class="absolute inset-0 rounded-2xl
                   bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_60%)]
                   -z-10"
                />
              </div>
            </div>

            <div class="relative">
              <span
                class="absolute z-10 -top-18 mb-6 py-10 px-20
                 text-xs uppercase tracking-widest font-semibold
                 bg-[#2e2d77]"
              >
                Цікаві турніри
              </span>

              <div
                class="relative rounded-2xl
                 bg-[#0b1424]
                 xl:p-40 lg:p-30 p-20
                 text-slate-300
                 leading-relaxed"
              >
                <p class="xl:text-xl lg:text-lg text-base sm:text-lg font-light">
                  Ми проводимо регулярні <span
                    class="underline cursor-pointer"
                    @click="route.push('/tournaments')"
                  >
                    турніри
                  </span> з чіткою структурою та зрозумілими правилами.
                  Формати змагань підходять як для новачків, так і для досвідчених команд;
                  на платформі є різні дивізіони — від початкових до професійних.
                  Кожен сезон — це новий виклик, чесна конкуренція та можливість показати свій справжній рівень гри.
                </p>

                <div
                  class="absolute inset-0 rounded-2xl
                   bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_60%)]
                   -z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <button
          class="rounded-full flex justify-center items-center border animate-pulse border-white p-10"
          @click="scrollToSection(five)"
        >
          <PhCaretDown />
        </button>
      </div>
    </div>

    <!-- Пятый блок -->
    <div ref="five" class="relative">
      <div class="max-w-[1440px] lg:px-30 px-20 mx-auto py-32">
        <!-- Заголовок -->
        <div class="text-center mb-20">
          <h5 class="uppercase font-bold tracking-wide text-2xl md:text-3xl lg:text-4xl">
            Як це працює?
          </h5>
          <p class="mt-4 text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">
            Прийміть участь у кіберспортивних турнірах всього за кілька простих кроків
          </p>
        </div>

        <!-- Steps -->
        <!-- Step 1 -->
        <div class="grid lg:grid-cols-2 lg:gap-20 gap-30">
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
           rounded-md p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
               text-black rounded-full text-sm
                font-bold"
            >
              1
            </span>
            <h1 class="text-lg font-semibold mb-3 mt-6">
              Авторизація через Steam
            </h1>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Увійдіть у систему за допомогою вашого Steam-акаунта без довгих форм
              та підтверджень.
            </p>
          </div>

          <!-- Step 2 -->
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
           rounded-md p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
               text-black rounded-full text-sm
                font-bold"
            >
              2
            </span>
            <h2 class="text-lg font-semibold mb-3 mt-6">
              Створіть або приєднайтесь до команди
            </h2>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Зберіть власну команду або вступіть до вже існуючої для участі
              в турнірах.
            </p>
          </div>

          <!-- Step 3 -->
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
           rounded-md p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
               text-black rounded-full text-sm
                font-bold"
            >
              3
            </span>
            <h3 class="text-lg font-semibold mb-3 mt-6">
              Реєстрація на турнір
            </h3>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Оберіть турнір, натисніть кнопку «Участь» і підтвердьте склад команди.
            </p>
          </div>

          <!-- Step 4 -->
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
           rounded-2xl p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
               text-black rounded-full text-sm font-bold"
            >
              4
            </span>
            <h4 class="text-lg font-semibold mb-3 mt-6">
              Грайте та вигравайте призи
            </h4>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Змагайтеся з іншими командами, піднімайтесь у рейтингу та
              отримуйте реальні призи.
            </p>
          </div>
          <!-- Step 5 -->
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
    rounded-md p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
                  text-black rounded-full text-sm font-bold"
            >
              5
            </span>
            <h5 class="text-lg font-semibold mb-3 mt-6">
              Слідкуйте за матчами
            </h5>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Переглядайте розклад матчів, результати і статус ігор
              в режимі реального часу на нашому
              <span class="underline font-bold">
                <a target="_blank" href="https://www.twitch.tv/core_league">Twitch</a>
              </span> каналі.
            </p>
          </div>

          <!-- Step 6 -->
          <div
            class="relative w-full bg-zinc-900 bg-gradient-to-r from-primary to-indigo-800
                  rounded-md p-8 hover:-translate-y-1 transition"
          >
            <span
              class="absolute -top-12 -left-12 size-25 flex justify-center items-center bg-white
                    text-black rounded-full text-sm font-bold"
            >
              6
            </span>
            <h6 class="text-lg font-semibold mb-3 mt-6">
              Отримуйте нагороди та статистику
            </h6>
            <p class="text-sm text-zinc-400 leading-relaxed">
              Забирайте призи, аналізуйте статистику команди та покращуйте
              свої результати.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { scrollToSection } from '@/core/helpers'
import playersMacbook from '@/assets/images/players_macbook.png'
import { PhShieldCheck, PhTarget, PhBrowser, PhQuestionMark, PhCaretDown } from '@phosphor-icons/vue'

const apiBaseUrl = import.meta.env.VITE_API_PUBLIC_URL
const authStore = useAuthStore()
const route = useRouter()

const second = ref<HTMLElement | null>(null)
const third = ref<HTMLElement | null>(null)
const five = ref<HTMLElement | null>(null)

</script>
