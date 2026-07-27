<template>
  <div class="ncm">
    <!-- ── Toolbar ─────────────────────────────────────────────────────────── -->
    <div class="ncm-toolbar">
      <p v-if="mode === 'map'" class="ncm-caption">
        <template v-if="problemNodes.length">
          {{ problemNodes.length }} relationship{{ problemNodes.length === 1 ? '' : 's' }} need{{ problemNodes.length === 1 ? 's' : '' }} attention.
        </template>
        <template v-else>Everything is healthy.</template>
        <span v-if="healthyNodes.length" class="ncm-caption-dim">
          {{ healthyNodes.length }} healthy relationship{{ healthyNodes.length === 1 ? '' : 's' }} hidden.
        </span>
      </p>
      <p v-else class="ncm-caption">Follow one service's path end to end to see where it breaks.</p>

      <div class="ncm-toolbar-actions">
        <KButton
          v-if="mode === 'map' && healthyNodes.length"
          appearance="tertiary"
          size="small"
          data-testid="ncm-show-all"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Show problems only' : `Show all (${healthyNodes.length})` }}
        </KButton>
        <KButton
          v-if="mode === 'map' && services.length"
          appearance="tertiary"
          size="small"
          data-testid="ncm-trace-mode"
          @click="enterTrace"
        >
          <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
          Trace a path
        </KButton>
        <KButton
          v-if="mode === 'trace'"
          appearance="tertiary"
          size="small"
          data-testid="ncm-back-to-map"
          @click="exitTrace"
        >
          Back to map
        </KButton>
      </div>
    </div>

    <!-- ── MAP MODE: entity-relationship diagram ───────────────────────────── -->
    <template v-if="mode === 'map'">
      <div class="ncm-body">
        <div class="dtree" data-testid="ncm-tree">
          <!-- Root: the network (its resources depend on it as their container) -->
          <button
            type="button"
            class="dt-root"
            :class="{ 'dt-selected': selectedId === null }"
            data-testid="ncm-network"
            @click="selectedId = null"
          >
            <span class="dt-caret">▾</span>
            <span class="dt-root-kicker">Network</span>
            <span class="dt-root-name">{{ network.name }}</span>
            <span class="dt-root-meta">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }} · {{ network.regions[0].cidr }}</span>
            <KBadge :appearance="netStatusAppearance">{{ netStatusLabel }}</KBadge>
          </button>

          <div class="dt-branch">
            <template v-for="g in visibleGroups" :key="g.key">
              <button type="button" class="dt-group" @click="toggleGroup(g.key)">
                <span class="dt-caret">{{ openGroups[g.key] ? '▾' : '▸' }}</span>
                <span class="dt-group-label">{{ g.label }}</span>
                <span class="dt-count">{{ g.items.length }}</span>
                <span v-if="groupAttention(g)" class="dt-att">{{ groupAttention(g) }} need attention</span>
              </button>

              <template v-if="openGroups[g.key]">
                <div v-for="it in g.items" :key="it.id" class="dt-item-wrap">
                  <button
                    type="button"
                    class="dt-item"
                    :class="{ 'dt-selected': selectedId === it.id }"
                    :data-testid="`ncm-tree-${it.id}`"
                    @click="selectedId = it.id"
                  >
                    <span class="dt-line">└─</span>
                    <span class="dt-item-name">{{ it.name }}</span>
                    <span class="dt-tag" :class="`dt-tag--${it.tone}`">{{ it.statusLabel }}</span>
                  </button>
                  <div v-if="it.sub" class="dt-sub">
                    <span class="dt-line dt-line--deep">└─</span>
                    <span class="dt-sub-text" :class="`dt-status--${it.sub.tone}`">{{ it.sub.text }}</span>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Detail panel for the selected entity -->
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

      <div class="ncm-legendbar">
        <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--ready" />Healthy</span>
        <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--pending" />Pending / needs action</span>
        <span class="ncm-legend-item"><span class="ncm-dot ncm-dot--error" />Error</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KBadge, KButton } from '@kong/kongponents'
import { ArrowRightIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
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
  // Prototype-only "by direction" variant: split the connectivity branch into
  // Client → Kong / Kong → upstream / Bidirectional sub-branches.
  directional?: boolean
}>(), {
  gateways: () => [],
  dnsConfigs: () => [],
  services: () => [],
  directional: false,
})

type Tone = 'ready' | 'pending' | 'error'
type Category = 'gateway' | 'connectivity' | 'dns'
interface ErdNode {
  id: string
  category: Category
  categoryLabel: string
  name: string
  sub: string
  tone: Tone
  statusLabel: string
}

const mode = ref<'map' | 'trace'>('map')
const showAll = ref(false)
const selectedId = ref<string | null>(null)

const connTone = (status: Connection['status']): Tone =>
  status === 'ready' ? 'ready' : status === 'error' ? 'error' : 'pending'
const dnsTone = (status: DnsConfig['status']): Tone =>
  status === 'error' ? 'error' : status === 'pending' ? 'pending' : 'ready'
const dnsTypeLabel = (t: DnsConfig['type']) => t === 'outbound-resolver' ? 'Outbound resolver' : 'Private hosted zone'
const dnsStatusLabel = (s: DnsConfig['status']) => s === 'error' ? 'Not resolving' : s === 'pending' ? 'Pending' : 'Resolving'

// Entities related to the network, across the three categories.
const allNodes = computed<ErdNode[]>(() => {
  const conns = props.connections.map(c => ({
    id: `conn-${c.id}`, category: 'connectivity' as const, categoryLabel: 'Connectivity',
    name: c.name, sub: connectionTypeLabel(c.type), tone: connTone(c.status), statusLabel: connStatusLabel(c.status),
  }))
  const dns = props.dnsConfigs.map(d => ({
    id: `dns-${d.id}`, category: 'dns' as const, categoryLabel: 'Private DNS',
    name: d.name, sub: dnsTypeLabel(d.type), tone: dnsTone(d.status), statusLabel: dnsStatusLabel(d.status),
  }))
  const gw = props.gateways.map(g => ({
    id: `gw-${g.id}`, category: 'gateway' as const, categoryLabel: 'Gateway',
    name: g.name, sub: 'Dedicated Cloud Gateway', tone: 'ready' as Tone, statusLabel: 'Ready',
  }))
  return [...conns, ...dns, ...gw]
})

const problemNodes = computed(() => allNodes.value.filter(n => n.tone !== 'ready'))
const healthyNodes = computed(() => allNodes.value.filter(n => n.tone === 'ready'))

// ── Dependency tree ───────────────────────────────────────────────────────────
// Network contains its resources; a DNS record expands into the connection it
// resolves through and the target it reaches — the dependency between resources.
const targetToneOf = (s: 'reachable' | 'unreachable' | 'pending'): Tone =>
  s === 'reachable' ? 'ready' : s === 'unreachable' ? 'error' : 'pending'
const connById = (id: string) => props.connections.find(c => c.id === id)

interface TreeItem {
  id: string
  name: string
  statusLabel: string
  tone: Tone
  sub?: { text: string; tone: Tone }
}
interface TreeGroup { key: string; label: string; items: TreeItem[] }

// One connectivity connection → a tree item (with its "reaches {target}" sub-line).
const connectivityItemFor = (c: Connection): TreeItem => {
  const svc = props.services.find(s => s.connectionId === c.id)
  return {
    id: `conn-${c.id}`, name: c.name, statusLabel: connStatusLabel(c.status), tone: connTone(c.status),
    sub: svc ? { text: `reaches ${svc.target.name}`, tone: targetToneOf(svc.target.status) } : undefined,
  }
}

const openGroups = ref<Record<string, boolean>>({
  gateways: true, connectivity: true, dns: true,
  'conn-client-to-kong': true, 'conn-kong-to-upstream': true, 'conn-bidirectional': true,
})
const toggleGroup = (k: string) => { openGroups.value[k] = !openGroups.value[k] }

const allGroups = computed<TreeGroup[]>(() => {
  const gateways: TreeItem[] = props.gateways.map(g => ({
    id: `gw-${g.id}`, name: g.name, statusLabel: 'Ready', tone: 'ready',
  }))
  const connectivity: TreeItem[] = props.connections.map(connectivityItemFor)
  const dns: TreeItem[] = props.dnsConfigs.map(d => {
    const svc = props.services.find(s => s.dnsConfigId === d.id)
    const conn = svc ? connById(svc.connectionId) : undefined
    return {
      id: `dns-${d.id}`, name: d.name, statusLabel: dnsStatusLabel(d.status), tone: dnsTone(d.status),
      sub: svc && conn ? { text: `via ${conn.name} → ${svc.target.name}`, tone: targetToneOf(svc.target.status) } : undefined,
    }
  })

  // Directional variant: split the single connectivity branch into per-direction
  // sub-branches (empty directions are dropped). Peering is bidirectional; resource
  // endpoints are one-way, so the tree makes the flow explicit.
  const connectivityGroups: TreeGroup[] = props.directional
    ? (['client-to-kong', 'kong-to-upstream', 'bidirectional'] as DirectionCategory[])
        .map(cat => ({
          key: `conn-${cat}`,
          label: `Private connectivity · ${directionCategoryLabel[cat]}`,
          items: props.connections
            .filter(c => directionCategory(c) === cat)
            .map(c => connectivityItemFor(c)),
        }))
        .filter(g => g.items.length > 0)
    : [{ key: 'connectivity', label: 'Private connectivity', items: connectivity }]

  return [
    { key: 'gateways', label: 'Gateways', items: gateways },
    ...connectivityGroups,
    { key: 'dns', label: 'Private DNS', items: dns },
  ]
})

// Problems-first: an item shows when itself or its dependency isn't healthy.
const itemNeedsAttention = (it: TreeItem) => it.tone !== 'ready' || (!!it.sub && it.sub.tone !== 'ready')
const visibleGroups = computed<TreeGroup[]>(() =>
  allGroups.value
    .map(g => ({ ...g, items: showAll.value ? g.items : g.items.filter(itemNeedsAttention) }))
    .filter(g => g.items.length > 0),
)
const groupAttention = (g: TreeGroup) => g.items.filter(itemNeedsAttention).length

const selected = computed(() => allNodes.value.find(n => n.id === selectedId.value) || null)

// ── Network status ────────────────────────────────────────────────────────────
const netStatusLabel = computed(() =>
  props.network.status === 'ready' ? 'Ready'
    : props.network.status === 'initialising' ? 'Initializing'
      : props.network.status === 'error' ? 'Error' : props.network.status,
)
const netStatusAppearance = computed(() =>
  props.network.status === 'ready' ? 'success' : props.network.status === 'error' ? 'danger' : 'warning',
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
    // Show the DNS → connection relationship when present.
    if (d?.relatedConnectionId) {
      const rel = props.connections.find(c => c.id === d.relatedConnectionId)
      if (rel) facts.push({ label: 'Resolves via', value: rel.name })
    }
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

// ── Path trace (separate mode) ────────────────────────────────────────────────
const tracedId = ref<string | null>(null)
const tracedService = computed(() => props.services.find(s => s.id === tracedId.value) || null)

const enterTrace = () => { mode.value = 'trace'; tracedId.value = props.services[0]?.id ?? null }
const exitTrace = () => { mode.value = 'map'; tracedId.value = null }

const targetTone = (s: ServicePath['target']['status']): Tone =>
  s === 'reachable' ? 'ready' : s === 'unreachable' ? 'error' : 'pending'
const worstTone = (tones: Tone[]): Tone =>
  tones.includes('error') ? 'error' : tones.includes('pending') ? 'pending' : 'ready'

const servicePathTone = (s: ServicePath): Tone => {
  const dns = props.dnsConfigs.find(d => d.id === s.dnsConfigId)
  const conn = props.connections.find(c => c.id === s.connectionId)
  return worstTone([
    dns ? dnsTone(dns.status) : 'error',
    conn ? connTone(conn.status) : 'error',
    targetTone(s.target.status),
  ])
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
    { key: 'target', kicker: 'Private target', title: s.target.name, sub: s.target.address, tone: targetTone(s.target.status), status: s.target.status === 'reachable' ? 'Reachable' : s.target.status === 'unreachable' ? 'Unreachable' : 'Pending' },
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

.ncm-scroll { overflow-x: auto; }

// ── Dependency tree ────────────────────────────────────────────────────────────
.dtree {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dt-root {
  align-items: center;
  background-color: $kui-color-background-primary-weakest;
  border: none;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  cursor: pointer;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-50 $kui-space-60;
  text-align: left;
  width: 100%;

  &.dt-selected { box-shadow: inset $kui-space-20 0 0 0 $kui-color-border-primary; }
}

.dt-root-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dt-root-name { color: $kui-color-text; font-size: $kui-font-size-40; font-weight: $kui-font-weight-bold; }
.dt-root-meta { color: $kui-color-text-neutral; font-size: $kui-font-size-20; margin-right: auto; }

.dt-caret { color: $kui-color-text-neutral; flex: 0 0 auto; font-size: $kui-font-size-20; width: 12px; }

.dt-branch { display: flex; flex-direction: column; padding: $kui-space-40 $kui-space-0; }

.dt-group {
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-40 $kui-space-60;
  text-align: left;
  width: 100%;

  &:hover { background-color: $kui-color-background-neutral-weakest; }
}
.dt-group-label { color: $kui-color-text; font-size: $kui-font-size-30; font-weight: $kui-font-weight-semibold; }
.dt-count {
  background-color: $kui-color-background-neutral-weak;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  padding: 0 $kui-space-30;
}
.dt-att { color: $kui-color-text-warning; font-size: $kui-font-size-20; font-weight: $kui-font-weight-semibold; }

.dt-item-wrap { display: flex; flex-direction: column; }

.dt-item {
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-30 $kui-space-60 $kui-space-30 $kui-space-90;
  text-align: left;
  width: 100%;

  &:hover { background-color: $kui-color-background-neutral-weakest; }
  &.dt-selected { background-color: $kui-color-background-primary-weakest; box-shadow: inset $kui-space-20 0 0 0 $kui-color-border-primary; }
}
.dt-line { color: $kui-color-text-neutral-weak; font-family: $kui-font-family-code; flex: 0 0 auto; }
.dt-line--deep { padding-left: $kui-space-70; }
.dt-item-name { color: $kui-color-text; font-size: $kui-font-size-30; overflow-wrap: anywhere; }

.dt-tag {
  border-radius: $kui-border-radius-20;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  margin-left: auto;
  padding: $kui-space-10 $kui-space-30;

  &--ready { background-color: $kui-color-background-success-weakest; color: $kui-color-text-success; }
  &--pending { background-color: $kui-color-background-warning-weakest; color: $kui-color-text-warning; }
  &--error { background-color: $kui-color-background-danger-weakest; color: $kui-color-text-danger; }
}

.dt-sub {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  gap: $kui-space-40;
  padding: $kui-space-20 $kui-space-60 $kui-space-30 $kui-space-90;
}
.dt-sub-text { font-size: $kui-font-size-20; }

.dt-status--ready { color: $kui-color-text-success; }
.dt-status--pending { color: $kui-color-text-warning; }
.dt-status--error { color: $kui-color-text-danger; }

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

.ncm-detail-head { display: flex; flex-direction: column; gap: $kui-space-20; }

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
