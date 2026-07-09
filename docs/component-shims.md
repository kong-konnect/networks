# Component Shims API Reference

These components are local shims that match the API surface of production `@kong-ui-public/*` components. They're shimmed locally because the production packages have API/axios dependencies that don't exist in the prototype.

## EntityBaseTable

**File:** `src/components/EntityBaseTable.vue`
**Production equivalent:** `@kong-ui-public/entities-shared` → `EntityBaseTable`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headers` | `EntityBaseTableHeader[]` | required | Column definitions (key, label, sortable, hidable, tooltip) |
| `fetcher` | `Function` | required | Async function returning `{ data, total }` |
| `rowKey` | `string` | `'id'` | Unique key field on each row |
| `query` | `string` | `''` | Search query (production name) |
| `searchInput` | `string` | `''` | Search query (backward-compat alias for `query`) |
| `isLoading` | `boolean` | `false` | External loading state |
| `errorMessage` | `string \| TableErrorMessage \| null` | `null` | Error state (setting triggers error display) |
| `enableClientSort` | `boolean` | `false` | Enable client-side sorting |
| `sortHandlerFunction` | `Function` | — | Custom sort function |
| `disableSorting` | `boolean` | `false` | Disable sorting entirely |
| `disableRowClick` | `boolean` | `false` | Suppress row click events |
| `enableEntityActions` | `boolean` | `true` | Auto-add actions column |
| `emptyStateOptions` | `EmptyStateOptions` | `{}` | Custom empty state (ctaText, message, title) |
| `paginationAttributes` | `object` | `{}` | Pagination config passed to KTableData |
| `hideFilter` | `boolean` | `false` | Hide built-in search input |
| `hideCard` | `boolean` | `false` | Render without KCard wrapper |
| `hidePagination` | `boolean` | `false` | Hide pagination |
| `hideToolbar` | `boolean` | `false` | Hide toolbar entirely |
| `tablePreferencesKey` | `string` | — | localStorage key for column preferences |
| `fetcherCacheKey` | `string` | — | Cache key for fetcher |
| `title` | `string` | — | Card title |
| `titleTag` | `string` | `'h2'` | HTML tag for title |

### Slots

| Slot | Props | Description |
|------|-------|-------------|
| `toolbar-filter` | — | Custom filter/search area (production pattern) |
| `toolbar-button` | — | **Anti-pattern in this prototype — do not use.** Slot exists for backward compat with the production EntityBaseTable API, but Konnect places the create button in the page-level header actions slot, not inside the table toolbar. See [`docs/templates/list-page.md`](templates/list-page.md) → "Create button location". |
| `toolbar-actions` | — | Same anti-pattern note as `toolbar-button`. Backward-compat alias only. |
| `[column-key]` | `{ row, rowValue }` | Custom column cell content |
| `action-items` | `{ row }` | Row action dropdown items (KTableData provides the KDropdown wrapper — just provide KDropdownItem children) |
| `actions` | `{ row }` | Row actions (EntityBaseTable alias for action-items — does NOT work with KTableData directly) |
| `empty-state` | — | Custom empty state |
| `tooltip-[column-key]` | — | Column header tooltip |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `click:row` | `row` | Row clicked (production name) |
| `row:click` | `event, row` | Row clicked (backward-compat) |
| `sort` | `sortParams` | Sort changed |
| `state` | `state` | Table state changed |
| `update:searchInput` | `string` | Search input changed |
| `clear-search-input` | — | Search cleared |
| `empty-state-cta-clicked` | — | Empty state CTA clicked |

### Mapping to Production

| Shim | Production | Notes |
|------|-----------|-------|
| `headers` (array) | `tableHeaders` (object) | Shim uses array format; production uses `{ [key]: { label, sortable } }` |
| `searchInput` | `query` | Both work in shim |
| `tablePreferencesKey` | `preferencesStorageKey` | Same purpose, different name |

---

## EntityBaseForm

**File:** `src/components/EntityBaseForm.vue`
**Production equivalent:** `@kong-ui-public/entities-shared` → `EntityBaseForm`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isEditing` | `boolean` | `false` | Edit mode (changes save button text) |
| `isLoading` | `boolean` | `false` | Show KSkeleton loading state |
| `hasError` | `boolean` | `false` | Show error empty state |
| `fetchErrorMessage` | `string` | `'An error occurred...'` | Error message for fetch failure |
| `errorMessage` | `string` | `''` | Form-level error (shown as KAlert) |
| `canSubmit` | `boolean` | `true` | Enable/disable save button |
| `isReadonly` | `boolean` | `false` | Read-only mode |
| `entityType` | `string` | `'entity'` | For data-testid attributes |
| `saveButtonText` | `string` | auto | Custom save button text |
| `cancelButtonText` | `string` | `'Cancel'` | Custom cancel button text |
| `hideActions` | `boolean` | `false` | Hide action buttons |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Form content (EntityFormBlock sections, fields, etc.) |
| `form-actions` | Override default Cancel/Save buttons |

### Events

| Event | Description |
|-------|-------------|
| `submit` | Form submitted |
| `cancel` | Cancel clicked |

### Differences from Production

- No `config` prop (production uses this for API config)
- No `fetchUrl` / `editId` (production auto-fetches; shim uses explicit `isLoading`/`hasError`)
- No configuration slideout (JSON/YAML/Terraform code blocks)
- Save/Cancel buttons rendered inline (production teleports them)
- Renders in a plain `div` (no border/card) — matches the production pattern where all forms use `wrapper-component="div"` (e.g., event-gateway). Production's `EntityBaseForm` defaults to `KCard` but all apps override it.

---

## EntityFormSection

**File:** `src/components/EntityFormSection.vue`
**Production equivalent:** `@kong-ui-public/entities-shared` → `EntityFormSection`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Section title |
| `description` | `string` | `''` | Section description |
| `hasDivider` | `boolean` | `false` | Show bottom border |
| `stickyInfoHeader` | `boolean` | `true` | Make info column sticky |
| `hideInfoHeader` | `boolean` | `false` | Hide info column |
| `titleTag` | `string` | `'h2'` | HTML tag for title |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Form content (right column) |
| `description` | Custom description content |
| `footer` | Footer below description |

### Notes

- Matches production CSS exactly (same class names, tokens, responsive breakpoints)
- Uses simple ID generation instead of uuid dependency

---

## ConfigCardItem

**File:** `src/components/ConfigCardItem.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `ConfigCardItemData` | required | `{ key, label, value, tooltip?, type? }` |
| `truncated` | `boolean` | `false` | Truncate long values |

### Item Types

| Type | Rendering |
|------|-----------|
| `'plain'` (default) | Plain text |
| `'badge-status'` | KBadge with auto appearance based on value |
| `'badge-tag'` | KBadge neutral |
| `'date'` | Formatted date string |
| `'copy'` | Monospace code-style text |

---

## ConfigCardDisplay

**File:** `src/components/ConfigCardDisplay.vue`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propertyCollections` | `PropertyCollection[]` | required | Array of `{ title?, items: ConfigCardItemData[] }` |
| `truncated` | `boolean` | `false` | Truncate all values |

### Slots

Pass-through slots for individual items: `[item.key]` and `[item.key]-label`.

---

## AppAboutSection

**File:** `src/components/AppAboutSection.vue`
**Production equivalent:** `@kong-ui-public/app-layout` → `AppAboutSection`

A KCard wrapper for "About" context cards on overview/detail pages. Built-in support for title, description, created/modified timestamps, loading state, and badge content.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Card title |
| `description` | `string` | `''` | Description below title |
| `created` | `string` | `''` | Created date (formatted string) |
| `createdLabel` | `string` | `'Created'` | Label for created date |
| `modified` | `string` | `''` | Modified date (formatted string) |
| `modifiedLabel` | `string` | `'Modified'` | Label for modified date |
| `isLoading` | `boolean` | `false` | Show skeleton loading state |

### Slots

| Slot | Description |
|------|-------------|
| `title` | Override title text |
| `actions` | Header actions (edit button, etc.) |
| `default` | Main content (badge area with KCopy, metadata) |
| `divider-section` | Content below an HR divider |

### Content Layout

The default slot renders as a flex-wrap container with `column-gap: $kui-space-70` and `row-gap: $kui-space-30` — designed for inline badge items (KCopy, KBadge).

---

## DashboardRenderer

**File:** `src/components/DashboardRenderer.vue`
**Production equivalent:** `@kong-ui-public/dashboard-renderer` → `DashboardRenderer`

A 6-column CSS grid layout driven by a tile configuration array.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `modelValue` | `DashboardConfig` | Dashboard config with tiles array |
| `context` | `object` | Context filters (API compat, unused in prototype) |

### DashboardConfig

```typescript
interface DashboardConfig {
  tiles: TileConfig[]
  tile_height?: number  // Default: 170px
}

interface TileConfig {
  id: string
  definition: { chart: ChartOptions; query?: object }
  layout: {
    position: { col: number; row: number }  // 0-indexed
    size: { cols: number; rows: number; fit_to_content?: boolean }
  }
}
```

### Tile Types

- `'slottable'` — renders named slot (use `chart.id` as slot name)
- `'golden_signals'` — metrics vitals row
- `'top_n'` — top-N table

### Named Slots

Each slottable tile creates a named slot matching `chart.id`:
```vue
<DashboardRenderer :model-value="config">
  <template #my-tile-id>Custom content</template>
</DashboardRenderer>
```

---

## DashboardTile

**File:** `src/components/DashboardTile.vue`

Individual tile wrapper with header (title + description) and content area. Used internally by DashboardRenderer.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `definition` | `TileDefinition` | Chart config and optional query |
| `height` | `number` | Tile height in pixels (undefined = auto) |

---

## MetricCardContainer

**File:** `src/components/MetricCardContainer.vue`
**Production equivalent:** `@kong-ui-public/analytics-metric-provider` → `MetricCardContainer`

A horizontal flex container for `MetricsCard` components. Cards are separated by vertical dividers on desktop and stack vertically on mobile.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cardSize` | `MetricCardSize` | `'lg'` | Size variant: `'sm'`, `'md'`, `'lg'`, `'xl'` |
| `containerTitle` | `string` | `''` | Optional title above the cards row |
| `containerDescription` | `string` | `''` | Optional description beside the title |

### Slots

| Slot | Description |
|------|-------------|
| `default` | `MetricsCard` components |

### Production Notes

- Production also has `loading`, `cards` (data array), `hasTrendAccess`, `fallbackDisplayText`, and `errorMessage` props. The shim simplifies this: pass `MetricsCard` components directly via the default slot instead.
- The `.cards-wrapper` uses `column-gap: 24px` with `border-right` dividers between cards at desktop breakpoints.

---

## MetricsCard

**File:** `src/components/MetricsCard.vue`
**Production equivalent:** `@kong-ui-public/analytics-metric-provider` → `MetricsCard`

An individual metric card displaying a title with icon, large metric value, and trend badge with comparison text.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Card title label (e.g. "Requests") |
| `icon` | `Component` | — | Icon component before the title (e.g. `CloudUploadIcon`) |
| `metricValue` | `string` | required | Formatted metric value (e.g. "1.2M", "99.9%") |
| `metricChange` | `string` | `''` | Formatted trend change (e.g. "12.5%") |
| `changePolarity` | `number` | `0` | `1` = positive (green), `-1` = negative (red), `0` = neutral (grey) |
| `trendIcon` | `Component` | — | Trend icon (e.g. `TrendUpIcon`). Omit for neutral/equal. |
| `trendRange` | `string` | `''` | Comparison text (e.g. "vs previous 7 days") |
| `cardSize` | `MetricCardSize` | `'lg'` | Size variant |

### Trend Badge Appearance

| Polarity | Background | Text Color | Example |
|----------|-----------|------------|---------|
| `1` (positive) | `success-weakest` | `text-success` | Requests up |
| `-1` (negative) | `danger-weakest` | `text-danger-strong` | Error rate up |
| `0` (neutral) | `neutral-weaker` | `text-neutral-strong` | No change |

### Usage with Golden Signals Tile

```vue
<div class="metric-card-tile-wrapper titled">
  <MetricCardContainer card-size="lg">
    <MetricsCard
      title="Requests"
      :icon="CloudUploadIcon"
      metric-value="24.5K"
      metric-change="15%"
      :change-polarity="1"
      :trend-icon="TrendUpIcon"
      trend-range="vs previous 7 days"
    />
    <!-- more cards... -->
  </MetricCardContainer>
</div>
```

### Production AI Gateway Font Overrides

The production AI Gateway uses `AnalyticsCard` + `AnalyticsItem` (not the generic `GoldenSignalsRenderer`). To match production fonts, apply these `:deep()` overrides in the dashboard's scoped styles:

| Element | Production style | Override |
|---------|-----------------|----------|
| Label ("Requests", etc.) | `font-size-20` (12px), `semibold`, `color-text-neutral-stronger` | `:deep(.metricscard-title)` |
| Value ("24.5K", etc.) | `font-weight-bold` (700), `line-height: 1.5`, `color-text-neutral-stronger` | `:deep(.metricscard-value)` |
| Card gap | `gap: $kui-space-50` (12px) between label, value, trend | `:deep(.metricscard)` |

See `AIGatewayOverviewDashboard.vue` for the reference implementation.

### Production Notes

- Production uses `cardType` (enum) to auto-select icons. The shim accepts an explicit `icon` prop instead.
- Production computes `changePolarity`, `metricChange`, and `trendIcon` from raw `currentValue`/`previousValue` data. The shim accepts pre-computed values.
- The trend badge CSS (`.metricscard-trend-change`) matches production exactly — pill shape with colored background.
