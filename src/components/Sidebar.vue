<template>
  <aside class="kong-ui-app-sidebar" data-testid="kong-ui-app-sidebar">
    <div class="sidebar-content-container">
      <nav aria-label="Main menu">
        <!-- Ungrouped: Search + Home — matches production GlobalAppSidebarItems.ungrouped-items-container -->
        <div class="ungrouped-items-container">
          <a class="sidebar-item" href="#" role="button">
            <SearchIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
            <span class="sidebar-item-label">Search</span>
            <span class="sidebar-item-shortcut">⌘K</span>
          </a>

          <router-link
            v-slot="{ navigate, href }"
            custom
            :to="{ name: 'home' }"
          >
            <a
              class="sidebar-item"
              :class="{ active: isHomeActive }"
              :href="href"
              @click="navigate"
            >
              <HomeIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
              <span class="sidebar-item-label">Overview</span>
            </a>
          </router-link>
        </div>

        <!-- Connectivity group -->
        <div class="sidebar-items-group" data-testid="sidebar-group-connectivity">
          <span class="sidebar-items-group-label">Connectivity</span>
          <ul class="sidebar-items-list">
            <!--
              Expandable item — matches production GlobalAppSidebarItems pattern:
              <details><summary>(primary)</summary><ul>(children)</ul></details>
              `open` is bound to a local expanded state which auto-opens when a child is active.
            -->
            <li>
              <details
                class="sidebar-item-details"
                :open="isApiGatewayExpanded"
                @toggle="(e: ToggleEvent) => onToggleExpanded('api-gateway', (e.target as HTMLDetailsElement).open)"
              >
                <summary
                  class="sidebar-item"
                  :class="{ active: !isApiGatewayExpanded && isApiGatewayActive }"
                >
                  <RouteIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">API Gateway</span>
                  <ChevronRightIcon
                    class="sidebar-item-chevron-icon"
                    :class="{ expanded: isApiGatewayExpanded }"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                </summary>

                <ul class="sidebar-item-details-list">
                  <li>
                    <a class="sidebar-item" href="#" :class="{ active: route.name === 'api-gateway-list' }">
                      <span class="sidebar-item-label">Gateways</span>
                    </a>
                  </li>
                  <li>
                    <router-link
                      :to="{ name: 'gateway-create' }"
                      custom
                      v-slot="{ navigate, href, isActive }"
                    >
                      <a
                        class="sidebar-item"
                        :href="href"
                        :class="{ active: isActive }"
                        @click="navigate"
                      >
                        <span class="sidebar-item-label">Create gateway</span>
                      </a>
                    </router-link>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#" :class="{ active: route.name === 'api-gateway-consumers' }">
                      <span class="sidebar-item-label">Consumers</span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <!-- Networks — single direct link (no sub-nav) -->
            <li>
              <router-link v-slot="{ navigate, href }" custom :to="{ name: 'networks-list' }">
                <a
                  class="sidebar-item"
                  :class="{ active: isNetworksActive }"
                  :href="href"
                  @click="navigate"
                >
                  <ConnectionsIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">Networks</span>
                </a>
              </router-link>
            </li>

            <!-- Direct link (no children) — matches production "L1 without children" branch -->
            <li>
              <a class="sidebar-item" href="#">
                <SyncAltIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                <span class="sidebar-item-label">Event Gateway</span>
              </a>
            </li>

            <li>
              <a class="sidebar-item" href="#">
                <BotIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                <span class="sidebar-item-label">AI Gateway</span>
              </a>
            </li>

            <li>
              <a class="sidebar-item" href="#">
                <DeviceHubIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                <span class="sidebar-item-label">Service Mesh</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Applications group -->
        <div class="sidebar-items-group" data-testid="sidebar-group-applications">
          <span class="sidebar-items-group-label">Applications</span>
          <ul class="sidebar-items-list">
            <li>
              <details
                class="sidebar-item-details"
                :open="isCatalogExpanded"
                @toggle="(e: ToggleEvent) => onToggleExpanded('catalog', (e.target as HTMLDetailsElement).open)"
              >
                <summary class="sidebar-item">
                  <LibraryBooksOutlineIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">Catalog</span>
                  <ChevronRightIcon
                    class="sidebar-item-chevron-icon"
                    :class="{ expanded: isCatalogExpanded }"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                </summary>

                <ul class="sidebar-item-details-list">
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">APIs</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Services</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">MCP Registries</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Integrations</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Scorecards</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Resources</span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details
                class="sidebar-item-details"
                :open="isDevPortalExpanded"
                @toggle="(e: ToggleEvent) => onToggleExpanded('dev-portal', (e.target as HTMLDetailsElement).open)"
              >
                <summary class="sidebar-item">
                  <WebIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">Dev Portal</span>
                  <ChevronRightIcon
                    class="sidebar-item-chevron-icon"
                    :class="{ expanded: isDevPortalExpanded }"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                </summary>

                <ul class="sidebar-item-details-list">
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Portals</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Application Auth</span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <a class="sidebar-item" href="#">
                <ConnectionsIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                <span class="sidebar-item-label">API Products</span>
              </a>
            </li>

            <li>
              <details
                class="sidebar-item-details"
                :open="isMeteringBillingExpanded"
                @toggle="(e: ToggleEvent) => onToggleExpanded('metering-billing', (e.target as HTMLDetailsElement).open)"
              >
                <summary class="sidebar-item">
                  <MoneyIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">Metering &amp; Billing</span>
                  <ChevronRightIcon
                    class="sidebar-item-chevron-icon"
                    :class="{ expanded: isMeteringBillingExpanded }"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                </summary>

                <ul class="sidebar-item-details-list">
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Metering</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Product Catalog</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Billing</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Cost Analytics</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Settings</span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <details
                class="sidebar-item-details"
                :open="isObservabilityExpanded"
                @toggle="(e: ToggleEvent) => onToggleExpanded('observability', (e.target as HTMLDetailsElement).open)"
              >
                <summary class="sidebar-item">
                  <BarChartIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                  <span class="sidebar-item-label">Observability</span>
                  <ChevronRightIcon
                    class="sidebar-item-chevron-icon"
                    :class="{ expanded: isObservabilityExpanded }"
                    decorative
                    :size="KUI_ICON_SIZE_40"
                  />
                </summary>

                <ul class="sidebar-item-details-list">
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Summary</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Dashboards</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Explorer</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Reports</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Requests</span>
                    </a>
                  </li>
                  <li>
                    <a class="sidebar-item" href="#">
                      <span class="sidebar-item-label">Debugger</span>
                    </a>
                  </li>
                </ul>
              </details>
            </li>

            <li>
              <a class="sidebar-item" href="#">
                <KeyIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
                <span class="sidebar-item-label">Identity</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <div class="sidebar-footer">
      <button class="collapse-btn" aria-label="Collapse sidebar" type="button">
        <PanelCloseLeftIcon decorative :size="KUI_ICON_SIZE_30" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  SearchIcon,
  HomeIcon,
  RouteIcon,
  SyncAltIcon,
  BotIcon,
  DeviceHubIcon,
  LibraryBooksOutlineIcon,
  WebIcon,
  ConnectionsIcon,
  MoneyIcon,
  BarChartIcon,
  KeyIcon,
  ChevronRightIcon,
  PanelCloseLeftIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'

const route = useRoute()

// ── Active checks for direct + expandable items ──
//
// Active highlight rule (matches production "longest-prefix-match"):
//   the primary item highlights when the route matches it OR any of its children.
//   When an expandable item is open, only the active child highlights — not the parent.

const isHomeActive = computed(() => route.name === 'home')

// Example: API Gateway expandable. Replace the route names below with yours,
// or copy this block when adding a new expandable section.
const isApiGatewayActive = computed(() =>
  ['api-gateway-list', 'api-gateway-consumers', 'gateway-create'].includes(route.name as string),
)

const isNetworksActive = computed(() =>
  ['networks-list', 'networks-create', 'networks-detail', 'networks-add-connection',
    'networks-connection-detail', 'networks-dns-detail', 'networks-test-endpoint'].includes(route.name as string),
)

const isNetworksDetailActive = computed(() =>
  ['networks-detail', 'networks-add-connection'].includes(route.name as string),
)

const isCatalogActive = computed(() => false) // wire up when adding catalog routes
const isDevPortalActive = computed(() => false) // wire up when adding dev portal routes
const isMeteringBillingActive = computed(() => false) // wire up when adding metering & billing routes
const isObservabilityActive = computed(() => false) // wire up when adding observability routes

// ── Expanded state for <details> sections ──
//
// Production auto-opens an expandable item when a descendant route is active.
// We mirror that by seeding the reactive map from route changes.
const expandedItems = reactive<Record<string, boolean>>({
  'api-gateway': false,
  networks: false,
  catalog: false,
  'dev-portal': false,
  'metering-billing': false,
  observability: false,
})

const isApiGatewayExpanded = computed(() => expandedItems['api-gateway'] ?? false)
const isNetworksExpanded = computed(() => expandedItems.networks ?? false)
const isCatalogExpanded = computed(() => expandedItems.catalog ?? false)
const isDevPortalExpanded = computed(() => expandedItems['dev-portal'] ?? false)
const isMeteringBillingExpanded = computed(() => expandedItems['metering-billing'] ?? false)
const isObservabilityExpanded = computed(() => expandedItems.observability ?? false)

const onToggleExpanded = (key: string, open: boolean): void => {
  expandedItems[key] = open
}

// Auto-expand on route change if a child of an expandable item is active
watch(
  () => route.name,
  () => {
    if (isApiGatewayActive.value) expandedItems['api-gateway'] = true
    if (isNetworksActive.value) expandedItems.networks = true
    if (isCatalogActive.value) expandedItems.catalog = true
    if (isDevPortalActive.value) expandedItems['dev-portal'] = true
    if (isMeteringBillingActive.value) expandedItems['metering-billing'] = true
    if (isObservabilityActive.value) expandedItems.observability = true
  },
  { immediate: true },
)

// ── ADD YOUR FEATURE NAV STATE HERE ──
//
// To add a new flat (non-expandable) primary item:
//   1. Drop a `<li><a class="sidebar-item" ...>...</a></li>` into the relevant group
//   2. Wire the icon + label
//   3. If it has its own page, wrap in <router-link> like the Home item above
//
// To add an expandable section with secondary children:
//   1. Add `'your-feature': false` to `expandedItems`
//   2. Add `isYourFeatureActive` + `isYourFeatureExpanded` computeds
//   3. Add the `<details><summary>...</summary><ul>...</ul></details>` block
//      following the API Gateway example above. Children become the secondary nav.
//
// REMEMBER: Update LegacySidebar.vue too — same routes, but as a sidebar-level secondary list.
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

$sidebar-width: 192px;
$navbar-height: 60px;

$scrollbar-width: 8px;
$scrollbar-foreground-color: $kui-color-background-neutral;
$scrollbar-background-color: $kui-color-background-transparent;

.kong-ui-app-sidebar {
  background: $kui-color-background-neutral-weakest;
  border-right: $kui-border-width-10 solid $kui-color-border;
  bottom: 0;
  display: flex;
  flex-direction: column;
  left: 0;
  position: fixed;
  top: $navbar-height;
  width: $sidebar-width;
  z-index: 3;
}

// Scroll container — production GlobalAppSidebarItems.global-app-sidebar-items
.sidebar-content-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: $kui-space-40;
  width: 100%;

  @supports(overflow: overlay) {
    /* stylelint-disable-next-line declaration-property-value-keyword-no-deprecated */
    overflow-y: overlay;
  }

  &::-webkit-scrollbar {
    height: $scrollbar-width;
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
  scrollbar-width: thin;

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
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
    width: 100%;
  }
}

// Group containers (Connectivity / Applications / ungrouped)
.ungrouped-items-container,
.sidebar-items-group {
  color: $kui-color-text-neutral-strong;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.sidebar-items-group-label {
  font-size: $kui-font-size-10; // 10px
  font-weight: $kui-font-weight-medium;
  letter-spacing: 1%;
  line-height: $kui-line-height-30;
  padding: $kui-space-0 $kui-space-40;
  text-transform: uppercase;
  user-select: none;
}

.sidebar-items-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  list-style: none;
  margin: $kui-space-0;
  padding: $kui-space-0;
}

// Item (anchor or summary). Production .sidebar-item.
.sidebar-item {
  align-items: center;
  background-color: $kui-color-background-transparent;
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral-strong;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: inherit;
  gap: $kui-space-30;
  outline: none;
  padding: $kui-space-30;
  text-decoration: none;
  transition: background-color 0.2s ease-in, color 0.2s ease-in, box-shadow 0.2s ease-in;
  user-select: none;

  .sidebar-item-icon {
    color: $kui-color-text-neutral;
    flex-shrink: 0;
    transition: color 0.2s ease-in;

    path {
      fill: $kui-color-text-neutral;
      transition: fill 0.2s ease-in;
    }
  }

  .sidebar-item-label {
    color: $kui-color-text-neutral-strong;
    flex: 1;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-medium;
    line-height: $kui-line-height-30;
    overflow: hidden;
    text-decoration: none;
    text-overflow: ellipsis;
    transition: color 0.2s ease-in, font-weight 0.2s ease-in;
    white-space: nowrap;
  }

  .sidebar-item-shortcut {
    background-color: $kui-color-background-neutral-weaker;
    border-radius: $kui-border-radius-20;
    color: $kui-color-text-neutral-strong;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-20;
    padding: $kui-space-0 $kui-space-20;
    white-space: nowrap;
  }

  .sidebar-item-chevron-icon {
    color: $kui-color-text-neutral-strong;
    flex-shrink: 0;
    margin-left: auto;
    transition: color 0.2s ease-in, transform 0.2s ease-in;

    &.expanded {
      transform: rotate(90deg);
    }
  }

  &:hover {
    background-color: $kui-color-background-neutral-weaker;
    color: $kui-color-text;

    .sidebar-item-icon {
      color: $kui-color-text;
      path { fill: $kui-color-text; }
    }

    .sidebar-item-label,
    .sidebar-item-chevron-icon {
      color: $kui-color-text;
    }
  }

  &:focus-visible {
    box-shadow: $kui-shadow-focus;
  }

  &.active {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;

    .sidebar-item-icon {
      color: $kui-color-text-primary;
      path { fill: $kui-color-text-primary; }
    }

    .sidebar-item-label {
      color: $kui-color-text-primary;
      font-weight: $kui-font-weight-semibold;
    }
  }
}

// <details>/<summary> — disclosure widget for expandable items.
// Strip default markers so summary looks like a plain row.
.sidebar-item-details {
  summary {
    list-style: none;

    &::-webkit-details-marker { display: none; }
    &::marker { content: ''; display: none; }
  }

  // Production has NO flex/gap on this list — secondary items sit flush, deriving
  // their vertical rhythm from each .sidebar-item's own padding ($kui-space-30 top/bottom).
  // The list itself just contributes a margin-bottom under the expanded section.
  // Source: konnect-ui-apps/apps/app-root/.../GlobalAppSidebarItems.vue
  .sidebar-item-details-list {
    list-style: none;
    margin: $kui-space-0 $kui-space-0 $kui-space-40;
    padding: $kui-space-0;

    // Indent secondary items so they sit under the icon
    .sidebar-item {
      padding-left: $kui-space-90;
    }
  }
}

.sidebar-footer {
  align-items: center;
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: $kui-space-40;
  width: 100%;
}

.collapse-btn {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: flex;
  padding: $kui-space-40;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;

  &:hover {
    background-color: $kui-color-background-neutral-weaker;
    color: $kui-color-text;
  }

  &:focus-visible {
    box-shadow: $kui-shadow-focus;
    outline: none;
  }
}
</style>
