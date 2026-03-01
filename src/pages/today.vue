<script setup lang="ts">
const { getTodayMission, completeToday, isTodayCompleted, totalCompleted, resetAll } = useHealingStore()

const mission = computed(() => getTodayMission())
const praiseMessage = ref('오늘 한 가지를 고른 것만으로도 이미 충분해요.')
const isDev = import.meta.dev

const handleComplete = () => {
  const result = completeToday()
  praiseMessage.value = result.praiseMessage
}

onMounted(() => {
  if (isTodayCompleted.value) {
    praiseMessage.value = '오늘의 기록이 이미 남아 있어요. 지금의 리듬을 그대로 믿어도 좋아요.'
  }
})
</script>

<template>
  <section class="page-section">
    <p class="eyebrow">부담은 줄이고, 회복은 천천히</p>
    <h1 class="page-title">오늘의 미션</h1>
    <p class="page-description">오늘은 한 가지만 선택해요. 완료하면 바로 따뜻한 피드백을 남겨드릴게요.</p>

    <MissionCard
      :mission="mission"
      :completed="isTodayCompleted"
      :total-completed="totalCompleted"
      :praise-message="praiseMessage"
      @complete="handleComplete"
    />

    <button
      v-if="isDev"
      type="button"
      class="button button-secondary"
      aria-label="개발용 전체 기록 초기화"
      @click="resetAll"
    >
      개발용 초기화
    </button>
  </section>
</template>
