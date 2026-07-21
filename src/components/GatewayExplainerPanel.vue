<template>
  <section
    class="explainer"
    data-testid="explainer-panel"
  >
    <div class="explainer-copy">
      <h2 class="explainer-title">{{ title }}</h2>
      <p
        v-for="(p, i) in paragraphs"
        :key="i"
        class="explainer-text"
      >
        {{ p }}
      </p>
      <a
        class="explainer-link"
        href="#"
        data-testid="learn-more-link"
        @click.prevent
      >Learn more</a>
    </div>

    <div
      class="topology"
      data-testid="topology-diagram"
    >
      <div
        class="topo-box"
        :class="{ active: highlight === 'control' }"
      >
        <RuntimesIcon
          class="topo-icon"
          decorative
          :size="KUI_ICON_SIZE_30"
        />
        <span class="topo-label">Control plane</span>
      </div>
      <div class="topo-connector" />
      <div
        class="topo-row"
        :class="{ active: highlight === 'data-plane' }"
      >
        <span class="topo-row-label">Data plane</span>
        <div class="topo-nodes">
          <div
            v-for="n in 3"
            :key="n"
            class="topo-box"
            :class="{ active: highlight === 'data-plane-node' && n === 1 }"
          >
            <RuntimesIcon
              class="topo-icon"
              decorative
              :size="KUI_ICON_SIZE_20"
            />
            <span class="topo-label">Data plane node</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { KUI_ICON_SIZE_30, KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import { RuntimesIcon } from '@kong/icons'

defineProps<{
  title: string
  paragraphs: string[]
  highlight: 'control' | 'data-plane' | 'data-plane-node'
}>()
</script>

<style scoped lang="scss">
.explainer {
  align-items: stretch;
  background-color: $kui-color-background-neutral-weakest;
  border-radius: $kui-border-radius-40;
  display: flex;
  gap: $kui-space-90;
  padding: $kui-space-80;
}

.explainer-copy {
  display: flex;
  flex: 1 1 55%;
  flex-direction: column;
  gap: $kui-space-50;
  min-width: 0;
}

.explainer-title {
  color: $kui-color-text;
  font-size: $kui-font-size-50;
  font-weight: $kui-font-weight-bold;
  line-height: $kui-line-height-50;
  margin: $kui-space-0;
}

.explainer-text {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-40;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.explainer-link {
  color: $kui-color-text-primary;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
  text-decoration: none;
  width: fit-content;

  &:hover { text-decoration: underline; }
}

.topology {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  justify-content: center;
  width: 45%;
}

.topo-box {
  align-items: center;
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-30;
  color: $kui-color-text-neutral;
  display: flex;
  flex-direction: column;
  gap: $kui-space-20;
  min-width: 0;
  padding: $kui-space-40 $kui-space-50;
  width: 100%;

  // Emphasis only — neutral, NOT the primary/card-selection look (it's a diagram, not a control).
  &.active {
    background-color: $kui-color-background-neutral-weakest;
    border-color: $kui-color-border;
    color: $kui-color-text;
    font-weight: $kui-font-weight-semibold;
  }
}

.topo-icon { color: inherit; }

.topo-label {
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  text-align: center;
  white-space: nowrap;
}

.topo-connector {
  background-color: $kui-color-border;
  height: $kui-space-70;
  width: $kui-border-width-20;
}

.topo-row {
  border: $kui-border-width-10 dashed $kui-color-border;
  border-radius: $kui-border-radius-30;
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;
  padding: $kui-space-50;
  width: 100%;

  &.active {
    background-color: $kui-color-background-neutral-weakest;
    border-color: $kui-color-border;
  }
}

.topo-row-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  text-align: center;
}

.topo-nodes {
  display: flex;
  gap: $kui-space-40;
  justify-content: center;

  .topo-box {
    flex: 1 1 0;
    padding: $kui-space-30 $kui-space-20;
  }

  .topo-label { font-size: $kui-font-size-10; }
}
</style>
