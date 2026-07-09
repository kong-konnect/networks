<template>
  <component :is="hideCard ? 'div' : KCard" :class="{ 'entity-base-table-card': !hideCard }" :title="title" :title-tag="titleTag">
    <KTableData
      :cell-attrs="cellAttrs"
      :client-sort="enableClientSort"
      class="entity-base-table"
      :data-testid="dataTestid"
      :error="tableErrorState.hasError"
      :error-state-message="tableErrorState.message"
      :error-state-title="tableErrorState.title"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      :headers="computedHeaders"
      :hide-pagination="hidePagination"
      :hide-pagination-when-optional="hidePaginationWhenOptional"
      :hide-toolbar="hideToolbar"
      :initial-fetcher-params="initialFetcherParams"
      :loading="isLoading"
      :pagination-attributes="paginationAttributes"
      resize-columns
      :row-attrs="rowAttrs"
      :row-key="rowKey"
      :search-input="searchInput || query"
      :sort-handler-function="enableClientSort ? sortHandlerFunction : undefined"
      :sortable="!disableSorting"
      :table-preferences="tablePreferences"
      @empty-state-action-click="handleEmptyStateCtaClicked"
      @row:click="handleRowClick"
      @sort="(params: any) => emit('sort', params)"
      @state="(state: any) => emit('state', state)"
      @update:table-preferences="persistTablePreferences"
    >
      <template #toolbar>
        <div class="entity-base-table-toolbar">
          <!-- Production-style toolbar-filter slot (preferred) -->
          <slot name="toolbar-filter">
            <!-- Fallback: built-in search input (backward compat) -->
            <KInput
              v-if="!hideFilter"
              :model-value="searchInput || query"
              class="entity-base-table-filter"
              data-testid="entity-filter"
              :placeholder="filterPlaceholder"
              type="search"
              @update:model-value="handleSearchUpdate"
            >
              <template #before>
                <SearchIcon decorative />
              </template>
            </KInput>
          </slot>
          <div
            v-if="$slots['toolbar-button'] || $slots['toolbar-actions']"
            class="entity-base-table-toolbar-actions"
          >
            <slot name="toolbar-button" />
            <slot name="toolbar-actions" />
          </div>
        </div>
      </template>

      <template #empty-state>
        <slot name="empty-state">
          <KEmptyState
            :action-button-text="(searchInput || query) ? emptyStateActionText : emptyStateOptions?.ctaText || emptyStateActionText"
            :icon-variant="(searchInput || query) ? 'search' : 'kong'"
            :message="(searchInput || query) ? emptyStateMessage : emptyStateOptions?.message || emptyStateMessage"
            :title="(searchInput || query) ? emptyStateTitle : emptyStateOptions?.title || emptyStateTitle"
            @click-action="handleEmptyStateCtaClicked"
          />
        </slot>
      </template>

      <!-- Dynamic column slot pass-through -->
      <template
        v-for="header in slottableHeaders"
        :key="header.key"
        #[header.key]="slotProps"
      >
        <slot :name="header.key" v-bind="slotProps" />
      </template>

      <!-- Action items slot -->
      <template
        v-if="$slots['action-items'] || $slots['actions']"
        #action-items="slotProps"
      >
        <slot name="action-items" v-bind="slotProps" />
        <slot name="actions" v-bind="slotProps" />
      </template>

      <!-- Tooltip slot pass-through -->
      <template
        v-for="header in tooltipHeaders"
        :key="`tooltip-${header.key}`"
        #[`tooltip-${header.key}`]
      >
        <slot :name="`tooltip-${header.key}`" />
      </template>
    </KTableData>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount, useSlots } from 'vue'
import { SearchIcon } from '@kong/icons'
import { KCard, KTableData, KInput, KEmptyState } from '@kong/kongponents'

export interface EntityBaseTableHeader {
  label?: string
  key: string
  sortable?: boolean
  hidable?: boolean
  hideLabel?: boolean
  tooltip?: string
}

export interface EmptyStateOptions {
  ctaText?: string
  ctaPath?: string | object
  message?: string
  title?: string
}

export interface TableErrorMessage {
  title?: string
  message?: string
}

const props = withDefaults(defineProps<{
  headers: EntityBaseTableHeader[]
  fetcher: (...args: any[]) => Promise<any>
  rowKey?: string
  filterPlaceholder?: string
  searchInput?: string
  query?: string
  hideFilter?: boolean
  hideCard?: boolean
  hidePagination?: boolean
  tablePreferencesKey?: string
  fetcherCacheKey?: string
  initialFetcherParams?: Record<string, any>
  cellAttrs?: (...args: any[]) => Record<string, any>
  rowAttrs?: (...args: any[]) => Record<string, any>
  hidePaginationWhenOptional?: boolean
  hideToolbar?: boolean
  error?: boolean
  dataTestid?: string
  emptyStateTitle?: string
  emptyStateMessage?: string
  emptyStateActionText?: string
  // Production API additions
  isLoading?: boolean
  errorMessage?: string | TableErrorMessage | null
  enableClientSort?: boolean
  sortHandlerFunction?: (...args: any[]) => any[]
  disableSorting?: boolean
  disableRowClick?: boolean
  enableEntityActions?: boolean
  emptyStateOptions?: EmptyStateOptions
  paginationAttributes?: Record<string, any>
  title?: string
  titleTag?: string
}>(), {
  rowKey: 'id',
  filterPlaceholder: 'Search...',
  searchInput: '',
  query: '',
  hideFilter: false,
  hideCard: false,
  hidePagination: false,
  hidePaginationWhenOptional: true,
  hideToolbar: false,
  error: false,
  isLoading: false,
  enableClientSort: false,
  disableSorting: false,
  disableRowClick: false,
  enableEntityActions: true,
  emptyStateTitle: 'No results found',
  emptyStateMessage: 'No results matching your search.',
  emptyStateActionText: 'Clear search',
  errorMessage: null,
  titleTag: 'h2',
  initialFetcherParams: () => ({ pageSize: 10 }),
  paginationAttributes: () => ({}),
})

const emit = defineEmits<{
  (e: 'row:click', event: Event, row: any): void
  (e: 'click:row', row: any): void
  (e: 'state', state: any): void
  (e: 'sort', sortParams: any): void
  (e: 'update:searchInput', value: string): void
  (e: 'clear-search-input'): void
  (e: 'empty-state-cta-clicked'): void
}>()

const slots = useSlots()

// Error state derived from errorMessage prop (production pattern)
const tableErrorState = computed((): { hasError: boolean, title?: string, message?: string } => {
  if (props.errorMessage) {
    if (typeof props.errorMessage === 'string') {
      return { hasError: true, title: props.errorMessage }
    }
    return {
      hasError: true,
      title: props.errorMessage.title,
      message: props.errorMessage.message,
    }
  }
  return { hasError: props.error }
})

// Auto-add actions column if enableEntityActions is true and actions slot provided
const computedHeaders = computed(() => {
  const base = [...props.headers]
  if (props.enableEntityActions && (slots['action-items'] || slots['actions']) && !base.some(h => h.key === 'actions')) {
    base.push({ key: 'actions', hideLabel: true })
  }
  return base
})

// Compute which headers have corresponding parent slots for pass-through
const slottableHeaders = computed(() =>
  props.headers.filter(h => h.key !== 'actions' && slots[h.key]),
)

// Compute which headers have tooltip slots provided
const tooltipHeaders = computed(() =>
  props.headers.filter(h => slots[`tooltip-${h.key}`]),
)

// Row click handler respects disableRowClick
const handleRowClick = computed(() => {
  return props.disableRowClick
    ? undefined
    : (event: Event, row: any) => {
        emit('row:click', event, row)
        emit('click:row', row)
      }
})

const handleSearchUpdate = (value: string | number) => {
  const trimmed = (String(value))?.trim() ?? ''
  emit('update:searchInput', trimmed)
}

const handleEmptyStateCtaClicked = () => {
  emit('empty-state-cta-clicked')
  emit('clear-search-input')
  emit('update:searchInput', '')
}

// Table preferences (show/hide columns with localStorage persistence)
const tablePreferences = ref<Record<string, any>>({})

const storageKey = computed(() =>
  props.tablePreferencesKey
    ? `ai-gateway-table-${props.tablePreferencesKey}`
    : null,
)

const persistTablePreferences = (newPreferences: Record<string, any>) => {
  tablePreferences.value = newPreferences
  if (storageKey.value) {
    try {
      localStorage.setItem(storageKey.value, JSON.stringify(newPreferences))
    } catch {
      // no op
    }
  }
}

onBeforeMount(() => {
  if (storageKey.value) {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      try {
        tablePreferences.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem(storageKey.value)
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.entity-base-table-toolbar {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  width: 100%;

  .entity-base-table-filter {
    flex: 1;
  }

  .entity-base-table-toolbar-actions {
    display: flex;
    flex-shrink: 0;
    gap: $kui-space-40;
    margin-left: auto;
  }
}

.entity-base-table {
  :deep(td) {
    height: 66px;
  }
}

// Shared cell layout styles
:deep(.custom-layout-cell) {
  align-items: center;
  display: flex;
  width: 100%;

  .info-cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    width: 100%;

    .k-table-cell-title {
      color: $kui-color-text;
      font-size: $kui-font-size-30;
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-40;
    }

    .k-table-cell-description {
      color: $kui-color-text-neutral-stronger;
      font-size: $kui-font-size-20;
      line-height: $kui-line-height-20;
    }
  }
}

:deep(.truncated) {
  line-height: initial;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
