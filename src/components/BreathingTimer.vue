<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    duration?: number
  }>(),
  {
    duration: 60
  }
)

const emit = defineEmits<{
  done: []
}>()

const secondsLeft = ref(props.duration)
const running = ref(false)
const intervalId = ref<number | null>(null)

const elapsedSeconds = computed(() => props.duration - secondsLeft.value)
const breathingGuide = computed(() => (elapsedSeconds.value % 8 < 4 ? '들이쉬기' : '내쉬기'))
const progressPercent = computed(() => Math.round((elapsedSeconds.value / props.duration) * 100))

const clearTimer = () => {
  if (intervalId.value !== null) {
    window.clearInterval(intervalId.value)
    intervalId.value = null
  }
}

const stop = () => {
  clearTimer()
  running.value = false
}

const tick = () => {
  if (secondsLeft.value <= 1) {
    secondsLeft.value = 0
    stop()
    emit('done')
    return
  }

  secondsLeft.value -= 1
}

const start = () => {
  if (running.value) {
    return
  }

  if (secondsLeft.value === 0) {
    secondsLeft.value = props.duration
  }

  running.value = true
  intervalId.value = window.setInterval(tick, 1000)
}

const reset = () => {
  stop()
  secondsLeft.value = props.duration
}

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <section class="card breathing-card" aria-label="60초 호흡 가이드">
    <h2 class="section-title">60초 호흡</h2>
    <p class="section-description">{{ breathingGuide }}에 맞춰 천천히 숨을 이어가 보세요.</p>

    <div class="breathing-visual" :class="{ 'is-running': running }" aria-hidden="true">
      <span>{{ secondsLeft }}초</span>
    </div>

    <p class="progress-text" aria-live="polite">진행 {{ progressPercent }}%</p>

    <div class="button-row">
      <button
        type="button"
        class="button"
        :aria-label="running ? '호흡 타이머 진행 중' : '호흡 타이머 시작'"
        @click="start"
      >
        {{ running ? '진행 중' : '시작' }}
      </button>
      <button
        type="button"
        class="button button-secondary"
        aria-label="호흡 타이머 다시 시작"
        @click="reset"
      >
        다시
      </button>
    </div>
  </section>
</template>
