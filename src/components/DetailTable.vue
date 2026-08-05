<template>
  <table class="detail-table">
    <thead>
      <tr>
        <th
          v-for="col in columns"
          :key="col.key"
          :class="{ 'is-right': col.align === 'right' }"
          :style="col.width ? { width: col.width } : undefined"
        >
          {{ col.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, i) in rows"
        :key="(rowKey && row[rowKey]) || i"
        :class="{ 'is-clickable': clickable }"
        @click="clickable && emit('rowClick', row)"
      >
        <td
          v-for="col in columns"
          :key="col.key"
          :class="{ 'is-right': col.align === 'right' }"
        >
          <slot :name="`cell-${col.key}`" :row="row">{{ row[col.key] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
export interface DetailColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: string
}

withDefaults(defineProps<{
  columns: DetailColumn[]
  rows: Record<string, any>[]
  rowKey?: string
  clickable?: boolean
}>(), {
  rowKey: 'id',
  clickable: false,
})

const emit = defineEmits<{ (e: 'rowClick', row: Record<string, any>): void }>()
</script>

<style scoped lang="scss">
// The one detail-flow table. Sentence-case headers, separator rows only (no full
// borders/zebra), clickable rows navigate. No per-row "View"/"Action" column — the row
// itself is the target, matching Konnect.
.detail-table {
  border-collapse: collapse;
  width: 100%;

  th {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-40 $kui-space-60;
    text-align: left;
    white-space: nowrap;

    &.is-right { text-align: right; }
  }

  td {
    border-top: $kui-border-width-10 solid $kui-color-border;
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    padding: $kui-space-50 $kui-space-60;
    vertical-align: middle;

    &.is-right { text-align: right; }
  }

  tbody tr.is-clickable {
    cursor: pointer;

    &:hover td { background-color: $kui-color-background-neutral-weakest; }
  }

  // Name links inside slots — one consistent style everywhere.
  :deep(.row-link) {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  :deep(.cell-muted) { color: $kui-color-text-neutral; white-space: nowrap; }
}
</style>
