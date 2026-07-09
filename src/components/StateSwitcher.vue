<template>
  <div v-if="entries.length > 0" class="state-switcher-group">
    <div
      v-for="entry in entries"
      :key="entry.id"
      class="segmented-control"
    >
      <span v-if="entries.length > 1" class="switcher-label">{{ entry.label }}</span>
      <button
        v-for="state in entry.states"
        :key="state.key"
        class="segment"
        :class="{ 'is-active': entry.currentValue === state.key }"
        @click="setValue(state.key, entry.id)"
      >
        {{ state.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStateSwitcher } from '@/composables/useStateSwitcher'

const { switchers, setValue } = useStateSwitcher()

const entries = computed(() =>
  Array.from(switchers.entries())
    .filter(([, inst]) => inst.states.length > 0)
    .map(([id, inst]) => ({
      id,
      label: id === 'default' ? '' : id,
      states: inst.states,
      currentValue: inst.currentValue,
    }))
)
</script>

<style lang="scss">
.state-switcher-group {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background-color: #1a1a2e;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.segmented-control {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.switcher-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  padding: 0 6px;
  white-space: nowrap;
}

.segment {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover:not(.is-active) {
    color: rgba(255, 255, 255, 0.9);
    background-color: rgba(255, 255, 255, 0.05);
  }

  &.is-active {
    background-color: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-weight: 600;
  }
}
</style>
