<template>
  <aside class="kong-ui-app-sidebar">
    <div class="sidebar-header">
      <div class="sidebar-header-logo">
        <a
          aria-label="Kong Konnect"
          href="/"
          class="sidebar-header-link"
        >
          <GruceLogo />
          <div class="konnect-logo">
            <KonnectLogoText />
          </div>
        </a>
      </div>
    </div>

    <div class="sidebar-content-container">
      <nav aria-label="Main menu">
        <!-- Ungrouped: Overview -->
        <ul class="level-primary top-items">
          <li class="sidebar-item-primary" :class="{ active: route.name === 'home' }">
            <router-link :to="{ name: 'home' }" custom v-slot="{ navigate, href }">
              <a :href="href" @click="navigate" class="sidebar-item-link">
                <div class="sidebar-item-display">
                  <div class="sidebar-item-icon">
                    <OverviewIcon decorative :size="KUI_ICON_SIZE_40" />
                  </div>
                  <div class="sidebar-item-name-container">
                    <div class="sidebar-item-name truncate-text truncate-17">Overview</div>
                  </div>
                </div>
              </a>
            </router-link>
          </li>
        </ul>

        <!-- Connectivity Group -->
        <div class="level-primary-group-collapse-trigger">
          <div
            id="level-primary-group-connectivity"
            class="level-primary-group-name"
          >
            Connectivity
          </div>
        </div>
        <ul class="level-primary top-items">
          <!--
            API Gateway — expandable primary item with secondary nav.
            This is the PATTERN TO COPY when adding your own expandable section:
            1. :class="{ active: isXActive, expanded: isXExpanded }" on the <li>
            2. router-link with custom v-slot on the <a>
            3. .has-label on .sidebar-item-display when expanded (shows subtitle)
            4. v-if="isXExpanded" on the secondary <ul>
            5. :class="{ active: route.name === '...' }" on each secondary <li>
          -->
          <li class="sidebar-item-primary" :class="{ active: isAPIGatewayActive, expanded: isAPIGatewayExpanded }">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display" :class="{ 'has-label': isAPIGatewayExpanded }">
                <div class="sidebar-item-icon">
                  <RuntimesIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">API Gateway</div>
                  <div v-if="isAPIGatewayExpanded" class="sidebar-item-label truncate-text truncate-18">
                    {{ apiGatewayControlPlaneName }}
                  </div>
                </div>
              </div>
            </a>

            <!-- API Gateway Secondary Nav -->
            <ul v-if="isAPIGatewayExpanded" class="level-secondary">
              <li class="sidebar-item-secondary active">
                <a class="sidebar-item-link">
                  <div class="sidebar-item-display">
                    <div class="sidebar-item-name-container">
                      <div class="sidebar-item-name truncate-text truncate-18">Services</div>
                    </div>
                  </div>
                </a>
              </li>
              <li class="sidebar-item-secondary">
                <a class="sidebar-item-link">
                  <div class="sidebar-item-display">
                    <div class="sidebar-item-name-container">
                      <div class="sidebar-item-name truncate-text truncate-18">Routes</div>
                    </div>
                  </div>
                </a>
              </li>
              <li class="sidebar-item-secondary">
                <a class="sidebar-item-link">
                  <div class="sidebar-item-display">
                    <div class="sidebar-item-name-container">
                      <div class="sidebar-item-name truncate-text truncate-18">Plugins</div>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <EventGradientIcon decorative :size="KUI_ICON_SIZE_40" class="monochrome-icon" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Event Gateway</div>
                </div>
              </div>
            </a>
          </li>

          <!--
            AI Gateway — ADD YOUR FEATURE HERE
            Copy this pattern for your own expandable nav section.
            Wire up: isYourFeatureActive, isYourFeatureExpanded, selectedName computeds.
            Add router-links on the <a> tags and secondary items as needed.
          -->
          <li class="sidebar-item-primary" :class="{ active: isAiGatewayActive, expanded: isAiGatewayExpanded }">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display" :class="{ 'has-label': isAiGatewayExpanded }">
                <div class="sidebar-item-icon">
                  <BotIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">AI Gateway</div>
                  <div v-if="isAiGatewayExpanded" class="sidebar-item-label truncate-text truncate-18">
                    {{ aiGatewayName }}
                  </div>
                </div>
              </div>
            </a>

            <!-- AI Gateway Secondary Nav — add items here -->
            <ul v-if="isAiGatewayExpanded" class="level-secondary">
              <li class="sidebar-item-secondary active">
                <a class="sidebar-item-link">
                  <div class="sidebar-item-display">
                    <div class="sidebar-item-name-container">
                      <div class="sidebar-item-name truncate-text truncate-18">Overview</div>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <MeshIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Service Mesh</div>
                </div>
              </div>
            </a>
          </li>
        </ul>

        <!-- Applications Group -->
        <div class="level-primary-group-collapse-trigger">
          <div
            id="level-primary-group-applications"
            class="level-primary-group-name"
          >
            Applications
          </div>
        </div>
        <ul class="level-primary top-items">
          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <ServiceHubIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Catalog</div>
                </div>
              </div>
            </a>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <DevPortalIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Portals</div>
                </div>
              </div>
            </a>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <ConnectionsIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">API Products</div>
                </div>
              </div>
            </a>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <BarChartIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Observability</div>
                </div>
              </div>
            </a>
          </li>

          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <KeyIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Identity</div>
                </div>
              </div>
            </a>
          </li>
        </ul>

        <!-- Divider between top and bottom items -->
        <div
          class="sidebar-level-divider"
          role="separator"
        />

        <!-- Bottom Items (ungrouped) -->
        <ul class="level-primary bottom-items">
          <li class="sidebar-item-primary">
            <a class="sidebar-item-link">
              <div class="sidebar-item-display">
                <div class="sidebar-item-icon">
                  <PeopleIcon decorative :size="KUI_ICON_SIZE_40" />
                </div>
                <div class="sidebar-item-name-container">
                  <div class="sidebar-item-name truncate-text truncate-17">Organization</div>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Sidebar Footer: Org Switcher + Geo Switcher -->
    <div class="sidebar-footer">
      <div class="sidebar-footer-content">
        <!-- Organization Switcher -->
        <div class="organization-switcher is-full-width">
          <a
            class="organization-switcher-global-trigger"
            href="#"
            role="button"
          >
            <div class="organization-avatar">
              K
            </div>
            <div class="organization-name">
              Kong Design
            </div>
            <UnfoldMoreIcon
              decorative
              :size="16"
            />
          </a>
        </div>

        <!-- Geo Switcher -->
        <div class="geo-switcher is-full-width">
          <a
            class="geo-switcher-global-trigger"
            href="#"
            role="button"
          >
            <div class="global-selected-item-label">
              <FlagUsIcon decorative :size="20" />
              <div class="global-selected-item-name">US (North America)</div>
            </div>
            <UnfoldMoreIcon
              decorative
              :size="16"
            />
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  RuntimesIcon,
  BotIcon,
  MeshIcon,
  OverviewIcon,
  EventGradientIcon,
  ServiceHubIcon,
  DevPortalIcon,
  ConnectionsIcon,
  BarChartIcon,
  KeyIcon,
  PeopleIcon,
  UnfoldMoreIcon,
  FlagUsIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import GruceLogo from './GruceLogo.vue'
import KonnectLogoText from './KonnectLogoText.vue'

const route = useRoute()

// ── API Gateway nav state (placeholder — wire up when building API Gateway pages) ──
const isAPIGatewayActive = computed(() => false)
const isAPIGatewayExpanded = computed(() => false)
const apiGatewayControlPlaneName = ref('')

// ── AI Gateway nav state (placeholder — wire up when building AI Gateway pages) ──
const isAiGatewayActive = computed(() => false)
const isAiGatewayExpanded = computed(() => false)
const aiGatewayName = ref('')

// ── ADD YOUR FEATURE NAV STATE HERE ──
// Pattern for expandable sidebar sections:
//
// const isYourFeatureActive = computed(() => {
//   return ['your-feature-list', 'your-feature-details', 'your-feature-create'].includes(route.name as string)
// })
//
// const isYourFeatureExpanded = computed(() => {
//   // Expanded = inside a specific entity (details, edit, sub-pages)
//   return ['your-feature-details', 'your-feature-edit', 'your-feature-sub-page'].includes(route.name as string)
// })
//
// const selectedYourFeatureName = computed(() => {
//   const id = route.params.id as string
//   return store.getItemById(id)?.name || ''
// })
</script>

<!-- Unscoped styles matching production SidebarItem.vue -->
<style lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

// Production sidebar variables
$sidebar-width: 240px;
$sidebar-header-spacing: $kui-space-40;
$sidebar-item-font-size: $kui-font-size-30;
$sidebar-item-border-radius: $kui-border-radius-30;

// Scope with wrapper class instead of using `scoped` so styles apply to child components
.kong-ui-app-sidebar {
  // Shared styles for primary and secondary elements
  .level-primary,
  .level-secondary {
    list-style: none;
    margin: $kui-space-0;
    padding: $kui-space-0;
  }

  .level-primary {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin-bottom: $kui-space-60;
    padding: $kui-space-0 $kui-space-10 $kui-space-0 $kui-space-50;
    width: 100%;
  }

  .level-primary-group-name {
    color: $kui-navigation-color-text;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-medium;
    line-height: $kui-line-height-40;
    text-transform: uppercase;
    user-select: none;
  }

  .level-primary-group-collapse-trigger {
    margin-bottom: $kui-space-40;
    margin-left: $kui-space-50;
    padding: $kui-space-0 calc($kui-space-50 + $kui-space-40) $kui-space-0 $kui-space-40;
  }

  // Shared styles for primary and secondary items
  .sidebar-item-primary,
  .sidebar-item-secondary {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    white-space: nowrap;

    &:last-of-type {
      margin-bottom: $kui-space-0;
    }

    a.sidebar-item-link {
      align-items: center;
      color: $kui-navigation-color-text;
      cursor: pointer;
      display: flex;
      font-size: $sidebar-item-font-size;
      font-weight: $kui-font-weight-medium;
      justify-content: space-between;
      line-height: $kui-line-height-30;
      min-height: 48px;
      text-decoration: none;
      transition: color .2s ease-out;

      svg {
        &:not(.profile-icon) path {
          color: currentColor;
          fill: currentColor;
          transition: all .2s ease-out;
        }
      }

      &:hover,
      &:focus-visible {
        color: $kui-navigation-color-text-hover !important;

        svg {
          color: $kui-navigation-color-text-hover;
        }
      }

      &:focus-visible {
        box-shadow: $kui-navigation-shadow-focus;
        outline: none;
      }
    }

    &.active > a,
    &.active > div > a,
    &.expanded > a,
    &.expanded > div > a {
      color: $kui-navigation-color-text-selected;

      &.sidebar-item-link,
      &.sidebar-item-link:hover {
        color: $kui-navigation-color-text-selected !important;

        svg {
          color: $kui-navigation-color-text-selected;
        }
      }

      .sidebar-item-name {
        font-weight: $kui-font-weight-medium !important;
      }
    }

    ul.level-secondary {
      padding: $kui-space-0;
      position: relative;

      &:before {
        /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
        background-color: $kui-navigation-color-border;
        content: '';
        height: 1px;
        left: 1px;
        position: absolute;
        right: 1px;
        top: 0;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

// Production sidebar variables
$sidebar-width: 240px;
$sidebar-header-spacing: $kui-space-40;
$sidebar-item-font-size: $kui-font-size-30;
$sidebar-item-border-radius: $kui-border-radius-30;
$navbar-height: 60px;

// Scrollbar
$scrollbar-width: 8px;
$scrollbar-foreground-color: $kui-color-background-neutral;
$scrollbar-background-color: $kui-color-background-transparent;

.kong-ui-app-sidebar {
  background: $kui-color-background-inverse;
  display: flex;
  flex-direction: column;
  height: 100%;
  left: 0;
  position: fixed;
  top: 0;
  width: $sidebar-width;
  z-index: 3;

  .sidebar-header {
    align-items: center;
    background: var(--kong-ui-app-sidebar-header-background, $kui-color-background-transparent);
    color: $kui-color-text-inverse;
    display: flex;
    left: 0;
    min-height: #{$navbar-height};
    padding: $kui-space-0 $kui-space-60 $kui-space-0 $kui-space-90;
    position: absolute;
    right: 0;
    top: 0;
    user-select: none;
    z-index: 1;

    // Production: sidebar-header-logo wraps the <a> tag
    .sidebar-header-logo {
      align-items: center;
      display: flex;
      min-height: 60px;
      width: 100%;
    }

    .sidebar-header-link {
      align-items: center;
      display: flex;
      text-decoration: none;

      &:focus-visible {
        box-shadow: $kui-navigation-shadow-focus;
        outline: none;
      }

      .konnect-logo {
        display: flex;
        padding-left: $kui-space-60;
      }
    }

    &:after {
      background-image: linear-gradient($kui-color-background-inverse, transparent);
      bottom: 0;
      content: '';
      display: block;
      height: $sidebar-header-spacing;
      left: 50%;
      margin-bottom: -$sidebar-header-spacing;
      position: absolute;
      transform: translateX(-50%);
      width: calc(100% - 16px);
      z-index: 1;
    }
  }

  .sidebar-content-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: #{$navbar-height};
    overflow-x: hidden;
    overflow-y: scroll;
    padding-right: $kui-space-40;
    padding-top: $sidebar-header-spacing;
    position: relative;
    width: 100%;

    // Only some browsers support `overflow: overlay`
    @supports(overflow: overlay) {
      /* stylelint-disable-next-line declaration-property-value-keyword-no-deprecated */
      overflow-y: overlay;
    }

    // Scrollbar base
    &::-webkit-scrollbar {
      height: $scrollbar-width;
      opacity: 1;
      width: $scrollbar-width;
    }

    &::-webkit-scrollbar-thumb {
      background: $kui-color-background-transparent;
      border-radius: $kui-border-radius-40;
    }

    &::-webkit-scrollbar-track {
      background: $kui-color-background-transparent;
    }

    scrollbar-color: $kui-color-background-transparent $kui-color-background-transparent;
    scrollbar-gutter: stable;
    scrollbar-width: thin;

    // Only show scrollbar when hovering
    &:hover {
      &::-webkit-scrollbar-thumb {
        background: $scrollbar-foreground-color;
      }

      &::-webkit-scrollbar-track {
        background: $scrollbar-background-color;
      }

      scrollbar-color: $scrollbar-foreground-color $scrollbar-background-color;
    }

    nav {
      box-sizing: border-box;
      width: 100%;
    }
  }
}

// Primary-level nav item
.sidebar-item-primary {
  overflow: hidden;

  &.active,
  &.expanded {
    background-color: $kui-navigation-color-background-selected;
    border-radius: $sidebar-item-border-radius;
    box-shadow: $kui-navigation-shadow-border;
  }

  > a,
  > div > a {
    border-radius: $sidebar-item-border-radius;
  }

  &.expanded {
    > a,
    > div > a {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}

// Secondary-level nav item
.sidebar-item-secondary {
  margin-bottom: $kui-space-20;

  &:last-of-type {
    margin-bottom: $kui-space-0;

    a {
      border-bottom-right-radius: $sidebar-item-border-radius;
    }
  }

  a {
    background-color: $kui-color-background-transparent;
    color: $kui-navigation-color-text !important;
    font-size: $sidebar-item-font-size;
    line-height: $kui-line-height-30;
    min-height: 40px !important;
    transition: all .1s ease-in-out !important;
  }

  &.active > a {
    box-shadow: $kui-navigation-shadow-border-child;
    color: $kui-navigation-color-text-selected !important;
    font-weight: $kui-font-weight-medium !important;

    &:focus-visible {
      box-shadow: $kui-navigation-shadow-border-child, $kui-navigation-shadow-focus;
    }
  }
}

.sidebar-item-display {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  height: 100%;
  padding: $kui-space-0 $kui-space-60;
  width: 100%;

  &.has-label {
    padding-bottom: $kui-space-50;
    padding-top: $kui-space-50;
  }

  .sidebar-item-name-container {
    line-height: $kui-line-height-20;
    user-select: none;

    .truncate-text {
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.truncate-17 {
        max-width: 17ch;
      }

      &.truncate-18 {
        max-width: 18ch;
      }
    }

    .sidebar-item-name {
      align-items: center;
      display: flex;
    }
  }

  .sidebar-item-label {
    color: $kui-navigation-color-text;
    font-size: $kui-font-size-20;
    margin-top: $kui-space-20;
  }

  .sidebar-item-icon {
    align-items: center;
    display: flex;
    line-height: 0;
  }

  .sidebar-item-after {
    display: flex;
    margin-left: auto;
  }
}

// Divider between top and bottom items — matches production AppSidebar.vue
.sidebar-level-divider {
  /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
  background-color: $kui-navigation-color-border-divider;
  height: 1px;
  margin: $kui-space-80 auto;
  min-height: 1px;
  width: calc(100% - 32px);
}

// Sidebar Footer — matches production AppSidebar.vue + KonnectAppShell.vue
.sidebar-footer {
  align-items: center;
  color: $kui-color-text-neutral-weak;
  display: flex;
  font-weight: $kui-font-weight-medium;
  position: relative;
  width: 100%;

  &:before {
    background-image: linear-gradient(transparent, $kui-color-background-inverse);
    content: '';
    display: block;
    height: $sidebar-header-spacing;
    left: 50%;
    margin-top: -$sidebar-header-spacing;
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    width: calc(100% - 16px);
    z-index: 1;
  }
}

.sidebar-footer-content {
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: $kui-space-0 $kui-space-40;
  width: 100%;
}

// Organization Switcher — matches production OrganizationSwitcher.vue
.organization-switcher {
  display: flex;
  justify-content: flex-end;

  &.is-full-width {
    margin-bottom: 8px;
    min-width: 0;
    width: 100%;
  }

  a.organization-switcher-global-trigger {
    align-items: center;
    background-color: $kui-color-background-inverse;
    border-radius: $sidebar-item-border-radius;
    color: $kui-navigation-color-text;
    cursor: pointer;
    display: flex;
    font-size: $sidebar-item-font-size;
    font-weight: $kui-font-weight-medium;
    height: 44px;
    justify-content: space-between;
    max-width: 100%;
    padding: $kui-space-0 $kui-space-60;
    text-decoration: none;
    transition: background-color .2s ease-in-out;
    user-select: none;
    white-space: nowrap;
    width: 100%;

    &:hover {
      color: $kui-navigation-color-text-hover;
    }

    &:focus-visible {
      box-shadow: $kui-navigation-shadow-focus;
      color: $kui-navigation-color-text-focus;
      outline: none;
    }

    .organization-avatar {
      align-items: center;
      background-color: $kui-color-background-primary-weaker;
      border-radius: $sidebar-item-border-radius;
      color: $kui-color-text;
      display: flex;
      font-size: $sidebar-item-font-size;
      font-weight: $kui-font-weight-semibold;
      height: 20px;
      justify-content: center;
      line-height: $kui-line-height-30;
      min-height: 20px;
      min-width: 20px;
      text-transform: uppercase;
      width: 20px;
    }

    .organization-name {
      margin-left: $kui-space-60;
      margin-right: auto;
      max-width: 122px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// Geo Switcher — matches production GeoSwitcher.vue
.geo-switcher {
  display: flex;
  justify-content: flex-end;

  &.is-full-width {
    margin-bottom: $kui-space-40;
    min-width: 0;
    width: 100%;
  }

  a.geo-switcher-global-trigger {
    align-items: center;
    background-color: $kui-color-background-inverse;
    border-radius: $sidebar-item-border-radius;
    color: $kui-navigation-color-text;
    cursor: pointer;
    display: flex;
    flex-grow: 1;
    font-size: $sidebar-item-font-size;
    font-weight: $kui-font-weight-medium;
    height: 44px;
    justify-content: space-between;
    max-width: 100%;
    padding: $kui-space-0 $kui-space-60;
    position: relative;
    text-decoration: none;
    transition: all .2s ease-in-out;
    user-select: none;
    white-space: nowrap;

    &:hover {
      color: $kui-navigation-color-text-hover;
    }

    &:focus-visible {
      box-shadow: $kui-navigation-shadow-focus;
      color: $kui-navigation-color-text-focus;
      outline: none;
    }

    .global-selected-item-label {
      align-items: center;
      display: flex;
      gap: $kui-space-60;

      .global-selected-item-name {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

// Icon color override for gradient icons
:deep(.monochrome-icon) {
  path {
    fill: currentColor !important;
  }
}
</style>
