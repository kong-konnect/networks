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
      <!-- View toggle + filter row -->
      <div class="list-toolbar">
        <KSegmentedControl
          v-model="activeView"
          :options="viewOptions"
          @click="handleViewChange"
        />
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
          </div>
        </template>

        <template #cloud="{ row }">
          <KBadge :appearance="cloudBadgeAppearance(row.cloud)">
            {{ row.cloud.toUpperCase() }}
          </KBadge>
        </template>

        <template #regions="{ row }">
          <span class="regions-text">{{ row.regions.map((r: any) => r.region).join(', ') }}</span>
        </template>

        <template #gateways="{ row }">
          {{ row.attachedGatewayCount }}
        </template>

        <template #connections="{ row }">
          {{ row.connectionCount }}
        </template>

        <template #status="{ row }">
          <div class="status-cell">
            <KBadge :appearance="networkStatusBadge(row.status)">
              {{ row.status }}
            </KBadge>
            <span v-if="row.status !== 'ready'" class="last-checked">
              Checked {{ formatTimeSince(row.lastCheckedAt) }} ago
            </span>
          </div>
        </template>

        <template #health="{ row }">
          <div class="health-cell">
            <span
              class="health-dot"
              :class="`health-dot--${getHealthStatus(row).color}`"
            />
            <span class="health-label">{{ getHealthStatus(row).label }}</span>
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
} from '@kong/icons'
import {
  KBadge,
  KButton,
  KDropdownItem,
  KEmptyState,
  KModal,
  KSegmentedControl,
  KSelect,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { Network, Connection } from '@/types'

const router = useRouter()
const store = useNetworksStore()

const activeView = ref('networks')
const statusFilter = ref('')
const fetcherCacheKey = ref(0)
const showDeleteModal = ref(false)
const networkToDelete = ref<Network | null>(null)

const viewOptions = [
  { label: 'Networks', value: 'networks' },
  { label: 'Health overview', value: 'health' },
]

const statusFilterItems = [
  { label: 'All statuses', value: '' },
  { label: 'Provisioning', value: 'initialising' },
  { label: 'Ready', value: 'ready' },
  { label: 'Error', value: 'error' },
]

const displayHeaders = [
  { label: 'Name', key: 'name', sortable: true },
  { label: 'Cloud', key: 'cloud', sortable: true },
  { label: 'Regions', key: 'regions', sortable: false },
  { label: 'Gateways', key: 'gateways', sortable: false },
  { label: 'Connections', key: 'connections', sortable: false },
  { label: 'Status', key: 'status', sortable: true },
  { label: 'Health', key: 'health', sortable: false },
]

const fetcher = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  let data = store.getNetworks()
  if (statusFilter.value) {
    data = data.filter(n => n.status === statusFilter.value)
  }
  return { data, total: data.length }
}

const handleViewChange = (val: string) => {
  if (val === 'health') {
    router.push({ name: 'networks-health' })
  }
}

const cloudBadgeAppearance = (cloud: string) => {
  if (cloud === 'aws') return 'warning'
  if (cloud === 'gcp') return 'info'
  if (cloud === 'azure') return 'decorative-purple'
  return 'neutral'
}

const networkStatusBadge = (status: string) => {
  if (status === 'ready') return 'success'
  if (status === 'initialising') return 'warning'
  if (status === 'error') return 'danger'
  if (status === 'terminating') return 'neutral'
  return 'neutral'
}

const getHealthStatus = (network: Network): { label: string; color: string } => {
  if (network.status === 'error') {
    return { label: 'Error', color: 'danger' }
  }
  if (network.status === 'terminating') {
    return { label: 'Terminating', color: 'neutral' }
  }
  if (network.status === 'initialising') {
    const elapsedMs = Date.now() - new Date(network.createdAt).getTime()
    const elapsedMins = elapsedMs / 60000
    if (elapsedMins > 90) {
      return { label: 'Stuck', color: 'warning' }
    }
    return { label: 'Setting up', color: 'neutral' }
  }
  // status === 'ready'
  const networkConnections: Connection[] = store.getConnectionsByNetworkId(network.id)
  const hasError = networkConnections.some(c => c.status === 'error')
  if (hasError) return { label: 'Connection error', color: 'danger' }
  const hasPendingAction = networkConnections.some(c => c.status === 'pending-user-action')
  if (hasPendingAction) return { label: 'Awaiting action', color: 'warning' }
  if (network.attachedGatewayCount === 0) return { label: 'Unused', color: 'warning' }
  return { label: 'Healthy', color: 'success' }
}

const formatTimeSince = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'less than a minute'
  if (diffMins < 60) return `${diffMins} min`
  const diffHrs = Math.floor(diffMins / 60)
  return `${diffHrs}h`
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
  .name-link {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.regions-text {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.status-cell {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;

  .last-checked {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }
}

.health-cell {
  align-items: center;
  display: flex;
  gap: $kui-space-30;

  .health-dot {
    border-radius: 50%;
    flex-shrink: 0;
    height: 8px;
    width: 8px;

    &--success { background-color: $kui-color-background-success; }
    &--warning { background-color: $kui-color-background-warning; }
    &--danger { background-color: $kui-color-background-danger; }
    &--neutral { background-color: $kui-color-background-neutral; }
  }

  .health-label {
    font-size: $kui-font-size-30;
  }
}
</style>
