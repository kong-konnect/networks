<template>
  <!--
    Shim for `@kong-ui-public/page-layout`.

    Matches production: PageLayout.vue + PageLayoutTabs.vue
    (public-ui-components/packages/core/page-layout/src/components/).

    Renders:
      header
        page-header-container
          page-header-start (breadcrumbs + back button + title + title-after slot)
          page-header-actions-container (actions slot)
        PageLayoutTabs (when `tabs` is non-empty)
      content
        <router-view> when there are tabs (each tab is a route)
        <slot name="default" /> otherwise

    Border-bottom on the header is owned by PageLayoutTabs when tabs exist,
    or by page-header-container otherwise — matching production exactly.
  -->
  <div class="kong-ui-public-page-layout" data-testid="kong-ui-public-page-layout">
    <div
      class="page-layout-header"
      :class="{ 'no-tabs': !hasTabs }"
      data-testid="page-layout-header"
    >
      <div class="page-header-container">
        <div class="page-header-start">
          <KBreadcrumbs
            v-if="breadcrumbs && breadcrumbs.length"
            class="header-breadcrumbs"
            data-testid="page-layout-breadcrumbs"
            item-max-width="25ch"
            :items="breadcrumbs"
          />
          <div class="title-container">
            <component
              :is="isBackToString ? 'a' : 'router-link'"
              v-if="backTo"
              aria-label="Go back"
              class="navigate-back"
              data-testid="page-layout-navigate-back"
              :href="isBackToString ? (backTo as string) : undefined"
              tabindex="0"
              :to="isBackToString ? undefined : backTo"
              @click.prevent="navigateBack"
              @keydown.enter.prevent="navigateBack"
              @keydown.space.prevent="navigateBack"
            >
              <ArrowTopLeftIcon decorative :size="KUI_ICON_SIZE_30" />
            </component>
            <h1
              v-if="title"
              class="page-layout-title"
              data-testid="page-layout-title"
            >
              {{ title }}
            </h1>
            <div
              v-if="$slots['title-after']"
              class="title-after-container"
            >
              <slot name="title-after" />
            </div>
          </div>
        </div>

        <div
          v-if="!!$slots.actions"
          class="page-header-actions-container"
        >
          <slot name="actions" />
        </div>
      </div>

      <PageLayoutTabs
        v-if="hasTabs"
        :tabs="tabs"
      />
    </div>

    <div class="page-layout-content">
      <router-view v-if="hasTabs" />
      <slot v-else name="default" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import type { BreadcrumbItem } from '@kong/kongponents'
import { KBreadcrumbs } from '@kong/kongponents'
import { ArrowTopLeftIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import PageLayoutTabs from './PageLayoutTabs.vue'
import type { PageLayoutTab } from './PageLayoutTabs.vue'

export type { PageLayoutTab }

const props = withDefaults(defineProps<{
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  backTo?: RouteLocationRaw | string
  tabs?: PageLayoutTab[]
}>(), {
  breadcrumbs: () => [],
  tabs: () => [],
})

defineSlots<{
  default(): any
  actions(): any
  'title-after'(): any
}>()

const router = useRouter()

const hasTabs = computed(() => !!(props.tabs && props.tabs.length))
const isBackToString = computed(() => typeof props.backTo === 'string')

const navigateBack = (): void => {
  if (!props.backTo) return
  if (typeof props.backTo === 'object') {
    router.push(props.backTo)
    return
  }
  window.location.href = props.backTo
}
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

.kong-ui-public-page-layout {
  box-sizing: border-box;
  font-family: $kui-font-family-text;

  .page-layout-header {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;

    .page-header-container {
      align-items: flex-end;
      display: flex;
      gap: $kui-space-30;
      justify-content: space-between;
      padding: $kui-space-60 $kui-space-60 $kui-space-0 $kui-space-60;

      .page-header-start {
        .header-breadcrumbs {
          :deep(.breadcrumbs-item-container) {
            // Override first breadcrumb padding left
            &:first-child {
              .breadcrumbs-item {
                padding-left: $kui-space-0;
              }
            }

            .breadcrumbs-item.active .breadcrumbs-text {
              color: $kui-color-text-neutral;
            }
          }
        }

        .title-container {
          align-items: flex-end;
          display: flex;
          gap: $kui-space-20;

          .navigate-back {
            background-color: $kui-color-background-transparent;
            border: none;
            border-radius: $kui-border-radius-20;
            color: $kui-color-text-neutral;
            cursor: pointer;
            outline: none;
            padding: $kui-space-20;
            transition: background-color 0.2s ease-in, color 0.2s ease-in;

            &:hover { color: $kui-color-text; }
            &:focus-visible { box-shadow: $kui-shadow-focus; }
          }

          .page-layout-title {
            color: $kui-color-text;
            font-size: $kui-font-size-50;
            font-weight: $kui-font-weight-semibold;
            line-height: $kui-line-height-40;
            margin: $kui-space-0;
          }

          .title-after-container {
            align-items: flex-end;
            display: flex;
            gap: $kui-space-30;
            padding-left: $kui-space-20;
          }
        }
      }

      .page-header-actions-container {
        align-items: center;
        display: flex;
        gap: $kui-space-30;
      }
    }

    // No tabs: header carries its own bottom border + bottom padding.
    //
    // Production (PageLayout.vue) uses `:not(:has(.page-layout-tabs))` here.
    // We use a JS-driven class instead because `:has()` in scoped Vue CSS is
    // unreliable across parent/child component boundaries — `.page-layout-tabs`
    // is the root of a child component, and the data-v hash hoisting makes the
    // selector match inconsistently. The .no-tabs class is set in PageLayout.vue
    // when `hasTabs` is false (single source of truth: the `tabs` prop).
    &.no-tabs {
      .page-header-container {
        border-bottom: $kui-border-width-10 solid $kui-color-border;
        padding: $kui-space-60;
      }
    }
  }

  .page-layout-content {
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    padding: $kui-space-60;
  }
}
</style>
