# Detail page template

A resource detail page with breadcrumbs, title, actions, tabs, and per-tab content. **The structure is different in new vs legacy nav** — read both before generating code, then pick the version that matches the active nav. If you only target one, use new nav (production default).

## CRITICAL: don't use the legacy pattern for new-nav pages

The pre-existing pattern in this repo (and in older docs) was:

> AppPageHeader (own breadcrumbs + title) → AppAboutSection → KTabs → tab content

That is the **legacy** pattern. New-nav pages use the production `PageLayout` component, which renders the breadcrumbs, title, actions, AND tabs as one header strip. About-section content goes inside the active tab's content, not above it.

If a designer asks for a tabbed page in new-nav mode and you generate KTabs at the page level, **that is wrong**. Re-read this file.

## Source of truth (read before coding)

| File | What it tells you |
|---|---|
| [`src/components/PageLayout.vue`](../../src/components/PageLayout.vue) | The shim — props, slots, what HTML it produces |
| [`src/components/PageLayoutTabs.vue`](../../src/components/PageLayoutTabs.vue) | The new tab style — underline-on-active, neutral-weak hover |
| `../../repos/public-ui-components/packages/core/page-layout/src/components/PageLayout.vue` | Production original — copy structure from here |
| `../../repos/konnect-ui-apps/apps/gateway-manager/src/pages/ControlPlaneRoot.vue` | Real production usage of PageLayout with tabs |
| `../../repos/konnect-ui-apps/apps/gateway-manager/src/pages/GatewayOverviewPage.vue` | Inside the Overview tab — about card + dashboard, no header (parent owns it) |

If the user is on legacy nav, instead read `LegacySidebar.vue` and the legacy section at the bottom of this file.

---

## Templates are hints — production is the source of truth

This file documents the page **frame** (PageLayout + tabs + sidebar wiring). It does **not** prescribe what goes inside any given tab. The tab body is whatever production does for that entity, period.

If the example snippets below ever disagree with production:
- Follow production
- Tell the user the template was wrong and which file to update

A template that gets copied without checking production is how the prototype ends up with fake "Configuration" cards on a gateway overview, fake metric strips, and fields that don't exist on the real page. Don't do that.

---

## Two flavors of detail page — pick the right one before writing tab bodies

Detail pages in production fall into two patterns. They share the same frame (this file) but their tab bodies are different. Decide which you're building **before** you write any tab content.

### Type A — Analytics overview (the entity is a hub with traffic flowing through it)

Use when the entity itself produces analytics: a Gateway / control plane, an AI Gateway, an API, an API Product. The Overview tab is a dashboard.

| | |
|---|---|
| **Tab body** | `AppAboutSection` + `DashboardRenderer` with `golden_signals` (full width, row 0) + `top_n` tiles (Top services / Top routes / Top consumers / Top plugins, etc.) |
| **Pattern doc** | [`dashboard-page.md`](./dashboard-page.md) — read this before building the Overview tab |
| **Production refs** | `repos/konnect-ui-apps/apps/gateway-manager/src/pages/GatewayOverviewPage.vue` + `components/overview/OverviewDashboard.vue` (renders `golden_signals` + four `top_n` tiles); `apps/ai-manager/src/pages/...` for AI Gateway |
| **Telltale signs** | The entity has request volume / latency / error metrics. The page shows "top N consumers", "top N routes". There's a time-range picker. |
| **Anti-pattern** | A `<KCard title="Configuration">` with `ConfigCardDisplay` listing every field. **The hub's overview is not a config dump.** Static counts (data planes / services / routes) are not the body — they appear inside top-N tables, or not at all. |

### Type B — Config detail (the entity *is* a configuration object)

Use when the entity is a record someone wrote: a Plugin, Route, Service, Consumer, Consumer Group, Vault, Upstream, Certificate, Redis Configuration. The page is the config viewer.

| | |
|---|---|
| **Tab body** | `AppAboutSection` + an entity-specific config card (`PluginConfigCard`, `RouteConfigCard`, `GatewayServiceConfigCard`, …). The local shim equivalent is `ConfigCardDisplay` driven by a `propertyCollections` array. |
| **Production refs** | `repos/konnect-ui-apps/apps/gateway-manager/src/pages/plugins/ShowPlugin.vue` (uses `PluginConfigCard`); `pages/routes/ShowRoute.vue` (uses `RouteConfigCard`); `pages/gateway-services/ShowGatewayService.vue` (uses `GatewayServiceConfigCard`) |
| **Telltale signs** | The entity has a `config` JSON object, or its fields ARE the page's content (host, paths, methods, protocols, …). No analytics on this page. |
| **Anti-pattern** | A `DashboardRenderer` with `top_n` tiles. Plugins and routes don't have their own analytics overview. |

### Which one is this?

Ask:
1. **Is the page about the entity's traffic, or its definition?**
   Traffic → Type A. Definition → Type B.
2. **Does the production page render `OverviewDashboard` / `DashboardRenderer`, or does it render an `*ConfigCard`?**
   Find the production page in `repos/` and look at the imports. That answer is authoritative — ignore the rest of this file if it disagrees.
3. **If you can't find a production page**, ask the user before guessing. Don't pad the page with cards from the wrong pattern just to fill the screen.

Both types use the same Root + tabs frame from this file. Only the tab bodies differ.

---

## New-nav pattern (default)

Two files: a **Root** that renders `PageLayout` with the title + tabs, and one file per tab that renders that tab's content (about card + body).

### Architecture

```
┌── PageLayout ──────────────────────────────────────────┐
│ page-layout-header                                      │
│   ┌── page-header-container ──────────────────────────┐ │
│   │ KBreadcrumbs                                       │ │
│   │ <h1> {{ title }}                  Actions slot →  │ │
│   └────────────────────────────────────────────────────┘ │
│   ┌── PageLayoutTabs ─────────────────────────────────┐ │
│   │ Overview   Consumers   Plugins   …                 │ │
│   └────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ page-layout-content                                      │
│   <router-view />  ← active tab's component renders here│
│                                                          │
│   On the Overview route only:                            │
│     AppAboutSection (about this gateway)                 │
│     <body content for the Overview tab>                  │
└─────────────────────────────────────────────────────────┘
```

The about card lives in the Overview tab's component. **Not above the tabs.** When you switch to Consumers, the about card disappears with the rest of the Overview body — that is correct behavior.

### Routes

Tabs are sibling routes under a parent. Use Vue Router's nested routes — the parent renders `<router-view>` (PageLayout does this for you when `tabs` is non-empty).

```ts
// router/index.ts
{
  path: '/api-gateway/:id',
  name: 'api-gateway-root',           // hits the Root component
  component: () => import('@/views/APIGatewayRoot.vue'),
  redirect: { name: 'api-gateway-overview' },
  children: [
    {
      path: 'overview',
      name: 'api-gateway-overview',   // tab 1
      component: () => import('@/views/APIGatewayOverview.vue'),
    },
    {
      path: 'consumers',
      name: 'api-gateway-consumers',  // tab 2
      component: () => import('@/views/APIGatewayConsumers.vue'),
    },
  ],
}
```

### Root component (renders PageLayout + tabs)

```vue
<!-- src/views/APIGatewayRoot.vue -->
<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    :tabs="tabs"
    :title="gateway?.name || ''"
  >
    <template #actions>
      <KDropdown
        :kpop-attributes="{ placement: 'bottom-end' }"
        show-caret
        trigger-text="Actions"
      >
        <template #items>
          <KDropdownItem @click="handleEdit">Edit</KDropdownItem>
          <KDropdownItem danger has-divider @click="showDelete = true">Delete</KDropdownItem>
        </template>
      </KDropdown>
    </template>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { KDropdown, KDropdownItem } from '@kong/kongponents'
import PageLayout, { type PageLayoutTab } from '@/components/PageLayout.vue'
import { useAPIGatewayStore } from '@/composables/useAPIGatewayStore'

const route = useRoute()
const store = useAPIGatewayStore()

const id = computed(() => route.params.id as string)
const gateway = computed(() => store.getGatewayById(id.value))
const showDelete = ref(false)

const isRouteActive = (name: string): boolean =>
  route.matched.some(m => m.name === name)

const breadcrumbs = computed(() => [
  { key: 'root', to: { name: 'api-gateway-list' }, text: 'API Gateway' },
  { key: 'current', text: gateway.value?.name || '' },
])

const tabs = computed<PageLayoutTab[]>(() => [
  {
    key: 'overview',
    label: 'Overview',
    to: { name: 'api-gateway-overview', params: { id: id.value } },
    active: isRouteActive('api-gateway-overview'),
  },
  {
    key: 'consumers',
    label: 'Consumers',
    to: { name: 'api-gateway-consumers', params: { id: id.value } },
    active: isRouteActive('api-gateway-consumers'),
  },
])

const handleEdit = () => { /* … */ }
</script>
```

### Tab component (Overview — owns the about card)

The Overview tab's body depends on which flavor you picked above. The frame is identical:

```vue
<!-- src/views/APIGatewayOverview.vue -->
<template>
  <AppAboutSection
    :created="formatDate(gateway?.created_at)"
    :description="gateway?.description"
    :is-loading="isLoading"
    :modified="formatDate(gateway?.updated_at)"
    title="About this gateway"
  >
    <!--
      Notes on the badges:
        - Use `truncate` (NOT `format="hidden"`). `format="hidden"` hides the value
          and produces empty pills with copy icons.
        - Only put fields here that production puts on the about strip — usually
          ID, Name, and a few key descriptors. The entire entity should not go here.
    -->
    <KCopy badge badge-label="ID" :text="gateway?.id || ''" truncate />
    <KCopy badge badge-label="Name" :text="gateway?.name || ''" truncate />
    <KBadge appearance="success">{{ gateway?.status }}</KBadge>
  </AppAboutSection>

  <!--
    Body of the Overview tab.

    Type A (analytics overview — Gateway, AI Gateway, API, API Product):
      Render <OverviewDashboard> using DashboardRenderer with `golden_signals`
      + `top_n` tiles. See docs/templates/dashboard-page.md and copy the
      structure from production: GatewayOverviewPage.vue + OverviewDashboard.vue.

    Type B (config detail — Plugin, Route, Service, Consumer, Vault, …):
      Render the entity-specific config card. Locally that's
      <ConfigCardDisplay :property-collections="..."/>. In production it's
      `PluginConfigCard`, `RouteConfigCard`, `GatewayServiceConfigCard`, etc.

    DO NOT pad the Overview with a generic <KCard title="Configuration"> that
    re-lists every field already on the about strip. That is not a production
    pattern — it's a placeholder that leaks into the prototype.
  -->
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { KCopy, KBadge } from '@kong/kongponents'
import AppAboutSection from '@/components/AppAboutSection.vue'
import { useAPIGatewayStore } from '@/composables/useAPIGatewayStore'

const route = useRoute()
const store = useAPIGatewayStore()

const isLoading = ref(false)
const gateway = computed(() => store.getGatewayById(route.params.id as string))

const formatDate = (s?: string) => s ? new Date(s).toLocaleDateString() : ''
</script>
```

### Other tab components

A non-Overview tab usually has no about card — just the tab body.

```vue
<!-- src/views/APIGatewayConsumers.vue -->
<template>
  <KCard title="Consumers">
    <EntityBaseTable :fetcher="fetchConsumers" :headers="headers" />
  </KCard>
</template>
```

---

## Detail page WITHOUT tabs (new nav)

If your page is just a single view (no tabs), pass `breadcrumbs` and `title` to `PageLayout` and put your content in the default slot. PageLayout will render its own bottom border on the header (matches production).

This frame is most often used by **Type B (config detail)** entities — Plugin, Route, Service, Consumer, etc. — when production shows the config without further tabs.

```vue
<PageLayout :breadcrumbs="breadcrumbs" :title="entity?.name || ''">
  <template #actions>
    <!-- Edit / Delete dropdown -->
  </template>

  <AppAboutSection title="About this plugin" ...>
    <KCopy badge badge-label="ID" :text="entity?.id || ''" truncate />
    <KBadge appearance="neutral">{{ entity?.name }}</KBadge>
  </AppAboutSection>

  <!--
    Type B body: ConfigCardDisplay shows the entity's configuration as a flat
    key/value list. This is appropriate ONLY when the entity IS a config record
    and production renders an entity-specific config card here.

    Cross-check by opening the production page (e.g. ShowPlugin.vue,
    ShowRoute.vue, ShowGatewayService.vue) and confirming it imports
    PluginConfigCard / RouteConfigCard / GatewayServiceConfigCard. If it
    doesn't, this isn't the right pattern — re-read the decision tree above.
  -->
  <ConfigCardDisplay :property-collections="configProperties" />
</PageLayout>
```

If your page is a Type A overview without tabs (rare), use `dashboard-page.md` instead — `DashboardRenderer` goes in the default slot, not `ConfigCardDisplay`.

---

## Legacy-nav pattern

When `useNavVersion()` returns `legacy`, the sidebar already shows the entity's secondary navigation as nested items. The page itself renders content for one of those items — no tabs at the page level.

```vue
<template>
  <div>
    <AppPageHeader :breadcrumbs="breadcrumbs" :title="entity?.name || ''">
      <template #actions>
        <!-- Edit / Delete dropdown -->
      </template>
    </AppPageHeader>

    <AppAboutSection title="About this gateway" ...>
      <KCopy badge badge-label="Name" :text="entity?.name || ''" truncate />
    </AppAboutSection>

    <!--
      Body — no tabs. The legacy sidebar drives navigation between siblings.

      The body here follows the same Type A vs Type B split as the new-nav pattern:
        - Type A (Gateway / AI Gateway / API overview): DashboardRenderer with
          golden_signals + top_n tiles. See docs/templates/dashboard-page.md.
        - Type B (Plugin / Route / Service / Consumer / Vault config detail):
          ConfigCardDisplay driven by propertyCollections.

      Pick based on what production renders for this entity — not based on
      whichever snippet you saw most recently in this file.
    -->
  </div>
</template>
```

The same routes (`api-gateway-overview`, `api-gateway-consumers`, …) are wired into `LegacySidebar.vue` as expandable secondary items. See [`docs/navigation.md`](../navigation.md) for that wiring.

---

## Checklist

When generating a detail page, do **all** of:

1. **Find the production page first.** Open the matching `Show*.vue` / `*OverviewPage.vue` in `repos/konnect-ui-apps/`. Read its imports — those tell you Type A vs Type B. If production disagrees with this template, follow production.
2. **Decide Type A or Type B** using the decision tree at the top of this file. Write it down before coding.
3. Read `src/components/PageLayout.vue` to confirm prop names and slots
4. Define routes as parent + nested children (one per tab)
5. Build a Root component that renders `<PageLayout :tabs="tabs" :title="…" :breadcrumbs="…">`
6. Build one component per tab. The Overview tab owns the `AppAboutSection` — and its body is whichever of Type A / Type B you decided in step 2, not a freestyle mix.
7. Add the parent route's `name` to `Sidebar.vue`'s `isXActive` computed
8. Add the tab routes to `LegacySidebar.vue`'s expandable section so legacy users see secondary nav

Don't put `<KTabs>` at the page level for new-nav pages. Don't put the about card above the tabs strip. Don't generate breadcrumbs separately from PageLayout — let PageLayout render them. Don't drop a `<KCard title="Configuration">` onto a Type A overview to fill space — production doesn't have it.
