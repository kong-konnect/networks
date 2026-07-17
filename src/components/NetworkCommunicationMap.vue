<template>
  <div class="ncm">
    <!-- Trace a path, entered from a gateway service -->
    <div v-if="services.length" class="ncm-trace-picker">
      <span class="ncm-trace-label">Trace a path</span>
      <div class="ncm-trace-chips">
        <button
          v-for="s in services"
          :key="s.id"
          type="button"
          class="ncm-trace-chip"
          :class="{ 'ncm-trace-chip--active': tracedId === s.id }"
          :data-testid="`ncm-trace-${s.id}`"
          @click="tracedId = tracedId === s.id ? null : s.id"
        >
          <span class="ncm-dot" :class="`ncm-dot--${servicePathTone(s)}`" />
          {{ s.name }}
        </button>
        <button
          v-if="tracedService"
          type="button"
          class="ncm-trace-clear"
          data-testid="ncm-trace-clear"
          @click="tracedId = null"
        >
          Clear trace
        </button>
      </div>
    </div>

    <!-- Trace view: one path, end to end -->
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
          <span v-if="i < traceHops.length - 1" class="ncm-hop-arrow" :class="`ncm-hop-arrow--${traceHops[i + 1].tone}`">→</span>
        </template>
      </div>
      <div class="ncm-trace-summary" :class="`ncm-trace-summary--${traceSummaryTone}`">
        {{ traceSummary }}
      </div>
    </div>

    <!-- Toolbar: what's on screen + reveal healthy -->
    <div v-if="!tracedService" class="ncm-toolbar">
      <p class="ncm-caption">
        <template v-if="problemNodes.length">
          {{ problemNodes.length }} relationship{{ problemNodes.length === 1 ? '' : 's' }} need{{ problemNodes.length === 1 ? 's' : '' }} attention.
        </template>
        <template v-else>
          Everything is healthy.
        </template>
        <span v-if="healthyNodes.length" class="ncm-caption-dim">
          {{ healthyNodes.length }} healthy relationship{{ healthyNodes.length === 1 ? '' : 's' }} hidden.
        </span>
      </p>
      <KButton
        v-if="healthyNodes.length"
        appearance="tertiary"
        size="small"
        data-testid="ncm-show-all"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show problems only' : `Show all (${healthyNodes.length})` }}
      </KButton>
    </div>

    <div v-if="!tracedService" class="ncm-body">
      <!-- Map canvas (fixed coordinate space; scrolls on small screens) -->
      <div class="ncm-scroll">
        <div class="ncm-canvas" data-testid="ncm-canvas">
          <svg class="ncm-edges" :width="W" :height="H" :viewBox="`0 0 ${W} ${H}`">
            <line
              v-for="n in visibleNodes"
              :key="`edge-${n.id}`"
              :x1="center.x"
              :y1="center.y"
              :x2="n.x"
              :y2="n.y"
              class="ncm-edge"
              :class="[`ncm-edge--${n.tone}`, { 'ncm-edge--dashed': n.tone === 'pending' }]"
            />
          </svg>

          <!-- Central node: the network -->
          <button
            type="button"
            class="ncm-node ncm-node--network"
            :class="{ 'ncm-node--selected': selectedId === null }"
            :style="nodeStyle(center.x, center.y)"
            data-testid="ncm-network"
            @click="selectedId = null"
          >
            <span class="ncm-node-kicker">Network</span>
            <span class="ncm-node-title">{{ network.name }}</span>
            <span class="ncm-node-sub">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }} · {{ network.regions[0].cidr }}</span>
            <span v-if="network.regions[0].zones?.length" class="ncm-node-zones">{{ network.regions[0].zones.join(' · ') }}</span>
            <KBadge :appearance="netStatusAppearance">{{ netStatusLabel }}</KBadge>
          </button>

          <!-- Spoke nodes -->
          <button
            v-for="n in visibleNodes"
            :key="n.id"
            type="button"
            class="ncm-node"
            :class="[`ncm-node--${n.tone}`, { 'ncm-node--selected': selectedId === n.id }]"
            :style="nodeStyle(n.x, n.y)"
            :data-testid="`ncm-node-${n.id}`"
            @click="selectedId = n.id"
          >
            <span class="ncm-node-head">
              <span class="ncm-node-kicker">{{ n.categoryLabel }}</span>
              <span class="ncm-dot" :class="`ncm-dot--${n.tone}`" />
            </span>
            <span class="ncm-node-title">{{ n.name }}</span>
            <span class="ncm-node-sub">{{ n.sub }}</span>
            <span class="ncm-node-status" :class="`ncm-node-status--${n.tone}`">{{ n.statusLabel }}</span>
          </button>
        </div>
      </div>

      <!-- Detail panel for the selected node -->
      <aside class="ncm-detail" data-testid="ncm-detail">
        <div class="ncm-detail-head">
          <span class="ncm-detail-kicker">{{ selected ? selected.categoryLabel : 'Network' }}</span>
          <h3 class="ncm-detail-title">{{ selected ? selected.name : network.name }}</h3>
          <KBadge :appearance="selected ? toneAppearance(selected.tone) : netStatusAppearance">
            {{ selected ? selected.statusLabel : netStatusLabel }}
          </KBadge>
        </div>

        <dl class="ncm-detail-facts">
          <template v-for="f in detailFacts" :key="f.label">
            <dt>{{ f.label }}</dt>
            <dd>{{ f.value }}</dd>
          </template>
        </dl>

        <div v-if="detailAction" class="ncm-detail-action" :class="`ncm-detail-action--${detailActionTone}`">
          <span class="ncm-detail-action-label">Recommended action</span>
          <p class="ncm-detail-action-text">{{ detailAction }}</p>
        </div>
      </aside>
    </div>

    <!-- Legend -->
    <div v-if="!tracedService" class="ncm-legendbar">
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--ready" />Healthy</span>
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--pending" />Pending / needs action</span>
      <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--error" />Error</span>
      <span class="ncm-legend-sep" />
      <span class="ncm-legend-item ncm-legend-item--dim">Solid = healthy · dashed = pending · red = broken</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KBadge, KButton } from '@kong/kongponents'
import type { Network, Connection, Gateway, DnsConfig } from '@/types'
import type { ServicePath } from '@/composables/useNetworksStore'
import {
  connectionTypeLabel,
  statusLabel as connStatusLabel,
  nextActionText,
} from '@/utils/connectionDisplay'

const props = withDefaults(defineProps<{
  network: Network
  connections: Connection[]
  gateways?: Gateway[]
  dnsConfigs?: DnsConfig[]
  services?: ServicePath[]
}>(), {
  gateways: () => [],
  dnsConfigs: () => [],
  services: () => [],
})

type Tone = 'ready' | 'pending' | 'error'
interface MapNode {
  id: string
  category: 'gateway' | 'connectivity' | 'dns'
  categoryLabel: string
  name: string
  sub: string
  tone: Tone
  statusLabel: string
  x: number
  y: number
}

const showAll = ref(false)
const selectedId = ref<string | null>(null)

// ── Canvas geometry (fixed coordinate space) ──────────────────────────────────
const W = 860
const H = 560
const center = { x: W / 2, y: H / 2 }
const RX = 300
const RY = 205

const connTone = (status: Connection['status']): Tone => {
  if (status === 'ready') return 'ready'
  if (status === 'error') return 'error'
  if (status === 'pending-user-action' || status === 'pending-acceptance') return 'pending'
  return 'pending'
}
const dnsTone = (status: DnsConfig['status']): Tone =>
  status === 'error' ? 'error' : status === 'pending' ? 'pending' : 'ready'

const dnsTypeLabel = (t: DnsConfig['type']) => t === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const dnsStatusLabel = (s: DnsConfig['status']) => s === 'error' ? 'Not resolving' : s === 'pending' ? 'Pending' : 'Resolving'

// Unified, position-less node list across the three categories.
const allNodes = computed<Omit<MapNode, 'x' | 'y'>[]>(() => {
  const gw = props.gateways.map(g => ({
    id: `gw-${g.id}`,
    category: 'gateway' as const,
    categoryLabel: 'Gateway',
    name: g.name,
    sub: 'Dedicated Cloud Gateway',
    tone: 'ready' as Tone,
    statusLabel: 'Ready',
  }))
  const conns = props.connections.map(c => ({
    id: `conn-${c.id}`,
    category: 'connectivity' as const,
    categoryLabel: 'Connectivity',
    name: c.name,
    sub: connectionTypeLabel(c.type),
    tone: connTone(c.status),
    statusLabel: connStatusLabel(c.status),
  }))
  const dns = props.dnsConfigs.map(d => ({
    id: `dns-${d.id}`,
    category: 'dns' as const,
    categoryLabel: 'Private DNS',
    name: d.name,
    sub: dnsTypeLabel(d.type),
    tone: dnsTone(d.status),
    statusLabel: dnsStatusLabel(d.status),
  }))
  return [...conns, ...dns, ...gw]
})

const problemNodes = computed(() => allNodes.value.filter(n => n.tone !== 'ready'))
const healthyNodes = computed(() => allNodes.value.filter(n => n.tone === 'ready'))

// Place the visible nodes radially around the network.
const visibleNodes = computed<MapNode[]>(() => {
  const base = showAll.value ? allNodes.value : problemNodes.value
  const n = base.length
  return base.map((node, i) => {
    // Distribute around the full circle, starting at the top.
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1)
    return {
      ...node,
      x: center.x + RX * Math.cos(angle),
      y: center.y + RY * Math.sin(angle),
    }
  })
})

const selected = computed(() => visibleNodes.value.find(n => n.id === selectedId.value) || null)

const nodeStyle = (x: number, y: number) => ({ left: `${x}px`, top: `${y}px` })

// ── Network status ────────────────────────────────────────────────────────────
const netStatusLabel = computed(() =>
  props.network.status === 'ready' ? 'Ready'
    : props.network.status === 'initialising' ? 'Initializing'
      : props.network.status === 'error' ? 'Error' : props.network.status,
)
const netStatusAppearance = computed(() =>
  props.network.status === 'ready' ? 'success'
    : props.network.status === 'error' ? 'danger' : 'warning',
)
const toneAppearance = (tone: Tone) => tone === 'ready' ? 'success' : tone === 'error' ? 'danger' : 'warning'

// ── Detail panel content ──────────────────────────────────────────────────────
const detailFacts = computed<{ label: string; value: string }[]>(() => {
  if (!selected.value) {
    const problems = problemNodes.value.length
    return [
      { label: 'Provider', value: props.network.cloud.toUpperCase() },
      { label: 'Region', value: props.network.regions[0].region },
      { label: 'CIDR', value: props.network.regions[0].cidr },
      { label: 'Zones', value: (props.network.regions[0].zones ?? []).join(', ') || '—' },
      { label: 'Used by', value: `${props.gateways.length} gateway${props.gateways.length === 1 ? '' : 's'}` },
      { label: 'Connectivity', value: `${props.connections.length} resource${props.connections.length === 1 ? '' : 's'}` },
      { label: 'Private DNS', value: `${props.dnsConfigs.length} configuration${props.dnsConfigs.length === 1 ? '' : 's'}` },
      { label: 'Needs attention', value: problems ? `${problems} relationship${problems === 1 ? '' : 's'}` : 'None' },
    ]
  }
  const n = selected.value
  const facts = [{ label: 'Type', value: n.sub }, { label: 'Status', value: n.statusLabel }]
  if (n.category === 'connectivity') {
    const c = props.connections.find(x => `conn-${x.id}` === n.id)
    if (c?.peerVpcId) facts.push({ label: 'Customer VPC', value: c.peerVpcId })
    if (c?.setupValues?.ramShareArn) facts.push({ label: 'RAM share', value: c.setupValues.ramShareArn })
  }
  if (n.category === 'dns') {
    const d = props.dnsConfigs.find(x => `dns-${x.id}` === n.id)
    if (d?.usedFor) facts.push({ label: 'Used for', value: d.usedFor })
    if (d?.resolverDetails) facts.push({ label: 'Resolver', value: d.resolverDetails })
  }
  return facts
})

const detailAction = computed<string | null>(() => {
  if (!selected.value || selected.value.tone === 'ready') return null
  const n = selected.value
  if (n.category === 'connectivity') {
    const c = props.connections.find(x => `conn-${x.id}` === n.id)
    return c ? nextActionText(c) : null
  }
  if (n.category === 'dns') {
    return n.tone === 'error'
      ? 'The resolver is unreachable. Check the outbound resolver configuration and the target it points to.'
      : 'Resolution is still propagating. No action needed unless it stays pending.'
  }
  return null
})
const detailActionTone = computed(() => selected.value?.tone ?? 'ready')

// ── Path trace (from a gateway service) ───────────────────────────────────────
const tracedId = ref<string | null>(null)
const tracedService = computed(() => props.services.find(s => s.id === tracedId.value) || null)

const targetTone = (s: ServicePath['target']['status']): Tone =>
  s === 'reachable' ? 'ready' : s === 'unreachable' ? 'error' : 'pending'
const worstTone = (tones: Tone[]): Tone =>
  tones.includes('error') ? 'error' : tones.includes('pending') ? 'pending' : 'ready'

// Health of a whole service path (worst hop) — drives the picker chip dot.
const servicePathTone = (s: ServicePath): Tone => {
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  const conn = props.connections.find(c => c.id === s.connectionId)
  return worstTone([
    dns ? dnsTone(dns.status) : 'error',
    conn ? connTone(conn.status) : 'error',
    targetTone(s.target.status),
  ])
}

interface TraceHop {
  key: string
  kicker: string
  title: string
  sub: string
  tone: Tone
  status: string
}
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
    { key: 'target', kicker: 'Private target', title: s.target.name, sub: s.target.address, tone: targetTone(s.target.status), status: s.target.status === 'reachable' ? 'Reachable' : s.target.status === 'unreachable' ? 'Unreachable' : 'Pending' },
  ]
})

// First hop that isn't healthy — where the path breaks.
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

.ncm-caption {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  margin: $kui-space-0;

  .ncm-caption-dim { color: $kui-color-text-neutral; }
}

.ncm-body {
  display: grid;
  gap: $kui-space-70;
  grid-template-columns: minmax(0, 1fr) minmax(0, 320px);

  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ncm-scroll {
  overflow-x: auto;
}

.ncm-canvas {
  background-color: $kui-color-background-neutral-weakest;
  background-image: radial-gradient($kui-color-border 1px, transparent 1px);
  background-size: 22px 22px;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  height: 560px;
  position: relative;
  width: 860px;
}

.ncm-edges {
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.ncm-edge {
  stroke-width: 2px;

  &--ready { stroke: $kui-color-text-success; }
  &--pending { stroke: $kui-color-text-warning; }
  &--error { stroke: $kui-color-text-danger; }
  &--dashed { stroke-dasharray: 5 4; }
}

.ncm-node {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  padding: $kui-space-50;
  position: absolute;
  text-align: left;
  transform: translate(-50%, -50%);
  transition: border-color 0.12s ease-in, box-shadow 0.12s ease-in;
  width: 210px;
  z-index: 1;

  &:hover { box-shadow: $kui-shadow; }
  &--selected { border-color: $kui-color-border-primary; box-shadow: $kui-shadow-focus; }

  // Left accent by health
  &--pending { border-left: $kui-border-width-30 solid $kui-color-background-warning; }
  &--error { border-left: $kui-border-width-30 solid $kui-color-background-danger; }

  &--network {
    align-items: center;
    background-color: $kui-color-background-primary-weakest;
    border-color: $kui-color-border-primary;
    text-align: center;
    width: 230px;
    z-index: 2;
  }
}

.ncm-node-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.ncm-node-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ncm-node-title {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  overflow-wrap: anywhere;
}

.ncm-node-sub {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.ncm-node-zones {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
}

.ncm-node-status {
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;

  &--pending { color: $kui-color-text-warning; }
  &--error { color: $kui-color-text-danger; }
  &--ready { color: $kui-color-text-success; }
}

.ncm-dot {
  border-radius: $kui-border-radius-circle;
  flex-shrink: 0;
  height: 8px;
  width: 8px;

  &--ready { background-color: $kui-color-text-success; }
  &--pending { background-color: $kui-color-text-warning; }
  &--error { background-color: $kui-color-text-danger; }
}

// ── Detail panel ──────────────────────────────────────────────────────────────
.ncm-detail {
  align-self: start;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
  padding: $kui-space-70;
}

.ncm-detail-head {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.ncm-detail-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ncm-detail-title {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
  margin: $kui-space-0;
  overflow-wrap: anywhere;
}

.ncm-detail-facts {
  display: grid;
  gap: $kui-space-30 $kui-space-50;
  grid-template-columns: auto 1fr;
  margin: $kui-space-0;

  dt { color: $kui-color-text-neutral; font-size: $kui-font-size-30; }
  dd {
    color: $kui-color-text;
    font-size: $kui-font-size-30;
    margin: $kui-space-0;
    overflow-wrap: anywhere;
    text-align: right;
  }
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

// ── Legend ──────────────────────────────────────────────────────────────────
.ncm-legendbar {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  flex-wrap: wrap;
  font-size: $kui-font-size-20;
  gap: $kui-space-60;
}

.ncm-legend-item {
  align-items: center;
  display: flex;
  gap: $kui-space-30;

  &--dim { color: $kui-color-text-neutral-weak; }
}

.ncm-legend-sep {
  background-color: $kui-color-border;
  height: 14px;
  width: $kui-border-width-10;
}

// ── Trace picker ──────────────────────────────────────────────────────────────
.ncm-trace-picker {
  align-items: center;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40 $kui-space-50;
  padding-bottom: $kui-space-60;
}

.ncm-trace-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
}

.ncm-trace-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-40;
}

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

.ncm-trace-clear {
  background: none;
  border: none;
  color: $kui-color-text-primary;
  cursor: pointer;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  padding: $kui-space-30 $kui-space-40;
}

// ── Trace view (one path, left to right) ──────────────────────────────────────
.ncm-trace {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

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

.ncm-hop-title {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  overflow-wrap: anywhere;
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
</style>
