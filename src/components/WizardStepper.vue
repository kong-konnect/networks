<template>
  <div class="wizard-stepper">
    <template
      v-for="(label, i) in labels"
      :key="i"
    >
      <div
        class="step"
        :class="`step--${stepState(i)}`"
      >
        <span class="step-circle">
          <CheckIcon
            v-if="i < current"
            :size="KUI_ICON_SIZE_30"
            decorative
          />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="step-label">{{ label }}</span>
      </div>
      <div
        v-if="i < labels.length - 1"
        class="step-line"
        :class="{ 'step-line--done': i < current }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

const props = defineProps<{
  labels: string[]
  current: number
}>()

const stepState = (i: number) =>
  i < props.current ? 'completed' : i === props.current ? 'active' : 'default'
</script>

<style scoped lang="scss">
.wizard-stepper {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-80;
}

.step {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: $kui-space-40;
}

.step-circle {
  align-items: center;
  border-radius: $kui-border-radius-circle;
  display: flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  height: $kui-icon-size-50;
  justify-content: center;
  width: $kui-icon-size-50;
}

.step-label {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  white-space: nowrap;
}

// Completed + active: filled primary circle
.step--completed .step-circle,
.step--active .step-circle {
  background-color: $kui-color-background-primary;
  color: $kui-color-text-inverse;
}

.step--completed .step-circle {
  background-color: $kui-color-background-neutral;
}

// Upcoming: outlined neutral circle + muted label
.step--default {
  .step-circle {
    background-color: $kui-color-background;
    border: $kui-border-width-10 solid $kui-color-border;
    color: $kui-color-text-neutral;
  }

  .step-label {
    color: $kui-color-text-neutral;
  }
}

// Connector line between steps
.step-line {
  background-color: $kui-color-border;
  flex: 1 1 auto;
  height: $kui-border-width-10;
  min-width: $kui-space-70;

  &--done {
    background-color: $kui-color-background-primary;
  }
}
</style>
