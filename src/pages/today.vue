<script setup lang="ts">
const DEFAULT_PAGE_DESCRIPTION = '오늘은 한 가지만 선택해요. 완료하면 바로 따뜻한 피드백을 남겨드릴게요.'
const BURNOUT_PAGE_DESCRIPTION = '한 번에 많은 걸 하지 않아도 괜찮아요. 오늘은 저강도 미션 한 가지만 선택해요.'
const DEFAULT_IDLE_MESSAGE = '오늘 한 가지를 고른 것만으로도 이미 충분해요.'
const BURNOUT_IDLE_MESSAGE = '한 번에 많은 걸 하지 않아도 괜찮아요. 가벼운 미션부터 시작해요.'
const DEFAULT_DONE_MESSAGE = '오늘의 기록이 이미 남아 있어요. 지금의 리듬을 그대로 믿어도 좋아요.'
const BURNOUT_DONE_MESSAGE = '오늘의 저강도 미션 기록이 이미 남아 있어요. 지금의 호흡을 그대로 이어가도 좋아요.'

const { getTodayMission, completeToday, isTodayCompleted, totalCompleted, resetAll, burnoutMode, setBurnoutMode } =
  useHealingStore()

const mission = computed(() => getTodayMission())
const pageDescription = computed(() => (burnoutMode.value ? BURNOUT_PAGE_DESCRIPTION : DEFAULT_PAGE_DESCRIPTION))
const burnoutModeHint = computed(() =>
  burnoutMode.value ? '저강도 미션 풀에서 오늘의 미션을 추천해요.' : '기본 미션 풀에서 오늘의 미션을 추천해요.'
)
const praiseMessage = ref(DEFAULT_IDLE_MESSAGE)
const isDev = import.meta.dev

const syncModeMessage = (enabled: boolean) => {
  if (isTodayCompleted.value) {
    praiseMessage.value = enabled ? BURNOUT_DONE_MESSAGE : DEFAULT_DONE_MESSAGE
    return
  }

  praiseMessage.value = enabled ? BURNOUT_IDLE_MESSAGE : DEFAULT_IDLE_MESSAGE
}

const handleComplete = () => {
  const result = completeToday()
  praiseMessage.value = result.praiseMessage
}

const handleBurnoutToggle = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) {
    return
  }

  setBurnoutMode(target.checked)
}

onMounted(() => {
  syncModeMessage(burnoutMode.value)
})

watch(burnoutMode, (enabled) => {
  syncModeMessage(enabled)
})
</script>

<template>
  <section class="page-section">
    <p class="eyebrow">부담은 줄이고, 회복은 천천히</p>
    <h1 class="page-title">오늘의 미션</h1>
    <p class="page-description">{{ pageDescription }}</p>

    <section class="card burnout-mode-card" aria-labelledby="burnout-mode-title">
      <div class="burnout-mode-header">
        <div>
          <h2 id="burnout-mode-title" class="section-title">번아웃 모드</h2>
          <p id="burnout-mode-help" class="section-description">{{ burnoutModeHint }}</p>
        </div>
        <div class="burnout-toggle-control">
          <label class="burnout-toggle-label" for="burnout-mode-toggle">
            {{ burnoutMode ? '저강도 ON' : '저강도 OFF' }}
          </label>
          <input
            id="burnout-mode-toggle"
            type="checkbox"
            class="burnout-toggle-input"
            role="switch"
            :checked="burnoutMode"
            :aria-checked="burnoutMode"
            aria-label="번아웃 모드 토글"
            aria-describedby="burnout-mode-help"
            @change="handleBurnoutToggle"
          >
        </div>
      </div>
    </section>

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
