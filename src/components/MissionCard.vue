<script setup lang="ts">
import type { Mission } from '~/types/healing'

defineProps<{
  mission: Mission
  completed: boolean
  totalCompleted: number
  praiseMessage: string
}>()

const emit = defineEmits<{
  complete: []
}>()
</script>

<template>
  <section class="card mission-card" aria-label="오늘의 미션 카드">
    <h2 class="section-title">오늘의 미션 1개</h2>
    <h3 class="mission-title">{{ mission.title }}</h3>
    <p class="section-description">{{ mission.description }}</p>

    <p class="meta-text">예상 시간 {{ mission.estimatedMinutes }}분</p>

    <button
      type="button"
      class="button"
      :disabled="completed"
      :aria-label="completed ? '오늘의 미션이 이미 완료됨' : '오늘의 미션 완료하기'"
      @click="emit('complete')"
    >
      {{ completed ? '오늘 기록 완료' : '완료로 체크' }}
    </button>

    <p class="praise-text" aria-live="polite">{{ praiseMessage }}</p>
    <p class="meta-text">누적 완료 {{ totalCompleted }}회</p>
  </section>
</template>
