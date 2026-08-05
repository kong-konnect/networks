<template>
  <footer class="wizard-footer">
    <div class="wizard-footer-main">
      <slot />
    </div>
    <div v-if="$slots.aux" class="wizard-footer-aux">
      <slot name="aux" />
    </div>
  </footer>
</template>

<script setup lang="ts">
// One footer for every create/setup flow. Consumers put the primary (filled) button
// first, then Back/Cancel/Exit as SECONDARY (bordered) buttons, in the default slot.
// The optional #aux slot holds a utility action (e.g. "View configuration"), pushed right.
</script>

<style scoped lang="scss">
.wizard-footer {
  align-items: center;
  background-color: $kui-color-background;
  border-top: $kui-border-width-10 solid $kui-color-border;
  bottom: $kui-space-0;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
  padding: $kui-space-60 $kui-space-0;
  position: sticky;
}

.wizard-footer-main {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.wizard-footer-aux {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}
</style>
