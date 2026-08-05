<template>
  <div class="ncm">
    <!-- KAi's read — collapsed one-liner by default -->
    <KaiSummaryCard
      v-if="kaiOpen"
      class="ncm-kai"
      title="KAi read this network"
      :insights="kaiInsights"
      :one-liner="kaiOneLiner"
      initial-collapsed
      data-testid="ncm-kai"
      @close="kaiOpen = false"
    />

    <!-- Health at a glance: cross-type rollup you can't get from a single table -->
    <div class="ncm-rollup" data-testid="ncm-rollup">
      <div v-for="r in rollup" :key="r.type" class="rollup-group">
        <span class="rollup-type">{{ r.type }}</span>
        <div class="rollup-stats">
          <span
            v-for="st in r.stats"
            :key="st.label"
            class="rollup-stat"
            :class="`rollup-stat--${st.tone}`"
          >
            <span class="rollup-count">{{ st.count }}</span> {{ st.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Needs attention: each problem entity, why it's failing, what it blocks, the fix -->
    <section v-if="problems.length" class="ncm-attention" data-testid="ncm-attention">
      <h3 class="ncm-subhead">Needs attention <span class="ncm-count">{{ problems.length }}</span></h3>
      <div class="ncm-issues">
        <div
          v-for="p in problems"
          :key="p.id"
          class="issue"
          :class="`issue--${p.tone}`"
          :data-testid="`ncm-issue-${p.id}`"
        >
          <div class="issue-head">
            <span class="issue-ic" :class="`issue-ic--${p.kind}`">
              <component :is="kindIcon(p.kind)" :size="KUI_ICON_SIZE_20" decorative />
            </span>
            <span class="issue-headtext">
              <span class="issue-kicker">{{ p.typeLabel }}</span>
              <span class="issue-name">{{ p.name }}</span>
            </span>
            <KBadge :appearance="toneAppearance(p.tone)">{{ p.statusLabel }}</KBadge>
          </div>

          <p class="issue-cause">{{ p.cause }}</p>

          <p v-if="p.blocks" class="issue-blocks">
            <ArrowRightIcon class="issue-blocks-ic" :size="KUI_ICON_SIZE_20" decorative />
            Blocks {{ p.blocks }}
          </p>

          <div v-if="p.fix" class="issue-foot">
            <KButton appearance="secondary" size="small" :data-testid="`ncm-fix-${p.id}`" @click="runFix(p.fix)">
              {{ p.fix.label }}
              <ArrowRightIcon :size="KUI_ICON_SIZE_20" decorative />
            </KButton>
          </div>
        </div>
      </div>
    </section>

    <!-- All clear -->
    <div v-else class="ncm-allgood" data-testid="ncm-allgood">
      <CheckCircleIcon class="ncm-allgood-ic" :size="KUI_ICON_SIZE_30" decorative />
      <div>
        <p class="ncm-allgood-title">Everything is communicating</p>
        <p class="ncm-allgood-sub">Every gateway, connection, and DNS record on this network is reaching its target.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { KBadge, KButton } from '@kong/kongponents'
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ConnectionsIcon,
  WorldPrivateIcon,
  LocationIcon,
} from '@kong/icons'
import { KUI_ICON_SIZE_20, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import KaiSummaryCard from '@/components/KaiSummaryCard.vue'
import type { KaiInsight } from '@/components/KaiSummaryCard.vue'
import type { Network, Connection, Gateway, DnsConfig } from '@/types'
import type { ServicePath } from '@/composables/useNetworksStore'
import {
  connectionTypeLabel,
  statusLabel as connStatusLabel,
  nextActionText,
  directionCategory,
  directionCategoryLabel,
} from '@/utils/connectionDisplay'

const props = withDefaults(defineProps<{
  network: Network
  connections: Connection[]
  gateways?: Gateway[]
  dnsConfigs?: DnsConfig[]
  services?: ServicePath[]
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
type Kind = 'connectivity' | 'dns' | 'target'
const kaiOpen = ref(true)

const connTone = (s: Connection['status']): Tone => s === 'ready' ? 'ready' : s === 'error' ? 'error' : 'pending'
const dnsTone = (s: DnsConfig['status']): Tone => s === 'error' ? 'error' : s === 'pending' ? 'pending' : 'ready'
const targetTone = (s: 'reachable' | 'unreachable' | 'pending'): Tone => s === 'reachable' ? 'ready' : s === 'unreachable' ? 'error' : 'pending'
const rank = (t: Tone) => t === 'error' ? 2 : t === 'pending' ? 1 : 0
const worst = (list: Tone[]): Tone => list.includes('error') ? 'error' : list.includes('pending') ? 'pending' : 'ready'
const toneAppearance = (t: Tone) => t === 'ready' ? 'success' : t === 'error' ? 'danger' : 'warning'
const uniq = (a: string[]) => [...new Set(a)]
const listJoin = (a: string[], max = 3): string => {
  if (a.length <= max) {
    return a.length <= 1 ? (a[0] ?? '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`
  }
  return `${a.slice(0, max).join(', ')}, and ${a.length - max} more`
}
const countLabel = (n: number, singular: string, plural = `${singular}s`) => `${n} ${n === 1 ? singular : plural}`

const kindIcon = (k: Kind) => ({ connectivity: ConnectionsIcon, dns: WorldPrivateIcon, target: LocationIcon }[k])
const typeLabel = (k: Kind) => ({ connectivity: 'Connectivity', dns: 'Private DNS', target: 'Private target' }[k])

// ── Unique targets across all service paths (worst tone wins) ─────────────────
interface TargetInfo { name: string; tone: Tone; services: string[]; connIds: string[]; dnsIds: string[] }
const targets = computed<TargetInfo[]>(() => {
  const map = new Map<string, TargetInfo>()
  for (const s of props.services) {
    const tone = targetTone(s.target.status)
    const t = map.get(s.target.name) ?? { name: s.target.name, tone: 'ready', services: [], connIds: [], dnsIds: [] }
    t.tone = worst([t.tone, tone])
    t.services.push(s.name)
    t.connIds.push(s.connectionId)
    t.dnsIds.push(s.dnsConfigId)
    map.set(s.target.name, t)
  }
  return [...map.values()]
})

// ── Health rollup (cross-type, glanceable) ────────────────────────────────────
interface Stat { count: number; label: string; tone: Tone }
const statsFrom = (list: Tone[], labels: Record<Tone, string>): Stat[] => {
  const c = { ready: 0, pending: 0, error: 0 }
  for (const t of list) c[t]++
  return (['ready', 'pending', 'error'] as Tone[]).filter(t => c[t] > 0).map(t => ({ count: c[t], label: labels[t], tone: t }))
}
const rollup = computed(() => {
  const gw = props.gateways.length
  return [
    { type: 'Gateways', stats: [{ count: gw, label: gw === 1 ? 'gateway' : 'gateways', tone: 'ready' as Tone }] },
    { type: 'Connections', stats: statsFrom(props.connections.map(c => connTone(c.status)), { ready: 'ready', pending: 'pending', error: 'error' }) },
    { type: 'Private DNS', stats: statsFrom(props.dnsConfigs.map(d => dnsTone(d.status)), { ready: 'resolving', pending: 'pending', error: 'not resolving' }) },
    { type: 'Targets', stats: statsFrom(targets.value.map(t => t.tone), { ready: 'reachable', pending: 'pending', error: 'unreachable' }) },
  ].filter(r => r.stats.length)
})

// ── Needs-attention triage: cause + blast radius + fix ────────────────────────
interface Fix { label: string; kind: 'route-conn' | 'route-dns'; id: string }
interface Issue { id: string; kind: Kind; typeLabel: string; name: string; tone: Tone; statusLabel: string; cause: string; blocks: string | null; fix?: Fix }

const servicesForConn = (id: string) => uniq(props.services.filter(s => s.connectionId === id).map(s => s.target.name))
const servicesForDns = (id: string) => uniq(props.services.filter(s => s.dnsConfigId === id).map(s => s.target.name))

const problems = computed<Issue[]>(() => {
  const out: Issue[] = []

  for (const c of props.connections) {
    const tone = connTone(c.status)
    if (tone === 'ready') continue
    const targetsBlocked = servicesForConn(c.id)
    out.push({
      id: `conn-${c.id}`,
      kind: 'connectivity',
      typeLabel: props.directional ? `Connectivity · ${directionCategoryLabel[directionCategory(c)]}` : 'Connectivity',
      name: c.name,
      tone,
      statusLabel: connStatusLabel(c.status),
      cause: tone === 'error'
        ? `${connectionTypeLabel(c.type)} is in an error state, so it isn’t carrying traffic. ${nextActionText(c)}`
        : nextActionText(c),
      blocks: targetsBlocked.length ? `${countLabel(targetsBlocked.length, 'target')} — ${listJoin(targetsBlocked)}.` : null,
      fix: { label: 'Open connection', kind: 'route-conn', id: c.id },
    })
  }

  for (const d of props.dnsConfigs) {
    const tone = dnsTone(d.status)
    if (tone === 'ready') continue
    const targetsBlocked = servicesForDns(d.id)
    out.push({
      id: `dns-${d.id}`,
      kind: 'dns',
      typeLabel: 'Private DNS',
      name: d.name,
      tone,
      statusLabel: tone === 'error' ? 'Not resolving' : 'Pending',
      cause: tone === 'error'
        ? 'Queries reach the network, but this name isn’t resolving — the resolver endpoint looks unreachable.'
        : 'Resolution is still propagating and should complete shortly.',
      blocks: targetsBlocked.length ? `${countLabel(targetsBlocked.length, 'target')} — ${listJoin(targetsBlocked)}.` : null,
      fix: tone === 'error' ? { label: 'Open DNS configuration', kind: 'route-dns', id: d.id } : undefined,
    })
  }

  for (const t of targets.value) {
    if (t.tone === 'ready') continue
    // A target fails because something upstream does — point the fix there.
    const brokenDns = uniq(t.dnsIds).map(id => props.dnsConfigs.find(d => d.id === id)).find(d => d && dnsTone(d.status) !== 'ready')
    const brokenConn = uniq(t.connIds).map(id => props.connections.find(c => c.id === id)).find(c => c && connTone(c.status) !== 'ready')
    const fix: Fix | undefined = brokenDns
      ? { label: 'Open DNS configuration', kind: 'route-dns', id: brokenDns.id }
      : brokenConn ? { label: 'Open connection', kind: 'route-conn', id: brokenConn.id } : undefined
    out.push({
      id: `target-${t.name}`,
      kind: 'target',
      typeLabel: 'Private target',
      name: t.name,
      tone: t.tone,
      statusLabel: t.tone === 'error' ? 'Unreachable' : 'Coming up',
      cause: t.tone === 'error'
        ? (brokenDns ? `Can’t be reached — its DNS record ${brokenDns.name} isn’t resolving.`
          : brokenConn ? `Can’t be reached — the connection ${brokenConn.name} isn’t healthy.`
            : 'Can’t be reached from this network yet.')
        : 'The path to this target is still coming up. No action is needed unless it stays pending.',
      blocks: t.services.length ? `${countLabel(uniq(t.services).length, 'service')} — ${listJoin(uniq(t.services))}.` : null,
      fix,
    })
  }

  return out.sort((a, b) => rank(b.tone) - rank(a.tone))
})

const runFix = (fix: Fix) => {
  if (fix.kind === 'route-conn') router.push({ name: 'networks-connection-detail', params: { id: networkId.value, connId: fix.id } })
  else if (fix.kind === 'route-dns') router.push({ name: 'networks-dns-detail', params: { id: networkId.value, dnsId: fix.id } })
}

// ── KAi read ──────────────────────────────────────────────────────────────
const kaiOneLiner = computed(() => {
  const p = problems.value
  if (!p.length) return 'Everything on this network is communicating — traffic reaches every target.'
  return `${countLabel(p.length, 'relationship')} need attention — start with ${p[0].name}.`
})
const kaiInsights = computed<KaiInsight[]>(() => {
  const p = problems.value
  if (!p.length) return [{ lead: 'Healthy:', text: 'every gateway, connection, and DNS record on this network is reaching its target.' }]
  const insights: KaiInsight[] = p.slice(0, 3).map(i => ({
    lead: i.name,
    text: `${i.statusLabel.toLowerCase()}${i.blocks ? ` — blocks ${i.blocks.toLowerCase()}` : '.'}`,
    tone: i.tone === 'error' ? 'critical' : 'default',
  }))
  if (p.length > 3) insights.push({ text: `+${p.length - 3} more need attention.` })
  return insights
})
</script>

<style scoped lang="scss">
.ncm {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

// ── Health rollup ─────────────────────────────────────────────────────────────
.ncm-rollup {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-wrap: wrap;
  gap: $kui-space-50 $kui-space-110;
  padding: $kui-space-60 $kui-space-70;
}
.rollup-group { display: flex; flex-direction: column; gap: $kui-space-20; }
.rollup-type {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.rollup-stats { display: flex; flex-wrap: wrap; gap: $kui-space-40; }
.rollup-stat {
  align-items: baseline;
  color: $kui-color-text-neutral;
  display: inline-flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;

  &--pending { color: $kui-color-text-warning; }
  &--error { color: $kui-color-text-danger; }
  &--ready { color: $kui-color-text; }
}
.rollup-count { font-size: $kui-font-size-50; font-weight: $kui-font-weight-bold; }

// ── Needs attention ───────────────────────────────────────────────────────────
.ncm-subhead {
  align-items: center;
  color: $kui-color-text;
  display: flex;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
  gap: $kui-space-40;
  margin: $kui-space-0 $kui-space-0 $kui-space-50;
}
.ncm-count {
  align-items: center;
  background-color: $kui-color-background-danger-weakest;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text-danger;
  display: inline-flex;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  height: 20px;
  justify-content: center;
  min-width: 20px;
  padding: 0 $kui-space-20;
}
.ncm-issues { display: flex; flex-direction: column; gap: $kui-space-50; }

.issue {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-left-width: $kui-border-width-30;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-60 $kui-space-70;

  &--pending { border-left-color: $kui-color-text-warning; }
  &--error { border-left-color: $kui-color-text-danger; }
}
.issue-head { align-items: center; display: flex; gap: $kui-space-40; }
.issue-ic {
  align-items: center;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex: 0 0 auto;
  height: 28px;
  justify-content: center;
  width: 28px;

  &--connectivity { background-color: $kui-color-background-decorative-aqua-weakest; color: $kui-color-text-decorative-aqua; }
  &--dns { background-color: $kui-color-background-neutral-weakest; color: $kui-color-text-decorative-pink; }
  &--target { background-color: $kui-color-background-neutral-weak; color: $kui-color-text-neutral-strong; }
}
.issue-headtext { display: flex; flex-direction: column; gap: $kui-space-10; margin-right: auto; min-width: 0; }
.issue-kicker {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-10;
  font-weight: $kui-font-weight-semibold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.issue-name { color: $kui-color-text; font-size: $kui-font-size-40; font-weight: $kui-font-weight-semibold; overflow-wrap: anywhere; }
.issue-cause { color: $kui-color-text; font-size: $kui-font-size-30; line-height: $kui-line-height-40; margin: $kui-space-0; }
.issue-blocks {
  align-items: center;
  color: $kui-color-text-neutral;
  display: flex;
  font-size: $kui-font-size-30;
  gap: $kui-space-20;
  margin: $kui-space-0;
}
.issue-blocks-ic { color: $kui-color-text-neutral; flex: 0 0 auto; }
.issue-foot { display: flex; margin-top: $kui-space-20; }

// ── All clear ─────────────────────────────────────────────────────────────────
.ncm-allgood {
  align-items: center;
  background-color: $kui-color-background-success-weakest;
  border-radius: $kui-border-radius-40;
  display: flex;
  gap: $kui-space-50;
  padding: $kui-space-70;
}
.ncm-allgood-ic { color: $kui-color-text-success; flex: 0 0 auto; }
.ncm-allgood-title { color: $kui-color-text; font-size: $kui-font-size-40; font-weight: $kui-font-weight-semibold; margin: $kui-space-0; }
.ncm-allgood-sub { color: $kui-color-text-neutral; font-size: $kui-font-size-30; margin: $kui-space-10 $kui-space-0 $kui-space-0; }
</style>
