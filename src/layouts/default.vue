<script setup lang="ts">
const route = useRoute()

const isActive = (path: string) => {
  return route.path === path
}
</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">본문 바로가기</a>

    <header class="top-nav">
      <NuxtLink to="/" class="brand" aria-label="홈으로 이동">healing-site</NuxtLink>
      <nav aria-label="주요 메뉴" class="menu">
        <NuxtLink
          to="/"
          class="menu-link"
          :class="{ active: isActive('/') }"
          :aria-current="isActive('/') ? 'page' : undefined"
          aria-label="랜딩 페이지"
        >
          홈
        </NuxtLink>
        <NuxtLink
          to="/today"
          class="menu-link"
          :class="{ active: isActive('/today') }"
          :aria-current="isActive('/today') ? 'page' : undefined"
          aria-label="오늘의 미션 페이지"
        >
          오늘
        </NuxtLink>
        <NuxtLink
          to="/history"
          class="menu-link"
          :class="{ active: isActive('/history') }"
          :aria-current="isActive('/history') ? 'page' : undefined"
          aria-label="기록 페이지"
        >
          기록
        </NuxtLink>
      </nav>
    </header>

    <main id="main-content" class="page-wrap">
      <slot />
    </main>
  </div>
</template>
