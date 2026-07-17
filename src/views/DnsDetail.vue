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
        appearance="tertiary"
        @click="backToDns"
      >
        Back to private DNS
      </KButton>
      <KButton
        appearance="danger"
        @click="handleDelete"
      >
        Delete
      </KButton>
    </template>

    <p class="dns-subtitle">{{ typeLabel(dns.type) }} · {{ dns.usedFor }}</p>
    <p
      v-if="dns.status !== 'ready' && dns.lastCheckedAt"
      class="dns-lastchecked"
    >
      Last checked {{ timeAgo(dns.lastCheckedAt) }}
    </p>

    <KAlert
      v-if="dns.status === 'error'"
      appearance="danger"
      :message="dns.resolverDetails || 'This DNS configuration has an error.'"
      data-testid="dns-error-banner"
    >
      <template #title>DNS configuration error</template>
    </KAlert>
    <KAlert
      v-else-if="dns.status === 'pending'"
      appearance="info"
      message="This DNS configuration is still provisioning. It resolves private names once ready."
    >
      <template #title>Provisioning</template>
    </KAlert>

    <KCard title="Details">
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
      <table class="rows-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ev, i) in (dns.events || [])"
            :key="i"
          >
            <td>{{ timeAgo(ev.time) }}</td>
            <td class="details-cell">{{ ev.event }}</td>
            <td><KBadge :appearance="eventBadge(ev.result)">{{ ev.result }}</KBadge></td>
          </tr>
          <tr v-if="!dns.events || dns.events.length === 0">
            <td colspan="3" class="dash">No events recorded.</td>
          </tr>
        </tbody>
      </table>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KAlert, KBadge, KButton, KCard, KEmptyState } from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import ConfigCardDisplay from '@/components/ConfigCardDisplay.vue'
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
