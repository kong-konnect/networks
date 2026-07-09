<template>
  <PageLayout
    :breadcrumbs="cpBreadcrumbs"
    :title="controlPlaneName"
  >
    <!-- Control plane tab navigation -->
    <PageLayoutTabs :tabs="cpTabs" />

    <div
      class="gateway-create"
      data-testid="gateway-create"
    >
      <h2 class="dp-create-heading">Create a data plane node</h2>

      <!-- Step 1 — Configure data plane nodes -->
      <EntityFormBlock
        :step="1"
        title="Configure data plane nodes"
        description="Select where your data plane node should run."
        data-testid="network-config-container"
      >
        <!-- LOCATION FIRST: provider + region come first -->
        <div
          v-if="flow === 'location'"
          class="loc-fields"
        >
          <div class="form-group">
            <KLabel :required="true">Provider</KLabel>
            <KSelect
              v-model="loc.provider"
              :items="providerOptions"
              data-testid="loc-provider"
              width="100%"
              @change="onLocProviderChange"
            />
          </div>
          <div class="form-group">
            <KLabel :required="true">Region</KLabel>
            <KSelect
              v-model="loc.region"
              :items="locRegionOptions"
              data-testid="loc-region"
              placeholder="Select a region"
              width="100%"
              @change="loc.choice = ''"
            />
          </div>
        </div>

        <!-- Mode choice (shared) -->
        <div
          v-if="flow === 'network' || (flow === 'location' && loc.region)"
          class="network-mode-group"
          role="radiogroup"
          aria-label="Choose how to attach a network"
        >
          <label
            class="network-mode-card"
            :class="{ selected: mode === 'existing' }"
            data-testid="network-mode-existing"
          >
            <input
              v-model="mode"
              type="radio"
              value="existing"
              class="network-mode-input"
              name="network-mode"
            >
            <div class="network-mode-body">
              <span class="network-mode-title">Use an existing network</span>
              <span class="network-mode-subheading">Select a ready network. Provider, region, zones, and CIDR are inherited.</span>
            </div>
          </label>
          <label
            class="network-mode-card"
            :class="{ selected: mode === 'new' }"
            data-testid="network-mode-new"
          >
            <input
              v-model="mode"
              type="radio"
              value="new"
              class="network-mode-input"
              name="network-mode"
            >
            <div class="network-mode-body">
              <span class="network-mode-title">Create a new network</span>
              <span class="network-mode-subheading">Define a network when this node needs a different location, zones, or CIDR.</span>
            </div>
          </label>
        </div>

        <!-- Prompt to choose a region first (location-first only) -->
        <p
          v-if="flow === 'location' && !loc.region"
          class="field-help"
          data-testid="loc-region-hint"
        >
          Select a provider and region to see the networks available in that location.
        </p>

        <!-- EXISTING NETWORK -->
        <template v-if="showBody && mode === 'existing'">
          <KAlert
            v-if="visibleNetworks.length === 0 && !searchQuery"
            appearance="info"
            class="network-notice"
            data-testid="network-empty-state"
          >
            <template #default>
              {{ flow === 'location'
                ? `You have no networks in ${loc.region} yet. Create one to continue.`
                : 'You have no networks yet. Create a new network to continue.' }}
            </template>
          </KAlert>

          <template v-else>
            <KInput
              v-if="flow === 'network'"
              v-model.trim="searchQuery"
              class="network-search"
              data-testid="network-search"
              placeholder="Search networks by name, provider, region, or CIDR"
              type="search"
            >
              <template #before>
                <SearchIcon decorative />
              </template>
            </KInput>

            <div
              class="network-list"
              role="radiogroup"
              aria-label="Select a network"
            >
              <p
                v-if="visibleNetworks.length === 0"
                class="field-help"
                data-testid="network-no-results"
              >
                No networks match your search.
              </p>

              <label
                v-for="net in visibleNetworks"
                :key="net.id"
                class="network-row"
                :class="{ selected: selectedId === net.id, disabled: !isSelectable(net) }"
                :data-testid="`network-option-${net.id}`"
              >
                <input
                  v-model="selectedId"
                  type="radio"
                  :value="net.id"
                  class="network-row-input"
                  name="network-selection"
                  :disabled="!isSelectable(net)"
                >
                <div class="network-row-body">
                  <div class="network-row-header">
                    <span class="network-row-name">{{ net.name }}</span>
                    <KBadge :appearance="cloudBadgeAppearance(net.cloud)">{{ net.cloud.toUpperCase() }}</KBadge>
                    <KBadge :appearance="statusAppearance(net.status)">{{ statusLabel(net.status) }}</KBadge>
                  </div>
                  <div class="network-row-meta">{{ networkMeta(net) }}</div>
                </div>
              </label>
            </div>

            <!-- Resolved selection summary -->
            <div
              v-if="selectedNetwork"
              class="network-summary"
              data-testid="network-summary"
            >
              <span class="network-summary-label">Selected network</span>
              <span class="network-summary-value">{{ describeNetwork(selectedNetwork) }}</span>
            </div>
          </template>

          <!-- Toggle to create-new -->
          <div class="mode-toggle-row">
            <KButton
              appearance="tertiary"
              data-testid="switch-to-new"
              @click="mode = 'new'"
            >
              <AddIcon decorative />
              Create a new network instead
            </KButton>
            <span class="mode-toggle-note">Provider, region, zones, and CIDR come from the selected or created network.</span>
          </div>
        </template>

        <!-- NEW NETWORK -->
        <template v-else-if="showBody && mode === 'new'">
          <div class="new-network-form">
            <div class="new-network-grid">
              <div
                v-if="flow === 'network'"
                class="form-group"
              >
                <KLabel :required="true">Provider</KLabel>
                <KSelect
                  v-model="newNet.provider"
                  :items="providerOptions"
                  data-testid="new-network-provider"
                  width="100%"
                  @change="onNewProviderChange"
                />
              </div>
              <div
                v-if="flow === 'network'"
                class="form-group"
              >
                <KLabel :required="true">Region</KLabel>
                <KSelect
                  v-model="newNet.region"
                  :items="newRegionOptions"
                  data-testid="new-network-region"
                  placeholder="Select a region"
                  width="100%"
                  @change="onNewRegionChange"
                />
              </div>
              <div class="form-group">
                <KLabel :required="true">Network name</KLabel>
                <KInput
                  v-model.trim="newNet.name"
                  data-testid="new-network-name"
                  placeholder="Enter a unique name"
                  width="100%"
                />
              </div>
              <div class="form-group">
                <KLabel :required="true">CIDR for Dedicated Cloud</KLabel>
                <KInput
                  v-model.trim="newNet.cidr"
                  data-testid="new-network-cidr"
                  placeholder="e.g., 10.0.0.0/16"
                  width="100%"
                />
              </div>
            </div>

            <p
              v-if="newNameError"
              class="field-error"
              data-testid="new-network-name-error"
            >
              {{ newNameError }}
            </p>
            <p
              v-if="newCidrError"
              class="field-error"
              data-testid="new-network-cidr-error"
            >
              {{ newCidrError }}
            </p>

            <div class="form-group">
              <KLabel>Zone placement</KLabel>
              <KMultiselect
                v-model="newNet.zones"
                :items="zoneOptions"
                data-testid="new-network-zones"
                :placeholder="effectiveNewRegion ? 'Select zones' : 'Select a region first'"
                width="100%"
              />
            </div>

            <!-- Resolved new-network summary -->
            <div
              v-if="newNetworkValid"
              class="network-summary"
              data-testid="network-summary"
            >
              <span class="network-summary-label">New network</span>
              <span class="network-summary-value">{{ describeNewNetwork() }}</span>
            </div>

            <KAlert
              appearance="warning"
              class="network-notice"
              data-testid="new-network-warning"
            >
              <template #default>
                Network provisioning can take at least 45 minutes. Data plane node creation continues after the network is ready.
              </template>
            </KAlert>
          </div>

          <!-- Toggle back to existing -->
          <div class="mode-toggle-row">
            <KButton
              appearance="tertiary"
              data-testid="switch-to-existing"
              @click="mode = 'existing'"
            >
              Use an existing network instead
            </KButton>
            <span class="mode-toggle-note">Provider, region, zones, and CIDR come from the selected or created network.</span>
          </div>
        </template>
      </EntityFormBlock>

      <!-- Step 2 — API access -->
      <EntityFormBlock
        :step="2"
        title="API access"
        description="Tell us how you'll access your APIs so we can configure your cluster properly."
        data-testid="api-access-container"
      >
        <div class="form-group">
          <KLabel>Access</KLabel>
          <KSelect
            v-model="apiAccess"
            :items="apiAccessOptions"
            data-testid="api-access-select"
            width="100%"
          />
          <p
            v-if="effectiveProvider === 'gcp'"
            class="field-help"
            data-testid="api-access-gcp-note"
          >
            Private API access is not available on GCP. This gateway uses public access.
          </p>
        </div>
      </EntityFormBlock>

      <!-- Step 3 — Gateway configuration -->
      <EntityFormBlock
        :step="3"
        title="Gateway configuration"
        data-testid="gateway-config-container"
      >
        <div class="form-group">
          <KLabel>Gateway version</KLabel>
          <KSelect
            v-model="gatewayVersion"
            :items="versionOptions"
            data-testid="gateway-version"
            width="100%"
          />
          <p class="field-help">Use the latest version for new features. Older versions are available for compatibility.</p>
          <KButton
            appearance="tertiary"
            class="advanced-toggle"
            data-testid="advanced-toggle"
            @click="showAdvanced = !showAdvanced"
          >
            <component :is="showAdvanced ? ChevronDownIcon : ChevronRightIcon" decorative />
            {{ showAdvanced ? 'Hide advanced configuration' : 'Show advanced configuration' }}
          </KButton>
          <p
            v-if="showAdvanced"
            class="field-help"
            data-testid="advanced-note"
          >
            Advanced configuration (autoscaling, custom environment variables) is defined by the API contract and out of scope for this prototype.
          </p>
        </div>
      </EntityFormBlock>

      <!-- Page footer -->
      <div
        class="gateway-create-footer"
        data-testid="gateway-create-footer"
      >
        <KButton
          appearance="primary"
          :disabled="!canSubmit"
          data-testid="runtimes-save-button"
          @click="handleSubmit"
        >
          Create data plane node
        </KButton>
        <KButton
          appearance="tertiary"
          data-testid="runtimes-cancel-button"
          @click="handleCancel"
        >
          Cancel
        </KButton>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  SearchIcon,
  AddIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@kong/icons'
import {
  KInput,
  KLabel,
  KSelect,
  KMultiselect,
  KBadge,
  KButton,
  KAlert,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import PageLayoutTabs from '@/components/PageLayoutTabs.vue'
import EntityFormBlock from '@/components/EntityFormBlock.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import { useStateSwitcher } from '@/composables/useStateSwitcher'
import type { CloudProvider, Network, NetworkStatus } from '@/types'

const router = useRouter()
const store = useNetworksStore()

// Control plane context — this page lives inside a control plane's detail.
const controlPlaneName = 'Production-API-Gateway'

const cpBreadcrumbs = [
  { key: 'api-gateway', text: 'API Gateway' },
  { key: 'control-planes', text: 'Control planes' },
]

const cpTabs = [
  { key: 'overview', label: 'Overview', to: '#' },
  { key: 'data-plane-nodes', label: 'Data plane nodes', to: '#', active: true },
  { key: 'workspaces', label: 'Workspaces', to: '#' },
  { key: 'control-plane-logs', label: 'Control plane logs', to: '#' },
  { key: 'networks', label: 'Networks', to: '#' },
  { key: 'custom-domains', label: 'Custom domains', to: '#' },
  { key: 'gateway-services', label: 'Gateway services', to: '#' },
  { key: 'routes', label: 'Routes', to: '#' },
  { key: 'consumers', label: 'Consumers', to: '#' },
  { key: 'plugins', label: 'Plugins', to: '#' },
  { key: 'redis', label: 'Redis', to: '#' },
  { key: 'upstreams', label: 'Upstreams', to: '#' },
  { key: 'certificates', label: 'Certificates', to: '#' },
  { key: 'vaults', label: 'Vaults', to: '#' },
  { key: 'keys', label: 'Keys', to: '#' },
  { key: 'bot-detector', label: 'Bot Detector', to: '#' },
]

// ── Shared form state ─────────────────────────────────────────────────────────
const apiAccess = ref('public')
const gatewayVersion = ref('cloud-rapid')
const showAdvanced = ref(false)
const flow = ref<'network' | 'location'>('network')
const mode = ref<'existing' | 'new'>('existing')
const searchQuery = ref('')
const selectedId = ref('')

// This is a prototype concept switch (two directions to explore), not a product
// control — expose it through the floating StateSwitcher rather than in-page UI.
const { register } = useStateSwitcher()
register(
  [
    { key: 'network', label: 'Network first' },
    { key: 'location', label: 'Location first' },
  ],
  flow.value,
  (value) => { flow.value = value as 'network' | 'location' },
  'DP node network model',
)

// Location-first provider/region
const loc = reactive({
  provider: 'aws' as CloudProvider,
  region: '',
  choice: '',
})

// New-network form
const newNet = reactive({
  provider: 'aws' as CloudProvider,
  region: '',
  name: '',
  cidr: '',
  zones: [] as string[],
})

// ── Region metadata (display label + availability zones) ─────────────────────
const REGION_META: Record<string, { label: string, zones: string[] }> = {
  'us-east-1': { label: 'N. Virginia', zones: ['use1-az1', 'use1-az2', 'use1-az4'] },
  'us-east-2': { label: 'Ohio', zones: ['use2-az1', 'use2-az2', 'use2-az3'] },
  'us-west-1': { label: 'N. California', zones: ['usw1-az1', 'usw1-az3'] },
  'us-west-2': { label: 'Oregon', zones: ['usw2-az1', 'usw2-az2', 'usw2-az3'] },
  'eu-west-1': { label: 'Ireland', zones: ['euw1-az1', 'euw1-az2', 'euw1-az3'] },
  'ap-southeast-1': { label: 'Singapore', zones: ['apse1-az1', 'apse1-az2', 'apse1-az3'] },
  'us-central1': { label: 'Iowa', zones: ['us-central1-a', 'us-central1-b', 'us-central1-c'] },
  'us-east1': { label: 'S. Carolina', zones: ['us-east1-b', 'us-east1-c', 'us-east1-d'] },
  'us-west1': { label: 'Oregon', zones: ['us-west1-a', 'us-west1-b', 'us-west1-c'] },
  'europe-west1': { label: 'Belgium', zones: ['europe-west1-b', 'europe-west1-c', 'europe-west1-d'] },
  'asia-southeast1': { label: 'Singapore', zones: ['asia-southeast1-a', 'asia-southeast1-b'] },
  eastus: { label: 'East US', zones: ['1', '2', '3'] },
  eastus2: { label: 'East US 2', zones: ['1', '2', '3'] },
  westus: { label: 'West US', zones: ['1', '2', '3'] },
  westeurope: { label: 'West Europe', zones: ['1', '2', '3'] },
  southeastasia: { label: 'Southeast Asia', zones: ['1', '2', '3'] },
}

const regionLabel = (code: string) => REGION_META[code]?.label ?? code
const regionZones = (code: string) => REGION_META[code]?.zones ?? []

// ── Options ─────────────────────────────────────────────────────────────────
const providerOptions = [
  { label: 'AWS', value: 'aws' },
  { label: 'GCP', value: 'gcp' },
  { label: 'Azure', value: 'azure' },
]

const regionsByProvider: Record<CloudProvider, string[]> = {
  aws: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  gcp: ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-southeast1'],
  azure: ['eastus', 'eastus2', 'westus', 'westeurope', 'southeastasia'],
}

const regionItems = (provider: CloudProvider) =>
  regionsByProvider[provider].map(r => ({ label: `${regionLabel(r)} (${r})`, value: r }))

const locRegionOptions = computed(() => regionItems(loc.provider))
const newRegionOptions = computed(() => regionItems(newNet.provider))

// In location-first, the new network's provider/region are the ones chosen above.
const effectiveNewProvider = computed<CloudProvider>(() => flow.value === 'location' ? loc.provider : newNet.provider)
const effectiveNewRegion = computed(() => flow.value === 'location' ? loc.region : newNet.region)

const zoneOptions = computed(() =>
  regionZones(effectiveNewRegion.value).map(z => ({ label: z, value: z })),
)

const apiAccessOptions = computed(() => {
  const opts = [{ label: 'Public', value: 'public' }]
  if (effectiveProvider.value !== 'gcp') opts.push({ label: 'Private', value: 'private' })
  return opts
})

const versionOptions = [
  { label: 'Cloud Gateway cloud-rapid (latest)', value: 'cloud-rapid' },
  { label: 'Cloud Gateway cloud-stable', value: 'cloud-stable' },
]

// ── Network sources ───────────────────────────────────────────────────────────
const allNetworks = computed<Network[]>(() => store.getSelectableNetworks())

// The networks shown in the existing list, scoped + searched per flow.
const visibleNetworks = computed<Network[]>(() => {
  let list = allNetworks.value
  if (flow.value === 'location') {
    list = list.filter(n => n.cloud === loc.provider && n.regions.some(r => r.region === loc.region))
  } else if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.cloud.toLowerCase().includes(q) ||
      n.regions.some(r => r.region.toLowerCase().includes(q) || r.cidr.toLowerCase().includes(q)),
    )
  }
  return list
})

const selectedNetwork = computed(() => allNetworks.value.find(n => n.id === selectedId.value))

// Show the existing/new body once there's enough context to (network-first: always; location-first: region chosen).
const showBody = computed(() => flow.value === 'network' || !!loc.region)

// A gateway can only attach to a ready network. Initialising ones are shown but disabled.
const isSelectable = (net: Network) => net.status === 'ready'

// ── Validation ────────────────────────────────────────────────────────────────
const cidrIsValid = (value: string) => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(value)
  return !!m && [m[1], m[2], m[3], m[4]].every(o => Number(o) <= 255) && Number(m[5]) <= 32
}
const nameClashes = (name: string, provider: CloudProvider, region: string) =>
  store.getNetworks().some(n => n.name === name && n.cloud === provider && n.regions.some(r => r.region === region))

const newNameError = computed(() =>
  newNet.name && nameClashes(newNet.name, effectiveNewProvider.value, effectiveNewRegion.value)
    ? 'A network with this name already exists in this region and provider.' : '',
)
const newCidrError = computed(() =>
  newNet.cidr && !cidrIsValid(newNet.cidr) ? 'Enter a valid CIDR block, for example 10.0.0.0/16.' : '',
)
const newNetworkValid = computed(() =>
  !!effectiveNewProvider.value && !!effectiveNewRegion.value &&
  !!newNet.name && !newNameError.value &&
  !!newNet.cidr && !newCidrError.value,
)

// ── Derived provider (drives API-access rules) ────────────────────────────────
const effectiveProvider = computed<CloudProvider | ''>(() => {
  if (mode.value === 'new') return effectiveNewProvider.value
  return selectedNetwork.value?.cloud ?? (flow.value === 'location' ? loc.provider : '')
})

watch(apiAccessOptions, (opts) => {
  if (!opts.some(o => o.value === apiAccess.value)) apiAccess.value = 'public'
})

// Reset zones when the effective region changes.
watch(effectiveNewRegion, () => { newNet.zones = [] })

// ── Submit ────────────────────────────────────────────────────────────────────
const canSubmit = computed(() => {
  if (!gatewayVersion.value) return false
  if (flow.value === 'location' && !loc.region) return false
  if (mode.value === 'new') return newNetworkValid.value
  return !!selectedNetwork.value && isSelectable(selectedNetwork.value)
})

// ── Display helpers ─────────────────────────────────────────────────────────
const cloudBadgeAppearance = (cloud: CloudProvider) =>
  cloud === 'aws' ? 'warning' : cloud === 'gcp' ? 'info' : cloud === 'azure' ? 'decorative-purple' : 'neutral'

const statusLabel = (status: NetworkStatus) =>
  status === 'ready' ? 'Ready' : status === 'initialising' ? 'Initialising' : status === 'error' ? 'Error' : 'Terminating'

const statusAppearance = (status: NetworkStatus) =>
  status === 'ready' ? 'success' : status === 'initialising' ? 'warning' : status === 'error' ? 'danger' : 'neutral'

const gatewayLabel = (net: Network) =>
  net.attachedGatewayCount === 0 ? 'No gateways attached'
    : net.attachedGatewayCount === 1 ? '1 gateway attached'
      : `${net.attachedGatewayCount} gateways attached`

// Meta line for a row: "N. Virginia · us-east-1 · 10.0.0.0/16 · use1-az1, use1-az2 · 2 gateways attached"
const networkMeta = (net: Network) => {
  const r = net.regions[0]
  const parts = [regionLabel(r.region), r.region, r.cidr]
  const zones = regionZones(r.region)
  if (zones.length) parts.push(zones.join(', '))
  parts.push(isSelectable(net) ? gatewayLabel(net) : 'Available after ready')
  return parts.join(' · ')
}

// Summary string: "aws-us-east · AWS · N. Virginia (us-east-1) · 10.0.0.0/16 · use1-az1, use1-az2 · 2 gateways attached"
const describeNetwork = (net: Network) => {
  const r = net.regions[0]
  const parts = [net.name, net.cloud.toUpperCase(), `${regionLabel(r.region)} (${r.region})`, r.cidr]
  const zones = regionZones(r.region)
  if (zones.length) parts.push(zones.join(', '))
  parts.push(gatewayLabel(net))
  return parts.join(' · ')
}

const describeNewNetwork = () => {
  const code = effectiveNewRegion.value
  const parts = [
    newNet.name,
    effectiveNewProvider.value.toUpperCase(),
    `${regionLabel(code)} (${code})`,
    newNet.cidr,
  ]
  if (newNet.zones.length) parts.push(newNet.zones.join(', '))
  return parts.join(' · ')
}

const onLocProviderChange = () => {
  loc.region = ''
  loc.choice = ''
  selectedId.value = ''
}
const onNewProviderChange = () => {
  newNet.region = ''
  newNet.zones = []
}
const onNewRegionChange = () => {
  newNet.zones = []
}

const handleCancel = () => {
  router.push({ name: 'networks-list' })
}

const handleSubmit = () => {
  if (mode.value === 'new' && newNetworkValid.value) {
    store.createNetwork({
      name: newNet.name,
      cloud: effectiveNewProvider.value,
      regions: [{ region: effectiveNewRegion.value, cidr: newNet.cidr }],
    })
  }
  router.push({ name: 'networks-list' })
}
</script>

<style scoped lang="scss">
.gateway-create {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
  padding-top: $kui-space-70;
}

.dp-create-heading {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-50;
  margin: $kui-space-0;
}

.flow-switcher {
  display: flex;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.field-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.field-error {
  color: $kui-color-text-danger;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.loc-fields {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: 1fr 1fr;
  margin-bottom: $kui-space-60;
}

// Existing vs. new choice
.network-mode-group {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: 1fr 1fr;
  margin-bottom: $kui-space-60;
}

.network-mode-card {
  align-items: flex-start;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  cursor: pointer;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-60;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &.selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 2px $kui-color-border-primary-weak;
  }
}

.network-mode-input {
  margin: $kui-space-10 $kui-space-0 $kui-space-0;
}

.network-mode-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: $kui-space-20;
}

.network-mode-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.network-mode-subheading {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
}

.network-search {
  margin-bottom: $kui-space-50;
  width: 100%;
}

.new-network-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.new-network-grid {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: 1fr 1fr;
}

// Selectable network list
.network-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.network-row {
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

  &.disabled {
    background-color: $kui-color-background-neutral-weakest;
    cursor: not-allowed;

    .network-row-name {
      opacity: 0.6;
    }
  }
}

.network-row-input {
  flex: 0 0 auto;
  margin: $kui-space-10 $kui-space-0 $kui-space-0;
}

.network-row-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: $kui-space-20;
  min-width: 0;
}

.network-row-header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;
}

.network-row-name {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.network-row-meta {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
}

// Resolved selection summary strip
.network-summary {
  align-items: baseline;
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-30;
  display: flex;
  gap: $kui-space-60;
  margin-top: $kui-space-50;
  padding: $kui-space-50 $kui-space-60;
}

.network-summary-label {
  color: $kui-color-text-neutral;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
}

.network-summary-value {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
}

// Mode toggle link row
.mode-toggle-row {
  align-items: center;
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  gap: $kui-space-60;
  justify-content: space-between;
  margin-top: $kui-space-60;
  padding-top: $kui-space-50;
}

.mode-toggle-note {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  text-align: right;
}

.network-notice {
  margin-top: $kui-space-0;
}

.advanced-toggle {
  align-self: flex-start;
  margin-top: $kui-space-20;
}

.gateway-create-footer {
  display: flex;
  gap: $kui-space-40;
  padding-top: $kui-space-60;
}
</style>
