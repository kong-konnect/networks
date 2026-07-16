<template>
  <PageLayout
    :breadcrumbs="[
      { key: 'apigw', text: 'API Gateway' },
      { key: 'cps', text: 'Control planes' },
    ]"
    :title="controlPlaneName"
  >
    <template #actions>
      <KDropdown :kpop-attributes="{ placement: 'bottom-end' }">
        <KButton appearance="secondary">
          Actions
          <ChevronDownIcon decorative />
        </KButton>
        <template #items>
          <KDropdownItem>
            <EditIcon decorative />
            Edit
          </KDropdownItem>
          <KDropdownItem danger>
            <TrashIcon decorative />
            Delete
          </KDropdownItem>
        </template>
      </KDropdown>
    </template>

    <!-- Control-plane entity tab bar -->
    <PageLayoutTabs :tabs="cpTabs" />

    <div class="overview-content">
      <!-- 1. About this control plane -->
      <section class="detail-section">
        <div class="section-heading">
          <h2 class="section-title">About this Dedicated Cloud control plane</h2>
        </div>
        <div class="detail-card">
          <div class="fact-strip">
            <div class="fact">
              <span class="fact-label">Advanced Analytics</span>
              <KInputSwitch v-model="advancedAnalytics" />
            </div>

            <div class="fact">
              <span class="fact-label">Name</span>
              <span class="fact-value">
                {{ controlPlaneName }}
                <KButton
                  appearance="tertiary"
                  aria-label="Copy name"
                  size="small"
                  @click="copyToClipboard(controlPlaneName)"
                >
                  <CopyIcon decorative />
                </KButton>
              </span>
            </div>

            <div class="fact">
              <span class="fact-label">ID</span>
              <span class="fact-value">
                <span class="mono-text">{{ controlPlaneId }}</span>
                <KButton
                  appearance="tertiary"
                  aria-label="Copy ID"
                  size="small"
                  @click="copyToClipboard(controlPlaneId)"
                >
                  <CopyIcon decorative />
                </KButton>
              </span>
            </div>

            <div class="fact">
              <span class="fact-label">Labels</span>
              <span class="fact-value fact-value-muted">None</span>
            </div>

            <div class="fact-right">
              <span class="fact-created">Created: {{ createdAt }}</span>
              <KButton
                appearance="tertiary"
                aria-label="Edit control plane"
                size="small"
                @click="editControlPlane"
              >
                <EditIcon decorative />
              </KButton>
            </div>
          </div>
        </div>
      </section>

      <!-- 1b. Configuration captured during creation -->
      <section
        v-if="gatewayConfig"
        class="detail-section"
        data-testid="cp-configuration"
      >
        <div class="section-heading">
          <h2 class="section-title">Configuration</h2>
        </div>
        <div class="detail-card config-card">
          <div class="config-facts">
            <div class="fact">
              <span class="fact-label">Data plane type</span>
              <span class="fact-value">{{ gatewayConfig.dataPlaneType }}</span>
            </div>
            <div class="fact">
              <span class="fact-label">Gateway version</span>
              <span class="fact-value">{{ gatewayConfig.gatewayVersion }}</span>
            </div>
            <div class="fact">
              <span class="fact-label">API access</span>
              <span class="fact-value">{{ gatewayConfig.apiAccess }}</span>
            </div>
          </div>

          <div class="config-block">
            <span class="fact-label">Data plane nodes</span>
            <ul class="config-list">
              <li
                v-for="(d, i) in gatewayConfig.deployments"
                :key="i"
              >
                {{ providerLabel(d.provider) }} · {{ d.region }} · {{ d.networkName }}
              </li>
            </ul>
          </div>

          <div
            v-if="gatewayConfig.envVars.length"
            class="config-block"
          >
            <span class="fact-label">Environment variables</span>
            <ul class="config-list">
              <li
                v-for="(e, i) in gatewayConfig.envVars"
                :key="i"
              >
                <span class="mono-text">{{ e.key }} = {{ e.value }}</span>
                <span class="config-scope">{{ e.scope }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 2. Data plane status panel -->
      <KCard>
        <div class="dp-status">
          <CloudIcon
            class="dp-status-icon"
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="KUI_ICON_SIZE_70"
          />
          <h3 class="dp-status-title">Data plane nodes are initializing</h3>
          <p class="dp-status-text">
            Your Dedicated Cloud data plane nodes are being provisioned. This usually takes 45 minutes or more.
          </p>
          <div class="dp-status-actions">
            <KButton
              appearance="primary"
              @click="router.push({ name: 'data-plane-nodes' })"
            >
              View data plane nodes
            </KButton>
            <KButton appearance="tertiary">Learn more</KButton>
          </div>
        </div>
      </KCard>

      <!-- 3. Analytics -->
      <MetricCardContainer
        container-title="Analytics"
        container-description="Last 7-day summary"
      >
        <MetricsCard
          :icon="TrafficIcon"
          metric-change="0.00%"
          metric-value="0"
          title="Requests"
          trend-range="vs previous 7 days"
        />
        <MetricsCard
          :icon="WarningOutlineIcon"
          metric-change="0.00%"
          metric-value="0.00%"
          title="Error rate"
          trend-range="vs previous 7 days"
        />
        <MetricsCard
          :icon="ClockIcon"
          metric-change="0.00%"
          metric-value="0ms"
          title="Average latency"
          trend-range="vs previous 7 days"
        />
      </MetricCardContainer>

      <!-- 4. Add a gateway service -->
      <KCard>
        <div class="service-card">
          <div class="service-card-text">
            <h3 class="service-card-title">Add a gateway service</h3>
            <p class="service-card-description">
              Gateway services improve the performance, security, and scalability of your APIs by load balancing
              traffic, optimizing routing, authentication, authorization, and distributing traffic.
            </p>
          </div>
          <div class="service-card-actions">
            <a
              class="service-card-link"
              href="#"
              @click.prevent
            >
              <BookIcon decorative />
              View docs
            </a>
            <KButton appearance="primary">
              <AddIcon decorative />
              Add a service
            </KButton>
          </div>
        </div>
      </KCard>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_ICON_SIZE_70,
} from '@kong/design-tokens'
import {
  AddIcon,
  BookIcon,
  ChevronDownIcon,
  ClockIcon,
  CloudIcon,
  CopyIcon,
  EditIcon,
  TrafficIcon,
  TrashIcon,
  WarningOutlineIcon,
} from '@kong/icons'
import {
  KButton,
  KCard,
  KDropdown,
  KDropdownItem,
  KInputSwitch,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import PageLayoutTabs from '@/components/PageLayoutTabs.vue'
import type { PageLayoutTab } from '@/components/PageLayoutTabs.vue'
import MetricCardContainer from '@/components/MetricCardContainer.vue'
import MetricsCard from '@/components/MetricsCard.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'

const router = useRouter()
const store = useNetworksStore()

// Configuration captured during creation (null on a cold/direct visit).
const gatewayConfig = store.getGatewayConfig()

const PROVIDER_LABELS: Record<string, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' }
const providerLabel = (p: string) => PROVIDER_LABELS[p] ?? p.toUpperCase()

const controlPlaneName = gatewayConfig?.name || 'Production-API-Gateway'
const controlPlaneId = '72603ab4-3077-4a49-b27d-d8adcf7137db'
const createdAt = 'Jul 14, 2026, 2:33 PM'

const advancedAnalytics = ref(true)

const cpTabs: PageLayoutTab[] = [
  { key: 'overview', label: 'Overview', to: '#', active: true },
  { key: 'data-plane-nodes', label: 'Data plane nodes', to: { name: 'data-plane-nodes' } },
  { key: 'networks', label: 'Networks', to: { name: 'networks-list' } },
  { key: 'custom-domains', label: 'Custom domains', to: '#' },
  { key: 'gateway-services', label: 'Gateway services', to: '#' },
  { key: 'routes', label: 'Routes', to: '#' },
  { key: 'consumers', label: 'Consumers', to: '#' },
  { key: 'plugins', label: 'Plugins', to: '#' },
  { key: 'redis', label: 'Redis', to: '#' },
  { key: 'upstreams', label: 'Upstreams', to: '#' },
  { key: 'certificates', label: 'Certificates', to: '#' },
  { key: 'vaults', label: 'Vaults', to: '#' },
  { key: 'keys', label: 'Keys', to: '#' },
  { key: 'bot-detector', label: 'Bot Detector', to: '#' },
]

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch(() => {})
}

const editControlPlane = () => {
  // Non-functional in prototype.
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.overview-content {
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

// ── About card ──────────────────────────────────────────────────────────────
.detail-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-70;
}

.fact-strip {
  align-items: center;
  column-gap: $kui-space-90;
  display: flex;
  flex-wrap: wrap;
  row-gap: $kui-space-50;
}

.fact {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.fact-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  text-transform: uppercase;
}

.fact-value {
  align-items: center;
  color: $kui-color-text;
  display: flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
}

.fact-value-muted {
  color: $kui-color-text-neutral;
}

.fact-right {
  align-items: center;
  display: flex;
  gap: $kui-space-30;
  margin-left: auto;
}

.fact-created {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
}

.mono-text {
  color: $kui-color-text-neutral-stronger;
  font-family: $kui-font-family-code;
  font-size: $kui-font-size-30;
}

// ── Configuration card ───────────────────────────────────────────────────────
.config-card {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.config-facts {
  column-gap: $kui-space-90;
  display: flex;
  flex-wrap: wrap;
  row-gap: $kui-space-50;
}

.config-block {
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding-top: $kui-space-60;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  list-style: none;
  margin: $kui-space-0;
  padding: $kui-space-0;

  li {
    align-items: center;
    color: $kui-color-text;
    display: flex;
    font-size: $kui-font-size-30;
    gap: $kui-space-40;
  }
}

.config-scope {
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  padding: $kui-space-10 $kui-space-30;
}

// ── Data plane status panel ──────────────────────────────────────────────────
.dp-status {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-70 $kui-space-60;
  text-align: center;
}

.dp-status-icon {
  margin-bottom: $kui-space-20;
}

.dp-status-title {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-50;
  margin: $kui-space-0;
}

.dp-status-text {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
  max-width: 480px;
}

.dp-status-actions {
  display: flex;
  gap: $kui-space-40;
  margin-top: $kui-space-30;
}

// ── Add a gateway service card ────────────────────────────────────────────────
.service-card {
  align-items: center;
  display: flex;
  gap: $kui-space-60;
  justify-content: space-between;
}

.service-card-text {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.service-card-title {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-50;
  margin: $kui-space-0;
}

.service-card-description {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
  max-width: 640px;
}

.service-card-actions {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: $kui-space-60;
}

.service-card-link {
  align-items: center;
  color: $kui-color-text-primary;
  display: flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}
</style>
