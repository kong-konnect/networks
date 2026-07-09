# List Page Template

A resource list page with search, table, empty state, and action buttons.

## CRITICAL: pick the right header — `PageLayout` for new nav, `AppPageHeader` for legacy nav

The page header is the single biggest source of "this looks wrong" in this prototype. Production new-nav and legacy-nav pages use **different header components with different DOM, different padding, and different border behavior**. Pick the right one before writing any template.

### Decision

| Nav version | Header component | What you get |
|---|---|---|
| **New** (`useNavVersion().isNewNav === true`, production default) | [`PageLayout`](../../src/components/PageLayout.vue) **without `:tabs`** | Renders `<div class="page-layout-header">` → `<div class="page-header-container">`. Gets a **bottom border** (`1px solid var(--kui-color-border)`) + `$kui-space-60` of bottom padding via the `:not(:has(.page-layout-tabs))` rule in PageLayout.vue. The body content lives in PageLayout's default slot, inside `.page-layout-content` (which adds its own `$kui-space-60` padding and `$kui-space-50` flex gap). |
| **Legacy** | [`AppPageHeader`](../../src/components/AppPageHeader.vue) inside a plain `<div>` | Renders `<div class="kong-ui-app-page-header">`. **No bottom border.** Just `margin-bottom: $kui-space-70` and a `title-before` slot for an icon. Body content is a sibling div below it. |

If you use `AppPageHeader` on a new-nav page, you'll be missing the bottom border that production has — that bug shipped in this prototype's first iteration. Don't repeat it.

### Production reference

[`repos/konnect-ui-apps/apps/event-gateway/src/pages/EventGatewayList.vue`](../../../../repos/konnect-ui-apps/apps/event-gateway/src/pages/EventGatewayList.vue) is the canonical example. It uses Vue's `<component :is>` to swap based on a feature flag:

```vue
<component
  :is="nextNavigationEnabled ? 'PageLayout' : 'div'"
  :title="nextNavigationEnabled ? i18n.t('breadcrumbs.event_gateway') : undefined"
>
  <template #actions>
    <KButton :to="{ name: 'create-gateway' }">
      <AddIcon /> {{ i18n.t('buttons.create_event_gateway') }}
    </KButton>
  </template>

  <PageHeader v-if="!nextNavigationEnabled" :title="...">
    <template #title-before>
      <EventGradientIcon ... />
    </template>
    <!-- legacy actions duplicated here -->
  </PageHeader>

  <!-- Table goes here -->
</component>
```

In this prototype the equivalent is `useNavVersion()` + the same `<component :is>` swap, plus our `AppPageHeader` shim for the legacy branch. Working examples: [`APIGatewayList.vue`](../../src/views/APIGatewayList.vue), [`EventGatewayList.vue`](../../src/views/EventGatewayList.vue).

**Important:** pass `PageLayout` as a **component reference**, not a string — `:is="isNewNav ? PageLayout : 'div'"`. The production snippet above uses `'PageLayout'` (string) because production registers it globally via `konnect-app-shell`. This prototype uses `<script setup>` with local imports, so a string would silently render an unresolved custom element and the header would disappear without an error.

### Why production has two headers

`PageLayout` is the new-nav design system header — built into `@kong-ui-public/page-layout`, used everywhere the konnect-app-shell renders the new sidebar. It owns breadcrumbs + title + actions + tabs as one strip with consistent spacing and bottom border. Pages drop their content into its default slot.

`AppPageHeader` (production "PageHeader") is the older app-layout header that predates `PageLayout`. It's still used on legacy-nav pages because the legacy app-shell renders the page differently. It has no built-in border — content below it is just a sibling.

This is not a starter-kit quirk. It's the same split that exists in production. Match it.

## Architecture (matches production — new nav)

```
┌─────────────────────────────────────────────────────┐
│ PageLayout (no tabs)                                  │
│   page-layout-header (border-bottom: 1px)            │
│   ┌── page-header-container ────────────────────┐    │
│   │ KBreadcrumbs                                 │    │
│   │ <h1> {{ title }}            Actions slot →  │    │
│   └──────────────────────────────────────────────┘    │
│ ─────────────────────────────────────────────────  ←  underline rendered here
│   page-layout-content (padding $kui-space-60)        │
│                                                       │
│                                                       │
│ Option A: Full-page empty state (v-if no data at all) │
│  ┌── KEmptyState or custom EmptyState component ───┐ │
│  │   icon + title + message + CTA                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│ Option B: Table (v-else, or v-show)                   │
│  ┌── KCard ─────────────────────────────────────────┐ │
│  │  KTableData                                       │ │
│  │   ┌─ #toolbar ─────────────────────────────────┐ │ │
│  │   │ EntityFilter (search) only — NO create btn │ │ │
│  │   │ (create button lives in PageLayout #actions)│ │ │
│  │   ├─────────────────────────────────────────────┤ │ │
│  │   │ #name  │ #status │ #provider │ #action-items│ │ │
│  │   ├─────────────────────────────────────────────┤ │ │
│  │   │ #empty-state (when filters return 0)        │ │ │
│  │   └─────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│ DeleteModal (sibling at bottom)                       │
└──────────────────────────────────────────────────────┘
```

## Key Patterns from Production

### Empty State: Two Levels

1. **Full-page empty state** — shown when entity has zero records AND no filters applied. Rendered BEFORE/INSTEAD of the table, not inside it. Often a custom component with illustration.
2. **In-table empty state** — shown when filters return zero results. Rendered via `#empty-state` slot inside KTableData. Uses `KEmptyState` with "Clear search" action.

Production uses `useTableState` to track this:
```typescript
const { handleStateChange, hideTableToolbar: shouldShowEmptyState } = useTableState(() => filterString.value)
```

### Table: KTableData in KCard

Production wraps `KTableData` inside `KCard` directly — NOT through `EntityBaseTable`. The `EntityBaseTable` from `@kong-ui-public/entities-shared` is used by external entity packages, but pages in `konnect-ui-apps` often use `KTableData` directly for more control.

For the prototype, use `EntityBaseTable` (our shim already wraps KCard + KTableData + toolbar).

### Toolbar: constrained search (+ optional KFilterGroup)

Konnect's current toolbar pattern (used on `analytics/Dashboards/DashboardList.vue`, the new analytics dashboards page, etc.) puts a **constrained-width text search** in a flex container, optionally beside a `KFilterGroup` of filter pills. **Use this on every new list page**, with or without filters. The older `EntityFilter` component and the unconstrained, full-width `KInput + SearchIcon` toolbar are both phased out.

The container + search treatment is the **same** whether the page has filters or not. `KFilterGroup` is just an optional sibling. Don't omit the `.toolbar-container` / `.constrained-search` wrappers when you're filterless — the constrained width is the standard, not a side effect of having pills next to it.

Anatomy:
- `.toolbar-container` is a `display: flex` row with `gap: $kui-space-70` and `width: 100%`
- `.constrained-search` wraps the `KInput` and caps it at `max-width: 300px` (still uses `flex-grow: 1` so it fills the available space below that cap)
- The search uses `<FilterIcon>` (not `<SearchIcon>`) in the `#before` slot, tinted to `KUI_COLOR_BACKGROUND_PRIMARY` while focused via an `isSearchFocused` ref
- `KFilterGroup` (when present) is `v-model:filterSelection` against a `FilterGroupSelection`; filters are defined as `FilterGroupFilters` keyed by filter name

```vue
<template #toolbar-filter>
  <div class="toolbar-container">
    <div class="constrained-search">
      <KInput
        v-model.trim="searchQuery"
        placeholder="Filter by name"
        type="search"
        @blur="isSearchFocused = false"
        @focus="isSearchFocused = true"
      >
        <template #before>
          <FilterIcon :color="isSearchFocused ? KUI_COLOR_BACKGROUND_PRIMARY : undefined" />
        </template>
      </KInput>
    </div>
    <KFilterGroup
      v-model="filterSelection"
      :filters="filters"
    />
  </div>
</template>
```

```ts
import { KFilterGroup } from '@kong/kongponents'
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import { FilterIcon } from '@kong/icons'
import { KUI_COLOR_BACKGROUND_PRIMARY } from '@kong/design-tokens'

const isSearchFocused = ref(false)
const filterSelection = ref<FilterGroupSelection>({})
const filters: FilterGroupFilters = {
  deploymentType: {
    label: 'Deployment type',
    operators: ['eq'],
    multiple: true,
    pinned: true,                      // pill always visible, even when empty
    options: [
      { value: 'CLUSTER_TYPE_HYBRID', label: 'Hybrid' },
      { value: 'CLUSTER_TYPE_K8S_INGRESS_CONTROLLER', label: 'Kubernetes ingress' },
      { value: 'CLUSTER_TYPE_SERVERLESS', label: 'Serverless' },
    ],
  },
}
```

Wire each selection into the fetcher and the cache key. Reading the selection:

```ts
const selectedDeploymentTypes = computed<string[]>(() => {
  const value = filterSelection.value.deploymentType?.value
  if (!value) return []
  return Array.isArray(value) ? value : [value]
})

// Cache key forces re-fetch whenever any filter changes — search OR deployment type pills.
const fetcherCacheKey = computed(() =>
  `${searchQuery.value}::${selectedDeploymentTypes.value.join(',')}`,
)

const isFiltered = computed(() =>
  searchQuery.value !== '' || selectedDeploymentTypes.value.length > 0,
)

const resetFilters = () => {
  searchQuery.value = ''
  filterSelection.value = {}
}
```

Reset both search and pills together — never just one. Use `resetFilters` on the in-table empty state's clear action.

Production reference: [`repos/konnect-ui-apps/apps/analytics/src/pages/Dashboards/DashboardList.vue`](../../../../repos/konnect-ui-apps/apps/analytics/src/pages/Dashboards/DashboardList.vue) (toolbar block + script). Working prototype example: [`APIGatewayList.vue`](../../src/views/APIGatewayList.vue).

### Variant: search-only (no filters)

When the page doesn't need `KFilterGroup`, **keep the same wrappers**. Drop only the `<KFilterGroup>` element and the filter-related script/state:

```vue
<template #toolbar-filter>
  <div class="toolbar-container">
    <div class="constrained-search">
      <KInput
        v-model.trim="searchQuery"
        placeholder="Filter by name"
        type="search"
        @blur="isSearchFocused = false"
        @focus="isSearchFocused = true"
      >
        <template #before>
          <FilterIcon :color="isSearchFocused ? KUI_COLOR_BACKGROUND_PRIMARY : undefined" />
        </template>
      </KInput>
    </div>
  </div>
</template>
```

```ts
const searchQuery = ref('')
const isSearchFocused = ref(false)
```

Working prototype examples: [`EventGatewayList.vue`](../../src/views/EventGatewayList.vue), [`APIGatewayConsumersListTab.vue`](../../src/views/APIGatewayConsumersListTab.vue), [`APIGatewayConsumerGroupsTab.vue`](../../src/views/APIGatewayConsumerGroupsTab.vue).

**Anti-pattern:** an unwrapped `<KInput>` (or one wrapped only by `KCard`'s default toolbar) that stretches the full toolbar width. That's the legacy treatment from before the analytics-dashboards refresh — don't ship that on new pages, even when the page has no filters.

### Toolbar styles

Same styles in both variants — search-only and search + filters:

```scss
.toolbar-container {
  align-items: center;
  display: flex;
  gap: $kui-space-70;
  width: 100%;

  .constrained-search {
    flex-grow: 1;
    max-width: 300px;
  }
}
```

### Action Items: EntityTableRowActionDropdown

Production extracts the row action dropdown to its own component. For the prototype, use inline `KDropdownItem` in the `#action-items` slot.

## Code Template

The canonical structure: `<component :is>` swap on `isNewNav` for the page header (new nav → `PageLayout`, legacy → plain `div` + `AppPageHeader`), with the table toolbar using **search + `KFilterGroup`** as documented in the section above. The toolbar block is identical in both nav versions — the page header is what changes.

```vue
<template>
  <!--
    `:is="PageLayout"` (component reference), NOT `:is="'PageLayout'"` (string).
    With <script setup>, locally imported components are NOT globally registered,
    so a string would silently render as an unresolved custom element and the
    whole header would disappear. Production gets away with the string form because
    it has global registration via konnect-app-shell — we don't.
  -->
  <component
    :is="isNewNav ? PageLayout : 'div'"
    :breadcrumbs="isNewNav ? breadcrumbs : undefined"
    class="models-list-page"
    :title="isNewNav ? 'Models' : undefined"
  >
    <template #actions>
      <KButton
        v-if="!shouldShowEmptyState"
        appearance="primary"
        @click="router.push({ name: 'ai-gateway-model-create', params: { id: gatewayId } })"
      >
        <AddIcon decorative />
        New model
      </KButton>
    </template>

    <!-- Legacy-nav header (no border on this one — production parity) -->
    <AppPageHeader
      v-if="!isNewNav"
      :breadcrumbs="breadcrumbs"
      title="Models"
    >
      <template #title-before>
        <BotIcon :color="KUI_COLOR_TEXT_DECORATIVE_AQUA" :size="KUI_ICON_SIZE_40" />
      </template>
      <template #actions>
        <KButton
          v-if="!shouldShowEmptyState"
          appearance="primary"
          @click="router.push({ name: 'ai-gateway-model-create', params: { id: gatewayId } })"
        >
          <AddIcon decorative />
          New model
        </KButton>
      </template>
    </AppPageHeader>

    <!-- Full-page empty state (no data at all, no search/filters) -->
    <div v-if="shouldShowEmptyState && !isFiltered">
      <KEmptyState
        action-button-text="Create model"
        icon-variant="kong"
        message="Create your first model to get started."
        title="No models yet"
        @click-action="router.push({ name: 'ai-gateway-model-create', params: { id: gatewayId } })"
      />
    </div>

    <!-- Table (has data, or filtering) -->
    <EntityBaseTable
      v-show="!shouldShowEmptyState || isFiltered"
      :fetcher="fetcher"
      :fetcher-cache-key="fetcherCacheKey"
      :headers="tableHeaders"
      :hide-toolbar="shouldShowEmptyState && !isFiltered"
      :is-loading="isLoading"
      :query="searchQuery"
      table-preferences-key="models-list"
      @click:row="handleRowClick"
      @state="handleStateChange"
      @update:search-input="searchQuery = $event"
    >
      <!--
        Toolbar — search + KFilterGroup.
        Constrained-width KInput on the left, FilterIcon (not SearchIcon) inside `#before`.
        KFilterGroup pills on the right; pinned filters render even when empty.
        Both controls live inside the same `#toolbar-filter` slot, wrapped in a
        `.toolbar-container` flex row. Same shape in new nav and legacy nav.
        See the "Toolbar: search + KFilterGroup" section above for the rules.
      -->
      <template #toolbar-filter>
        <div class="toolbar-container">
          <div class="constrained-search">
            <KInput
              v-model.trim="searchQuery"
              data-testid="models-search"
              placeholder="Filter by name"
              type="search"
              @blur="isSearchFocused = false"
              @focus="isSearchFocused = true"
            >
              <template #before>
                <FilterIcon :color="isSearchFocused ? KUI_COLOR_BACKGROUND_PRIMARY : undefined" />
              </template>
            </KInput>
          </div>
          <KFilterGroup
            v-model="filterSelection"
            data-testid="models-list-filters"
            :filters="filters"
          />
        </div>
      </template>

      <!--
        DO NOT use the `#toolbar-button` slot to render a "New <entity>" button.
        Konnect's pattern is: the create button lives in the page-level header
        actions slot (PageLayout's `#actions` above), not duplicated inside the
        table toolbar. EntityBaseTable still exposes `#toolbar-button` for
        backward compatibility, but using it is an anti-pattern in this prototype.
        The empty-state CTA (below) is fine — that's a different pattern (a
        call-to-action shown only when the table has no data).
      -->

      <!-- Name column: icon + name + optional description -->
      <template #name="{ row }">
        <div class="custom-layout-cell">
          <SparklesIcon :size="KUI_ICON_SIZE_30" class="entity-icon" />
          <div class="info-cell">
            <div class="k-table-cell-title truncated">{{ row.name }}</div>
            <div v-if="row.description" class="k-table-cell-description truncated">
              {{ row.description }}
            </div>
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <KBadge :appearance="row.status === 'active' ? 'success' : 'neutral'">
          {{ row.status }}
        </KBadge>
      </template>

      <!-- Action items dropdown -->
      <template #action-items="{ row }">
        <KDropdownItem @click="handleEdit(row)">Edit</KDropdownItem>
        <KDropdownItem
          danger
          has-divider
          @click="entityToDelete = row"
        >
          Delete
        </KDropdownItem>
      </template>

      <!-- In-table empty state (search and/or filters returned 0). Reset BOTH. -->
      <template #empty-state>
        <KEmptyState
          action-button-text="Clear filters"
          icon-variant="search"
          message="No results match your filter criteria."
          title="No results found"
          @click-action="resetFilters"
        />
      </template>
    </EntityBaseTable>

    <!-- Delete modal (sibling, outside table) -->
    <KPrompt
      v-if="entityToDelete"
      action-button-text="Delete"
      destructive
      :message="`Are you sure you want to delete ${entityToDelete.name}?`"
      title="Delete model"
      :visible="!!entityToDelete"
      @cancel="entityToDelete = null"
      @proceed="handleDelete"
    />
  </component>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  KUI_COLOR_BACKGROUND_PRIMARY,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_ICON_SIZE_40,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import { BotIcon, AddIcon, FilterIcon, SparklesIcon } from '@kong/icons'
import {
  KButton, KInput, KBadge, KEmptyState, KDropdownItem, KPrompt, KFilterGroup,
} from '@kong/kongponents'
import type { FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'
import AppPageHeader from '@/components/AppPageHeader.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import PageLayout from '@/components/PageLayout.vue'
import { useAIGatewayStore } from '@/composables/useAIGatewayStore'
import { useNavVersion } from '@/composables'

const router = useRouter()
const route = useRoute()
const store = useAIGatewayStore()
const { isNewNav } = useNavVersion()

const gatewayId = computed(() => route.params.id as string)

// Toolbar state — search input + filter pills.
const searchQuery = ref('')
const isSearchFocused = ref(false)

// Each filter key in `filters` becomes a pill in the toolbar. `pinned: true`
// keeps a pill visible even when empty; `multiple: true` allows a multi-select.
const filterSelection = ref<FilterGroupSelection>({})
const filters: FilterGroupFilters = {
  status: {
    label: 'Status',
    operators: ['eq'],
    multiple: true,
    pinned: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
}

// Read a multi-select filter's current selection as a normalized string[].
const selectedStatuses = computed<string[]>(() => {
  const value = filterSelection.value.status?.value
  if (!value) return []
  return Array.isArray(value) ? value : [value]
})

const isFiltered = computed(() =>
  searchQuery.value !== '' || selectedStatuses.value.length > 0,
)

// Cache key forces re-fetch whenever any toolbar control changes.
const fetcherCacheKey = computed(() =>
  `${searchQuery.value}::${selectedStatuses.value.join(',')}`,
)

const resetFilters = () => {
  searchQuery.value = ''
  filterSelection.value = {}
}

const isLoading = ref(false)
const shouldShowEmptyState = ref(false)
const entityToDelete = ref<any>(null)

const items = computed(() => store.getModelsByGateway(gatewayId.value))

const breadcrumbs = computed(() => [
  { key: 'gateways', to: { name: 'ai-gateway-list' }, text: 'AI Gateways' },
  { key: 'details', to: { name: 'ai-gateway-details', params: { id: gatewayId.value } }, text: 'Gateway' },
  { key: 'models', text: 'Models' },
])

const tableHeaders = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'provider', label: 'Provider' },
  { key: 'created_at', label: 'Created at', sortable: true },
]

// Apply both search and filter selections inside the fetcher.
const fetcher = async () => {
  const query = searchQuery.value.toLowerCase().trim()
  const statuses = selectedStatuses.value
  const data = items.value.filter((row: any) => {
    const matchesQuery = !query
      || row.name.toLowerCase().includes(query)
      || (row.description ?? '').toLowerCase().includes(query)
    const matchesStatus = statuses.length === 0 || statuses.includes(row.status)
    return matchesQuery && matchesStatus
  })
  return { data, total: data.length }
}

// Track table state for empty state logic
const handleStateChange = (state: any) => {
  shouldShowEmptyState.value = !state.hasData
}

const handleRowClick = (row: any) => {
  router.push({
    name: 'ai-gateway-model-details',
    params: { gatewayId: gatewayId.value, modelId: row.id },
  })
}

const handleEdit = (row: any) => {
  router.push({
    name: 'ai-gateway-model-edit',
    params: { gatewayId: gatewayId.value, modelId: row.id },
  })
}

const handleDelete = () => {
  if (entityToDelete.value) {
    store.deleteModel(gatewayId.value, entityToDelete.value.id)
    entityToDelete.value = null
  }
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

// PageLayout (new nav) supplies its own .page-layout-content padding ($kui-space-60)
// and flex gap ($kui-space-50) between top-level children. AppPageHeader (legacy nav)
// handles its own margin-bottom. No extra wrapper spacing needed in either case.

// Toolbar layout — mirrors production analytics/Dashboards/DashboardList.vue.
.toolbar-container {
  align-items: center;
  display: flex;
  gap: $kui-space-70;
  width: 100%;

  .constrained-search {
    flex-grow: 1;
    max-width: 300px;
  }
}

.entity-icon {
  color: $kui-color-text-primary;
  flex-shrink: 0;
  margin-right: $kui-space-40;
}
</style>
```

## Key Production Patterns

### Name column with icon + multi-line
```vue
<template #name="{ row }">
  <div class="custom-layout-cell">
    <Icon class="entity-icon" />
    <div class="info-cell">
      <div class="k-table-cell-title truncated">{{ row.name }}</div>
      <div v-if="row.description" class="k-table-cell-description truncated">
        {{ row.description }}
      </div>
    </div>
  </div>
</template>
```

### Hide toolbar when empty (production pattern)
```vue
<EntityBaseTable :hide-toolbar="shouldShowEmptyState" />
```

### Create button location

The create button (e.g. "New model") goes in the **page-level header `#actions` slot** — i.e. PageLayout's `#actions` for new nav, AppPageHeader's `#actions` for legacy. It does NOT go inside the table toolbar.

```vue
<template #actions>
  <KButton v-if="!shouldShowEmptyState" appearance="primary" @click="onCreate">
    <AddIcon decorative />
    New model
  </KButton>
</template>
```

Hide it (via `v-if="!shouldShowEmptyState"`) when a full-page empty state is shown, since that empty state has its own CTA.

**Anti-pattern (do not do this):** rendering the same button via `EntityBaseTable`'s `#toolbar-button` slot. That puts the create button next to the search input inside the table — Konnect doesn't do this. The slot still exists on the shim for backward compat with older third-party consumers, but it shouldn't be used in new prototype code.

### Delete modal as sibling
```vue
<!-- Outside the table, at bottom of template -->
<KPrompt v-if="entityToDelete" ... @cancel="entityToDelete = null" @proceed="handleDelete" />
```

## Checklist

- [ ] Header swap on `isNewNav`: `<component :is="isNewNav ? PageLayout : 'div'">` with `<AppPageHeader v-if="!isNewNav">` inside (component reference, not string)
- [ ] Create button in page-level header `#actions`, hidden when full-page empty state shows
- [ ] Toolbar uses search + `KFilterGroup` inside a `.toolbar-container` (`#toolbar-filter` slot), search wrapped in `.constrained-search` with `FilterIcon` (not `SearchIcon`)
- [ ] `filterSelection: FilterGroupSelection` ref + `filters: FilterGroupFilters` config; pinned multi-select pills where applicable
- [ ] `selectedX` computed normalizes each filter's `value` to a `string[]`
- [ ] `fetcherCacheKey` includes search + every filter selection so the table re-fetches on toolbar changes
- [ ] `isFiltered` computed combines search + filter state; gates the full-page empty state
- [ ] In-table empty state's clear action calls `resetFilters` (resets search AND pills together — never just one)
- [ ] No `#toolbar-button` slot — create button never duplicated in the toolbar
- [ ] Two-level empty state: full-page (no data, not filtered) + in-table (filtered)
- [ ] `hide-toolbar` only when showing the full-page empty state — keep the toolbar visible while filtering
- [ ] `@state` handler tracks whether the table has data
- [ ] Name column uses `.custom-layout-cell` + `.info-cell` pattern with `.truncated`
- [ ] Action items in `#action-items` slot (not inline buttons)
- [ ] Delete modal as sibling element (KPrompt or custom modal)
- [ ] All text sentence case per content guidelines
- [ ] All styling uses design tokens
