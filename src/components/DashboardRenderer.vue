<template>
  <div class="kong-ui-public-dashboard-renderer">
    <div class="layout">
      <div
        class="grid-layout"
        :style="gridStyle"
      >
        <div
          v-for="tile in gridTiles"
          :key="tile.id"
          class="grid-tile"
          :style="getTileStyle(tile)"
        >
          <DashboardTile
            :definition="tile.definition"
            :height="getTileHeight(tile)"
          >
            <!-- Slottable / golden_signals tiles: pass custom slot content into the tile -->
            <template v-if="tile.definition.chart.type === 'slottable' || tile.definition.chart.type === 'golden_signals'">
              <slot :name="tile.definition.chart.id" />
            </template>
          </DashboardTile>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardTile from './DashboardTile.vue'

const DASHBOARD_COLS = 6
const DEFAULT_TILE_HEIGHT = 170

export interface TileLayout {
  position: { col: number; row: number }
  size: { cols: number; rows: number; fit_to_content?: boolean }
}

export interface ChartOptions {
  type: string
  id?: string
  chart_title?: string
  description?: string
  entity_link?: string
}

export interface TileDefinition {
  chart: ChartOptions
  query?: Record<string, any>
}

export interface TileConfig {
  id: string
  definition: TileDefinition
  layout: TileLayout
}

export interface DashboardConfig {
  tiles: TileConfig[]
  tile_height?: number
}

interface GridTile extends TileConfig {
  // Extended at grid level if needed
}

const props = defineProps<{
  /** Dashboard configuration with tiles array */
  modelValue: DashboardConfig
  /** Context filters (prototype: unused, present for API compat) */
  context?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: DashboardConfig): void
}>()

const tileHeight = computed(() => props.modelValue.tile_height || DEFAULT_TILE_HEIGHT)

const gridTiles = computed<GridTile[]>(() => props.modelValue.tiles)

// Calculate grid rows from tile positions
const maxRow = computed(() => {
  let max = 0
  for (const tile of gridTiles.value) {
    const end = tile.layout.position.row + tile.layout.size.rows
    if (end > max) max = end
  }
  return max
})

// Build CSS grid row heights
const rowHeights = computed(() => {
  const heights: string[] = []
  for (let r = 0; r < maxRow.value; r++) {
    // Check if all tiles in this row are fit_to_content
    const tilesInRow = gridTiles.value.filter(
      t => t.layout.position.row === r && t.layout.size.rows === 1,
    )
    const allFitToContent = tilesInRow.length > 0 && tilesInRow.every(t => t.layout.size.fit_to_content)
    heights.push(allFitToContent ? 'auto' : `${tileHeight.value}px`)
  }
  return heights
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${DASHBOARD_COLS}, 1fr)`,
  gridTemplateRows: rowHeights.value.join(' '),
  gap: 'var(--kui-space-70, 20px)',
}))

const getTileStyle = (tile: GridTile) => ({
  gridColumnStart: tile.layout.position.col + 1,
  gridColumnEnd: tile.layout.position.col + 1 + tile.layout.size.cols,
  gridRowStart: tile.layout.position.row + 1,
  gridRowEnd: tile.layout.position.row + 1 + tile.layout.size.rows,
})

const getTileHeight = (tile: GridTile) => {
  if (tile.layout.size.fit_to_content) return undefined
  return tile.layout.size.rows * tileHeight.value
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-public-dashboard-renderer {
  height: 100%;
  width: 100%;
}

.layout {
  width: 100%;
}

.grid-layout {
  @media (max-width: $kui-breakpoint-phablet) {
    display: flex !important;
    flex-direction: column;
    gap: $kui-space-70;

    .grid-tile {
      grid-column: unset !important;
      grid-row: unset !important;
    }
  }
}

// Production: .tile-container has height: 100% to fill the grid cell
.grid-tile {
  background: var(--kui-color-background-transparent, transparent);
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-20;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.tile-container.slottable-tile {
  height: 100%;
  width: 100%;
}
</style>
