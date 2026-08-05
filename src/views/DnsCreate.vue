<template>
  <PageLayout
    v-if="network"
    :breadcrumbs="breadcrumbs"
    title="Add private DNS"
    :back-to="{ name: 'networks-detail', params: { id: networkId } }"
  >
    <template #actions>
      <KButton
        v-if="!kaiCfg.shown.value"
        appearance="tertiary"
        class="kai-header-action"
        data-testid="dns-kai-configure"
        @click="kaiCfg.run()"
      >
        <SparklesIcon :size="KUI_ICON_SIZE_20" decorative />
        Configure with KAi
      </KButton>
    </template>

    <div class="dns-create">
          <KCard class="context-banner">
            <div class="context-row">
              <span class="context-label">Network</span>
              <span class="context-value">{{ network.name }}</span>
            </div>
            <div class="context-row">
              <span class="context-label">Cloud</span>
              <span class="context-value">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }}</span>
            </div>
          </KCard>

          <KaiSummaryCard
            v-if="kaiCfg.shown.value"
            :loading="kaiCfg.loading.value"
            title="KAi setup suggestion"
            :insights="kaiCfgInsights"
            :actions="kaiCfgActions"
            data-testid="dns-kai-suggestion"
            @action="onKaiCfgAction"
            @close="kaiCfg.close()"
          />

          <EntityBaseForm
            entity-type="dns"
            :can-submit="canCreate && !isSubmitting"
            @submit="handleCreate"
            @cancel="goBack"
          >
            <EntityFormSection
              title="Private DNS details"
              description="Private DNS resolves private service names reached through this network. It starts in a pending state and resolves once its underlying connectivity is ready."
            >
              <div class="form-group">
                <KLabel :required="true">Name / domain</KLabel>
                <KInput
                  v-model.trim="form.name"
                  data-testid="dns-domain"
                  placeholder="e.g., payments.internal.company.com"
                  width="100%"
                />
              </div>

              <div class="form-group">
                <KLabel :required="true">Type</KLabel>
                <KSelect
                  v-model="form.type"
                  :items="dnsTypeOptions"
                  data-testid="dns-type"
                  width="100%"
                />
                <p class="field-help">{{ typeHelp }}</p>
              </div>

              <div class="form-group">
                <KLabel :required="true">Used for</KLabel>
                <KInput
                  v-model.trim="form.usedFor"
                  data-testid="dns-usedfor"
                  placeholder="e.g., Upstream services"
                  width="100%"
                />
              </div>
            </EntityFormSection>

            <template #form-actions>
              <KButton
                appearance="tertiary"
                data-testid="dns-cancel"
                @click="goBack"
              >
                Cancel
              </KButton>
              <KButton
                appearance="primary"
                :disabled="!canCreate || isSubmitting"
                data-testid="dns-create-button"
                @click="handleCreate"
              >
                <ProgressIcon
                  v-if="isSubmitting"
                  class="btn-spinner"
                  :size="KUI_ICON_SIZE_20"
                  decorative
                />
                {{ isSubmitting ? 'Adding…' : 'Add private DNS' }}
              </KButton>
            </template>
          </EntityBaseForm>
    </div>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { ProgressIcon, SparklesIcon } from '@kong/icons'
import {
  KCard,
  KInput,
  KLabel,
  KSelect,
  KButton,
  KEmptyState,
  ToastManager,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import EntityBaseForm from '@/components/EntityBaseForm.vue'
import EntityFormSection from '@/components/EntityFormSection.vue'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import { useKaiPanel } from '@/composables/useKaiPanel'
import type { DnsType } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useNetworksStore()

const networkId = computed(() => route.params.id as string)
const network = computed(() => store.getNetworkById(networkId.value))

const breadcrumbs = computed(() => [
  { key: 'networks', text: 'Networks', to: { name: 'networks-list' } },
  { key: 'network', text: network.value?.name ?? 'Network', to: { name: 'networks-detail', params: { id: networkId.value } } },
])

const dnsTypeOptions = [
  { label: 'Private hosted zone', value: 'private-hosted-zone' },
  { label: 'Outbound resolver', value: 'outbound-resolver' },
]

const form = reactive<{ name: string; type: DnsType; usedFor: string }>({
  name: '',
  type: 'private-hosted-zone',
  usedFor: '',
})

const typeHelp = computed(() =>
  form.type === 'outbound-resolver'
    ? 'Kong forwards matching queries to a resolver endpoint you run in your cloud.'
    : 'Kong hosts the zone and answers queries for this domain from the network.',
)

// ── KAi setup suggestion ──────────────────────────────────────────────────────
const kaiCfg = useKaiPanel(900)
const kaiCfgInsights = computed<KaiInsight[]>(() => [
  { lead: 'Recommended:', text: 'to resolve your internal service names (like payments.internal.company.com) to addresses on this network, use a private hosted zone — Kong hosts the zone and answers the queries.' },
  { text: 'If you instead need to forward lookups to a resolver you already run in your cloud, choose an outbound resolver.' },
])
const kaiCfgActions: KaiAction[] = [
  { key: 'apply', label: 'Use a private hosted zone' },
]
const onKaiCfgAction = (key: string) => {
  if (key === 'apply') {
    form.type = 'private-hosted-zone'
    if (!form.usedFor.trim()) form.usedFor = 'Upstream services'
  }
}

const canCreate = computed(() => form.name.trim() !== '' && form.usedFor.trim() !== '')

const toaster = new ToastManager()
onBeforeUnmount(() => toaster.destroy())

const isSubmitting = ref(false)
const goBack = () => {
  router.push({ name: 'networks-detail', params: { id: networkId.value } })
}

const handleCreate = () => {
  if (!canCreate.value || isSubmitting.value) return
  isSubmitting.value = true
  setTimeout(() => {
    store.addDnsConfig(networkId.value, { name: form.name, type: form.type, usedFor: form.usedFor })
    isSubmitting.value = false
    toaster.open({ appearance: 'success', message: 'Private DNS added.' })
    goBack()
  }, 500)
}
</script>

<style scoped lang="scss">
// Konnect form language (EntityBaseForm + two-column EntityFormSection) — matches create-network.
.dns-create {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  margin: $kui-space-0 auto;
  max-width: 1080px;
  padding-top: $kui-space-60;
}

.context-banner {
  :deep(.card-content) {
    display: flex;
    gap: $kui-space-90;
  }
}

.kai-configure-link {
  align-items: center;
  background: none;
  border: none;
  color: $kui-color-text-decorative-purple;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-0;

  &:hover { text-decoration: underline; }
}

.context-row {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.context-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
}

.context-value {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
}

.form-card {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-80;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
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
  margin: $kui-space-0;
}

.section-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.field-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}

.create-footer {
  background-color: $kui-color-background;
  border-top: $kui-border-width-10 solid $kui-color-border;
  bottom: $kui-space-0;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-60 $kui-space-0;
  position: sticky;
}

.btn-spinner {
  animation: spin 0.8s linear infinite;
  margin-right: $kui-space-20;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ── Side rail — help panel ────────────────────────────────────────────────────
.help-panel {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-70;
  position: sticky;
  top: $kui-space-80;
}

.help-panel-head {
  align-items: center;
  color: $kui-color-text-primary;
  display: flex;
  gap: $kui-space-30;
}

.help-panel-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  margin: $kui-space-0;
}

.help-panel-text {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.help-panel-subtitle {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  margin: $kui-space-20 $kui-space-0 $kui-space-0;
}

.help-panel-list {
  color: $kui-color-text-neutral;
  display: flex;
  flex-direction: column;
  font-size: $kui-font-size-30;
  gap: $kui-space-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
  padding-left: $kui-space-60;

  strong { color: $kui-color-text; font-weight: $kui-font-weight-semibold; }
}

.not-found {
  padding: $kui-space-110 $kui-space-0;
}
</style>
