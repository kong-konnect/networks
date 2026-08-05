<template>
  <PageLayout title="Networks">
    <template #title-after>
      <ConnectionsIcon
        :color="KUI_COLOR_TEXT_DECORATIVE_AQUA"
        :size="KUI_ICON_SIZE_30"
        decorative
      />
    </template>

    <template #actions>
      <KButton appearance="primary" @click="router.push({ name: 'networks-create' })">
        <AddCircleIcon decorative />
        New network
      </KButton>
    </template>

    <div class="networks-list">
      <!-- Empty state (Day 1) — start here and build up -->
      <section v-if="isEmpty" class="networks-empty" data-testid="networks-empty">
        <span class="empty-icon"><ConnectionsIcon :size="KUI_ICON_SIZE_50" decorative /></span>
        <h2 class="empty-title">Create your first network</h2>
        <p class="empty-desc">
          A network is a private, single-region space in your cloud where Kong runs dedicated cloud gateways. Create one, then add the private connectivity and DNS your services need.
        </p>
        <div class="empty-actions">
          <KButton appearance="primary" data-testid="empty-create" @click="router.push({ name: 'networks-create' })">
            <AddCircleIcon decorative />
            Create network
          </KButton>
          <KButton
            appearance="tertiary"
            @click="openDocs"
          >
            Learn more
          </KButton>
        </div>

        <!-- KAi setup assist — describe the goal, KAi proposes the network + connectivity + DNS -->
        <div class="empty-kai">
          <div class="empty-kai-input" :class="{ 'is-focused': kaiPrompt.length > 0 }">
            <SparklesIcon class="empty-kai-spark" :size="KUI_ICON_SIZE_30" decorative />
            <input
              v-model="kaiPrompt"
              class="empty-kai-field"
              type="text"
              placeholder="Describe what you're connecting and KAi will set it up…"
              data-testid="empty-kai-input"
              @keyup.enter="runKaiSetup"
            >
            <button
              type="button"
              class="empty-kai-send"
              :disabled="!kaiPrompt.trim()"
              aria-label="Ask KAi"
              data-testid="empty-kai-send"
              @click="runKaiSetup"
            >
              <ForwardIcon :size="KUI_ICON_SIZE_20" decorative />
            </button>
          </div>
          <div class="empty-kai-chips">
            <span class="empty-kai-try">Try</span>
            <button
              v-for="ex in kaiExamples"
              :key="ex"
              type="button"
              class="empty-kai-chip"
              @click="useKaiExample(ex)"
            >
              {{ ex }}
            </button>
          </div>

          <KaiSummaryCard
            v-if="kaiSetup.shown.value"
            class="empty-kai-card"
            :loading="kaiSetup.loading.value"
            title="KAi setup plan"
            :insights="kaiSetupInsights"
            :actions="kaiSetupActions"
            data-testid="empty-kai-plan"
            @action="onKaiSetupAction"
            @close="kaiSetup.close()"
          />
        </div>
        <!-- How a network sits between your clients and your services -->
        <div class="empty-diagram" aria-hidden="true">
          <div class="flow-node">
            <span class="flow-icon"><PeopleIcon :size="KUI_ICON_SIZE_30" decorative /></span>
            <span class="flow-title">Client</span>
            <span class="flow-sub">Your users and apps</span>
          </div>
          <div class="flow-link">
            <span class="flow-link-row"><span class="flow-link-label">Request</span><span class="flow-arrow">→</span></span>
            <span class="flow-link-row"><span class="flow-arrow">←</span><span class="flow-link-label flow-link-label--muted">Response</span></span>
          </div>
          <div class="flow-node flow-node--center">
            <span class="flow-icon"><WorldPrivateIcon :size="KUI_ICON_SIZE_30" decorative /></span>
            <span class="flow-title">Kong network</span>
            <span class="flow-sub">Private connectivity + DNS</span>
          </div>
          <div class="flow-link">
            <span class="flow-link-row"><span class="flow-link-label">Reaches</span><span class="flow-arrow">→</span></span>
          </div>
          <div class="flow-node">
            <span class="flow-icon"><StackIcon :size="KUI_ICON_SIZE_30" decorative /></span>
            <span class="flow-title">Your services</span>
            <span class="flow-sub">Private APIs and upstreams</span>
          </div>
        </div>
      </section>

      <template v-else>
      <!-- Filter row -->
      <div class="list-toolbar">
        <div class="filter-controls">
          <KSelect
            v-model="statusFilter"
            :items="statusFilterItems"
            appearance="select"
            placeholder="All statuses"
          />
        </div>
      </div>

      <!-- Networks table -->
      <EntityBaseTable
        :fetcher="fetcher"
        :fetcher-cache-key="String(fetcherCacheKey)"
        :headers="displayHeaders"
        hide-card
        :hide-toolbar="true"
        table-preferences-key="networks-list"
        @row:click="handleRowClick"
      >
        <template #name="{ row }">
          <router-link
            class="name-link"
            :to="{ name: 'networks-detail', params: { id: row.id } }"
            @click.stop
          >
            {{ row.name }}
          </router-link>
        </template>

        <template #status="{ row }">
          <KBadge :appearance="stateBadgeAppearance(row.status)">
            {{ stateLabel(row.status) }}
          </KBadge>
        </template>

        <template #networkId="{ row }">
          <KCopy
            v-if="row.providerNetworkId"
            format="short"
            :text="row.providerNetworkId"
          />
          <span v-else class="dash">—</span>
        </template>

        <template #cgws="{ row }">
          <span
            v-if="row.attachedGatewayCount === 0"
            class="cgws-unused"
          >
            0
            <KTooltip text="Not used by any gateways. Delete this network to reduce your cost.">
              <WarningIcon class="warn-icon" :size="KUI_ICON_SIZE_20" />
            </KTooltip>
          </span>
          <template v-else>{{ row.attachedGatewayCount }}</template>
        </template>

        <template #provider="{ row }">
          <span class="cell-icon">
            <component :is="providerIcon(row.cloud)" :size="KUI_ICON_SIZE_20" decorative />
            {{ providerLabel(row.cloud) }}
          </span>
        </template>

        <template #regions="{ row }">
          <span class="cell-icon">
            <component :is="regionFlag(row.regions[0].region)" :size="KUI_ICON_SIZE_20" decorative />
            {{ regionLabel(row.regions[0].region) }}
          </span>
        </template>

        <template #cidr="{ row }">
          <span class="regions-text">{{ row.regions[0]?.cidr }}</span>
        </template>

        <template #zones="{ row }">
          <span class="regions-text">{{ zonesLabel(row) }}</span>
        </template>

        <template #privateNetworking="{ row }">
          <KBadge v-if="hasPrivateNetworking(row)" appearance="success">Configured</KBadge>
          <span v-else class="pn-none">Not configured</span>
        </template>

        <template #privateDns="{ row }">
          <KBadge v-if="hasDns(row)" appearance="success">Configured</KBadge>
          <span v-else class="pn-none">Not configured</span>
        </template>

        <template #action-items="{ row }">
          <KDropdownItem @click="handleRowClick({ row })">
            View details
          </KDropdownItem>
          <KDropdownItem
            :disabled="row.status !== 'ready'"
            @click.stop="goToAddConnection(row)"
          >
            Add connection
          </KDropdownItem>
          <KDropdownItem
            :disabled="row.status !== 'ready'"
            @click.stop="goToTestEndpoint(row)"
          >
            Test endpoint
          </KDropdownItem>
          <KDropdownItem
            danger
            has-divider
            @click.stop="handleDeleteClick(row)"
          >
            Delete
          </KDropdownItem>
        </template>

        <template #empty-state>
          <KEmptyState
            icon-variant="kong"
            title="No networks"
            message="Create your first network to get started with private connectivity."
            action-button-text="New network"
            @click-action="router.push({ name: 'networks-create' })"
          />
        </template>
      </EntityBaseTable>
      </template>
    </div>
  </PageLayout>

  <!-- Delete confirmation modal -->
  <KModal
    :visible="showDeleteModal"
    title="Delete network"
    @cancel="showDeleteModal = false"
    @proceed="confirmDelete"
  >
    <p>
      Are you sure you want to delete <strong>{{ networkToDelete?.name }}</strong>?
      This action cannot be undone.
    </p>
  </KModal>

  <!-- Blocked: network in use by gateways -->
  <KModal
    :visible="showBlockedDeleteModal"
    title="Can't delete this network"
    action-button-text="Close"
    :hide-cancel-button="true"
    @proceed="showBlockedDeleteModal = false"
    @cancel="showBlockedDeleteModal = false"
  >
    <p>
      <strong>{{ networkToDelete?.name }}</strong> is used by
      {{ networkToDelete?.attachedGatewayCount }} gateway{{ networkToDelete?.attachedGatewayCount === 1 ? '' : 's' }}.
      Detach {{ networkToDelete?.attachedGatewayCount === 1 ? 'it' : 'them' }} before deleting this network.
    </p>
  </KModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_ICON_SIZE_20,
  KUI_ICON_SIZE_30,
  KUI_ICON_SIZE_50,
} from '@kong/design-tokens'
import {
  AddCircleIcon,
  ConnectionsIcon,
  ForwardIcon,
  PeopleIcon,
  SparklesIcon,
  StackIcon,
  WarningIcon,
  WorldPrivateIcon,
} from '@kong/icons'
import {
  KBadge,
  KButton,
  KCopy,
  KDropdownItem,
  KEmptyState,
  KModal,
  KSelect,
  KTooltip,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import { useKaiPanel } from '@/composables/useKaiPanel'
import { providerIcon, providerLabel, regionFlag, regionLabel } from '@/utils/regionDisplay'
import type { Network } from '@/types'

const router = useRouter()
const store = useNetworksStore()

const statusFilter = ref('')
const fetcherCacheKey = ref(0)
const showDeleteModal = ref(false)
const showBlockedDeleteModal = ref(false)
const networkToDelete = ref<Network | null>(null)

const statusFilterItems = [
  { label: 'All statuses', value: '' },
  { label: 'Provisioning', value: 'initialising' },
  { label: 'Ready', value: 'ready' },
  { label: 'Error', value: 'error' },
]

const displayHeaders = [
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Status', key: 'status', sortable: true },
  { label: 'Network ID', key: 'networkId', sortable: false },
  { label: 'CGWs', key: 'cgws', sortable: true },
  { label: 'Provider', key: 'provider', sortable: true },
  { label: 'Region', key: 'regions', sortable: false },
  { label: 'CIDR', key: 'cidr', sortable: false },
  { label: 'Zones', key: 'zones', sortable: false },
  { label: 'Private connectivity', key: 'privateNetworking', sortable: false },
  { label: 'Private DNS', key: 'privateDns', sortable: false },
]

// Networks visible for the current prototype day-mode (Day 1 = only session-created).
const visibleNetworks = computed(() => store.getVisibleNetworks())
const isEmpty = computed(() => visibleNetworks.value.length === 0)

const openDocs = () => {
  window.open('https://docs.konghq.com/konnect/gateway-manager/dedicated-cloud-gateways/', '_blank')
}

// ── KAi setup assist (Day 1 empty state) ──────────────────────────────────────
// Describe the goal → KAi proposes the whole setup (network + connectivity + DNS) and
// can kick off creation. This is the "start with KAi" entry point for first-time setup.
const kaiPrompt = ref('')
const kaiSetup = useKaiPanel(1100)
const kaiExamples = [
  'Private access to our payments API in AWS',
  'Peer with our production VPC',
  'Resolve internal service DNS',
]
const useKaiExample = (ex: string) => {
  kaiPrompt.value = ex
  runKaiSetup()
}
const runKaiSetup = () => {
  if (!kaiPrompt.value.trim()) return
  kaiSetup.run()
}
const kaiSetupInsights = computed<KaiInsight[]>(() => [
  { lead: 'Here\'s a plan:', text: 'create a private network in AWS (us-east-1) with a /16 CIDR across 3 availability zones — room to grow, and the CIDR can\'t change later.' },
  { text: 'Then add a resource-endpoint connection so the gateway can reach your upstreams privately, and a private hosted zone to resolve your internal service names.' },
])
const kaiSetupActions: KaiAction[] = [
  { key: 'create', label: 'Create network with these settings' },
]
const onKaiSetupAction = (key: string) => {
  if (key === 'create') router.push({ name: 'networks-create' })
}

const fetcher = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  let data = visibleNetworks.value
  if (statusFilter.value) {
    data = data.filter(n => n.status === statusFilter.value)
  }
  return { data, total: data.length }
}

// Refetch when the day-mode changes so the table reflects the switch.
watch(() => store.dayMode.value, () => { fetcherCacheKey.value++ })

// Network lifecycle state, shown inline in the Name cell (production pattern).
const stateLabel = (status: string) =>
  status === 'terminating' ? 'Deleting'
    : status === 'ready' ? 'Ready'
      : status === 'initialising' ? 'Initializing'
        : status === 'error' ? 'Error' : status
const stateBadgeAppearance = (status: string) =>
  status === 'ready' ? 'success'
    : status === 'initialising' ? 'warning'
      : status === 'error' ? 'danger'
        : status === 'terminating' ? 'neutral' : 'info'

const zonesLabel = (network: Network) => {
  const zones = network.regions.flatMap(r => r.zones ?? [])
  return zones.length ? zones.join(', ') : '—'
}

// Private-networking attachment type(s) present on the network's connections.
const PRIVATE_NETWORKING_LABELS: Record<string, string> = {
  'aws-vpc-peering': 'VPC Peering',
  'gcp-vpc-peering': 'VPC Peering',
  'azure-vnet-peering': 'Virtual network peering',
  'aws-transit-gateway': 'Transit Gateway',
  'azure-virtual-hub': 'Virtual hub peering',
}
const hasPrivateNetworking = (network: Network): boolean =>
  store.getConnectionsByNetworkId(network.id).length > 0

const hasDns = (network: Network): boolean =>
  (network.dnsConfigs?.length ?? 0) > 0

const goToAddConnection = (network: Network) =>
  router.push({ name: 'networks-add-connection', params: { id: network.id } })

const goToTestEndpoint = (network: Network) =>
  router.push({ name: 'networks-test-endpoint', params: { id: network.id } })

const privateNetworkingLabels = (network: Network): string[] => {
  const conns = store.getConnectionsByNetworkId(network.id)
  const labels = new Set<string>()
  for (const c of conns) {
    labels.add(PRIVATE_NETWORKING_LABELS[c.type] ?? 'Resource Endpoints')
  }
  return [...labels]
}

const cloudBadgeAppearance = (cloud: string) => {
  if (cloud === 'aws') return 'warning'
  if (cloud === 'gcp') return 'info'
  if (cloud === 'azure') return 'decorative-purple'
  return 'neutral'
}

const handleRowClick = ({ row }: { row: Network }) => {
  router.push({ name: 'networks-detail', params: { id: row.id } })
}

const handleDeleteClick = (network: Network) => {
  networkToDelete.value = network
  // Guardrail: a network in use by gateways can't be deleted — explain why
  // instead of silently disabling the action.
  if (network.attachedGatewayCount > 0) {
    showBlockedDeleteModal.value = true
  } else {
    showDeleteModal.value = true
  }
}

const confirmDelete = () => {
  if (networkToDelete.value) {
    store.deleteNetwork(networkToDelete.value.id)
    fetcherCacheKey.value++
  }
  showDeleteModal.value = false
  networkToDelete.value = null
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.networks-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

// Day 1 empty state — icon, title, description, actions, then two benefit cards.
.networks-empty {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  padding: $kui-space-130 $kui-space-80;
  text-align: center;

  .empty-icon {
    align-items: center;
    background-color: $kui-color-background-decorative-aqua-weakest;
    border-radius: $kui-border-radius-40;
    color: $kui-color-text-decorative-aqua;
    display: flex;
    height: 56px;
    justify-content: center;
    margin-bottom: $kui-space-60;
    width: 56px;
  }

  .empty-title {
    color: $kui-color-text;
    font-size: $kui-font-size-60;
    font-weight: $kui-font-weight-bold;
    margin: $kui-space-0;
  }

  .empty-desc {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-40;
    line-height: $kui-line-height-50;
    margin: $kui-space-40 $kui-space-0 $kui-space-70;
    max-width: 520px;
  }

  .empty-actions {
    display: flex;
    gap: $kui-space-40;
    margin-bottom: $kui-space-70;
  }

  // KAi setup assist
  .empty-kai {
    display: flex;
    flex-direction: column;
    gap: $kui-space-40;
    margin-bottom: $kui-space-90;
    max-width: 560px;
    width: 100%;
  }

  .empty-kai-input {
    align-items: center;
    background-color: $kui-color-background;
    border: $kui-border-width-10 solid $kui-color-border-decorative-purple;
    border-radius: $kui-border-radius-40;
    display: flex;
    gap: $kui-space-40;
    padding: $kui-space-40 $kui-space-50;
  }

  .empty-kai-spark { color: $kui-color-text-decorative-purple; flex: 0 0 auto; }

  .empty-kai-field {
    background: none;
    border: none;
    color: $kui-color-text;
    flex: 1;
    font-size: $kui-font-size-40;
    outline: none;

    &::placeholder { color: $kui-color-text-neutral; }
  }

  .empty-kai-send {
    align-items: center;
    background-color: $kui-color-background-decorative-purple;
    border: none;
    border-radius: $kui-border-radius-30;
    color: $kui-color-text-inverse;
    cursor: pointer;
    display: inline-flex;
    flex: 0 0 auto;
    padding: $kui-space-30;

    &:disabled { cursor: not-allowed; opacity: 0.4; }
  }

  .empty-kai-chips {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-30;
  }

  .empty-kai-try { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }

  .empty-kai-chip {
    background-color: $kui-color-background;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-round;
    color: $kui-color-text;
    cursor: pointer;
    font-size: $kui-font-size-30;
    padding: $kui-space-30 $kui-space-50;

    &:hover { border-color: $kui-color-border-decorative-purple; color: $kui-color-text-decorative-purple; }
  }

  .empty-kai-card { text-align: left; }

  // Flow explainer: Client → Kong network → your services (Request / Response).
  .empty-diagram {
    align-items: stretch;
    background-color: $kui-color-background-neutral-weakest;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-40;
    display: flex;
    flex-wrap: wrap;
    gap: $kui-space-50;
    justify-content: center;
    max-width: 860px;
    padding: $kui-space-80 $kui-space-70;
    width: 100%;
  }

  .flow-node {
    align-items: center;
    background-color: $kui-color-background;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-40;
    display: flex;
    flex: 0 1 200px;
    flex-direction: column;
    gap: $kui-space-20;
    padding: $kui-space-60;
    text-align: center;

    &--center { border-color: $kui-color-border-primary; }
  }

  .flow-icon { color: $kui-color-text-neutral; }

  .flow-title {
    color: $kui-color-text;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-semibold;
  }

  .flow-sub { color: $kui-color-text-neutral; font-size: $kui-font-size-20; }

  .flow-link {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: $kui-space-20;
    justify-content: center;
  }

  .flow-link-row { align-items: center; display: flex; gap: $kui-space-20; }

  .flow-link-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;

    &--muted { color: $kui-color-text-neutral-weak; }
  }

  .flow-arrow { color: $kui-color-text-neutral; font-size: $kui-font-size-50; }
}

.list-toolbar {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.filter-controls {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.name-cell {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30;

  .name-link {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .warn-icon {
    color: $kui-color-text-warning;
  }
}

.cell-icon {
  align-items: center;
  display: inline-flex;
  gap: $kui-space-30;
  white-space: nowrap;
}

.pn-none {
  color: $kui-color-text-neutral-weak;
  font-size: $kui-font-size-30;
}

.cgws-unused {
  align-items: center;
  color: $kui-color-text-warning;
  display: inline-flex;
  gap: $kui-space-20;

  .warn-icon {
    color: $kui-color-text-warning;
  }
}

.regions-text {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.pn-cell {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30;
}

.dash {
  color: $kui-color-text-neutral;
}
</style>
