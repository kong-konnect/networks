<template>
  <div class="config-card-display">
    <div
      v-for="(collection, index) in propertyCollections"
      :key="index"
      class="config-card-collection"
    >
      <h3
        v-if="collection.title"
        class="collection-title"
      >
        {{ collection.title }}
      </h3>
      <div class="collection-items">
        <ConfigCardItem
          v-for="item in collection.items"
          :key="item.key"
          :item="item"
          :truncated="truncated"
        >
          <!-- Pass through named slots for individual items -->
          <template
            v-if="$slots[item.key]"
            #[item.key]="slotProps"
          >
            <slot :name="item.key" v-bind="slotProps" />
          </template>
          <template
            v-if="$slots[`${item.key}-label`]"
            #[`${item.key}-label`]
          >
            <slot :name="`${item.key}-label`" />
          </template>
        </ConfigCardItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ConfigCardItem from './ConfigCardItem.vue'
import type { ConfigCardItemData } from './ConfigCardItem.vue'

export interface PropertyCollection {
  title?: string
  items: ConfigCardItemData[]
}

withDefaults(defineProps<{
  propertyCollections: PropertyCollection[]
  truncated?: boolean
}>(), {
  truncated: false,
})
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.config-card-display {
  .config-card-collection {
    &:not(:first-child) {
      margin-top: $kui-space-80;
    }

    .collection-title {
      color: $kui-color-text;
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-30;
      margin-bottom: $kui-space-40;
      margin-top: $kui-space-0;
    }

    .collection-items {
      border-top: $kui-border-width-10 solid $kui-color-border;
    }
  }
}
</style>
