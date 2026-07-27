<template>
  <!--
    Two layout modes — toggled from the AccountDropdown in either Navbar.
    Selection persists in localStorage via useNavVersion().

    NEW (default): full-width top Navbar + light Sidebar below it.
    LEGACY: dark Sidebar with embedded logo + light Navbar to its right.
  -->
  <div v-if="isNewNav" class="kong-ui-app-layout new-nav">
    <Navbar />
    <Sidebar />
    <main class="kong-ui-app-layout-main" data-testid="kong-ui-app-layout-main">
      <div class="kong-ui-app-layout-content">
        <div class="kong-ui-app-layout-content-inner">
          <slot name="default" />
        </div>
      </div>
    </main>
  </div>

  <div v-else class="kong-ui-app-layout legacy-nav">
    <LegacyNavbar :left-offset="240" />
    <LegacySidebar />
    <main class="kong-ui-app-layout-main" data-testid="kong-ui-app-layout-main">
      <div class="kong-ui-app-layout-content">
        <div class="kong-ui-app-layout-content-inner">
          <slot name="default" />
        </div>
      </div>
    </main>
  </div>

  <!-- Prototype-only Day 1 / Day n state device (floating tab, top-center) -->
  <DayModeSwitcher />
  <!-- Prototype-only connectivity-view compare device (stacked below Day 1 / Day n) -->
  <VariantSwitcher />
</template>

<script setup lang="ts">
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'
import LegacyNavbar from './LegacyNavbar.vue'
import LegacySidebar from './LegacySidebar.vue'
import DayModeSwitcher from './DayModeSwitcher.vue'
import VariantSwitcher from './VariantSwitcher.vue'
import { useNavVersion } from '@/composables'

const { isNewNav } = useNavVersion()
</script>

<style lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

// Production base styles (from app-layout/_base.scss) — apply to both nav versions
html, body {
  height: 100%;
  height: 100vh;
  margin: $kui-space-0;
  overflow: hidden;
  overscroll-behavior-y: none;
  padding: $kui-space-0;
  width: 100%;
}

body {
  background-color: $kui-color-background;
  color: $kui-color-text;
  font-family: $kui-font-family-text;
  font-size: $kui-font-size-40;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-weight: $kui-font-weight-regular;
  line-height: $kui-line-height-40;
}

#app {
  height: 100%;
}
</style>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

$navbar-height: 60px;
$sidebar-width-new: 192px;
$sidebar-width-legacy: 240px;

.kong-ui-app-layout {
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-family: $kui-font-family-text;
  height: 100%;
  left: 0;
  overflow: hidden;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;

  .kong-ui-app-layout-main {
    align-items: stretch;
    background-color: $kui-color-background;
    color: $kui-color-text;
    display: flex;
    flex-grow: 1;
    height: 100%;
    margin-top: #{$navbar-height};
    overflow: auto;
    position: relative;
    width: 100%;

    .kong-ui-app-layout-content {
      position: relative;
      width: 100%;

      &-inner {
        padding: var(--kong-ui-app-layout-content-padding-top, $kui-space-70) var(--kong-ui-app-layout-content-padding-x, $kui-space-70) var(--kong-ui-app-layout-content-padding-bottom, $kui-space-130);

        // Mirrors `removeContentInnerPadding` from production app-layout:
        // PageLayout brings its own padding, so when it's the rendered child,
        // drop the outer content padding to let it span edge-to-edge.
        &:has(.kong-ui-public-page-layout) {
          padding: $kui-space-0;
        }
      }
    }
  }

  // ── New nav: page bg shows behind the lighter sidebar ──
  &.new-nav {
    background: $kui-color-background-neutral-weakest;

    .kong-ui-app-layout-main {
      margin-left: $sidebar-width-new;
      width: calc(100% - #{$sidebar-width-new});
    }
  }

  // ── Legacy nav: dark sidebar carries the inverse bg ──
  &.legacy-nav {
    background: $kui-color-background-inverse;

    .kong-ui-app-layout-main {
      box-shadow: var(--kong-ui-app-layout-main-box-shadow, -30px 174px 250px #0023db);
      margin-left: $sidebar-width-legacy;
      width: calc(100% - #{$sidebar-width-legacy});
      border-top-left-radius: $kui-border-radius-20;
    }
  }
}
</style>
