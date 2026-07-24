<template>
  <PageLayout
    v-if="network"
    :breadcrumbs="breadcrumbs"
    title="Add private DNS"
    :back-to="{ name: 'networks-detail', params: { id: networkId } }"
  >
    <div class="dns-create">
      <div class="create-layout">
        <div class="create-main">
          <!-- Context banner -->
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

          <section class="form-card" data-testid="dns-create-form">
            <div class="form-section">
              <div class="section-heading">
                <h2 class="section-title">Private DNS details</h2>
                <p class="section-help">Private DNS resolves private service names reached through this network.</p>
              </div>

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

              <p class="field-help">Provisioning starts once added. This DNS configuration begins in a pending state until it resolves.</p>
            </div>
          </section>

          <footer class="create-footer">
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
            <KButton
              appearance="tertiary"
              data-testid="dns-cancel"
              @click="goBack"
            >
              Cancel
            </KButton>
          </footer>
        </div>

        <div class="side-rail">
          <aside class="help-panel" data-testid="dns-help-panel">
            <div class="help-panel-head">
              <InfoIcon :size="KUI_ICON_SIZE_30" decorative />
              <h3 class="help-panel-title">About private DNS</h3>
            </div>
            <p class="help-panel-text">Private DNS lets a gateway resolve private hostnames — like an internal service domain — to addresses reachable over this network's private connectivity.</p>

            <h4 class="help-panel-subtitle">Types</h4>
            <ul class="help-panel-list">
              <li><strong>Private hosted zone</strong> — Kong hosts the zone and answers queries for your domain.</li>
              <li><strong>Outbound resolver</strong> — Kong forwards queries to a resolver you run in your cloud.</li>
            </ul>

            <p class="help-panel-text">DNS and private connectivity are related but configured separately. A hostname only resolves once its underlying connection is ready.</p>
          </aside>
        </div>
      </div>
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
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { InfoIcon, ProgressIcon } from '@kong/icons'
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
import { useNetworksStore } from '@/composables/useNetworksStore'
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
.dns-create {
  padding-top: $kui-space-60;
}

.create-layout {
  display: grid;
  gap: $kui-space-80;
  grid-template-columns: minmax(0, 1fr) 320px;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.create-main {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
  min-width: 0;
}

.context-banner {
  :deep(.card-content) {
    display: flex;
    gap: $kui-space-90;
  }
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
