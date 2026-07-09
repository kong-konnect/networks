<template>
  <PageLayout
    title="New network"
    :back-to="{ name: 'networks-list' }"
  >
    <div class="network-create">
      <KStepper
        :steps="steps"
        :current-step-index="currentStep"
      />

      <!-- Step 0: Before you begin -->
      <div v-if="currentStep === 0" class="step-content">
        <KCard title="Before you begin">
          <div class="orientation-content">
            <p>A <strong>network</strong> is a private, isolated network hosted by Kong that connects your cloud environment to Kong Gateway. It enables private connectivity without exposing traffic to the public internet.</p>

            <h3>What to know before creating a network</h3>
            <ul>
              <li><strong>Provisioning takes time.</strong> Creating a network takes 45 minutes or more. Plan accordingly.</li>
              <li><strong>Region is permanent.</strong> You cannot change a network's region after creation. Choose carefully.</li>
              <li><strong>CIDR is permanent.</strong> The IP address range (CIDR) cannot be changed after creation. If it overlaps with your existing infrastructure, you will need to delete and recreate the network.</li>
              <li><strong>Cost.</strong> Networks incur charges while running. Delete unused networks to avoid unnecessary spend.</li>
            </ul>

            <h3>What happens after you create a network</h3>
            <ol>
              <li>Kong provisions the network infrastructure in your chosen region (45+ minutes).</li>
              <li>You can attach API gateways to the network.</li>
              <li>You can configure private connections to allow traffic between your cloud and Kong.</li>
            </ol>
          </div>
        </KCard>
        <div class="step-actions">
          <KButton appearance="primary" @click="currentStep = 1">I understand, continue</KButton>
        </div>
      </div>

      <!-- Step 1: Cloud and regions -->
      <div v-if="currentStep === 1" class="step-content">
        <KCard title="Cloud provider and regions">
          <div class="form-group">
            <KLabel>Cloud provider</KLabel>
            <div class="cloud-radio-group">
              <label
                v-for="cloud in cloudOptions"
                :key="cloud.value"
                class="cloud-radio-card"
                :class="{ selected: form.cloud === cloud.value }"
              >
                <input
                  v-model="form.cloud"
                  type="radio"
                  :value="cloud.value"
                  class="cloud-radio-input"
                  @change="form.regions = [{ region: '', cidr: '' }]"
                >
                <span class="cloud-radio-label">{{ cloud.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <KLabel>Regions</KLabel>
            <p class="field-help">Add one or more regions. Each region requires a unique CIDR block.</p>

            <div
              v-for="(regionEntry, idx) in form.regions"
              :key="idx"
              class="region-row"
            >
              <KSelect
                v-model="form.regions[idx].region"
                :items="regionOptionsForCloud"
                :placeholder="'Select region'"
                class="region-select"
              />
              <KInput
                v-model="form.regions[idx].cidr"
                class="cidr-input"
                placeholder="e.g., 10.0.0.0/16"
                :error="!!cidrErrors[idx]"
                :error-message="cidrErrors[idx]"
                @update:model-value="validateCidr(idx)"
              />
              <KButton
                v-if="form.regions.length > 1"
                appearance="tertiary"
                @click="removeRegion(idx)"
              >
                <TrashIcon decorative />
              </KButton>
            </div>

            <KButton appearance="tertiary" @click="addRegion">
              <AddIcon decorative />
              Add another region
            </KButton>
          </div>
        </KCard>
        <div class="step-actions">
          <KButton appearance="tertiary" @click="currentStep = 0">Back</KButton>
          <KButton appearance="primary" :disabled="!step1Valid" @click="currentStep = 2">Continue</KButton>
        </div>
      </div>

      <!-- Step 2: Name -->
      <div v-if="currentStep === 2" class="step-content">
        <KCard title="Network name">
          <div class="form-group">
            <KLabel>Name</KLabel>
            <p class="field-help">Choose a unique name for this network. Names must be unique within your organization, region, and cloud provider.</p>
            <KInput
              v-model="form.name"
              placeholder="e.g., aws-us-east-prod"
              :error="nameError !== ''"
              :error-message="nameError"
              @update:model-value="validateName"
            />
          </div>
        </KCard>
        <div class="step-actions">
          <KButton appearance="tertiary" @click="currentStep = 1">Back</KButton>
          <KButton appearance="primary" :disabled="!step2Valid" @click="currentStep = 3">Continue</KButton>
        </div>
      </div>

      <!-- Step 3: Private connectivity (optional) -->
      <div v-if="currentStep === 3" class="step-content">
        <KCard title="Private connectivity (optional)">
          <p class="field-help">
            Queue connections to be created automatically once your network is ready.
            You can also skip this and add connections later.
          </p>

          <div
            v-for="(qc, idx) in form.queuedConnections"
            :key="idx"
            class="queued-connection-card"
          >
            <div class="queued-connection-header">
              <span class="queued-connection-title">{{ formatConnectionType(qc.type) || 'New connection' }}</span>
              <KButton appearance="tertiary" @click="removeQueuedConnection(idx)">
                <TrashIcon decorative />
                Remove
              </KButton>
            </div>
            <div class="form-group">
              <KLabel>Connection type</KLabel>
              <KSelect
                v-model="form.queuedConnections[idx].type"
                :items="connectionTypeOptions"
                placeholder="Select type"
              />
            </div>
            <div class="form-group">
              <KLabel>Name</KLabel>
              <KInput v-model="form.queuedConnections[idx].name" placeholder="e.g., my-vpc-peer" />
            </div>
            <div class="form-group">
              <KLabel>Allowed consumers</KLabel>
              <p class="field-help">Enter one consumer identifier per line (e.g., AWS account ID, GCP project).</p>
              <KTextArea
                :model-value="form.queuedConnections[idx].allowedConsumers.join('\n')"
                :rows="3"
                placeholder="One consumer per line"
                @update:model-value="(v: string) => form.queuedConnections[idx].allowedConsumers = v.split('\n').map((s: string) => s.trim()).filter(Boolean)"
              />
            </div>
          </div>

          <KButton appearance="tertiary" @click="addQueuedConnection">
            <AddIcon decorative />
            Add a connection
          </KButton>
        </KCard>
        <div class="step-actions">
          <KButton appearance="tertiary" @click="currentStep = 2">Back</KButton>
          <KButton appearance="tertiary" @click="currentStep = 4">Skip</KButton>
          <KButton appearance="primary" @click="currentStep = 4">Continue</KButton>
        </div>
      </div>

      <!-- Step 4: Review -->
      <div v-if="currentStep === 4" class="step-content">
        <KCard title="Review">
          <div class="review-section">
            <h3 class="review-section-title">Cloud and regions</h3>
            <div class="review-row">
              <span class="review-label">Cloud</span>
              <KBadge :appearance="cloudBadgeAppearance(form.cloud)">{{ form.cloud.toUpperCase() }}</KBadge>
            </div>
            <div
              v-for="r in form.regions"
              :key="r.region"
              class="review-row"
            >
              <span class="review-label">Region</span>
              <span>{{ r.region }} — <code>{{ r.cidr }}</code></span>
            </div>
          </div>

          <div class="review-section">
            <h3 class="review-section-title">Name</h3>
            <div class="review-row">
              <span class="review-label">Name</span>
              <span>{{ form.name }}</span>
            </div>
          </div>

          <div v-if="form.queuedConnections.length > 0" class="review-section">
            <h3 class="review-section-title">Queued connections</h3>
            <div
              v-for="qc in form.queuedConnections"
              :key="qc.type"
              class="review-row"
            >
              <span class="review-label">{{ formatConnectionType(qc.type) }}</span>
              <span>{{ qc.name }}</span>
            </div>
          </div>

          <KAlert
            appearance="info"
            message="Provisioning takes 45 minutes or more. The network will appear as 'Initialising' until it is ready."
          />
        </KCard>
        <div class="step-actions">
          <KButton appearance="tertiary" @click="currentStep = 3">Back</KButton>
          <KButton appearance="primary" :disabled="isSubmitting" @click="handleCreate">
            Create network
          </KButton>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  AddIcon,
  TrashIcon,
} from '@kong/icons'
import {
  KAlert,
  KBadge,
  KButton,
  KCard,
  KInput,
  KLabel,
  KSelect,
  KStepper,
  KTextArea,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { CloudProvider, ConnectionType } from '@/types'

const router = useRouter()
const store = useNetworksStore()

const currentStep = ref(0)
const isSubmitting = ref(false)
const nameError = ref('')

const steps = [
  { label: 'Before you begin' },
  { label: 'Cloud and regions' },
  { label: 'Name' },
  { label: 'Private connectivity' },
  { label: 'Review' },
]

const form = reactive({
  cloud: 'aws' as CloudProvider,
  regions: [{ region: '', cidr: '' }],
  name: '',
  queuedConnections: [] as { type: ConnectionType; name: string; allowedConsumers: string[] }[],
})

const cidrErrors = reactive<Record<number, string>>({})

const cloudOptions = [
  { label: 'AWS', value: 'aws' },
  { label: 'GCP', value: 'gcp' },
  { label: 'Azure', value: 'azure' },
]

const awsRegions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1']
const gcpRegions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'europe-west4', 'asia-east1', 'asia-southeast1']
const azureRegions = ['eastus', 'eastus2', 'westus', 'westus2', 'westeurope', 'northeurope', 'southeastasia']

const regionOptionsForCloud = computed(() => {
  const regMap: Record<CloudProvider, string[]> = {
    aws: awsRegions,
    gcp: gcpRegions,
    azure: azureRegions,
  }
  return (regMap[form.cloud] || []).map(r => ({ label: r, value: r }))
})

const connectionTypesByCloud: Record<CloudProvider, ConnectionType[]> = {
  aws: ['aws-vpc-peering', 'aws-transit-gateway', 'aws-rep-ingress', 'aws-rep-egress'],
  gcp: ['gcp-vpc-peering', 'gcp-psc-ingress', 'gcp-psc-egress'],
  azure: ['azure-vnet-peering', 'azure-virtual-hub', 'azure-private-link-ingress', 'azure-private-endpoint-egress'],
}

const connectionTypeOptions = computed(() =>
  (connectionTypesByCloud[form.cloud] || []).map(t => ({
    label: formatConnectionType(t),
    value: t,
  })),
)

const validateCidr = (idx: number) => {
  const cidr = form.regions[idx]?.cidr || ''
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  if (!cidr) {
    cidrErrors[idx] = 'CIDR is required.'
    return
  }
  if (!cidrRegex.test(cidr)) {
    cidrErrors[idx] = 'Must be a valid CIDR notation (e.g., 10.0.0.0/16).'
    return
  }
  // Check for overlap with existing networks
  const existingCidrs = store.getNetworks().flatMap(n => n.regions.map(r => r.cidr))
  if (existingCidrs.includes(cidr)) {
    cidrErrors[idx] = 'This CIDR overlaps with an existing network.'
    return
  }
  delete cidrErrors[idx]
}

const validateName = () => {
  const name = form.name.trim()
  if (!name) {
    nameError.value = 'Name is required.'
    return
  }
  const exists = store.getNetworks().some(n => n.name === name)
  if (exists) {
    nameError.value = 'A network with this name already exists.'
    return
  }
  nameError.value = ''
}

const step1Valid = computed(() => {
  return form.cloud &&
    form.regions.every(r => r.region && r.cidr) &&
    Object.keys(cidrErrors).length === 0
})

const step2Valid = computed(() => form.name.trim() !== '' && nameError.value === '')

const addRegion = () => {
  form.regions.push({ region: '', cidr: '' })
}

const removeRegion = (idx: number) => {
  form.regions.splice(idx, 1)
  delete cidrErrors[idx]
}

const addQueuedConnection = () => {
  form.queuedConnections.push({
    type: connectionTypesByCloud[form.cloud][0],
    name: '',
    allowedConsumers: [],
  })
}

const removeQueuedConnection = (idx: number) => {
  form.queuedConnections.splice(idx, 1)
}

const formatConnectionType = (type: ConnectionType | ''): string => {
  if (!type) return ''
  const labels: Record<ConnectionType, string> = {
    'aws-vpc-peering': 'AWS VPC Peering',
    'aws-transit-gateway': 'AWS Transit Gateway',
    'aws-rep-egress': 'AWS REP Egress',
    'aws-rep-ingress': 'AWS REP Ingress',
    'gcp-vpc-peering': 'GCP VPC Peering',
    'gcp-psc-ingress': 'GCP PSC Ingress',
    'gcp-psc-egress': 'GCP PSC Egress',
    'azure-vnet-peering': 'Azure VNET Peering',
    'azure-virtual-hub': 'Azure Virtual Hub',
    'azure-private-link-ingress': 'Azure Private Link Ingress',
    'azure-private-endpoint-egress': 'Azure Private Endpoint Egress',
  }
  return labels[type] || type
}

const cloudBadgeAppearance = (cloud: string) => {
  if (cloud === 'aws') return 'warning'
  if (cloud === 'gcp') return 'info'
  if (cloud === 'azure') return 'decorative-purple'
  return 'neutral'
}

const handleCreate = async () => {
  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 400))
  store.createNetwork({
    name: form.name.trim(),
    cloud: form.cloud,
    regions: form.regions.filter(r => r.region && r.cidr),
    queuedConnections: form.queuedConnections.filter(qc => qc.type && qc.name),
  })
  isSubmitting.value = false
  router.push({ name: 'networks-list' })
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.network-create {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  max-width: 720px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.step-actions {
  display: flex;
  gap: $kui-space-40;
}

.orientation-content {
  p {
    color: $kui-color-text-neutral;
    line-height: $kui-line-height-40;
    margin: $kui-space-0 $kui-space-0 $kui-space-50;
  }

  h3 {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-70 $kui-space-0 $kui-space-40;
  }

  ul, ol {
    color: $kui-color-text-neutral;
    line-height: $kui-line-height-50;
    padding-left: $kui-space-80;
  }

  li { margin-bottom: $kui-space-30; }
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
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.cloud-radio-group {
  display: flex;
  gap: $kui-space-40;
}

.cloud-radio-card {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  cursor: pointer;
  display: flex;
  gap: $kui-space-30;
  padding: $kui-space-50 $kui-space-60;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &.selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 2px $kui-color-border-primary-weak;
  }

  .cloud-radio-input { margin: $kui-space-0; }
  .cloud-radio-label { font-weight: $kui-font-weight-medium; }
}

.region-row {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-40;

  .region-select { flex: 1; }
  .cidr-input { flex: 1; }
}

.queued-connection-card {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  margin-bottom: $kui-space-50;
  padding: $kui-space-60;

  .queued-connection-header {
    align-items: center;
    display: flex;
    justify-content: space-between;

    .queued-connection-title {
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-semibold;
    }
  }
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  margin-bottom: $kui-space-60;
  padding-bottom: $kui-space-60;

  &:not(:last-of-type) {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }

  .review-section-title {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-0 $kui-space-0 $kui-space-20;
    text-transform: uppercase;
  }

  .review-row {
    align-items: center;
    display: flex;
    font-size: $kui-font-size-30;
    gap: $kui-space-60;

    .review-label {
      color: $kui-color-text-neutral;
      min-width: 120px;
    }

    code {
      background-color: $kui-color-background-neutral-weakest;
      border-radius: $kui-border-radius-20;
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-20;
      padding: $kui-space-10 $kui-space-20;
    }
  }
}
</style>
