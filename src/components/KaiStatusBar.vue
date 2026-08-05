<template>
  <section class="kai-status" :class="`kai-status--${severity}`" data-testid="kai-status">
    <!-- Collapsed: one-line page status -->
    <div class="kai-status-bar">
      <span class="kai-status-pill" :class="`kai-status-pill--${severity}`">
        <component :is="severityIcon" :size="KUI_ICON_SIZE_20" decorative />
        {{ severityLabel }}
      </span>
      <span class="kai-status-summary">
        <strong v-if="countLabel">{{ countLabel }}</strong>
        {{ oneLiner }}
      </span>
      <span class="kai-status-meta">
        <span class="kai-status-time">{{ timeLabel }}</span>
        <button
          type="button"
          class="kai-status-toggle"
          data-testid="kai-status-toggle"
          @click="expanded = !expanded"
        >
          <SparklesIcon class="kai-status-spark" :size="KUI_ICON_SIZE_20" decorative />
          {{ expanded ? 'View less' : 'View more' }}
          <component :is="expanded ? ChevronUpIcon : ChevronDownIcon" :size="KUI_ICON_SIZE_20" decorative />
        </button>
      </span>
    </div>

    <!-- Expanded: full insights + suggested actions -->
    <div v-if="expanded" class="kai-status-detail">
      <p
        v-for="(ins, i) in insights"
        :key="i"
        class="kai-status-insight"
      >
        <strong v-if="ins.lead">{{ ins.lead }}</strong>{{ ins.lead ? ' ' : '' }}{{ ins.text }}
      </p>
      <div v-if="actions.length" class="kai-status-actions">
        <button
          v-for="a in actions"
          :key="a.key"
          type="button"
          class="kai-status-chip"
          :data-testid="`kai-action-${a.key}`"
          @click="$emit('action', a.key)"
        >
          {{ a.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import {
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  WarningIcon,
  InfoIcon,
  CheckCircleIcon,
} from '@kong/icons'

export interface KaiInsight { text: string; lead?: string }
export interface KaiAction { key: string; label: string }
type Severity = 'critical' | 'warning' | 'healthy' | 'info'

const props = withDefaults(defineProps<{
  severity: Severity
  oneLiner: string
  countLabel?: string
  insights?: KaiInsight[]
  actions?: KaiAction[]
  timeLabel?: string
  startExpanded?: boolean
}>(), {
  countLabel: '',
  insights: () => [],
  actions: () => [],
  timeLabel: 'just now',
  startExpanded: false,
})

defineEmits<{ (e: 'action', key: string): void }>()

const expanded = ref(props.startExpanded)

const severityLabel = computed(() => ({
  critical: 'Critical',
  warning: 'Needs attention',
  healthy: 'Healthy',
  info: 'KAi',
}[props.severity]))

const severityIcon = computed(() => ({
  critical: WarningIcon,
  warning: WarningIcon,
  healthy: CheckCircleIcon,
  info: SparklesIcon,
}[props.severity]))
</script>

<style scoped lang="scss">
// Thin, dynamic KAi page-status bar (mirrors the Observability summary pattern):
// severity · summary · timestamp · View more. Expands in place; never a big box.
.kai-status {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-40 $kui-space-50;

  &--critical { border-color: $kui-color-border-danger-weak; }
}

.kai-status-bar {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.kai-status-pill {
  align-items: center;
  border-radius: $kui-border-radius-20;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-20 $kui-space-40;

  &--critical { background-color: $kui-color-background-danger-weakest; color: $kui-color-text-danger; }
  &--warning { background-color: $kui-color-background-warning-weakest; color: $kui-color-text-warning; }
  &--healthy { background-color: $kui-color-background-success-weakest; color: $kui-color-text-success; }
  &--info { background-color: $kui-color-background-decorative-purple-weakest; color: $kui-color-text-decorative-purple; }
}

.kai-status-summary {
  color: $kui-color-text;
  flex: 1;
  font-size: $kui-font-size-30;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong { font-weight: $kui-font-weight-semibold; margin-right: $kui-space-20; }
}

.kai-status-meta {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: $kui-space-50;
}

.kai-status-time {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  white-space: nowrap;
}

.kai-status-toggle {
  align-items: center;
  background: none;
  border: none;
  color: $kui-color-text-decorative-purple;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-0;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
}

.kai-status-detail {
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  margin-top: $kui-space-40;
  padding-top: $kui-space-40;
}

.kai-status-insight {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;

  strong { font-weight: $kui-font-weight-semibold; }
}

.kai-status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;
  margin-top: $kui-space-20;
}

.kai-status-chip {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text;
  cursor: pointer;
  font-size: $kui-font-size-30;
  padding: $kui-space-30 $kui-space-50;

  &:hover { border-color: $kui-color-border-decorative-purple; color: $kui-color-text-decorative-purple; }
}
</style>
