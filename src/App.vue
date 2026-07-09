<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <StateSwitcher />
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import StateSwitcher from '@/components/StateSwitcher.vue'
</script>
