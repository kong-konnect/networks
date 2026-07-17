<template>
  <PageLayout
    v-if="network && connection"
    :title="connection.name"
    :back-to="{ name: 'networks-detail', params: { id: networkId } }"
    :breadcrumbs="breadcrumbs"
  >
    <template #title-after>
      <KBadge :appearance="statusBadgeAppearance(connection.status)">
        {{ statusLabel(connection.status) }}
      </KBadge>
    </template>

    <template #actions>
      <KDropdown :kpop-attributes="{ placement: 'bottom-end' }">
        <KButton
          appearance="primary"
          data-testid="connection-actions"
        >
          Actions
          <ChevronDownIcon decorative />
        </KButton>
        <template #items>
          <KDropdownItem
            v-if="connection.status !== 'ready'"
            @click="checkStatus"
          >
            Check status
          </KDropdownItem>
          <KDropdownItem
            v-if="isPending"
            @click="startEditAccounts"
          >
            Edit allowed accounts
          </KDropdownItem>
          <KDropdownItem
            v-if="hasSetupValues"
            @click="copySetupValues"
          >
            Copy setup values
          </KDropdownItem>
          <KDropdownItem
            danger
            has-divider
            @click="handleDelete"
          >
            Delete
          </KDropdownItem>
        </template>
      </KDropdown>
    </template>

    <div class="conn-subheader">
      <p class="conn-subtitle">{{ connectionTypeLabel(connection.type) }}</p>
      <p class="conn-lastchecked">Last checked {{ timeAgo(connection.lastCheckedAt) }}</p>
    </div>

    <div class="detail-stack">
    <!-- State banner -->
    <KAlert
      v-if="connection.status === 'ready'"
      appearance="success"
      message="Private ingress is active. Customer clients can reach this gateway through the resource endpoint."
    >
      <template #title>Connection ready</template>
    </KAlert>
    <KAlert
      v-else-if="connection.status === 'error'"
      appearance="danger"
      :message="connection.errorMessage || 'This connection has an error.'"
    >
      <template #title>Connection error</template>
    </KAlert>
    <KAlert
      v-else-if="isPending"
      appearance="warning"
      message="Kong has provisioned its side. Complete the customer-side setup to activate this connection."
    >
      <template #title>Pending customer action</template>
    </KAlert>

    <!-- Details -->
    <KCard title="Details">
      <ConfigCardDisplay :property-collections="detailCollections" />
    </KCard>

    <!-- Private DNS specific to THIS connection (not network-wide) -->
    <KCard
      v-if="relatedDns.length > 0"
      title="Private DNS"
      data-testid="conn-private-dns"
    >
      <p class="dns-ref">Private DNS resolved through this connection.</p>
      <table class="rows-table">
        <thead>
          <tr>
            <th>Name / domain</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dns in relatedDns" :key="dns.id">
            <td class="details-cell">{{ dns.name }}</td>
            <td><KBadge :appearance="dnsStatusBadge(dns.status)">{{ dnsStatusLabel(dns.status) }}</KBadge></td>
            <td><a class="row-action" href="#" @click.prevent="viewDns(dns.id)">View</a></td>
          </tr>
        </tbody>
      </table>
    </KCard>

    <!-- Setup values -->
    <KCard v-if="hasSetupValues" ref="setupCardRef" title="Setup values">
      <div class="setup-values">
        <div v-for="row in setupRows" :key="row.label" class="setup-row">
          <span class="setup-label">{{ row.label }}</span>
          <div class="setup-value-wrapper">
            <code class="setup-value">{{ row.value }}</code>
            <KButton appearance="tertiary" size="small" @click="copyToClipboard(row.value)">
              <CopyIcon decorative />
              Copy
            </KButton>
          </div>
        </div>
      </div>
    </KCard>

    <!-- Customer-side setup / next step -->
    <KCard v-if="isPending || connection.status === 'error'" title="Customer-side setup">
      <p class="setup-copy">{{ customerSetupCopy }}</p>
      <a class="row-action" href="#" @click.prevent>View AWS setup guide</a>
    </KCard>

    <!-- Ready guidance -->
    <KCard v-else-if="connection.status === 'ready'" title="Next step">
      <p class="setup-copy">{{ readyGuidanceCopy }}</p>
    </KCard>

    <!-- Edit allowed accounts -->
    <KCard v-if="editingAccounts" title="Allowed AWS account IDs">
      <KTextArea v-model="accountsValue" :rows="4" placeholder="One account ID per line" />
      <div class="edit-actions">
        <KButton appearance="primary" size="small" @click="saveAccounts">Save</KButton>
        <KButton appearance="tertiary" size="small" @click="editingAccounts = false">Cancel</KButton>
      </div>
    </KCard>

    <!-- Events -->
    <KCard ref="eventsCardRef" title="Events">
      <table class="rows-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ev, idx) in (connection.events || [])" :key="idx">
            <td>{{ timeAgo(ev.time) }}</td>
            <td class="details-cell">{{ ev.event }}</td>
            <td><KBadge :appearance="resultBadge(ev.result)">{{ ev.result }}</KBadge></td>
          </tr>
          <tr v-if="!connection.events || connection.events.length === 0">
            <td colspan="3" class="dash">No events recorded.</td>
          </tr>
        </tbody>
      </table>
    </KCard>
    </div>
  </PageLayout>

  <div v-else class="not-found">
    <KEmptyState
      icon-variant="error"
      title="Connection not found"
      message="This connection does not exist or has been deleted."
      action-button-text="Back to network"
      @click-action="backToConnectivity"
    />
  </div>

  <KModal
    :visible="showDeleteModal"
    title="Delete connection"
    @cancel="showDeleteModal = false"
    @proceed="confirmDelete"
  >
    <p>Are you sure you want to delete <strong>{{ connection?.name }}</strong>? This action cannot be undone.</p>
  </KModal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CopyIcon, ChevronDownIcon } from '@kong/icons'
import {
  KAlert,
  KBadge,
  KButton,
  KCard,
  KDropdown,
  KDropdownItem,
  KEmptyState,
  KModal,
  KTextArea,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import ConfigCardDisplay from '@/components/ConfigCardDisplay.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import {
  connectionTypeLabel,
  scopeLabel,
  statusLabel,
  statusBadgeAppearance,
  ownerLabel,
  timeAgo,
} from '@/utils/connectionDisplay'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const connId = computed(() => route.params.connId as string)
const network = computed(() => store.getNetworkById(networkId.value))
const connection = computed(() => store.getConnectionById(connId.value))

const showDeleteModal = ref(false)
const editingAccounts = ref(false)
const accountsValue = ref('')
const setupCardRef = ref<any>(null)
const eventsCardRef = ref<any>(null)

const breadcrumbs = computed(() => [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
  { key: 'network', to: { name: 'networks-detail', params: { id: networkId.value } }, text: network.value?.name || '' },
  { key: 'connection', text: connection.value?.name || '' },
])

const isPending = computed(() =>
  connection.value?.status === 'pending-user-action' || connection.value?.status === 'pending-acceptance',
)

const hasSetupValues = computed(() => {
  const sv = connection.value?.setupValues
  return !!sv && Object.values(sv).some(Boolean)
})

const setupRows = computed(() => {
  const sv = connection.value?.setupValues
  if (!sv) return []
  const rows: { label: string; value: string }[] = []
  if (sv.ramShareArn) rows.push({ label: 'RAM share ARN', value: sv.ramShareArn })
  if (sv.resourceConfigArn) rows.push({ label: 'Resource configuration ARN', value: sv.resourceConfigArn })
  if (sv.allowedAccountId) rows.push({ label: 'Allowed AWS account ID', value: sv.allowedAccountId })
  if (sv.customFqdn) rows.push({ label: 'Custom FQDN', value: sv.customFqdn })
  if (sv.pscServiceAttachmentUri) rows.push({ label: 'PSC service attachment', value: sv.pscServiceAttachmentUri })
  if (sv.plsAlias) rows.push({ label: 'Private Link Service alias', value: sv.plsAlias })
  return rows
})

const detailCollections = computed(() => {
  if (!connection.value || !network.value) return []
  const r = network.value.regions[0]
  return [
    {
      items: [
        { key: 'type', label: 'Type', value: connectionTypeLabel(connection.value.type), type: 'plain' as const },
        { key: 'scope', label: 'Scope', value: scopeLabel(connection.value), type: 'plain' as const },
        { key: 'network', label: 'Network', value: network.value.name, type: 'plain' as const },
        { key: 'provider', label: 'Provider', value: connection.value.cloud.toUpperCase(), type: 'plain' as const },
        { key: 'region', label: 'Region', value: r.region, type: 'plain' as const },
        { key: 'owner', label: 'Owner', value: ownerLabel(connection.value), type: 'plain' as const },
      ],
    },
  ]
})

const customerSetupCopy = computed(() => {
  if (!connection.value) return ''
  if (connection.value.type === 'aws-rep-ingress') {
    return 'Accept the RAM share in AWS and create a VPC endpoint of type Resource in your account.'
  }
  if (connection.value.status === 'error') {
    return 'Verify the target resource exists and is reachable, then re-check the connection status.'
  }
  return 'Complete the resource configuration in your cloud account, then re-check the connection status.'
})

const readyGuidanceCopy = computed(() => {
  if (connection.value?.direction === 'ingress') {
    return 'To validate access, send a request from a client inside the connected AWS VPC.'
  }
  return 'This connection is active. Kong can reach the customer upstream through it.'
})

function resultBadge(result: string): string {
  const l = result.toLowerCase()
  if (l === 'success') return 'success'
  if (l === 'error') return 'danger'
  if (l === 'pending') return 'warning'
  return 'neutral'
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {})
}

const copySetupValues = () => {
  const text = setupRows.value.map(r => `${r.label}: ${r.value}`).join('\n')
  copyToClipboard(text)
}

const checkStatus = () => {
  // Prototype: no-op status re-check.
}

const startEditAccounts = async () => {
  editingAccounts.value = true
  accountsValue.value = connection.value?.allowedConsumers.join('\n') ?? ''
  await nextTick()
}

const saveAccounts = () => {
  const consumers = accountsValue.value.split('\n').map(s => s.trim()).filter(Boolean)
  if (connection.value) {
    store.updateConnectionAllowedConsumers(connection.value.id, consumers)
  }
  editingAccounts.value = false
}

// DNS specific to this connection — via the dnsConfig.relatedConnectionId link.
const relatedDns = computed(() =>
  (network.value?.dnsConfigs ?? []).filter(d => d.relatedConnectionId === connId.value),
)
const dnsStatusLabel = (status: string) => status === 'error' ? 'Error' : status === 'pending' ? 'Pending' : 'Ready'
const dnsStatusBadge = (status: string) => status === 'error' ? 'danger' : status === 'pending' ? 'warning' : 'success'
const viewDns = (dnsId: string) => {
  router.push({ name: 'networks-dns-detail', params: { id: networkId.value, dnsId } })
}

const backToConnectivity = () => {
  router.push({ name: 'networks-detail', params: { id: networkId.value } })
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = () => {
  if (connection.value) {
    store.deleteConnection(connection.value.id)
  }
  showDeleteModal.value = false
  backToConnectivity()
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.conn-subheader {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.conn-subtitle {
  color: $kui-color-text-neutral-stronger;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.conn-lastchecked {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin: $kui-space-0;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}

.setup-values {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

.setup-row {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;

  .setup-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
  }

  .setup-value-wrapper {
    align-items: center;
    display: flex;
    gap: $kui-space-40;

    .setup-value {
      background-color: $kui-color-background-neutral-weakest;
      border-radius: $kui-border-radius-20;
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-20;
      overflow: auto;
      padding: $kui-space-20 $kui-space-30;
      word-break: break-all;
    }
  }
}

.setup-copy {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0 $kui-space-0 $kui-space-40 $kui-space-0;
}

.dns-ref {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  margin: $kui-space-0 $kui-space-0 $kui-space-40 $kui-space-0;
}

.edit-actions {
  display: flex;
  gap: $kui-space-40;
  margin-top: $kui-space-40;
}

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

  .details-cell { color: $kui-color-text-neutral-stronger; }
}

.row-action {
  color: $kui-color-text-primary;
  cursor: pointer;
  font-size: $kui-font-size-30;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.dash { color: $kui-color-text-neutral; }

.not-found { padding: $kui-space-80; }
</style>
