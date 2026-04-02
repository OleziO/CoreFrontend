<template>
  <div class="max-w-360 w-full">
    <Input v-model="searchValue" placeholder="Пошук по ніку Steam або Discord..." />
  </div>
</template>

<script setup lang="ts">
const searchValue = ref('')

watch(() => searchValue.value, () => {
  debouncedFn()
})

const debouncedFn = useDebounceFn(() => {
  search.value = searchValue.value
}, 200)

const search = defineModel<string>({ default: '' })
</script>
