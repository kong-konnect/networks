<template>
  <aside class="wizard-summary">
    <div class="wizard-summary-card">
      <h3 class="wizard-summary-title">{{ title }}</h3>
      <dl class="wizard-summary-rows">
        <template
          v-for="row in rows"
          :key="row.label"
        >
          <div class="wizard-summary-row">
            <dt class="wizard-summary-label">{{ row.label }}</dt>
            <dd class="wizard-summary-value">
              <KBadge
                v-if="row.badge"
                :appearance="row.badgeAppearance || 'neutral'"
              >
                {{ row.value }}
              </KBadge>
              <span
                v-else
                :class="{ 'wizard-summary-placeholder': !row.value }"
              >
                {{ row.value || row.placeholder || '—' }}
              </span>
            </dd>
          </div>
        </template>
      </dl>
      <slot />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { KBadge } from '@kong/kongponents'

export interface WizardSummaryRow {
  label: string
  value?: string
  placeholder?: string
  badge?: boolean
  badgeAppearance?: string
}

defineProps<{
  title: string
  rows: WizardSummaryRow[]
}>()
</script>

<style scoped lang="scss">
.wizard-summary {
  flex: 0 0 auto;
  width: 300px;
}

.wizard-summary-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-70;
  position: sticky;
  top: $kui-space-70;
}

.wizard-summary-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
  margin: $kui-space-0 $kui-space-0 $kui-space-60;
}

.wizard-summary-rows {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  margin: $kui-space-0;
}

.wizard-summary-row {
  align-items: baseline;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.wizard-summary-label {
  color: $kui-color-text-neutral;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
}

.wizard-summary-value {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-medium;
  margin: $kui-space-0;
  text-align: right;
  word-break: break-word;
}

.wizard-summary-placeholder {
  color: $kui-color-text-neutral-weak;
  font-weight: $kui-font-weight-regular;
}
</style>
