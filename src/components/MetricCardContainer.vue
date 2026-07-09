<template>
  <div
    class="kong-ui-public-metric-card-container"
    :class="cardSize"
  >
    <div
      v-if="containerTitle || containerDescription"
      class="container-title"
    >
      {{ containerTitle }}
      <div
        v-if="containerDescription"
        class="container-description"
      >
        {{ containerDescription }}
      </div>
    </div>
    <div class="cards-wrapper">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
export type MetricCardSize = 'sm' | 'md' | 'lg' | 'xl'

withDefaults(defineProps<{
  /** Size variant for all cards */
  cardSize?: MetricCardSize
  /** Optional title above the cards row */
  containerTitle?: string
  /** Optional description beside the title */
  containerDescription?: string
}>(), {
  cardSize: 'lg',
  containerTitle: '',
  containerDescription: '',
})
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-public-metric-card-container {
  background-color: var(--kui-color-background-transparent, transparent);
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  width: 100%;

  .container-title {
    align-items: center;
    display: flex;
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    justify-content: space-between;
    margin-bottom: var(--kui-space-50, $kui-space-50);

    .container-description {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    }
  }

  .cards-wrapper {
    column-gap: 24px;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    row-gap: 16px;

    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      column-gap: 16px;
      flex-direction: column;
      row-gap: 16px;
    }

    @media (min-width: ($kui-breakpoint-phablet - 1px)) {
      > :not(:last-of-type) {
        border-right: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      }
    }
  }

  &.sm {
    column-gap: 0;
    row-gap: 0;
  }
}
</style>
