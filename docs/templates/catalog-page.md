# Catalog Page Template

A plugin/policy catalog page with sidebar filters, search, and a card grid organized by category groups.

## Architecture (matches production `PluginCatalog.vue`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppPageHeader (breadcrumbs prop + title)                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌─ plugin-catalog (flex row, gap: $kui-space-90) ──────────────────┐ │
│ │                                                                    │ │
│ │ ┌─ plugin-filter (sticky sidebar, 280px) ──────┐                  │ │
│ │ │ plugin-filter-title: "Filter {entity}"        │                  │ │
│ │ │              [Clear] (KButton tertiary)        │                  │ │
│ │ │                                                │                  │ │
│ │ │ KCollapse: "CATEGORY"                          │                  │ │
│ │ │  ┌─ plugin-type-filter ────────────────────┐  │                  │ │
│ │ │  │ ☐ Category A .............. KBadge (3)  │  │                  │ │
│ │ │  │ ☐ Category B .............. KBadge (5)  │  │                  │ │
│ │ │  │ ☐ Category C .............. KBadge (2)  │  │                  │ │
│ │ │  └────────────────────────────────────────┘  │                  │ │
│ │ └───────────────────────────────────────────────┘                  │ │
│ │                                                                    │ │
│ │ ┌─ plugins-container (flex: 1, min-width: 0) ─────────────────┐  │ │
│ │ │ plugins-filter-input-container                                │  │ │
│ │ │  ┌─ KInput (search) ──────────────────────────────────────┐  │  │ │
│ │ │  └────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                               │  │ │
│ │ │ v-if noSearchResults:                                         │  │ │
│ │ │  ┌─ KEmptyState (search, no results) ─────────────────────┐  │  │ │
│ │ │  │ No results for "query"                                  │  │  │ │
│ │ │  └────────────────────────────────────────────────────────┘  │  │ │
│ │ │                                                               │  │ │
│ │ │ v-else (plugins-results-container, aria-live="polite"):       │  │ │
│ │ │  ┌─ CatalogGrid ──────────────────────────────────────────┐  │  │ │
│ │ │  │                                                         │  │  │ │
│ │ │  │ ┌─ CatalogGroup (per category) ─────────────────────┐  │  │  │ │
│ │ │  │ │ group-title: [icon] Category Name                  │  │  │  │ │
│ │ │  │ │ ┌─ plugin-card-container (CSS grid) ────────────┐  │  │  │  │ │
│ │ │  │ │ │ ┌─Card─┐ ┌─Card─┐ ┌─Card─┐ ┌─Card─┐         │  │  │  │  │ │
│ │ │  │ │ │ │ icon │ │ icon │ │ icon │ │ icon │         │  │  │  │  │ │
│ │ │  │ │ │ │ name │ │ name │ │ name │ │ name │         │  │  │  │  │ │
│ │ │  │ │ │ │ desc │ │ desc │ │ desc │ │ desc │         │  │  │  │  │ │
│ │ │  │ │ │ │Config│ │Config│ │Config│ │Config│         │  │  │  │  │ │
│ │ │  │ │ │ └──────┘ └──────┘ └──────┘ └──────┘         │  │  │  │  │ │
│ │ │  │ │ │ [Show all] (if > 9 cards)                     │  │  │  │  │ │
│ │ │  │ │ └──────────────────────────────────────────────┘  │  │  │  │ │
│ │ │  │ └────────────────────────────────────────────────────┘  │  │  │ │
│ │ │  │                                                         │  │  │ │
│ │ │  │ ┌─ CatalogGroup ("Query Result") ────────────────────┐  │  │  │ │
│ │ │  │ │ (shown when search is active, show-all-card)       │  │  │  │ │
│ │ │  │ └────────────────────────────────────────────────────┘  │  │  │ │
│ │ │  └─────────────────────────────────────────────────────────┘  │  │ │
│ │ └──────────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

## Production Source

The catalog page pattern comes from `@kong-ui-public/entities-plugins`:

| Production Component | Prototype Equivalent | Path |
|---|---|---|
| `PluginCatalog.vue` | `PolicyCatalog.vue` | `public-ui-components/packages/entities/entities-plugins/src/components/PluginCatalog.vue` |
| `PluginCatalogGrid.vue` | `PolicyCatalogGrid.vue` | `.../components/select/PluginCatalogGrid.vue` |
| `PluginCatalogGroup.vue` | `PolicyCatalogGroup.vue` | `.../components/select/PluginCatalogGroup.vue` |
| `PluginCatalogCard.vue` | `PolicyCatalogCard.vue` | `.../components/select/PluginCatalogCard.vue` |

> **Note:** Production also has `PluginSelect.vue` + `PluginSelectGrid/Group/Card` — the older card-centric layout (icon centered, footer with "Enable"/"Enabled" text, uses `KCollapse` for group expand/collapse). `PluginCatalog` is the newer catalog layout used for the plugin catalog page (icon in header, footer with "Configure", flat groups with icon badges, "Show all" card for overflow).

## Key Patterns

### 1. Component Hierarchy

```
CatalogPage (view)
  └─ PolicyCatalog (main orchestrator)
       ├─ Sidebar filter panel
       │   └─ KCollapse > KCheckbox + KBadge per category
       └─ Content panel
           └─ PolicyCatalogGrid
                └─ PolicyCatalogGroup (per category)
                     └─ PolicyCatalogCard (per item)
```

### 2. Sidebar Filter Panel

The sidebar is a sticky panel (280px min-width) with:

- **Title row** — "Filter {entity}" + Clear button (disabled when no filters active)
- **KCollapse section** — checkboxes per category with count badges
- Category filter is `reactive()` — `Record<CategoryKey, boolean>`
- Clear button resets all to `false`

```vue
<div class="plugin-filter-title">
  Filter policies
  <KButton
    appearance="tertiary"
    class="clear-selection"
    :disabled="!Object.values(typeFilter).some(v => v)"
    @click="clearTypeFilter"
  >
    Clear
  </KButton>
</div>
```

### 3. Search Behavior

When the user types in the search input:

1. Policies from all visible categories are flattened
2. Matched by `name`, `description`, or `id` (case-insensitive `.includes()`)
3. Results are deduped by `id` using a `Map`
4. Returned as `{ 'Query Result': [...matches] }` — a single pseudo-category
5. The Grid component renders this with `show-all-card` prop (no truncation)

### 4. Category + Search Interaction

- When **no categories** are checked → all policies shown
- When **categories are checked** → only those groups shown
- When **search is applied** → category filter is applied FIRST, then search within those
- Search results flatten into a single "Query Result" group

### 5. Group Layout (CatalogGroup)

Each group has:
- **Group title** — icon in a decorative purple circle + bold text
- **Card grid** — CSS grid with responsive breakpoints:
  - Mobile: `1fr`
  - Phablet+: `repeat(auto-fit, minmax(280px, 1fr))`
  - Laptop+: `repeat(auto-fit, minmax(280px, 335px))` with `justify-content: flex-start`
- **Show all card** — if > 9 items, show first 8 + a "Show all" card

### 6. Card Layout (CatalogCard)

Each card (min-height 218px) has three sections:
- **Header** — icon (from asset or fallback) + name (bold, left-aligned)
- **Body** — description text (4-line clamp, neutral color, flex: 1)
- **Footer** — "Configure" text (primary color, bold) + optional `#footer-extra` slot

### 7. Collapse State (v-model)

The Grid passes collapse state down to each Group via `v-model`:

```vue
<!-- Grid -->
<PolicyCatalogGroup v-model="shouldCollapsed[category]" ... />

<!-- Group -->
const isCollapsed = defineModel<boolean>({ required: false, default: false })
```

This follows the production pattern where `PLUGIN_GROUPS_COLLAPSE_STATUS` initializes all groups to a default state.

## Code Template — Catalog Page View

```vue
<template>
  <div class="catalog-page">
    <AppPageHeader :breadcrumbs="breadcrumbs" :title="pageTitle">
      <template #title-before>
        <BookIcon
          :color="KUI_COLOR_TEXT_DECORATIVE_AQUA"
          :size="KUI_ICON_SIZE_40"
        />
      </template>
    </AppPageHeader>
    <PolicyCatalog
      :initial-category="categoryFilter"
      @configure="handleConfigure"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_ICON_SIZE_40,
} from '@kong/design-tokens'
import { BookIcon } from '@kong/icons'
import AppPageHeader from '@/components/AppPageHeader.vue'
import PolicyCatalog from '@/components/PolicyCatalog.vue'
import { useAIPolicies, type AIPolicyInfo, type PolicyCategory } from '@/composables/useAIPolicies'
import { useAIGatewayStore } from '@/composables/useAIGatewayStore'

const route = useRoute()
const router = useRouter()
const store = useAIGatewayStore()
const { getCategoryLabel } = useAIPolicies()

const entityId = computed(() => route.params.id as string)
const categoryFilter = computed(() => route.query.category as PolicyCategory | undefined)

const entity = computed(() => store.getGatewayById(entityId.value))
const entityName = computed(() => entity.value?.name || 'AI Gateway')

const pageTitle = computed(() => {
  if (categoryFilter.value) {
    return getCategoryLabel(categoryFilter.value) + ' Policies'
  }
  return 'AI Policies'
})

const breadcrumbs = computed(() => [
  { key: 'list', to: { name: 'ai-gateway-list' }, text: 'AI Gateways' },
  { key: 'details', to: { name: 'ai-gateway-details', params: { id: entityId.value } }, text: entityName.value },
  { key: 'catalog', text: pageTitle.value },
])

const handleConfigure = (policy: AIPolicyInfo) => {
  if (policy.configRouteName) {
    router.push({
      name: policy.configRouteName,
      params: { id: entityId.value },
    })
  }
}
</script>

<style scoped lang="scss">
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}
</style>
```

## Code Template — Catalog Component (PolicyCatalog)

```vue
<template>
  <div class="plugin-catalog" data-testid="plugin-catalog">
    <!-- Sidebar filter -->
    <div class="plugin-filter" data-testid="plugin-filter">
      <div class="plugin-filter-title">
        Filter policies
        <KButton
          appearance="tertiary"
          class="clear-selection"
          data-testid="clear-filter-selection"
          :disabled="!Object.values(typeFilter).some(v => v)"
          @click="clearTypeFilter"
        >
          Clear
        </KButton>
      </div>
      <KCollapse v-model="categoryFilterCollapse">
        <template #title>
          <div class="group-title">Category</div>
        </template>
        <div class="plugin-type-filter">
          <div
            v-for="cat in allCategoryKeys"
            :key="cat"
            class="plugin-filter-item"
            :data-testid="`plugin-filter-item-${cat}`"
          >
            <KCheckbox
              v-model="typeFilter[cat]"
              :data-testid="`plugin-filter-checkbox-${cat}`"
              :label="getCategoryLabel(cat)"
            />
            <KBadge
              appearance="neutral"
              :data-testid="`plugin-filter-count-${cat}`"
            >
              {{ policyCategoryCounts[cat] }}
            </KBadge>
          </div>
        </div>
      </KCollapse>
    </div>

    <!-- Content area -->
    <div class="plugins-container">
      <div class="plugins-filter-input-container">
        <KInput
          v-model.trim="searchFilter"
          class="plugins-filter-input"
          data-testid="plugins-filter-input"
          placeholder="Search policies..."
          type="search"
        />
      </div>

      <KEmptyState
        v-if="noSearchResults && searchFilter"
        :action-button-visible="false"
        data-testid="plugins-empty-state"
        icon-variant="search"
      >
        <template #default>
          <h5>No results for "{{ searchFilter }}"</h5>
        </template>
      </KEmptyState>

      <section v-else aria-live="polite" class="plugins-results-container">
        <PolicyCatalogGrid
          :policy-list="filteredPolicies"
          @configure="(p) => emit('configure', p)"
        />
      </section>
    </div>
  </div>
</template>
```

## CSS Reference — Key Classes

| Class | Purpose | Key Styles |
|---|---|---|
| `.plugin-catalog` | Root flex container | `display: flex; gap: $kui-space-90` |
| `.plugin-filter` | Sticky sidebar | `min-width: 280px; position: sticky; top: 24px` |
| `.plugin-filter-title` | Title + clear btn | `display: flex; justify-content: space-between` |
| `.group-title` (sidebar) | Collapse header | `text-transform: uppercase; font-size: $kui-font-size-20` |
| `.plugin-filter-item` | Checkbox + badge | `display: flex; justify-content: space-between` |
| `.plugins-container` | Main content area | `flex: 1; min-width: 0` |
| `.plugin-select-grid` | Grid wrapper | `display: flex; flex-direction: column; gap: $kui-space-110` |
| `.group-title` (group) | Category header | Icon in purple circle + bold text |
| `.group-icon-wrapper` | Icon circle | `background-color: $kui-color-background-decorative-purple-weakest; border-radius: $kui-border-radius-40; 36x36px` |
| `.plugin-card-container` | Card grid | Responsive CSS grid (see breakpoints above) |
| `.plugin-select-card` | Individual card | `min-height: 218px; border + hover shadow` |
| `.plugin-card-footer` | Card action | `color: $kui-color-text-primary; font-weight: bold` |
| `.show-all-plugin-card` | Overflow card | `height: 218px; border + centered text` |

## data-testid Reference

| Element | data-testid |
|---|---|
| Root catalog | `plugin-catalog` |
| Sidebar | `plugin-filter` |
| Clear button | `clear-filter-selection` |
| Filter item | `plugin-filter-item-{category}` |
| Checkbox | `plugin-filter-checkbox-{category}` |
| Count badge | `plugin-filter-count-{category}` |
| Search input | `plugins-filter-input` |
| Empty state | `plugins-empty-state` |
| Group title | `plugin-group-{name}-title` |
| Group cards | `plugin-group-{name}` |
| Card wrapper | `plugin-catalog-card-wrapper` |
| Card | `{pluginId}-card` |
| Card body | `{pluginId}-card-body` |

## Checklist

- [ ] Sidebar filter with clear button
- [ ] KCollapse with category checkboxes + KBadge counts
- [ ] Search input with empty state for no results
- [ ] CatalogGrid iterates categories in display order
- [ ] CatalogGroup with decorative icon + group name
- [ ] Responsive CSS grid for cards (3 breakpoints)
- [ ] "Show all" card when group has > 9 items
- [ ] CatalogCard with icon, name, description (4-line clamp), "Configure" footer
- [ ] `data-testid` attributes on all interactive elements
- [ ] `aria-live="polite"` on results container
- [ ] Category + search filter interaction (category first, then search)
- [ ] Search flattens to "Query Result" pseudo-category
- [ ] Collapse state passed via v-model from Grid to Group
