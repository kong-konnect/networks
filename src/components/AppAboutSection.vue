<template>
  <KCard
    class="kong-ui-app-about-section"
    title-tag="h2"
  >
    <template #title>
      <span v-if="$slots.title || title" class="about-section-title">
        <slot name="title">{{ title }}</slot>
      </span>
    </template>

    <template #actions>
      <div
        v-if="$slots.actions || created || modified"
        class="about-section-header-end"
      >
        <div
          v-if="created || modified"
          class="about-section-timestamps"
          :class="{ 'has-actions': $slots.actions }"
        >
          <span v-if="created" class="about-section-timestamps-created">
            {{ createdLabel }}: {{ created }}
          </span>
          <span
            v-if="created && displayModified"
            class="about-section-timestamps-arrow"
          >
            →
          </span>
          <span v-if="displayModified" class="about-section-timestamps-modified">
            {{ modifiedLabel }}: {{ modified }}
          </span>
        </div>
        <div v-if="$slots.actions" class="about-section-actions">
          <slot name="actions" />
        </div>
      </div>
    </template>

    <!-- Loading state -->
    <template v-if="isLoading">
      <KSkeletonBox height="2" width="100" />
      <KSkeletonBox height="2" width="100" />
    </template>

    <!-- Content -->
    <template v-else>
      <p v-if="description" class="about-section-description">
        {{ description }}
      </p>
      <div v-if="$slots.default" class="about-section-content">
        <slot />
      </div>
      <template v-if="$slots['divider-section']">
        <hr>
        <div class="about-divider-section">
          <slot name="divider-section" />
        </div>
      </template>
    </template>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KCard, KSkeletonBox } from '@kong/kongponents'

const props = withDefaults(defineProps<{
  /** Card title */
  title?: string
  /** Description text shown below title */
  description?: string
  /** Created date string */
  created?: string
  /** Label for created date */
  createdLabel?: string
  /** Modified date string */
  modified?: string
  /** Label for modified date */
  modifiedLabel?: string
  /** Show loading skeleton */
  isLoading?: boolean
}>(), {
  title: '',
  description: '',
  created: '',
  createdLabel: 'Created',
  modified: '',
  modifiedLabel: 'Modified',
  isLoading: false,
})

const displayModified = computed(() => !!props.modified && props.modified !== props.created)
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

.about-section-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-30;
}

.about-section-header-end {
  display: flex;
}

.about-section-timestamps {
  align-items: center;
  align-self: center;
  color: $kui-color-text-neutral;
  display: flex;
  flex-direction: column;
  font-size: $kui-font-size-20;
  line-height: $kui-line-height-20;
  margin-bottom: $kui-space-50;

  @media (min-width: $kui-breakpoint-phablet) {
    flex-direction: row;
    margin-bottom: $kui-space-0;
  }

  &.has-actions {
    margin-right: $kui-space-60;
  }

  .about-section-timestamps-arrow {
    line-height: $kui-line-height-30;
    margin-left: $kui-space-40;
    margin-right: $kui-space-40;
  }
}

.about-section-description {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  margin-bottom: $kui-space-70;
  margin-top: $kui-space-0;
}

.about-section-content {
  align-items: flex-start;
  align-self: stretch;
  color: $kui-color-text-neutral;
  column-gap: $kui-space-70;
  display: flex;
  flex-wrap: wrap;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  padding: $kui-space-0;
  row-gap: $kui-space-30;
}

.about-divider-section {
  color: $kui-color-text-neutral;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  row-gap: $kui-space-50;
}

:deep(hr),
hr {
  background-color: $kui-color-background-disabled;
  border: none;
  height: 1px;
  margin: $kui-space-0;
  width: 100%;
}

hr {
  margin-bottom: $kui-space-50;
  margin-top: $kui-space-50;
}
</style>

<!-- Unscoped overrides for KCard internals (matches production) -->
<style lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-app-about-section.kong-card.border {
  border-radius: $kui-border-radius-20;
  padding: $kui-space-70;

  .k-card-header {
    align-items: baseline;
    margin-bottom: $kui-space-0 !important;

    @media (max-width: $kui-breakpoint-phablet) {
      flex-direction: column;

      .k-card-actions {
        margin-left: unset;
      }
    }
  }
}
</style>
