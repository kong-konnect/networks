<template>
  <PageLayout
    :breadcrumbs="[
      { key: 'apigw', text: 'API Gateway' },
      { key: 'gateways', text: 'Gateways' },
    ]"
    title="Data plane nodes"
  >
    <div class="data-plane-nodes">
      <p class="page-subtitle">Runtime instances of your gateway, grouped by cloud provider and region.</p>

      <!-- Light metrics row -->
      <div class="metrics-row">
        <div v-for="metric in metrics" :key="metric.label" class="metric-tile">
          <span class="metric-value">{{ metric.value }}</span>
          <span class="metric-label">{{ metric.label }}</span>
        </div>
      </div>

      <!-- Nodes table -->
      <EntityBaseTable
        :fetcher="fetcher"
        :headers="headers"
        hide-card
        :hide-toolbar="true"
        table-preferences-key="data-plane-nodes"
      >
        <template #provider="{ row }">
          <KBadge :appearance="cloudBadgeAppearance(row.cloud)">
            {{ row.cloud.toUpperCase() }}
          </KBadge>
        </template>

        <template #region="{ row }">
          <span class="region-text">{{ row.region }}</span>
        </template>

        <template #dataPlaneGroup="{ row }">
          <span class="mono-text">{{ row.dataPlaneGroup }}</span>
        </template>

        <template #network="{ row }">
          <div class="network-cell">
            <router-link
              class="network-link"
              :to="{ name: 'networks-detail', params: { id: row.networkId } }"
              @click.stop
            >
              {{ row.networkName }}
            </router-link>
            <span class="network-cidr">{{ row.cidr }}</span>
          </div>
        </template>

        <template #connectivity="{ row }">
          <KBadge :appearance="row.connectivity.appearance">
            {{ row.connectivity.label }}
          </KBadge>
        </template>

        <template #status="{ row }">
          <KBadge :appearance="row.statusAppearance">
            {{ row.statusLabel }}
          </KBadge>
        </template>

        <template #empty-state>
          <KEmptyState
            icon-variant="kong"
            title="No data plane nodes"
            message="Attach a gateway to a network to deploy data plane nodes."
          />
        </template>
      </EntityBaseTable>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { KBadge, KEmptyState } from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityBaseTable from '@/components/EntityBaseTable.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { Network } from '@/types'

const store = useNetworksStore()

interface ConnectivitySummary {
  label: string
  appearance: string
}

interface NodeRow {
  id: string
  cloud: string
  region: string
  cidr: string
  dataPlaneGroup: string
  networkId: string
  networkName: string
  connectivity: ConnectivitySummary
  statusLabel: string
  statusAppearance: string
}

const headers = [
  { label: 'Provider', key: 'provider', sortable: false },
  { label: 'Region', key: 'region', sortable: false },
  { label: 'Data plane group', key: 'dataPlaneGroup', sortable: false },
  { label: 'Network', key: 'network', sortable: false },
  { label: 'Connectivity', key: 'connectivity', sortable: false },
  { label: 'Data planes / status', key: 'status', sortable: false },
]

const cloudBadgeAppearance = (cloud: string): string => {
  if (cloud === 'aws') return 'warning'
  if (cloud === 'gcp') return 'info'
  if (cloud === 'azure') return 'decorative-purple'
  return 'neutral'
}

// Short mock data plane group id per gateway region.
const dataPlaneGroupIds: Record<string, string> = {
  'us-east-1': '0422cedd-0d17…',
  'us-west-2': '9b31fae2-7c04…',
  'ap-southeast-1': 'c7e0a4b9-1f52…',
  'europe-west1': 'e13d88a6-4a90…',
}

// Summarize a network's connectivity health into a single badge. Priority:
// connection error / DNS error (danger) > pending action (warning) >
// no private connection (neutral) > ready (success).
const connectivitySummary = (network: Network): ConnectivitySummary => {
  const connections = store.getConnectionsByNetworkId(network.id)
  const dnsConfigs = network.dnsConfigs || []

  const connError = connections.some(c => c.status === 'error')
  if (connError) return { label: 'Connection error', appearance: 'danger' }

  const dnsError = dnsConfigs.some(d => d.status === 'error')
  if (dnsError) return { label: 'DNS issue', appearance: 'danger' }

  const pendingCount = connections.filter(
    c => c.status === 'pending-user-action' || c.status === 'pending-acceptance',
  ).length
  if (pendingCount > 0) {
    return { label: `${pendingCount} pending`, appearance: 'warning' }
  }

  if (connections.length === 0) {
    return { label: 'No private connection', appearance: 'neutral' }
  }

  return { label: 'Ready', appearance: 'success' }
}

const buildRows = (): NodeRow[] => {
  const rows: NodeRow[] = []
  const networks = store.getNetworks().filter(n => n.attachedGatewayCount > 0)

  for (const network of networks) {
    const gateways = store.getGatewaysByNetworkId(network.id)
    const connectivity = connectivitySummary(network)
    const isReady = network.status === 'ready'

    // One row per gateway (provider + region node).
    for (const gateway of gateways) {
      const regionEntry = network.regions.find(r => r.region === gateway.region)
      rows.push({
        id: gateway.id,
        cloud: network.cloud,
        region: gateway.region,
        cidr: regionEntry?.cidr || network.regions[0].cidr,
        dataPlaneGroup: dataPlaneGroupIds[gateway.region] || `${gateway.id}-grp…`,
        networkId: network.id,
        networkName: network.name,
        connectivity,
        statusLabel: isReady ? 'Ready' : 'Initializing',
        statusAppearance: isReady ? 'success' : 'warning',
      })
    }
  }

  return rows
}

const metrics = (() => {
  const rows = buildRows()
  const regionCount = new Set(rows.map(r => r.region)).size
  return [
    { label: 'Requests', value: '2.4M' },
    { label: 'Error rate', value: '0.3%' },
    { label: 'Average latency', value: '48 ms' },
    { label: 'Regions', value: String(regionCount) },
  ]
})()

const fetcher = async () => {
  await new Promise(resolve => setTimeout(resolve, 150))
  const data = buildRows()
  return { data, total: data.length }
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.data-plane-nodes {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.page-subtitle {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.metrics-row {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-50;
}

.metric-tile {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $kui-space-20;
  min-width: 140px;
  padding: $kui-space-50 $kui-space-60;

  .metric-value {
    color: $kui-color-text;
    font-size: $kui-font-size-60;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-50;
  }

  .metric-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }
}

.region-text {
  font-size: $kui-font-size-30;
}

.mono-text {
  color: $kui-color-text-neutral-stronger;
  font-family: $kui-font-family-code;
  font-size: $kui-font-size-30;
}

.network-cell {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;

  .network-link {
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .network-cidr {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }
}
</style>
