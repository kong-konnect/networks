<template>
  <PageLayout
    v-if="network"
    :title="network.name"
    :breadcrumbs="breadcrumbs"
    :back-to="{ name: 'networks-list' }"
  >
    <template #actions>
      <!-- Restore Next steps — standalone icon button (outside the actions dropdown),
           shown only after the user dismisses the panel. Label via tooltip. -->
      <KTooltip
        v-if="network.status === 'ready' && !showNextStep && nextSteps.length"
        text="Next steps"
      >
        <KButton
          appearance="tertiary"
          aria-label="Next steps"
          data-testid="restore-next-step"
          @click="showNextStep = true"
        >
          <ListIcon decorative />
        </KButton>
      </KTooltip>
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
            data-testid="network-add-dns"
            @click="openAddDns"
          >
            Add private DNS
          </KDropdownItem>
          <KDropdownItem
            data-testid="network-view-config"
            has-divider
            @click="showConfigSlideout = true"
          >
            View configuration
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
      <div v-if="network.status === 'initialising'" class="provisioning-view">
        <!-- Informational banner — the network provisions on Kong's side; no action needed.
             (Step-by-step provisioning progress is a private-connectivity concept, not the network's.) -->
        <KAlert appearance="info" data-testid="provisioning-banner">
          <template #title>Kong is setting up this network</template>
          <template #default>
            This can take 45 minutes or more and needs no action from you. Private connectivity and Private DNS become available once the network is ready. Last checked {{ timeAgo(network.lastCheckedAt) }}.
          </template>
        </KAlert>

        <!-- About this network — same fields and order as the ready state for continuity -->
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
              <span class="about-label about-label--hint">
                Provider account ID
                <KTooltip text="Kong's cloud account ID. Use it when you share resources with Kong from your cloud account, such as an AWS RAM share.">
                  <InfoIcon class="about-hint-icon" :size="KUI_ICON_SIZE_20" decorative />
                </KTooltip>
              </span>
              <KCopy v-if="network.providerAccountId" format="short" :text="network.providerAccountId" />
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
              <span class="about-label">Private connectivity</span>
              <KBadge appearance="neutral">Not available</KBadge>
            </div>
            <div class="about-item">
              <span class="about-label">Private DNS</span>
              <KBadge appearance="neutral">Not available</KBadge>
            </div>
            <div class="about-item">
              <span class="about-label">Last checked</span>
              <span class="about-value">{{ timeAgo(network.lastCheckedAt) }}</span>
            </div>
          </div>
        </section>

        <!-- Prototype device: skip the 45-min provisioning wait. Intentionally low-prominence. -->
        <div class="sim-ready">
          <button type="button" class="sim-ready-btn" data-testid="simulate-ready" @click="simulateReady">
            Simulate ready
          </button>
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

        <!-- KAi summary card — on the network's Overview (its home), not across every tab -->
        <KaiSummaryCard
          class="nd-kai"
          title="Network health summary"
          :insights="kaiInsights"
          :one-liner="kaiOneLiner"
          :actions="kaiActions"
          initial-collapsed
          data-testid="kai-network-summary"
          @action="onKaiAction"
        />

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
              <span class="about-label about-label--hint">
                Provider account ID
                <KTooltip text="Kong's cloud account ID. Use it when you share resources with Kong from your cloud account, such as an AWS RAM share.">
                  <InfoIcon class="about-hint-icon" :size="KUI_ICON_SIZE_20" decorative />
                </KTooltip>
              </span>
              <KCopy v-if="network.providerAccountId" format="short" :text="network.providerAccountId" />
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
              <span class="about-label">Private connectivity</span>
              <KBadge :appearance="privateNetworking.appearance">{{ privateNetworking.label }}</KBadge>
            </div>
            <div class="about-item">
              <span class="about-label">Private DNS</span>
              <KBadge :appearance="privateDnsStatus.appearance">{{ privateDnsStatus.label }}</KBadge>
            </div>
            <div class="about-item">
              <span class="about-label">Last checked</span>
              <span class="about-value">{{ timeAgo(network.lastCheckedAt) }}</span>
            </div>
          </div>
        </section>


        <!-- Section 3 — Private connectivity + Private DNS (50/50) -->
        <div class="overview-cols">
          <section class="detail-card" data-testid="connectivity-summary">
            <div class="section-header-text">
              <h3 class="numbered-title">Private connectivity</h3>
              <p class="section-help">{{ connections.length }} connection{{ connections.length === 1 ? '' : 's' }} on this network.</p>
            </div>
            <div
              v-if="isDirectional && directionBreakdown.length"
              class="dir-breakdown"
              data-testid="connectivity-direction-breakdown"
            >
              <span v-for="b in directionBreakdown" :key="b.key" class="dir-chip">
                <strong>{{ b.count }}</strong> {{ b.label }}
              </span>
            </div>
            <DetailTable
              v-if="connections.length"
              :columns="connectivityColumns"
              :rows="connections"
              clickable
              @row-click="(row) => goToConnection(row.id)"
            >
              <template #cell-name="{ row }">
                <a class="row-link" href="#" @click.prevent.stop="goToConnection(row.id)">{{ row.name }}</a>
              </template>
              <template #cell-type="{ row }">{{ connectionTypeLabel(row.type) }}</template>
              <template #cell-status="{ row }">
                <KBadge :appearance="statusBadgeAppearance(row.status)">{{ statusLabel(row.status) }}</KBadge>
              </template>
              <template #cell-lastChecked="{ row }">
                <span class="cell-muted">{{ row.lastCheckedAt ? timeAgo(row.lastCheckedAt) : '—' }}</span>
              </template>
            </DetailTable>
            <div v-else class="card-empty">
              <span class="card-empty-icon"><ConnectionsIcon :size="KUI_ICON_SIZE_30" decorative /></span>
              <h4 class="card-empty-title">No private connectivity yet</h4>
              <p class="card-empty-desc">Connect this network so clients can reach Kong and Kong can reach your upstream services.</p>
              <div class="card-empty-actions">
                <KButton appearance="primary" @click="goToAddConnection">
                  <AddCircleIcon decorative />
                  Add connection
                </KButton>
                <KButton appearance="tertiary">Learn more</KButton>
              </div>
            </div>
          </section>

          <section class="detail-card" data-testid="dns-summary">
            <div class="section-header-text">
              <h3 class="numbered-title">Private DNS</h3>
              <p class="section-help">{{ dnsList.length }} configuration{{ dnsList.length === 1 ? '' : 's' }} on this network.</p>
            </div>
            <DetailTable
              v-if="dnsList.length"
              :columns="dnsColumns"
              :rows="dnsList"
              clickable
              @row-click="(row) => goToDns(row.id)"
            >
              <template #cell-name="{ row }">
                <a class="row-link" href="#" @click.prevent.stop="goToDns(row.id)">{{ row.name }}</a>
              </template>
              <template #cell-type="{ row }">{{ dnsTypeLabel(row.type) }}</template>
              <template #cell-status="{ row }">
                <KBadge :appearance="dnsStatusBadge(row.status)">{{ dnsStatusLabel(row.status) }}</KBadge>
              </template>
              <template #cell-lastChecked="{ row }">
                <span class="cell-muted">{{ row.lastCheckedAt ? timeAgo(row.lastCheckedAt) : '—' }}</span>
              </template>
            </DetailTable>
            <div v-else class="card-empty">
              <span class="card-empty-icon"><WorldPrivateIcon :size="KUI_ICON_SIZE_30" decorative /></span>
              <h4 class="card-empty-title">No private DNS yet</h4>
              <p class="card-empty-desc">Add private DNS to resolve private service names reached through this network.</p>
              <div class="card-empty-actions">
                <KButton appearance="primary" @click="openAddDns">
                  <AddCircleIcon decorative />
                  Add private DNS
                </KButton>
                <KButton appearance="tertiary">Learn more</KButton>
              </div>
            </div>
          </section>
        </div>

        <!-- Section 3 — Attached gateways -->
        <section class="detail-card" data-testid="attached-gateways">
          <div class="section-header-text">
            <h3 class="numbered-title">Attached gateways</h3>
            <p class="section-help">Gateways currently using this network.</p>
          </div>
          <DetailTable
            v-if="usedByRows.length"
            :columns="gatewayColumns"
            :rows="usedByRows"
            clickable
            @row-click="(row) => goToGateway(row)"
          >
            <template #cell-name="{ row }">
              <a class="row-link" href="#" @click.prevent.stop="goToGateway(row)">{{ row.name }}</a>
            </template>
            <template #cell-type="{ row }">{{ row.type }}</template>
            <template #cell-controlPlaneId="{ row }"><KCopy format="short" :text="row.controlPlaneId" @click.stop /></template>
            <template #cell-dataPlaneGroup="{ row }"><KCopy format="short" :text="row.dataPlaneGroup" @click.stop /></template>
            <template #cell-status="{ row }"><KBadge appearance="success">{{ row.status || 'Ready' }}</KBadge></template>
          </DetailTable>
          <p v-else class="section-help gw-empty">No gateways are using this network yet.</p>
        </section>

      </div>

      <!-- ── Communication tab ────────────────────────────────── -->
      <div v-if="activeTab === '#communication'" class="tab-content">
        <div class="section-header-text">
          <h2 class="section-title">System map</h2>
          <p class="section-help">How this network is used by gateways, DNS, and connectivity resources. Opens on what needs attention.</p>
        </div>

        <NetworkCommunicationMap
          :network="network"
          :connections="connections"
          :gateways="gateways"
          :dns-configs="dnsList"
          :services="servicePaths"
          :directional="isDirectional"
        />
      </div>

      <!-- ── Connectivity tab ─────────────────────────────────── -->
      <div v-if="activeTab === '#connectivity'" class="tab-content">
        <div class="section-header">
          <div class="section-header-text">
            <h2 class="section-title">Connectivity</h2>
            <p class="section-help">Private connectivity resources attached to this network.</p>
          </div>
          <div class="section-header-actions">
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

        <!-- Directional variant (prototype compare) — connections grouped by direction -->
        <ConnectivityDirectionView
          v-else-if="isDirectional"
          :network-id="networkId"
          :connections="connections"
        />

        <div
          v-else
          class="detail-card table-card"
        >
          <DetailTable
            :columns="connectivityColumns"
            :rows="connections"
            clickable
            @row-click="(row) => goToConnection(row.id)"
          >
            <template #cell-name="{ row }">
              <a class="row-link" href="#" @click.prevent.stop="goToConnection(row.id)">{{ row.name }}</a>
            </template>
            <template #cell-type="{ row }">{{ connectionTypeLabel(row.type) }}</template>
            <template #cell-status="{ row }">
              <KBadge :appearance="statusBadgeAppearance(row.status)">{{ statusLabel(row.status) }}</KBadge>
            </template>
            <template #cell-lastChecked="{ row }">
              <span class="cell-muted">{{ row.lastCheckedAt ? timeAgo(row.lastCheckedAt) : '—' }}</span>
            </template>
          </DetailTable>
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
          <DetailTable
            :columns="dnsColumns"
            :rows="dnsList"
            clickable
            @row-click="(row) => goToDns(row.id)"
          >
            <template #cell-name="{ row }">
              <a class="row-link" href="#" @click.prevent.stop="goToDns(row.id)">{{ row.name }}</a>
            </template>
            <template #cell-type="{ row }">{{ dnsTypeLabel(row.type) }}</template>
            <template #cell-status="{ row }">
              <KBadge :appearance="dnsStatusBadge(row.status)">{{ dnsStatusLabel(row.status) }}</KBadge>
            </template>
            <template #cell-lastChecked="{ row }">
              <span class="cell-muted">{{ row.lastCheckedAt ? timeAgo(row.lastCheckedAt) : '—' }}</span>
            </template>
          </DetailTable>
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

  <!-- View configuration slideout — config-as-code on demand -->
  <ConfigSlideout
    v-if="network"
    :visible="showConfigSlideout"
    :title="`${network.name} configuration`"
    :formats="networkConfigFormats"
    description="A read-only copy of this network's configuration. Provision it from the API, Terraform, or curl, or save it to your pipeline."
    @close="showConfigSlideout = false"
  />

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
    <DetailTable :columns="blockedGatewayColumns" :rows="gateways">
      <template #cell-name="{ row }">{{ row.name }}</template>
      <template #cell-type>Data plane</template>
      <template #cell-status><KBadge appearance="success">Running</KBadge></template>
    </DetailTable>
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
  ListIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  NotificationOutlineIcon,
  ProgressIcon,
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
  KTooltip,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import DetailTable from '@/components/DetailTable.vue'
import type { DetailColumn } from '@/components/DetailTable.vue'
import NetworkCommunicationMap from '@/components/NetworkCommunicationMap.vue'
import ConnectivityDirectionView from '@/components/ConnectivityDirectionView.vue'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import ConfigSlideout from '@/components/ConfigSlideout.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { CloudProvider, NetworkStatus, DnsType, DnsStatus } from '@/types'
import {
  connectionTypeLabel,
  statusLabel,
  statusBadgeAppearance,
  timeAgo,
  directionCategory,
  directionCategoryLabel,
} from '@/utils/connectionDisplay'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const network = computed(() => store.getNetworkById(networkId.value))
const connections = computed(() => store.getConnectionsByNetworkId(networkId.value))
const gateways = computed(() => store.getGatewaysByNetworkId(networkId.value))
const servicePaths = computed(() => store.getServicePathsByNetworkId(networkId.value))

const activeTab = ref('#overview')
const showNextStep = ref(true)

// Prototype-only "by direction" connectivity variant (compare with the shipped unified
// view). Reactive so toggling the floating switcher updates the view live.
const isDirectional = computed(() => store.connectivityView.value === 'directional')

const directionBreakdown = computed(() => {
  const order = ['client-to-kong', 'kong-to-upstream', 'bidirectional'] as const
  return order
    .map(key => ({
      key,
      label: directionCategoryLabel[key],
      count: connections.value.filter(c => directionCategory(c) === key).length,
    }))
    .filter(b => b.count > 0)
})

// ── KAi page status (prototype) ───────────────────────────────────────────────
// A thin, dynamic status bar reflecting THIS network's real health — severity, a
// one-line summary, and (expanded) the specifics + deep-link actions.
const kaiProblems = computed(() => ({
  dnsErr: dnsList.value.filter(d => d.status === 'error'),
  dnsPending: dnsList.value.filter(d => d.status === 'pending'),
  connBad: connections.value.filter(c => c.status === 'error' || c.status === 'pending-user-action' || c.status === 'pending-acceptance'),
  connErr: connections.value.filter(c => c.status === 'error'),
  total: dnsList.value.length + connections.value.length,
}))
const kaiCount = computed(() => {
  const p = kaiProblems.value
  return p.dnsErr.length + p.dnsPending.length + p.connBad.length
})
const kaiInsights = computed<KaiInsight[]>(() => {
  const p = kaiProblems.value
  if (kaiCount.value === 0) {
    return [{ lead: 'All healthy:', text: `every gateway, connection, and DNS record on ${network.value?.name} is resolving and ready.` }]
  }
  const lines: KaiInsight[] = []
  if (p.dnsErr.length) {
    lines.push({ lead: 'DNS not resolving:', text: `${p.dnsErr[0].name} is unreachable — its resolver can't be reached from the network.` })
  }
  if (p.connBad.length) {
    lines.push({ lead: 'Connectivity:', text: `${p.connBad[0].name} is ${statusLabel(p.connBad[0].status).toLowerCase()}, so paths that depend on it can't complete.` })
  }
  if (p.dnsPending.length) {
    lines.push({ lead: 'Provisioning:', text: `${p.dnsPending[0].name} is still being set up and should resolve shortly.` })
  }
  return lines
})

const kaiOneLiner = computed(() => {
  const p = kaiProblems.value
  return kaiCount.value === 0
    ? `${network.value?.name} is healthy — nothing needs attention.`
    : `DNS and connectivity issues on ${network.value?.name}${p.dnsErr[0] ? ` — ${p.dnsErr[0].name} isn't resolving` : ''}.`
})

const kaiActions = computed<KaiAction[]>(() => {
  const p = kaiProblems.value
  const actions: KaiAction[] = []
  if (p.dnsErr.length) actions.push({ key: 'view-dns', label: `Open ${p.dnsErr[0].name}` })
  if (p.connBad.length) actions.push({ key: 'review-conn', label: 'Review connectivity' })
  actions.push({ key: 'ask', label: 'Ask KAi about this' })
  return actions
})

const onKaiAction = (key: string) => {
  if (key === 'view-dns' && kaiProblems.value.dnsErr[0]) {
    goToDns(kaiProblems.value.dnsErr[0].id)
  } else if (key === 'review-conn') {
    viewTab('#connectivity')
  }
  // 'ask' is a no-op stub in the prototype (would open the global Ask KAi assistant).
}
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

// Header subtitle for quick orientation: "AWS · US East (N. Virginia) · 10.0.0.0/16".
const PROVIDER_NAMES: Record<string, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' }
const networkSubtitle = computed(() => {
  const n = network.value
  if (!n) return ''
  const r = n.regions[0]
  const region = REGION_NAMES[r.region] ?? r.region
  return `${PROVIDER_NAMES[n.cloud] ?? n.cloud.toUpperCase()} · ${region} · ${r.cidr}`
})

const formatDate = (iso: string) => new Date(iso).toLocaleString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

const privateNetworking = computed(() => {
  const configured = connections.value.some(c => c.family === 'peering')
  return configured
    ? { label: 'Configured', appearance: 'success' as const }
    : { label: 'Not configured', appearance: 'neutral' as const }
})

const privateDnsStatus = computed(() => {
  return dnsList.value.length
    ? { label: 'Configured', appearance: 'success' as const }
    : { label: 'Not configured', appearance: 'neutral' as const }
})

// Zones this network is deployed across (kept as lightweight metadata — zones may
// be restricted or removed later, so this is intentionally not a large section).
const zonesLabel = computed(() => {
  const zones = network.value?.regions[0]?.zones ?? []
  return zones.length ? zones.join(', ') : '—'
})

// "Attached gateways" — the gateways (any family) currently using this network. Control-plane
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
  // Testing the endpoint is an optional verification, not a required setup step, so it
  // lives as a header action — not in Next steps.
  return steps
})

// ── Private DNS ───────────────────────────────────────────────────────────
const dnsTypeLabel = (type: DnsType) => type === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const dnsStatusLabel = (status: DnsStatus) => status === 'error' ? 'Error' : status === 'pending' ? 'Pending' : 'Ready'
const dnsStatusBadge = (status: DnsStatus) => status === 'error' ? 'danger' : status === 'pending' ? 'warning' : 'success'

// Add private DNS is a full page (moved off the modal) — same as add connection.
const openAddDns = () => {
  router.push({ name: 'networks-dns-create', params: { id: networkId.value } })
}
const goToDns = (dnsId: string) => {
  router.push({ name: 'networks-dns-detail', params: { id: networkId.value, dnsId } })
}

const breadcrumbs = [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
]

const tabs = [
  { hash: '#overview', title: 'Overview' },
  { hash: '#communication', title: 'Communication' },
  { hash: '#connectivity', title: 'Connectivity' },
  { hash: '#dns', title: 'Private DNS' },
]

// Column configs for the shared DetailTable — one set reused by the Overview summaries
// AND their full tabs, so the tables match across the whole detail flow. No Action column;
// rows are clickable.
const connectivityColumns: DetailColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'lastChecked', label: 'Last checked' },
]
const dnsColumns: DetailColumn[] = [
  { key: 'name', label: 'Domain' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'lastChecked', label: 'Last checked' },
]
const gatewayColumns: DetailColumn[] = [
  { key: 'name', label: 'Gateway' },
  { key: 'type', label: 'Type' },
  { key: 'controlPlaneId', label: 'Control plane ID' },
  { key: 'dataPlaneGroup', label: 'Data plane group' },
  { key: 'status', label: 'Status' },
]
const blockedGatewayColumns: DetailColumn[] = [
  { key: 'name', label: 'Gateway' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
]

// Provisioning checklist for the initializing state. Each step is owned by either
// Kong (system-driven) or you (an action on the customer's cloud account), so it's
// clear where the network is waiting.
type ProvState = 'done' | 'current' | 'pending'
type ProvOwner = 'kong' | 'user'
// Network provisioning is entirely Kong-driven — no customer action is needed here.
// Approving resources in your cloud account belongs to PRIVATE CONNECTIVITY (it only
// happens after the network is ready and you add a connection), so it is not a step
// on this checklist; it's called out in the note below instead.
const provisioningSteps: { key: string; title: string; desc: string; owner: ProvOwner; state: ProvState }[] = [
  { key: 'created', owner: 'kong', title: 'Network record created', desc: 'Konnect created the network object with your CIDR, provider, region, and zones.', state: 'done' },
  { key: 'provider', owner: 'kong', title: 'Provisioning provider network', desc: 'Kong provisions the provider-side network resources across the selected zones. No action is needed from you.', state: 'current' },
  { key: 'ready', owner: 'kong', title: 'Network ready', desc: 'Private connectivity and Private DNS become available after this step.', state: 'pending' },
]
function provStatusLabel(s: { owner: ProvOwner; state: ProvState }): string {
  if (s.state === 'done') return 'Done'
  if (s.state === 'pending') return 'Pending'
  return s.owner === 'user' ? 'Awaiting your action' : 'In progress'
}

const dnsList = computed(() => network.value?.dnsConfigs ?? [])

const viewTab = (hash: string) => { activeTab.value = hash }

// ── View configuration (config-as-code on demand) ────────────────────────────
const showConfigSlideout = ref(false)
const networkConfigFormats = computed(() => {
  const n = network.value
  if (!n) return []
  const r = n.regions[0]
  const json = JSON.stringify({
    name: n.name,
    provider: n.cloud,
    region: r.region,
    cidr_block: r.cidr,
    availability_zones: r.zones ?? [],
  }, null, 2)
  const tf = [
    `resource "konnect_cloud_gateway_network" "${n.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}" {`,
    `  name                              = "${n.name}"`,
    `  cloud_gateway_provider_account_id = "provider-account-id"`,
    `  region                            = "${r.region}"`,
    `  cidr_block                        = "${r.cidr}"`,
    `  availability_zones                = [${(r.zones ?? []).map(z => `"${z}"`).join(', ')}]`,
    '}',
  ].join('\n')
  const curl = `curl -X POST https://us.api.konghq.com/v2/cloud-gateways/networks \\
  -H "Authorization: Bearer $KONNECT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${json}'`
  return [
    { label: 'JSON', value: 'json', code: json, language: 'json' },
    { label: 'Terraform', value: 'terraform', code: tf, language: 'hcl' },
    { label: 'curl', value: 'curl', code: curl, language: 'bash' },
  ]
})

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

// Attention summaries — surface only the actionable items (things waiting on you,
// or in error) at the top of each overview card. Empty when everything is healthy.
const connectivityAttention = computed(() => {
  const { pending, error } = connectivitySummary.value
  const parts: string[] = []
  if (pending) parts.push(`${pending} ${pending === 1 ? 'connection requires' : 'connections require'} your action`)
  if (error) parts.push(`${error} ${error === 1 ? 'connection has an error' : 'connections have errors'}`)
  return { count: pending + error, label: parts.join(' · ') }
})

const dnsAttention = computed(() => {
  const { pending, error } = dnsSummary.value
  const parts: string[] = []
  if (error) parts.push(`${error} resolver ${error === 1 ? 'issue' : 'issues'}`)
  if (pending) parts.push(`${pending} ${pending === 1 ? 'configuration pending' : 'configurations pending'}`)
  return { count: pending + error, label: parts.join(' · ') }
})


function networkStatusBadge(status: NetworkStatus): string {
  if (status === 'ready') return 'success'
  if (status === 'initialising') return 'warning'
  if (status === 'error') return 'danger'
  return 'neutral'
}

function networkStatusText(status: NetworkStatus): string {
  if (status === 'ready') return 'Ready'
  if (status === 'initialising') return 'Initializing'
  if (status === 'error') return 'Error'
  if (status === 'terminating') return 'Deleting'
  return status
}

// Prototype device — flip the initializing network to ready without the wait.
const simulateReady = () => {
  if (network.value) store.markNetworkReady(network.value.id)
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

// ── Initializing / provisioning view ─────────────────────────────────────────
// Prototype-only "Simulate ready" — deliberately understated (small, muted link).
.sim-ready {
  display: flex;
  justify-content: center;
}

.sim-ready-btn {
  background: none;
  border: none;
  color: $kui-color-text-neutral-weak;
  cursor: pointer;
  font-size: $kui-font-size-20;
  padding: $kui-space-20 $kui-space-40;
  text-decoration: underline;

  &:hover { color: $kui-color-text-neutral; }
}

.provisioning-view {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

// Dependency-check style checklist — one container, a row per provisioning step.
.prov-checklist {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  list-style: none;
  margin: $kui-space-0;
  padding: $kui-space-0;
}

.prov-check-row {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-60 $kui-space-70;

  &:not(:last-child) {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
  }
}

.prov-check-icon {
  align-items: center;
  color: $kui-color-text-neutral-weak;
  display: flex;
  flex: 0 0 auto;
  height: 20px;

  .prov-check-row--done & { color: $kui-color-text-success; }
  .prov-check-row--current & { color: $kui-color-text-primary; }
  .prov-check-row--awaiting & { color: $kui-color-text-warning; }
}

.prov-spin {
  animation: prov-spin 1s linear infinite;
}

@keyframes prov-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.prov-check-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: $kui-space-20;
}

.prov-check-titles {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;
}

.prov-check-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.prov-check-row--pending .prov-check-title { color: $kui-color-text-neutral; }

.prov-check-desc {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
}

.prov-check-status {
  color: $kui-color-text-neutral;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  padding-top: $kui-space-10;
  white-space: nowrap;

  .prov-check-row--done & { color: $kui-color-text-success; }
  .prov-check-row--current & { color: $kui-color-text-primary; font-weight: $kui-font-weight-semibold; }
  .prov-check-row--awaiting & { color: $kui-color-text-warning; font-weight: $kui-font-weight-semibold; }
}


.kai-inline-trigger { display: flex; }

// Tint the sparkle purple on the KAi triggers.
.kai-summarize-link :deep(svg),
.kai-summarize-btn :deep(svg) { color: $kui-color-text-decorative-purple; }

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
// Attention strip — pale-warning summary of actionable items above a card's table.
.dir-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30 $kui-space-40;
  margin-bottom: $kui-space-50;
}

.dir-chip {
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  padding: $kui-space-20 $kui-space-40;

  strong { color: $kui-color-text; font-weight: $kui-font-weight-semibold; }
}

.attention-strip {
  align-items: center;
  background-color: $kui-color-background-warning-weakest;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-50;
  margin-bottom: $kui-space-50;
  padding: $kui-space-40 $kui-space-50;

  .attention-text {
    color: $kui-color-text-warning-strong;
    flex: 1 1 auto;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
  }

  .attention-cta {
    align-items: center;
    color: $kui-color-text-primary;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    gap: $kui-space-20;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
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

// Prominent empty state inside the connectivity / DNS cards (Mesh "Create your first…").
.card-empty {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-80 $kui-space-60;
  text-align: center;

  .card-empty-icon {
    align-items: center;
    background-color: $kui-color-background-primary-weakest;
    border-radius: $kui-border-radius-30;
    color: $kui-color-text-primary;
    display: flex;
    height: 40px;
    justify-content: center;
    width: 40px;
  }

  .card-empty-title {
    color: $kui-color-text;
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-0;
  }

  .card-empty-desc {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-40;
    margin: $kui-space-0;
    max-width: 320px;
  }

  .card-empty-actions {
    display: flex;
    gap: $kui-space-40;
    margin-top: $kui-space-20;
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

.checked-cell {
  color: $kui-color-text-neutral;
  white-space: nowrap;
}

// Entity name link inside a table row (click name or row to navigate — Konnect pattern).
.row-link {
  color: $kui-color-text-primary;
  font-weight: $kui-font-weight-semibold;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.detail-card > .section-header-text {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.dns-actions-cell {
  display: flex;
  gap: $kui-space-60;
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
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-60;
  justify-content: space-between;
  padding-bottom: $kui-space-60;
}

.about-time {
  align-items: center;
  color: $kui-color-text-neutral;
  display: inline-flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
}

// Clean facts grid (matches the production "Gateway summary / Portal summary" card).
.about-grid {
  display: grid;
  gap: $kui-space-70 $kui-space-90;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1000px) {
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

.about-label--hint {
  align-items: center;
  display: inline-flex;
  gap: $kui-space-20;
}

.about-hint-icon {
  color: $kui-color-text-neutral-weak;
  cursor: help;
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

</style>
