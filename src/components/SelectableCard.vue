<template>
  <label
    class="selectable-card"
    :class="{ selected: modelValue === value, disabled }"
    :data-testid="dataTestid"
  >
    <input
      class="selectable-card-input"
      type="radio"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      :name="name"
      @change="$emit('update:modelValue', value)"
    >
    <span class="selectable-card-body">
      <span class="selectable-card-title">
        <slot name="title">{{ title }}</slot>
      </span>
      <span
        v-if="description || $slots.description"
        class="selectable-card-description"
      >
        <slot name="description">{{ description }}</slot>
      </span>
      <span
        v-if="$slots.meta"
        class="selectable-card-meta"
      >
        <slot name="meta" />
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  value: string
  name: string
  title?: string
  description?: string
  disabled?: boolean
  dataTestid?: string
}>()

defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<style scoped lang="scss">
.selectable-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: pointer;
  display: block;
  padding: $kui-space-70;
  position: relative;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &:hover:not(.disabled) {
    border-color: $kui-color-border-primary-weak;
  }

  &.selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 1px $kui-color-border-primary;

    .selectable-card-title { color: $kui-color-text-primary; }
  }

  &.disabled {
    background-color: $kui-color-background-neutral-weakest;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

// Native radio hidden — the whole card is the control (Konnect data-source pattern).
.selectable-card-input {
  height: 0;
  opacity: 0;
  position: absolute;
  width: 0;
}

.selectable-card-body {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.selectable-card-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-30;
}

.selectable-card-description {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
}

.selectable-card-meta {
  color: $kui-color-text-neutral-strong;
  display: flex;
  flex-wrap: wrap;
  font-size: $kui-font-size-20;
  gap: $kui-space-40;
  margin-top: $kui-space-20;
}
</style>
