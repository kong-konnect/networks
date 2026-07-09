<template>
  <PageLayout
    v-if="network"
    title="Add connection"
    :breadcrumbs="breadcrumbs"
  >
    <!-- Context banner -->
    <KCard class="context-banner">
      <div class="context-row">
        <span class="context-label">Selected network</span>
        <span class="context-value">{{ network.name }}</span>
      </div>
      <div class="context-row">
        <span class="context-label">Cloud</span>
        <span class="context-value">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }}</span>
      </div>
    </KCard>

    <!-- Step 1 — choose method -->
    <EntityFormBlock
      :step="1"
      title="Choose connection method"
      description="Only connection methods supported by this network are shown."
      data-testid="method-chooser"
    >
      <div class="method-list" role="radiogroup" aria-label="Connection method">
        <label
          v-for="method in methods"
          :key="method.type"
          class="method-card"
          :class="{ selected: selectedType === method.type }"
          :data-testid="`method-${method.type}`"
        >
          <input
            v-model="selectedType"
            type="radio"
            :value="method.type"
            class="method-input"
            name="connection-method"
          >
          <div class="method-body">
            <span class="method-name">{{ method.label }}</span>
            <span class="method-usewhen">{{ method.useWhen }}</span>
            <div class="method-tags">
              <span class="method-tag">{{ method.direction }}</span>
              <span class="method-tag method-tag--dim">{{ method.scope }}</span>
            </div>
          </div>
        </label>
      </div>
    </EntityFormBlock>

    <!-- Step 2 — configure (same continuous page) -->
    <EntityFormBlock
      :step="2"
      title="Configure connection"
      :description="selectedMethod ? selectedMethod.formHelp : 'Select a connection method above to configure it.'"
      data-testid="method-form"
    >
      <p
        v-if="!selectedMethod"
        class="field-help"
      >
        Choose a connection method to continue.
      </p>

      <template v-else>
        <div class="form-group">
          <KLabel :required="true">Connection name</KLabel>
          <KInput v-model.trim="form.name" data-testid="connection-name" placeholder="e.g., ai-ingress-prod" width="100%" />
        </div>

        <div v-if="selectedMethod.family === 'private-endpoint'" class="form-group">
          <KLabel>{{ allowedConsumersLabel }}</KLabel>
          <p class="field-help">{{ allowedConsumersHelp }}</p>
          <KTextArea v-model="form.allowedAccounts" :rows="4" placeholder="123456789012" width="100%" />
        </div>

        <div v-if="selectedMethod.type === 'aws-rep-ingress'" class="form-group">
          <KLabel>Custom FQDN (optional)</KLabel>
          <p class="field-help">A private DNS name customer clients use to reach this endpoint.</p>
          <KInput v-model.trim="form.customFqdn" placeholder="e.g., ai.internal.example.com" width="100%" />
        </div>

        <div class="form-group">
          <KLabel>Description / owner (optional)</KLabel>
          <KInput v-model.trim="form.description" placeholder="e.g., Owned by the platform team" width="100%" />
        </div>
      </template>
    </EntityFormBlock>

    <!-- Footer -->
    <div class="step-actions">
      <KButton
        appearance="primary"
        :disabled="!selectedMethod || !form.name.trim() || isSubmitting"
        data-testid="create-connection"
        @click="handleSubmit"
      >
        Create connection
      </KButton>
      <KButton appearance="tertiary" @click="cancel">Cancel</KButton>
    </div>
  </PageLayout>

  <div v-else class="not-found">
    <KEmptyState
      icon-variant="error"
      title="Network not found"
      message="This network does not exist or has been deleted."
      action-button-text="Back to networks"
      @click-action="router.push({ name: 'networks-list' })"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  KButton,
  KCard,
  KEmptyState,
  KInput,
  KLabel,
  KTextArea,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityFormBlock from '@/components/EntityFormBlock.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { CloudProvider, ConnectionType, ConnectionFamily, ConnectionDirection } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const network = computed(() => store.getNetworkById(networkId.value))

const isSubmitting = ref(false)
const selectedType = ref<ConnectionType | ''>('')

const consumerNoun = computed(() => {
  const cloud = network.value?.cloud
  if (cloud === 'gcp') return { label: 'Allowed GCP project IDs', help: 'Enter the GCP project IDs allowed to use this connection, one per line.' }
  if (cloud === 'azure') return { label: 'Allowed Azure subscription IDs', help: 'Enter the Azure subscription IDs allowed to use this connection, one per line.' }
  return { label: 'Allowed AWS account IDs', help: 'Enter the AWS account IDs allowed to use this connection, one per line.' }
})
const allowedConsumersLabel = computed(() => consumerNoun.value.label)
const allowedConsumersHelp = computed(() => consumerNoun.value.help)

const form = reactive({
  name: '',
  allowedAccounts: '',
  customFqdn: '',
  description: '',
})

const breadcrumbs = computed(() => [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
  { key: 'network', to: { name: 'networks-detail', params: { id: networkId.value } }, text: network.value?.name || '' },
  { key: 'add', text: 'Add connection' },
])

interface Method {
  type: ConnectionType
  label: string
  useWhen: string
  direction: string
  scope: string
  family: ConnectionFamily
  dir: ConnectionDirection
  formHelp: string
}

const methodsByCloud: Record<CloudProvider, Method[]> = {
  aws: [
    {
      type: 'aws-rep-ingress',
      label: 'Resource endpoint ingress',
      useWhen: 'Customer clients need to reach Kong privately without peering',
      direction: 'Customer → Kong',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'aws-rep-egress',
      label: 'Resource endpoint egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      direction: 'Kong → upstream',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'aws-vpc-peering',
      label: 'VPC peering',
      useWhen: 'Full VPC-level routing',
      direction: 'Bidirectional',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Full VPC-level routing between networks.',
    },
    {
      type: 'aws-transit-gateway',
      label: 'Transit Gateway',
      useWhen: 'Hub-based routing across VPCs',
      direction: 'Bidirectional',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Hub-based routing across VPCs.',
    },
  ],
  gcp: [
    {
      type: 'gcp-psc-ingress',
      label: 'GCP PSC ingress',
      useWhen: 'Customer clients need to reach Kong privately',
      direction: 'Customer → Kong',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'gcp-psc-egress',
      label: 'GCP PSC egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      direction: 'Kong → upstream',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'gcp-vpc-peering',
      label: 'VPC peering',
      useWhen: 'Full VPC-level routing',
      direction: 'Bidirectional',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Full VPC-level routing between networks.',
    },
  ],
  azure: [
    {
      type: 'azure-private-link-ingress',
      label: 'Private Link ingress',
      useWhen: 'Customer clients need to reach Kong privately',
      direction: 'Customer → Kong',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'azure-private-endpoint-egress',
      label: 'Private endpoint egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      direction: 'Kong → upstream',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'azure-vnet-peering',
      label: 'VNet peering',
      useWhen: 'Full VNet-level routing',
      direction: 'Bidirectional',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Full VNet-level routing between networks.',
    },
    {
      type: 'azure-virtual-hub',
      label: 'Virtual hub',
      useWhen: 'Hub-based routing across VNets',
      direction: 'Bidirectional',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Hub-based routing across VNets.',
    },
  ],
}

const methods = computed<Method[]>(() =>
  network.value ? methodsByCloud[network.value.cloud] || [] : [],
)

const selectedMethod = computed<Method | undefined>(() =>
  methods.value.find(m => m.type === selectedType.value),
)

const cancel = () => {
  router.push({ name: 'networks-detail', params: { id: networkId.value } })
}

const handleSubmit = async () => {
  if (!network.value || !selectedMethod.value) return
  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  const consumers = form.allowedAccounts.split('\n').map(s => s.trim()).filter(Boolean)
  const conn = store.addConnection({
    networkId: networkId.value,
    name: form.name.trim(),
    type: selectedMethod.value.type,
    family: selectedMethod.value.family,
    direction: selectedMethod.value.dir,
    cloud: network.value.cloud,
    allowedConsumers: consumers,
  })
  isSubmitting.value = false
  router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId: conn.id } })
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.context-banner {
  max-width: 720px;
}

.context-row {
  align-items: center;
  display: flex;
  gap: $kui-space-60;
  padding: $kui-space-30 $kui-space-0;

  .context-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    min-width: 140px;
  }

  .context-value {
    font-size: $kui-font-size-30;
  }
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.method-card {
  align-items: flex-start;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  cursor: pointer;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-50 $kui-space-60;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &.selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 2px $kui-color-border-primary-weak;
  }
}

.method-input {
  flex: 0 0 auto;
  margin: $kui-space-10 $kui-space-0 $kui-space-0;
}

.method-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: $kui-space-20;
}

.method-name {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.method-usewhen {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.method-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30;
  margin-top: $kui-space-10;
}

.method-tag {
  color: $kui-color-text-neutral-strong;
  font-size: $kui-font-size-20;

  &--dim { color: $kui-color-text-neutral; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  margin-bottom: $kui-space-60;

  &:last-child { margin-bottom: $kui-space-0; }
}

.field-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.step-actions {
  display: flex;
  gap: $kui-space-40;
}

.not-found { padding: $kui-space-80; }
</style>
