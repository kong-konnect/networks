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

        <!-- Requirements the customer must complete in their own cloud (Kong can't detect these) -->
        <section
          v-if="prerequisite"
          class="req-panel"
          data-testid="connection-prerequisites"
        >
          <div class="req-head">
            <h3 class="req-title">Requirements in your {{ network.cloud.toUpperCase() }} account</h3>
            <a class="req-docs" :href="DOCS_URL" target="_blank" rel="noopener">
              View documentation
              <ExternalLinkIcon :size="KUI_ICON_SIZE_20" decorative />
            </a>
          </div>
          <p class="req-summary">{{ prerequisite.summary }}</p>
          <ol class="req-steps">
            <li v-for="(s, i) in prerequisite.steps" :key="i">{{ s }}</li>
          </ol>
          <KCheckbox
            v-model="acknowledged"
            class="req-ack"
            data-testid="connection-ack"
          >
            {{ prerequisite.ackLabel }}
          </KCheckbox>
        </section>
      </template>
    </EntityFormBlock>

    <!-- Footer -->
    <div class="step-actions">
      <KButton
        appearance="primary"
        :disabled="!selectedMethod || !form.name.trim() || isSubmitting || (!!prerequisite && !acknowledged)"
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
import { ref, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  KButton,
  KCard,
  KCheckbox,
  KEmptyState,
  KInput,
  KLabel,
  KTextArea,
} from '@kong/kongponents'
import { ExternalLinkIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
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
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'aws-rep-egress',
      label: 'Resource endpoint egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'aws-vpc-peering',
      label: 'VPC peering',
      useWhen: 'Full VPC-level routing',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Full VPC-level routing between networks.',
    },
    {
      type: 'aws-transit-gateway',
      label: 'Transit Gateway',
      useWhen: 'Hub-based routing across VPCs',
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
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'gcp-psc-egress',
      label: 'GCP PSC egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'gcp-vpc-peering',
      label: 'VPC peering',
      useWhen: 'Full VPC-level routing',
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
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'ingress',
      formHelp: 'Customer clients reach Kong privately.',
    },
    {
      type: 'azure-private-endpoint-egress',
      label: 'Private endpoint egress',
      useWhen: 'Kong needs to reach customer upstreams privately',
      scope: 'Service-level',
      family: 'private-endpoint',
      dir: 'egress',
      formHelp: 'Kong reaches customer upstreams privately.',
    },
    {
      type: 'azure-vnet-peering',
      label: 'VNet peering',
      useWhen: 'Full VNet-level routing',
      scope: 'Network-level',
      family: 'peering',
      dir: 'egress',
      formHelp: 'Full VNet-level routing between networks.',
    },
    {
      type: 'azure-virtual-hub',
      label: 'Virtual hub',
      useWhen: 'Hub-based routing across VNets',
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

// Every private connection needs a step the customer takes in THEIR cloud account —
// Kong can't detect it, so we surface the steps + require an acknowledgement before
// creating (so the provisioning pipeline knows to proceed). Keyed by method.
const DOCS_URL = 'https://docs.konghq.com/konnect/gateway-manager/dedicated-cloud-gateways/'
interface Prerequisite {
  summary: string
  steps: string[]
  ackLabel: string
}
const prerequisitesByType: Partial<Record<ConnectionType, Prerequisite>> = {
  'aws-rep-ingress': {
    summary: 'Customer clients reach Kong through an AWS resource endpoint you accept.',
    steps: [
      'Kong creates an AWS RAM resource share for this endpoint.',
      'In your AWS account, open Resource Access Manager and accept the share.',
      'Create a VPC endpoint from the shared resource in the subnets your clients use.',
    ],
    ackLabel: 'I understand I\'ll accept the RAM resource share and create the endpoint in my AWS account.',
  },
  'aws-rep-egress': {
    summary: 'Kong reaches your upstream through a resource configuration you share.',
    steps: [
      'Create a resource configuration for your upstream service in AWS.',
      'Share it with Kong\'s account through AWS Resource Access Manager.',
    ],
    ackLabel: 'I understand I\'ll create and share the upstream resource configuration in my AWS account.',
  },
  'aws-vpc-peering': {
    summary: 'Kong requests a VPC peering connection you accept and route.',
    steps: [
      'Kong sends a VPC peering request to your account.',
      'Accept the peering request in your AWS account.',
      'Add routes to Kong\'s CIDR in the relevant route tables.',
    ],
    ackLabel: 'I understand I\'ll accept the peering request and add routes in my AWS account.',
  },
  'aws-transit-gateway': {
    summary: 'Kong shares a Transit Gateway attachment you accept and associate.',
    steps: [
      'Accept the Transit Gateway attachment shared to your account.',
      'Associate it with your Transit Gateway route table and add routes to Kong\'s CIDR.',
    ],
    ackLabel: 'I understand I\'ll accept the Transit Gateway attachment and configure routing in my AWS account.',
  },
  'gcp-psc-ingress': {
    summary: 'Customer clients reach Kong through a Private Service Connect endpoint.',
    steps: [
      'Kong publishes a PSC service attachment.',
      'Create a PSC endpoint targeting it in your VPC.',
    ],
    ackLabel: 'I understand I\'ll create the Private Service Connect endpoint in my GCP project.',
  },
  'gcp-psc-egress': {
    summary: 'Kong reaches your upstream through a service attachment you publish.',
    steps: [
      'Publish a PSC service attachment for your upstream.',
      'Allow Kong\'s project to connect to it.',
    ],
    ackLabel: 'I understand I\'ll publish the service attachment and allow Kong\'s project in GCP.',
  },
  'gcp-vpc-peering': {
    summary: 'Kong requests VPC peering you accept.',
    steps: [
      'Accept the VPC peering request in your GCP project.',
      'Confirm route exchange for Kong\'s CIDR.',
    ],
    ackLabel: 'I understand I\'ll accept the peering request in my GCP project.',
  },
  'azure-private-link-ingress': {
    summary: 'Customer clients reach Kong through a Private Link connection you approve.',
    steps: [
      'Kong creates a Private Link service.',
      'Create a private endpoint and approve the connection in your subscription.',
    ],
    ackLabel: 'I understand I\'ll create the private endpoint and approve the connection in my Azure subscription.',
  },
  'azure-private-endpoint-egress': {
    summary: 'Kong reaches your upstream through a Private Link service you publish.',
    steps: [
      'Publish a Private Link service for your upstream.',
      'Approve Kong\'s private endpoint connection.',
    ],
    ackLabel: 'I understand I\'ll publish the Private Link service and approve Kong\'s connection in Azure.',
  },
  'azure-vnet-peering': {
    summary: 'Kong requests VNet peering you accept.',
    steps: [
      'Accept the VNet peering in your subscription.',
      'Confirm gateway transit and routing settings.',
    ],
    ackLabel: 'I understand I\'ll accept the VNet peering in my Azure subscription.',
  },
  'azure-virtual-hub': {
    summary: 'Kong connects to your Virtual WAN hub you authorize.',
    steps: [
      'Authorize the hub connection in your Virtual WAN.',
      'Confirm routing to Kong\'s CIDR.',
    ],
    ackLabel: 'I understand I\'ll authorize the hub connection in my Azure Virtual WAN.',
  },
}

const prerequisite = computed<Prerequisite | undefined>(() =>
  selectedType.value ? prerequisitesByType[selectedType.value] : undefined,
)

// Acknowledgement resets whenever the method changes.
const acknowledged = ref(false)
watch(selectedType, () => { acknowledged.value = false })

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

// Customer-side requirements + acknowledgement (Kong can't detect these steps).
.req-panel {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  padding: $kui-space-70;
}

.req-head {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.req-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  margin: $kui-space-0;
}

.req-docs {
  align-items: center;
  color: $kui-color-text-primary;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  text-decoration: none;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
}

.req-summary {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.req-steps {
  color: $kui-color-text;
  display: flex;
  flex-direction: column;
  font-size: $kui-font-size-30;
  gap: $kui-space-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
  padding-left: $kui-space-70;
}

.req-ack {
  border-top: $kui-border-width-10 solid $kui-color-border;
  padding-top: $kui-space-50;
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
