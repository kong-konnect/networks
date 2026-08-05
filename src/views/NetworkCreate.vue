<template>
  <PageLayout
    :breadcrumbs="[{ key: 'networks', text: 'Networks', to: { name: 'networks-list' } }]"
    title="Create network"
    :back-to="{ name: 'networks-list' }"
  >
    <div class="network-create">
      <div class="create-layout">
        <div class="create-main">
      <!-- Orientation (not a blocking gate) -->
      <div class="create-kai-row">
        <KAlert
          appearance="info"
          class="create-kai-alert"
          message="A network is provisioned by Kong and takes 45 minutes or more to become ready. Region and CIDR range are permanent — they can't be changed after creation."
        />
        <button
          v-if="!kaiCfg.shown.value"
          type="button"
          class="kai-configure-link"
          data-testid="create-kai-configure"
          @click="kaiCfg.run()"
        >
          <SparklesIcon :size="KUI_ICON_SIZE_20" decorative />
          Configure with KAi
        </button>
      </div>

      <KaiSummaryCard
        v-if="kaiCfg.shown.value"
        :loading="kaiCfg.loading.value"
        title="KAi setup suggestion"
        :insights="kaiCfgInsights"
        :actions="kaiCfgActions"
        data-testid="create-kai-suggestion"
        @action="onKaiCfgAction"
        @close="kaiCfg.close()"
      />

      <section class="form-card" data-testid="network-create-form">
        <!-- Network details -->
        <div class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Network details</h2>
            <p class="section-help">A network is single-cloud and single-region. Add private connectivity and DNS after it's ready.</p>
          </div>

          <div class="form-group">
            <KLabel :required="true">Network name</KLabel>
            <KInput
              v-model.trim="form.name"
              data-testid="network-name"
              placeholder="e.g., production-us-east"
              width="100%"
              :error="!!nameError"
              :error-message="nameError"
              @update:model-value="validateName"
            />
          </div>
        </div>

        <hr class="divider">

        <!-- Location -->
        <div class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Provider and region</h2>
            <p class="section-help">Choose where Kong provisions this network.</p>
          </div>

          <div class="two-col">
            <div class="form-group">
              <KLabel :required="true">Provider</KLabel>
              <KSelect
                v-model="form.cloud"
                :items="providerOptions"
                data-testid="network-provider"
                reuse-item-template
                width="100%"
                @change="onProviderChange"
              >
                <template #item-template="{ item }">
                  <span class="select-item">
                    <component :is="providerIcon(item.value as string)" :size="KUI_ICON_SIZE_30" decorative />
                    {{ item.label }}
                  </span>
                </template>
              </KSelect>
            </div>
            <div class="form-group">
              <KLabel :required="true">Region</KLabel>
              <KSelect
                v-model="form.region"
                :items="regionOptions"
                data-testid="network-region"
                placeholder="Select a region"
                reuse-item-template
                width="100%"
                @change="onRegionChange"
              >
                <template #item-template="{ item }">
                  <span class="select-item">
                    <component :is="regionFlag(item.value as string)" :size="KUI_ICON_SIZE_30" decorative />
                    {{ item.label }}
                  </span>
                </template>
              </KSelect>
            </div>
          </div>
        </div>

        <hr class="divider">

        <!-- Network range -->
        <div class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Network range</h2>
            <p class="section-help">The CIDR block for this network's Dedicated Cloud Gateway.</p>
          </div>

          <div class="form-group">
            <KLabel :required="true">CIDR range</KLabel>
            <KInput
              v-model.trim="form.cidr"
              data-testid="network-cidr"
              placeholder="e.g., 10.0.0.0/16"
              width="100%"
              :error="!!cidrError"
              :error-message="cidrError"
              @update:model-value="validateCidr"
            />
            <p class="field-help" data-testid="cidr-permanent">This range can't be changed after the network is created, so choose one large enough for future growth.</p>
            <p
              v-if="cidrWarning"
              class="cidr-hint-warning"
              data-testid="cidr-warning"
            >
              {{ cidrWarning }}
            </p>
          </div>
        </div>

        <hr class="divider">

        <!-- Zone placements -->
        <div class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Zone placements</h2>
            <p class="section-help">Your network is deployed across these availability zones. Select at least 2 for resilience.</p>
          </div>

          <div class="form-group">
            <div
              v-if="form.region"
              class="zone-box"
              data-testid="zone-box"
            >
              <KCheckbox
                v-for="zone in regionZones(form.region)"
                :key="zone"
                :model-value="form.zones.includes(zone)"
                :data-testid="`zone-${zone}`"
                @update:model-value="toggleZone(zone)"
              >
                {{ zone }}
              </KCheckbox>
            </div>
            <p v-else class="field-help">Select a region to choose zone placements.</p>
            <p
              v-if="form.region && form.zones.length < 2"
              class="zone-error"
              data-testid="zone-error"
            >
              Select at least 2 zones.
            </p>
          </div>
        </div>
      </section>

      <!-- Private connectivity (optional) — separate container -->
      <section class="form-card optional-card" data-testid="connectivity-card">
        <div class="form-section">
          <button
            type="button"
            class="section-toggle"
            :aria-expanded="showConnectivity"
            data-testid="connectivity-toggle"
            @click="showConnectivity = !showConnectivity"
          >
            <span class="section-heading">
              <span class="section-title-row">
                <h2 class="section-title">Private connectivity</h2>
                <KBadge appearance="neutral">Optional</KBadge>
              </span>
              <p class="section-help">Connect this network so clients can reach Kong and Kong can reach your services. You can also add connections after the network is ready.</p>
            </span>
            <ChevronDownIcon
              class="section-chevron"
              :class="{ 'section-chevron--open': showConnectivity }"
              :size="KUI_ICON_SIZE_30"
              decorative
            />
          </button>

          <div v-if="showConnectivity" class="form-collapse" data-testid="connectivity-fields">
            <div class="two-col">
              <div class="form-group">
                <KLabel>Connection type</KLabel>
                <KSelect
                  v-model="form.connType"
                  :items="connTypeOptions"
                  placeholder="Select a type"
                  width="100%"
                />
              </div>
              <div class="form-group">
                <KLabel>Name</KLabel>
                <KInput
                  v-model.trim="form.connName"
                  placeholder="e.g., prod-vpc-peering"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Private DNS (optional) — separate container -->
      <section class="form-card optional-card" data-testid="dns-card">
        <div class="form-section">
          <button
            type="button"
            class="section-toggle"
            :aria-expanded="showDns"
            data-testid="dns-toggle"
            @click="showDns = !showDns"
          >
            <span class="section-heading">
              <span class="section-title-row">
                <h2 class="section-title">Private DNS</h2>
                <KBadge appearance="neutral">Optional</KBadge>
              </span>
              <p class="section-help">Resolve private service names reached through this network. You can also add private DNS after the network is ready.</p>
            </span>
            <ChevronDownIcon
              class="section-chevron"
              :class="{ 'section-chevron--open': showDns }"
              :size="KUI_ICON_SIZE_30"
              decorative
            />
          </button>

          <div v-if="showDns" class="form-collapse" data-testid="dns-fields">
            <div class="two-col">
              <div class="form-group">
                <KLabel>DNS type</KLabel>
                <KSelect
                  v-model="form.dnsType"
                  :items="dnsTypeOptions"
                  placeholder="Select a type"
                  width="100%"
                />
              </div>
              <div class="form-group">
                <KLabel>Domain</KLabel>
                <KInput
                  v-model.trim="form.dnsDomain"
                  placeholder="e.g., internal.company.com"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="create-footer">
        <KButton
          appearance="primary"
          :disabled="!canCreate || isSubmitting"
          data-testid="network-create-button"
          @click="handleCreate"
        >
          <ProgressIcon
            v-if="isSubmitting"
            class="btn-spinner"
            :size="KUI_ICON_SIZE_20"
            decorative
          />
          {{ isSubmitting ? 'Creating network…' : 'Create network' }}
        </KButton>
        <KButton
          appearance="tertiary"
          data-testid="network-cancel"
          @click="router.push({ name: 'networks-list' })"
        >
          Cancel
        </KButton>
        <KButton
          appearance="tertiary"
          data-testid="network-view-config"
          @click="showConfigSlideout = true"
        >
          View configuration
        </KButton>
      </footer>
        </div>

        <div class="side-rail">
          <!-- Persistent CIDR guidance — getting the CIDR right matters, so keep it visible -->
          <aside class="help-panel" data-testid="cidr-help-panel">
            <div class="help-panel-head">
              <InfoIcon :size="KUI_ICON_SIZE_30" decorative />
              <h3 class="help-panel-title">Choosing a CIDR block</h3>
            </div>
            <p class="help-panel-text">A CIDR block defines the range of IP addresses available for your Dedicated Cloud Gateway. It can't be changed after creation, and shouldn't overlap with CIDR blocks in your own cloud networks.</p>

            <h4 class="help-panel-subtitle">Requirements</h4>
            <ul class="help-panel-list">
              <li><strong>Prefix length</strong> between /16 and /23. /23 supports up to 3 availability zones.</li>
              <li><strong>Private IP range:</strong> the block must fall within 10.0.0.0/8, 100.64.0.0/10, 172.16.0.0/12, 192.168.0.0/16, or 198.18.0.0/15.</li>
            </ul>

            <h4 class="help-panel-subtitle">Avoid</h4>
            <ul class="help-panel-list">
              <li>Ranges already used by your organization — overlaps break VPC peering.</li>
              <li>Reserved ranges 10.100.0.0/16 and 172.17.0.0/16.</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>

    <!-- Config-as-code on demand — opened from the footer, not shown inline -->
    <ConfigSlideout
      :visible="showConfigSlideout"
      title="Network configuration"
      :formats="networkConfigFormats"
      description="Create this network from the API, Terraform, or curl instead of the UI."
      @close="showConfigSlideout = false"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { ChevronDownIcon, InfoIcon, ProgressIcon, SparklesIcon } from '@kong/icons'
import {
  KAlert,
  KBadge,
  KButton,
  KCheckbox,
  KInput,
  KLabel,
  KSelect,
  ToastManager,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import ConfigSlideout from '@/components/ConfigSlideout.vue'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import { useKaiPanel } from '@/composables/useKaiPanel'
import { providerIcon, regionFlag, regionLabel } from '@/utils/regionDisplay'
import type { CloudProvider } from '@/types'

const router = useRouter()
const store = useNetworksStore()

const toaster = new ToastManager()
onBeforeUnmount(() => toaster.destroy())

const DEFAULT_REGION = 'us-east-1'
const form = reactive({
  name: '',
  cloud: 'aws' as CloudProvider,
  region: DEFAULT_REGION,
  cidr: '',
  zones: ['a', 'b', 'c'].map(s => `${DEFAULT_REGION}${s}`),
  // Optional — can also be added after the network is ready.
  connType: '',
  connName: '',
  dnsType: '',
  dnsDomain: '',
})

const showConnectivity = ref(false)
const showDns = ref(false)

const connTypeOptions = [
  { label: 'VPC peering', value: 'peering' },
  { label: 'Transit Gateway', value: 'tgw' },
  { label: 'Resource endpoint', value: 'rep' },
]
const dnsTypeOptions = [
  { label: 'Private hosted zone', value: 'private-hosted-zone' },
  { label: 'Outbound resolver', value: 'outbound-resolver' },
]

const nameError = ref('')
const cidrError = ref('')
const isSubmitting = ref(false)

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
const regionOptions = computed(() =>
  regionsByProvider[form.cloud].map(r => ({ label: regionLabel(r), value: r })),
)

// Availability zones per region (prototype: 3 per region).
const regionZones = (region: string): string[] =>
  region ? ['a', 'b', 'c'].map(s => `${region}${s}`) : []

const onProviderChange = () => {
  form.region = regionsByProvider[form.cloud][0]
  form.zones = regionZones(form.region)
  validateCidr()
}
const onRegionChange = () => {
  // Default to all zones in the region (>=2 satisfied); user can trim.
  form.zones = regionZones(form.region)
}
const toggleZone = (zone: string) => {
  form.zones = form.zones.includes(zone)
    ? form.zones.filter(z => z !== zone)
    : [...form.zones, zone]
}

const validateName = () => {
  const name = form.name.trim()
  if (!name) {
    nameError.value = 'Enter a network name.'
    return
  }
  if (store.getNetworks().some(n => n.name === name)) {
    nameError.value = 'A network with this name already exists.'
    return
  }
  nameError.value = ''
}

const validateCidr = () => {
  const cidr = form.cidr.trim()
  if (!cidr) {
    cidrError.value = ''
    return
  }
  if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(cidr)) {
    cidrError.value = 'Enter a valid CIDR (e.g., 10.0.0.0/16).'
    return
  }
  const existing = store.getNetworks().flatMap(n => n.regions.map(r => r.cidr))
  if (existing.includes(cidr)) {
    cidrError.value = 'This CIDR overlaps with an existing network.'
    return
  }
  cidrError.value = ''
}

// Non-blocking guidance: a small prefix (/22 or smaller) leaves few IP addresses, and
// because the range is permanent, running out means recreating the whole network. Warn
// but don't block — the user may know their scale.
const cidrWarning = computed(() => {
  const cidr = form.cidr.trim()
  if (!cidr || cidrError.value) return ''
  const prefix = Number(cidr.split('/')[1])
  if (!Number.isFinite(prefix)) return ''
  if (prefix >= 22) {
    return 'This is a small range and can\'t be resized later. If your traffic grows beyond its IP addresses, you\'d have to recreate the network. Choose a larger range (a lower prefix, such as /16 to /20) if you expect to scale.'
  }
  return ''
})

// ── KAi setup suggestion ──────────────────────────────────────────────────────
// Recommends a right-sized, immutable-safe CIDR (and zones) and can apply it — heading
// off the "too small, can't resize" trap.
const kaiCfg = useKaiPanel(900)
const kaiCfgInsights = computed<KaiInsight[]>(() => [
  { lead: 'Recommended range:', text: 'use 10.0.0.0/16 — about 65,000 addresses. Since the CIDR is permanent, this leaves plenty of room to scale without ever recreating the network.' },
  { text: `Deploy across all availability zones in ${form.region || 'the region'} for resilience, and keep the range clear of any CIDRs already used in your own cloud.` },
])
const kaiCfgActions: KaiAction[] = [
  { key: 'apply', label: 'Apply recommended settings' },
]
const onKaiCfgAction = (key: string) => {
  if (key === 'apply') {
    form.cidr = '10.0.0.0/16'
    if (!form.name.trim()) form.name = `${form.cloud}-${form.region}`
    if (form.region) form.zones = regionZones(form.region)
    validateCidr()
  }
}

const canCreate = computed(() =>
  form.name.trim() !== '' && !nameError.value &&
  !!form.region &&
  form.cidr.trim() !== '' && !cidrError.value &&
  form.zones.length >= 2,
)

// ── Configuration-as-code (opened on demand from the footer) ──────────────────
const showConfigSlideout = ref(false)
const tfName = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'network'

const netJsonConfig = computed(() => JSON.stringify({
  name: form.name || 'my-network',
  provider: form.cloud,
  region: form.region,
  cidr_block: form.cidr || '10.0.0.0/16',
  availability_zones: form.zones,
}, null, 2))

const netTerraformConfig = computed(() => [
  `resource "konnect_cloud_gateway_network" "${tfName(form.name)}" {`,
  `  name                              = "${form.name || 'my-network'}"`,
  `  cloud_gateway_provider_account_id = "provider-account-id"`,
  `  region                            = "${form.region}"`,
  `  cidr_block                        = "${form.cidr || '10.0.0.0/16'}"`,
  `  availability_zones                = [${form.zones.map(z => `"${z}"`).join(', ')}]`,
  '}',
].join('\n'))

const netCurlConfig = computed(() =>
  `curl -X POST https://us.api.konghq.com/v2/cloud-gateways/networks \\
  -H "Authorization: Bearer $KONNECT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${netJsonConfig.value}'`)

const networkConfigFormats = computed(() => [
  { label: 'JSON', value: 'json', code: netJsonConfig.value, language: 'json' },
  { label: 'Terraform', value: 'terraform', code: netTerraformConfig.value, language: 'hcl' },
  { label: 'curl', value: 'curl', code: netCurlConfig.value, language: 'bash' },
])

const handleCreate = () => {
  if (!canCreate.value || isSubmitting.value) return
  isSubmitting.value = true
  // Brief provisioning kick-off, then land on the new network (initialising) so the
  // user sees provisioning + the next steps to configure connectivity and DNS.
  setTimeout(() => {
    const network = store.createNetwork({
      name: form.name.trim(),
      cloud: form.cloud,
      regions: [{ region: form.region, cidr: form.cidr.trim(), zones: form.zones }],
    })
    isSubmitting.value = false
    toaster.open({ appearance: 'success', message: 'Network created. Provisioning can take 45 minutes or more.' })
    router.push({ name: 'networks-detail', params: { id: network.id } })
  }, 700)
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.network-create {
  max-width: 1120px;
}

// Two columns: the form on the left, persistent guidance on the right.
.create-layout {
  align-items: start;
  display: grid;
  gap: $kui-space-80;
  grid-template-columns: minmax(0, 1fr) minmax(0, 340px);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.create-main {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  min-width: 0;
}

// Right rail holds the CIDR guidance + the live config panel; the rail sticks.
.side-rail {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  position: sticky;
  top: $kui-space-70;

  @media (max-width: 900px) {
    position: static;
  }
}

.help-panel {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-70;

  .help-panel-head {
    align-items: center;
    color: $kui-color-text-primary;
    display: flex;
    gap: $kui-space-30;
  }

  .help-panel-title {
    color: $kui-color-text;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-0;
  }

  .help-panel-text {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-40;
    margin: $kui-space-0;
  }

  .help-panel-subtitle {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-30 $kui-space-0 $kui-space-0;
  }

  .help-panel-list {
    color: $kui-color-text-neutral;
    display: flex;
    flex-direction: column;
    font-size: $kui-font-size-30;
    gap: $kui-space-20;
    line-height: $kui-line-height-40;
    margin: $kui-space-0;
    padding-left: $kui-space-70;
  }
}
.form-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  padding: $kui-space-80;
}

.divider {
  border: none;
  border-top: $kui-border-width-10 solid $kui-color-border;
  margin: $kui-space-0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

// Collapsible optional section trigger.
.section-toggle {
  align-items: flex-start;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
  padding: $kui-space-0;
  text-align: left;
  width: 100%;

  .section-heading { flex: 1 1 auto; }
}

.section-title-row {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.section-chevron {
  color: $kui-color-text-neutral;
  flex: 0 0 auto;
  margin-top: $kui-space-10;
  transition: transform 0.15s ease-in-out;

  &--open { transform: rotate(180deg); }
}

.form-collapse {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.section-title {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-50;
  margin: $kui-space-0;
}

.section-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.field-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.cidr-hint-warning {
  color: $kui-color-text-warning;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.create-kai-row {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
}

.create-kai-alert { flex: 1; min-width: 0; }

.kai-configure-link {
  align-items: center;
  background: none;
  border: none;
  color: $kui-color-text-decorative-purple;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  margin-top: $kui-space-30;
  padding: $kui-space-0;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
}

.two-col {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.select-item {
  align-items: center;
  display: flex;
  gap: $kui-space-30;
}

.zone-box {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-50 $kui-space-90;
  padding: $kui-space-50 $kui-space-60;
}

.zone-error {
  color: $kui-color-text-danger;
  font-size: $kui-font-size-20;
  margin: $kui-space-0;
}

.create-footer {
  align-items: center;
  background-color: $kui-color-background;
  border-top: $kui-border-width-10 solid $kui-color-border;
  bottom: $kui-space-0;
  display: flex;
  gap: $kui-space-50;
  justify-content: flex-start;
  padding: $kui-space-60 $kui-space-0;
  position: sticky;
  z-index: 1;
}

.btn-spinner {
  animation: btn-spin 0.7s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>
