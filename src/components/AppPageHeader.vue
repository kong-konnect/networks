<template>
  <div class="kong-ui-app-page-header">
    <div
      v-if="breadcrumbs?.length"
      class="page-header-breadcrumbs"
    >
      <KBreadcrumbs
        item-max-width="150"
        :items="breadcrumbs"
      />
    </div>
    <div class="page-header-title-section">
      <div class="page-header-title-wrapper">
        <div
          v-if="$slots['title-before']"
          class="page-header-title-before"
        >
          <slot name="title-before" />
        </div>
        <h1 class="page-header-title">{{ title }}</h1>
        <div
          v-if="$slots['title-after']"
          class="page-header-title-after"
        >
          <slot name="title-after" />
        </div>
      </div>
      <div
        v-if="$slots.actions"
        class="page-header-actions"
      >
        <slot name="actions" />
      </div>
    </div>
    <div
      v-if="$slots.below"
      class="page-header-section-below"
    >
      <slot name="below" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { KBreadcrumbs } from '@kong/kongponents'

export interface BreadcrumbItem {
  key: string
  to?: object | string
  text: string
}

defineProps<{
  title: string
  breadcrumbs?: BreadcrumbItem[]
}>()
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-app-page-header {
  margin-bottom: $kui-space-70;

  :deep(.k-breadcrumbs) {
    margin-bottom: $kui-space-0;
  }
}

.page-header-title-section {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-80;
  justify-content: space-between;

  @media (min-width: $kui-breakpoint-phablet) {
    flex-wrap: nowrap;
  }
}

.page-header-title-wrapper {
  align-items: baseline;
  display: flex;
  min-width: 0;

  .page-header-title-before {
    align-self: center;
    display: inline-flex;
    margin-right: $kui-space-40;
  }

  .page-header-title-after {
    margin-left: $kui-space-60;
  }
}

.page-header-title {
  color: $kui-color-text;
  font-size: $kui-font-size-70;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-60;
  margin: $kui-space-0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-header-actions {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.page-header-description {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  margin: $kui-space-40 $kui-space-0 $kui-space-0;

  :deep(a) {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.page-header-section-below {
  margin-top: $kui-space-40;
}
</style>
