<template>
  <PageLayout
    title="Network health"
    :back-to="{ name: 'networks-list' }"
  >
    <div class="health-overview">
      <!-- Summary tiles -->
      <div class="summary-tiles">
        <KCard class="summary-tile">
          <div class="tile-value">{{ summaryStats.total }}</div>
          <div class="tile-label">Total networks</div>
        </KCard>
        <KCard class="summary-tile">
          <div class="tile-value tile-value--success">{{ summaryStats.ready }}</div>
          <div class="tile-label">Ready</div>
        </KCard>
        <KCard class="summary-tile">
          <div class="tile-value tile-value--danger">{{ summaryStats.issues }}</div>
          <div class="tile-label">Issues</div>
        </KCard>
        <KCard class="summary-tile">
          <div class="tile-value tile-value--warning">{{ summaryStats.awaitingAction }}</div>
          <div class="tile-label">Awaiting action</div>
        </KCard>
      </div>

      <!-- Recommended actions -->
      <KCard title="Recommended actions">
        <div v-if="recommendedActions.length === 0" class="no-actions">
          <span class="no-actions-text">No issues found. All networks are healthy.</span>
        </div>
        <ul v-else class="actions-list">
          <li
            v-for="action in recommendedActions"
            :key="action.id"
            class="action-item"
          >
            <div class="action-icon-wrapper">
              <DangerIcon
                v-if="action.severity === 'danger'"
                :color="KUI_COLOR_TEXT_DANGER"
                :size="KUI_ICON_SIZE_40"
                decorative
              />
              <WarningIcon
                v-else
                :color="KUI_COLOR_TEXT_WARNING"
                :size="KUI_ICON_SIZE_40"
                decorative
              />
            </div>
            <div class="action-content">
              <p class="action-description">{{ action.description }}</p>
              <router-link
                class="action-link"
                :to="{ name: 'networks-detail', params: { id: action.networkId } }"
              >
                View {{ action.networkName }}
              </router-link>
            </div>
          </li>
        </ul>
      </KCard>

      <!-- Flow visualization -->
      <KCard title="Connectivity overview">
        <div class="flow-diagram">
          <div class="flow-column flow-column--ingress">
            <div class="flow-column-header">Your clients → Kong</div>
            <div class="flow-connections">
              <div
                v-for="conn in ingressConnections"
                :key="conn.id"
                class="flow-connection-item"
                :class="`flow-connection-item--${connectionStatusColor(conn.status)}`"
              >
                <span
                  class="flow-status-dot"
                  :class="`flow-status-dot--${connectionStatusColor(conn.status)}`"
                />
                <div class="flow-connection-info">
                  <span class="flow-connection-name">{{ conn.name }}</span>
                  <span class="flow-connection-type">{{ formatConnectionType(conn.type) }}</span>
                </div>
              </div>
              <div v-if="ingressConnections.length === 0" class="flow-empty">
                No ingress connections
              </div>
            </div>
          </div>

          <div class="flow-center">
            <div class="kong-box">
              <ConnectionsIcon :size="KUI_ICON_SIZE_40" decorative />
              <span class="kong-box-label">Kong Gateway</span>
            </div>
          </div>

          <div class="flow-column flow-column--egress">
            <div class="flow-column-header">Kong → your services</div>
            <div class="flow-connections">
              <div
                v-for="conn in egressConnections"
                :key="conn.id"
                class="flow-connection-item"
                :class="`flow-connection-item--${connectionStatusColor(conn.status)}`"
              >
                <div class="flow-connection-info">
                  <span class="flow-connection-name">{{ conn.name }}</span>
                  <span class="flow-connection-type">{{ formatConnectionType(conn.type) }}</span>
                </div>
                <span
                  class="flow-status-dot"
                  :class="`flow-status-dot--${connectionStatusColor(conn.status)}`"
                />
              </div>
              <div v-if="egressConnections.length === 0" class="flow-empty">
                No egress connections
              </div>
            </div>
          </div>
        </div>
      </KCard>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  KUI_COLOR_TEXT_DANGER,
  KUI_COLOR_TEXT_WARNING,
  KUI_ICON_SIZE_40,
} from '@kong/design-tokens'
import {
  WarningIcon,
  DangerIcon,
  ConnectionsIcon,
} from '@kong/icons'
import { KCard } from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { ConnectionStatus, ConnectionType } from '@/types'

const store = useNetworksStore()
const networks = computed(() => store.getNetworks())

const allConnections = computed(() => {
  return networks.value.flatMap(n => store.getConnectionsByNetworkId(n.id))
})

const ingressConnections = computed(() => allConnections.value.filter(c => c.direction === 'ingress'))
const egressConnections = computed(() => allConnections.value.filter(c => c.direction === 'egress'))

const summaryStats = computed(() => {
  const total = networks.value.length
  const ready = networks.value.filter(n => n.status === 'ready').length
  const issues = networks.value.filter(n => {
    if (n.status === 'error') return true
    const conns = store.getConnectionsByNetworkId(n.id)
    return conns.some(c => c.status === 'error')
  }).length
  const awaitingAction = networks.value.filter(n => {
    const conns = store.getConnectionsByNetworkId(n.id)
    return conns.some(c => c.status === 'pending-user-action')
  }).length
  return { total, ready, issues, awaitingAction }
})

interface RecommendedAction {
  id: string
  networkId: string
  networkName: string
  description: string
  severity: 'warning' | 'danger'
}

const recommendedActions = computed((): RecommendedAction[] => {
  const actions: RecommendedAction[] = []

  for (const network of networks.value) {
    if (network.status === 'initialising') {
      const elapsedMs = Date.now() - new Date(network.createdAt).getTime()
      const elapsedMins = elapsedMs / 60000
      if (elapsedMins > 90) {
        actions.push({
          id: `stuck-${network.id}`,
          networkId: network.id,
          networkName: network.name,
          description: `${network.name} is taking longer than expected to provision. Contact support or delete and recreate.`,
          severity: 'warning',
        })
      }
    }

    if (network.status === 'ready' && network.attachedGatewayCount === 0) {
      actions.push({
        id: `unused-${network.id}`,
        networkId: network.id,
        networkName: network.name,
        description: `${network.name} is ready but has no attached gateways. You're paying for an unused network.`,
        severity: 'warning',
      })
    }

    const conns = store.getConnectionsByNetworkId(network.id)
    const errorConns = conns.filter(c => c.status === 'error')
    if (errorConns.length > 0) {
      actions.push({
        id: `error-${network.id}`,
        networkId: network.id,
        networkName: network.name,
        description: `${network.name} has ${errorConns.length} connection${errorConns.length > 1 ? 's' : ''} in error. Check the connection details.`,
        severity: 'danger',
      })
    }

    const pendingConns = conns.filter(c => c.status === 'pending-user-action')
    if (pendingConns.length > 0) {
      actions.push({
        id: `pending-${network.id}`,
        networkId: network.id,
        networkName: network.name,
        description: `${network.name} has ${pendingConns.length} connection${pendingConns.length > 1 ? 's' : ''} awaiting setup in your cloud account.`,
        severity: 'warning',
      })
    }
  }

  return actions
})

const connectionStatusColor = (status: ConnectionStatus): string => {
  if (status === 'ready') return 'success'
  if (status === 'error') return 'danger'
  if (status === 'pending-user-action') return 'warning'
  if (status === 'initialising' || status === 'created') return 'neutral'
  return 'warning'
}

const formatConnectionType = (type: ConnectionType): string => {
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
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.health-overview {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.summary-tiles {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: repeat(4, 1fr);
}

.summary-tile {
  text-align: center;

  .tile-value {
    color: $kui-color-text;
    font-size: $kui-font-size-80;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-60;

    &--success { color: $kui-color-text-success; }
    &--danger { color: $kui-color-text-danger; }
    &--warning { color: $kui-color-text-warning; }
  }

  .tile-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    margin-top: $kui-space-20;
  }
}

.no-actions {
  padding: $kui-space-60 $kui-space-0;

  .no-actions-text {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
  }
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  list-style: none;
  margin: $kui-space-0;
  padding: $kui-space-0;
}

.action-item {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-50 $kui-space-0;

  &:not(:last-child) {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }
}

.action-icon-wrapper {
  flex-shrink: 0;
  margin-top: $kui-space-10;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;

  .action-description {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-40;
    margin: $kui-space-0;
  }

  .action-link {
    color: $kui-color-text-primary;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

.flow-diagram {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: 1fr auto 1fr;
  min-height: 200px;
}

.flow-column {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;

  .flow-column-header {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    text-transform: uppercase;
  }

  .flow-connections {
    display: flex;
    flex-direction: column;
    gap: $kui-space-30;
  }

  .flow-empty {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    padding: $kui-space-40;
    text-align: center;
  }
}

.flow-column--ingress .flow-connection-item {
  flex-direction: row;
}

.flow-column--egress .flow-connection-item {
  flex-direction: row-reverse;
}

.flow-connection-item {
  align-items: center;
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-20;
  display: flex;
  gap: $kui-space-30;
  padding: $kui-space-30 $kui-space-40;
}

.flow-connection-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $kui-space-10;

  .flow-connection-name {
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-medium;
  }

  .flow-connection-type {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }
}

.flow-status-dot {
  border-radius: 50%;
  flex-shrink: 0;
  height: 8px;
  width: 8px;

  &--success { background-color: $kui-color-background-success; }
  &--warning { background-color: $kui-color-background-warning; }
  &--danger { background-color: $kui-color-background-danger; }
  &--neutral { background-color: $kui-color-background-neutral; }
}

.flow-center {
  align-items: center;
  display: flex;
  justify-content: center;
}

.kong-box {
  align-items: center;
  background-color: $kui-color-background-primary-weakest;
  border: $kui-border-width-10 solid $kui-color-border-primary-weak;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  padding: $kui-space-60 $kui-space-70;

  .kong-box-label {
    color: $kui-color-text-primary;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    white-space: nowrap;
  }
}
</style>
