# Production Patterns Reference

Patterns from `konnect-ui-apps/apps/ai-manager` - the production AI Gateway app.

---

## Project Structure

```
apps/ai-manager/src/
├── pages/                    # Route components (views)
├── components/               # Reusable components by feature
│   ├── ai-gateway-form/      # Form sub-components
│   ├── ai-gateway-list/      # List sub-components
│   ├── guardrails/           # Feature-specific components
│   └── load-balancing/
├── composables/              # Business logic (useXxx pattern)
├── stores/                   # Pinia state management
├── services/                 # API client services
├── types/                    # TypeScript definitions
├── constants/                # Configuration constants
├── utils/                    # Pure utility functions
├── locales/                  # i18n translations
└── router/                   # Route definitions
```

---

## Composables Pattern

### Structure
```typescript
// composables/useFeatureName.ts
export default function useFeatureName(id: string) {
  // Reactive state
  const isLoading = ref(false)
  const errorMessage = ref('')
  const data = ref<DataType | null>(null)

  // API composables
  const { fetchData } = useApiService()
  const { notify } = useToaster()

  // Methods
  const load = async () => {
    try {
      isLoading.value = true
      data.value = await fetchData(id)
    } catch (e) {
      errorMessage.value = getMessageFromError(e)
      notify({ appearance: 'danger', message: errorMessage.value })
    } finally {
      isLoading.value = false
    }
  }

  // Computed
  const hasData = computed(() => !!data.value)

  return {
    isLoading,
    errorMessage,
    data,
    hasData,
    load,
  }
}
```

### Barrel Export
```typescript
// composables/index.ts
export { default as useFeatureName } from './useFeatureName'
export { default as useAnotherFeature } from './useAnotherFeature'
// ... all composables exported here
```

---

## Pinia Store Pattern

```typescript
// stores/feature.ts
import { defineStore } from 'pinia'

export const useFeatureStore = defineStore('feature', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)
  const pagination = ref({ page: 1, hasMore: false })

  // API
  const { fetchItems } = useApiService()
  const { notify } = useToaster()

  // Prevent duplicate requests
  let currentFetchPromise: Promise<void> | null = null

  // Actions
  const fetch = async () => {
    if (currentFetchPromise) return currentFetchPromise

    currentFetchPromise = (async () => {
      try {
        isLoading.value = true
        const { data, page } = await fetchItems()
        items.value = data
        pagination.value = page
      } catch (e) {
        notify({ appearance: 'danger', message: getMessageFromError(e) })
      } finally {
        isLoading.value = false
        currentFetchPromise = null
      }
    })()
  }

  // Selectors
  const getById = (id: string) => items.value.find(i => i.id === id)

  return {
    items,
    isLoading,
    pagination,
    fetch,
    getById,
  }
})
```

---

## Form Page Pattern

```vue
<template>
  <EntityBaseForm
    :config="formConfig"
    :entity-type="SupportedEntityType.Other"
    :error-message="errorMessage"
    :form-fields="formFields"
    :is-readonly="isSubmitting"
    @cancel="handleCancel"
    @submit="handleSubmit"
  >
    <!-- Form fields -->
    <EntityFormBlock title="Basic Information">
      <KInput v-model="form.name" label="Name" required />
      <KSelect v-model="form.provider" :items="providerOptions" label="Provider" />
    </EntityFormBlock>

    <!-- Provider-specific fields -->
    <AuthFieldsForBearerToken v-if="form.provider === 'openai'" v-model="form.auth" />
  </EntityBaseForm>
</template>

<script setup lang="ts">
import { EntityBaseForm, EntityFormBlock, SupportedEntityType } from '@kong-ui-public/entities-shared'

const { form, isSubmitting, errorMessage, handleSubmit } = useFeatureForm()

const handleCancel = () => router.back()
</script>
```

---

## List Page Pattern

```vue
<template>
  <div class="feature-list">
    <!-- Header with actions -->
    <PageHeader title="Features">
      <template #actions>
        <KButton appearance="primary" :to="{ name: 'create-feature' }">
          <AddIcon decorative /> Create
        </KButton>
      </template>
    </PageHeader>

    <!-- Filters -->
    <div class="filters">
      <KInput v-model="searchQuery" placeholder="Search..." type="search" />
      <KSelect v-model="filterValue" :items="filterOptions" />
    </div>

    <!-- Loading state -->
    <KSkeleton v-if="isLoading" />

    <!-- Empty state -->
    <KEmptyState
      v-else-if="!items.length"
      title="No features found"
      message="Create your first feature."
      action-button-text="Create Feature"
      @click-action="router.push({ name: 'create-feature' })"
    />

    <!-- Data table -->
    <KTableView
      v-else
      :data="filteredItems"
      :headers="headers"
      @row-click="handleRowClick"
    >
      <template #name="{ row }">
        <RouterLink :to="{ name: 'feature-details', params: { id: row.id } }">
          {{ row.name }}
        </RouterLink>
      </template>
    </KTableView>
  </div>
</template>

<script setup lang="ts">
const store = useFeatureStore()
const { items, isLoading } = storeToRefs(store)

onMounted(() => store.fetch())

const filteredItems = computed(() => {
  return items.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>
```

---

## Provider-Specific Components

```vue
<!-- components/ai-gateway-form/AuthFieldsForBearerToken.vue -->
<template>
  <EntityFormBlock title="Authentication">
    <KInput
      v-model="model.apiKey"
      label="API Key"
      type="password"
      :show-password-mask-toggle="true"
    />
    <KInput v-model="model.organizationId" label="Organization ID" />
  </EntityFormBlock>
</template>

<script setup lang="ts">
const model = defineModel<BearerTokenAuth>({ required: true })
</script>
```

Usage in parent:
```vue
<AuthFieldsForBearerToken v-if="provider === 'openai'" v-model="authConfig" />
<AuthFieldsForAzure v-else-if="provider === 'azure'" v-model="authConfig" />
```

---

## API Service Pattern

```typescript
// services/KonnectApi.ts
class KonnectApi {
  v2 = {
    controlPlanes: ControlPlanesApi,
    services: ServicesApi,
    routes: RoutesApi,
    plugins: PluginsApi,
  }

  // Multiple axios instances for different bases
  private client: AxiosInstance
  private clientV2: AxiosInstance
}

// Usage in composables
const { konnectApi } = useKonnectApi()
const response = await konnectApi.v2.plugins.listPlugins(controlPlaneId)
```

---

## Types Organization

```typescript
// types/ai-gateway.ts
export interface AIGateway {
  id: string
  name: string
  controlPlaneId: string
  plugin: AIProxyPlugin
  createdAt: string
}

export interface AIGatewayListResponse {
  items: AIGateway[]
  page: PageInfo
}

// types/index.ts - Barrel export
export * from './ai-gateway'
export * from './ai-plugins'
export * from './control-plane'
```

---

## Constants Organization

```typescript
// constants/llm-models.ts
export const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' },
] as const

export const OPENAI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
] as const
```

---

## Error Handling

```typescript
// utils/helpers.ts
export function getMessageFromError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Usage
try {
  await apiCall()
} catch (e) {
  errorMessage.value = getMessageFromError(e)
  notify({ appearance: 'danger', message: errorMessage.value })
}
```

---

## Route Structure

```typescript
// router/app-routes.ts
const routes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'feature-list',
    component: () => import('../pages/FeatureList.vue'),
  },
  {
    path: 'create',
    name: 'feature-create',
    component: () => import('../pages/CreateFeature.vue'),
  },
  {
    path: ':id',
    children: [
      {
        path: '',
        name: 'feature-overview',
        component: () => import('../pages/FeatureOverview.vue'),
      },
      {
        path: 'edit',
        name: 'feature-edit',
        component: () => import('../pages/EditFeature.vue'),
      },
    ],
  },
]
```

---

## Key Packages Used

| Package | Purpose |
|---------|---------|
| `@kong/kongponents` | UI component library |
| `@kong-ui-public/entities-shared` | EntityBaseForm, EntityFormBlock |
| `@kong-ui-public/app-layout` | App header/layout |
| `@kong/icons` | Icon components |
| `@kong/design-tokens` | Design tokens |
| `pinia` | State management |
| `axios` | HTTP client |
| `@vueuse/core` | Utility composables |
