<script setup lang="ts">
import type { HistoryDay } from '~/types/healing'

defineProps<{
  items: HistoryDay[]
}>()

const sectionTitleId = 'history-list-title'
</script>

<template>
  <section class="card" :aria-labelledby="sectionTitleId">
    <h2 :id="sectionTitleId" class="section-title">최근 30일 기록</h2>
    <ul class="history-list">
      <li v-for="entry in items" :key="entry.date" class="history-item">
        <div>
          <p class="history-date">{{ entry.date }}</p>
          <p v-if="entry.completed" class="history-mission">{{ entry.missionTitle }}</p>
          <p v-else class="history-mission">아직 기록 없음</p>
        </div>
        <strong :class="entry.completed ? 'status-complete' : 'status-pending'">
          {{ entry.completed ? '완료' : '미완료' }}
        </strong>
      </li>
    </ul>
  </section>
</template>
