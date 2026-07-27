<template>
  <!-- Prototype-only device: compare the shipped unified connectivity view against a
       "by direction" variant (Client → Kong / Kong → upstream). Not a product control. -->
  <div class="variant-switcher" data-testid="connectivity-view-switcher">
    <span class="variant-switcher-label">Connectivity view</span>
    <div class="variant-switcher-seg">
      <button
        type="button"
        class="variant-seg"
        :class="{ 'is-active': store.connectivityView.value === 'unified' }"
        data-testid="connectivity-view-unified"
        @click="select('unified')"
      >
        Unified
      </button>
      <button
        type="button"
        class="variant-seg"
        :class="{ 'is-active': store.connectivityView.value === 'directional' }"
        data-testid="connectivity-view-directional"
        @click="select('directional')"
      >
        By direction
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useNetworksStore } from '@/composables/useNetworksStore'

const store = useNetworksStore()
const route = useRoute()
const router = useRouter()

const select = (mode: 'unified' | 'directional') => {
  store.setConnectivityView(mode)
  // If we're not already somewhere the difference shows, land on a network so the effect
  // is visible immediately (mirrors the Day 1 / Day n switcher behaviour).
  const onNetwork = typeof route.name === 'string' && route.name.startsWith('networks-')
  if (!onNetwork) router.push({ name: 'networks-detail', params: { id: 'net-1' } })
}
</script>

<style scoped lang="scss">
.variant-switcher {
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
  // Stacks directly below the Day 1 / Day n switcher.
  top: 44px;
  transform: translateX(-50%);
  z-index: 2000;
}

.variant-switcher-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.variant-switcher-seg {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
}

.variant-seg {
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
