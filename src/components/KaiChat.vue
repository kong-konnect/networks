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
        Set up with KAi
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
import { ref, reactive, watch, nextTick } from 'vue'
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
interface Card {
  type: 'choice' | 'checklist' | 'confirm'
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

// ── Region + connection helpers ───────────────────────────────────────────────
const regionOptions = [
  { label: 'AWS · US East (us-east-1)', value: 'aws:us-east-1' },
  { label: 'AWS · US West (us-west-2)', value: 'aws:us-west-2' },
  { label: 'GCP · US Central (us-central1)', value: 'gcp:us-central1' },
]
const zonesFor = (region: string) => region === 'us-east-1' ? ['use1-az1', 'use1-az2'] : [`${region}-a`, `${region}-b`]

const directionLabel: Record<string, string> = {
  egress: 'Kong reaches my private upstreams',
  ingress: 'Clients reach my services through Kong',
  peering: 'Peer two private networks',
}
const connFor = (dir: string, cloud: CloudProvider): { type: ConnectionType; family: ConnectionFamily; direction: ConnectionDirection; name: string } => {
  if (dir === 'peering') return { type: cloud === 'gcp' ? 'gcp-vpc-peering' : 'aws-vpc-peering', family: 'peering', direction: 'egress', name: `${cloud}-vpc-peer` }
  if (dir === 'ingress') return { type: cloud === 'gcp' ? 'gcp-psc-ingress' : 'aws-rep-ingress', family: 'private-endpoint', direction: 'ingress', name: `${cloud}-rep-ingress` }
  return { type: cloud === 'gcp' ? 'gcp-psc-egress' : 'aws-rep-egress', family: 'private-endpoint', direction: 'egress', name: `${cloud}-rep-egress` }
}
const targetNetwork = () => launch.value?.networkId ? store.getNetworkById(launch.value.networkId) : undefined

// ── Scripted conversation ─────────────────────────────────────────────────────
const start = () => {
  const l = launch.value
  if (!l) return
  messages.value = []
  mid = 0
  answers.plan = []
  const net = targetNetwork()
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
  askDirection()
}

const deriveChips = (prompt: string): string[] => {
  const chips: string[] = []
  const m = prompt.match(/\b([a-z0-9-]+(?:api|service|payments|upstream)[a-z0-9-]*)\b/i)
  if (m) chips.push(m[1].toLowerCase())
  if (/aws/i.test(prompt)) chips.push('aws')
  return chips.length ? chips : ['my-service']
}

const askDirection = () => {
  const net = targetNetwork()
  pushKai({
    thinking: net
      ? `Looking at ${net.name} (${net.cloud.toUpperCase()} · ${net.regions[0].region}) and what it already has configured…`
      : 'Reading your request and checking what a network needs before it can carry traffic…',
    thinkingOpen: false,
    text: net
      ? `I'll help add private connectivity to ${net.name}. First — how should traffic flow?`
      : `I'll help you set up private connectivity. First — how should traffic flow?`,
    card: {
      type: 'choice',
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

const askLocation = () => {
  pushKai({
    text: 'Where should this network run? Both can’t change once the network is created.',
    card: {
      type: 'choice',
      question: 'Which cloud and region?',
      selected: 'aws:us-east-1',
      options: regionOptions.map(r => ({ value: r.value, label: r.label })),
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
  if (card.question.startsWith('How should traffic')) {
    const val = card.selected || 'egress'
    answers.direction = val
    pushUser(directionLabel[val] ?? 'Something else')
    if (targetNetwork()) askPlan()
    else askLocation()
  } else {
    const val = card.selected || card.otherValue || 'aws:us-east-1'
    const [cloud, region] = val.split(':')
    answers.cloud = (cloud as CloudProvider) || 'aws'
    answers.region = region || 'us-east-1'
    pushUser(regionOptions.find(r => r.value === val)?.label ?? val)
    askPlan()
  }
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
  pushUser(t)
  draft.value = ''
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
