<template>
  <div
    class="kong-ui-entity-base-form"
    :data-testid="`form-${entityType}`"
  >
    <!-- Loading state -->
    <div v-if="isLoading" class="form-loading-container">
      <KSkeleton
        :delay-milliseconds="200"
        type="form"
      />
    </div>

    <!-- Error state (fetch error) -->
    <KEmptyState
      v-else-if="hasError"
      action-button-text="Go back"
      icon-variant="error"
      :message="fetchErrorMessage"
      title="Failed to load data"
      @click-action="emit('cancel')"
    />

    <!-- Form content -->
    <form
      v-else
      :data-testid="`form-${entityType}-content`"
      @submit.prevent="emit('submit')"
    >
      <slot />

      <!-- Form-level error alert -->
      <KAlert
        v-if="errorMessage"
        appearance="danger"
        class="form-error-alert"
        :message="errorMessage"
      />

      <!-- Form actions -->
      <div
        v-if="!hideActions"
        class="form-actions"
        :data-testid="`form-${entityType}-actions`"
      >
        <slot name="form-actions">
          <KButton
            appearance="tertiary"
            :data-testid="`form-${entityType}-cancel`"
            @click="emit('cancel')"
          >
            {{ cancelButtonText }}
          </KButton>
          <KButton
            appearance="primary"
            :data-testid="`form-${entityType}-submit`"
            :disabled="!canSubmit"
            type="submit"
          >
            {{ computedSaveText }}
          </KButton>
        </slot>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KButton, KAlert, KEmptyState, KSkeleton } from '@kong/kongponents'

const props = withDefaults(defineProps<{
  /** Whether the form is in edit mode */
  isEditing?: boolean
  /** Show loading skeleton */
  isLoading?: boolean
  /** Show error empty state */
  hasError?: boolean
  /** Error message from fetch failure */
  fetchErrorMessage?: string
  /** Form-level error message (shown as alert after submit) */
  errorMessage?: string
  /** Whether the form can be submitted */
  canSubmit?: boolean
  /** Whether the form is read-only */
  isReadonly?: boolean
  /** Entity type for data-testid attributes */
  entityType?: string
  /** Custom save button text */
  saveButtonText?: string
  /** Custom cancel button text */
  cancelButtonText?: string
  /** Hide the action buttons */
  hideActions?: boolean
}>(), {
  isEditing: false,
  isLoading: false,
  hasError: false,
  fetchErrorMessage: 'An error occurred while loading the data.',
  errorMessage: '',
  canSubmit: true,
  isReadonly: false,
  entityType: 'entity',
  saveButtonText: '',
  cancelButtonText: 'Cancel',
  hideActions: false,
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const computedSaveText = computed(() => {
  if (props.saveButtonText) return props.saveButtonText
  return props.isEditing ? 'Save' : 'Create'
})
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-entity-base-form {
  .form-loading-container {
    padding: $kui-space-80;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: $kui-space-80;
  }

  .form-error-alert {
    margin-top: $kui-space-0;
  }

  .form-actions {
    border-top: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    gap: $kui-space-40;
    justify-content: flex-end;
    margin-top: $kui-space-0;
    padding-top: $kui-space-80;
  }
}
</style>
