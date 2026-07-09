<template>
  <div
    class="config-card-item"
    :data-testid="item.key"
  >
    <div class="config-card-item-label">
      <slot :name="`${item.key}-label`">
        <span class="label-text">{{ item.label }}</span>
        <KTooltip
          v-if="item.tooltip"
          :text="item.tooltip"
        >
          <InfoIcon
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="KUI_ICON_SIZE_30"
            decorative
          />
        </KTooltip>
      </slot>
    </div>
    <div class="config-card-item-value">
      <slot :name="item.key" :row="item">
        <!-- Badge status type -->
        <KBadge
          v-if="item.type === 'badge-status'"
          :appearance="getBadgeAppearance(item.value)"
        >
          {{ item.value }}
        </KBadge>

        <!-- Badge tag type -->
        <KBadge
          v-else-if="item.type === 'badge-tag'"
          appearance="neutral"
        >
          {{ item.value }}
        </KBadge>

        <!-- Date type -->
        <span v-else-if="item.type === 'date'" class="date-text">
          {{ formatDate(item.value) }}
        </span>

        <!-- Copy type (e.g. IDs) -->
        <span v-else-if="item.type === 'copy'" class="copy-text">
          {{ truncated ? truncateText(item.value) : item.value }}
        </span>

        <!-- Default: plain text -->
        <span v-else :class="{ 'truncated': truncated }">
          {{ item.value ?? '–' }}
        </span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import { InfoIcon } from '@kong/icons'
import { KBadge, KTooltip } from '@kong/kongponents'

export interface ConfigCardItemData {
  key: string
  label: string
  value?: any
  tooltip?: string
  type?: 'plain' | 'badge-status' | 'badge-tag' | 'date' | 'copy'
}

withDefaults(defineProps<{
  item: ConfigCardItemData
  truncated?: boolean
}>(), {
  truncated: false,
})

const getBadgeAppearance = (value: string): string => {
  const lower = (value || '').toLowerCase()
  if (['active', 'enabled', 'connected', 'healthy', 'running'].includes(lower)) return 'success'
  if (['inactive', 'disabled', 'disconnected', 'stopped'].includes(lower)) return 'neutral'
  if (['error', 'failed', 'unhealthy', 'critical'].includes(lower)) return 'danger'
  if (['warning', 'degraded', 'pending'].includes(lower)) return 'warning'
  return 'info'
}

const formatDate = (value: any): string => {
  if (!value) return '–'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

const truncateText = (value: any): string => {
  const str = String(value || '')
  if (str.length <= 20) return str
  return `${str.slice(0, 8)}...${str.slice(-8)}`
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.config-card-item {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-60;
  padding: $kui-space-50 0;

  &:not(:last-child) {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }

  .config-card-item-label {
    align-items: center;
    color: $kui-color-text-neutral;
    display: flex;
    flex-shrink: 0;
    font-size: $kui-font-size-30;
    gap: $kui-space-30;
    line-height: $kui-line-height-30;
    width: 200px;

    .label-text {
      font-weight: $kui-font-weight-semibold;
    }
  }

  .config-card-item-value {
    color: $kui-color-text;
    flex: 1;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-30;
    min-width: 0;

    .date-text {
      color: $kui-color-text-neutral-stronger;
    }

    .copy-text {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-20;
    }

    .truncated {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
