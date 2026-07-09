<template>
  <div
    class="metricscard"
    :class="cardSize"
  >
    <div
      class="metricscard-title"
      :class="cardSize"
    >
      <component
        :is="icon"
        v-if="icon && cardSize !== 'sm'"
        class="metricscard-icon"
        :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
        :size="KUI_ICON_SIZE_30"
      />
      <span>{{ title }}</span>
    </div>
    <div class="metricscard-valuetrend">
      <div
        class="metricscard-value"
        :class="cardSize"
        data-testid="metric-value"
      >
        {{ metricValue }}
      </div>
      <div
        v-if="cardSize === 'md' || cardSize === 'lg'"
        class="metricscard-trend"
      >
        <div
          class="metricscard-trend-change"
          :class="trendClass"
          data-testid="metric-trend-parent"
        >
          <component
            :is="trendIcon"
            v-if="trendIcon"
            :color="trendIconColor"
            :size="KUI_ICON_SIZE_30"
          />
          <EqualIcon
            v-else
            :color="`var(--kui-color-text-neutral-strong, ${KUI_COLOR_TEXT_NEUTRAL_STRONG})`"
            :size="KUI_ICON_SIZE_30"
          />
          <div data-testid="metric-trend-change">
            {{ metricChange }}
          </div>
        </div>
        <div
          v-if="trendRange"
          class="metricscard-trend-range"
        >
          {{ trendRange }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import {
  KUI_COLOR_TEXT_DANGER_STRONG,
  KUI_COLOR_TEXT_SUCCESS,
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_COLOR_TEXT_NEUTRAL_STRONG,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import { EqualIcon } from '@kong/icons'
import type { MetricCardSize } from './MetricCardContainer.vue'

const props = withDefaults(defineProps<{
  /** Card title label */
  title: string
  /** Icon component displayed before the title */
  icon?: Component
  /** Formatted metric value (e.g. "1.2M", "99.9%", "42ms") */
  metricValue: string
  /** Formatted trend change (e.g. "12.5%") */
  metricChange?: string
  /**
   * Change polarity: 1 = positive (green), -1 = negative (red), 0 = neutral (grey).
   * Use negative polarity for metrics where increase is bad (e.g. error rate, latency).
   */
  changePolarity?: number
  /** Trend icon component (e.g. TrendUpIcon, TrendDownIcon). Omit for neutral/equal. */
  trendIcon?: Component
  /** Trend comparison text (e.g. "vs previous 7 days") */
  trendRange?: string
  /** Size variant */
  cardSize?: MetricCardSize
}>(), {
  metricChange: '',
  changePolarity: 0,
  trendRange: '',
  cardSize: 'lg',
})

const trendClass = computed(() => {
  if (props.changePolarity > 0) return 'positive'
  if (props.changePolarity < 0) return 'negative'
  return 'neutral'
})

const trendIconColor = computed(() => {
  if (props.changePolarity > 0) return `var(--kui-color-text-success, ${KUI_COLOR_TEXT_SUCCESS})`
  if (props.changePolarity < 0) return `var(--kui-color-text-danger-strong, ${KUI_COLOR_TEXT_DANGER_STRONG})`
  return `var(--kui-color-text-neutral-strong, ${KUI_COLOR_TEXT_NEUTRAL_STRONG})`
})
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

.metricscard {
  display: flex;
  flex-direction: column;
  width: 100%;

  @media (max-width: ($kui-breakpoint-phablet - 1px)) {
    max-width: none;
    width: auto;
  }

  @media (min-width: $kui-breakpoint-phablet) {
    height: 100%;
    justify-content: space-evenly;
  }

  &-title {
    align-items: center;
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    flex-direction: row;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin: var(--kui-space-0, $kui-space-0);

    &.sm {
      color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }

    &.md,
    &.lg {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    }
  }

  &-icon {
    margin-right: var(--kui-space-20, $kui-space-20);
  }

  &-valuetrend {
    display: flex;
    flex-direction: column;
    row-gap: var(--kui-space-50, $kui-space-50);

    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      row-gap: var(--kui-space-30, $kui-space-30);
    }
  }

  &-value {
    color: var(--kui-color-text, $kui-color-text);
    display: flex;
    flex-direction: row;
    font-size: var(--kui-font-size-70, $kui-font-size-70);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    justify-content: space-between;
    line-height: var(--kui-line-height-60, $kui-line-height-60);

    &.sm {
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
    }

    &.xl {
      font-size: var(--kui-font-size-100, $kui-font-size-100);
    }
  }

  &-trend {
    align-items: center;
    column-gap: var(--kui-space-40, $kui-space-40);
    display: flex;

    &-change {
      align-items: center;
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      display: flex;
      flex-direction: row;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      padding: var(--kui-space-20, $kui-space-20)
        var(--kui-space-40, $kui-space-40);

      .kui-icon {
        margin-right: var(--kui-space-20, $kui-space-20);
      }

      &.positive {
        background-color: var(--kui-color-background-success-weakest, $kui-color-background-success-weakest);
        color: var(--kui-color-text-success, $kui-color-text-success);
      }

      &.negative {
        background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
        color: var(--kui-color-text-danger-strong, $kui-color-text-danger-strong);
      }

      &.neutral {
        background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
        color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
      }
    }

    &-range {
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
    }
  }
}
</style>
