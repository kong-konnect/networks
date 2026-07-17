<template>
  <PageLayout
    v-if="network"
    :title="network.name"
    :breadcrumbs="breadcrumbs"
    :back-to="{ name: 'networks-list' }"
  >
    <template #actions>
      <KButton
        v-if="network.status === 'ready'"
        appearance="secondary"
        data-testid="network-test-endpoint"
        @click="router.push({ name: 'networks-test-endpoint', params: { id: network.id } })"
      >
        Test endpoint
      </KButton>
      <KDropdown :kpop-attributes="{ placement: 'bottom-end' }">
        <KButton
          appearance="primary"
          data-testid="network-actions"
        >
          Actions
          <ChevronDownIcon decorative />
        </KButton>
        <template #items>
          <KDropdownItem
            data-testid="network-add-connection"
            @click="goToAddConnection"
          >
            Add connection
          </KDropdownItem>
          <KDropdownItem
            danger
            has-divider
            @click="handleDeleteNetwork"
          >
            Delete
          </KDropdownItem>
        </template>
      </KDropdown>
    </template>


    <!-- Non-ready provisioning states -->
    <template v-if="network.status !== 'ready'">
      <div v-if="network.status === 'initialising'" class="provisioning-panel">
        <KAlert
          :appearance="isStuck ? 'warning' : 'info'"
          :message="isStuck
            ? 'This network is taking longer than usual to provision. If this continues, contact support or delete and recreate it.'
            : 'Kong is setting up this network. No action is needed on your part.'"
        >
          <template #title>
            {{ isStuck ? 'Taking longer than usual' : 'Provisioning in progress' }}
          </template>
        </KAlert>

        <div class="detail-card">
          <div class="provisioning-row">
            <span class="provisioning-label">Expected duration</span>
            <span>45+ minutes</span>
          </div>
          <div class="provisioning-row">
            <span class="provisioning-label">Elapsed time</span>
            <span>{{ formatElapsed(network.createdAt) }}</span>
          </div>
          <div class="provisioning-row">
            <span class="provisioning-label">Last checked</span>
            <span>{{ timeAgo(network.lastCheckedAt) }}</span>
          </div>
        </div>

        <KAlert
          appearance="info"
          message="Connectivity is available after this network is ready."
        />

        <div v-if="isStuck" class="stuck-actions">
          <KButton appearance="primary" @click="handleContactSupport">Contact support</KButton>
          <KButton appearance="danger" @click="handleDeleteNetwork">Delete and recreate</KButton>
          <KButton appearance="tertiary" @click="router.push({ name: 'networks-list' })">Back to networks</KButton>
        </div>
      </div>

      <KAlert
        v-if="network.status === 'error'"
        appearance="danger"
        message="This network has encountered an error. Delete and recreate it to restore connectivity."
      >
        <template #title>Network provisioning failed</template>
      </KAlert>
    </template>

    <!-- Tabbed layout for ready networks -->
    <template v-if="network.status === 'ready'">
     <div class="nd-body">
      <KTabs v-model="activeTab" :tabs="tabs" />

      <!-- ── Overview tab ─────────────────────────────────────── -->
      <div v-if="activeTab === '#overview'" class="tab-content">
        <!-- Next steps (conditional) — surfaced first so the primary action is up top -->
        <section
          v-if="showNextStep && nextSteps.length"
          class="detail-card next-step-card"
          data-testid="next-step"
        >
          <div class="next-step-head">
            <h3 class="numbered-title">Next steps</h3>
            <button
              type="button"
              class="next-step-close"
              aria-label="Dismiss next steps"
              @click="showNextStep = false"
            >
              <CloseIcon decorative />
            </button>
          </div>
          <div class="next-step-grid">
            <button
              v-for="ns in nextSteps"
              :key="ns.key"
              type="button"
              class="next-step-item"
              :data-testid="`next-step-${ns.key}`"
              @click="ns.handler"
            >
              <span class="next-step-icon" :class="`next-step-icon--${ns.tone}`">
                <component :is="ns.icon" :size="KUI_ICON_SIZE_30" decorative />
              </span>
              <span class="next-step-text">
                <span class="next-step-title">{{ ns.title }}</span>
                <span class="next-step-desc">{{ ns.desc }}</span>
              </span>
            </button>
          </div>
        </section>

        <!-- About this network (consolidated metadata) -->
        <section class="detail-card about-card" data-testid="about-network">
          <div class="about-head">
            <h2 class="section-title">About this network</h2>
            <span class="about-time">
              Created {{ formatDate(network.createdAt) }}
              <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
              Last updated {{ formatDate(network.lastCheckedAt) }}
            </span>
          </div>
          <div class="about-grid">
            <div class="about-item">
              <span class="about-label">Network ID</span>
              <KCopy format="short" :text="network.id" />
            </div>
            <div class="about-item">
              <span class="about-label">Provider network ID</span>
              <KCopy v-if="network.providerNetworkId" format="short" :text="network.providerNetworkId" />
              <span v-else class="dash">—</span>
            </div>
            <div class="about-item">
              <span class="about-label">Provider</span>
              <span class="about-value">
                <component :is="providerIcon(network.cloud)" :size="KUI_ICON_SIZE_20" decorative />
                {{ network.cloud.toUpperCase() }}
              </span>
            </div>
            <div class="about-item">
              <span class="about-label">Region</span>
              <span class="about-value">
                <component :is="regionFlag(network.regions[0].region)" :size="KUI_ICON_SIZE_20" decorative />
                {{ regionName(network.regions[0].region) }}
              </span>
            </div>
            <div class="about-item">
              <span class="about-label">CIDR</span>
              <span class="about-value">{{ network.regions[0].cidr }}</span>
            </div>
            <div class="about-item">
              <span class="about-label">Zones</span>
              <span class="about-value">{{ zonesLabel }}</span>
            </div>
            <div class="about-item">
              <span class="about-label">Status</span>
              <KBadge :appearance="networkStatusBadge(network.status)">{{ networkStatusText(network.status) }}</KBadge>
            </div>
            <div class="about-item">
              <span class="about-label">Private networking</span>
              <KBadge :appearance="privateNetworking.appearance">{{ privateNetworking.label }}</KBadge>
            </div>
          </div>
        </section>

        <!-- Section 2 — Private connectivity (entry list) -->
        <section class="detail-card" data-testid="connectivity-summary">
          <div class="section-header">
            <div class="section-header-text">
              <h3 class="numbered-title">Private connectivity</h3>
              <p class="section-help">{{ connections.length }} connection{{ connections.length === 1 ? '' : 's' }} on this network.</p>
            </div>
            <a
              v-if="connections.length"
              class="row-action"
              href="#"
              @click.prevent="viewTab('#connectivity')"
            >View all</a>
          </div>
          <table v-if="connections.length" class="rows-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="conn in connections"
                :key="conn.id"
                class="clickable-row"
                @click="goToConnection(conn.id)"
              >
                <td class="conn-name">{{ conn.name }}</td>
                <td>{{ connectionTypeLabel(conn.type) }}</td>
                <td><KBadge :appearance="statusBadgeAppearance(conn.status)">{{ statusLabel(conn.status) }}</KBadge></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="mini-empty">
            <p class="section-help">No private connectivity configured.</p>
            <a class="row-action" href="#" @click.prevent="goToAddConnection">Add connection</a>
          </div>
        </section>

        <!-- Section 2b — Private DNS (entry list) -->
        <section class="detail-card" data-testid="dns-summary">
          <div class="section-header">
            <div class="section-header-text">
              <h3 class="numbered-title">Private DNS</h3>
              <p class="section-help">{{ dnsList.length }} configuration{{ dnsList.length === 1 ? '' : 's' }} on this network.</p>
            </div>
            <a
              v-if="dnsList.length"
              class="row-action"
              href="#"
              @click.prevent="viewTab('#dns')"
            >View all</a>
          </div>
          <table v-if="dnsList.length" class="rows-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="dns in dnsList"
                :key="dns.id"
                class="clickable-row"
                @click="goToDns(dns.id)"
              >
                <td class="conn-name">{{ dns.name }}</td>
                <td>{{ dnsTypeLabel(dns.type) }}</td>
                <td><KBadge :appearance="dnsStatusBadge(dns.status)">{{ dnsStatusLabel(dns.status) }}</KBadge></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="mini-empty">
            <p class="section-help">No private DNS configured.</p>
            <a class="row-action" href="#" @click.prevent="openAddDns">Add private DNS</a>
          </div>
        </section>

        <!-- Section 3 — Used by -->
        <section class="detail-card" data-testid="used-by">
          <div class="section-header-text">
            <h3 class="numbered-title">Used by</h3>
            <p class="section-help">Gateways currently using this network.</p>
          </div>
          <table v-if="usedByRows.length" class="rows-table">
            <thead>
              <tr>
                <th>Gateway</th>
                <th>Type</th>
                <th>Control plane ID</th>
                <th>Data plane group</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gw in usedByRows" :key="gw.id">
                <td class="conn-name">{{ gw.name }}</td>
                <td>{{ gw.type }}</td>
                <td><KCopy format="short" :text="gw.controlPlaneId" /></td>
                <td><KCopy format="short" :text="gw.dataPlaneGroup" /></td>
                <td><KBadge appearance="success">Ready</KBadge></td>
                <td><a class="row-action" href="#" @click.prevent="goToGateway(gw)">View gateway</a></td>
              </tr>
            </tbody>
          </table>
          <p v-else class="section-help gw-empty">No gateways are using this network yet.</p>
        </section>

      </div>

      <!-- ── Connectivity tab ─────────────────────────────────── -->
      <div v-if="activeTab === '#connectivity'" class="tab-content">
        <div class="section-header">
          <div class="section-header-text">
            <h2 class="section-title">Connectivity</h2>
            <p class="section-help">Private connectivity resources attached to this network.</p>
          </div>
          <div class="section-header-actions">
            <KSegmentedControl
              v-if="connections.length"
              v-model="connectivityView"
              :options="connectivityViewOptions"
              data-testid="connectivity-view-toggle"
            />
            <KButton appearance="primary" @click="goToAddConnection">
              <AddCircleIcon decorative />
              Add connection
            </KButton>
          </div>
        </div>

        <KEmptyState
          v-if="connections.length === 0"
          icon-variant="kong"
          title="No private connectivity configured"
          message="Add a connection to let clients reach Kong, let Kong reach upstreams, or connect private networks."
          action-button-text="Add connection"
          @click-action="goToAddConnection"
        />

        <!-- Table view -->
        <div
          v-else-if="connectivityView === 'table'"
          class="detail-card table-card"
        >
          <EntityBaseTable
            :key="'conn-table'"
            :fetcher="connectionsFetcher"
            :headers="connectionHeaders"
            hide-card
            :hide-toolbar="true"
            table-preferences-key="network-connections"
            @row:click="(_e: Event, row: any) => goToConnection(row.id)"
          >
            <template #name="{ row }">
              <span class="conn-name">{{ row.name }}</span>
            </template>
            <template #type="{ row }">{{ connectionTypeLabel(row.type) }}</template>
            <template #status="{ row }">
              <KBadge :appearance="statusBadgeAppearance(row.status)">{{ statusLabel(row.status) }}</KBadge>
            </template>
            <template #lastChecked="{ row }">{{ timeAgo(row.lastCheckedAt) }}</template>
            <template #actions="{ row }">
              <a class="row-action" href="#" @click.prevent="goToConnection(row.id)">View</a>
            </template>
          </EntityBaseTable>
        </div>

        <!-- Stack view — network → connectivity resources → resource details -->
        <div
          v-else
          class="conn-stack"
          data-testid="connectivity-stack"
        >
          <div class="detail-card stack-network-card">
            <span class="stack-network-name">{{ network.name }}</span>
            <span class="stack-network-meta">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }} · {{ network.regions[0].cidr }}</span>
          </div>
          <div class="stack-connector" />
          <div class="stack-cards">
            <button
              v-for="conn in connections"
              :key="conn.id"
              type="button"
              class="detail-card stack-conn-card"
              :data-testid="`stack-conn-${conn.id}`"
              @click="goToConnection(conn.id)"
            >
              <div class="stack-conn-head">
                <span class="stack-conn-type">{{ connectionTypeLabel(conn.type) }}</span>
                <KBadge :appearance="statusBadgeAppearance(conn.status)">{{ statusLabel(conn.status) }}</KBadge>
              </div>
              <span class="stack-conn-name">{{ conn.name }}</span>
              <dl class="stack-conn-details">
                <template v-for="d in connectionDetails(conn)" :key="d.label">
                  <dt>{{ d.label }}</dt>
                  <dd>{{ d.value }}</dd>
                </template>
              </dl>
              <span class="stack-conn-checked">Last checked {{ timeAgo(conn.lastCheckedAt) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Private DNS tab ──────────────────────────────────── -->
      <div v-if="activeTab === '#dns'" class="tab-content">
        <div class="section-header">
          <div class="section-header-text">
            <h2 class="section-title">Private DNS</h2>
            <p class="section-help">Private DNS resolves private service names from this network.</p>
          </div>
          <KButton
            appearance="primary"
            data-testid="add-dns-button"
            @click="openAddDns"
          >
            <AddCircleIcon decorative />
            Add private DNS
          </KButton>
        </div>

        <div v-if="dnsList.length" class="detail-card table-card">
          <table class="rows-table">
            <thead>
              <tr>
                <th>Name / domain</th>
                <th>Type</th>
                <th>Status</th>
                <th>Used for</th>
                <th>Last checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dns in dnsList" :key="dns.id">
                <td class="dns-domain">{{ dns.name }}</td>
                <td>{{ dnsTypeLabel(dns.type) }}</td>
                <td><KBadge :appearance="dnsStatusBadge(dns.status)">{{ dnsStatusLabel(dns.status) }}</KBadge></td>
                <td>{{ dns.usedFor }}</td>
                <td>
                  <span v-if="dns.status !== 'ready' && dns.lastCheckedAt">{{ timeAgo(dns.lastCheckedAt) }}</span>
                  <span v-else class="dash">—</span>
                </td>
                <td><a class="row-action" href="#" @click.prevent="goToDns(dns.id)">View</a></td>
              </tr>
            </tbody>
          </table>
        </div>
        <KEmptyState
          v-else
          icon-variant="kong"
          title="No private DNS configured"
          message="Add a private DNS configuration to resolve private service names reached through this network."
          action-button-text="Add private DNS"
          data-testid="dns-empty-state"
          @click-action="openAddDns"
        />
      </div>

     </div>
    </template>
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

  <!-- Normal delete confirmation -->
  <KModal
    :visible="showDeleteModal"
    title="Delete network"
    @cancel="showDeleteModal = false"
    @proceed="confirmDelete"
  >
    <p>
      Are you sure you want to delete <strong>{{ network?.name }}</strong>? This action cannot be undone.
    </p>
  </KModal>

  <!-- Blocked delete (gateways attached) -->
  <KModal
    :visible="showBlockedModal"
    title="Cannot delete network"
    :action-button-text="''"
    @cancel="showBlockedModal = false"
    @proceed="showBlockedModal = false"
  >
    <p class="blocked-message">
      This network has {{ network?.attachedGatewayCount }} gateway{{ (network?.attachedGatewayCount ?? 0) === 1 ? '' : 's' }} attached.
      Detach the gateways before deleting this network.
    </p>
    <table class="rows-table">
      <thead>
        <tr>
          <th>Gateway</th>
          <th>Type</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="gw in gateways" :key="gw.id">
          <td>{{ gw.name }}</td>
          <td>Data plane</td>
          <td><KBadge appearance="success">Running</KBadge></td>
          <td><a class="row-action" href="#" @click.prevent>View</a></td>
        </tr>
      </tbody>
    </table>
  </KModal>

  <!-- Add private DNS -->
  <KModal
    :visible="showDnsModal"
    title="Add private DNS"
    action-button-text="Add"
    cancel-button-text="Cancel"
    :action-button-disabled="!dnsForm.name || !dnsForm.usedFor"
    @cancel="showDnsModal = false"
    @proceed="saveDns"
  >
    <div class="dns-form">
      <div class="dns-field">
        <KLabel :required="true">Name / domain</KLabel>
        <KInput
          v-model.trim="dnsForm.name"
          data-testid="dns-domain"
          placeholder="e.g., payments.internal.company.com"
          width="100%"
        />
      </div>
      <div class="dns-field">
        <KLabel :required="true">Type</KLabel>
        <KSelect
          v-model="dnsForm.type"
          :items="dnsTypeOptions"
          data-testid="dns-type"
          width="100%"
        />
      </div>
      <div class="dns-field">
        <KLabel :required="true">Used for</KLabel>
        <KInput
          v-model.trim="dnsForm.usedFor"
          data-testid="dns-usedfor"
          placeholder="e.g., Upstream services"
          width="100%"
        />
      </div>
      <p class="field-help">Provisioning starts once added. This DNS configuration begins in a pending state until it resolves.</p>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import {
  AddCircleIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CloseIcon,
  ConnectionsIcon,
  WorldPrivateIcon,
  PlugIcon,
  AwsIcon,
  GoogleCloudIcon,
  AzureIcon,
  CloudIcon,
  FlagUsIcon,
  FlagIeIcon,
  FlagSgIcon,
  FlagBeIcon,
  FlagNlIcon,
  LocationIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import {
  KAlert,
  KBadge,
  KCopy,
  KButton,
  KDropdown,
  KDropdownItem,
  KEmptyState,
  KModal,
  KTabs,
  KInput,
  KLabel,
  KSelect,
  KSegmentedControl,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { CloudProvider, NetworkStatus, DnsType, DnsStatus } from '@/types'
import {
  connectionTypeLabel,
  statusLabel,
  statusBadgeAppearance,
  timeAgo,
} from '@/utils/connectionDisplay'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const network = computed(() => store.getNetworkById(networkId.value))
const connections = computed(() => store.getConnectionsByNetworkId(networkId.value))
const gateways = computed(() => store.getGatewaysByNetworkId(networkId.value))

const activeTab = ref('#overview')
const showNextStep = ref(true)
const showDeleteModal = ref(false)
const showBlockedModal = ref(false)

// ── Overview facts / placement / attached gateway (Figma network overview) ────
const PROVIDER_ICONS: Record<CloudProvider, Component> = { aws: AwsIcon, gcp: GoogleCloudIcon, azure: AzureIcon }
const providerIcon = (p: CloudProvider): Component => PROVIDER_ICONS[p] ?? CloudIcon

const REGION_FLAGS: Record<string, Component> = {
  'us-east-1': FlagUsIcon, 'us-east-2': FlagUsIcon, 'us-west-1': FlagUsIcon, 'us-west-2': FlagUsIcon,
  'us-central1': FlagUsIcon, 'eu-west-1': FlagIeIcon, 'ap-southeast-1': FlagSgIcon,
  'europe-west1': FlagBeIcon, 'westeurope': FlagNlIcon, 'eastus': FlagUsIcon,
}
const regionFlag = (region: string): Component => REGION_FLAGS[region] ?? LocationIcon

const REGION_NAMES: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)', 'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)', 'us-west-2': 'US West (Oregon)',
  'us-central1': 'US Central (Iowa)', 'eu-west-1': 'Europe (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)', 'europe-west1': 'Europe (Belgium)',
  westeurope: 'West Europe', eastus: 'East US',
}
// Reference format: "US East (N. Virginia) (us-east-1)".
const regionName = (code: string) => REGION_NAMES[code] ? `${REGION_NAMES[code]} (${code})` : code

const formatDate = (iso: string) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

const privateNetworking = computed(() => {
  const configured = connections.value.some(c => c.family === 'peering')
  return configured
    ? { label: 'Configured', appearance: 'success' as const }
    : { label: 'Not configured', appearance: 'neutral' as const }
})

// Zones this network is deployed across (kept as lightweight metadata — zones may
// be restricted or removed later, so this is intentionally not a large section).
const zonesLabel = computed(() => {
  const zones = network.value?.regions[0]?.zones ?? []
  return zones.length ? zones.join(', ') : '—'
})

// "Used by" — the gateways (any family) currently using this network. Control-plane
// and data-plane-group ids are derived deterministically from the gateway id (mock).
const usedByRows = computed(() =>
  gateways.value.map(gw => ({
    id: gw.id,
    name: gw.name,
    type: 'API Gateway',
    controlPlaneId: gw.id.replace('gw-', 'cp-9f2a4b6c-'),
    dataPlaneGroup: gw.id.replace('gw-', 'dpg-0422cedd-'),
  })),
)
const goToGateway = (_gw: { id: string }) => {
  router.push({ name: 'gateway-overview' })
}

// Resource-specific facts to surface in the connectivity stack view — only the
// values the customer actually gave us (ARNs, VPC ids, etc.), per connection type.
const connectionDetails = (conn: import('@/types').Connection): { label: string; value: string }[] => {
  const rows: { label: string; value: string }[] = []
  if (conn.peerAccountId) rows.push({ label: 'Customer account', value: conn.peerAccountId })
  if (conn.peerVpcId) rows.push({ label: 'Customer VPC', value: conn.peerVpcId })
  if (conn.peerRegion) rows.push({ label: 'Customer region', value: conn.peerRegion })
  if (conn.kongEndpointId) rows.push({ label: 'Kong endpoint ID', value: conn.kongEndpointId })
  if (conn.setupValues?.ramShareArn) rows.push({ label: 'RAM share ARN', value: conn.setupValues.ramShareArn })
  if (conn.setupValues?.resourceConfigArn) rows.push({ label: 'Resource configuration ARN', value: conn.setupValues.resourceConfigArn })
  if (conn.setupValues?.pscServiceAttachmentUri) rows.push({ label: 'Service attachment', value: conn.setupValues.pscServiceAttachmentUri })
  return rows
}

// Next steps are conditional — a capability card is only shown while it's unconfigured.
type NextStep = { key: string; title: string; desc: string; icon: Component; tone: 'purple' | 'teal' | 'pink'; handler: () => void }
const nextSteps = computed<NextStep[]>(() => {
  const steps: NextStep[] = []
  if (connections.value.length === 0) {
    steps.push({ key: 'connectivity', title: 'Configure private networking', desc: 'Let clients reach Kong and Kong reach your upstreams.', icon: ConnectionsIcon, tone: 'purple', handler: goToAddConnection })
  }
  if (dnsList.value.length === 0) {
    steps.push({ key: 'dns', title: 'Set up private DNS', desc: 'Resolve private service names through this network.', icon: WorldPrivateIcon, tone: 'teal', handler: openAddDns })
  }
  // Only meaningful to test once there's connectivity or DNS to exercise.
  if (connections.value.length > 0 || dnsList.value.length > 0) {
    steps.push({ key: 'test', title: 'Test endpoint', desc: 'Check that traffic actually flows through the network.', icon: PlugIcon, tone: 'pink', handler: () => router.push({ name: 'networks-test-endpoint', params: { id: networkId.value } }) })
  }
  return steps
})

// ── Private DNS ───────────────────────────────────────────────────────────
const showDnsModal = ref(false)
const dnsForm = ref<{ name: string; type: DnsType; usedFor: string }>({ name: '', type: 'private-hosted-zone', usedFor: '' })
const dnsTypeOptions = [
  { label: 'Private hosted zone', value: 'private-hosted-zone' },
  { label: 'Outbound resolver', value: 'outbound-resolver' },
]

const dnsTypeLabel = (type: DnsType) => type === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const dnsStatusLabel = (status: DnsStatus) => status === 'error' ? 'Error' : status === 'pending' ? 'Pending' : 'Ready'
const dnsStatusBadge = (status: DnsStatus) => status === 'error' ? 'danger' : status === 'pending' ? 'warning' : 'success'

const openAddDns = () => {
  dnsForm.value = { name: '', type: 'private-hosted-zone', usedFor: '' }
  showDnsModal.value = true
}
const saveDns = () => {
  if (!dnsForm.value.name || !dnsForm.value.usedFor) return
  store.addDnsConfig(networkId.value, { name: dnsForm.value.name, type: dnsForm.value.type, usedFor: dnsForm.value.usedFor })
  showDnsModal.value = false
}
const goToDns = (dnsId: string) => {
  router.push({ name: 'networks-dns-detail', params: { id: networkId.value, dnsId } })
}

const breadcrumbs = [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
]

const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#connectivity', title: 'Connectivity' },
  { hash: '#dns', title: 'Private DNS' },
]

// Connectivity: table columns are deliberately minimal — direction and scope were
// removed (peering is bidirectional, so direction is misleading; scope isn't useful yet).
const connectionHeaders = [
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Type', key: 'type', sortable: false },
  { label: 'Status', key: 'status', sortable: false },
  { label: 'Last checked', key: 'lastChecked', sortable: false },
  { label: '', key: 'actions', sortable: false },
]

const connectivityView = ref<'table' | 'stack'>('table')
const connectivityViewOptions = [
  { label: 'Table', value: 'table' },
  { label: 'Stack', value: 'stack' },
]


const isStuck = computed(() => {
  if (!network.value || network.value.status !== 'initialising') return false
  const elapsedMs = Date.now() - new Date(network.value.createdAt).getTime()
  return elapsedMs / 60000 > 90
})

const dnsList = computed(() => network.value?.dnsConfigs ?? [])

// Overview summaries — status-at-a-glance for the two capability tabs.
const connectivitySummary = computed(() => {
  const s = { total: connections.value.length, ready: 0, pending: 0, error: 0, creating: 0 }
  for (const c of connections.value) {
    if (c.status === 'ready') s.ready++
    else if (c.status === 'error') s.error++
    else if (c.status === 'pending-user-action' || c.status === 'pending-acceptance') s.pending++
    else s.creating++
  }
  return s
})
const connectivityTypes = computed(() =>
  [...new Set(connections.value.map(c => connectionTypeLabel(c.type)))])

const dnsSummary = computed(() => {
  const s = { total: dnsList.value.length, ready: 0, pending: 0, error: 0 }
  for (const d of dnsList.value) {
    if (d.status === 'ready') s.ready++
    else if (d.status === 'error') s.error++
    else s.pending++
  }
  return s
})

const viewTab = (hash: string) => { activeTab.value = hash }

const connectionsFetcher = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  const data = store.getConnectionsByNetworkId(networkId.value)
  return { data, total: data.length }
}

function networkStatusBadge(status: NetworkStatus): string {
  if (status === 'ready') return 'success'
  if (status === 'initialising') return 'warning'
  if (status === 'error') return 'danger'
  return 'neutral'
}

function networkStatusText(status: NetworkStatus): string {
  if (status === 'ready') return 'Ready'
  if (status === 'initialising') return 'Creating'
  if (status === 'error') return 'Error'
  if (status === 'terminating') return 'Deleting'
  return status
}

const formatElapsed = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins} minutes`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`
}

const goToAddConnection = () => {
  router.push({ name: 'networks-add-connection', params: { id: networkId.value } })
}

const goToConnection = (connId: string) => {
  router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId } })
}

const handleDeleteNetwork = () => {
  if (network.value && network.value.attachedGatewayCount > 0) {
    showBlockedModal.value = true
  } else {
    showDeleteModal.value = true
  }
}

const confirmDelete = () => {
  if (network.value) {
    store.deleteNetwork(network.value.id)
    router.push({ name: 'networks-list' })
  }
  showDeleteModal.value = false
}

const handleContactSupport = () => {
  window.open('https://support.konghq.com', '_blank')
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

// The detail body sits on a gray backdrop (white cards on top). It bleeds to the
// edges of the PageLayout content (which has $kui-space-60 padding) and re-pads.
.nd-body {
  background-color: $kui-color-background-neutral-weakest;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  margin: calc(#{$kui-space-60} * -1);
  min-height: 100%;
  padding: $kui-space-70 $kui-space-60 $kui-space-130;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}

// ── Sections ──────────────────────────────────────────────────────────────
.detail-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
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

// ── Cards ─────────────────────────────────────────────────────────────────
.detail-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-70;
}

.provisioning-panel {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.provisioning-row {
  align-items: center;
  display: flex;
  gap: $kui-space-60;
  padding: $kui-space-40 $kui-space-0;

  &:not(:last-child) {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }

  .provisioning-label {
    color: $kui-color-text-neutral;
    font-weight: $kui-font-weight-semibold;
    min-width: 160px;
  }
}

.stuck-actions {
  display: flex;
  gap: $kui-space-40;
}

.section-header {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;

  .section-header-text {
    display: flex;
    flex-direction: column;
    gap: $kui-space-20;
  }

  .section-title {
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-bold;
    margin: $kui-space-0;
  }

  .section-help {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    margin: $kui-space-0;
  }
}

.section-note {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

// ── Light data tables ───────────────────────────────────────────────────────
.rows-table {
  border-collapse: collapse;
  width: 100%;

  th {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-40 $kui-space-50;
    text-align: left;
  }

  td {
    border-top: $kui-border-width-10 solid $kui-color-border;
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    padding: $kui-space-60 $kui-space-50;
    vertical-align: middle;
  }

  .details-cell {
    color: $kui-color-text-neutral-stronger;
  }

  .clickable-row {
    cursor: pointer;

    &:hover td {
      background-color: $kui-color-background-neutral-weakest;
    }
  }
}

.mini-empty {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.row-action {
  color: $kui-color-text-primary;
  cursor: pointer;
  font-size: $kui-font-size-30;
  text-decoration: none;

  &:hover { text-decoration: underline; }

  &--danger { color: $kui-color-text-danger; }
}

.dns-actions-cell {
  display: flex;
  gap: $kui-space-60;
}

.dns-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.dns-field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.dns-value {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
}

.dash {
  color: $kui-color-text-neutral;
}

.conn-name {
  font-weight: $kui-font-weight-semibold;
}

.next-action {
  color: $kui-color-text-neutral-stronger;
  font-size: $kui-font-size-30;
}

// ── Needs-attention list ────────────────────────────────────────────────────
.issue-alerts {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

// ── About this network strip ─────────────────────────────────────────────────
.about-strip {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  margin-bottom: $kui-space-60;
  padding: $kui-space-60 $kui-space-70;
}

// White card wrapper for tab tables (on the gray page)
.table-card {
  padding: $kui-space-40 $kui-space-60;
}

.about-strip-top {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-60;
  justify-content: space-between;
}

.about-strip-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
  margin: $kui-space-0;
}

.about-strip-time {
  align-items: center;
  color: $kui-color-text-neutral;
  display: inline-flex;
  font-size: $kui-font-size-20;
  gap: $kui-space-20;
}

.about-strip-ids {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-70;
}

.about-id {
  align-items: center;
  display: inline-flex;
  gap: $kui-space-30;
}

.about-id-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  text-transform: uppercase;
}

// ── Facts strip ──────────────────────────────────────────────────────────────
.facts-strip {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  overflow: hidden;
}

.fact-col {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-60 $kui-space-70;

  &:not(:last-child) {
    border-right: $kui-border-width-10 solid $kui-color-border;
  }
}

.fact-label {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
}

.fact-value {
  align-items: center;
  color: $kui-color-text-neutral-stronger;
  display: flex;
  font-size: $kui-font-size-40;
  gap: $kui-space-30;
}

// ── Next step ────────────────────────────────────────────────────────────────
.next-step-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  margin-bottom: $kui-space-60;
  padding: $kui-space-70;
}

.next-step-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.next-step-close {
  align-items: center;
  background: none;
  border: none;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: flex;
  padding: $kui-space-20;

  &:hover { color: $kui-color-text; }
}

.next-step-grid {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.next-step-item {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: pointer;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-60;
  text-align: left;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &:hover {
    border-color: $kui-color-border-primary;
    box-shadow: $kui-shadow;
  }
}

.next-step-icon {
  align-items: center;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex: 0 0 auto;
  height: 40px;
  justify-content: center;
  width: 40px;

  &--purple { background-color: $kui-color-background-decorative-purple-weakest; color: $kui-color-text-decorative-purple; }
  &--teal { background-color: $kui-color-background-success-weakest; color: $kui-color-text-success; }
  &--pink { background-color: $kui-color-background-danger-weakest; color: $kui-color-text-danger; }
}

.next-step-text {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  min-width: 0;
}

.next-step-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.next-step-desc {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  line-height: $kui-line-height-30;
}

// ── Overview two-column: placement + attached gateway (symmetric) ─────────────
.overview-cols {
  align-items: stretch;
  display: grid;
  gap: $kui-space-70;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.placement-card,
.gateway-card {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  height: 100%;
}

.placement-head {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.detail-hr {
  background-color: $kui-color-border;
  border: none;
  height: $kui-border-width-10;
  margin: $kui-space-0;
  width: 100%;
}

.gw-body {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.gw-name {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
}

.gw-type {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.gw-facts {
  display: flex;
  gap: $kui-space-90;
  margin-top: $kui-space-50;
}

.gw-empty {
  margin: $kui-space-0;
}

.mono-text {
  color: $kui-color-text;
  font-family: $kui-font-family-code;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

// ── Resource cards (private connectivity + DNS), UX note Obs_06 ───────────────
.resource-grid {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.resource-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  padding: $kui-space-60;
  text-align: left;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &:hover {
    border-color: $kui-color-border-primary;
    box-shadow: $kui-shadow;
  }
}

.resource-card-head {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  justify-content: space-between;
}

.resource-card-name {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.resource-card-type {
  color: $kui-color-text-neutral-stronger;
  font-size: $kui-font-size-30;
}

.resource-card-meta {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.resource-card-footer {
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-direction: column;
  gap: $kui-space-10;
  margin-top: $kui-space-20;
  padding-top: $kui-space-40;
}

.resource-card-action {
  color: $kui-color-text-neutral-stronger;
  font-size: $kui-font-size-20;
}

.resource-card-checked {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.issue-alert-body {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-60;
  justify-content: space-between;
}

.blocked-message {
  margin-bottom: $kui-space-50;
  margin-top: $kui-space-0;
}

.not-found {
  padding: $kui-space-80;
}

// ── About this network (consolidated metadata block) ──────────────────────────
.about-card {
  gap: $kui-space-60;
}

.about-head {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-60;
  justify-content: space-between;
}

.about-time {
  align-items: center;
  color: $kui-color-text-neutral;
  display: inline-flex;
  font-size: $kui-font-size-20;
  gap: $kui-space-20;
}

.about-grid {
  display: grid;
  gap: $kui-space-60 $kui-space-70;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.about-item {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  min-width: 0;
}

.about-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
}

.about-value {
  align-items: center;
  color: $kui-color-text;
  display: flex;
  font-size: $kui-font-size-40;
  gap: $kui-space-30;
}

// ── Overview summary cards (private connectivity / private DNS) ───────────────
.summary-card {
  gap: $kui-space-50;
  height: 100%;
}

.summary-head {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  justify-content: space-between;
}

.summary-count {
  align-items: baseline;
  display: flex;
  gap: $kui-space-30;
}

.summary-number {
  color: $kui-color-text;
  font-size: $kui-font-size-70;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-30;
}

.summary-unit {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.summary-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30;
}

.summary-types {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin: $kui-space-0;
}

// ── Section header actions (toggle + button) ──────────────────────────────────
.section-header-actions {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: $kui-space-50;
}

// ── Connectivity stack view ───────────────────────────────────────────────────
.conn-stack {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: $kui-space-0;
}

.stack-network-card {
  align-items: center;
  gap: $kui-space-20;
  width: 100%;
}

.stack-network-name {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
}

.stack-network-meta {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.stack-connector {
  background-color: $kui-color-border;
  height: $kui-space-70;
  width: $kui-border-width-20;
}

.stack-cards {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  width: 100%;
}

.stack-conn-card {
  cursor: pointer;
  gap: $kui-space-40;
  text-align: left;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &:hover {
    border-color: $kui-color-border-primary;
    box-shadow: $kui-shadow;
  }
}

.stack-conn-head {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  justify-content: space-between;
}

.stack-conn-type {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.stack-conn-name {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.stack-conn-details {
  display: grid;
  gap: $kui-space-20 $kui-space-40;
  grid-template-columns: auto 1fr;
  margin: $kui-space-0;

  dt {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }

  dd {
    color: $kui-color-text;
    font-family: $kui-font-family-code;
    font-size: $kui-font-size-20;
    margin: $kui-space-0;
    overflow-wrap: anywhere;
  }
}

.stack-conn-checked {
  border-top: $kui-border-width-10 solid $kui-color-border;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  padding-top: $kui-space-40;
}
</style>
