# Kongponents API Reference

Quick reference for commonly used Kongponents in this project.

---

## KButton

A flexible button component.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appearance` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger' \| 'none'` | `'primary'` | Button style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `to` | `string \| object` | `null` | Router-link destination |
| `disabled` | `boolean` | `false` | Disable button |

### Slots
- `default` - Button content/text

### Example
```vue
<KButton appearance="primary" @click="handleClick">
  <AddIcon decorative /> Create
</KButton>
```

---

## KCard

A container component with optional header/footer.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Card title |
| `titleTag` | `string` | `'div'` | HTML tag for title |

### Slots
- `title` - Custom title content
- `default` - Card body
- `actions` - Header actions (right side)
- `footer` - Footer content

### Example
```vue
<KCard title="Card Title">
  <template #actions>
    <KButton size="small">Action</KButton>
  </template>
  <p>Card content</p>
</KCard>
```

---

## KInput

Text input with label and validation.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | v-model value |
| `label` | `string` | `''` | Input label |
| `placeholder` | `string` | `''` | Placeholder text |
| `type` | `string` | `'text'` | Input type |
| `error` | `boolean` | `false` | Error state |
| `errorMessage` | `string` | `''` | Error message |
| `help` | `string` | `''` | Help text |
| `characterLimit` | `number` | `null` | Max characters |

### Slots
- `before` - Content before input (icon)
- `after` - Content after input (icon)
- `label-tooltip` - Tooltip for label

### Example
```vue
<KInput
  v-model="value"
  label="Username"
  placeholder="Enter username"
  :error="hasError"
  error-message="Required field"
>
  <template #before>
    <SearchIcon decorative />
  </template>
</KInput>
```

---

## KBadge

Badge for labels and status indicators.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `appearance` | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'info'` | Badge style |
| `size` | `'medium' \| 'small'` | `'medium'` | Badge size |
| `tooltip` | `string` | `''` | Tooltip text |
| `maxWidth` | `string` | `'200px'` | Max width |

### Slots
- `default` - Badge text
- `icon` - Badge icon

### Example
```vue
<KBadge appearance="success">Active</KBadge>
<KBadge appearance="warning" size="small">Pending</KBadge>
```

---

## KTabs

Tabbed interface component.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `string` | `''` | Active tab hash |
| `tabs` | `Tab[]` | `[]` | Tab definitions |
| `hidePanels` | `boolean` | `false` | Headers only |

### Tab Object
```typescript
{ hash: '#tab-id', title: 'Tab Title', disabled?: boolean }
```

### Slots
- `<hash>` - Tab panel content (e.g., `#overview`)

### Example
```vue
<script setup>
const activeTab = ref('#overview')
const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#settings', title: 'Settings' },
]
</script>

<KTabs v-model="activeTab" :tabs="tabs">
  <template #overview>Overview content</template>
  <template #settings>Settings content</template>
</KTabs>
```

---

## KTableData

Data table with fetching, sorting, pagination.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headers` | `Header[]` | `[]` | Column definitions |
| `fetcher` | `function` | Required | Data fetch function |
| `searchInput` | `string` | `''` | Search query |
| `rowKey` | `string` | - | Unique row identifier |
| `resizeColumns` | `boolean` | `false` | Enable column resize |

### Header Object
```typescript
{ key: 'column', label: 'Column', sortable?: boolean }
```

### Fetcher Function
```typescript
async (params: { pageSize, page, query }) => ({ data: [], total: 0 })
```

### Slots
- `toolbar` - Toolbar content
- `<columnKey>` - Custom cell content
- `action-items` - Row action dropdown items (**NOT** `#actions` — KTableData provides its own KDropdown wrapper, so only provide KDropdownItem children)
- `empty-state` - Empty state

### Events
- `@row:click` - Row clicked

### Example
```vue
<KTableData
  :headers="headers"
  :fetcher="fetcher"
  :search-input="query"
  @row:click="handleRowClick"
>
  <template #toolbar>
    <KInput v-model="query" placeholder="Search..." />
  </template>
  <template #status="{ row }">
    <KBadge :appearance="row.status === 'active' ? 'success' : 'neutral'">
      {{ row.status }}
    </KBadge>
  </template>
  <template #action-items="{ row }">
    <KDropdownItem @click="handleEdit(row)">Edit</KDropdownItem>
    <KDropdownItem danger has-divider @click="handleDelete(row)">Delete</KDropdownItem>
  </template>
</KTableData>
```

> **Important:** When using KTableData directly (not via EntityBaseTable), always use `#action-items` — not `#actions`. KTableData renders its own KDropdown; you only provide the KDropdownItem children. Also use the `danger` prop (not `is-danger`) on KDropdownItem.

---

## KModal

Modal dialog component.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | Required | Show/hide modal |
| `title` | `string` | `''` | Modal title |
| `actionButtonText` | `string` | `'Submit'` | Action button text |
| `actionButtonAppearance` | `string` | `'primary'` | Action button style |
| `cancelButtonText` | `string` | `'Cancel'` | Cancel button text |
| `maxWidth` | `string` | `'500px'` | Max width |

### Slots
- `default` - Modal body
- `footer` - Custom footer

### Events
- `@proceed` - Action button clicked
- `@cancel` - Cancel/close clicked

### Example
```vue
<KModal
  :visible="showModal"
  title="Confirm"
  action-button-text="Delete"
  action-button-appearance="danger"
  @proceed="handleDelete"
  @cancel="showModal = false"
>
  <p>Are you sure?</p>
</KModal>
```

---

## KEmptyState

Empty/no-data state display.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `''` | Title text |
| `message` | `string` | `''` | Message text |
| `actionButtonText` | `string` | `''` | Action button text |
| `iconVariant` | `'default' \| 'error' \| 'search' \| 'kong'` | `'default'` | Icon type |

### Slots
- `icon` - Custom icon
- `action` - Custom action
- `footer` - Footer content

### Events
- `@click-action` - Action button clicked

### Example
```vue
<KEmptyState
  title="No Results"
  message="Try adjusting your search."
  icon-variant="search"
  action-button-text="Clear Search"
  @click-action="clearSearch"
/>
```

---

## KBreadcrumbs

Breadcrumb navigation.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `BreadcrumbItem[]` | Required | Breadcrumb items |
| `itemMaxWidth` | `string` | `'100px'` | Max item width |

### BreadcrumbItem Object
```typescript
{ key?: string, text: string, to?: string | object }
```

### Example
```vue
<KBreadcrumbs :items="[
  { key: 'home', text: 'Home', to: '/' },
  { key: 'list', text: 'Items', to: '/items' },
  { key: 'current', text: 'Current Item' },
]" />
```

---

## KDropdown

Dropdown menu component.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `DropdownItem[]` | `[]` | Menu items |
| `triggerText` | `string` | `''` | Trigger button text |
| `appearance` | `string` | `'primary'` | Button appearance |
| `disabled` | `boolean` | `false` | Disable dropdown |

### DropdownItem Object
```typescript
{ label: string, value: any, disabled?: boolean }
```

### Events
- `@change` - Item selected

### Example
```vue
<KDropdown
  trigger-text="Actions"
  :items="[
    { label: 'Edit', value: 'edit' },
    { label: 'Delete', value: 'delete' },
  ]"
  @change="handleAction"
/>
```

---

## KSelect

Select dropdown with filtering.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `any` | `''` | Selected value |
| `items` | `SelectItem[]` | `[]` | Options |
| `label` | `string` | `''` | Label text |
| `placeholder` | `string` | `'Select...'` | Placeholder |
| `enableFiltering` | `boolean` | `false` | Enable search |
| `clearable` | `boolean` | `false` | Show clear button |
| `error` | `boolean` | `false` | Error state |

### SelectItem Object
```typescript
{ label: string, value: any, disabled?: boolean }
```

### Slots
- `item-template` - Custom item rendering

### Example
```vue
<KSelect
  v-model="selected"
  :items="options"
  label="Choose option"
  enable-filtering
  clearable
/>
```

---

## KCheckbox

Checkbox input.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | Required | Checked state |
| `label` | `string` | `''` | Label text |
| `description` | `string` | `''` | Description |
| `error` | `boolean` | `false` | Error state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |

### Example
```vue
<KCheckbox v-model="isChecked" label="I agree to terms" />
```

---

## KInputSwitch

Toggle switch input.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | Required | On/off state |
| `label` | `string` | `''` | Label text |
| `labelPosition` | `'left' \| 'right'` | `'right'` | Label position |
| `disabled` | `boolean` | `false` | Disable switch |

### Example
```vue
<KInputSwitch v-model="isEnabled" label="Enable feature" />
```

---

## KCollapse

Collapsible content section.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `boolean` | `false` | Expanded state |
| `title` | `string` | `''` | Header title |
| `triggerAlignment` | `'leading' \| 'trailing'` | `'leading'` | Trigger position |

### Slots
- `default` - Collapsible content
- `trigger-content` - Custom trigger
- `visible-content` - Always visible content

### Example
```vue
<KCollapse v-model="isExpanded" title="Advanced Options">
  <p>Hidden content here</p>
</KCollapse>
```

---

## KTooltip

Tooltip component.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `''` | Tooltip text |
| `placement` | `string` | `'top'` | Tooltip position |
| `maxWidth` | `string` | `'300px'` | Max width |

### Slots
- `default` - Trigger element
- `content` - Custom tooltip content

### Example
```vue
<KTooltip text="More information">
  <InfoIcon />
</KTooltip>
```

---

## Common Import Pattern

```typescript
import {
  KButton,
  KCard,
  KInput,
  KBadge,
  KTabs,
  KTableData,
  KModal,
  KEmptyState,
  KBreadcrumbs,
  KDropdown,
  KSelect,
  KCheckbox,
  KInputSwitch,
  KCollapse,
  KTooltip
} from '@/kongponents/components'
```
