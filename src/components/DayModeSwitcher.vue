<template>
  <!-- Prototype-only device: switch between an empty Day 1 walkthrough and the
       populated Day n state. Not a product control. -->
  <div class="day-switcher" data-testid="day-mode-switcher">
    <span class="day-switcher-label">Prototype state</span>
    <div class="day-switcher-seg">
      <button
        type="button"
        class="day-seg"
        :class="{ 'is-active': store.dayMode.value === 'day-1' }"
        data-testid="day-1"
        @click="select('day-1')"
      >
        Day 1
      </button>
      <button
        type="button"
        class="day-seg"
        :class="{ 'is-active': store.dayMode.value === 'day-n' }"
        data-testid="day-n"
        @click="select('day-n')"
      >
        Day n
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useNetworksStore } from '@/composables/useNetworksStore'

const store = useNetworksStore()
const router = useRouter()

const select = (mode: 'day-1' | 'day-n') => {
  store.setDayMode(mode)
  // Land on the Networks list so the effect of the switch is visible immediately.
  router.push({ name: 'networks-list' })
}
</script>

<style scoped lang="scss">
.day-switcher {
  align-items: center;
  background-color: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0 0 10px 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  display: flex;
  gap: 10px;
  left: 50%;
  padding: 6px 10px;
  position: fixed;
  top: 0;
  transform: translateX(-50%);
  z-index: 2000;
}

.day-switcher-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.day-switcher-seg {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
}

.day-seg {
  background: none;
  border: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 14px;
  transition: all 0.15s ease;

  &:hover:not(.is-active) {
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }

  &.is-active {
    background-color: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-weight: 600;
  }
}
</style>
