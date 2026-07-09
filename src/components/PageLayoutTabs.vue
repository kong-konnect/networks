<template>
  <!--
    Shim for the production PageLayoutTabs.
    Source: public-ui-components/packages/core/page-layout/src/components/PageLayoutTabs.vue

    Style notes (kept verbatim from production):
      - Each tab is `padding: $kui-space-30 $kui-space-0` so its underline runs
        the width of the label, not the row.
      - Active tab uses 2px primary-color bottom border. Hover uses neutral-weak.
      - The list margin-bottom is calc(-1 * border-width-10) so the active
        tab's border overlaps the row's bottom border (no gap).

    The production component has runtime overflow detection that moves
    overflowing tabs into a "More" dropdown. We omit that here — designers
    don't need overflow handling for prototype demos. If your design relies on
    overflow, port the `computeTabLayoutOverflow` logic from production.
  -->
  <nav class="page-layout-tabs" data-testid="page-layout-tabs">
    <ul>
      <li
        v-for="tab in tabs"
        :key="`${tab.key}-tab`"
      >
        <component
          :is="typeof tab.to === 'string' ? 'a' : 'router-link'"
          :aria-current="tab.active ? 'page' : undefined"
          class="tab-link"
          :class="{ active: tab.active }"
          :data-testid="tab.dataTestId ?? `page-layout-tab-${tab.key}`"
          :href="typeof tab.to === 'string' ? tab.to : undefined"
          tabindex="0"
          :to="typeof tab.to === 'string' ? undefined : tab.to"
          @click.prevent="onTabNavigation(tab)"
          @keydown.enter.prevent="onTabNavigation(tab)"
          @keydown.space.prevent="onTabNavigation(tab)"
        >
          {{ tab.label }}
        </component>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

export interface PageLayoutTab {
  key: string
  label: string
  to: RouteLocationRaw | string
  active?: boolean
  dataTestId?: string
}

defineProps<{
  tabs: PageLayoutTab[]
}>()

const router = useRouter()

const onTabNavigation = (tab: PageLayoutTab): void => {
  if (typeof tab.to !== 'string') {
    router.push(tab.to)
    return
  }
  window.location.href = tab.to
}
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

$tabs-navbar-height: 34px;
$tabs-horizontal-padding: $kui-space-60;

.page-layout-tabs {
  align-items: flex-end;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  box-sizing: border-box;
  display: flex;
  height: $tabs-navbar-height;
  overflow-x: clip;
  padding: $kui-space-0 $tabs-horizontal-padding;
  position: relative;
  width: 100%;

  a {
    background-color: $kui-color-background-transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    outline: none;
    padding: $kui-space-0;
    text-decoration: none;
  }

  ul {
    display: flex;
    gap: $kui-space-70;
    list-style: none;
    margin: $kui-space-0;
    /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
    margin-bottom: calc(-1 * #{$kui-border-width-10}); // overlap row bottom border
    max-width: 100%;
    padding: $kui-space-0;

    li {
      display: flex;

      .tab-link {
        align-items: center;
        border-bottom: $kui-border-width-20 solid $kui-color-border-transparent;
        border-radius: $kui-border-radius-20 $kui-border-radius-20 $kui-border-radius-0 $kui-border-radius-0;
        color: $kui-color-text-neutral-strong;
        cursor: pointer;
        display: flex;
        font-size: $kui-font-size-20;
        font-weight: $kui-font-weight-medium;
        gap: $kui-space-30;
        line-height: $kui-line-height-30;
        padding: $kui-space-30 $kui-space-0;
        transition: color 0.2s ease-in, border-color 0.2s ease-in, font-weight 0.2s ease-in;
        white-space: nowrap;

        &:hover {
          border-bottom: $kui-border-width-20 solid $kui-color-border-neutral-weak;
          color: $kui-color-text;
        }

        &:focus-visible {
          box-shadow: $kui-shadow-focus;
        }

        &.active {
          border-bottom: $kui-border-width-20 solid $kui-color-border-primary;
          color: $kui-color-text-primary !important;
          font-weight: $kui-font-weight-semibold;
        }
      }
    }
  }
}
</style>
