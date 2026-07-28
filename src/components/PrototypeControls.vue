<template>
  <!-- Prototype-only meta-control: one dockable panel (bottom-left) housing every
       prototype toggle. Not a product control. Add new rows here as variants grow. -->
  <div ref="root" class="proto-controls" data-testid="prototype-controls">
    <!-- Panel opens upward from the trigger -->
    <div v-if="open" class="proto-panel" data-testid="prototype-panel">
      <div class="proto-panel-head">Prototype controls</div>

      <div
        v-for="ctrl in controls"
        :key="ctrl.key"
        class="proto-row"
      >
        <span class="proto-row-label">{{ ctrl.label }}</span>
        <div class="proto-seg">
          <button
            v-for="opt in ctrl.options"
            :key="opt.value"
            type="button"
            class="proto-seg-btn"
            :class="{ 'is-active': ctrl.current === opt.value }"
            :data-testid="opt.testid"
            @click="ctrl.select(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Trigger -->
    <button
      type="button"
      class="proto-trigger"
      :class="{ 'is-open': open }"
      data-testid="prototype-controls-trigger"
      @click="open = !open"
    >
      <CogIcon :size="KUI_ICON_SIZE_20" decorative />
      <span class="proto-trigger-label">Prototype</span>
      <span class="proto-trigger-summary">{{ summary }}</span>
      <span class="proto-caret">{{ open ? '▾' : '▸' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CogIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { useNetworksStore } from '@/composables/useNetworksStore'

const store = useNetworksStore()
const route = useRoute()
const router = useRouter()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

const setDayMode = (mode: string) => {
  store.setDayMode(mode as 'day-1' | 'day-n')
  // Land on the Networks list so the effect of the switch is visible immediately.
  router.push({ name: 'networks-list' })
}

const setConnectivityView = (mode: string) => {
  store.setConnectivityView(mode as 'unified' | 'directional')
  // If we're not already somewhere the difference shows, land on a network.
  const onNetwork = typeof route.name === 'string' && route.name.startsWith('networks-')
  if (!onNetwork) router.push({ name: 'networks-detail', params: { id: 'net-1' } })
}

const controls = computed(() => [
  {
    key: 'day',
    label: 'Prototype state',
    current: store.dayMode.value,
    select: setDayMode,
    options: [
      { label: 'Day 1', value: 'day-1', testid: 'day-1' },
      { label: 'Day n', value: 'day-n', testid: 'day-n' },
    ],
  },
  {
    key: 'connectivity',
    label: 'Connectivity view',
    current: store.connectivityView.value,
    select: setConnectivityView,
    options: [
      { label: 'Unified', value: 'unified', testid: 'connectivity-view-unified' },
      { label: 'By direction', value: 'directional', testid: 'connectivity-view-directional' },
    ],
  },
])

// A glanceable summary of the current selections on the collapsed trigger.
const summary = computed(() => {
  const day = store.dayMode.value === 'day-1' ? 'Day 1' : 'Day n'
  const view = store.connectivityView.value === 'directional' ? 'By direction' : 'Unified'
  return `${day} · ${view}`
})

const onDocClick = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped lang="scss">
.proto-controls {
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  left: 16px;
  position: fixed;
  z-index: 2000;
}

.proto-trigger {
  align-items: center;
  background-color: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  padding: 7px 12px;

  &:hover { border-color: rgba(255, 255, 255, 0.24); }
}

.proto-trigger-label {
  font-size: 12px;
  font-weight: 600;
}

.proto-trigger-summary {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.proto-caret {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.proto-panel {
  background-color: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 240px;
  padding: 12px;
}

.proto-panel-head {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.proto-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.proto-row-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
}

.proto-seg {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
}

.proto-seg-btn {
  background: none;
  border: none;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
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
