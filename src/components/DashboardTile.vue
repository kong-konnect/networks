<template>
  <div
    class="kong-ui-dashboard-tile"
    :style="height ? { height: `${height}px` } : undefined"
  >
    <!-- Tile header -->
    <div
      v-if="definition.chart.chart_title"
      class="tile-header"
    >
      <span class="title">{{ definition.chart.chart_title }}</span>
      <span
        v-if="definition.chart.description"
        class="header-description"
      >
        {{ definition.chart.description }}
      </span>
    </div>

    <!-- Tile content -->
    <div
      class="tile-content"
      :class="`type-${definition.chart.type}`"
    >
      <slot>
        <div class="tile-placeholder">
          {{ definition.chart.chart_title || 'Chart' }}
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TileDefinition } from './DashboardRenderer.vue'

defineProps<{
  /** Tile definition with chart config and query */
  definition: TileDefinition
  /** Tile height in pixels (undefined = auto) */
  height?: number
}>()
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-dashboard-tile {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tile-header {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
  padding: $kui-space-40 $kui-space-50;

  .title {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    line-height: 24px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-description {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    white-space: nowrap;
  }
}

.tile-content {
  flex-grow: 1;
  margin: 0;
  overflow: hidden;
  padding: $kui-space-20 $kui-space-60 0 $kui-space-60;

  &.type-golden_signals {
    padding: 0;
  }
}

.tile-placeholder {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  font-size: $kui-font-size-30;
  height: 100%;
  justify-content: center;
}
</style>
