<template>
  <div class="ncm">
    <!-- ── KAi reads the map — collapsed by default so the map stays above the fold ── -->
    <KaiSummaryCard
      v-if="kaiOpen"
      class="ncm-kai"
      title="KAi read this map"
      :insights="kaiInsights"
      :one-liner="kaiOneLiner"
      :actions="kaiActions"
      initial-collapsed
      data-testid="ncm-kai"
      @action="onKaiAction"
      @close="kaiOpen = false"
    />

    <!-- ── Pannable topology canvas ────────────────────────────────────────── -->
    <div
      ref="viewportEl"
      class="flowcanvas"
      :class="{ 'flowcanvas--grabbing': dragging }"
      data-testid="ncm-canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
    >
      <div class="flow-controls" @pointerdown.stop>
        <KButton appearance="secondary" size="small" data-testid="ncm-zoom-in" aria-label="Zoom in" @click="zoomButton(1.2)">
          <AddIcon :size="KUI_ICON_SIZE_20" decorative />
        </KButton>
        <KButton appearance="secondary" size="small" data-testid="ncm-zoom-out" aria-label="Zoom out" @click="zoomButton(1 / 1.2)">
          <RemoveIcon :size="KUI_ICON_SIZE_20" decorative />
        </KButton>
        <KButton appearance="secondary" size="small" data-testid="ncm-zoom-fit" @click="fit">
          Fit
        </KButton>
        <KButton
          v-if="healthyCount"
          :appearance="focusProblems ? 'primary' : 'secondary'"
          size="small"
          data-testid="ncm-focus-problems"
          @click="focusProblems = !focusProblems"
        >
          {{ focusProblems ? 'Show all' : 'Focus problems' }}
        </KButton>
      </div>

      <span class="flow-hint">Drag to pan · scroll with {{ modKeyLabel }} to zoom</span>

      <div class="flow-stage" :style="stageStyle">
        <svg class="flow-edges" :width="layout.width" :height="layout.height" :viewBox="`0 0 ${layout.width} ${layout.height}`">
          <defs>
            <marker v-for="t in tones" :id="`arrow-${t}`" :key="t" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" :class="`edge-arrow edge-arrow--${t}`" />
            </marker>
          </defs>
          <path
            v-for="e in layout.edges"
            :key="e.id"
            :d="e.d"
            class="flow-edge"
            :class="[`flow-edge--${e.tone}`, { 'flow-edge--dim': isDim(e.tone) }]"
            :marker-end="`url(#arrow-${e.tone})`"
          />
        </svg>

        <button
          v-for="n in layout.nodes"
          :key="n.id"
          type="button"
          class="fnode"
          :class="[
            `fnode--${n.kind}`,
            { 'fnode--selected': selectedId === n.id, 'fnode--dim': isDim(n.tone) },
          ]"
          :style="nodeStyle(n)"
          :data-testid="`ncm-node-${n.id}`"
          @click="onNodeClick(n)"
        >
          <span class="fnode-ic" :class="`fnode-ic--${n.kind}`">
            <component :is="kindIcon(n.kind)" :size="KUI_ICON_SIZE_20" decorative />
          </span>
          <span class="fnode-text">
            <span class="fnode-kicker">
              {{ kindLabel(n.kind) }}
              <span v-if="props.directional && n.dir" class="fnode-dir">· {{ directionCategoryLabel[n.dir] }}</span>
            </span>
            <span class="fnode-name">{{ n.name }}</span>
            <span class="fnode-sub">{{ n.sub }}</span>
          </span>
          <span class="fnode-status">
            <span class="fnode-dot" :class="`fnode-dot--${n.tone}`" />
          </span>
        </button>
      </div>
    </div>

    <div class="ncm-legendbar">
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--ready" />Healthy</span>
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--pending" />Pending / needs action</span>
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--error" />Error</span>
      <span class="ncm-legend-flow">Traffic flows left to right.</span>
    </div>

    <!-- ── Detail slideout: Details · Impact · Path ────────────────────────── -->
    <KSlideout
      :visible="detailOpen"
      :has-overlay="false"
      :close-on-blur="false"
      :title="selectedNode ? selectedNode.name : ''"
      max-width="420px"
      data-testid="ncm-detail"
      @close="selectedId = null"
    >
      <div v-if="selectedNode" class="ncm-detail">
        <div class="ncm-detail-head">
          <span class="ncm-detail-kicker">
            {{ kindLabel(selectedNode.kind) }}
            <template v-if="props.directional && selectedNode.dir"> · {{ directionCategoryLabel[selectedNode.dir] }}</template>
          </span>
          <KBadge :appearance="toneAppearance(selectedNode.tone)">{{ selectedNode.statusLabel }}</KBadge>
        </div>

        <div v-if="detailTabs.length > 1" class="dtabs" role="tablist">
          <button
            v-for="t in detailTabs"
            :key="t.key"
            type="button"
            class="dtab"
            :class="{ 'dtab--active': detailTab === t.key }"
            :data-testid="`ncm-tab-${t.key}`"
            @click="detailTab = t.key"
          >
            {{ t.label }}<span v-if="t.count" class="dtab-count">{{ t.count }}</span>
          </button>
        </div>

        <!-- Details -->
        <div v-if="detailTab === 'details'" class="dtab-body">
          <section v-if="selCause" class="dsec">
            <span class="dsec-label">Probable cause</span>
            <p class="dcause">{{ selCause }}</p>
          </section>

          <section v-if="selReco" class="dreco" :class="`dreco--${selectedNode.tone}`">
            <span class="dsec-label">Recommended action</span>
            <p class="dreco-title">{{ selReco.title }}</p>
            <p class="dreco-detail">{{ selReco.detail }}</p>
            <KButton
              v-if="selReco.cta"
              appearance="primary"
              size="small"
              data-testid="ncm-reco-cta"
              @click="runCta(selReco.cta)"
            >
              {{ selReco.cta.label }}
              <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
            </KButton>
          </section>

          <section class="dsec">
            <span class="dsec-label">Details</span>
            <dl class="ncm-detail-facts">
              <template v-for="f in nodeFacts(selectedNode)" :key="f.label">
                <dt>{{ f.label }}</dt>
                <dd>{{ f.value }}</dd>
              </template>
            </dl>
          </section>
        </div>

        <!-- Impact -->
        <div v-else-if="detailTab === 'impact'" class="dtab-body">
          <template v-if="selImpact.length">
            <span class="dsec-label">{{ impactHeading }}</span>
            <ul class="dimpact">
              <li v-for="r in selImpact" :key="r.name" class="dimpact-row">
                <span class="fnode-dot" :class="`fnode-dot--${r.tone}`" />
                <span class="dimpact-text">
                  <span class="dimpact-name">{{ r.name }}</span>
                  <span class="dimpact-meta">{{ r.meta }}</span>
                </span>
                <KBadge :appearance="toneAppearance(r.tone)">{{ r.statusLabel }}</KBadge>
              </li>
            </ul>
          </template>
          <p v-else class="dempty">Nothing else depends on this node.</p>
        </div>

        <!-- Path -->
        <div v-else class="dtab-body">
          <template v-if="selHops.length">
            <div class="dpath">
              <template v-for="(h, i) in selHops" :key="h.key">
                <div class="dhop" :class="{ 'dhop--broken': i === selFirstBroken }">
                  <span class="dhop-ic" :class="`dhop-ic--${h.tone}`">
                    <component :is="h.tone === 'ready' ? CheckIcon : WarningIcon" :size="KUI_ICON_SIZE_20" decorative />
                  </span>
                  <span class="dhop-text">
                    <span class="dhop-kicker">{{ h.kicker }}</span>
                    <span class="dhop-title">{{ h.title }}</span>
                  </span>
                </div>
                <div v-if="i < selHops.length - 1" class="dhop-link" :class="`dhop-link--${selHops[i + 1].tone}`">
                  {{ transitionLabel(selHops[i + 1]) }}
                </div>
              </template>
            </div>
            <p class="dpath-summary" :class="`dpath-summary--${selPathTone}`">{{ selPathSummary }}</p>
          </template>
          <p v-else class="dempty">This node isn’t on a single traced path.</p>
        </div>
      </div>
    </KSlideout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { KBadge, KButton, KSlideout } from '@kong/kongponents'
import {
  ArrowRightIcon,
  AddIcon,
  RemoveIcon,
  CheckIcon,
  WarningIcon,
  NetworkIcon,
  ConnectionsIcon,
  WorldPrivateIcon,
  RuntimeDedicatedCloudIcon,
  LocationIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight, KaiAction } from '@/components/KaiSummaryCard.vue'
import type { Network, Connection, Gateway, DnsConfig } from '@/types'
import type { ServicePath } from '@/composables/useNetworksStore'
import {
  connectionTypeLabel,
  statusLabel as connStatusLabel,
  nextActionText,
  directionCategory,
  directionCategoryLabel,
  type DirectionCategory,
} from '@/utils/connectionDisplay'

const props = withDefaults(defineProps<{
  network: Network
  connections: Connection[]
  gateways?: Gateway[]
  dnsConfigs?: DnsConfig[]
  services?: ServicePath[]
  // Prototype-only "by direction" variant: tag connectivity nodes with their
  // traffic direction (Client → Kong / Kong → upstream / Bidirectional).
  directional?: boolean
}>(), {
  gateways: () => [],
  dnsConfigs: () => [],
  services: () => [],
  directional: false,
})

const router = useRouter()
const networkId = computed(() => props.network.id)

type Tone = 'ready' | 'pending' | 'error'
type Kind = 'gateway' | 'network' | 'connectivity' | 'dns' | 'target'
type DetailTab = 'details' | 'impact' | 'path'

const tones: Tone[] = ['ready', 'pending', 'error']
const focusProblems = ref(false)
const selectedId = ref<string | null>(null)
const detailTab = ref<DetailTab>('details')

const connTone = (status: Connection['status']): Tone =>
  status === 'ready' ? 'ready' : status === 'error' ? 'error' : 'pending'
const dnsTone = (status: DnsConfig['status']): Tone =>
  status === 'error' ? 'error' : status === 'pending' ? 'pending' : 'ready'
const dnsTypeLabel = (t: DnsConfig['type']) => t === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const dnsStatusLabel = (s: DnsConfig['status']) => s === 'error' ? 'Not resolving' : s === 'pending' ? 'Pending' : 'Resolving'
const targetToneOf = (s: 'reachable' | 'unreachable' | 'pending'): Tone =>
  s === 'reachable' ? 'ready' : s === 'unreachable' ? 'error' : 'pending'
const targetStatusLabel = (s: 'reachable' | 'unreachable' | 'pending') =>
  s === 'reachable' ? 'Reachable' : s === 'unreachable' ? 'Unreachable' : 'Pending'
const worstTone = (list: Tone[]): Tone =>
  list.includes('error') ? 'error' : list.includes('pending') ? 'pending' : 'ready'

// ── Network status ────────────────────────────────────────────────────────────
const netTone = computed<Tone>(() =>
  props.network.status === 'ready' ? 'ready' : props.network.status === 'error' ? 'error' : 'pending')
const netStatusLabel = computed(() =>
  props.network.status === 'ready' ? 'Ready'
    : props.network.status === 'initialising' ? 'Initializing'
      : props.network.status === 'error' ? 'Error' : props.network.status)
const toneAppearance = (tone: Tone) => tone === 'ready' ? 'success' : tone === 'error' ? 'danger' : 'warning'

// ── Layout (deterministic left→right topology) ─────────────────────────────────
interface FNode {
  id: string
  kind: Kind
  name: string
  sub: string
  tone: Tone
  statusLabel: string
  dir?: DirectionCategory
  x: number
  y: number
  w: number
  h: number
}
interface FEdge { id: string; d: string; tone: Tone }

const NODE_W = 216
const NODE_H = 76
const COL_GAP = 92
const ROW_GAP = 18
const PAD = 36

const layout = computed<{ nodes: FNode[]; edges: FEdge[]; width: number; height: number }>(() => {
  const gwNodes: FNode[] = props.gateways.map(g => mk(`gw-${g.id}`, 'gateway', g.name, 'Dedicated Cloud Gateway', 'ready', 'Ready'))
  const hub: FNode = mk('network', 'network', props.network.name, `${props.network.cloud.toUpperCase()} · ${props.network.regions[0].region}`, netTone.value, netStatusLabel.value)
  const connNodes: FNode[] = props.connections.map(c => {
    const n = mk(`conn-${c.id}`, 'connectivity', c.name, connectionTypeLabel(c.type), connTone(c.status), connStatusLabel(c.status))
    n.dir = directionCategory(c)
    return n
  })
  const dnsNodes: FNode[] = props.dnsConfigs.map(d =>
    mk(`dns-${d.id}`, 'dns', d.name, dnsTypeLabel(d.type), dnsTone(d.status), dnsStatusLabel(d.status)))

  const targetMap = new Map<string, { node: FNode; conns: Set<string> }>()
  for (const s of props.services) {
    const key = s.target.name
    const tone = targetToneOf(s.target.status)
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        node: mk(`target-${key}`, 'target', s.target.name, s.target.address, tone, targetStatusLabel(s.target.status)),
        conns: new Set(),
      })
    }
    const entry = targetMap.get(key)!
    entry.node.tone = worstTone([entry.node.tone, tone])
    entry.node.statusLabel = targetStatusLabel(s.target.status)
    entry.conns.add(s.connectionId)
  }
  const targetNodes = [...targetMap.values()].map(t => t.node)

  const rawTiers: FNode[][] = [gwNodes, [hub], [...connNodes, ...dnsNodes], targetNodes]
  const tiers = rawTiers.filter(t => t.length > 0)

  const tierHeight = (t: FNode[]) => t.reduce((sum, n) => sum + n.h, 0) + Math.max(0, t.length - 1) * ROW_GAP
  const height = Math.max(...tiers.map(tierHeight)) + PAD * 2
  const width = PAD * 2 + tiers.length * NODE_W + (tiers.length - 1) * COL_GAP

  tiers.forEach((t, ti) => {
    const x = PAD + ti * (NODE_W + COL_GAP)
    let y = (height - tierHeight(t)) / 2
    for (const n of t) {
      n.x = x
      n.y = y
      y += n.h + ROW_GAP
    }
  })

  const byId = new Map(tiers.flat().map(n => [n.id, n]))
  const edge = (from: FNode, to: FNode): FEdge => {
    const x1 = from.x + from.w
    const y1 = from.y + from.h / 2
    const x2 = to.x
    const y2 = to.y + to.h / 2
    const mx = (x1 + x2) / 2
    return { id: `${from.id}->${to.id}`, tone: to.tone, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` }
  }

  const edges: FEdge[] = []
  for (const g of gwNodes) edges.push(edge(g, hub))
  for (const c of connNodes) edges.push(edge(hub, c))
  for (const d of dnsNodes) edges.push(edge(hub, d))
  for (const t of targetMap.values()) {
    for (const connId of t.conns) {
      const cn = byId.get(`conn-${connId}`)
      if (cn) edges.push(edge(cn, t.node))
    }
  }

  return { nodes: tiers.flat(), edges, width, height }
})

function mk(id: string, kind: Kind, name: string, sub: string, tone: Tone, statusLabel: string): FNode {
  return { id, kind, name, sub, tone, statusLabel, x: 0, y: 0, w: NODE_W, h: NODE_H }
}

const flowResourceNodes = computed(() => layout.value.nodes.filter(n => n.kind !== 'network'))
const problemCount = computed(() => flowResourceNodes.value.filter(n => n.tone !== 'ready').length)
const healthyCount = computed(() => flowResourceNodes.value.filter(n => n.tone === 'ready').length)
const isDim = (tone: Tone) => focusProblems.value && tone === 'ready'

// ── KAi: read the system map ───────────────────────────────────────────────
const rank = (t: Tone) => t === 'error' ? 2 : t === 'pending' ? 1 : 0
const uniq = (a: string[]) => [...new Set(a)]
const listJoin = (a: string[]) =>
  a.length <= 1 ? (a[0] ?? '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`

const problemNodes = computed(() =>
  flowResourceNodes.value.filter(n => n.tone !== 'ready').sort((a, b) => rank(b.tone) - rank(a.tone)))

const downstreamTargets = (n: FNode): string[] => {
  if (n.kind === 'connectivity') return uniq(props.services.filter(s => s.connectionId === n.id.slice(5)).map(s => s.target.name))
  if (n.kind === 'dns') return uniq(props.services.filter(s => s.dnsConfigId === n.id.slice(4)).map(s => s.target.name))
  return []
}

const kaiOpen = ref(true)
const kaiOneLiner = computed(() => {
  const p = problemNodes.value
  if (!p.length) return 'Everything in this map is healthy — traffic reaches every target.'
  return `${p.length} relationship${p.length === 1 ? '' : 's'} need attention — start with ${p[0].name}.`
})
const kaiInsights = computed<KaiInsight[]>(() => {
  const p = problemNodes.value
  if (!p.length) return [{ lead: 'Healthy:', text: 'every gateway, connection, and DNS record on this network is reaching its target.' }]
  const insights: KaiInsight[] = p.slice(0, 3).map(n => {
    const blocks = downstreamTargets(n)
    const impact = blocks.length ? ` This blocks ${listJoin(blocks)}.` : ''
    return { lead: n.name, text: `is ${n.statusLabel.toLowerCase()}.${impact}`, tone: n.tone === 'error' ? 'critical' : 'default' }
  })
  if (p.length > 3) insights.push({ text: `+${p.length - 3} more need attention.` })
  return insights
})
const kaiActions = computed<KaiAction[]>(() => {
  const a: KaiAction[] = []
  if (problemNodes.value.length && healthyCount.value) a.push({ key: 'focus', label: 'Show only what needs attention' })
  const top = problemNodes.value[0]
  if (top) {
    a.push({ key: 'trace', label: 'Trace the broken path' })
    a.push({ key: `open:${top.id}`, label: `Open ${top.name}` })
  }
  return a
})
const openNode = (id: string, tab: DetailTab = 'details') => { selectedId.value = id; detailTab.value = tab }
const onKaiAction = (key: string) => {
  if (key === 'focus') { focusProblems.value = true; return }
  const top = problemNodes.value[0]
  if (key === 'trace' && top) openNode(top.id, 'path')
  else if (key.startsWith('open:')) openNode(key.slice(5), 'details')
}

// ── Node presentation ───────────────────────────────────────────────────────
const kindIcon = (kind: Kind) => ({
  gateway: RuntimeDedicatedCloudIcon,
  network: NetworkIcon,
  connectivity: ConnectionsIcon,
  dns: WorldPrivateIcon,
  target: LocationIcon,
}[kind])
const kindLabel = (kind: Kind) => ({
  gateway: 'Gateway',
  network: 'Network',
  connectivity: 'Connectivity',
  dns: 'Private DNS',
  target: 'Private target',
}[kind])
const nodeStyle = (n: FNode) => ({ left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${n.h}px` })

// ── Selection + detail slideout ───────────────────────────────────────────────
const selectedNode = computed(() => layout.value.nodes.find(n => n.id === selectedId.value) || null)
const detailOpen = computed(() => selectedNode.value !== null)
const wasPanned = ref(false)
const onNodeClick = (n: FNode) => {
  if (wasPanned.value) return
  if (selectedId.value === n.id) { selectedId.value = null; return }
  openNode(n.id, 'details')
}

// Only surface a tab when it has something to say for THIS node. A healthy
// connectivity resource with no downstream and no traced path is just Details —
// no empty Impact/Path tabs, no tab bar at all.
const detailTabs = computed(() => {
  const tabs: { key: DetailTab; label: string; count?: number }[] = [{ key: 'details', label: 'Details' }]
  if (selImpact.value.length) tabs.push({ key: 'impact', label: 'Impact', count: selImpact.value.length })
  if (selHops.value.length) tabs.push({ key: 'path', label: 'Path' })
  return tabs
})
// Keep the active tab valid as selection changes (e.g. a node with no Path).
watch(selectedId, () => {
  if (selectedNode.value && !detailTabs.value.some(t => t.key === detailTab.value)) detailTab.value = 'details'
})

const nodeFacts = (n: FNode): { label: string; value: string }[] => {
  if (n.kind === 'network') {
    return [
      { label: 'Provider', value: props.network.cloud.toUpperCase() },
      { label: 'Region', value: props.network.regions[0].region },
      { label: 'CIDR', value: props.network.regions[0].cidr },
      { label: 'Zones', value: (props.network.regions[0].zones ?? []).join(', ') || '—' },
      { label: 'Used by', value: `${props.gateways.length} gateway${props.gateways.length === 1 ? '' : 's'}` },
      { label: 'Connectivity', value: `${props.connections.length} resource${props.connections.length === 1 ? '' : 's'}` },
      { label: 'Private DNS', value: `${props.dnsConfigs.length} configuration${props.dnsConfigs.length === 1 ? '' : 's'}` },
    ]
  }
  const facts: { label: string; value: string }[] = [{ label: 'Type', value: n.sub }, { label: 'Status', value: n.statusLabel }]
  if (n.kind === 'connectivity') {
    const c = props.connections.find(x => `conn-${x.id}` === n.id)
    if (n.dir) facts.push({ label: 'Direction', value: directionCategoryLabel[n.dir] })
    if (c?.peerVpcId) facts.push({ label: 'Customer VPC', value: c.peerVpcId })
    if (c?.setupValues?.ramShareArn) facts.push({ label: 'RAM share', value: c.setupValues.ramShareArn })
  }
  if (n.kind === 'dns') {
    const d = props.dnsConfigs.find(x => `dns-${x.id}` === n.id)
    if (d?.usedFor) facts.push({ label: 'Used for', value: d.usedFor })
    if (d?.relatedConnectionId) {
      const rel = props.connections.find(c => c.id === d.relatedConnectionId)
      if (rel) facts.push({ label: 'Resolves via', value: rel.name })
    }
  }
  if (n.kind === 'target') {
    const conns = props.services.filter(s => s.target.name === n.name).map(s => props.connections.find(c => c.id === s.connectionId)?.name).filter(Boolean)
    if (conns.length) facts.push({ label: 'Reached via', value: uniq(conns as string[]).join(', ') })
  }
  return facts
}

// ── Service paths (a node's end-to-end route) ─────────────────────────────────
const serviceObjForNode = (n: FNode): ServicePath | null => {
  if (n.kind === 'target') return props.services.find(s => s.target.name === n.name) ?? null
  if (n.kind === 'connectivity') return props.services.find(s => s.connectionId === n.id.slice(5)) ?? null
  if (n.kind === 'dns') return props.services.find(s => s.dnsConfigId === n.id.slice(4)) ?? null
  if (n.kind === 'gateway') return props.services.find(s => s.gatewayName === n.name) ?? props.services[0] ?? null
  return null
}

interface TraceHop { key: string; kicker: string; title: string; sub: string; tone: Tone; status: string }
const buildHops = (s: ServicePath): TraceHop[] => {
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  const conn = props.connections.find(c => c.id === s.connectionId)
  return [
    { key: 'service', kicker: 'Gateway service', title: s.name, sub: s.gatewayName, tone: 'ready', status: 'Sending' },
    { key: 'network', kicker: 'Network', title: props.network.name, sub: `${props.network.cloud.toUpperCase()} · ${props.network.regions[0].region}`, tone: props.network.status === 'ready' ? 'ready' : 'pending', status: netStatusLabel.value },
    { key: 'dns', kicker: 'Private DNS', title: s.upstream, sub: dns ? dnsTypeLabel(dns.type) : 'Not configured', tone: dns ? dnsTone(dns.status) : 'error', status: dns ? dnsStatusLabel(dns.status) : 'Missing' },
    { key: 'conn', kicker: 'Connectivity', title: conn ? conn.name : 'Not configured', sub: conn ? connectionTypeLabel(conn.type) : '—', tone: conn ? connTone(conn.status) : 'error', status: conn ? connStatusLabel(conn.status) : 'Missing' },
    { key: 'target', kicker: 'Private target', title: s.target.name, sub: s.target.address, tone: targetToneOf(s.target.status), status: targetStatusLabel(s.target.status) },
  ]
}
const servicePathTone = (s: ServicePath): Tone => worstTone(buildHops(s).map(h => h.tone))

// First unhealthy underlying resource on a node's path — where the fix lives.
const firstBrokenUnderlying = (n: FNode): { kind: 'dns' | 'conn'; id: string } | null => {
  const s = serviceObjForNode(n)
  if (!s) return null
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  if (dns && dnsTone(dns.status) !== 'ready') return { kind: 'dns', id: dns.id }
  const conn = props.connections.find(c => c.id === s.connectionId)
  if (conn && connTone(conn.status) !== 'ready') return { kind: 'conn', id: conn.id }
  return null
}

// ── Detail: Path tab ──────────────────────────────────────────────────────────
const selService = computed(() => selectedNode.value ? serviceObjForNode(selectedNode.value) : null)
const selHops = computed<TraceHop[]>(() => selService.value ? buildHops(selService.value) : [])
const selFirstBroken = computed(() => selHops.value.findIndex(h => h.tone !== 'ready'))
const selPathTone = computed<Tone>(() => worstTone(selHops.value.map(h => h.tone)))
const transitionLabel = (hop: TraceHop) => hop.tone === 'ready' ? 'Reachable' : hop.status
const selPathSummary = computed(() => {
  const s = selService.value
  if (!s) return ''
  const b = selHops.value.find(h => h.tone !== 'ready')
  if (!b) return `Traffic from ${s.name} reaches ${s.target.name}. The path is healthy.`
  return `Traffic from ${s.name} is blocked at ${b.kicker.toLowerCase()} — ${b.title} is ${b.status.toLowerCase()}.`
})

// ── Detail: Impact tab (blast radius) ─────────────────────────────────────────
interface ImpactRow { name: string; meta: string; tone: Tone; statusLabel: string }
const impactHeading = computed(() => {
  const n = selectedNode.value
  if (!n) return ''
  if (n.kind === 'target') return 'Depended on by'
  if (n.kind === 'gateway' || n.kind === 'network') return n.tone === 'ready' ? 'Reaches' : 'Affected resources'
  return n.tone === 'ready' ? 'Reaches' : 'Affected downstream'
})
const selImpact = computed<ImpactRow[]>(() => {
  const n = selectedNode.value
  if (!n) return []
  const targetRow = (name: string): ImpactRow => {
    const svc = props.services.find(s => s.target.name === name)
    const tone = svc ? targetToneOf(svc.target.status) : 'pending'
    return { name, meta: 'Private target', tone, statusLabel: svc ? targetStatusLabel(svc.target.status) : 'Pending' }
  }
  if (n.kind === 'connectivity' || n.kind === 'dns') return downstreamTargets(n).map(targetRow)
  if (n.kind === 'gateway') {
    const names = uniq(props.services.filter(s => s.gatewayName === n.name).map(s => s.target.name))
    return names.map(targetRow)
  }
  if (n.kind === 'target') {
    return props.services.filter(s => s.target.name === n.name).map(s => ({
      name: s.name, meta: `Service · ${s.gatewayName}`, tone: servicePathTone(s), statusLabel: servicePathTone(s) === 'ready' ? 'Healthy' : servicePathTone(s) === 'error' ? 'Blocked' : 'Degraded',
    }))
  }
  if (n.kind === 'network') {
    return flowResourceNodes.value
      .filter(r => r.tone !== 'ready')
      .map(r => ({ name: r.name, meta: kindLabel(r.kind), tone: r.tone, statusLabel: r.statusLabel }))
  }
  return []
})

// ── Detail: probable cause + actionable recommendation ────────────────────────
const selCause = computed<string | null>(() => {
  const n = selectedNode.value
  if (!n || n.tone === 'ready') return null
  if (n.kind === 'dns') {
    return n.tone === 'error'
      ? `Queries reach the network, but ${n.name} hasn’t responded — the resolver endpoint looks unreachable.`
      : `Resolution for ${n.name} is still propagating.`
  }
  if (n.kind === 'connectivity') {
    return n.tone === 'error'
      ? `${n.name} is in an error state and isn’t carrying traffic.`
      : `${n.name} is waiting on an action in your cloud account before it can carry traffic.`
  }
  if (n.kind === 'target') {
    const b = selHops.value.find(h => h.tone !== 'ready')
    return b
      ? `${n.name} can’t be reached — traffic is blocked at ${b.kicker.toLowerCase()}: ${b.title} is ${b.status.toLowerCase()}.`
      : `${n.name} is not reachable yet.`
  }
  return null
})

interface Cta { label: string; kind: 'route-conn' | 'route-dns' | 'tab-path'; id?: string }
interface Reco { title: string; detail: string; cta?: Cta }
const selReco = computed<Reco | null>(() => {
  const n = selectedNode.value
  if (!n || n.tone === 'ready') return null
  if (n.kind === 'connectivity') {
    const connId = n.id.slice(5)
    const c = props.connections.find(x => x.id === connId)
    return {
      title: n.tone === 'error' ? 'Resolve the connection error' : 'Finish setting up this connection',
      detail: c ? nextActionText(c) : 'Review this connection’s configuration.',
      cta: { label: 'Open connection', kind: 'route-conn', id: connId },
    }
  }
  if (n.kind === 'dns') {
    const dnsId = n.id.slice(4)
    if (n.tone === 'error') {
      return {
        title: 'Restore DNS resolution',
        detail: 'Check the outbound resolver configuration and the target it points to, then re-check the status.',
        cta: { label: 'Open DNS configuration', kind: 'route-dns', id: dnsId },
      }
    }
    return { title: 'Wait for resolution', detail: 'Resolution is still propagating. No action is needed unless it stays pending.' }
  }
  if (n.kind === 'target') {
    const b = firstBrokenUnderlying(n)
    if (b?.kind === 'dns') {
      return {
        title: 'Fix the upstream resolver',
        detail: `${n.name} depends on a DNS record that isn’t resolving. Restore it, then re-check this target.`,
        cta: { label: 'Open DNS configuration', kind: 'route-dns', id: b.id },
      }
    }
    if (b?.kind === 'conn') {
      return {
        title: 'Fix the upstream connection',
        detail: `${n.name} depends on a connection that isn’t healthy. Resolve it, then re-check this target.`,
        cta: { label: 'Open connection', kind: 'route-conn', id: b.id },
      }
    }
    return { title: 'Wait for the path to come up', detail: 'No action is needed unless it stays pending.', cta: { label: 'View the path', kind: 'tab-path' } }
  }
  return null
})

const runCta = (cta: Cta) => {
  if (cta.kind === 'route-conn') router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId: cta.id } })
  else if (cta.kind === 'route-dns') router.push({ name: 'networks-dns-detail', params: { id: networkId.value, dnsId: cta.id } })
  else if (cta.kind === 'tab-path') detailTab.value = 'path'
}

// ── Pan + zoom ─────────────────────────────────────────────────────────────
const viewportEl = ref<HTMLElement | null>(null)
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)
const dragging = ref(false)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const modKeyLabel = isMac ? '⌘' : 'Ctrl'
const stageStyle = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
}))

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
let ptr = { id: -1, x: 0, y: 0, px: 0, py: 0, moved: false }

const onPointerDown = (e: PointerEvent) => {
  wasPanned.value = false
  ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pan.value.x, py: pan.value.y, moved: false }
  dragging.value = true
}
const onPointerMove = (e: PointerEvent) => {
  if (!dragging.value || e.pointerId !== ptr.id) return
  const dx = e.clientX - ptr.x
  const dy = e.clientY - ptr.y
  if (!ptr.moved && Math.hypot(dx, dy) > 4) {
    ptr.moved = true
    viewportEl.value?.setPointerCapture?.(ptr.id)
  }
  if (ptr.moved) pan.value = { x: ptr.px + dx, y: ptr.py + dy }
}
const onPointerUp = () => {
  wasPanned.value = ptr.moved
  dragging.value = false
  if (ptr.id !== -1 && viewportEl.value?.hasPointerCapture?.(ptr.id)) viewportEl.value.releasePointerCapture(ptr.id)
  ptr.id = -1
}

const zoomAt = (factor: number, cx: number, cy: number) => {
  const z = clamp(zoom.value * factor, 0.4, 2)
  const k = z / zoom.value
  pan.value = { x: cx - (cx - pan.value.x) * k, y: cy - (cy - pan.value.y) * k }
  zoom.value = z
}
const zoomButton = (factor: number) => {
  const vp = viewportEl.value
  zoomAt(factor, (vp?.clientWidth ?? 0) / 2, (vp?.clientHeight ?? 0) / 2)
}
const onWheel = (e: WheelEvent) => {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  const rect = viewportEl.value?.getBoundingClientRect()
  if (!rect) return
  zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - rect.left, e.clientY - rect.top)
}

const fit = () => {
  const vp = viewportEl.value
  if (!vp) return
  const { width, height } = layout.value
  const z = clamp(Math.min((vp.clientWidth - PAD) / width, (vp.clientHeight - PAD) / height, 1), 0.4, 1)
  zoom.value = z
  pan.value = { x: (vp.clientWidth - width * z) / 2, y: (vp.clientHeight - height * z) / 2 }
}

onMounted(() => nextTick(fit))
watch(() => [layout.value.width, layout.value.height], () => nextTick(fit))
</script>

<style scoped lang="scss">
.ncm {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
}

.ncm-kai { flex: 0 0 auto; }

// ── Pannable topology canvas ────────────────────────────────────────────────
.flowcanvas {
  background-color: $kui-color-background-neutral-weakest;
  background-image: radial-gradient($kui-color-border 1px, transparent 1px);
  background-size: 22px 22px;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: grab;
  height: 520px;
  overflow: hidden;
  position: relative;
  touch-action: none;
  user-select: none;

  &--grabbing { cursor: grabbing; }
}

.flow-controls {
  display: flex;
  gap: $kui-space-30;
  left: $kui-space-50;
  position: absolute;
  top: $kui-space-50;
  z-index: 2;
}

.flow-hint {
  bottom: $kui-space-50;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  left: $kui-space-50;
  position: absolute;
  z-index: 1;
}

.flow-stage {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  transform-origin: 0 0;
  width: 100%;
}

.flow-edges {
  left: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  top: 0;
}

.flow-edge {
  fill: none;
  stroke: $kui-color-border-neutral;
  stroke-width: 1.5;
  transition: opacity 0.12s ease-in;

  &--pending { stroke: $kui-color-text-warning; }
  &--error { stroke: $kui-color-text-danger; }
  &--ready { stroke: $kui-color-border-neutral; }
  &--dim { opacity: 0.25; }
}

.edge-arrow {
  &--pending { fill: $kui-color-text-warning; }
  &--error { fill: $kui-color-text-danger; }
  &--ready { fill: $kui-color-border-neutral; }
}

.fnode {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  box-shadow: $kui-shadow;
  cursor: pointer;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-0 $kui-space-50;
  position: absolute;
  text-align: left;
  transition: border-color 0.12s ease-in, box-shadow 0.12s ease-in, opacity 0.12s ease-in;

  &:hover { border-color: $kui-color-border-primary-weak; }
  &--selected {
    border-color: $kui-color-border-primary;
    box-shadow: 0 0 0 $kui-border-width-10 $kui-color-border-primary, $kui-shadow;
  }
  &--network {
    background-color: $kui-color-background-primary-weakest;
    border-color: $kui-color-border-primary-weak;
  }
  &--dim { opacity: 0.4; }
}

.fnode-ic {
  align-items: center;
  border-radius: $kui-border-radius-30;
  color: $kui-color-text-neutral;
  display: flex;
  flex: 0 0 auto;
  height: 32px;
  justify-content: center;
  width: 32px;

  &--gateway { background-color: $kui-color-background-decorative-purple-weakest; color: $kui-color-text-decorative-purple; }
  &--network { background-color: $kui-color-background-primary-weak; color: $kui-color-text-primary; }
  &--connectivity { background-color: $kui-color-background-decorative-aqua-weakest; color: $kui-color-text-decorative-aqua; }
  &--dns { background-color: $kui-color-background-neutral-weakest; color: $kui-color-text-decorative-pink; }
  &--target { background-color: $kui-color-background-neutral-weak; color: $kui-color-text-neutral-strong; }
}

.fnode-text { display: flex; flex-direction: column; gap: 1px; margin-right: auto; min-width: 0; overflow: hidden; }
.fnode-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.fnode-dir { color: $kui-color-text-decorative-aqua; text-transform: none; letter-spacing: normal; }
.fnode-name {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fnode-sub {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fnode-status { flex: 0 0 auto; }
.fnode-dot {
  border-radius: $kui-border-radius-circle;
  display: block;
  flex: 0 0 auto;
  height: 10px;
  width: 10px;

  &--ready { background-color: $kui-color-text-success; }
  &--pending { background-color: $kui-color-text-warning; }
  &--error { background-color: $kui-color-text-danger; }
}

// ── Legend ────────────────────────────────────────────────────────────────────
.ncm-legendbar {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  flex-wrap: wrap;
  font-size: $kui-font-size-20;
  gap: $kui-space-60;
}
.ncm-legend-item { align-items: center; display: flex; gap: $kui-space-30; }
.ncm-legend-flow { color: $kui-color-text-neutral; margin-left: auto; }

.ncm-dot {
  border-radius: $kui-border-radius-circle;
  flex-shrink: 0;
  height: 8px;
  width: 8px;

  &--ready { background-color: $kui-color-text-success; }
  &--pending { background-color: $kui-color-text-warning; }
  &--error { background-color: $kui-color-text-danger; }
}

// ── Detail slideout ───────────────────────────────────────────────────────────
.ncm-detail { display: flex; flex-direction: column; gap: $kui-space-60; }
.ncm-detail-head { align-items: center; display: flex; gap: $kui-space-40; justify-content: space-between; }
.ncm-detail-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

// Tabs
.dtabs {
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  gap: $kui-space-60;
}
.dtab {
  background: none;
  border: none;
  border-bottom: $kui-border-width-20 solid transparent;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: $kui-font-size-30;
  gap: $kui-space-30;
  margin-bottom: -$kui-border-width-10;
  padding: $kui-space-40 $kui-space-0;

  &:hover { color: $kui-color-text; }
  &--active { border-bottom-color: $kui-color-border-primary; color: $kui-color-text-primary; font-weight: $kui-font-weight-semibold; }
}
.dtab-count {
  align-items: center;
  background-color: $kui-color-background-neutral-weak;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text-neutral;
  display: inline-flex;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  height: 18px;
  justify-content: center;
  min-width: 18px;
  padding: 0 $kui-space-20;
}

.dtab-body { display: flex; flex-direction: column; gap: $kui-space-60; }
.dsec { display: flex; flex-direction: column; gap: $kui-space-30; }
.dsec-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dcause {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.dreco {
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
  padding: $kui-space-60;

  &--pending { background-color: $kui-color-background-warning-weakest; }
  &--error { background-color: $kui-color-background-danger-weakest; }
}
.dreco-title { color: $kui-color-text; font-size: $kui-font-size-40; font-weight: $kui-font-weight-semibold; margin: $kui-space-0; }
.dreco-detail { color: $kui-color-text-neutral; font-size: $kui-font-size-30; line-height: $kui-line-height-40; margin: $kui-space-0; }
.dreco :deep(.k-button) { align-self: flex-start; margin-top: $kui-space-20; }

.ncm-detail-facts {
  display: grid;
  gap: $kui-space-40 $kui-space-50;
  grid-template-columns: auto 1fr;
  margin: $kui-space-0;

  dt { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }
  dd { color: $kui-color-text; font-size: $kui-font-size-30; margin: $kui-space-0; overflow-wrap: anywhere; text-align: right; }
}

// Impact
.dimpact { display: flex; flex-direction: column; list-style: none; margin: $kui-space-0; padding: $kui-space-0; }
.dimpact-row {
  align-items: center;
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-50 $kui-space-0;

  &:first-child { border-top: none; }
}
.dimpact-text { display: flex; flex-direction: column; gap: $kui-space-10; margin-right: auto; min-width: 0; }
.dimpact-name { color: $kui-color-text; font-size: $kui-font-size-30; font-weight: $kui-font-weight-semibold; overflow-wrap: anywhere; }
.dimpact-meta { color: $kui-color-text-neutral; font-size: $kui-font-size-20; }

// Path
.dpath { display: flex; flex-direction: column; }
.dhop {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-40 $kui-space-50;

  &--broken { background-color: $kui-color-background-danger-weakest; border-color: $kui-color-border-danger; }
}
.dhop-ic {
  align-items: center;
  border-radius: $kui-border-radius-circle;
  display: flex;
  flex: 0 0 auto;
  height: 24px;
  justify-content: center;
  width: 24px;

  &--ready { background-color: $kui-color-background-success-weakest; color: $kui-color-text-success; }
  &--pending { background-color: $kui-color-background-warning-weakest; color: $kui-color-text-warning; }
  &--error { background-color: $kui-color-background-danger-weakest; color: $kui-color-text-danger; }
}
.dhop-text { display: flex; flex-direction: column; gap: $kui-space-10; min-width: 0; }
.dhop-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dhop-title { color: $kui-color-text; font-size: $kui-font-size-30; font-weight: $kui-font-weight-semibold; overflow-wrap: anywhere; }

// Connector between hops — vertical rail aligned under the hop icon, colour by health.
.dhop-link {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin-left: calc(#{$kui-space-50} + 12px - #{$kui-border-width-20} / 2);
  padding: $kui-space-30 $kui-space-0 $kui-space-30 $kui-space-60;

  border-left: $kui-border-width-20 solid $kui-color-border;
  &--pending { border-left-color: $kui-color-text-warning; color: $kui-color-text-warning; }
  &--error { border-left-color: $kui-color-text-danger; color: $kui-color-text-danger; }
}

.dpath-summary {
  border-radius: $kui-border-radius-30;
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin-top: $kui-space-50;
  padding: $kui-space-50 $kui-space-60;

  &--ready { background-color: $kui-color-background-success-weakest; }
  &--pending { background-color: $kui-color-background-warning-weakest; }
  &--error { background-color: $kui-color-background-danger-weakest; }
}

.dempty { color: $kui-color-text-neutral; font-size: $kui-font-size-30; margin: $kui-space-0; }
</style>
