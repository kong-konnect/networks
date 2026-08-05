<template>
  <div
    v-if="isOpen"
    class="kaichat"
    :style="{ left: `${leftOffset}px` }"
    role="dialog"
    aria-label="Set up with KAi"
    data-testid="kai-chat"
  >
    <!-- Header -->
    <div class="kaichat-header">
      <span class="kaichat-title">
        <SparklesIcon class="kaichat-spark" :size="KUI_ICON_SIZE_30" decorative />
        {{ isAdvisor ? 'Ask KAi' : 'Set up with KAi' }}
      </span>
      <div class="kaichat-head-actions">
        <button type="button" class="kaichat-iconbtn" aria-label="New chat" data-testid="kai-chat-restart" @click="restart">
          <AddIcon :size="KUI_ICON_SIZE_20" decorative />
        </button>
        <button type="button" class="kaichat-iconbtn" aria-label="Close" data-testid="kai-chat-close" @click="close">
          <CloseIcon :size="KUI_ICON_SIZE_20" decorative />
        </button>
      </div>
    </div>

    <!-- Conversation -->
    <div ref="scrollEl" class="kaichat-scroll">
      <div class="kaichat-thread">
        <template v-for="m in messages" :key="m.id">
          <!-- User bubble -->
          <div v-if="m.role === 'user'" class="msg msg--user">
            <span class="bubble">{{ m.text }}</span>
          </div>

          <!-- KAi turn -->
          <div v-else class="msg msg--kai">
            <div v-if="m.thinking" class="thinking">
              <button type="button" class="thinking-toggle" @click="m.thinkingOpen = !m.thinkingOpen">
                <SparklesIcon :size="KUI_ICON_SIZE_20" decorative />
                {{ m.thinkingOpen ? 'Hide thinking' : 'Show thinking' }}
                <component :is="m.thinkingOpen ? ChevronUpIcon : ChevronDownIcon" :size="KUI_ICON_SIZE_20" decorative />
              </button>
              <p v-if="m.thinkingOpen" class="thinking-text">{{ m.thinking }}</p>
            </div>

            <p v-if="m.working" class="kai-working">
              <ProgressIcon class="kai-working-spin" :size="KUI_ICON_SIZE_20" decorative />
              {{ m.text }}
            </p>
            <p v-else-if="m.text" class="kai-text">{{ m.text }}</p>

            <!-- Interactive card -->
            <div v-if="m.card && !m.resolved" class="kcard">
              <!-- Choice (single-select) -->
              <template v-if="m.card.type === 'choice'">
                <p class="kcard-q">{{ m.card.question }}</p>
                <button
                  v-for="o in m.card.options"
                  :key="o.value"
                  type="button"
                  class="opt"
                  :class="{ 'opt--sel': m.card.selected === o.value }"
                  @click="m.card.selected = o.value"
                >
                  <span class="opt-main">
                    <span class="opt-label">{{ o.label }}</span>
                    <span v-if="o.desc" class="opt-desc">{{ o.desc }}</span>
                  </span>
                  <CheckIcon v-if="m.card.selected === o.value" class="opt-check" :size="KUI_ICON_SIZE_20" decorative />
                </button>
                <div v-if="m.card.other" class="opt-other">
                  <span class="opt-other-label">Other</span>
                  <KSelect
                    v-model="m.card.otherValue"
                    :items="m.card.other"
                    :placeholder="'Select…'"
                    width="100%"
                    @change="m.card.selected = ''"
                  />
                </div>
                <div class="kcard-foot">
                  <KButton appearance="tertiary" size="small" @click="close">Cancel</KButton>
                  <KButton
                    appearance="primary"
                    size="small"
                    :disabled="!m.card.selected && !m.card.otherValue"
                    @click="resolveChoice(m)"
                  >
                    Continue
                  </KButton>
                </div>
              </template>

              <!-- Checklist (multi-select plan) -->
              <template v-else-if="m.card.type === 'checklist'">
                <span class="kcard-hint">Select all that apply</span>
                <p class="kcard-q">{{ m.card.question }}</p>
                <button
                  v-for="o in m.card.options"
                  :key="o.value"
                  type="button"
                  class="opt opt--check"
                  @click="o.checked = !o.checked"
                >
                  <span class="opt-main">
                    <span class="opt-label">{{ o.label }}</span>
                    <span v-if="o.desc" class="opt-desc">{{ o.desc }}</span>
                  </span>
                  <span class="checkbox" :class="{ 'checkbox--on': o.checked }">
                    <CheckIcon v-if="o.checked" :size="KUI_ICON_SIZE_20" decorative />
                  </span>
                </button>
                <textarea
                  v-model="m.card.note"
                  class="kcard-note"
                  placeholder="Tell KAi what to do instead…"
                  rows="1"
                />
                <div class="kcard-foot">
                  <KButton appearance="tertiary" size="small" @click="close">Cancel</KButton>
                  <KButton
                    appearance="primary"
                    size="small"
                    :disabled="!m.card.options.some(o => o.checked)"
                    @click="resolveChecklist(m)"
                  >
                    Submit
                  </KButton>
                </div>
              </template>

              <!-- Confirmation (branch) -->
              <template v-else>
                <span class="kcard-hint">Confirmation</span>
                <p class="kcard-q">{{ m.card.question }}</p>
                <button
                  v-for="o in m.card.options"
                  :key="o.value"
                  type="button"
                  class="opt opt--row"
                  @click="resolveConfirm(m, o.value)"
                >
                  <span class="opt-label">{{ o.label }}</span>
                  <ArrowRightIcon class="opt-go" :size="KUI_ICON_SIZE_20" decorative />
                </button>
                <textarea
                  class="kcard-note"
                  placeholder="Tell KAi what to do instead…"
                  rows="1"
                />
              </template>
            </div>

            <!-- Success CTA -->
            <div v-if="m.cta" class="kai-cta">
              <KButton appearance="primary" size="small" :data-testid="`kai-chat-cta`" @click="m.cta.run">
                {{ m.cta.label }}
                <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
              </KButton>
            </div>
          </div>
        </template>

        <!-- Advisor: suggested questions to ask -->
        <div v-if="isAdvisor && suggestions.length" class="kai-suggestions">
          <span class="kai-suggestions-label">Try asking</span>
          <button
            v-for="s in suggestions"
            :key="s.q"
            type="button"
            class="kai-suggestion"
            data-testid="kai-suggestion"
            @click="askQuestion(s)"
          >
            {{ s.q }}
          </button>
        </div>
      </div>
    </div>

    <!-- Composer -->
    <div class="kaichat-composer">
      <div class="composer-box">
        <textarea
          v-model="draft"
          class="composer-field"
          placeholder="Ask a question, and use # for contexts"
          rows="1"
          data-testid="kai-chat-input"
          @keydown.enter.prevent="sendDraft"
        />
        <div class="composer-bottom">
          <div class="composer-chips">
            <span v-for="c in contextChips" :key="c" class="composer-chip">
              <span class="composer-hash">#</span>{{ c }}
              <button type="button" class="composer-chip-x" aria-label="Remove context" @click="removeChip(c)">
                <CloseIcon :size="KUI_ICON_SIZE_20" decorative />
              </button>
            </span>
          </div>
          <button
            type="button"
            class="composer-send"
            :disabled="!draft.trim()"
            aria-label="Send"
            @click="sendDraft"
          >
            <ForwardIcon :size="KUI_ICON_SIZE_20" decorative />
          </button>
        </div>
      </div>
      <p class="kaichat-disclaimer">KAi is an AI-driven beta feature and can make mistakes. <a href="#" @click.prevent>Learn more</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { KButton, KSelect } from '@kong/kongponents'
import {
  SparklesIcon,
  CloseIcon,
  AddIcon,
  ForwardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ArrowRightIcon,
  ProgressIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { useKaiChat } from '@/composables/useKaiChat'
import { useNetworksStore } from '@/composables/useNetworksStore'
import type { ConnectionType, ConnectionFamily, ConnectionDirection, CloudProvider } from '@/types'

withDefaults(defineProps<{ leftOffset?: number }>(), { leftOffset: 192 })

const { isOpen, launch, closeKaiChat } = useKaiChat()
const router = useRouter()
const store = useNetworksStore()

interface ChoiceOption { value: string; label: string; desc?: string; checked?: boolean }
type ChoiceStep = 'provider' | 'region' | 'direction'
interface Card {
  type: 'choice' | 'checklist' | 'confirm'
  step?: ChoiceStep
  question: string
  options: ChoiceOption[]
  other?: { label: string; value: string }[]
  selected?: string
  otherValue?: string
  note?: string
}
interface Msg {
  id: number
  role: 'user' | 'kai'
  text?: string
  thinking?: string
  thinkingOpen?: boolean
  working?: boolean
  card?: Card
  resolved?: boolean
  cta?: { label: string; run: () => void }
}

const messages = ref<Msg[]>([])
const draft = ref('')
const contextChips = ref<string[]>([])
// Advisor mode ('ask'): suggested starter questions shown under the thread.
interface QA { q: string; a: string }
const suggestions = ref<QA[]>([])
const isAdvisor = computed(() => launch.value?.mode === 'ask')
let mid = 0

// Collected answers across the conversation.
const answers = reactive<{ direction: string; cloud: CloudProvider; region: string; plan: string[] }>({
  direction: 'egress',
  cloud: 'aws',
  region: 'us-east-1',
  plan: [],
})

const scrollEl = ref<HTMLElement | null>(null)
const scrollToEnd = () => nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })

const pushKai = (partial: Omit<Msg, 'id' | 'role'>) => { messages.value.push({ id: ++mid, role: 'kai', ...partial }); scrollToEnd() }
const pushUser = (text: string) => { messages.value.push({ id: ++mid, role: 'user', text }); scrollToEnd() }

// ── Provider + region + connection helpers ────────────────────────────────────
const providerOptions: { value: CloudProvider; label: string; desc: string }[] = [
  { value: 'aws', label: 'AWS', desc: 'Amazon Web Services.' },
  { value: 'gcp', label: 'GCP', desc: 'Google Cloud Platform.' },
  { value: 'azure', label: 'Azure', desc: 'Microsoft Azure.' },
]
const providerLabel: Record<string, string> = { aws: 'AWS', gcp: 'GCP', azure: 'Azure', no: 'No — help me create a network' }
const DEFAULT_REGION: Record<CloudProvider, string> = { aws: 'us-east-1', gcp: 'us-central1', azure: 'eastus' }
const regionsByCloud: Record<CloudProvider, { value: string; label: string }[]> = {
  aws: [
    { value: 'us-east-1', label: 'US East (us-east-1)' },
    { value: 'us-west-2', label: 'US West (us-west-2)' },
    { value: 'eu-west-1', label: 'EU West (eu-west-1)' },
  ],
  gcp: [
    { value: 'us-central1', label: 'US Central (us-central1)' },
    { value: 'europe-west1', label: 'Europe West (europe-west1)' },
  ],
  azure: [
    { value: 'eastus', label: 'East US (eastus)' },
    { value: 'westeurope', label: 'West Europe (westeurope)' },
  ],
}
const regionLabel = (cloud: CloudProvider, region: string) => regionsByCloud[cloud]?.find(r => r.value === region)?.label ?? region
const zonesFor = (region: string) => region === 'us-east-1' ? ['use1-az1', 'use1-az2'] : [`${region}-a`, `${region}-b`]

const directionLabel: Record<string, string> = {
  egress: 'Kong reaches my private upstreams',
  ingress: 'Clients reach my services through Kong',
  peering: 'Peer two private networks',
}
const connFor = (dir: string, cloud: CloudProvider): { type: ConnectionType; family: ConnectionFamily; direction: ConnectionDirection; name: string } => {
  if (dir === 'peering') {
    const type: ConnectionType = cloud === 'gcp' ? 'gcp-vpc-peering' : cloud === 'azure' ? 'azure-vnet-peering' : 'aws-vpc-peering'
    return { type, family: 'peering', direction: 'egress', name: `${cloud}-vpc-peer` }
  }
  if (dir === 'ingress') {
    const type: ConnectionType = cloud === 'gcp' ? 'gcp-psc-ingress' : cloud === 'azure' ? 'azure-private-link-ingress' : 'aws-rep-ingress'
    return { type, family: 'private-endpoint', direction: 'ingress', name: `${cloud}-rep-ingress` }
  }
  const type: ConnectionType = cloud === 'gcp' ? 'gcp-psc-egress' : cloud === 'azure' ? 'azure-private-endpoint-egress' : 'aws-rep-egress'
  return { type, family: 'private-endpoint', direction: 'egress', name: `${cloud}-rep-egress` }
}
const targetNetwork = () => launch.value?.networkId ? store.getNetworkById(launch.value.networkId) : undefined

// ── Scripted conversation ─────────────────────────────────────────────────────
const start = () => {
  const l = launch.value
  if (!l) return
  messages.value = []
  mid = 0
  answers.plan = []
  suggestions.value = []
  const net = targetNetwork()
  if (l.mode === 'ask') { startAdvisor(); return }
  if (l.mode === 'add-connectivity' && net) {
    answers.cloud = net.cloud
    answers.region = net.regions[0].region
    contextChips.value = [net.name]
  } else {
    answers.cloud = 'aws'
    answers.region = 'us-east-1'
    contextChips.value = deriveChips(l.prompt ?? '')
  }
  if (l.prompt) pushUser(l.prompt)
  // Network creation starts with the provider (a network is single-cloud);
  // adding to an existing network already knows its cloud, so it starts at direction.
  if (net) askDirection()
  else askProvider()
}

const deriveChips = (prompt: string): string[] => {
  const chips: string[] = []
  const m = prompt.match(/\b([a-z0-9-]+(?:api|service|payments|upstream)[a-z0-9-]*)\b/i)
  if (m) chips.push(m[1].toLowerCase())
  if (/aws/i.test(prompt)) chips.push('aws')
  return chips.length ? chips : ['my-service']
}

// ── Advisor ('ask') — the networking buddy: answers the hard decisions, doesn't build ──
// Grounded answers to the questions the UI's own help text says people get stuck on
// (CIDR sizing, REP vs peering, cloud-side RAM share, DNS type, errors).
const KB: Record<string, QA[]> = {
  'connection-method': [
    { q: 'Resource endpoint or VPC peering — which should I use?', a: 'A resource endpoint is service-scoped and one-way: it exposes only the service you share, either Kong → your upstreams (egress) or your clients → Kong (ingress). VPC peering (and Transit Gateway) is network-level and bidirectional — it routes between whole VPCs, which is broader access. Use a resource endpoint to expose specific services with least privilege; use peering when you genuinely need full network-to-network routing.' },
    { q: 'Do I want ingress or egress?', a: 'Egress (Kong → upstream) is the common case — Kong calls into your private APIs and services. Ingress (client → Kong) is for inbound access to Kong from your private network. A resource endpoint only works one direction each, so pick egress to reach your upstreams and ingress to let your clients reach Kong privately.' },
    { q: 'What will I need to do on my cloud side?', a: 'For an AWS resource endpoint, Kong creates a RAM resource share. You then accept it in AWS Resource Access Manager and create a VPC endpoint from the shared resource in the subnets your clients use. The connection stays “Pending customer action” until you finish that — I can walk you through it.' },
  ],
  cidr: [
    { q: 'How should I size my CIDR?', a: 'Pick a range you’ll never outgrow — the CIDR is permanent and can’t be resized. If you run out of addresses you’d have to recreate the whole network. A /16 (~65,000 addresses) is a safe default. The prefix must be between /16 and /23; /23 is the smallest and supports up to 3 availability zones.' },
    { q: 'What ranges am I allowed to use?', a: 'It must be a private range — within 10.0.0.0/8, 100.64.0.0/10, 172.16.0.0/12, 192.168.0.0/16, or 198.18.0.0/15. Don’t overlap a range your organization already uses, since overlaps break VPC peering. 10.100.0.0/16 and 172.17.0.0/16 are reserved.' },
  ],
  'ram-share': [
    { q: 'What’s my next step to finish this connection?', a: 'This connection is waiting on you. Kong has provisioned its side and created an AWS RAM resource share. In your AWS account: open Resource Access Manager, accept the share, then create a VPC endpoint of type Resource in the subnets your clients use. Once that’s done, the connection activates on its own.' },
    { q: 'Where do I find the RAM share?', a: 'In the AWS console, go to Resource Access Manager → Shared with me → Resource shares. Accept the share from Kong, then create the VPC endpoint. The connection’s setup values (on its detail page) include the RAM share ARN to match against.' },
  ],
  'dns-type': [
    { q: 'Private hosted zone or outbound resolver?', a: 'A private hosted zone means Kong hosts the zone and answers queries for that domain from the network — use it to resolve your internal names to addresses on this network. An outbound resolver forwards matching queries to a resolver endpoint you already run in your cloud — use it when your existing resolver should answer.' },
  ],
  error: [
    { q: 'Why isn’t my DNS resolving?', a: 'Usually the resolver endpoint is unreachable from the network: queries reach the network but the resolver doesn’t answer. Confirm the outbound resolver (or hosted zone) exists and is associated with this network, check the target it points to, then re-check the status.' },
    { q: 'How do I fix a connection that’s in error?', a: 'Check that the target resource exists and is reachable, confirm any cloud-side steps (like accepting the AWS RAM share) are done, then re-check the connection status. If it stays in error, the connection’s Events tab shows what failed.' },
  ],
  general: [
    { q: 'What’s the difference between a network and a gateway?', a: 'A network is a private, single-cloud, single-region space in your cloud where Kong runs Dedicated Cloud Gateways, plus the private connectivity and DNS it needs. A gateway (control plane + data plane) runs inside a network. You create the network first, then attach gateways and add connectivity.' },
    { q: 'Which private connectivity option should I use?', a: 'A resource endpoint exposes specific services one-way with least privilege (egress = Kong reaches your upstreams; ingress = clients reach Kong). VPC peering / Transit Gateway routes whole networks bidirectionally. Start with a resource endpoint unless you need full network routing.' },
    { q: 'How should I size my CIDR?', a: 'The CIDR is permanent and can’t be resized, so choose a range large enough to grow into — a /16 (~65,000 addresses) is a safe default. It must be a private range and must not overlap ranges you already use, or peering breaks.' },
  ],
}

const advisorGreeting: Record<string, string> = {
  'connection-method': 'Deciding how to connect this network? Ask me anything — here are the common questions.',
  cidr: 'The CIDR is permanent, so it’s worth getting right. Ask me about sizing or allowed ranges.',
  'ram-share': 'This connection needs a step in your cloud account. I can walk you through it.',
  'dns-type': 'Not sure which DNS type to pick? Ask away.',
  error: 'Something isn’t healthy. Tell me what you’re seeing and I’ll help you resolve it.',
  general: 'I’m your networking buddy — ask me about private connectivity, CIDR ranges, DNS, or fixing errors.',
}

const startAdvisor = () => {
  const net = targetNetwork()
  const topic = launch.value?.topic ?? 'general'
  contextChips.value = net ? [net.name] : []
  suggestions.value = KB[topic] ?? KB.general
  pushKai({ text: advisorGreeting[topic] ?? advisorGreeting.general })
  if (launch.value?.prompt) askQuestion({ q: launch.value.prompt, a: answerFor(launch.value.prompt) })
}

// Match free text to the closest known answer; fall back to a helpful default.
const answerFor = (text: string): string => {
  const t = text.toLowerCase()
  const all = Object.values(KB).flat()
  const hit = all.find(qa => {
    const words = qa.q.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3)
    return words.some(w => t.includes(w))
  })
  if (hit) return hit.a
  if (/cidr|range|prefix|\/\d/.test(t)) return KB.cidr[0].a
  if (/peer|resource endpoint|rep|ingress|egress|connect/.test(t)) return KB['connection-method'][0].a
  if (/ram|share|pending|accept|aws/.test(t)) return KB['ram-share'][0].a
  if (/dns|resolve|hosted zone|resolver/.test(t)) return KB['dns-type'][0].a
  if (/error|fail|not working|broken|down/.test(t)) return KB.error[0].a
  return 'Good question. In this prototype I can help with private connectivity choices (resource endpoint vs peering), CIDR sizing, the cloud-side RAM share steps, DNS type, and resolving errors. Pick one of the suggestions, or ask me about any of those.'
}

const askQuestion = (qa: QA) => {
  pushUser(qa.q)
  suggestions.value = suggestions.value.filter(s => s.q !== qa.q)
  pushKai({ text: qa.a })
}

const askProvider = () => {
  pushKai({
    thinking: 'A network is single-cloud and single-region — the provider is the first thing to pin down, and it can’t change later…',
    thinkingOpen: false,
    text: 'Let’s create your network. Do you have a cloud provider in mind?',
    card: {
      type: 'choice',
      step: 'provider',
      question: 'Do you have a provider?',
      selected: 'aws',
      options: [
        ...providerOptions,
        { value: 'no', label: 'No — help me create a network', desc: 'KAi picks a sensible default (AWS · US East) that you can change by creating a different network later.' },
      ],
    },
  })
}

const askRegion = () => {
  pushKai({
    text: `Which ${answers.cloud.toUpperCase()} region should it run in? The region can’t change once the network is created.`,
    card: {
      type: 'choice',
      step: 'region',
      question: `Which ${answers.cloud.toUpperCase()} region?`,
      selected: DEFAULT_REGION[answers.cloud],
      options: regionsByCloud[answers.cloud].map(r => ({ value: r.value, label: r.label })),
    },
  })
}

const askDirection = () => {
  const net = targetNetwork()
  pushKai({
    thinking: net
      ? `Looking at ${net.name} (${net.cloud.toUpperCase()} · ${net.regions[0].region}) and what it already has configured…`
      : `Network will be ${answers.cloud.toUpperCase()} · ${answers.region}. Now the connectivity it needs…`,
    thinkingOpen: false,
    text: net
      ? `I'll help add private connectivity to ${net.name}. How should traffic flow?`
      : 'How should traffic flow through this network?',
    card: {
      type: 'choice',
      step: 'direction',
      question: 'How should traffic flow?',
      selected: 'egress',
      options: [
        { value: 'egress', label: 'Kong reaches my private upstreams', desc: 'Kong calls into your private APIs and services — a resource endpoint (egress). The most common case.' },
        { value: 'ingress', label: 'Clients reach my services through Kong', desc: 'Inbound access to Kong from your private network — a resource endpoint (ingress).' },
        { value: 'peering', label: 'Peer two private networks', desc: 'Full network-to-network routing — VPC peering or a transit gateway.' },
      ],
    },
  })
}

const askPlan = () => {
  const net = targetNetwork()
  const conn = connFor(answers.direction, answers.cloud)
  const options: ChoiceOption[] = []
  if (!net) {
    options.push({ value: 'network', label: 'Create the network', desc: `${answers.cloud.toUpperCase()} · ${answers.region} · CIDR 10.0.0.0/16 (sensible default).`, checked: true })
  }
  options.push({ value: 'connectivity', label: 'Add private connectivity', desc: `${directionLabel[answers.direction]} — ${conn.name}.`, checked: true })
  options.push({ value: 'dns', label: 'Add private DNS', desc: 'Resolve your private service names through this network (private hosted zone).', checked: true })
  pushKai({
    text: net
      ? `Here’s what I’ll add to ${net.name}. Adjust anything before I make changes.`
      : 'Here’s what I’ll set up. Adjust anything before I make changes.',
    card: { type: 'checklist', question: net ? `What should I add to ${net.name}?` : 'What should I set up?', options },
  })
}

const askConfirm = () => {
  const net = targetNetwork()
  const conn = connFor(answers.direction, answers.cloud)
  const parts: string[] = []
  if (answers.plan.includes('network')) parts.push(`a network in ${answers.cloud.toUpperCase()} ${answers.region}`)
  if (answers.plan.includes('connectivity')) parts.push(`${conn.name} (${directionLabel[answers.direction].toLowerCase()})`)
  if (answers.plan.includes('dns')) parts.push('private DNS')
  pushKai({
    text: `I'll set up ${listJoin(parts)} with sensible defaults${answers.plan.includes('network') ? ' (CIDR 10.0.0.0/16; DNS via a private hosted zone)' : ''}${net ? ` on ${net.name}` : ''}.`,
    card: {
      type: 'confirm',
      question: 'Do you want to proceed with sensible defaults?',
      options: [
        { value: 'yes', label: 'Yes, proceed with sensible defaults' },
        { value: 'specific', label: 'No, I want to configure it myself' },
      ],
    },
  })
}

const listJoin = (a: string[]) => a.length <= 1 ? (a[0] ?? '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`

// ── Resolving cards ───────────────────────────────────────────────────────────
const resolveChoice = (m: Msg) => {
  const card = m.card!
  m.resolved = true
  const val = card.selected || card.otherValue || ''

  if (card.step === 'provider') {
    if (val === 'no' || !val) {
      answers.cloud = 'aws'
      answers.region = DEFAULT_REGION.aws
      pushUser(providerLabel.no)
      pushKai({ text: `No problem — I'll use AWS in ${regionLabel('aws', answers.region)}, the most common setup. You can create a network on another provider later.` })
      askDirection()
    } else {
      answers.cloud = val as CloudProvider
      answers.region = DEFAULT_REGION[answers.cloud]
      pushUser(providerLabel[val] ?? val)
      askRegion()
    }
    return
  }

  if (card.step === 'region') {
    answers.region = val || DEFAULT_REGION[answers.cloud]
    pushUser(`${answers.cloud.toUpperCase()} · ${regionLabel(answers.cloud, answers.region)}`)
    askDirection()
    return
  }

  // direction
  answers.direction = val || 'egress'
  pushUser(directionLabel[answers.direction] ?? 'Something else')
  askPlan()
}

const resolveChecklist = (m: Msg) => {
  const card = m.card!
  m.resolved = true
  answers.plan = card.options.filter(o => o.checked).map(o => o.value)
  pushUser(card.options.filter(o => o.checked).map(o => o.label).join(', ') + (card.note?.trim() ? ` — “${card.note.trim()}”` : ''))
  askConfirm()
}

const resolveConfirm = (m: Msg, value: string) => {
  m.resolved = true
  if (value === 'yes') {
    pushUser('Yes, proceed with sensible defaults')
    apply()
  } else {
    pushUser('No, I want to configure it myself')
    const net = targetNetwork()
    pushKai({ text: net ? 'No problem — opening the connection form with these values prefilled.' : 'No problem — opening the network setup form with these values prefilled.' })
    setTimeout(() => {
      if (net) router.push({ name: 'networks-add-connection', params: { id: net.id } })
      else router.push({ name: 'networks-create' })
      close()
    }, 700)
  }
}

// ── Apply ─────────────────────────────────────────────────────────────────────
const apply = () => {
  pushKai({ working: true, text: 'Applying your configuration…' })
  setTimeout(() => {
    let netId = launch.value?.networkId
    const conn = connFor(answers.direction, answers.cloud)
    if (answers.plan.includes('network')) {
      const net = store.createNetwork({
        name: `${answers.cloud}-${answers.region}`,
        cloud: answers.cloud,
        regions: [{ region: answers.region, cidr: '10.0.0.0/16', zones: zonesFor(answers.region) }],
      })
      netId = net.id
    }
    if (netId && answers.plan.includes('connectivity')) {
      store.addConnection({ networkId: netId, name: conn.name, type: conn.type, family: conn.family, direction: conn.direction, cloud: answers.cloud, allowedConsumers: [] })
    }
    if (netId && answers.plan.includes('dns')) {
      store.addDnsConfig(netId, { name: 'internal.company.com', type: 'private-hosted-zone', usedFor: 'Upstream services' })
    }
    const net = netId ? store.getNetworkById(netId) : undefined
    // Mark the working message done + append the outcome.
    const working = messages.value.find(x => x.working)
    if (working) working.working = false
    pushKai({
      text: launch.value?.mode === 'add-connectivity'
        ? `Done — I've added ${conn.name}${answers.plan.includes('dns') ? ' and private DNS' : ''} to ${net?.name}. They’ll show as ready once provisioned.`
        : `Done — ${net?.name} is provisioning. I've queued ${conn.name}${answers.plan.includes('dns') ? ' and private DNS' : ''} to set up once it’s ready.`,
      cta: netId ? { label: 'Open network', run: () => { close(); router.push({ name: 'networks-detail', params: { id: netId! } }) } } : undefined,
    })
  }, 1100)
}

// ── Composer + controls ───────────────────────────────────────────────────────
const sendDraft = () => {
  const t = draft.value.trim()
  if (!t) return
  draft.value = ''
  if (isAdvisor.value) {
    pushUser(t)
    pushKai({ text: answerFor(t) })
    return
  }
  pushUser(t)
  pushKai({ text: 'Use the options above and I’ll take it from there — that keeps your setup accurate.' })
}
const removeChip = (c: string) => { contextChips.value = contextChips.value.filter(x => x !== c) }
const restart = () => start()
const close = () => closeKaiChat()

watch(isOpen, (open) => { if (open) start() })
</script>

<style scoped lang="scss">
// Fills the content area only — top nav (60px) and sidebar (left offset via prop)
// stay visible, matching the Figma.
.kaichat {
  background-color: $kui-color-background;
  bottom: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 60px;
  z-index: 40;
}

// Header
.kaichat-header {
  align-items: center;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex: 0 0 auto;
  gap: $kui-space-40;
  justify-content: space-between;
  padding: $kui-space-50 $kui-space-70;
}
.kaichat-title { align-items: center; color: $kui-color-text; display: flex; font-size: $kui-font-size-40; font-weight: $kui-font-weight-semibold; gap: $kui-space-30; }
.kaichat-spark { color: $kui-color-text-decorative-purple; }
.kaichat-head-actions { display: flex; gap: $kui-space-20; }
.kaichat-iconbtn {
  align-items: center;
  background: none;
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: inline-flex;
  padding: $kui-space-20;

  &:hover { background-color: $kui-color-background-neutral-weakest; color: $kui-color-text; }
}

// Conversation
.kaichat-scroll { flex: 1 1 auto; overflow-y: auto; }
.kaichat-thread {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  margin: $kui-space-0 auto;
  max-width: 760px;
  padding: $kui-space-80 $kui-space-70;
}

.msg { display: flex; }
.msg--user { justify-content: flex-end; }
.bubble {
  background-color: $kui-color-background-primary-weakest;
  border-radius: $kui-border-radius-40;
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  line-height: $kui-line-height-40;
  max-width: 80%;
  padding: $kui-space-40 $kui-space-50;
}
.msg--kai { flex-direction: column; gap: $kui-space-40; max-width: 92%; }

.thinking { display: flex; flex-direction: column; gap: $kui-space-30; }
.thinking-toggle {
  align-items: center;
  align-self: flex-start;
  background: none;
  border: none;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
  padding: $kui-space-0;
}
.thinking-text {
  border-left: $kui-border-width-20 solid $kui-color-border;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
  padding-left: $kui-space-50;
}
.kai-text { color: $kui-color-text; font-size: $kui-font-size-40; line-height: $kui-line-height-50; margin: $kui-space-0; }
.kai-working { align-items: center; color: $kui-color-text-neutral; display: flex; font-size: $kui-font-size-40; gap: $kui-space-30; margin: $kui-space-0; }
.kai-working-spin { animation: kai-spin 0.8s linear infinite; }
@keyframes kai-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

// Cards
.kcard {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  box-shadow: $kui-shadow;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  max-width: 520px;
  padding: $kui-space-60;
}
.kcard-hint {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.kcard-q { color: $kui-color-text; font-size: $kui-font-size-40; font-weight: $kui-font-weight-semibold; margin: $kui-space-0 $kui-space-0 $kui-space-30; }

.opt {
  align-items: flex-start;
  background: none;
  border: none;
  border-top: $kui-border-width-10 solid $kui-color-border;
  cursor: pointer;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-50 $kui-space-20;
  text-align: left;
  width: 100%;

  &:hover { background-color: $kui-color-background-neutral-weakest; }
}
.opt--sel .opt-label { color: $kui-color-text-primary; }
.opt-main { display: flex; flex-direction: column; gap: $kui-space-10; margin-right: auto; min-width: 0; }
.opt-label { color: $kui-color-text; font-size: $kui-font-size-30; font-weight: $kui-font-weight-semibold; }
.opt-desc { color: $kui-color-text-neutral; font-size: $kui-font-size-20; line-height: $kui-line-height-30; }
.opt-check { color: $kui-color-text-primary; flex: 0 0 auto; margin-top: $kui-space-10; }
.opt-go { color: $kui-color-text-neutral; flex: 0 0 auto; }
.opt--row { align-items: center; }

.checkbox {
  align-items: center;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-inverse;
  display: inline-flex;
  flex: 0 0 auto;
  height: 18px;
  justify-content: center;
  margin-top: $kui-space-10;
  width: 18px;

  &--on { background-color: $kui-color-background-primary; border-color: $kui-color-background-primary; }
}

.opt-other { align-items: center; border-top: $kui-border-width-10 solid $kui-color-border; display: flex; gap: $kui-space-40; padding-top: $kui-space-50; }
.opt-other-label { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }

.kcard-note {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  color: $kui-color-text;
  font-family: inherit;
  font-size: $kui-font-size-30;
  margin-top: $kui-space-40;
  padding: $kui-space-40 $kui-space-50;
  resize: vertical;
  width: 100%;
}
.kcard-foot { display: flex; gap: $kui-space-40; justify-content: flex-end; margin-top: $kui-space-40; }

.kai-cta { display: flex; }

// Advisor suggested questions
.kai-suggestions { display: flex; flex-direction: column; align-items: flex-start; gap: $kui-space-40; }
.kai-suggestions-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.kai-suggestion {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text;
  cursor: pointer;
  font-family: inherit;
  font-size: $kui-font-size-30;
  padding: $kui-space-30 $kui-space-50;
  text-align: left;

  &:hover { border-color: $kui-color-border-decorative-purple; color: $kui-color-text-decorative-purple; }
}

// Composer
.kaichat-composer {
  border-top: $kui-border-width-10 solid $kui-color-border;
  flex: 0 0 auto;
  margin: $kui-space-0 auto;
  max-width: 760px;
  padding: $kui-space-50 $kui-space-70 $kui-space-60;
  width: 100%;
}
.composer-box {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-50;

  &:focus-within { border-color: $kui-color-border-primary; }
}
.composer-field {
  background: none;
  border: none;
  color: $kui-color-text;
  font-family: inherit;
  font-size: $kui-font-size-40;
  outline: none;
  resize: none;
  width: 100%;
}
.composer-bottom { align-items: center; display: flex; gap: $kui-space-40; }
.composer-chips { display: flex; flex-wrap: wrap; gap: $kui-space-30; margin-right: auto; }
.composer-chip {
  align-items: center;
  background-color: $kui-color-background-decorative-purple-weakest;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-decorative-purple;
  display: inline-flex;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-10;
  padding: $kui-space-10 $kui-space-30;
}
.composer-hash { opacity: 0.6; }
.composer-chip-x { align-items: center; background: none; border: none; color: inherit; cursor: pointer; display: inline-flex; padding: $kui-space-0; }
.composer-send {
  align-items: center;
  background: linear-gradient(135deg, $kui-color-background-decorative-purple, $kui-color-background-primary);
  border: none;
  border-radius: $kui-border-radius-30;
  color: $kui-color-text-inverse;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  padding: $kui-space-30;

  &:disabled { cursor: not-allowed; opacity: 0.4; }
}
.kaichat-disclaimer { color: $kui-color-text-neutral; font-size: $kui-font-size-20; margin: $kui-space-40 $kui-space-0 $kui-space-0; text-align: center; }
.kaichat-disclaimer a { color: $kui-color-text-primary; }
</style>
