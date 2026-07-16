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
          <div class="name-cell">
            <router-link
              class="name-link"
              :to="{ name: 'networks-detail', params: { id: row.id } }"
              @click.stop
            >
              {{ row.name }}
            </router-link>
            <KBadge :appearance="stateBadgeAppearance(row.status)">
              {{ stateLabel(row.status) }}
            </KBadge>
            <KTooltip
              v-if="row.attachedGatewayCount === 0"
              text="This network is not used by any gateways. Delete this network to reduce your cost."
            >
              <WarningIcon
                class="warn-icon"
                :size="KUI_ICON_SIZE_30"
              />
            </KTooltip>
          </div>
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
          {{ row.attachedGatewayCount }}
        </template>

        <template #provider="{ row }">
          <KBadge :appearance="cloudBadgeAppearance(row.cloud)">
            {{ row.cloud.toUpperCase() }}
          </KBadge>
        </template>

        <template #regions="{ row }">
          <span class="regions-text">{{ row.regions.map((r: any) => r.region).join(', ') }}</span>
        </template>

        <template #cidr="{ row }">
          <span class="regions-text">{{ row.regions.map((r: any) => r.cidr).join(', ') }}</span>
        </template>

        <template #zones="{ row }">
          <span class="regions-text">{{ zonesLabel(row) }}</span>
        </template>

        <template #privateNetworking="{ row }">
          <div class="pn-cell">
            <KBadge
              v-for="label in privateNetworkingLabels(row)"
              :key="label"
              appearance="neutral"
            >
              {{ label }}
            </KBadge>
          </div>
        </template>

        <template #action-items="{ row }">
          <KDropdownItem @click="handleRowClick({ row })">
            View details
          </KDropdownItem>
          <KDropdownItem
            danger
            :disabled="row.attachedGatewayCount > 0"
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import {
  AddCircleIcon,
  ConnectionsIcon,
  WarningIcon,
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
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { Network } from '@/types'

const router = useRouter()
const store = useNetworksStore()

const statusFilter = ref('')
const fetcherCacheKey = ref(0)
const showDeleteModal = ref(false)
const networkToDelete = ref<Network | null>(null)

const statusFilterItems = [
  { label: 'All statuses', value: '' },
  { label: 'Provisioning', value: 'initialising' },
  { label: 'Ready', value: 'ready' },
  { label: 'Error', value: 'error' },
]

const displayHeaders = [
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Network ID', key: 'networkId', sortable: false },
  { label: 'CGWs', key: 'cgws', sortable: true },
  { label: 'Provider', key: 'provider', sortable: true },
  { label: 'Region', key: 'regions', sortable: false },
  { label: 'CIDR', key: 'cidr', sortable: false },
  { label: 'Zones', key: 'zones', sortable: false },
  { label: 'Private networking', key: 'privateNetworking', sortable: false },
]

const fetcher = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  // Real, selectable networks only — legacy "default" placeholders and
  // terminating networks are never shown (mirrors production filtering out offline).
  let data = store.getSelectableNetworks()
  if (statusFilter.value) {
    data = data.filter(n => n.status === statusFilter.value)
  }
  return { data, total: data.length }
}

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
const privateNetworkingLabels = (network: Network): string[] => {
  const conns = store.getConnectionsByNetworkId(network.id)
  const labels = new Set<string>()
  for (const c of conns) {
    labels.add(PRIVATE_NETWORKING_LABELS[c.type] ?? 'Resource Endpoints')
  }
  return labels.size ? [...labels] : ['No private network']
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
  showDeleteModal.value = true
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
