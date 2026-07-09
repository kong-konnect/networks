# Form Page Template (Create/Edit)

A resource creation or editing form using EntityBaseForm with stepped sections (EntityFormBlock) or two-column sections (EntityFormSection).

## Architecture (matches production)

```
┌──────────────────────────────────────────────────────┐
│ AppPageHeader (breadcrumbs + "Create X" / "Edit X")   │
│ (built-in margin-bottom: $kui-space-70)               │
├───────────────────────────────────────────────────────┤
│                                                        │
│ ┌── EntityBaseForm ────────────────────────────────┐  │
│ │  Loading: KSkeleton type="form"                   │  │
│ │  Error: KEmptyState icon-variant="error"          │  │
│ │                                                    │  │
│ │  ┌─ EntityFormBlock (step 1) ──────────────────┐  │  │
│ │  │ ① General information                        │  │  │
│ │  │  ┌─ content (background card) ────────────┐  │  │  │
│ │  │  │ KInput (name), KTextArea (description)  │  │  │  │
│ │  │  └────────────────────────────────────────┘  │  │  │
│ │  └─────────────────────────────────────────────┘  │  │
│ │                                                    │  │
│ │  ┌─ EntityFormBlock (step 2) ──────────────────┐  │  │
│ │  │ ② Configuration                              │  │  │
│ │  │  ┌─ content ──────────────────────────────┐  │  │  │
│ │  │  │ KSelect (provider), KInput (model)      │  │  │  │
│ │  │  └────────────────────────────────────────┘  │  │  │
│ │  └─────────────────────────────────────────────┘  │  │
│ │                                                    │  │
│ │  KAlert (form-level error, if any)                 │  │
│ │                                                    │  │
│ │  ┌─ form-actions ──────────────────────────────┐  │  │
│ │  │              [Cancel]  [Save/Create]         │  │  │
│ │  └─────────────────────────────────────────────┘  │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Alternative: EntityFormSection (two-column layout)

```
┌── EntityFormSection ───────────────────────────────────┐
│ ┌─── Info (sticky) ──┬─── Content ───────────────────┐ │
│ │ Section title       │ KInput (name)                 │ │
│ │ Description text    │ KTextArea (description)       │ │
│ │ (max-width: 350px)  │ KSelect (provider)            │ │
│ └─────────────────────┴───────────────────────────────┘ │
│ ─────────────────── divider (optional) ──────────────── │
│ ┌─── Info ───────────┬─── Content ───────────────────┐ │
│ │ Next section        │ More fields                   │ │
│ └─────────────────────┴───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Patterns from Production

### EntityBaseForm Wraps Everything

Production uses `EntityBaseForm` from `@kong-ui-public/entities-shared` as the outermost form wrapper. It handles:
- Loading skeleton (KSkeleton type="form") when `isLoading`
- Error empty state (KEmptyState) when `hasError`
- Form-level error alert (KAlert) via `errorMessage`
- Form actions (Cancel + Save buttons) with `canSubmit`
- `<form>` element with `@submit.prevent`

### EntityFormBlock for Stepped Forms

Used when the form has numbered steps (1, 2, 3...). Each block has a step circle, title, description, and a content card with background.

### EntityFormSection for Two-Column Forms

Used when the form has descriptive sections with a sticky info sidebar. Each section has a title + description on the left and form fields on the right. Responsive: stacks on mobile.

### Validation: canSubmit Computed

Production validates all required fields in a single computed:
```typescript
const canSubmit = computed(() => [
  !!form.name?.trim(),
  !!form.provider,
  !isSubmitting.value,
  childFormRef.value?.isValid,
].every(Boolean))
```

### Edit Mode: Pre-fill in @fetch:success or onMounted

Production EntityBaseForm fetches existing data via `fetchUrl` and emits `@fetch:success`. The prototype's shim uses `isLoading` + `onMounted` to pre-fill.

### Navigation After Save

```typescript
const handleSubmit = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const result = isEditing ? store.update(...) : store.create(...)
    router.push({ name: 'detail-page', params: { id: result.id } })
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isSubmitting.value = false
  }
}
```

## Code Template (EntityFormBlock style)

```vue
<template>
  <div class="model-form-page">
    <AppPageHeader
      :breadcrumbs="breadcrumbs"
      :title="isEditing ? 'Edit model' : 'Create model'"
    >
      <template #title-before>
        <BotIcon :color="KUI_COLOR_TEXT_DECORATIVE_AQUA" :size="KUI_ICON_SIZE_40" />
      </template>
    </AppPageHeader>

    <EntityBaseForm
      :can-submit="canSubmit"
      entity-type="ai-gateway-model"
      :error-message="formError"
      :is-editing="isEditing"
      :is-loading="isLoading"
      @cancel="router.back()"
      @submit="handleSubmit"
    >
      <!-- Step 1: General information -->
      <EntityFormBlock
        description="Basic details for your model."
        :step="1"
        title="General information"
      >
        <KInput
          v-model.trim="form.name"
          label="Name"
          :label-attributes="{ info: 'A unique name for this model.' }"
          placeholder="e.g., my-chat-model"
          required
        />
        <KTextArea
          v-model.trim="form.description"
          label="Description"
          placeholder="e.g., Production chat model for customer support"
        />
      </EntityFormBlock>

      <!-- Step 2: Provider configuration -->
      <EntityFormBlock
        description="Choose a provider and target model."
        :step="2"
        title="Provider configuration"
      >
        <KSelect
          v-model="form.provider"
          :items="providerOptions"
          label="Provider"
          placeholder="Select a provider"
          required
        />
        <KInput
          v-model.trim="form.targetModel"
          label="Target model"
          :label-attributes="{ info: 'The upstream model identifier.' }"
          placeholder="e.g., gpt-4o"
          required
        />
      </EntityFormBlock>

      <!-- Step 3: Authentication -->
      <EntityFormBlock
        description="Configure authentication for the provider."
        :step="3"
        title="Authentication"
      >
        <KInput
          v-model.trim="form.apiKey"
          label="API key"
          :label-attributes="{ info: 'The API key for authenticating with the provider.' }"
          placeholder="e.g., sk-..."
          required
          type="password"
        />
      </EntityFormBlock>
    </EntityBaseForm>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { KUI_COLOR_TEXT_DECORATIVE_AQUA, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { BotIcon } from '@kong/icons'
import { KInput, KTextArea, KSelect } from '@kong/kongponents'
import AppPageHeader from '@/components/AppPageHeader.vue'
import EntityBaseForm from '@/components/EntityBaseForm.vue'
import EntityFormBlock from '@/components/EntityFormBlock.vue'
import { useAIGatewayStore } from '@/composables/useAIGatewayStore'

const router = useRouter()
const route = useRoute()
const store = useAIGatewayStore()

const gatewayId = computed(() => route.params.id as string)
const modelId = computed(() => route.params.modelId as string)
const isEditing = computed(() => !!modelId.value)
const isLoading = ref(false)
const isSubmitting = ref(false)
const formError = ref('')

const form = ref({
  name: '',
  description: '',
  provider: '',
  targetModel: '',
  apiKey: '',
})

const canSubmit = computed(() => [
  !isSubmitting.value,
  !!form.value.name.trim(),
  !!form.value.provider,
  !!form.value.targetModel.trim(),
  !!form.value.apiKey.trim(),
].every(Boolean))

const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Azure OpenAI', value: 'azure' },
]

const breadcrumbs = computed(() => [
  { key: 'gateways', to: { name: 'ai-gateway-list' }, text: 'AI Gateways' },
  { key: 'gateway', to: { name: 'ai-gateway-details', params: { id: gatewayId.value } }, text: 'Gateway' },
  { key: 'models', to: { name: 'ai-gateway-models-list', params: { id: gatewayId.value } }, text: 'Models' },
  { key: 'current', text: isEditing.value ? 'Edit' : 'Create' },
])

// Pre-fill in edit mode
onMounted(() => {
  if (isEditing.value) {
    isLoading.value = true
    const existing = store.getModelById(gatewayId.value, modelId.value)
    if (existing) {
      form.value = { ...existing }
    }
    isLoading.value = false
  }
})

const handleSubmit = async () => {
  isSubmitting.value = true
  formError.value = ''
  try {
    if (isEditing.value) {
      store.updateModel(gatewayId.value, modelId.value, form.value)
    } else {
      store.createModel(gatewayId.value, form.value)
    }
    router.back()
  } catch (e: any) {
    formError.value = e.message || 'An error occurred.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
// No root wrapper spacing. AppPageHeader handles its own margin.
// EntityBaseForm handles form layout.
// EntityFormBlock sections have their own margin.
</style>
```

## Code Template (EntityFormSection style)

```vue
<EntityBaseForm
  :can-submit="canSubmit"
  entity-type="ai-gateway-provider"
  :is-editing="isEditing"
  @cancel="router.back()"
  @submit="handleSubmit"
>
  <EntityFormSection
    description="Basic information about this provider."
    has-divider
    title="General"
  >
    <KInput
      v-model.trim="form.name"
      label="Name"
      placeholder="e.g., my-openai-provider"
      required
    />
  </EntityFormSection>

  <EntityFormSection
    description="Authentication credentials for the provider API."
    title="Authentication"
  >
    <KInput
      v-model.trim="form.apiKey"
      label="API key"
      placeholder="e.g., sk-..."
      required
      type="password"
    />
  </EntityFormSection>
</EntityBaseForm>
```

## Key Production Patterns

### Tooltips on form fields
```vue
<KInput label="Name" :label-attributes="{ info: 'A unique identifier for this resource.' }" />
```

### Conditional fields based on selection
```vue
<KSelect v-model="form.provider" :items="providers" label="Provider" />
<template v-if="form.provider === 'azure'">
  <KInput v-model="form.azureInstance" label="Azure instance" />
  <KInput v-model="form.azureDeployment" label="Deployment name" />
</template>
```

### Dynamic array fields (add/remove rows)
```vue
<div class="array-field">
  <KLabel required>Bootstrap servers</KLabel>
  <div v-for="(server, index) in form.servers" :key="index" class="array-field-row">
    <KInput v-model="form.servers[index]" placeholder="e.g., localhost:9092" />
    <KButton
      appearance="tertiary"
      icon
      :disabled="form.servers.length <= 1"
      @click="form.servers.splice(index, 1)"
    >
      <CloseIcon />
    </KButton>
  </div>
  <KButton appearance="tertiary" @click="form.servers.push('')">
    <AddIcon /> Add server
  </KButton>
</div>
```

### Validation with child refs
```typescript
const childFormRef = ref<InstanceType<typeof ChildForm> | null>(null)

const canSubmit = computed(() => [
  !isSubmitting.value,
  !!form.value.name.trim(),
  childFormRef.value?.isValid !== false,
].every(Boolean))
```

### isSubmitting pattern
```typescript
const isSubmitting = ref(false)
const formError = ref('')

const handleSubmit = async () => {
  isSubmitting.value = true
  formError.value = ''
  try {
    // ... save
    router.push({ name: 'detail-page', params: { id: result.id } })
  } catch (e) {
    formError.value = getMessageFromError(e)
  } finally {
    isSubmitting.value = false
  }
}
```

## Checklist

- [ ] Breadcrumbs as prop on AppPageHeader
- [ ] Title: "Create X" for new, "Edit X" for editing
- [ ] EntityBaseForm wrapper with `canSubmit`, `isEditing`, `isLoading`, `errorMessage`
- [ ] EntityFormBlock for stepped forms (step number, title, description)
- [ ] OR EntityFormSection for two-column layout (title, description, hasDivider)
- [ ] `canSubmit` computed uses `.every(Boolean)` pattern
- [ ] `isSubmitting` ref to disable buttons during save
- [ ] `formError` ref cleared on submit, set on catch
- [ ] Edit mode pre-fill via `onMounted`
- [ ] Navigation after save via `router.push` or `router.back()`
- [ ] Tooltips via `:label-attributes="{ info: '...' }"`
- [ ] Placeholders use "e.g., ..." format
- [ ] No root wrapper spacing
- [ ] All styling uses design tokens
