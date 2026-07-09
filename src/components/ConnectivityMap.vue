<template>
  <div class="cmap">
    <!-- Link layer (SVG) sits behind the node cards -->
    <svg
      class="cmap-links"
      :viewBox="`0 0 ${size.w} ${size.h}`"
      :width="size.w"
      :height="size.h"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="cmap-arrow-end"
          markerWidth="7"
          markerHeight="7"
          refX="5.5"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L6,3 L0,6 z" fill="context-stroke" />
        </marker>
        <marker
          id="cmap-arrow-start"
          markerWidth="7"
          markerHeight="7"
          refX="0.5"
          refY="3"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L6,3 L0,6 z" fill="context-stroke" />
        </marker>
      </defs>
      <path
        v-for="link in links"
        :key="link.id"
        :d="link.d"
        class="cmap-link"
        :class="`cmap-link--${link.tone}`"
        fill="none"
        marker-end="url(#cmap-arrow-end)"
        :marker-start="link.bidirectional ? 'url(#cmap-arrow-start)' : undefined"
      />
    </svg>

    <!-- Column headers -->
    <div class="cmap-headers">
      <span class="cmap-header">Customer clients / VPCs</span>
      <span class="cmap-header cmap-header--center">Kong network</span>
      <span class="cmap-header cmap-header--right">Customer upstreams</span>
    </div>

    <!-- Node grid -->
    <div class="cmap-grid">
      <!-- Left: ingress + bidirectional (customer side) -->
      <div class="cmap-col cmap-col--left">
        <button
          v-for="conn in leftConnections"
          :key="conn.id"
          :ref="el => setNodeRef(conn.id, el)"
          type="button"
          class="cmap-node"
          :class="{ 'cmap-node--muted': conn.status === 'initialising' || conn.status === 'created' }"
          :data-testid="`cmap-node-${conn.id}`"
          @click="$emit('select', conn.id)"
        >
          <div class="cmap-node-head">
            <span class="cmap-node-name">{{ conn.name }}</span>
            <KBadge :appearance="statusBadgeAppearance(conn.status)">{{ statusLabel(conn.status) }}</KBadge>
          </div>
          <div class="cmap-node-meta">{{ connectionTypeLabel(conn.type) }}</div>
          <div class="cmap-node-tags">
            <span class="cmap-tag">{{ directionLabel(conn) }}</span>
            <span class="cmap-tag cmap-tag--dim">{{ scopeLabel(conn) }}</span>
          </div>
          <div class="cmap-node-tags">
            <span class="cmap-tag cmap-tag--dim">{{ consumersLabel(conn) }}</span>
          </div>
          <div
            v-if="conn.status !== 'ready'"
            class="cmap-node-action"
            :class="`cmap-node-action--${statusTone(conn.status)}`"
          >
            {{ nextActionText(conn) }}
          </div>
        </button>
        <span
          v-if="leftConnections.length === 0"
          class="cmap-empty"
        >No inbound or peered connections</span>
      </div>

      <!-- Center: the network -->
      <div class="cmap-col cmap-col--center">
        <div
          ref="networkRef"
          class="cmap-network"
          data-testid="cmap-network"
        >
          <span class="cmap-network-name">{{ network.name }}</span>
          <span class="cmap-network-sub">{{ network.cloud.toUpperCase() }} · {{ network.regions[0].region }}</span>
          <span class="cmap-network-cidr">{{ network.regions[0].cidr }}</span>
          <KBadge :appearance="networkBadge(network.status)">{{ network.status }}</KBadge>
          <span class="cmap-network-count">{{ connections.length }} {{ connections.length === 1 ? 'connection' : 'connections' }}</span>
        </div>
      </div>

      <!-- Right: egress (upstream side) -->
      <div class="cmap-col cmap-col--right">
        <button
          v-for="conn in egressConnections"
          :key="conn.id"
          :ref="el => setNodeRef(conn.id, el)"
          type="button"
          class="cmap-node"
          :class="{ 'cmap-node--muted': conn.status === 'initialising' || conn.status === 'created' }"
          :data-testid="`cmap-node-${conn.id}`"
          @click="$emit('select', conn.id)"
        >
          <div class="cmap-node-head">
            <span class="cmap-node-name">{{ conn.name }}</span>
            <KBadge :appearance="statusBadgeAppearance(conn.status)">{{ statusLabel(conn.status) }}</KBadge>
          </div>
          <div class="cmap-node-meta">{{ connectionTypeLabel(conn.type) }}</div>
          <div class="cmap-node-tags">
            <span class="cmap-tag">{{ directionLabel(conn) }}</span>
            <span class="cmap-tag cmap-tag--dim">{{ scopeLabel(conn) }}</span>
          </div>
          <div
            v-if="conn.status !== 'ready'"
            class="cmap-node-action"
            :class="`cmap-node-action--${statusTone(conn.status)}`"
          >
            {{ nextActionText(conn) }}
          </div>
        </button>
        <span
          v-if="egressConnections.length === 0"
          class="cmap-empty"
        >No outbound connections</span>
      </div>
    </div>

    <!-- Legend -->
    <div class="cmap-legend">
      <span class="cmap-legend-item"><span class="cmap-swatch cmap-swatch--ready" />Ready</span>
      <span class="cmap-legend-item"><span class="cmap-swatch cmap-swatch--warning" />Pending customer action</span>
      <span class="cmap-legend-item"><span class="cmap-swatch cmap-swatch--danger" />Error</span>
      <span class="cmap-legend-item"><span class="cmap-swatch cmap-swatch--neutral" />Creating</span>
      <span class="cmap-legend-sep" />
      <span class="cmap-legend-item cmap-legend-item--dim">→ one-directional · ↔ bidirectional</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, onBeforeUpdate, nextTick, watch } from 'vue'
import { KBadge } from '@kong/kongponents'
import type { Network, Connection, ConnectionStatus } from '@/types'
import {
  connectionTypeLabel,
  directionLabel,
  scopeLabel,
  statusLabel,
  statusBadgeAppearance,
  nextActionText,
  directionOf,
} from '@/utils/connectionDisplay'

const props = defineProps<{
  network: Network
  connections: Connection[]
}>()

defineEmits<{ (e: 'select', id: string): void }>()

// A connection is "bidirectional" when it's a peering-family resource.
const isBidirectional = (conn: Connection) => conn.family === 'peering'
const effectiveDirection = (conn: Connection) =>
  isBidirectional(conn) ? 'bidirectional' : directionOf(conn.type)

// Left column: everything that terminates at the network from the customer side
// — ingress endpoints and bidirectional peering. Right column: egress only.
const leftConnections = computed(() =>
  props.connections.filter(c => effectiveDirection(c) !== 'egress'),
)
const egressConnections = computed(() =>
  props.connections.filter(c => effectiveDirection(c) === 'egress' && !isBidirectional(c)),
)

const consumersLabel = (conn: Connection) => {
  const n = conn.allowedConsumers?.length ?? 0
  if (n === 0) return 'No allowed accounts'
  return `${n} ${n === 1 ? 'account' : 'accounts'} allowed`
}

const statusTone = (status: ConnectionStatus) => {
  if (status === 'ready') return 'ready'
  if (status === 'error') return 'danger'
  if (status === 'pending-user-action' || status === 'pending-acceptance') return 'warning'
  return 'neutral'
}

const networkBadge = (status: string) =>
  status === 'ready' ? 'success' : status === 'initialising' ? 'warning' : status === 'error' ? 'danger' : 'neutral'

// ── Link geometry (HTML node anchors → SVG bezier paths) ──────────────────────
const nodeEls = new Map<string, HTMLElement>()
const networkRef = ref<HTMLElement | null>(null)
const size = reactive({ w: 0, h: 0 })
const links = ref<{ id: string; d: string; tone: string; bidirectional: boolean }[]>([])

// Vue calls ref-functions before each update with stale nodes; clear first.
onBeforeUpdate(() => nodeEls.clear())
const setNodeRef = (id: string, el: unknown) => {
  if (el) nodeEls.set(id, el as HTMLElement)
}

let root: HTMLElement | null = null
let ro: ResizeObserver | null = null

const computeLinks = () => {
  if (!root) return
  const base = root.getBoundingClientRect()
  size.w = base.width
  size.h = base.height
  const net = networkRef.value?.getBoundingClientRect()
  if (!net) { links.value = []; return }
  const netLeft = { x: net.left - base.left, y: net.top - base.top + net.height / 2 }
  const netRight = { x: net.right - base.left, y: net.top - base.top + net.height / 2 }

  const out: { id: string; d: string; tone: string; bidirectional: boolean }[] = []

  const bezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.max(40, Math.abs(x2 - x1) / 2)
    return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
  }

  for (const conn of leftConnections.value) {
    const el = nodeEls.get(conn.id)
    if (!el) continue
    const r = el.getBoundingClientRect()
    const start = { x: r.right - base.left, y: r.top - base.top + r.height / 2 }
    out.push({
      id: conn.id,
      d: bezier(start.x, start.y, netLeft.x, netLeft.y),
      tone: statusTone(conn.status),
      bidirectional: isBidirectional(conn),
    })
  }
  for (const conn of egressConnections.value) {
    const el = nodeEls.get(conn.id)
    if (!el) continue
    const r = el.getBoundingClientRect()
    const end = { x: r.left - base.left, y: r.top - base.top + r.height / 2 }
    out.push({
      id: conn.id,
      d: bezier(netRight.x, netRight.y, end.x, end.y),
      tone: statusTone(conn.status),
      bidirectional: false,
    })
  }
  links.value = out
}

const scheduleCompute = () => nextTick().then(computeLinks)

onMounted(() => {
  root = (document.querySelector('.cmap') as HTMLElement) || null
  scheduleCompute()
  ro = new ResizeObserver(() => computeLinks())
  if (root) ro.observe(root)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => props.connections.map(c => c.id + c.status).join(','), scheduleCompute)
</script>

<style scoped lang="scss">
.cmap {
  position: relative;
  padding: $kui-space-40 $kui-space-0 $kui-space-0;
}

.cmap-links {
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 0;
}

.cmap-link {
  stroke-width: 2px;
  opacity: 0.85;

  &--ready { stroke: var(--kui-color-text-success, #14b8a6); }
  &--warning { stroke: var(--kui-color-text-warning, #b26b00); }
  &--danger { stroke: var(--kui-color-text-danger, #d60a53); }
  &--neutral { stroke: var(--kui-color-text-neutral, #6b7280); }
}

.cmap-headers,
.cmap-grid {
  display: grid;
  grid-template-columns: 1fr minmax(180px, 0.8fr) 1fr;
  gap: $kui-space-100;
}

.cmap-headers {
  margin-bottom: $kui-space-50;
}

.cmap-header {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--center { text-align: center; }
  &--right { text-align: right; }
}

.cmap-grid {
  position: relative;
  z-index: 1;
}

.cmap-col {
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;

  &--center { justify-content: center; }
  &--right { align-items: flex-end; }
}

.cmap-node {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  padding: $kui-space-50 $kui-space-60;
  text-align: left;
  transition: border-color 0.15s ease-in, box-shadow 0.15s ease-in;
  width: 100%;

  &:hover {
    border-color: $kui-color-border-primary;
    box-shadow: $kui-shadow;
  }

  &--muted { opacity: 0.7; }
}

.cmap-node-head {
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-20 $kui-space-40;
  justify-content: space-between;
}

.cmap-node-name {
  color: $kui-color-text;
  flex: 1 1 auto;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  min-width: 60%;
}

.cmap-node-meta {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.cmap-node-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-30;
}

.cmap-tag {
  color: $kui-color-text-neutral-strong;
  font-size: $kui-font-size-20;

  &--dim { color: $kui-color-text-neutral; }
}

.cmap-node-action {
  font-size: $kui-font-size-20;
  margin-top: $kui-space-20;

  &--warning { color: $kui-color-text-warning; }
  &--danger { color: $kui-color-text-danger; }
  &--neutral { color: $kui-color-text-neutral; }
}

.cmap-network {
  align-items: center;
  background-color: $kui-color-background-neutral-weakest;
  border: $kui-border-width-20 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  padding: $kui-space-60;
  text-align: center;
}

.cmap-network-name {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
}

.cmap-network-sub {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
}

.cmap-network-cidr {
  color: $kui-color-text-neutral;
  font-family: monospace;
  font-size: $kui-font-size-20;
}

.cmap-network-count {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  margin-top: $kui-space-20;
}

.cmap-empty {
  color: $kui-color-text-neutral-weak;
  font-size: $kui-font-size-20;
  font-style: italic;
}

.cmap-legend {
  align-items: center;
  border-top: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-60;
  margin-top: $kui-space-80;
  padding-top: $kui-space-50;
}

.cmap-legend-item {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  font-size: $kui-font-size-20;
  gap: $kui-space-30;

  &--dim { color: $kui-color-text-neutral-weak; }
}

.cmap-swatch {
  border-radius: $kui-border-radius-round;
  height: 10px;
  width: 10px;

  &--ready { background-color: var(--kui-color-text-success, #14b8a6); }
  &--warning { background-color: var(--kui-color-text-warning, #b26b00); }
  &--danger { background-color: var(--kui-color-text-danger, #d60a53); }
  &--neutral { background-color: var(--kui-color-text-neutral, #6b7280); }
}

.cmap-legend-sep {
  background-color: $kui-color-border;
  height: 14px;
  width: $kui-border-width-10;
}
</style>
