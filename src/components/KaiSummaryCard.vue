<template>
  <section class="kai-card" data-testid="kai-summary-card">
    <!-- Loading -->
    <div v-if="loading" class="kai-loading" data-testid="kai-loading">
      <div class="kai-head-row">
        <SparklesIcon class="kai-spark" :size="KUI_ICON_SIZE_30" decorative />
        <span class="kai-title">Summarizing insights for you…</span>
      </div>
      <div class="kai-skeleton kai-skeleton--1" />
      <div class="kai-skeleton kai-skeleton--2" />
      <div class="kai-skeleton kai-skeleton--3" />
    </div>

    <!-- Result -->
    <div v-else class="kai-result">
      <SparklesIcon class="kai-spark" :size="KUI_ICON_SIZE_30" decorative />
      <div class="kai-main">
        <div class="kai-titlerow">
          <span class="kai-title">{{ title }}</span>
          <span class="kai-time">{{ timeLabel }}</span>
          <span class="kai-head-divider" />
          <button
            type="button"
            class="kai-icon-btn"
            :aria-label="collapsed ? 'Expand' : 'Collapse'"
            data-testid="kai-collapse"
            @click="collapsed = !collapsed"
          >
            <component :is="collapsed ? ChevronDownIcon : ChevronUpIcon" :size="KUI_ICON_SIZE_20" decorative />
          </button>
          <button
            type="button"
            class="kai-icon-btn"
            aria-label="Dismiss"
            data-testid="kai-close"
            @click="$emit('close')"
          >
            <CloseIcon :size="KUI_ICON_SIZE_20" decorative />
          </button>
        </div>

        <!-- Collapsed → one line -->
        <p v-if="collapsed" class="kai-oneliner">{{ oneLiner }}</p>

        <!-- Expanded → full insights + actions + feedback -->
        <template v-else>
          <div class="kai-insights">
          <p
            v-for="(ins, i) in insights"
            :key="i"
            class="kai-insight"
            :class="{ 'kai-insight--critical': ins.tone === 'critical' }"
          >
            <strong v-if="ins.lead">{{ ins.lead }}</strong>{{ ins.lead ? ' ' : '' }}{{ ins.text }}
          </p>
        </div>

        <div class="kai-footer">
          <div v-if="actions.length" class="kai-actions">
            <span class="kai-try">Try</span>
            <button
              v-for="a in actions"
              :key="a.key"
              type="button"
              class="kai-chip"
              :data-testid="`kai-action-${a.key}`"
              @click="$emit('action', a.key)"
            >
              <RedoIcon class="kai-chip-icon" :size="KUI_ICON_SIZE_20" decorative />
              {{ a.label }}
            </button>
          </div>

          <div class="kai-feedback">
            <button
              type="button"
              class="kai-icon-btn"
              :class="{ 'kai-icon-btn--on': feedback === 'up' }"
              aria-label="Helpful"
              @click="setFeedback('up')"
            >
              <ThumbUpIcon :size="KUI_ICON_SIZE_20" decorative />
            </button>
            <button
              type="button"
              class="kai-icon-btn"
              :class="{ 'kai-icon-btn--on': feedback === 'down' }"
              aria-label="Not helpful"
              @click="setFeedback('down')"
            >
              <ThumbDownIcon :size="KUI_ICON_SIZE_20" decorative />
            </button>
            <button
              type="button"
              class="kai-icon-btn"
              aria-label="Copy"
              data-testid="kai-copy"
              @click="copy"
            >
              <CopyIcon :size="KUI_ICON_SIZE_20" decorative />
            </button>
          </div>
        </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import {
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CloseIcon,
  RedoIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  CopyIcon,
} from '@kong/icons'

export interface KaiInsight {
  text: string
  lead?: string
  tone?: 'critical' | 'default'
}
export interface KaiAction {
  key: string
  label: string
}

const props = withDefaults(defineProps<{
  title: string
  insights?: KaiInsight[]
  actions?: KaiAction[]
  oneLiner?: string
  loading?: boolean
  timeLabel?: string
  initialCollapsed?: boolean
}>(), {
  insights: () => [],
  actions: () => [],
  oneLiner: '',
  loading: false,
  timeLabel: 'just now',
  initialCollapsed: false,
})

defineEmits<{
  (e: 'action', key: string): void
  (e: 'close'): void
}>()

const collapsed = ref(props.initialCollapsed)
const feedback = ref<'up' | 'down' | null>(null)
const setFeedback = (v: 'up' | 'down') => { feedback.value = feedback.value === v ? null : v }

const copy = () => {
  const text = `${props.title}\n\n${props.insights.map(i => `${i.lead ? i.lead + ' ' : ''}${i.text}`).join('\n')}`
  navigator.clipboard?.writeText(text).catch(() => {})
}
</script>

<style scoped lang="scss">
// AI surface: subtle purple accent so it reads as KAi, not product chrome.
.kai-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border-decorative-purple;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-60 $kui-space-70;
}

.kai-head-row {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

// Result layout: icon on the left; title + copy stack to its right and align to
// each other (copy sits under the title, not floated to the card edge).
.kai-result {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-40;
}
.kai-main { flex: 1 1 auto; min-width: 0; }
.kai-titlerow {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.kai-spark {
  color: $kui-color-text-decorative-purple;
  flex: 0 0 auto;
}

.kai-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.kai-time {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin-left: auto;
}

.kai-head-divider {
  align-self: stretch;
  background-color: $kui-color-border;
  flex: 0 0 auto;
  margin: $kui-space-0 $kui-space-20;
  width: $kui-border-width-10;
}

.kai-icon-btn {
  align-items: center;
  background: none;
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: inline-flex;
  padding: $kui-space-20;

  &:hover { background-color: $kui-color-background-neutral-weakest; color: $kui-color-text; }
  &--on { color: $kui-color-text-decorative-purple; }
}

// Loading
.kai-loading { display: flex; flex-direction: column; gap: $kui-space-40; }

.kai-skeleton {
  background: linear-gradient(90deg, $kui-color-background-neutral-weakest 25%, $kui-color-background-neutral-weaker 50%, $kui-color-background-neutral-weakest 75%);
  background-size: 200% 100%;
  border-radius: $kui-border-radius-20;
  height: 10px;
  margin-top: $kui-space-20;
  animation: kai-shimmer 1.2s ease-in-out infinite;

  &--1 { width: 92%; }
  &--2 { width: 64%; }
  &--3 { width: 78%; }
}

@keyframes kai-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

// Result
.kai-insights {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  margin-top: $kui-space-50;
}

.kai-insight {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;

  strong { font-weight: $kui-font-weight-semibold; }
  &--critical strong { color: $kui-color-text-danger; }
}

.kai-oneliner {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-20 $kui-space-0 $kui-space-0;
}

.kai-footer {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-50;
  justify-content: space-between;
  margin-top: $kui-space-60;
}

.kai-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;
}

.kai-try {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.kai-chip {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-30;
  padding: $kui-space-30 $kui-space-50;

  &:hover { border-color: $kui-color-border-decorative-purple; color: $kui-color-text-decorative-purple; }
}

.kai-chip-icon { color: $kui-color-text-neutral; transform: scaleX(-1); }

.kai-feedback {
  display: flex;
  gap: $kui-space-20;
}
</style>
