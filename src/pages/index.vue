<script setup lang="ts">
const breathingDone = ref(false)

const onBreathingDone = () => {
  breathingDone.value = true
}
</script>

<template>
  <section class="page-section">
    <p class="eyebrow">오늘도 천천히 회복 중</p>
    <h1 class="page-title">60초만, 숨을 고르며 시작해요</h1>
    <p class="page-description">
      한 번에 많은 걸 하지 않아도 괜찮아요. 지금은 짧게 호흡하고, 오늘의 작은 미션 한 가지만 선택해요.
    </p>

    <BreathingTimer @done="onBreathingDone" />

    <p v-if="breathingDone" class="praise-text" aria-live="polite">
      숨이 정돈됐어요. 다음 한 걸음도 가볍게 이어가 볼까요?
    </p>

    <NuxtLink to="/today" class="button cta-link" aria-label="오늘의 미션 페이지로 이동">시작하기</NuxtLink>
  </section>
</template>
