# Dashboard / Overview Page Template

An overview page composed from sub-components: context card (AppAboutSection), analytics dashboard (DashboardRenderer with tiles), and quickstart/onboarding cards.

## When to use this template (Type A only)

This is the **analytics overview** pattern — for entities that are traffic hubs: Gateway / control plane, AI Gateway, API, API Product, Portal, Mesh. Their overview page is a dashboard.

If the entity you're building is a configuration record (Plugin, Route, Service, Consumer, Vault, Upstream, Certificate), this is the **wrong** template. Use [`detail-page.md`](./detail-page.md) and follow its **Type B (config detail)** branch instead.

When in doubt, open the production page in `repos/konnect-ui-apps/` and look at what it imports:
- Imports `DashboardRenderer` / `OverviewDashboard` → Type A → use this file
- Imports `*ConfigCard` (`PluginConfigCard`, `RouteConfigCard`, `GatewayServiceConfigCard`) → Type B → use `detail-page.md`

Templates document patterns. Production is the source of truth — if a production page renders something this template doesn't describe, copy production, not the template.

See [`detail-page.md`](./detail-page.md) for the decision tree and the page frame (PageLayout + tabs + sidebar wiring). This file describes only what goes in the Overview tab body.

## Architecture (matches production)

The page file is a **composition orchestrator** — it imports and arranges sub-components but contains minimal logic itself. Each section is its own component.

```
┌─────────────────────────────────────────────────────┐
│ Page (orchestrator — thin, ~80 lines)               │
│                                                      │
│ ┌─ AppPageHeader ─────────────────────────────────┐ │
│ │ breadcrumbs (prop) + title + ActionMenu         │ │
│ │ (built-in margin-bottom: $kui-space-70)         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Loading state ─────────────────────────────────┐ │
│ │ KSkeleton × 3 (shown while data loads)          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Quickstart section (conditional) ──────────────┐ │
│ │ QuickstartCard > QuickstartContent              │ │
│ │ (margin-bottom: $kui-space-60 on section class) │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Context card (always) ─────────────────────────┐ │
│ │ OverviewContextCard (uses AppAboutSection)       │ │
│ │ (margin-bottom: $kui-space-60 on component)     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Dashboard (when data exists) ──────────────────┐ │
│ │ OverviewDashboard (uses DashboardRenderer)       │ │
│ │  ┌─ Tile grid (6-col) ──────────────────────┐   │
│ │  │ [Golden signals — full width, row 0]      │   │
│ │  │ [Top models ½] [Top MCPs ½]    — row 1    │   │
│ │  │ [Top consumers ½] [Top agents ½] — row 2  │   │
│ │  └──────────────────────────────────────────┘   │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Key Components

### AppPageHeader (shim: `src/components/AppPageHeader.vue`)
Production: `@kong-ui-public/app-layout` → `AppPageHeader`

Renders breadcrumbs internally via `:breadcrumbs` prop with `item-max-width="150"`. Has built-in `margin-bottom: $kui-space-70`. Slots: `title-before`, `title-after`, `actions`, `below`.

```vue
<AppPageHeader :breadcrumbs="breadcrumbs" :title="gatewayName">
  <template #title-before>
    <BotIcon :color="KUI_COLOR_TEXT_DECORATIVE_AQUA" :size="KUI_ICON_SIZE_40" />
  </template>
  <template #actions>
    <ActionMenu @edit="..." @delete="..." />
  </template>
</AppPageHeader>
```

### Context Card — ManagementCard Pattern
Production: `konnect-ui-apps/apps/ai-manager/src/components/overview/ManagementCard.vue`

The AI Gateway uses a KCard with a `.control-dashboard` horizontal info-group layout (not AppAboutSection). This pattern shows entity metadata in labeled columns with badges and KCopy.

```vue
<KCard class="ai-gateway-info" title="About">
  <template #actions>
    <KDropdownMenu :kpop-attributes="{ placement: 'bottom-end' }">
      <KButton appearance="secondary" icon size="small">
        <MoreIcon decorative />
      </KButton>
      <template #items>
        <KDropdownItem @click="handleEdit">Edit</KDropdownItem>
        <KDropdownItem danger has-divider @click="handleDelete">Delete</KDropdownItem>
      </template>
    </KDropdownMenu>
  </template>

  <div class="ai-gateway-info-content">
    <p v-if="description">{{ description }}</p>
    <div class="control-dashboard">
      <div class="info-group with-padding">
        <div class="info-label">ID</div>
        <div class="info-content">
          <KCopy badge :text="id" truncate :truncation-limit="25" />
        </div>
      </div>
      <div class="info-group">
        <div class="info-label">Models</div>
        <div class="info-content">
          <KTruncate>
            <KBadge v-for="m in models" class="neutral-badge">{{ m.name }}</KBadge>
          </KTruncate>
        </div>
      </div>
    </div>
  </div>
</KCard>
```

### AppAboutSection (shim: `src/components/AppAboutSection.vue`)
Production: `@kong-ui-public/app-layout` → `AppAboutSection`

A KCard wrapper with built-in support for title, description, created/modified timestamps, actions, and loading state. Used by Event Gateway and other apps for simpler "About" context cards. The AI Gateway uses the ManagementCard pattern above instead.

### DashboardRenderer (shim: `src/components/DashboardRenderer.vue`)
Production: `@kong-ui-public/dashboard-renderer` → `DashboardRenderer`

A 6-column CSS grid layout driven by a tile configuration array. Each tile gets a `.grid-tile` container with border, border-radius, and `height: 100%` (matching production's `.tile-container`).

```vue
<DashboardRenderer :model-value="dashboardDef" :context="context">
  <!-- Golden signals tile uses MetricCardContainer + MetricsCard -->
  <template #analytics-golden-signals>
    <div class="metric-card-tile-wrapper titled">
      <MetricCardContainer card-size="lg">
        <MetricsCard
          v-for="metric in vitals"
          :key="metric.label"
          :title="metric.label"
          :icon="metric.icon"
          :metric-value="metric.value"
          :metric-change="metric.trendValue"
          :change-polarity="metric.changePolarity"
          :trend-icon="metric.trendIcon"
          trend-range="vs previous 7 days"
        />
      </MetricCardContainer>
    </div>
  </template>
  <template #top-models>
    <DashboardCardTable :fetcher="fetchModels" :headers="modelHeaders" />
  </template>
</DashboardRenderer>
```

### MetricCardContainer (shim: `src/components/MetricCardContainer.vue`)
Production: `@kong-ui-public/analytics-metric-provider` → `MetricCardContainer`

Horizontal flex container for `MetricsCard` components. Cards get `border-right` dividers on desktop, stack vertically on mobile.

> **Important — `MetricCardContainer` has no border of its own.** Production gives it `background: transparent`. The visible card outline you see in production screenshots comes from whatever wraps it — usually a `DashboardTile` inside `DashboardRenderer` (which provides `.grid-tile`'s `1px solid var(--kui-color-border)` + `border-radius: 6px` + padding). If you drop `<MetricCardContainer>` straight into a page with nothing around it, **it will render as a borderless flex row sitting on the page background** — that is the bug, not a styling mistake in the shim.
>
> Two production-faithful fixes:
> 1. **Inside a `DashboardRenderer`** (canonical): put it under a tile slot. The tile provides the outline.
> 2. **Standalone in a Type A overview** (prototype shortcut): wrap in a plain `<KCard>`. KCard's default styling matches `.grid-tile` exactly — same `1px var(--kui-color-border)` border, same `border-radius`, same padding tokens. This is what `APIGatewayOverview.vue` and `EventGatewayOverview.vue` do.
>
> ```vue
> <KCard class="metric-card-tile">
>   <MetricCardContainer>
>     <MetricsCard ... />
>     <MetricsCard ... />
>   </MetricCardContainer>
> </KCard>
> ```
>
> Don't fix this by adding a border to the `MetricCardContainer` shim itself — that diverges from production and surprises future maintainers. Wrap at the call site.

### MetricsCard (shim: `src/components/MetricsCard.vue`)
Production: `@kong-ui-public/analytics-metric-provider` → `MetricsCard`

Individual metric card with icon + title, large metric value (`font-size-70`), and colored trend badge (positive=green, negative=red, neutral=grey pill). Always renders the trend pill at `cardSize: 'md' | 'lg'` — a static count with no trend renders as a grey `=` pill. If the entity genuinely has no trend data, either use `cardSize: 'sm'` (no trend region) or use a different display component.

### Golden Signals Tile Wrapper

The golden signals tile content must be wrapped in `.metric-card-tile-wrapper.titled` — this provides the correct padding. **Important:** The production AI Gateway uses a different component (`AnalyticsCard` with `AnalyticsItem`) than the generic dashboard renderer `GoldenSignalsRenderer`. The `:deep()` overrides in the dashboard scoped styles match the production AI Gateway font sizes and weights:

```scss
.metric-card-tile-wrapper {
  @media (min-width: ($kui-breakpoint-phablet - 1px)) {
    align-items: center;
    display: flex;
    height: 100%;
    padding: $kui-space-60;
  }

  &.titled {
    padding: $kui-space-50 $kui-space-60 $kui-space-60 $kui-space-60;
  }

  // Match production AI Gateway AnalyticsItem styles
  :deep(.metricscard) {
    gap: $kui-space-50;
  }

  :deep(.metricscard-title) {
    color: $kui-color-text-neutral-stronger;
    font-size: $kui-font-size-20;     // 12px (production .item-label)
    font-weight: $kui-font-weight-semibold;
  }

  :deep(.metricscard-value) {
    color: $kui-color-text-neutral-stronger;
    font-weight: $kui-font-weight-bold; // 700 (production .volume)
    line-height: 1.5;
  }
}
```

**Important:** The `DashboardTile` sets `padding: 0` on `.type-golden_signals` content, so the `metric-card-tile-wrapper` controls all spacing for golden signals tiles.

### Tile Configuration

```typescript
const dashboardDef = computed<DashboardConfig>(() => ({
  tile_height: 185,
  tiles: [
    {
      id: 'analytics-golden-signals',
      definition: {
        chart: { type: 'slottable', id: 'analytics-golden-signals', chart_title: 'Analytics' },
      },
      layout: {
        position: { col: 0, row: 0 },
        size: { cols: 6, rows: 1, fit_to_content: true },
      },
    },
    {
      id: 'top-models',
      definition: {
        chart: { type: 'slottable', id: 'top-models', chart_title: 'Top models' },
      },
      layout: {
        position: { col: 0, row: 1 },
        size: { cols: 3, rows: 1, fit_to_content: true },
      },
    },
    {
      id: 'top-mcps',
      definition: {
        chart: { type: 'slottable', id: 'top-mcps', chart_title: 'Top MCPs' },
      },
      layout: {
        position: { col: 3, row: 1 },
        size: { cols: 3, rows: 1, fit_to_content: true },
      },
    },
  ],
}))
```

**Tile layout system:**
- 6-column grid (DASHBOARD_COLS = 6)
- `position: { col, row }` — 0-indexed grid coordinates
- `size: { cols, rows }` — span across columns/rows
- `fit_to_content: true` — auto-height (only with rows: 1)
- Grid gap: `$kui-space-70` (20px)
- `.grid-tile` has `border`, `border-radius`, `height: 100%` (card container)
- `DashboardTile` inside has `display: flex`, `flex-direction: column`, `height: 100%` (content layout)

**Chart types:**
- `'slottable'` — custom slot content (use `id` as slot name)
- `'golden_signals'` — metrics/vitals row (production uses MetricsProvider)
- `'top_n'` — top-N table with entity links (production uses QueryDataProvider)

## Page Orchestrator Pattern

```vue
<template>
  <div class="overview-page">
    <!-- Header (breadcrumbs are a prop, not separate) -->
    <AppPageHeader :breadcrumbs="breadcrumbs" :title="name">
      <template #title-before><Icon /></template>
      <template #actions><ActionMenu @edit="..." @delete="..." /></template>
    </AppPageHeader>

    <!-- Loading -->
    <template v-if="isLoading">
      <KSkeleton type="card" />
      <KSkeleton type="card" />
    </template>

    <!-- Content -->
    <template v-else>
      <!-- Conditional onboarding -->
      <section v-if="showOnboarding" class="quickstart-section">
        <OnboardingCard />
      </section>

      <!-- Context card (always) -->
      <OverviewContextCard :entity="entity" @edit="..." />

      <!-- Dashboard (when data exists) -->
      <section v-if="hasData" class="dashboard-section">
        <OverviewDashboard :entity-id="id" />
      </section>
    </template>
  </div>
</template>
```

**CSS pattern (matches production):**
```scss
// Root wrapper: NO spacing rules. Just a CSS namespace.
// AppPageHeader handles its own margin-bottom: $kui-space-70.
// Each child section manages its own margin-bottom individually.

.quickstart-section {
  margin-bottom: $kui-space-60;
}

.dashboard-section {
  margin-bottom: $kui-space-60;
}

// Context card component has its own margin-bottom: $kui-space-60
```

## Sub-Component Extraction Rules

1. **Action menu** → own component (handles permissions, danger items, dividers)
2. **Context card** → own component using AppAboutSection (handles badges, metadata, owns its margin-bottom)
3. **Dashboard** → own component using DashboardRenderer (handles tile config, data fetching)
4. **Onboarding/quickstart** → own component (handles multi-step flows)
5. **Page file** → orchestrator only (routing, breadcrumbs prop, loading/error states, component composition)

## Checklist

- [ ] Page file is a thin orchestrator (<100 lines of template)
- [ ] Each section extracted to its own sub-component
- [ ] Breadcrumbs passed as prop to AppPageHeader (not separate KBreadcrumbs)
- [ ] Context card uses ManagementCard pattern (KCard + `.control-dashboard` info groups) for AI Gateway, or AppAboutSection for simpler entities
- [ ] Dashboard uses DashboardRenderer with tile config (not manual CSS grid)
- [ ] Golden signals tile uses MetricCardContainer + MetricsCard (not custom markup)
- [ ] Golden signals content wrapped in `.metric-card-tile-wrapper.titled`
- [ ] Golden signals `:deep()` overrides match production AI Gateway fonts (label: `font-size-20`, value: `font-weight-bold`)
- [ ] Tile positions use 6-column grid system
- [ ] `.grid-tile` has border + height:100% (equal row heights)
- [ ] Loading state: KSkeleton cards
- [ ] Error state: KEmptyState with icon-variant="error"
- [ ] Onboarding: conditional section for new/empty entities
- [ ] CSS: root wrapper has NO spacing rules; individual sections manage their own margin-bottom
- [ ] Action menu extracted to sub-component
- [ ] All text follows content guidelines (sentence case)
- [ ] All styling uses design tokens
