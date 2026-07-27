<template>
  <div class="direction-view" data-testid="connectivity-direction-view">
    <p class="direction-intro">
      Connections are grouped by who starts the traffic. Resource endpoints only work
      Kong → upstream; network peering is bidirectional.
    </p>

    <section
      v-for="group in groups"
      :key="group.key"
      class="direction-group"
      :data-testid="`direction-group-${group.key}`"
    >
      <div class="direction-head">
        <div class="direction-head-text">
          <h3 class="direction-title">
            {{ group.label }}
            <span class="direction-count">{{ group.rows.length }}</span>
          </h3>
          <p class="direction-help">{{ group.help }}</p>
        </div>
      </div>

      <table v-if="group.rows.length" class="rows-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Last checked</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="conn in group.rows"
            :key="conn.id"
            class="clickable-row"
            @click="goToConnection(conn.id)"
          >
            <td><a class="row-link" href="#" @click.prevent.stop="goToConnection(conn.id)">{{ conn.name }}</a></td>
            <td>{{ connectionTypeLabel(conn.type) }}</td>
            <td><KBadge :appearance="statusBadgeAppearance(conn.status)">{{ statusLabel(conn.status) }}</KBadge></td>
            <td class="checked-cell">{{ conn.lastCheckedAt ? timeAgo(conn.lastCheckedAt) : '—' }}</td>
            <td><a class="row-action" href="#" @click.prevent.stop="goToConnection(conn.id)">View</a></td>
          </tr>
        </tbody>
      </table>

      <p v-else class="direction-empty">No connections in this direction yet.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { KBadge } from '@kong/kongponents'
import type { Connection } from '@/types'
import {
  connectionTypeLabel,
  statusLabel,
  statusBadgeAppearance,
  timeAgo,
  directionCategory,
  directionCategoryLabel,
  directionCategoryHelp,
  type DirectionCategory,
} from '@/utils/connectionDisplay'

const props = defineProps<{
  networkId: string
  connections: Connection[]
}>()

const router = useRouter()

// Fixed order: client-facing first, then upstream-facing, then bidirectional.
const order: DirectionCategory[] = ['client-to-kong', 'kong-to-upstream', 'bidirectional']

const groups = computed(() =>
  order.map(key => ({
    key,
    label: directionCategoryLabel[key],
    help: directionCategoryHelp[key],
    rows: props.connections.filter(c => directionCategory(c) === key),
  })),
)

const goToConnection = (connId: string) => {
  router.push({ name: 'networks-connection-detail', params: { id: props.networkId, connId } })
}
</script>

<style scoped lang="scss">
.direction-view {
  display: flex;
  flex-direction: column;
  gap: $kui-space-70;
}

.direction-intro {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.direction-group {
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-40;
  display: flex;
  flex-direction: column;
  gap: $kui-space-50;
  padding: $kui-space-70;
}

.direction-head-text {
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
}

.direction-title {
  align-items: center;
  color: $kui-color-text;
  display: flex;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-40;
  margin: $kui-space-0;
}

.direction-count {
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-round;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  min-width: 22px;
  padding: $kui-space-10 $kui-space-30;
  text-align: center;
}

.direction-help {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.direction-empty {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  font-style: italic;
  margin: $kui-space-0;
}

.rows-table {
  border-collapse: collapse;
  width: 100%;

  th {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
    font-weight: $kui-font-weight-semibold;
    padding: $kui-space-40 $kui-space-50;
    text-align: left;
  }

  td {
    border-top: $kui-border-width-10 solid $kui-color-border;
    font-size: $kui-font-size-30;
    padding: $kui-space-50;
    vertical-align: middle;
  }
}

.clickable-row {
  cursor: pointer;

  &:hover td { background-color: $kui-color-background-neutral-weakest; }
}

.row-link {
  color: $kui-color-text-primary;
  font-weight: $kui-font-weight-semibold;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.row-action {
  color: $kui-color-text-primary;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.checked-cell {
  color: $kui-color-text-neutral;
  white-space: nowrap;
}
</style>
