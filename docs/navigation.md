# Navigation: new vs legacy

The starter kit ships with both Konnect navigation styles and a runtime toggle, mirroring production. Designers can demo their feature in either layout without touching code.

| | New nav | Legacy nav |
|---|---|---|
| Top bar | Full-width `Navbar.vue` (light, Kong logo + org button on left, utility icons + account on right) | `LegacyNavbar.vue` (sits to the right of the sidebar, dark) |
| Sidebar | `Sidebar.vue` (light, flat, grouped by Connectivity/Applications) | `LegacySidebar.vue` (dark, has its own logo header + footer with org/geo switcher) |
| Sidebar width | 192px | 240px |
| Secondary nav | Tabs at the top of the page (use `KTabs` or a tabbed router-link) | Expanded items in the sidebar under the active feature |
| Toggle | "Return to classic view" in account dropdown | "Try the new navigation" in account dropdown |

## Switching layouts

The active layout is controlled by `useNavVersion()` and persisted in `localStorage` under `starter-kit:nav-version`. `AppLayout.vue` renders one set of nav components or the other.

```ts
import { useNavVersion } from '@/composables'

const { isNewNav, isLegacyNav, switchToNew, switchToLegacy } = useNavVersion()
```

Production uses an API hint (`new_nav_enrollment`) and a page reload — see `useNewNavigation.ts` in `konnect-ui-apps/apps/app-root/src/composables/`. The starter kit fakes that with localStorage so the flow is the same to demo without backend.

## Source of truth

| Concern | Production reference |
|---|---|
| New navbar layout | `konnect-ui-apps/apps/app-root/src/components/app/layout/GlobalAppNavbar.vue` |
| New sidebar layout | `konnect-ui-apps/apps/app-root/src/components/app/layout/GlobalAppSidebar.vue` + `GlobalAppSidebarItems.vue` |
| New layout grid | `konnect-ui-apps/apps/app-root/src/components/app/layout/GlobalAppLayout.vue` |
| Account dropdown + toggle item | `apps/app-root/src/components/app/layout/dropdowns/AccountDropdown.vue` + `NavEnrollmentAccountDropdownItem.vue` |
| Legacy app shell | `shared-ui-components/packages/core/konnect-app-shell/src/components/KonnectAppShell.vue` |
| Sidebar nav config | `konnect-ui-apps/apps/app-root/src/stores/navigation/*.ts` |

When updating these components, read the production source first and copy structure/classes/tokens. Do not improvise.

## Secondary navigation: which file owns it

A feature like "AI Gateway" has sub-areas (Models, Providers, Policies, etc.). Where those sub-areas live depends on the active nav:

### New nav — two valid patterns

The new sidebar supports two shapes for secondary nav. Pick **one per feature** (production picks per-area too):

**(a) Page tabs (default — use this unless you have a strong reason).**
The sidebar item is a flat link. Sub-areas render as `PageLayoutTabs` at the top of the page. This matches the screenshot for API Gateway in production. See [`docs/templates/detail-page.md`](templates/detail-page.md).

```vue
<!-- src/views/APIGatewayRoot.vue -->
<template>
  <PageLayout :breadcrumbs="breadcrumbs" :tabs="tabs" :title="gateway?.name || ''">
    <template #actions> ... </template>
  </PageLayout>
</template>
```

**(b) Expandable sidebar item.**
The sidebar item is a `<details>`/`<summary>` with nested `<li>` children. Production uses this for top-level "areas" that have only 2–3 stable sub-pages and where each sub-page has its own breadcrumb root (e.g. Gateway Manager → Gateways / Consumers). The example wired into `Sidebar.vue` for "API Gateway" follows this shape.

```vue
<!-- excerpt from Sidebar.vue -->
<details class="sidebar-item-details" :open="isApiGatewayExpanded" @toggle="...">
  <summary class="sidebar-item" :class="{ active: !isApiGatewayExpanded && isApiGatewayActive }">
    <RouteIcon class="sidebar-item-icon" decorative :size="KUI_ICON_SIZE_40" />
    <span class="sidebar-item-label">API Gateway</span>
    <ChevronRightIcon class="sidebar-item-chevron-icon" :class="{ expanded: isApiGatewayExpanded }" />
  </summary>
  <ul class="sidebar-item-details-list">
    <li><a class="sidebar-item" :class="{ active: route.name === 'api-gateway-list' }">…</a></li>
    <li><a class="sidebar-item" :class="{ active: route.name === 'api-gateway-consumers' }">…</a></li>
  </ul>
</details>
```

The `<details>` auto-opens when a child route becomes active (handled by the `watch` in [`Sidebar.vue`](../src/components/Sidebar.vue) — copy that block when adding new expandable items).

`Sidebar.vue` already covers both: API Gateway and Catalog are wired as expandable; AI Gateway, Event Gateway, Service Mesh, etc. are flat. Match the production sibling when in doubt — read `konnect-ui-apps/apps/app-root/src/stores/navigation/<feature>.ts` to see whether the production item uses `to:` (flat) or `items:` (expandable).

### Legacy nav — secondary nav as sidebar children

The primary item expands when the user is inside the feature, revealing sub-items under it. `LegacySidebar.vue` already implements this pattern for `API Gateway`. The expansion is driven by an `isXExpanded` computed alongside `isXActive`.

```ts
// LegacySidebar.vue
const isAiGatewayActive = computed(() =>
  ['ai-gateway-list', 'ai-gateway-models', 'ai-gateway-providers', 'ai-gateway-policies']
    .includes(route.name as string)
)

// Expanded only inside a specific entity (so you only see children when you're in there)
const isAiGatewayExpanded = computed(() =>
  ['ai-gateway-models', 'ai-gateway-providers', 'ai-gateway-policies']
    .includes(route.name as string)
)
```

Then in the template:

```vue
<li class="sidebar-item-primary" :class="{ active: isAiGatewayActive, expanded: isAiGatewayExpanded }">
  <router-link :to="{ name: 'ai-gateway-list' }" custom v-slot="{ navigate, href }">
    <a :href="href" @click="navigate" class="sidebar-item-link">
      <div class="sidebar-item-display" :class="{ 'has-label': isAiGatewayExpanded }">
        <div class="sidebar-item-icon"><BotIcon decorative :size="KUI_ICON_SIZE_40" /></div>
        <div class="sidebar-item-name-container">
          <div class="sidebar-item-name truncate-text truncate-17">AI Gateway</div>
          <div v-if="isAiGatewayExpanded" class="sidebar-item-label truncate-text truncate-18">
            {{ aiGatewayName }}
          </div>
        </div>
      </div>
    </a>
  </router-link>

  <ul v-if="isAiGatewayExpanded" class="level-secondary">
    <li class="sidebar-item-secondary" :class="{ active: route.name === 'ai-gateway-models' }">
      <router-link :to="{ name: 'ai-gateway-models' }" custom v-slot="{ navigate, href }">
        <a :href="href" @click="navigate" class="sidebar-item-link">
          <div class="sidebar-item-display">
            <div class="sidebar-item-name-container">
              <div class="sidebar-item-name truncate-text truncate-18">Models</div>
            </div>
          </div>
        </a>
      </router-link>
    </li>
    <!-- ...more secondary items -->
  </ul>
</li>
```

## Adding a feature: the checklist

For every new top-level feature you add to the prototype, do all five — otherwise one nav version will be wrong:

1. **Routes** — define them in `src/router/index.ts` with stable names (`ai-gateway-list`, `ai-gateway-models`, …).
2. **`Sidebar.vue` (new nav)** — add a primary `<li>` linking to the landing route + an `isXActive` computed.
3. **Page-level tabs** — render `KTabs` (or equivalent) on the landing page so sub-areas are reachable in new-nav mode.
4. **`LegacySidebar.vue` (legacy nav)** — add `isXActive` + `isXExpanded` computeds and the secondary `<ul>` so the same routes show as nested sidebar items.
5. **Manually verify both modes** — toggle from the account dropdown and confirm active states + secondary nav both work.

## Files

| File | Purpose |
|---|---|
| `src/components/AppLayout.vue` | Switches between new and legacy layout based on `useNavVersion` |
| `src/components/Navbar.vue` | New top navbar (logo + org + utility icons + account) |
| `src/components/Sidebar.vue` | New light sidebar (flat, grouped) |
| `src/components/LegacyNavbar.vue` | Legacy top bar (right of sidebar) |
| `src/components/LegacySidebar.vue` | Legacy dark sidebar (with logo header + org/geo footer) |
| `src/components/AccountDropdown.vue` | Profile menu used by both navbars; hosts the toggle |
| `src/composables/useNavVersion.ts` | Reactive nav-version state, persisted to localStorage |
