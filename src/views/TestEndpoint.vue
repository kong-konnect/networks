<template>
  <PageLayout
    v-if="network && isNetworkReady"
    :title="'Test endpoint'"
    :back-to="{ name: 'networks-detail', params: { id: networkId } }"
    :breadcrumbs="breadcrumbs"
  >
    <div class="test-subheader">
      <p class="test-subtitle">Validate private ingress, egress, and DNS reachability from this network.</p>
    </div>

    <div class="detail-stack">
      <!-- Run test form -->
      <KCard title="Run connectivity test">
        <div class="test-form">
          <div class="form-grid">
            <div class="field">
              <KLabel>Test type</KLabel>
              <KSelect
                v-model="form.testType"
                :items="testTypeOptions"
                placeholder="Select a test type"
                data-testid="test-type"
              />
            </div>
            <div class="field">
              <KLabel>Source</KLabel>
              <KSelect
                v-model="form.source"
                :items="sourceOptions"
                placeholder="Select a source"
                data-testid="test-source"
              />
            </div>
            <div class="field field-full">
              <KLabel>Hostname or endpoint</KLabel>
              <KInput
                v-model="form.host"
                placeholder="internal.service.foo"
                data-testid="test-host"
              />
            </div>
          </div>

          <div class="form-actions">
            <KButton
              appearance="primary"
              :loading="status === 'running'"
              :disabled="!canRun"
              data-testid="run-test"
              @click="runTest"
            >
              Run test
            </KButton>
          </div>
        </div>
      </KCard>

      <!-- Running state -->
      <KAlert
        v-if="status === 'running'"
        appearance="info"
        message="Running the test against the selected endpoint. This takes a few seconds."
        data-testid="test-result-running"
      >
        <template #title>Running the test…</template>
      </KAlert>

      <!-- Reachable -->
      <KAlert
        v-else-if="status === 'reachable' && result"
        appearance="success"
        :message="result.message"
        data-testid="test-result-success"
      >
        <template #title>Reachable</template>
      </KAlert>

      <!-- Not reachable -->
      <KAlert
        v-else-if="status === 'unreachable' && result"
        appearance="danger"
        :message="result.message"
        data-testid="test-result-error"
      >
        <template #title>Not reachable</template>
      </KAlert>

      <!-- Result summary -->
      <KCard
        v-if="(status === 'reachable' || status === 'unreachable') && result"
        title="Result summary"
        data-testid="test-result-summary"
      >
        <table class="rows-table">
          <tbody>
            <tr>
              <th>Test type</th>
              <td>{{ result.testTypeLabel }}</td>
            </tr>
            <tr>
              <th>Endpoint</th>
              <td class="details-cell">{{ result.host }}</td>
            </tr>
            <tr>
              <th>Source</th>
              <td>{{ result.sourceLabel }}</td>
            </tr>
            <tr>
              <th>Outcome</th>
              <td>
                <KBadge :appearance="status === 'reachable' ? 'success' : 'danger'">
                  {{ status === 'reachable' ? 'Reachable' : 'Not reachable' }}
                </KBadge>
              </td>
            </tr>
            <tr>
              <th>{{ status === 'reachable' ? 'Latency' : 'Reason' }}</th>
              <td class="details-cell">{{ status === 'reachable' ? result.latency : result.reason }}</td>
            </tr>
          </tbody>
        </table>
      </KCard>
    </div>
  </PageLayout>

  <div v-else class="not-found">
    <KEmptyState
      icon-variant="error"
      :title="network ? 'Network is not ready' : 'Network not found'"
      :message="network
        ? 'You can test connectivity once this network finishes provisioning.'
        : 'This network does not exist or has been deleted.'"
      action-button-text="Back to network"
      @click-action="backToNetwork"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  KAlert,
  KBadge,
  KButton,
  KCard,
  KEmptyState,
  KInput,
  KLabel,
  KSelect,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'

type Status = 'idle' | 'running' | 'reachable' | 'unreachable'
type TestType = 'dns' | 'ingress' | 'egress'
type Source = 'kong-network' | 'customer-vpc'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const network = computed(() => store.getNetworkById(networkId.value))
const isNetworkReady = computed(() => network.value?.status === 'ready')

const breadcrumbs = computed(() => [
  { key: 'networks', to: { name: 'networks-list' }, text: 'Networks' },
  { key: 'network', to: { name: 'networks-detail', params: { id: networkId.value } }, text: network.value?.name || '' },
  { key: 'test', text: 'Test endpoint' },
])

const testTypeOptions = [
  { label: 'DNS resolution', value: 'dns' },
  { label: 'Private ingress', value: 'ingress' },
  { label: 'Private egress', value: 'egress' },
]
const sourceOptions = [
  { label: 'Kong network', value: 'kong-network' },
  { label: 'Customer VPC', value: 'customer-vpc' },
]

const testTypeLabels: Record<TestType, string> = {
  dns: 'DNS resolution',
  ingress: 'Private ingress',
  egress: 'Private egress',
}
const sourceLabels: Record<Source, string> = {
  'kong-network': 'Kong network',
  'customer-vpc': 'Customer VPC',
}

const form = reactive<{ testType: TestType | ''; host: string; source: Source | '' }>({
  testType: 'dns',
  host: 'internal.service.foo',
  source: 'kong-network',
})

const status = ref<Status>('idle')

interface TestResult {
  testTypeLabel: string
  sourceLabel: string
  host: string
  latency: string
  reason: string
  message: string
}
const result = ref<TestResult | null>(null)

const canRun = computed(() => !!form.testType && !!form.source && form.host.trim().length > 0)

const runTest = () => {
  if (!canRun.value) return
  status.value = 'running'
  result.value = null

  const testType = form.testType as TestType
  const source = form.source as Source
  const host = form.host.trim()

  setTimeout(() => {
    // DNS resolution against a known-bad host fails, demonstrating the failure path.
    const isUnreachable = testType === 'dns' && host === 'internal.service.foo'
    const latency = `${28 + Math.floor(Math.random() * 40)} ms`

    result.value = {
      testTypeLabel: testTypeLabels[testType],
      sourceLabel: sourceLabels[source],
      host,
      latency,
      reason: 'The resolver endpoint is unreachable from the Kong network. Check the Route 53 outbound resolver configuration.',
      message: isUnreachable
        ? 'The resolver endpoint is unreachable from the Kong network. Check the Route 53 outbound resolver configuration.'
        : `${testTypeLabels[testType]} for ${host} completed in ${latency}.`,
    }
    status.value = isUnreachable ? 'unreachable' : 'reachable'
  }, 1200)
}

const backToNetwork = () => {
  router.push({ name: 'networks-detail', params: { id: networkId.value } })
}
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.test-subheader {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.test-subtitle {
  color: $kui-color-text-neutral-stronger;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}

.test-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.form-grid {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.field-full {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  gap: $kui-space-40;
}

.rows-table {
  border-collapse: collapse;
  width: 100%;

  th {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-50 $kui-space-50;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    width: 30%;
  }

  td {
    border-top: $kui-border-width-10 solid $kui-color-border;
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    padding: $kui-space-50 $kui-space-50;
    vertical-align: middle;
  }

  tr:first-child th,
  tr:first-child td {
    border-top: none;
  }

  th {
    border-top: $kui-border-width-10 solid $kui-color-border;
  }

  .details-cell { color: $kui-color-text-neutral-stronger; }
}

.not-found { padding: $kui-space-80; }
</style>
