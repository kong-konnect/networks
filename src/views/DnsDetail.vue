<template>
  <PageLayout
    v-if="network && dns"
    :title="dns.name"
    :back-to="{ name: 'networks-detail', params: { id: networkId } }"
    :breadcrumbs="breadcrumbs"
  >
    <template #title-after>
      <KBadge :appearance="statusBadge(dns.status)">{{ statusLabel(dns.status) }}</KBadge>
    </template>

    <template #actions>
      <KButton
        v-if="dns.status !== 'ready'"
        appearance="primary"
        @click="checkStatus"
      >
        Check status
      </KButton>
      <KButton
        appearance="danger"
        @click="handleDelete"
      >
        Delete
      </KButton>
    </template>

    <!-- KAi summary card — what KAi found about this private DNS -->
    <KaiSummaryCard
      v-if="kaiOpen"
      title="What KAi found"
      :insights="kaiInsights"
      :one-liner="kaiOneLiner"
      :actions="kaiActions"
      :initial-collapsed="dns.status === 'ready'"
      data-testid="dns-kai-card"
      @action="onKaiAction"
      @close="kaiOpen = false"
    />

    <KCard title="About this private DNS">
      <ConfigCardDisplay :property-collections="detailCollections" />
    </KCard>

    <KCard title="Resolver details">
      <p class="dns-resolver">{{ dns.resolverDetails || '—' }}</p>
    </KCard>

    <!-- Cross-reference to connectivity, kept separate -->
    <KCard
      v-if="relatedConnection"
      title="Related connectivity"
      data-testid="dns-related-connectivity"
    >
      <p class="dns-related">
        This DNS configuration is used with {{ connectionTypeLabel(relatedConnection.type) }}:
        <strong>{{ relatedConnection.name }}</strong>.
      </p>
      <a
        class="row-action"
        href="#"
        @click.prevent="goToConnection(relatedConnection.id)"
      >View connection</a>
    </KCard>

    <KCard title="Events">
      <DetailTable v-if="(dns.events || []).length" :columns="eventColumns" :rows="dns.events || []" row-key="time">
        <template #cell-time="{ row }"><span class="cell-muted">{{ timeAgo(row.time) }}</span></template>
        <template #cell-event="{ row }">{{ row.event }}</template>
        <template #cell-result="{ row }"><KBadge :appearance="eventBadge(row.result)">{{ row.result }}</KBadge></template>
      </DetailTable>
      <p v-else class="dash">No events recorded.</p>
    </KCard>
  </PageLayout>

  <div
    v-else
    class="not-found"
  >
    <KEmptyState
      icon-variant="error"
      title="DNS configuration not found"
      message="This DNS configuration does not exist or has been deleted."
      action-button-text="Back to networks"
      @click-action="router.push({ name: 'networks-list' })"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KAlert, KBadge, KButton, KCard, KEmptyState } from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import ConfigCardDisplay from '@/components/ConfigCardDisplay.vue'
import DetailTable from '@/components/DetailTable.vue'
import type { DetailColumn } from '@/components/DetailTable.vue'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import { connectionTypeLabel, timeAgo } from '@/utils/connectionDisplay'
import type { DnsType, DnsStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const dnsId = computed(() => route.params.dnsId as string)
const network = computed(() => store.getNetworkById(networkId.value))
const dns = computed(() => store.getDnsConfig(networkId.value, dnsId.value))
const relatedConnection = computed(() =>
  dns.value?.relatedConnectionId ? store.getConnectionById(dns.value.relatedConnectionId) : undefined,
)

const breadcrumbs = computed(() => [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
  { key: 'network', to: { name: 'networks-detail', params: { id: networkId.value } }, text: network.value?.name || '' },
  { key: 'dns', text: dns.value?.name || '' },
])

const eventColumns: DetailColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'event', label: 'Event' },
  { key: 'result', label: 'Result' },
]

// ── KAi summary (what KAi found about this private DNS) ───────────────────────
const kaiOpen = ref(true)
const kaiOneLiner = computed(() => {
  const d = dns.value
  if (!d) return ''
  if (d.status === 'error') return `${d.name} isn't resolving — its resolver is unreachable from the network.`
  if (d.status === 'ready') return `${d.name} is resolving normally.`
  return `${d.name} is still provisioning and should resolve shortly.`
})
const kaiInsights = computed<KaiInsight[]>(() => {
  const d = dns.value
  if (!d) return []
  if (d.status === 'error') {
    return [
      { lead: 'Not resolving:', text: `${d.name} can't be reached — ${d.resolverDetails || 'the resolver is unreachable from this network.'}` },
      { lead: 'To fix:', text: 'confirm the resolver endpoint (or hosted zone) exists and is associated with this network, then re-check the status.' },
    ]
  }
  if (d.status === 'ready') {
    return [{ lead: 'Resolving:', text: `${d.name} is resolving private names through this network.` }]
  }
  return [
    { lead: 'Provisioning:', text: `${d.name} is still being set up and should resolve shortly. No action is needed.` },
  ]
})
const kaiActions = computed<KaiAction[]>(() => {
  const a: KaiAction[] = []
  if (relatedConnection.value) a.push({ key: 'view-conn', label: `Open ${relatedConnection.value.name}` })
  a.push({ key: 'ask', label: 'Ask KAi' })
  return a
})
const onKaiAction = (key: string) => {
  if (key === 'view-conn' && relatedConnection.value) {
    router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId: relatedConnection.value.id } })
  }
}

const typeLabel = (type: DnsType) => type === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const statusLabel = (status: DnsStatus) => status === 'error' ? 'Error' : status === 'pending' ? 'Pending' : 'Ready'
const statusBadge = (status: DnsStatus) => status === 'error' ? 'danger' : status === 'pending' ? 'warning' : 'success'
const eventBadge = (result: string) => result === 'Error' ? 'danger' : result === 'Pending' ? 'warning' : 'success'

const detailCollections = computed(() => {
  if (!network.value || !dns.value) return []
  return [
    {
      items: [
        { key: 'domain', label: 'Domain / zone', value: dns.value.name, type: 'plain' as const },
        { key: 'type', label: 'Type', value: typeLabel(dns.value.type), type: 'plain' as const },
        { key: 'status', label: 'Status', value: statusLabel(dns.value.status), type: 'plain' as const },
        { key: 'usedFor', label: 'Used for', value: dns.value.usedFor, type: 'plain' as const },
        { key: 'network', label: 'Associated network', value: network.value.name, type: 'plain' as const },
        { key: 'lastChecked', label: 'Last checked', value: dns.value.lastCheckedAt ? timeAgo(dns.value.lastCheckedAt) : '—', type: 'plain' as const },
      ],
    },
  ]
})

const checkStatus = () => { /* placeholder: re-poll status */ }
const backToDns = () => router.push({ name: 'networks-detail', params: { id: networkId.value } })
const goToConnection = (connId: string) => router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId } })
const handleDelete = () => {
  store.deleteDnsConfig(networkId.value, dnsId.value)
  router.push({ name: 'networks-detail', params: { id: networkId.value } })
}
</script>

<style scoped lang="scss">
.kai-inline-trigger { display: flex; }
.kai-summarize-link :deep(svg) { color: $kui-color-text-decorative-purple; }

.dns-subtitle {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-40;
  margin: $kui-space-0 $kui-space-0 $kui-space-20;
}

.dns-lastchecked {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0 $kui-space-0 $kui-space-50;
}

.dns-resolver {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.dns-related {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  line-height: $kui-line-height-40;
  margin: $kui-space-0 $kui-space-0 $kui-space-40;
}

.row-action {
  color: $kui-color-text-primary;
  cursor: pointer;
  font-size: $kui-font-size-30;
  text-decoration: none;

  &:hover { text-decoration: underline; }
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
    font-size: $kui-font-size-30;
    padding: $kui-space-50;
  }

  .details-cell { color: $kui-color-text; }

  .dash { color: $kui-color-text-neutral; }
}

.not-found { padding: $kui-space-80; }
</style>
