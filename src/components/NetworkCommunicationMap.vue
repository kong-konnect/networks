<template>
  <div class="ncm">
    <!-- ── KAi reads the map (map mode only) ───────────────────────────────── -->
    <template v-if="mode === 'map'">
      <KaiSummaryCard
        v-if="kaiOpen"
        class="ncm-kai"
        title="KAi read this map"
        :insights="kaiInsights"
        :one-liner="kaiOneLiner"
        :actions="kaiActions"
        :initial-collapsed="problemCount === 0"
        data-testid="ncm-kai"
        @action="onKaiAction"
        @close="kaiOpen = false"
      />
      <p class="ncm-hint">Drag to pan · scroll with {{ modKeyLabel }} to zoom · select a node for details.</p>
    </template>

    <!-- Trace mode gets a quiet back control, not a primary action. -->
    <div v-else class="ncm-trace-head">
      <KButton appearance="tertiary" size="small" data-testid="ncm-back-to-map" @click="exitTrace">
        <ArrowLeftIcon :size="KUI_ICON_SIZE_20" decorative />
        Back to map
      </KButton>
      <span class="ncm-trace-headtext">Tracing one service end to end.</span>
    </div>

    <!-- ── MAP MODE: pannable topology canvas ──────────────────────────────── -->
    <template v-if="mode === 'map'">
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
    </template>

    <!-- ── TRACE MODE: one path, end to end ────────────────────────────────── -->
    <template v-else>
      <div class="ncm-trace-picker">
        <span class="ncm-trace-label">Service</span>
        <div class="ncm-trace-chips">
          <button
            v-for="s in services"
            :key="s.id"
            type="button"
            class="ncm-trace-chip"
            :class="{ 'ncm-trace-chip--active': tracedId === s.id }"
            :data-testid="`ncm-trace-${s.id}`"
            @click="tracedId = s.id"
          >
            <span class="ncm-dot" :class="`ncm-dot--${servicePathTone(s)}`" />
            {{ s.name }}
          </button>
        </div>
      </div>

      <div v-if="tracedService" class="ncm-trace" data-testid="ncm-trace">
        <div class="ncm-trace-chain">
          <template v-for="(hop, i) in traceHops" :key="hop.key">
            <div
              class="ncm-hop"
              :class="[`ncm-hop--${hop.tone}`, { 'ncm-hop--broken': brokenHop && brokenHop.key === hop.key }]"
            >
              <span class="ncm-node-kicker">{{ hop.kicker }}</span>
              <span class="ncm-hop-title">{{ hop.title }}</span>
              <span class="ncm-node-sub">{{ hop.sub }}</span>
              <span class="ncm-node-status" :class="`ncm-node-status--${hop.tone}`">{{ hop.status }}</span>
            </div>
            <span
              v-if="i < traceHops.length - 1"
              class="ncm-hop-arrow"
              :class="`ncm-hop-arrow--${traceHops[i + 1].tone}`"
            >→</span>
          </template>
        </div>
        <div class="ncm-trace-summary" :class="`ncm-trace-summary--${traceSummaryTone}`">
          {{ traceSummary }}
        </div>
      </div>
      <p v-else class="ncm-trace-empty">Pick a service above to trace its path through the network.</p>
    </template>

    <!-- ── Detail slideout for the selected node ───────────────────────────── -->
    <KSlideout
      :visible="detailOpen"
      :has-overlay="false"
      :close-on-blur="false"
      :title="selectedNode ? selectedNode.name : ''"
      max-width="380px"
      data-testid="ncm-detail"
      @close="selectedId = null"
    >
      <div v-if="selectedNode" class="ncm-detail">
        <div class="ncm-detail-head">
          <span class="ncm-detail-kicker">{{ kindLabel(selectedNode.kind) }}</span>
          <KBadge :appearance="toneAppearance(selectedNode.tone)">{{ selectedNode.statusLabel }}</KBadge>
        </div>
        <dl class="ncm-detail-facts">
          <template v-for="f in nodeFacts(selectedNode)" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </template>
        </dl>
        <div v-if="nodeAction(selectedNode)" class="ncm-detail-action" :class="`ncm-detail-action--${selectedNode.tone}`">
          <span class="ncm-detail-action-label">Recommended action</span>
          <p class="ncm-detail-action-text">{{ nodeAction(selectedNode) }}</p>
        </div>

        <div v-if="serviceForNode(selectedNode)" class="ncm-detail-cta">
          <KButton appearance="secondary" data-testid="ncm-detail-trace" @click="traceFromNode(selectedNode)">
            <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
            Trace this path
          </KButton>
        </div>
      </div>
    </KSlideout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { KBadge, KButton, KSlideout } from '@kong/kongponents'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  AddIcon,
  RemoveIcon,
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

type Tone = 'ready' | 'pending' | 'error'
type Kind = 'gateway' | 'network' | 'connectivity' | 'dns' | 'target'

const tones: Tone[] = ['ready', 'pending', 'error']
const mode = ref<'map' | 'trace'>('map')
const focusProblems = ref(false)
const selectedId = ref<string | null>(null)

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
const worstTone = (tones: Tone[]): Tone =>
  tones.includes('error') ? 'error' : tones.includes('pending') ? 'pending' : 'ready'

// ── Network status ────────────────────────────────────────────────────────────
const netTone = computed<Tone>(() =>
  props.network.status === 'ready' ? 'ready' : props.network.status === 'error' ? 'error' : 'pending')
const netStatusLabel = computed(() =>
  props.network.status === 'ready' ? 'Ready'
    : props.network.status === 'initialising' ? 'Initializing'
      : props.network.status === 'error' ? 'Error' : props.network.status)
const netStatusAppearance = computed(() =>
  props.network.status === 'ready' ? 'success' : props.network.status === 'error' ? 'danger' : 'warning')
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
  // Build each tier's node list (without positions yet).
  const gwNodes: FNode[] = props.gateways.map(g => mk(`gw-${g.id}`, 'gateway', g.name, 'Dedicated Cloud Gateway', 'ready', 'Ready'))
  const hub: FNode = mk('network', 'network', props.network.name, `${props.network.cloud.toUpperCase()} · ${props.network.regions[0].region}`, netTone.value, netStatusLabel.value)
  const connNodes: FNode[] = props.connections.map(c => {
    const n = mk(`conn-${c.id}`, 'connectivity', c.name, connectionTypeLabel(c.type), connTone(c.status), connStatusLabel(c.status))
    n.dir = directionCategory(c)
    return n
  })
  const dnsNodes: FNode[] = props.dnsConfigs.map(d =>
    mk(`dns-${d.id}`, 'dns', d.name, dnsTypeLabel(d.type), dnsTone(d.status), dnsStatusLabel(d.status)))

  // Targets: unique by name, worst tone across the services reaching them.
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

  // Tiers, empty ones dropped (hub always present).
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
// The AI value here is reading the graph — triage, root cause, and blast
// radius — not another button. KAi names what's wrong, what it blocks, and its
// "Try" chips drive the map (focus problems, trace the broken path, open node).
const rank = (t: Tone) => t === 'error' ? 2 : t === 'pending' ? 1 : 0
const uniq = (a: string[]) => [...new Set(a)]
const listJoin = (a: string[]) =>
  a.length <= 1 ? (a[0] ?? '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`

const problemNodes = computed(() =>
  flowResourceNodes.value.filter(n => n.tone !== 'ready').sort((a, b) => rank(b.tone) - rank(a.tone)))

// Targets a broken connectivity/DNS node cuts off downstream.
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
  if (worstServiceId.value) a.push({ key: 'trace', label: problemNodes.value.length ? 'Trace the broken path' : 'Trace a service path' })
  const top = problemNodes.value[0]
  if (top) a.push({ key: `open:${top.id}`, label: `Open ${top.name}` })
  return a
})
const onKaiAction = (key: string) => {
  if (key === 'focus') focusProblems.value = true
  else if (key === 'trace') enterTrace(worstServiceId.value ?? undefined)
  else if (key.startsWith('open:')) selectedId.value = key.slice(5)
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
  selectedId.value = selectedId.value === n.id ? null : n.id
}

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
    if (conns.length) facts.push({ label: 'Reached via', value: [...new Set(conns)].join(', ') })
  }
  return facts
}

const nodeAction = (n: FNode): string | null => {
  if (n.tone === 'ready') return null
  if (n.kind === 'connectivity') {
    const c = props.connections.find(x => `conn-${x.id}` === n.id)
    return c ? nextActionText(c) : null
  }
  if (n.kind === 'dns') {
    return n.tone === 'error'
      ? 'The resolver is unreachable. Check the outbound resolver configuration and the target it points to.'
      : 'Resolution is still propagating. No action needed unless it stays pending.'
  }
  if (n.kind === 'target') {
    return n.tone === 'error'
      ? 'This target is unreachable. Check the connection that reaches it and the target’s own health.'
      : 'The path to this target is still coming up. No action needed unless it stays pending.'
  }
  return null
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
watch(() => [layout.value.width, layout.value.height, mode.value], () => nextTick(fit))

// ── Path trace (separate mode) ────────────────────────────────────────────────
const tracedId = ref<string | null>(null)
const tracedService = computed(() => props.services.find(s => s.id === tracedId.value) || null)
const enterTrace = (serviceId?: string) => { mode.value = 'trace'; tracedId.value = serviceId ?? props.services[0]?.id ?? null }
const exitTrace = () => { mode.value = 'map'; tracedId.value = null }

const servicePathTone = (s: ServicePath): Tone => {
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  const conn = props.connections.find(c => c.id === s.connectionId)
  return worstTone([
    dns ? dnsTone(dns.status) : 'error',
    conn ? connTone(conn.status) : 'error',
    targetToneOf(s.target.status),
  ])
}

// Worst-health service path — what KAi's "Trace the broken path" jumps to.
const worstServiceId = computed(() => {
  const svcs = [...props.services].sort((a, b) => rank(servicePathTone(b)) - rank(servicePathTone(a)))
  return svcs[0]?.id ?? null
})

// Contextual trace: from a selected node, find the service path it sits on.
const serviceForNode = (n: FNode): string | null => {
  if (n.kind === 'target') return props.services.find(s => s.target.name === n.name)?.id ?? null
  if (n.kind === 'connectivity') return props.services.find(s => s.connectionId === n.id.slice(5))?.id ?? null
  if (n.kind === 'dns') return props.services.find(s => s.dnsConfigId === n.id.slice(4))?.id ?? null
  if (n.kind === 'gateway') return props.services.find(s => s.gatewayName === n.name)?.id ?? props.services[0]?.id ?? null
  return null
}
const traceFromNode = (n: FNode) => {
  const id = serviceForNode(n)
  if (id) { selectedId.value = null; enterTrace(id) }
}

interface TraceHop { key: string; kicker: string; title: string; sub: string; tone: Tone; status: string }
const traceHops = computed<TraceHop[]>(() => {
  const s = tracedService.value
  if (!s) return []
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  const conn = props.connections.find(c => c.id === s.connectionId)
  return [
    { key: 'service', kicker: 'Gateway service', title: s.name, sub: s.gatewayName, tone: 'ready', status: 'Sending' },
    { key: 'network', kicker: 'Network', title: props.network.name, sub: `${props.network.cloud.toUpperCase()} · ${props.network.regions[0].region}`, tone: props.network.status === 'ready' ? 'ready' : 'pending', status: netStatusLabel.value },
    { key: 'dns', kicker: 'Private DNS', title: s.upstream, sub: dns ? dnsTypeLabel(dns.type) : 'Not configured', tone: dns ? dnsTone(dns.status) : 'error', status: dns ? dnsStatusLabel(dns.status) : 'Missing' },
    { key: 'conn', kicker: 'Connectivity', title: conn ? conn.name : 'Not configured', sub: conn ? connectionTypeLabel(conn.type) : '—', tone: conn ? connTone(conn.status) : 'error', status: conn ? connStatusLabel(conn.status) : 'Missing' },
    { key: 'target', kicker: 'Private target', title: s.target.name, sub: s.target.address, tone: targetToneOf(s.target.status), status: targetStatusLabel(s.target.status) },
  ]
})
const brokenHop = computed(() => traceHops.value.find(h => h.tone !== 'ready') || null)
const traceSummary = computed(() => {
  const s = tracedService.value
  if (!s) return ''
  const b = brokenHop.value
  if (!b) return `Traffic from ${s.name} reaches ${s.target.name}. The path is healthy.`
  return `Traffic from ${s.name} is blocked at ${b.kicker.toLowerCase()} — ${b.title} is ${b.status.toLowerCase()}.`
})
const traceSummaryTone = computed(() => brokenHop.value?.tone ?? 'ready')
</script>

<style scoped lang="scss">
.ncm {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.ncm-toolbar {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
  justify-content: space-between;
}

.ncm-toolbar-actions {
  display: flex;
  gap: $kui-space-40;
}

.ncm-caption {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;

  .ncm-caption-dim { color: $kui-color-text-neutral; margin-left: $kui-space-30; }
}

.ncm-kai { margin-bottom: -$kui-space-30; }
.ncm-hint {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin: $kui-space-0;
}
.ncm-trace-head {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
}
.ncm-trace-headtext { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }
.ncm-detail-cta { display: flex; }

// ── Pannable topology canvas ────────────────────────────────────────────────
.flowcanvas {
  background-color: $kui-color-background-neutral-weakest;
  background-image: radial-gradient($kui-color-border 1px, transparent 1px);
  background-size: 22px 22px;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: grab;
  height: 560px;
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
.ncm-detail-facts {
  display: grid;
  gap: $kui-space-40 $kui-space-50;
  grid-template-columns: auto 1fr;
  margin: $kui-space-0;

  dt { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }
  dd { color: $kui-color-text; font-size: $kui-font-size-30; margin: $kui-space-0; overflow-wrap: anywhere; text-align: right; }
}
.ncm-detail-action {
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  padding: $kui-space-50;

  &--pending { background-color: $kui-color-background-warning-weakest; }
  &--error { background-color: $kui-color-background-danger-weakest; }

  .ncm-detail-action-label {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-10;
    font-weight: $kui-font-weight-semibold;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ncm-detail-action-text {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    line-height: $kui-line-height-40;
    margin: $kui-space-0;
  }
}

// ── Trace mode ──────────────────────────────────────────────────────────────
.ncm-trace-picker {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-50;
}
.ncm-trace-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
}
.ncm-trace-chips { display: flex; flex-wrap: wrap; gap: $kui-space-40; }
.ncm-trace-chip {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text;
  cursor: pointer;
  display: flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-30;
  padding: $kui-space-30 $kui-space-50;
  transition: border-color 0.12s ease-in;

  &:hover { border-color: $kui-color-border-primary; }
  &--active {
    background-color: $kui-color-background-primary-weakest;
    border-color: $kui-color-border-primary;
    color: $kui-color-text-primary;
    font-weight: $kui-font-weight-semibold;
  }
}

.ncm-trace { display: flex; flex-direction: column; gap: $kui-space-60; }
.ncm-trace-chain {
  align-items: stretch;
  display: flex;
  gap: $kui-space-40;
  overflow-x: auto;
  padding-bottom: $kui-space-40;
}
.ncm-hop {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex: 1 0 180px;
  flex-direction: column;
  gap: $kui-space-20;
  padding: $kui-space-50;

  &--pending { border-left: $kui-border-width-30 solid $kui-color-background-warning; }
  &--error { border-left: $kui-border-width-30 solid $kui-color-background-danger; }
  &--broken { box-shadow: $kui-shadow-focus; }
}
.ncm-node-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ncm-hop-title { color: $kui-color-text; font-size: $kui-font-size-30; font-weight: $kui-font-weight-semibold; overflow-wrap: anywhere; }
.ncm-node-sub { color: $kui-color-text-neutral; font-size: $kui-font-size-20; }
.ncm-node-status {
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;

  &--pending { color: $kui-color-text-warning; }
  &--error { color: $kui-color-text-danger; }
  &--ready { color: $kui-color-text-success; }
}
.ncm-hop-arrow {
  align-self: center;
  color: $kui-color-text-neutral;
  flex: 0 0 auto;
  font-size: $kui-font-size-50;

  &--pending { color: $kui-color-text-warning; }
  &--error { color: $kui-color-text-danger; }
  &--ready { color: $kui-color-text-success; }
}
.ncm-trace-summary {
  border-radius: $kui-border-radius-30;
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  padding: $kui-space-50 $kui-space-60;

  &--ready { background-color: $kui-color-background-success-weakest; }
  &--pending { background-color: $kui-color-background-warning-weakest; }
  &--error { background-color: $kui-color-background-danger-weakest; }
}
.ncm-trace-empty {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;
}
</style>
