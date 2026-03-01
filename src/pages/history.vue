<script setup lang="ts">
const { getHistory } = useHealingStore()

const historyItems = computed(() => getHistory(30))
</script>

<template>
  <section class="page-section">
    <p class="eyebrow">쌓이는 작은 성취</p>
    <h1 class="page-title">기록 보기</h1>
    <p class="page-description">최근 30일 동안 남긴 회복 기록을 한 번에 볼 수 있어요.</p>

    <HistoryList :items="historyItems" />
  </section>
</template>
