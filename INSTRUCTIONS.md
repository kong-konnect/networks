# Kong Prototype — AI Assistant Guidelines

This prototype is for **engineering handoff**. All code must match the Kong design system exactly — using Kongponents, design tokens, and existing codebase patterns. No custom styling unless explicitly requested.

## Primary Reference: Production Codebases

**Use these production codebases as the source of truth for patterns.**

Base Location (relative to this prototype): `../../repos/`

### Reference Apps by Purpose

| App | Path | Use For |
|-----|------|---------|
| **event-gateway** | `../../repos/konnect-ui-apps/apps/event-gateway` | Most up-to-date patterns |
| **gateway-manager** | `../../repos/konnect-ui-apps/apps/gateway-manager` | Largest pattern library (comprehensive examples) |
| **ai-manager** | `../../repos/konnect-ui-apps/apps/ai-manager` | AI-specific patterns (LLM, providers, guardrails) |
| **dr-who-agent** | `../../repos/konnect-ui-apps/apps/dr-who-agent` | AI chat components and styling |
| **shared-ui-components** | `../../repos/shared-ui-components/packages/core/konnect-app-shell` | Sidebar, top nav, app shell patterns |
| **public-ui-components** | `../../repos/public-ui-components/packages/entities/` | Source for `@kong-ui-public/*` packages (entities-routes, entities-shared) — route form fields, labels, tooltips |
| **kongponents** | `../../repos/kongponents/` | Source code for `@kong/kongponents` — component props, slots, events, internal implementation |
| **kong-ee** | `../../repos/kong-ee/` | Kong Gateway Enterprise — plugin schemas, configuration, admin API specs |

### When to Reference Each

- **General page/form patterns** → Check `event-gateway` first (most current)
- **Complex features or edge cases** → Check `gateway-manager` (most comprehensive)
- **AI/LLM specific features** → Check `ai-manager` (provider auth, model configs)
- **Chat UI or AI assistant patterns** → Check `dr-who-agent`
- **Navigation, sidebar, app shell** → Check `shared-ui-components/packages/core/konnect-app-shell`
- **Route form fields, labels, tooltips** → Check `public-ui-components/packages/entities/entities-routes/`
- **Kongponents source, props, slots** → Check `kongponents/` (see actual component implementation)
- **Plugin schemas, gateway config** → Check `kong-ee/`

### Production Patterns to Follow

1. **Composable-Driven Architecture** - Business logic in composables, templates stay clean
2. **Pinia Stores** - Use stores for list data, caching, pagination
3. **EntityBaseForm** - Use `@kong-ui-public/entities-shared` for create/edit forms
4. **Provider-Specific Components** - Dynamic auth fields per LLM provider
5. **Barrel Exports** - Export composables from `composables/index.ts`
6. **Type Everything** - Create types in `types/` folder, export from index.ts

---

## Workflow & Task Guidelines

See [docs/workflow-guidelines.md](docs/workflow-guidelines.md) for detailed workflow orchestration rules.

---

## Starter Kit: Creating New Pages

### Quick Start Workflow

1. **Identify the page type** — list, detail, form, dashboard, or catalog
2. **Read the template** — `docs/templates/{list-page,detail-page,form-page,dashboard-page,catalog-page}.md`
3. **Find and read the production equivalent** — search in `../../repos/` for the matching pattern
4. **Copy the code template** and adapt to your entity
5. **Use the component shims** — they match production API surfaces:
   - `PageLayout` — **for new-nav detail pages.** Renders breadcrumbs, title, actions, AND tabs (when `tabs` prop is non-empty) as one header strip. Each tab is a route (`<router-view>` inside). About card lives in the active tab's content, not above tabs. When `tabs` is empty/omitted, the header carries its own bottom border + uses the default slot. **Do not pair with KTabs at the page level.** Read `docs/templates/detail-page.md` before generating.
   - `EntityBaseTable` — for list pages (search, sort, pagination, empty/error states)
   - `EntityBaseForm` — for create/edit forms (loading, error, validation, actions)
   - `EntityFormBlock` — stepped form sections (numbered blocks with title/description)
   - `EntityFormSection` — two-column form sections (info sidebar + content)
   - `ConfigCardItem` / `ConfigCardDisplay` — key-value rows in detail pages
6. **Add the route** in `src/router/index.ts`
7. **Add sidebar navigation** in `src/components/Sidebar.vue` (update computed properties)

### Documentation

| Doc | Purpose |
|-----|---------|
| `docs/templates/list-page.md` | List page template with code and checklist |
| `docs/templates/detail-page.md` | Detail page template with tabs, cards |
| `docs/templates/form-page.md` | Create/edit form template |
| `docs/templates/dashboard-page.md` | Dashboard/overview template |
| `docs/templates/catalog-page.md` | Catalog with sidebar filter + card grid |
| `docs/component-shims.md` | API reference for all component shims |
| `docs/sync-guide.md` | How to keep shims in sync with production |
| `docs/kongponents-api.md` | Kongponents API quick reference |
| `docs/tokens.md` | Design token values |
| `docs/content-guidelines.md` | Kong UI copy rules |
| `docs/production-patterns.md` | Patterns from production codebases |

---

## Core Principles

1. **Design system compliance is mandatory** - Use only Kongponents components, Kong design tokens, and Kong icons
2. **Match production patterns EXACTLY** - Reference production codebases and copy patterns directly. Do not deviate or make assumptions.
3. **No hardcoded values** - Never hardcode colors, spacing, font sizes, or other design values
4. **Minimal custom CSS** - Only add custom styles when Kongponents don't provide the needed styling

---

## CRITICAL: Following Production Code

**When implementing any feature, you MUST follow the production source code exactly. Do not deviate, improvise, or make assumptions.**

### Mandatory Process

1. **Find the production equivalent first** - Before writing any code, locate the production component/page in `../../repos/`
2. **Read the production code thoroughly** - Understand the exact structure, components used, CSS classes, and patterns
3. **Copy the pattern directly** - Replicate the production structure, naming conventions, and styling approach
4. **Do not simplify or "improve"** - Even if you think a different approach is better, follow the production pattern
5. **Ask if unclear** - If you cannot find a production equivalent or the pattern is ambiguous, ask before implementing

### Common Mistakes to Avoid

- **DO NOT** create custom layouts when production uses specific components (e.g., `EntityDetailsCard`)
- **DO NOT** use grid layouts when production uses vertical lists
- **DO NOT** invent CSS class names - use the exact class names from production (`.card-row`, `.title`, `.code-text`, `.separator`)
- **DO NOT** assume how something should look - always verify against production
- **DO NOT** skip reading production code because you think you know the pattern

### Example: Details Card Pattern

**WRONG** (custom grid layout):
```vue
<div class="details-grid">
  <div class="detail-row">
    <div class="detail-label">Hostname</div>
    <div class="detail-value">{{ value }}</div>
  </div>
</div>
```

**CORRECT** (following production `EntityDetailsCard` pattern):
```vue
<div class="card-row" data-testid="hostname">
  <span class="title">Hostname</span>
  <span class="code-text">{{ value }}</span>
</div>
<hr class="separator">
```

### When You Cannot Find a Production Reference

1. State explicitly: "I could not find a production equivalent for this feature"
2. Ask the user to provide a reference or confirm the approach
3. Do not proceed with assumptions

---

## Kongponents Usage

### Available Components
Import from `@kong/kongponents`:

**Layout/Display:**
- `KCard`, `KBadge`, `KAlert`, `KEmptyState`, `KCollapse`, `KTabs`, `KStepper`, `KBreadcrumbs`, `KTruncate`, `KSkeleton`

**Forms:**
- `KButton`, `KInput`, `KLabel`, `KTextArea`, `KCheckbox`, `KRadio`, `KInputSwitch`, `KToggle`, `KSelect`, `KMultiselect`, `KSegmentedControl`

**Data:**
- `KTable`, `KTableView`, `KTableData`, `KPagination`, `KCatalog`, `KTreeList`, `KCodeBlock`

**Overlays:**
- `KModal`, `KModalFullscreen`, `KSlideout`, `KDropdown`, `KDropdownMenu`, `KDropdownItem`, `KPop`, `KTooltip`, `KPrompt`

### Import Pattern
```typescript
import { KButton, KCard, KInput, KBadge } from '@kong/kongponents'
```

---

## Design Tokens

### TypeScript Imports (for props)
```typescript
import {
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_PRIMARY,
  KUI_ICON_SIZE_40,
  KUI_ICON_SIZE_30
} from '@kong/design-tokens'
```

### CSS Custom Properties (for styles)
Always use with fallback:
```scss
// Colors
color: var(--kui-color-text);
color: var(--kui-color-text-neutral, #6c7489);
color: var(--kui-color-text-neutral-stronger);
color: var(--kui-color-text-primary, #1155cb);
background-color: var(--kui-color-background-neutral-weakest, #f1f1f5);
border-color: var(--kui-color-border, #e0e4ea);

// Spacing (use design tokens, not px)
gap: var(--kui-space-50);
padding: var(--kui-space-60);
margin-bottom: var(--kui-space-70);

// Typography
font-size: var(--kui-font-size-40);
font-weight: var(--kui-font-weight-semibold);

// Borders
border-radius: var(--kui-border-radius-30, 6px);
```

### Common Token Values Reference
- `--kui-space-40`: 8px
- `--kui-space-50`: 12px
- `--kui-space-60`: 16px
- `--kui-space-70`: 20px
- `--kui-space-80`: 24px
- `--kui-font-size-30`: 12px
- `--kui-font-size-40`: 14px
- `--kui-font-size-50`: 16px

---

## Icons

### Import from @kong/icons
```typescript
import {
  SparklesIcon,
  AddIcon,
  SearchIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  // Provider icons
  OpenAiIcon,
  AnthropicIcon,
  AzureIcon
} from '@kong/icons'
```

### Usage Pattern
```vue
<SparklesIcon
  :color="KUI_COLOR_TEXT_DECORATIVE_AQUA"
  :size="KUI_ICON_SIZE_40"
/>

<!-- Or as dynamic component -->
<component
  :is="iconComponent"
  :size="24"
  decorative
/>
```

---

## Component Structure

### File Template
```vue
<template>
  <div class="component-name">
    <!-- Template content -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { KUI_COLOR_TEXT_DECORATIVE_AQUA, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { IconName } from '@kong/icons'
import { KButton, KCard } from '@kong/kongponents'

// Types
interface Props {
  title: string
  variant?: 'default' | 'compact'
}

// Props with defaults
const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

// Emits
const emit = defineEmits<{
  (e: 'action', value: string): void
}>()

// State
const isLoading = ref(false)

// Computed
const displayTitle = computed(() => props.title.toUpperCase())

// Methods
const handleAction = () => {
  emit('action', 'value')
}
</script>

<style scoped lang="scss">
.component-name {
  // Styles using design tokens
}
</style>
```

---

## Styling Rules

### DO
```scss
// Use design tokens
color: var(--kui-color-text-neutral);
padding: var(--kui-space-60);
border-radius: var(--kui-border-radius-30);

// Use flexbox for layout
display: flex;
align-items: center;
gap: var(--kui-space-50);

// Use transitions
transition: all 0.2s ease-in-out;
```

### DON'T
```scss
// Never hardcode colors
color: #666666; // BAD
color: blue; // BAD

// Never hardcode spacing
padding: 16px; // BAD
margin: 24px; // BAD

// Never use arbitrary values
font-size: 13px; // BAD - use token
border-radius: 4px; // BAD - use token
```

### Deep Selectors (use sparingly)
```scss
:deep(.k-collapse) {
  background-color: var(--kui-color-background-neutral-weakest);
}
```

---

## Common Patterns

### Page Header with Breadcrumbs
```vue
<div class="page-header-wrapper">
  <AppPageHeader :title="pageTitle" :breadcrumbs="breadcrumbs">
    <template #title-before>
      <IconComponent :color="KUI_COLOR_TEXT_DECORATIVE_AQUA" :size="KUI_ICON_SIZE_40" />
    </template>
    <template #actions>
      <KButton appearance="primary" @click="onCreate">
        <AddIcon decorative />
        Create New
      </KButton>
    </template>
  </AppPageHeader>
</div>
```

### Breadcrumbs Computed
```typescript
const breadcrumbs = computed(() => [
  { key: 'features', to: { name: 'feature-list' }, text: 'Features' },
  { key: 'details', to: { name: 'feature-details', params: { id: id.value } }, text: name.value },
  { key: 'current', text: 'Current Page' }
])
```

### Table with EntityBaseTable (preferred)
```vue
<EntityBaseTable
  :fetcher="fetcher"
  :headers="tableHeaders"
  :query="searchQuery"
  table-preferences-key="my-list"
  @click:row="handleRowClick"
  @update:search-input="searchQuery = $event"
>
  <template #toolbar-filter>
    <KInput v-model.trim="searchQuery" placeholder="Search..." type="search">
      <template #before>
        <SearchIcon decorative />
      </template>
    </KInput>
  </template>

  <template #toolbar-button>
    <KButton appearance="primary" @click="onCreate">
      <AddIcon decorative />
      New item
    </KButton>
  </template>

  <template #name="{ row }">
    {{ row.name }}
  </template>

  <template #action-items="{ row }">
    <KDropdownItem @click="handleEdit(row)">Edit</KDropdownItem>
    <KDropdownItem danger @click="handleDelete(row)">Delete</KDropdownItem>
  </template>
</EntityBaseTable>
```

See `docs/component-shims.md` for the full EntityBaseTable API.

### Empty State
```vue
<KEmptyState
  icon-variant="kong"
  title="No items found"
  message="Create your first item to get started."
  action-button-text="Create Item"
  @click-action="onCreate"
/>
```

### Tabs
```typescript
const activeTab = ref('#tab-one')
const tabs = [
  { hash: '#tab-one', title: 'Tab One' },
  { hash: '#tab-two', title: 'Tab Two' },
]
```
```vue
<KTabs v-model="activeTab" :tabs="tabs" />

<template v-if="activeTab === '#tab-one'">
  <!-- Tab one content -->
</template>
```

---

## File Naming Conventions

- **Components**: PascalCase - `PolicyCard.vue`, `AnalyticsCard.vue`
- **Views**: PascalCase with feature prefix - `FeatureList.vue`, `FeatureDetails.vue`
- **Composables**: camelCase with `use` prefix - `useFeatureStore.ts`
- **Types**: PascalCase interfaces - `Feature`, `FeatureConfig`

---

## Router Navigation

```typescript
const router = useRouter()
const route = useRoute()

// Get route params
const id = computed(() => route.params.id as string)

// Navigate
router.push({ name: 'feature-details', params: { id: '123' } })
router.push({ name: 'feature-create', params: { id: gatewayId }, query: { provider: 'openai' } })
```

---

## State Management

Use composables in `src/composables/`:

```typescript
import { useFeatureStore } from '@/composables/useFeatureStore'

const store = useFeatureStore()
const items = store.getItems()
const item = store.getItemById(id)
```

---

## Before Writing Code

**CRITICAL: Always read the production source code before implementing. Copy the pattern exactly.**

1. **Find and read the production equivalent**:
   - General patterns → `../../repos/konnect-ui-apps/apps/event-gateway` (most current)
   - Complex patterns → `../../repos/konnect-ui-apps/apps/gateway-manager` (most comprehensive)
   - AI features → `../../repos/konnect-ui-apps/apps/ai-manager`
   - Chat UI → `../../repos/konnect-ui-apps/apps/dr-who-agent`
   - Nav/shell → `../../repos/shared-ui-components/packages/core/konnect-app-shell`
   - Route fields → `../../repos/public-ui-components/packages/entities/entities-routes`
   - Form/table base → `../../repos/public-ui-components/packages/entities/entities-shared`

2. **Copy the production structure exactly**:
   - Same HTML structure and nesting
   - Same CSS class names (`.card-row`, `.title`, `.code-text`, `.separator`, etc.)
   - Same component usage (e.g., `EntityDetailsCard` not custom layouts)
   - Same data-testid attributes

3. **Check Figma** - If your tool supports Figma MCP integration, use it to get exact specs

4. **Find similar components** - Search prototype `src/views/` and `src/components/` for local patterns

5. **Verify Kongponents exist** - Check `docs/kongponents-api.md` for available components and props

6. **Use existing tokens** - Check `docs/tokens.md` for available design tokens

**If you cannot find a production reference, ASK before implementing.**

---

## Sidebar Navigation (IMPORTANT: update when adding new pages)

`Sidebar.vue` contains the full Konnect left nav matching production. It includes working expand/collapse patterns for API Gateway and AI Gateway sections. **When adding pages for a feature, you MUST update the sidebar.**

### How the sidebar works

Each expandable section (API Gateway, AI Gateway, etc.) has three computed properties:

```typescript
// 1. Active = highlight the primary item (blue text + background)
//    Include ALL route names for this feature area
const isYourFeatureActive = computed(() => {
  return ['your-feature-list', 'your-feature-details', 'your-feature-create',
          'your-feature-edit', 'your-feature-sub-page'].includes(route.name as string)
})

// 2. Expanded = show the secondary nav items underneath
//    Include route names where user is INSIDE a specific entity
const isYourFeatureExpanded = computed(() => {
  return ['your-feature-details', 'your-feature-edit',
          'your-feature-sub-page'].includes(route.name as string)
})

// 3. Selected name = subtitle shown below the primary item name when expanded
const selectedName = computed(() => {
  const id = route.params.id as string
  return store.getItemById(id)?.name || ''
})
```

### When adding a new feature

1. **Find the section in the template** — API Gateway and AI Gateway sections already exist with placeholder computed properties
2. **Wire up the computed properties** — Replace the placeholder `computed(() => false)` with actual route name checks
3. **Add `router-link` to the primary item** — Replace the bare `<a>` with `<router-link :to="..." custom v-slot="{ navigate, href }">`
4. **Add secondary nav items** — Inside the `v-if="isXExpanded"` `<ul>`, add `<li>` items with `router-link` and `:class="{ active: route.name === '...' }"`
5. **If adding a new section entirely** — Copy the AI Gateway pattern (the `<li>` with expand/collapse + secondary `<ul>`) and add it to the appropriate group

---

## Reference Files

### Production References (../../repos/)

**event-gateway** (most up-to-date patterns):
- `../../repos/konnect-ui-apps/apps/event-gateway/src/pages/` - Current page patterns
- `../../repos/konnect-ui-apps/apps/event-gateway/src/components/` - Current component patterns
- `../../repos/konnect-ui-apps/apps/event-gateway/src/composables/` - Current composable patterns

**gateway-manager** (most comprehensive):
- `../../repos/konnect-ui-apps/apps/gateway-manager/src/pages/` - Extensive page examples
- `../../repos/konnect-ui-apps/apps/gateway-manager/src/components/` - Large component library
- `../../repos/konnect-ui-apps/apps/gateway-manager/src/stores/` - Complex store patterns

**ai-manager** (AI-specific):
- `../../repos/konnect-ui-apps/apps/ai-manager/src/pages/` - AI Gateway pages
- `../../repos/konnect-ui-apps/apps/ai-manager/src/components/ai-gateway-form/` - Provider-specific fields
- `../../repos/konnect-ui-apps/apps/ai-manager/src/composables/useAIGateway.ts` - AI data patterns
- `../../repos/konnect-ui-apps/apps/ai-manager/src/types/` - AI type definitions

**dr-who-agent** (AI chat):
- `../../repos/konnect-ui-apps/apps/dr-who-agent/src/` - Chat UI components and styling

**shared-ui-components**:
- `../../repos/shared-ui-components/packages/core/konnect-app-shell/` - Sidebar, top nav, app shell

**public-ui-components** (source for `@kong-ui-public/*` packages):
- `../../repos/public-ui-components/packages/entities/entities-routes/src/components/` - Route form components
- `../../repos/public-ui-components/packages/entities/entities-routes/src/locales/en.json` - Route form field labels and tooltips
- `../../repos/public-ui-components/packages/entities/entities-shared/src/` - EntityBaseForm, EntityFormBlock
- `../../repos/public-ui-components/packages/entities/entities-plugins/src/` - Plugin catalog patterns

**kongponents** (source for `@kong/kongponents`):
- `../../repos/kongponents/src/components/` - Component source code, props, slots, events

**kong-ee** (Kong Gateway Enterprise):
- `../../repos/kong-ee/` - Plugin schemas, admin API specs, gateway configuration

### Prototype Reference (this repo)
- **Layout**: `src/components/AppLayout.vue`, `src/components/Sidebar.vue`
- **Component shims** (match production API):
  - `src/components/EntityBaseTable.vue` — list page tables
  - `src/components/EntityBaseForm.vue` — create/edit form wrapper
  - `src/components/EntityFormSection.vue` — two-column form section
  - `src/components/EntityFormBlock.vue` — stepped form block
  - `src/components/ConfigCardItem.vue` — detail page key-value row
  - `src/components/ConfigCardDisplay.vue` — detail page card with multiple rows
  - `src/components/AppAboutSection.vue` — context card for overview pages
  - `src/components/DashboardRenderer.vue` — 6-col tile grid layout
  - `src/components/DashboardTile.vue` — individual tile wrapper
  - `src/components/MetricCardContainer.vue` — horizontal flex container for MetricsCard
  - `src/components/MetricsCard.vue` — individual metric card

### Documentation
- **Page templates**: `docs/templates/` (list, detail, form, dashboard, catalog)
- **Component shims API**: `docs/component-shims.md`
- **Sync guide**: `docs/sync-guide.md`
- **Design tokens**: `docs/tokens.md`
- **Kongponents API**: `docs/kongponents-api.md`
- **Production patterns**: `docs/production-patterns.md`
- **Content guidelines**: `docs/content-guidelines.md`

---

## Content Guidelines (IMPORTANT)

All user-facing copy MUST follow the Kong UI Content Guidelines. See `docs/content-guidelines.md` for the full reference.

### Key Rules
- **Sentence case** everywhere — only capitalize first word + proper nouns (Kong product names)
- **No "please"** in instructions
- **Tooltips** must be full sentences explaining what AND why, ending with a period
- **Placeholders** should show format examples: `e.g., my-service-name`
- **Buttons** use action verbs: "Add", "Create", "Save" — never "Submit", "Go", "OK"
- **No colons** after form labels
- **Oxford comma** in lists of three or more
- **"and"** not "&"
- **Full sentences** end with periods (tooltips, empty states, helper text, error messages)
- **Active voice**, second person ("you")
- **No exclamation points** except rare welcoming moments

---

## Component Shims (match production API)

Local shims for `@kong-ui-public/*` components (shimmed because production has API deps):

**From entities-shared:**
- `EntityBaseTable.vue` — list page tables (search, sort, pagination, error/loading/empty states)
- `EntityBaseForm.vue` — create/edit form wrapper (loading skeleton, error state, validation, action buttons)
- `EntityFormSection.vue` — two-column form layout (sticky info sidebar + content)
- `EntityFormBlock.vue` — stepped form sections (numbered blocks with title/description)
- `ConfigCardItem.vue` — key-value row for detail pages (supports badge, date, copy types)
- `ConfigCardDisplay.vue` — renders multiple ConfigCardItem rows from `propertyCollections`

**From app-layout:**
- `AppAboutSection.vue` — context card for overview pages (title, description, timestamps, badges, loading)

**From page-layout (NEW NAV — use for tabbed detail pages):**
- `PageLayout.vue` — full-page header + tabs + content. Renders breadcrumbs, title, actions slot, and `PageLayoutTabs` in one strip. When `tabs` is non-empty, the content area is a `<router-view>` (one route per tab). When omitted, uses the default slot AND the header gets its own bottom border. **Do not pair with KTabs at the page level — production renders tabs inside PageLayout.**
- `PageLayoutTabs.vue` — the new tab style (underline-on-active in primary color, neutral-weak hover). Used by `PageLayout` automatically; you almost never import this directly.
- See `docs/templates/detail-page.md` for the full Root + per-tab pattern.

**From dashboard-renderer:**
- `DashboardRenderer.vue` — 6-col tile grid layout driven by tile config array
- `DashboardTile.vue` — individual tile wrapper with header + content area

**From analytics-metric-provider:**
- `MetricCardContainer.vue` — horizontal flex container for MetricsCard components (dividers, responsive stacking)
- `MetricsCard.vue` — individual metric card (icon + title, large value, trend badge with polarity colors)

See `docs/component-shims.md` for full API reference.

---

## Overview/Dashboard Page Architecture

- Page file is a **thin composition orchestrator** (~80 lines template)
- Context card: extract to sub-component using `AppAboutSection`
- Dashboard: extract to sub-component using `DashboardRenderer` with tile config
- CSS: `> *:not(:last-child) { margin-bottom: $kui-space-70; }` — NOT flex gap
- See `docs/templates/dashboard-page.md` for full pattern
