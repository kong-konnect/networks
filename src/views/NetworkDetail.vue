<template>
  <PageLayout
    v-if="network"
    :title="network.name"
    :back-to="{ name: 'networks-list' }"
  >
    <template #title-after>
      <KBadge :appearance="networkStatusBadge(network.status)">
        {{ networkStatusText(network.status) }}
      </KBadge>
    </template>

    <template #actions>
      <KButton
        v-if="network.status === 'ready'"
        appearance="primary"
        @click="goToAddConnection"
      >
        <AddCircleIcon decorative />
        Add connection
      </KButton>
      <KButton
        appearance="tertiary"
        @click="handleDeleteNetwork"
      >
        <TrashIcon decorative />
        Delete
      </KButton>
    </template>

    <!-- Subtitle -->
    <p class="network-subtitle">{{ networkSubtitle }}</p>

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

        <KCard>
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
        </KCard>

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
      <KTabs v-model="activeTab" :tabs="tabs" />

      <!-- ── Overview tab ─────────────────────────────────────── -->
      <div v-if="activeTab === '#overview'" class="tab-content">
        <KCard title="Network details">
          <ConfigCardDisplay :property-collections="networkConfigCollections" />
        </KCard>

        <KAlert
          v-if="network.attachedGatewayCount === 0"
          appearance="warning"
          message="This network has no attached gateways. You are paying for an unused network."
        >
          <template #title>No gateways attached</template>
          <template #default>
            <KButton appearance="danger" size="small" @click="handleDeleteNetwork">
              Delete network
            </KButton>
          </template>
        </KAlert>

        <KCard title="Status">
          <table class="rows-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Status</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in statusRows" :key="row.area">
                <td>{{ row.area }}</td>
                <td><KBadge :appearance="row.badge">{{ row.status }}</KBadge></td>
                <td class="details-cell">{{ row.details }}</td>
                <td>
                  <a
                    v-if="row.action"
                    class="row-action"
                    href="#"
                    @click.prevent="row.action.handler()"
                  >{{ row.action.label }}</a>
                  <span v-else class="dash">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </KCard>
      </div>

      <!-- ── Connectivity tab ─────────────────────────────────── -->
      <div v-if="activeTab === '#connectivity'" class="tab-content">
        <div class="section-header">
          <div class="section-header-text">
            <h2 class="section-title">Connectivity</h2>
            <p class="section-help">Private connectivity resources attached to this network.</p>
          </div>
          <KButton appearance="primary" @click="goToAddConnection">
            <AddCircleIcon decorative />
            Add connection
          </KButton>
        </div>

        <template v-if="connections.length === 0">
          <KEmptyState
            icon-variant="kong"
            title="No private connections configured"
            message="Add a connection to let clients reach Kong, let Kong reach upstreams, or connect private networks."
            action-button-text="Add connection"
            @click-action="goToAddConnection"
          />
        </template>

        <template v-else>
          <KSegmentedControl
            v-model="connectivityView"
            :options="connectivityViewOptions"
          />

          <!-- Table view -->
          <EntityBaseTable
            v-if="connectivityView === 'table'"
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
            <template #type="{ row }">
              {{ connectionTypeLabel(row.type) }}
            </template>
            <template #direction="{ row }">
              {{ directionLabel(row) }}
            </template>
            <template #scope="{ row }">
              {{ scopeLabel(row) }}
            </template>
            <template #status="{ row }">
              <KBadge :appearance="statusBadgeAppearance(row.status)">{{ statusLabel(row.status) }}</KBadge>
            </template>
            <template #nextAction="{ row }">
              <span v-if="row.status !== 'ready'" class="next-action">{{ nextActionText(row) }}</span>
              <span v-else class="dash">—</span>
            </template>
            <template #lastChecked="{ row }">
              <span v-if="row.status !== 'ready'">{{ timeAgo(row.lastCheckedAt) }}</span>
              <span v-else class="dash">—</span>
            </template>
            <template #actions="{ row }">
              <a class="row-action" href="#" @click.prevent="goToConnection(row.id)">View</a>
            </template>
          </EntityBaseTable>

          <!-- Map view -->
          <ConnectivityMap
            v-else
            :network="network"
            :connections="connections"
            @select="goToConnection"
          />
        </template>
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

        <KCard v-if="network.dnsConfigs && network.dnsConfigs.length > 0">
          <table class="rows-table">
            <thead>
              <tr>
                <th>Name / domain</th>
                <th>Type</th>
                <th>Status</th>
                <th>Used for</th>
                <th>Last checked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dns in network.dnsConfigs" :key="dns.id">
                <td class="dns-domain">{{ dns.name }}</td>
                <td>{{ dnsTypeLabel(dns.type) }}</td>
                <td>
                  <KBadge :appearance="dnsStatusBadge(dns.status)">{{ dnsStatusLabel(dns.status) }}</KBadge>
                </td>
                <td>{{ dns.usedFor }}</td>
                <td>
                  <span v-if="dns.status !== 'ready' && dns.lastCheckedAt">{{ timeAgo(dns.lastCheckedAt) }}</span>
                  <span v-else class="dash">—</span>
                </td>
                <td>
                  <a class="row-action" href="#" @click.prevent="goToDns(dns.id)">View</a>
                </td>
              </tr>
            </tbody>
          </table>
        </KCard>

        <KEmptyState
          v-else
          icon-variant="kong"
          title="No private DNS configured"
          message="Add a private DNS configuration to resolve private service names reached through this network."
          action-button-text="Add private DNS"
          data-testid="dns-empty-state"
          @click-action="openAddDns"
        />

        <p class="section-note">Private DNS resolves names for services reached through private connectivity.</p>
      </div>

      <!-- ── Events tab ───────────────────────────────────────── -->
      <div v-if="activeTab === '#events'" class="tab-content">
        <KCard>
          <table class="rows-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Resource</th>
                <th>Event</th>
                <th>Actor</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ev, idx) in (network.events || [])" :key="idx">
                <td>{{ timeAgo(ev.time) }}</td>
                <td>{{ ev.resource }}</td>
                <td class="details-cell">{{ ev.event }}</td>
                <td>{{ ev.actor }}</td>
                <td><KBadge :appearance="resultBadge(ev.result)">{{ ev.result }}</KBadge></td>
              </tr>
              <tr v-if="!network.events || network.events.length === 0">
                <td colspan="5" class="dash">No events recorded.</td>
              </tr>
            </tbody>
          </table>
        </KCard>
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
import { AddCircleIcon, TrashIcon } from '@kong/icons'
import {
  KAlert,
  KBadge,
  KButton,
  KCard,
  KEmptyState,
  KModal,
  KSegmentedControl,
  KTabs,
  KInput,
  KLabel,
  KSelect,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import ConfigCardDisplay from '@/components/ConfigCardDisplay.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import ConnectivityMap from '@/components/ConnectivityMap.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { NetworkStatus, Connection, DnsType, DnsStatus } from '@/types'
import {
  connectionTypeLabel,
  directionLabel,
  scopeLabel,
  statusLabel,
  statusBadgeAppearance,
  nextActionText,
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
const connectivityView = ref('table')
const showDeleteModal = ref(false)
const showBlockedModal = ref(false)

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

const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#connectivity', title: 'Connectivity' },
  { hash: '#dns', title: 'Private DNS' },
  { hash: '#events', title: 'Events' },
]

const connectivityViewOptions = [
  { label: 'Table', value: 'table' },
  { label: 'Map', value: 'map' },
]

const connectionHeaders = [
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Type', key: 'type', sortable: false },
  { label: 'Direction', key: 'direction', sortable: false },
  { label: 'Scope', key: 'scope', sortable: false },
  { label: 'Status', key: 'status', sortable: false },
  { label: 'Next action', key: 'nextAction', sortable: false },
  { label: 'Last checked', key: 'lastChecked', sortable: false },
  { label: '', key: 'actions', sortable: false },
]

const networkSubtitle = computed(() => {
  if (!network.value) return ''
  const r = network.value.regions[0]
  return `${network.value.cloud.toUpperCase()} · ${r.region} · ${r.cidr}`
})

const isStuck = computed(() => {
  if (!network.value || network.value.status !== 'initialising') return false
  const elapsedMs = Date.now() - new Date(network.value.createdAt).getTime()
  return elapsedMs / 60000 > 90
})

const ingressConnections = computed(() =>
  connections.value.filter(c => c.direction === 'ingress' && c.scope !== 'network-level' && !isPeering(c)),
)
const egressConnections = computed(() =>
  connections.value.filter(c => c.direction === 'egress' && c.scope !== 'network-level' && !isPeering(c)),
)
const peeringConnections = computed(() =>
  connections.value.filter(c => isPeering(c) || c.scope === 'network-level'),
)

function isPeering(c: Connection): boolean {
  return ['aws-vpc-peering', 'aws-transit-gateway', 'gcp-vpc-peering', 'azure-vnet-peering', 'azure-virtual-hub'].includes(c.type)
}

const statusRows = computed(() => {
  if (!network.value) return []
  const rows: {
    area: string
    status: string
    badge: string
    details: string
    action: { label: string; handler: () => void } | null
  }[] = []

  rows.push({
    area: 'Network',
    status: 'Ready',
    badge: 'success',
    details: `Provisioned in ${network.value.cloud.toUpperCase()} / ${network.value.regions[0].region}`,
    action: null,
  })

  const gwCount = network.value.attachedGatewayCount
  rows.push({
    area: 'Gateway usage',
    status: gwCount > 0 ? 'Attached' : 'Unused',
    badge: gwCount > 0 ? 'success' : 'warning',
    details: gwCount > 0 ? `${gwCount} attached · ${gateways.value.map(g => g.name).join(', ')}` : 'No gateways attached',
    action: gwCount > 0
      ? { label: 'View gateways', handler: () => router.push({ name: 'networks-list' }) }
      : null,
  })

  const pending = connections.value.some(c => c.status === 'pending-user-action' || c.status === 'pending-acceptance')
  const connError = connections.value.some(c => c.status === 'error')
  rows.push({
    area: 'Connectivity',
    status: connError ? 'Error' : pending ? 'Needs action' : 'Ready',
    badge: connError ? 'danger' : pending ? 'warning' : 'success',
    details: connError
      ? 'A connection has an error'
      : pending
        ? 'REP ingress waiting for customer action'
        : `${connections.value.length} connection${connections.value.length === 1 ? '' : 's'} ready`,
    action: { label: 'View connectivity', handler: () => { activeTab.value = '#connectivity' } },
  })

  const dnsList = network.value.dnsConfigs || []
  if (dnsList.length) {
    const errDns = dnsList.find(d => d.status === 'error')
    const pendingDns = dnsList.find(d => d.status === 'pending')
    rows.push({
      area: 'Private DNS',
      status: errDns ? 'Error' : pendingDns ? 'Pending' : 'Ready',
      badge: errDns ? 'danger' : pendingDns ? 'warning' : 'success',
      details: errDns
        ? `${errDns.name} — ${errDns.resolverDetails || 'resolver error'}`
        : pendingDns
          ? `${pendingDns.name} is provisioning`
          : `${dnsList.length} DNS configuration${dnsList.length === 1 ? '' : 's'} healthy`,
      action: { label: 'View private DNS', handler: () => { activeTab.value = '#dns' } },
    })
  }

  return rows
})

const networkConfigCollections = computed(() => {
  if (!network.value) return []
  const r = network.value.regions[0]
  return [
    {
      items: [
        { key: 'provider', label: 'Provider', value: network.value.cloud.toUpperCase(), type: 'plain' as const },
        { key: 'region', label: 'Region', value: network.value.regions.map(x => x.region).join(', '), type: 'plain' as const },
        { key: 'cidr', label: 'CIDR', value: network.value.regions.map(x => x.cidr).join(', '), type: 'plain' as const },
        { key: 'zones', label: 'Zones', value: (r.zones && r.zones.length) ? r.zones.join(', ') : '—', type: 'plain' as const },
        { key: 'usedBy', label: 'Used by', value: `${network.value.attachedGatewayCount} gateway${network.value.attachedGatewayCount === 1 ? '' : 's'}`, type: 'plain' as const },
        { key: 'status', label: 'Status', value: networkStatusText(network.value.status), type: 'plain' as const },
        ...(network.value.providerNetworkId ? [{
          key: 'providerNetworkId',
          label: 'Network ID',
          value: network.value.providerNetworkId,
          type: 'copy' as const,
        }] : []),
      ],
    },
  ]
})

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

function resultBadge(result: string): string {
  const l = result.toLowerCase()
  if (l === 'success') return 'success'
  if (l === 'error') return 'danger'
  if (l === 'pending') return 'warning'
  return 'neutral'
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

.network-subtitle {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.provisioning-panel {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
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
    font-weight: $kui-font-weight-semibold;
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

.rows-table {
  border-collapse: collapse;
  width: 100%;

  th {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-40 $kui-space-50;
    text-align: left;
    text-transform: uppercase;
  }

  td {
    border-top: $kui-border-width-10 solid $kui-color-border;
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    padding: $kui-space-50;
    vertical-align: middle;
  }

  .details-cell {
    color: $kui-color-text-neutral-stronger;
  }
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

.connectivity-map {
  align-items: stretch;
  display: flex;
  gap: $kui-space-40;

  .map-column {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $kui-space-40;

    .map-column-title {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
      font-weight: $kui-font-weight-semibold;
      text-transform: uppercase;
    }
  }

  .map-column-center {
    flex: 1.2;
  }

  .map-network-box {
    background-color: $kui-color-background-primary-weakest;
    border: $kui-border-width-10 solid $kui-color-border-primary-weak;
    border-radius: $kui-border-radius-30;
    display: flex;
    flex-direction: column;
    gap: $kui-space-20;
    padding: $kui-space-50;

    .map-network-name {
      font-weight: $kui-font-weight-semibold;
    }

    .map-network-sub {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
    }
  }

  .map-node {
    background-color: $kui-color-background;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-30;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: $kui-space-20;
    padding: $kui-space-40 $kui-space-50;
    transition: border-color 0.15s ease-in;

    &:hover { border-color: $kui-color-border-primary; }

    .map-node-name { font-weight: $kui-font-weight-semibold; }

    .map-node-type {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
    }

    .map-node-action {
      color: $kui-color-text-neutral-stronger;
      font-size: $kui-font-size-20;
    }
  }

  .map-node-peering {
    border-style: dashed;
  }

  .map-empty {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }

  .map-arrows {
    align-items: center;
    display: flex;

    .map-arrow {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-60;
    }
  }
}

.blocked-message {
  margin-bottom: $kui-space-50;
  margin-top: $kui-space-0;
}

.not-found {
  padding: $kui-space-80;
}
</style>
