<template>
  <PageLayout
    :breadcrumbs="breadcrumbs"
    :title="pageTitle"
  >
    <div
      class="gateway-create"
      data-testid="gateway-create"
    >
      <WizardStepper
        :labels="stepLabels"
        :current="stepperCurrent"
      />

      <!-- ── STEP 0 — Control plane ─────────────────────────────────────── -->
      <div
        v-if="step === 0"
        class="wizard-step"
        data-testid="step-control-plane"
      >
        <ExplainerPanel
          title="Control plane"
          :paragraphs="controlPlaneCopy"
          highlight="control"
        />

        <section class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Create control plane</h2>
            <p class="section-help">Add details to help identify and manage your gateway.</p>
          </div>

          <div class="sub-card">
            <div class="form-group">
              <KLabel :required="true">Control plane name</KLabel>
              <KInput
                v-model.trim="controlPlaneName"
                data-testid="control-plane-name"
                placeholder="e.g., production-api-gateway"
                width="100%"
              />
            </div>

            <div class="form-group">
              <KLabel>Description</KLabel>
              <KTextArea
                v-model="controlPlaneDescription"
                data-testid="control-plane-description"
                placeholder="Describe the purpose of your new gateway"
                width="100%"
              />
            </div>
          </div>
        </section>

        <footer class="step-footer">
          <KButton
            appearance="tertiary"
            data-testid="wizard-cancel-button"
            @click="handleCancel"
          >
            Cancel
          </KButton>
          <KButton
            appearance="primary"
            :disabled="!controlPlaneName"
            data-testid="wizard-continue-button"
            @click="createControlPlane"
          >
            Create control plane
          </KButton>
        </footer>
      </div>

      <!-- ── STEP 1 — Data plane type ───────────────────────────────────── -->
      <div
        v-else-if="step === 1"
        class="wizard-step"
        data-testid="step-data-plane-type"
      >
        <ExplainerPanel
          title="Data plane type"
          :paragraphs="dataPlaneTypeCopy"
          highlight="data-plane"
        />

        <section class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Choose your data plane type</h2>
            <p class="section-help">Choose the gateway that fits your needs and environment.</p>
          </div>

          <div class="dp-type-card">
            <span class="dp-type-question">Where do you want to run the gateway?</span>
            <div class="dp-type-grid">
              <label
                v-for="opt in dpTypeOptions"
                :key="opt.value"
                class="dp-type-option"
                :class="{ selected: dpType === opt.value }"
                :data-testid="`dp-type-${opt.value}`"
              >
                <input
                  v-model="dpType"
                  class="dp-type-radio"
                  type="radio"
                  name="dp-type"
                  :value="opt.value"
                >
                <component
                  :is="opt.icon"
                  class="dp-type-icon"
                  :size="KUI_ICON_SIZE_40"
                  decorative
                />
                <span class="dp-type-title">{{ opt.title }}</span>
                <span class="dp-type-desc">{{ opt.description }}</span>
              </label>
            </div>
            <button
              type="button"
              class="dp-compare-link"
              data-testid="compare-deployment-options"
              @click="showCompare = true"
            >
              <ChevronRightIcon decorative :size="KUI_ICON_SIZE_30" />
              Compare deployment options
            </button>
          </div>
        </section>

        <footer class="step-footer">
          <KButton
            appearance="tertiary"
            data-testid="wizard-back-button"
            @click="goBackFromType"
          >
            Back
          </KButton>
          <div class="step-footer-end">
            <KButton
              appearance="tertiary"
              data-testid="wizard-cancel-button"
              @click="exitToOverview"
            >
              Exit
            </KButton>
            <KButton
              appearance="primary"
              :disabled="!dpType"
              data-testid="wizard-next-button"
              @click="onTypeNext"
            >
              Save and next
            </KButton>
          </div>
        </footer>
      </div>

      <!-- ── STEP 2 — Data plane nodes ──────────────────────────────────── -->
      <div
        v-else-if="step === 2"
        class="wizard-step"
        data-testid="step-data-plane-nodes"
      >
        <ExplainerPanel
          title="Data plane nodes"
          :paragraphs="dataPlaneNodesCopy"
          highlight="data-plane-node"
        />

        <div class="config-layout">
          <section class="form-section config-form">
            <div class="section-heading">
              <h2 class="section-title">Deploy your data plane nodes</h2>
              <p class="section-help">Set where your data plane nodes run, how you'll access your APIs, and which gateway version to use.</p>
            </div>

            <!-- 1 — Configure data plane nodes -->
            <div class="numbered-section">
              <div class="numbered-header">
                <span class="numbered-circle">1</span>
                <div class="numbered-heading">
                  <h3 class="numbered-title">Configure deployment regions</h3>
                  <p class="section-help">Choose the cloud provider, region, and network for each place you want to run data plane nodes.</p>
                </div>
              </div>

              <div
                v-for="(deployment, di) in deployments"
                :key="di"
                class="sub-card"
                :data-testid="`deployment-card-${di}`"
              >
                <div class="config-card-head">
                  <div class="config-card-head-text">
                    <h4 class="config-card-title">Select a provider and region</h4>
                    <p class="section-help">Select your preferred cloud providers and regions for deploying your data plane node.</p>
                  </div>
                  <KButton
                    v-if="deployments.length > 1"
                    appearance="tertiary"
                    :danger="true"
                    :data-testid="`deployment-remove-${di}`"
                    @click="removeRegion(di)"
                  >
                    <CloseIcon decorative />
                    Remove
                  </KButton>
                </div>

                <div class="two-col">
                  <div class="form-group">
                    <KLabel :required="true">Provider</KLabel>
                    <KSelect
                      v-model="deployment.provider"
                      :items="providerOptions"
                      :data-testid="`provider-select-${di}`"
                      reuse-item-template
                      width="100%"
                      @change="onProviderChange(deployment)"
                    >
                      <template #item-template="{ item }">
                        <span class="select-item">
                          <component
                            :is="providerIcon(item.value as CloudProvider)"
                            :size="KUI_ICON_SIZE_30"
                            decorative
                          />
                          {{ item.label }}
                        </span>
                      </template>
                    </KSelect>
                  </div>
                  <div class="form-group">
                    <KLabel :required="true">Region</KLabel>
                    <KSelect
                      v-model="deployment.region"
                      :items="regionItems(deployment.provider)"
                      :data-testid="`region-select-${di}`"
                      reuse-item-template
                      width="100%"
                      @change="onRegionChange(deployment)"
                    >
                      <template #item-template="{ item }">
                        <span class="select-item">
                          <component
                            :is="regionFlag(item.value as string)"
                            :size="KUI_ICON_SIZE_30"
                            decorative
                          />
                          {{ item.label }}
                        </span>
                      </template>
                    </KSelect>
                  </div>
                </div>

                <!-- Select a network -->
                <div
                  class="network-field"
                  :data-testid="`network-field-${di}`"
                >
                  <KLabel>Select a network</KLabel>
                  <div class="network-box">
                    <!-- Inline create-a-network form (opened by "Add new network") -->
                    <div
                      v-if="netForm.di === di"
                      class="network-create-form"
                      :data-testid="`network-create-form-${di}`"
                    >
                      <div class="form-group">
                        <KLabel :required="true">Network name</KLabel>
                        <KInput
                          v-model.trim="netForm.name"
                          data-testid="add-network-name"
                          placeholder="Enter a unique name"
                          width="100%"
                        />
                      </div>
                      <div class="form-group">
                        <KLabel :required="true">CIDR range</KLabel>
                        <KInput
                          v-model.trim="netForm.cidr"
                          data-testid="add-network-cidr"
                          placeholder="e.g., 10.0.0.0/16"
                          width="100%"
                        />
                      </div>
                      <button
                        type="button"
                        class="cidr-help-toggle"
                        @click="netForm.showHelp = !netForm.showHelp"
                      >
                        <component :is="netForm.showHelp ? ChevronUpIcon : ChevronDownIcon" :size="KUI_ICON_SIZE_20" decorative />
                        {{ netForm.showHelp ? 'Hide CIDR help' : 'Show CIDR help' }}
                      </button>
                      <div
                        v-if="netForm.showHelp"
                        class="cidr-help"
                      >
                        <p class="cidr-help-title">Notes when selecting your CIDR block:</p>
                        <p>A CIDR block defines the range of IP addresses available for your Dedicated Cloud Gateway. To prevent conflicts, this CIDR block should not overlap with CIDR blocks assigned in your own Cloud Service Provider (CSP) networks.</p>
                        <p class="cidr-help-subtitle">CIDR requirements</p>
                        <ul>
                          <li><strong>Prefix length:</strong> the CIDR block must have a prefix length between /16 and /23. /23 blocks are only supported up to 3 availability zones.</li>
                          <li><strong>Private IP range:</strong> the entire CIDR block must fall within one of these private IP ranges: 10.0.0.0/8, 100.64.0.0/10, 172.16.0.0/12, 192.168.0.0/16, 198.18.0.0/15.</li>
                        </ul>
                        <p class="cidr-help-subtitle">Restrictions</p>
                        <ul>
                          <li>Your CIDR block must not overlap with any IP ranges already in use by your organization. Overlapping ranges can prevent VPC peering from working correctly.</li>
                          <li>It must not overlap with these reserved ranges: 10.100.0.0/16, 172.17.0.0/16.</li>
                        </ul>
                      </div>
                      <div class="form-group">
                        <KLabel
                          :required="true"
                          :tooltip="'Your network is deployed across these availability zones. Select at least 2 for resilience.'"
                        >
                          Select zone placements
                        </KLabel>
                        <div class="zone-box">
                          <KCheckbox
                            v-for="zone in regionZones(deployment.region)"
                            :key="zone"
                            :model-value="netForm.zones.includes(zone)"
                            :data-testid="`zone-${di}-${zone}`"
                            @update:model-value="toggleNetFormZone(zone)"
                          >
                            {{ zone }}
                          </KCheckbox>
                        </div>
                        <p
                          v-if="netForm.zones.length < 2"
                          class="zone-error"
                          data-testid="zone-error"
                        >
                          Select at least 2 zones.
                        </p>
                      </div>
                      <div class="network-create-actions">
                        <KButton
                          appearance="primary"
                          :disabled="!netForm.name || !netForm.cidr || netForm.zones.length < 2"
                          data-testid="add-network-save"
                          @click="saveNetForm(di)"
                        >
                          Save
                        </KButton>
                        <KButton
                          appearance="tertiary"
                          @click="cancelNetForm"
                        >
                          Cancel
                        </KButton>
                      </div>
                    </div>

                    <!-- Network options + Add new network -->
                    <div
                      v-else
                      class="network-select-row"
                    >
                      <label
                        v-for="net in networksInRegion(deployment)"
                        :key="net.id"
                        class="network-opt"
                        :class="{ selected: deployment.networkId === net.id }"
                        :data-testid="`network-row-${di}-${net.id}`"
                      >
                        <input
                          v-model="deployment.networkId"
                          class="network-opt-input"
                          type="radio"
                          :value="net.id"
                          :name="`network-${di}`"
                        >
                        <span class="network-opt-name">{{ net.name }}</span>
                        <span class="network-opt-cidr">({{ networkCidr(net, deployment.region) }})</span>
                        <KBadge :appearance="networkStatusBadge(net.status)">
                          <span class="network-opt-badge">
                            <component :is="networkStatusIcon(net.status)" :size="KUI_ICON_SIZE_20" decorative />
                            {{ networkStatusText(net.status) }}
                          </span>
                        </KBadge>
                      </label>

                      <button
                        type="button"
                        class="network-add-link"
                        :class="{ 'network-add-link--end': networksInRegion(deployment).length > 0 }"
                        :data-testid="`add-network-${di}`"
                        @click="startNetForm(di)"
                      >
                        <AddIcon :size="KUI_ICON_SIZE_20" decorative />
                        Add new network
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <KButton
                appearance="secondary"
                class="add-region-button"
                data-testid="add-region-button"
                @click="addRegion"
              >
                <AddIcon decorative />
                Add another data plane node
              </KButton>
            </div>

            <!-- 2 — API access -->
            <div class="numbered-section">
              <div class="numbered-header">
                <span class="numbered-circle">2</span>
                <div class="numbered-heading">
                  <h3 class="numbered-title">API access</h3>
                  <p class="section-help">Choose how clients reach the APIs served by these data plane nodes.</p>
                </div>
              </div>

              <div class="sub-card">
                <div class="form-group">
                  <KLabel>Access</KLabel>
                  <KSelect
                    v-model="apiAccess"
                    :items="apiAccessOptions"
                    data-testid="api-access-select"
                    width="100%"
                  />
                </div>
              </div>
            </div>

            <!-- 3 — Gateway configuration -->
            <div class="numbered-section">
              <div class="numbered-header">
                <span class="numbered-circle">3</span>
                <div class="numbered-heading">
                  <h3 class="numbered-title">Configuration</h3>
                  <p class="section-help">Set which gateway version to run and fine-tune the runtime.</p>
                </div>
              </div>

              <div class="sub-card">
                <div class="form-group">
                  <KLabel>Gateway version</KLabel>
                  <KSelect
                    v-model="gatewayVersion"
                    :items="versionOptions"
                    data-testid="gateway-version"
                    width="100%"
                  />
                </div>

                <KButton
                  appearance="tertiary"
                  class="inline-link"
                  data-testid="advanced-toggle"
                  @click="showAdvanced = !showAdvanced"
                >
                  <component :is="showAdvanced ? ChevronDownIcon : ChevronRightIcon" decorative />
                  {{ showAdvanced ? 'Hide advanced configuration' : 'Show advanced configuration' }}
                </KButton>

                <div
                  v-if="showAdvanced"
                  class="advanced-block"
                  data-testid="advanced-block"
                >
                  <div class="form-group">
                    <KLabel>Environment variables</KLabel>
                    <p class="field-help">Incorrect settings may break gateway behavior or configurations. Keys must start with KONG_ or OTEL_ (for example, KONG_LOG_LEVEL or OTEL_RESOURCE_ATTRIBUTES).</p>
                    <a
                      class="doc-link"
                      href="https://docs.konghq.com/konnect/gateway-manager/dedicated-cloud-gateways/"
                      target="_blank"
                      rel="noopener"
                      data-testid="env-docs-link"
                    >
                      View documentation
                      <ExternalLinkIcon
                        :size="KUI_ICON_SIZE_20"
                        decorative
                      />
                    </a>

                    <div class="env-table">
                      <div class="env-head">
                        <span>Scope</span>
                        <span>Key</span>
                        <span>Value</span>
                        <span class="env-head-spacer" />
                      </div>
                      <div
                        v-for="(envVar, ei) in envVars"
                        :key="ei"
                        class="env-row"
                        :data-testid="`env-row-${ei}`"
                      >
                        <KSelect
                          v-model="envVar.scope"
                          :items="scopeOptions"
                          :data-testid="`env-scope-${ei}`"
                          width="100%"
                        />
                        <KInput
                          v-model.trim="envVar.key"
                          :data-testid="`env-key-${ei}`"
                          placeholder="Enter a value"
                          width="100%"
                        />
                        <KInput
                          v-model.trim="envVar.value"
                          :data-testid="`env-value-${ei}`"
                          placeholder="Enter a value"
                          width="100%"
                        />
                        <KButton
                          appearance="tertiary"
                          :data-testid="`env-remove-${ei}`"
                          @click="removeEnvVar(ei)"
                        >
                          <CloseIcon decorative />
                        </KButton>
                      </div>
                    </div>

                    <KButton
                      appearance="tertiary"
                      class="inline-link"
                      data-testid="add-env-var"
                      @click="addEnvVar"
                    >
                      <AddIcon decorative />
                      Add another variable
                    </KButton>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer class="step-footer">
          <KButton
            appearance="tertiary"
            data-testid="wizard-back-button"
            @click="step = 1"
          >
            Back
          </KButton>
          <div class="step-footer-end">
            <KButton
              appearance="tertiary"
              data-testid="wizard-cancel-button"
              @click="exitToOverview"
            >
              Exit
            </KButton>
            <KButton
              appearance="primary"
              :disabled="!canReview"
              data-testid="wizard-review-button"
              @click="step = 3"
            >
              Create data plane nodes
            </KButton>
          </div>
        </footer>
      </div>

      <!-- ── STEP 3 — Review ────────────────────────────────────────────── -->
      <div
        v-else-if="step === 3"
        class="wizard-step"
        data-testid="step-review"
      >
        <section class="form-section">
          <div class="section-heading">
            <h2 class="section-title">Review</h2>
            <p class="section-help">Here's everything you created and the configuration that was applied.</p>
          </div>

          <div class="sub-card">
            <ConfigCardDisplay
              :property-collections="reviewCollections"
              data-testid="review-summary"
            />
          </div>

          <div class="review-section">
            <h3 class="numbered-title">Data plane nodes</h3>
            <div class="sub-card">
              <table
                class="rows-table"
                data-testid="review-deployments-table"
              >
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Region</th>
                    <th>Network</th>
                    <th>CIDR</th>
                    <th>Zones</th>
                    <th>Network status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(deployment, di) in deployments"
                    :key="di"
                    :data-testid="`review-deployment-row-${di}`"
                  >
                    <td>
                      <span class="cell-icon">
                        <component :is="providerIcon(deployment.provider)" :size="KUI_ICON_SIZE_20" decorative />
                        {{ providerLabel(deployment.provider) }}
                      </span>
                    </td>
                    <td>
                      <span class="cell-icon">
                        <component :is="regionFlag(deployment.region)" :size="KUI_ICON_SIZE_20" decorative />
                        {{ regionLabel(deployment.region) }}
                      </span>
                    </td>
                    <td>{{ deploymentNetwork(deployment).name || '—' }}</td>
                    <td>{{ deploymentNetwork(deployment).cidr || '—' }}</td>
                    <td>{{ deploymentNetwork(deployment).zones.join(', ') || '—' }}</td>
                    <td>
                      <KBadge :appearance="networkStatusBadge(deploymentNetwork(deployment).status)">
                        {{ networkStatusText(deploymentNetwork(deployment).status) }}
                      </KBadge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="review-section">
            <div class="config-preview-header">
              <div class="numbered-heading">
                <h3 class="numbered-title">Data plane configuration</h3>
                <p class="section-help">The configuration that will be applied when you create the gateway.</p>
              </div>
              <KSegmentedControl
                v-model="codeLang"
                :options="codeLangOptions"
                data-testid="config-lang-toggle"
              />
            </div>
            <KCodeBlock
              id="gateway-config-preview"
              class="config-code-block"
              :code="previewCode"
              :language="previewLanguage"
              theme="dark"
              data-testid="config-code-block"
            />
          </div>
        </section>

        <footer class="step-footer">
          <KButton
            appearance="tertiary"
            data-testid="wizard-back-button"
            @click="step = 2"
          >
            Back
          </KButton>
          <div class="step-footer-end">
            <KButton
              appearance="tertiary"
              data-testid="wizard-cancel-button"
              @click="exitToOverview"
            >
              Exit
            </KButton>
            <KButton
              appearance="primary"
              data-testid="runtimes-save-button"
              @click="finish({ name: 'gateway-overview' })"
            >
              Done
            </KButton>
          </div>
        </footer>
      </div>
    </div>

    <!-- Compare deployment options -->
    <KModal
      :visible="showCompare"
      title="Compare deployment options"
      :hide-cancel-button="true"
      action-button-text="Done"
      @proceed="showCompare = false"
      @cancel="showCompare = false"
    >
      <table class="compare-table">
        <thead>
          <tr>
            <th></th>
            <th v-for="opt in dpTypeOptions" :key="opt.value">{{ opt.title }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in compareRows" :key="row.label">
            <th scope="row">{{ row.label }}</th>
            <td v-for="opt in dpTypeOptions" :key="opt.value">{{ row.values[opt.value] }}</td>
          </tr>
        </tbody>
      </table>
    </KModal>

  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import {
  AddIcon,
  CloseIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  ProgressIcon,
  DangerCircleIcon,
  CloudIcon,
  RuntimeServerlessIcon,
  RuntimeDedicatedCloudIcon,
  RuntimeHybridIcon,
  AwsIcon,
  GoogleCloudIcon,
  AzureIcon,
  FlagUsIcon,
  FlagIeIcon,
  FlagSgIcon,
  FlagBeIcon,
  FlagNlIcon,
  LocationIcon,
} from '@kong/icons'
import {
  KInput,
  KTextArea,
  KLabel,
  KSelect,
  KSegmentedControl,
  KCheckbox,
  KBadge,
  KButton,
  KCodeBlock,
  KModal,
} from '@kong/kongponents'
import PageLayout from '@/components/PageLayout.vue'
import WizardStepper from '@/components/WizardStepper.vue'
import ExplainerPanel from '@/components/GatewayExplainerPanel.vue'
import ConfigCardDisplay from '@/components/ConfigCardDisplay.vue'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { CloudProvider, Network, NetworkStatus } from '@/types'

const router = useRouter()
const route = useRoute()
const store = useNetworksStore()

// "data-plane" mode = the control plane already exists (created earlier); the user is
// picking up data plane creation later, so the wizard starts at the Data plane type step
// and the Control plane step is dropped from the stepper.
const dpOnly = route.query.flow === 'data-plane'
const existingConfig = store.getGatewayConfig()

const breadcrumbs = [
  { key: 'apigw', text: 'API Gateway' },
  { key: 'cps', text: 'Control planes' },
]

// Title reflects what's being created: the control plane (full flow) or just the data
// plane (resumed later for an existing control plane).
const pageTitle = dpOnly ? 'New data plane' : 'Create control plane'

// ── Copy ──────────────────────────────────────────────────────────────────────
const controlPlaneCopy = [
  'A control plane is where you define how your APIs should behave. It\'s the central place where you configure gateway services, routes, and policies. These settings are automatically applied to your gateway instances.',
  'Separating control and execution lets you scale independently, stay resilient, and manage all your gateways from one place.',
]
const dataPlaneTypeCopy = [
  'The data plane type determines how and where your gateway instances run. Dedicated Cloud Gateways are Kong-hosted with private networking, serverless gateways are fully Kong-managed for public access, and hybrid gateways run in your own environment.',
]
const dataPlaneNodesCopy = [
  'Data plane nodes are the running instances of the gateway that process traffic. You can deploy one or more nodes across clouds and regions for availability and performance.',
]

// ── Wizard step state ──────────────────────────────────────────────────────────
const step = ref(dpOnly ? 1 : 0)

// ── Step 0 — control plane ─────────────────────────────────────────────────────
const controlPlaneName = ref(existingConfig?.name || 'Production-API-Gateway')
const controlPlaneDescription = ref('')

// ── Step 1 — data plane type ─────────────────────────────────────────────────────
const dpType = ref('dedicated')

const dpTypeOptions = [
  { value: 'serverless', title: 'Serverless', description: 'A fast, production-ready gateway to get your APIs running in minutes.', icon: RuntimeServerlessIcon },
  { value: 'dedicated', title: 'Dedicated Cloud', description: 'An enterprise-grade API gateway with maximum performance and reliability.', icon: RuntimeDedicatedCloudIcon },
  { value: 'self-managed', title: 'Self-managed', description: 'A highly customizable gateway you can deploy anywhere.', icon: RuntimeHybridIcon },
]

const showCompare = ref(false)
const compareRows = [
  { label: 'Hosting', values: { serverless: 'Fully Kong-hosted', dedicated: 'Kong-hosted, dedicated capacity', 'self-managed': 'Your own infrastructure' } as Record<string, string> },
  { label: 'Private networking', values: { serverless: 'Not available', dedicated: 'VPC peering and private endpoints', 'self-managed': 'Managed by you' } as Record<string, string> },
  { label: 'Scaling', values: { serverless: 'Automatic', dedicated: 'Dedicated and configurable', 'self-managed': 'Managed by you' } as Record<string, string> },
  { label: 'Best for', values: { serverless: 'Getting started quickly', dedicated: 'Production workloads that need isolation and performance', 'self-managed': 'Full control and custom environments' } as Record<string, string> },
]

interface Deployment {
  provider: CloudProvider
  region: string
  // The selected network's id, or '' when none is selected yet. New networks are
  // created via the inline "Add new network" form, never auto-provisioned.
  networkId: string
}

// ── Step 2 — configuration ───────────────────────────────────────────────────────
const apiAccess = ref('public')
const gatewayVersion = ref('cloud-rapid')
const showAdvanced = ref(false)

interface EnvVar {
  scope: string
  key: string
  value: string
}
const envVars = reactive<EnvVar[]>([{ scope: 'global', key: '', value: '' }])
const addEnvVar = () => {
  envVars.push({ scope: 'global', key: '', value: '' })
}
const removeEnvVar = (index: number) => {
  envVars.splice(index, 1)
}

// ── Dynamic step labels ──────────────────────────────────────────────────────────
const stepLabels = computed(() => {
  const full = dpType.value === 'dedicated'
    ? ['Control plane', 'Data plane type', 'Data plane nodes', 'Review']
    : ['Control plane', 'Data plane type']
  // In data-plane mode the control plane already exists — drop it from the stepper.
  return dpOnly ? full.slice(1) : full
})
// `step` stays 0-indexed against the full flow; shift it when the CP step is hidden.
const stepperCurrent = computed(() => (dpOnly ? step.value - 1 : step.value))

// ── Region metadata ─────────────────────────────────────────────────────────
const REGION_LABELS: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'Europe (Ireland)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'us-central1': 'US Central (Iowa)',
  'us-east1': 'US East (S. Carolina)',
  'us-west1': 'US West (Oregon)',
  'europe-west1': 'Europe (Belgium)',
  'asia-southeast1': 'Asia (Singapore)',
  eastus: 'East US',
  eastus2: 'East US 2',
  westus: 'West US',
  westeurope: 'West Europe',
  southeastasia: 'Southeast Asia',
}
const regionName = (code: string) => code ? (REGION_LABELS[code] ?? code) : ''
const regionLabel = (code: string) => code ? `${REGION_LABELS[code] ?? code} · ${code}` : ''

// ── Options ─────────────────────────────────────────────────────────────────
const providerOptions = [
  { label: 'AWS', value: 'aws' },
  { label: 'GCP', value: 'gcp' },
  { label: 'Azure', value: 'azure' },
]
const PROVIDER_LABELS: Record<CloudProvider, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' }
const PROVIDER_SHORT: Record<CloudProvider, string> = { aws: 'AWS', gcp: 'GCP', azure: 'AZ' }
const providerLabel = (p: CloudProvider) => PROVIDER_LABELS[p]
const providerShort = (p: CloudProvider) => PROVIDER_SHORT[p]

// Provider logo for the cloud-provider select item template.
const PROVIDER_ICONS: Record<CloudProvider, Component> = {
  aws: AwsIcon,
  gcp: GoogleCloudIcon,
  azure: AzureIcon,
}
const providerIcon = (p: CloudProvider): Component => PROVIDER_ICONS[p] ?? CloudIcon

// Flag/location icon for the region select item template.
const REGION_FLAGS: Record<string, Component> = {
  'us-east-1': FlagUsIcon,
  'us-east-2': FlagUsIcon,
  'us-west-1': FlagUsIcon,
  'us-west-2': FlagUsIcon,
  'us-central1': FlagUsIcon,
  'us-east1': FlagUsIcon,
  'us-west1': FlagUsIcon,
  eastus: FlagUsIcon,
  eastus2: FlagUsIcon,
  westus: FlagUsIcon,
  'eu-west-1': FlagIeIcon,
  'ap-southeast-1': FlagSgIcon,
  'asia-southeast1': FlagSgIcon,
  'europe-west1': FlagBeIcon,
  westeurope: FlagNlIcon,
}
const regionFlag = (region: string): Component => REGION_FLAGS[region] ?? LocationIcon

const regionsByProvider: Record<CloudProvider, string[]> = {
  aws: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  gcp: ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-southeast1'],
  azure: ['eastus', 'eastus2', 'westus', 'westeurope', 'southeastasia'],
}
const regionItems = (provider: CloudProvider) =>
  regionsByProvider[provider].map(r => ({ label: regionLabel(r), value: r }))

const apiAccessOptions = [
  { label: 'Public access', value: 'public' },
  { label: 'Private access', value: 'private' },
]
const versionOptions = [
  { label: 'Cloud gateway cloud-rapid (latest)', value: 'cloud-rapid' },
  { label: 'Cloud gateway cloud-stable', value: 'cloud-stable' },
]

const DP_TYPE_LABELS: Record<string, string> = {
  dedicated: 'Dedicated Cloud',
  serverless: 'Serverless',
  'self-managed': 'Self-managed',
}
const dpTypeLabel = computed(() => DP_TYPE_LABELS[dpType.value] ?? dpType.value)
const gatewayVersionLabel = computed(() =>
  versionOptions.find(v => v.value === gatewayVersion.value)?.label ?? gatewayVersion.value)
const apiAccessLabel = computed(() =>
  apiAccessOptions.find(o => o.value === apiAccess.value)?.label ?? apiAccess.value)

// ── Networks (location-first: provider + region → selectable networks) ──────────
const networksInRegion = (deployment: Deployment): Network[] =>
  deployment.region
    ? store.getSelectableNetworksByRegion(deployment.region).filter(n => n.cloud === deployment.provider)
    : []

// The first ready network in the region is the recommended, default selection.
const recommendedNetworkId = (deployment: Deployment): string | undefined =>
  networksInRegion(deployment).find(n => n.status === 'ready')?.id

// Default selection for a deployment: the first READY network in that provider +
// region if one exists, else nothing selected (the user picks or adds one).
const defaultNetworkId = (deployment: Deployment): string =>
  recommendedNetworkId(deployment) ?? ''

const defaultNetworkName = (provider: CloudProvider, region: string) => `${provider}-${region}`

// Availability zones available in a region (prototype: 3 per region).
const regionZones = (region: string): string[] =>
  region ? ['a', 'b', 'c'].map(s => `${region}${s}`) : []

const makeDeployment = (provider: CloudProvider = 'aws'): Deployment => {
  const region = regionsByProvider[provider][0]
  const deployment: Deployment = { provider, region, networkId: '' }
  deployment.networkId = defaultNetworkId(deployment)
  return deployment
}

const deployments = reactive<Deployment[]>([makeDeployment()])

// ── Deployment actions ─────────────────────────────────────────────────────────
const onProviderChange = (deployment: Deployment) => {
  deployment.region = regionsByProvider[deployment.provider][0]
  deployment.networkId = defaultNetworkId(deployment)
}
const onRegionChange = (deployment: Deployment) => {
  deployment.networkId = defaultNetworkId(deployment)
}
const addRegion = () => {
  deployments.push(makeDeployment())
}
const removeRegion = (index: number) => {
  deployments.splice(index, 1)
}

// Env-var scope: global, or targeted at one deployed region's nodes.
const scopeOptions = computed(() => [
  { label: 'Global', value: 'global' },
  ...[...new Set(deployments.map(d => d.region))].map(r => ({ label: regionLabel(r), value: r })),
])

// ── Display helpers ───────────────────────────────────────────────────────────
const cloudBadgeAppearance = (cloud: CloudProvider) =>
  cloud === 'aws' ? 'warning' : cloud === 'gcp' ? 'info' : cloud === 'azure' ? 'decorative-purple' : 'neutral'

const networkStatusBadge = (status?: NetworkStatus): string =>
  status === 'ready' ? 'success' : status === 'initialising' ? 'warning' : status === 'error' ? 'danger' : 'neutral'

const networkStatusText = (status?: NetworkStatus): string =>
  status === 'ready' ? 'Ready' : status === 'initialising' ? 'Initializing' : status === 'error' ? 'Error' : status === 'terminating' ? 'Deleting' : (status ?? '')

const networkStatusTone = (status?: NetworkStatus): string =>
  status === 'ready' ? 'success' : status === 'error' ? 'danger' : status === 'initialising' ? 'warning' : 'neutral'

const networkStatusIcon = (status?: NetworkStatus): Component =>
  status === 'ready' ? CheckCircleIcon : status === 'error' ? DangerCircleIcon : ProgressIcon

const networkCidr = (net: Network, region: string) =>
  net.regions.find(r => r.region === region)?.cidr ?? net.regions[0]?.cidr ?? ''

const gatewayCountLabel = (count: number) =>
  count === 1 ? '1 gateway' : `${count} gateways`

// ── Inline "Add new network" form (per deployment; Figma node 48-8236) ───────────
const netForm = reactive<{ di: number | null; name: string; cidr: string; showHelp: boolean; zones: string[] }>({
  di: null,
  name: '',
  cidr: '',
  showHelp: false,
  zones: [],
})
const startNetForm = (di: number) => {
  const d = deployments[di]
  netForm.di = di
  netForm.name = defaultNetworkName(d.provider, d.region)
  netForm.cidr = ''
  netForm.showHelp = false
  // Zone placement is part of creating the network — default to all zones in the region.
  netForm.zones = regionZones(d.region)
}
const cancelNetForm = () => { netForm.di = null }
const toggleNetFormZone = (zone: string) => {
  netForm.zones = netForm.zones.includes(zone)
    ? netForm.zones.filter(z => z !== zone)
    : [...netForm.zones, zone]
}
const saveNetForm = (di: number) => {
  const d = deployments[di]
  if (!d || !netForm.name || !netForm.cidr) return
  const net = store.createNetwork({
    name: netForm.name,
    cloud: d.provider,
    regions: [{ region: d.region, cidr: netForm.cidr, zones: netForm.zones }],
  })
  d.networkId = net.id
  netForm.di = null
}

// ── Step navigation / gating ──────────────────────────────────────────────────
const onTypeNext = () => {
  // Serverless and hybrid have no dedicated deployment path in this prototype.
  if (dpType.value !== 'dedicated') {
    router.push({ name: 'networks-list' })
    return
  }
  step.value = 2
}

const canReview = computed(() =>
  // Every deployment must have a real, selected network (created via Add network
  // or picked from the region's existing networks).
  deployments.every(d => !!d.provider && !!d.region && !!d.networkId && !!store.getNetworkById(d.networkId)),
)

// ── Cloud providers summary (Review) ────────────────────────────────────────────
const cloudProvidersLabel = computed(() =>
  [...new Set(deployments.map(d => d.provider))].map(p => providerLabel(p)).join(', '))

// ── Config-as-code preview ──────────────────────────────────────────────────────
const codeLang = ref<'terraform' | 'json'>('json')
const codeLangOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'Terraform', value: 'terraform' },
]

// Network descriptor for a deployment — the selected network's name/CIDR/status,
// or empty when nothing is selected yet.
const deploymentNetwork = (deployment: Deployment) => {
  const net = deployment.networkId ? store.getNetworkById(deployment.networkId) : undefined
  if (!net) return { name: '', cidr: '', zones: [] as string[], status: undefined as NetworkStatus | undefined }
  const region = net.regions.find(r => r.region === deployment.region)
  return {
    name: net.name,
    cidr: networkCidr(net, deployment.region),
    zones: region?.zones ?? [],
    status: net.status,
  }
}

// Sanitize a name into a valid Terraform resource identifier.
const tfName = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'gateway'

const apiConfig = computed(() => {
  const body = {
    name: controlPlaneName.value,
    control_plane: {
      type: dpType.value,
    },
    clusters: deployments.map((deployment) => {
      const network = deploymentNetwork(deployment)
      return {
        provider: deployment.provider,
        region: deployment.region,
        network: {
          name: network.name,
          cidr: network.cidr,
        },
      }
    }),
    api_access: apiAccess.value,
    gateway_version: gatewayVersion.value,
    environment_variables: envVars
      .filter(e => e.key)
      .map(e => ({ scope: e.scope, key: e.key, value: e.value })),
  }
  return JSON.stringify(body, null, 2)
})

const terraformConfig = computed(() => {
  const cpName = tfName(controlPlaneName.value)
  const lines: string[] = []

  lines.push(`resource "konnect_gateway_control_plane" "${cpName}" {`)
  lines.push(`  name         = "${controlPlaneName.value}"`)
  lines.push(`  cluster_type = "${dpType.value}"`)
  lines.push('}')

  deployments.forEach((deployment, di) => {
    const network = deploymentNetwork(deployment)
    const netName = `${tfName(network.name)}_${di + 1}`
    lines.push('')
    lines.push(`resource "konnect_cloud_gateway_network" "${netName}" {`)
    lines.push(`  name              = "${network.name}"`)
    lines.push(`  cloud_gateway_provider_account_id = "provider-account-id"`)
    lines.push(`  region            = "${deployment.region}"`)
    lines.push(`  cidr_block        = "${network.cidr}"`)
    lines.push(`  availability_zones = []`)
    lines.push('}')
  })

  lines.push('')
  lines.push(`resource "konnect_dedicated_cloud_gateway" "${cpName}" {`)
  lines.push(`  control_plane_id = konnect_gateway_control_plane.${cpName}.id`)
  lines.push(`  gateway_version  = "${gatewayVersion.value}"`)
  lines.push(`  api_access       = "${apiAccess.value}"`)
  deployments.forEach((deployment, di) => {
    const network = deploymentNetwork(deployment)
    const netName = `${tfName(network.name)}_${di + 1}`
    lines.push('')
    lines.push('  cluster {')
    lines.push(`    provider   = "${deployment.provider}"`)
    lines.push(`    region     = "${deployment.region}"`)
    lines.push(`    network_id = konnect_cloud_gateway_network.${netName}.id`)
    lines.push('  }')
  })
  lines.push('}')

  return lines.join('\n')
})

const previewCode = computed(() =>
  codeLang.value === 'terraform' ? terraformConfig.value : apiConfig.value)
const previewLanguage = computed(() =>
  codeLang.value === 'terraform' ? 'hcl' : 'json')

// ── Review (ConfigCardDisplay) ────────────────────────────────────────────────────
// Review summary = data plane node configuration only (control-plane details removed).
const reviewCollections = computed(() => [
  {
    items: [
      { key: 'version', label: 'Gateway version', value: gatewayVersionLabel.value, type: 'plain' as const },
      { key: 'api-access', label: 'API access', value: apiAccessLabel.value, type: 'plain' as const },
    ],
  },
])

// ── Navigation ──────────────────────────────────────────────────────────────
const handleCancel = () => {
  router.push({ name: 'networks-list' })
}

// Control plane is created at step 1 (matches production: the CP exists before any data
// plane is configured). Persist a CP-only config so its overview can offer "Configure
// data plane" if the user stops here.
const createControlPlane = () => {
  store.setGatewayConfig({
    name: controlPlaneName.value,
    dataPlaneType: '',
    gatewayVersion: '',
    apiAccess: '',
    envVars: [],
    deployments: [],
  })
  step.value = 1
}

// After the CP exists, leaving the flow lands on the control-plane overview (not the
// networks list) — the data plane can be added there anytime.
const exitToOverview = () => {
  router.push({ name: 'gateway-overview' })
}

// Back from the first data-plane step: to the CP step normally, to the CP overview when
// the CP already existed (data-plane mode).
const goBackFromType = () => {
  if (dpOnly) exitToOverview()
  else step.value = 0
}

// Deployment is the final step — "View your data plane node" and "Set up later" both
// persist the captured config, then navigate to the given destination.
const finish = (destination: { name: string }) => {
  store.setGatewayConfig({
    name: controlPlaneName.value,
    dataPlaneType: dpTypeLabel.value,
    gatewayVersion: gatewayVersionLabel.value,
    apiAccess: apiAccessLabel.value,
    envVars: envVars.filter(e => e.key).map(e => ({ scope: e.scope, key: e.key, value: e.value })),
    deployments: deployments.map(d => ({
      provider: d.provider,
      region: d.region,
      networkName: deploymentNetwork(d).name,
    })),
  })
  router.push(destination)
}
</script>

<style scoped lang="scss">
.gateway-create {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
  padding-top: $kui-space-60;
}

// Each step is one bordered container (matches Figma); the footer is pinned to
// the bottom of that container and stays visible while the form scrolls.
.wizard-step {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-90;
  padding: $kui-space-80 $kui-space-80 $kui-space-0;
}

// ── Form sections ─────────────────────────────────────────────────────────────
.form-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

.field-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.inline-link {
  align-self: flex-start;
}

// "Add another data plane node" — a standard secondary button (design-system
// default width, left-aligned), so it reads as a distinct add action.
.add-region-button {
  align-self: flex-start;
}

// ── Data plane type ─────────────────────────────────────────────────────────
.dp-type-card {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  padding: $kui-space-70;
}

.dp-type-question {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.dp-type-grid {
  display: grid;
  gap: $kui-space-50;
  grid-template-columns: repeat(3, 1fr);
}

.dp-type-option {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  padding: $kui-space-70 $kui-space-60 $kui-space-60;
  position: relative;
  text-align: center;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;

  &:hover { border-color: $kui-color-border-primary-weak; }

  &.selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 $kui-border-width-10 $kui-color-border-primary;
  }
}

.dp-type-radio {
  accent-color: $kui-color-background-primary;
  cursor: pointer;
  left: $kui-space-50;
  margin: $kui-space-0;
  position: absolute;
  top: $kui-space-50;
}

.dp-type-icon {
  color: $kui-color-text-neutral;

  .dp-type-option.selected & { color: $kui-color-text-primary; }
}

.dp-type-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.dp-type-desc {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
}

.dp-compare-link {
  align-items: center;
  align-self: center;
  background: none;
  border: none;
  color: $kui-color-text-primary;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-0;

  &:hover { text-decoration: underline; }
}

.compare-table {
  border-collapse: collapse;
  width: 100%;

  th, td {
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    font-size: $kui-font-size-30;
    padding: $kui-space-50 $kui-space-40;
    text-align: left;
    vertical-align: top;
  }

  thead th {
    color: $kui-color-text;
    font-weight: $kui-font-weight-semibold;
  }

  tbody th {
    color: $kui-color-text-neutral;
    font-weight: $kui-font-weight-semibold;
    white-space: nowrap;
  }

  tbody td {
    color: $kui-color-text;
  }
}

// ── Numbered sections ─────────────────────────────────────────────────────────
.numbered-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.numbered-header {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
}

.numbered-circle {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-circle;
  color: $kui-color-text-neutral;
  display: flex;
  flex: 0 0 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  height: $kui-icon-size-50;
  justify-content: center;
  width: $kui-icon-size-50;
}

.numbered-heading {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.numbered-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

// ── Bordered sub-cards ─────────────────────────────────────────────────────────
// Sub-cards sit ON the white creation container, so they're the gray tone
// (neutral-weakest), matching the explainer panel. Nested inputs/boxes stay white.
.sub-card {
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  padding: $kui-space-70;
}

.two-col {
  display: grid;
  gap: $kui-space-60;
  grid-template-columns: 1fr 1fr;
}

// Logo/flag + label rows inside the provider and region select templates.
.select-item {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  min-width: 0;
}

.divider {
  background-color: $kui-color-border;
  border: none;
  height: $kui-border-width-10;
  margin: $kui-space-0;
  width: 100%;
}

// ── "Select a provider and region" card header ───────────────────────────────
.config-card-head {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.config-card-head-text {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.config-card-title {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  margin: $kui-space-0;
}

// ── Network selection (Figma node 48-8236) ───────────────────────────────────
.network-field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.network-box,
.zone-box {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  padding: $kui-space-50 $kui-space-60;
}

.zone-box {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-50 $kui-space-90;
}

.zone-error {
  color: $kui-color-text-danger;
  font-size: $kui-font-size-20;
  margin: $kui-space-0;
}

.network-select-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-70;
}

.network-opt {
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  gap: $kui-space-30;
}

.network-opt-input {
  accent-color: $kui-color-background-primary;
  cursor: pointer;
  margin: $kui-space-0;
}

.network-opt-name {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
}

.network-opt-cidr {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.network-opt-badge {
  align-items: center;
  display: inline-flex;
  gap: $kui-space-20;
}

.network-add-link {
  align-items: center;
  background: none;
  border: none;
  color: $kui-color-text-primary;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-0;

  &:hover { text-decoration: underline; }

  // Pushed to the right only when network options precede it.
  &--end { margin-left: auto; }
}

// Inline create-a-network form
.network-create-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

.cidr-help-toggle {
  align-items: center;
  align-self: flex-start;
  background: none;
  border: none;
  color: $kui-color-text-primary;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  padding: $kui-space-0;

  &:hover { text-decoration: underline; }
}

.cidr-help {
  color: $kui-color-text-neutral;
  display: flex;
  flex-direction: column;
  font-size: $kui-font-size-20;
  gap: $kui-space-30;
  line-height: $kui-line-height-30;

  p { margin: $kui-space-0; }

  ul {
    display: flex;
    flex-direction: column;
    gap: $kui-space-20;
    margin: $kui-space-0;
    padding-left: $kui-space-70;
  }

  .cidr-help-title,
  .cidr-help-subtitle {
    color: $kui-color-text;
    font-weight: $kui-font-weight-semibold;
  }
}

.network-create-actions {
  display: flex;
  gap: $kui-space-40;
}

// ── Configuration step: two-column layout ────────────────────────────────────────
.config-layout {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
}

.config-form {
  min-width: 0;
}

.advanced-block {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.doc-link {
  align-items: center;
  align-self: flex-start;
  color: $kui-color-text-primary;
  display: inline-flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.env-table {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
}

.env-head {
  align-items: center;
  display: grid;
  gap: $kui-space-40;
  grid-template-columns: minmax(0, 0.8fr) 1fr 1fr $kui-icon-size-50;

  span {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-semibold;
  }
}

.env-row {
  align-items: center;
  display: grid;
  gap: $kui-space-40;
  grid-template-columns: minmax(0, 0.8fr) 1fr 1fr $kui-icon-size-50;
}

// ── Config-as-code preview (Review step) ─────────────────────────────────────────
.config-preview-header {
  align-items: flex-start;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.config-code-block {
  max-height: 30rem;
  overflow: auto;
}

// ── Review deployments ──────────────────────────────────────────────────────────
.detail-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

// ── Rows table ─────────────────────────────────────────────────────────────────
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
    font-size: $kui-font-size-40;
    padding: $kui-space-50;
    vertical-align: middle;
  }

  .cell-icon {
    align-items: center;
    display: flex;
    gap: $kui-space-30;
  }
}

.rows-table-label {
  color: $kui-color-text;
  font-weight: $kui-font-weight-semibold;
}

.rows-table-action {
  text-align: right;
}

// ── Step footer ─────────────────────────────────────────────────────────────
.step-footer {
  align-items: center;
  background-color: $kui-color-background;
  border-bottom-left-radius: $kui-border-radius-40;
  border-bottom-right-radius: $kui-border-radius-40;
  border-top: $kui-border-width-10 solid $kui-color-border;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  margin: $kui-space-0 calc(#{$kui-space-80} * -1);
  padding: $kui-space-60 $kui-space-80;
  position: sticky;
}

.step-footer-end {
  display: flex;
  gap: $kui-space-40;
}
</style>
