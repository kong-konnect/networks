<template>
  <div class="home-page">
    <AppPageHeader title="Home">
      <template #actions>
        <KButton appearance="primary">
          <AddIcon decorative />
          New item
        </KButton>
      </template>
    </AppPageHeader>

    <KCard>
      <div class="welcome-content">
        <h2>Kong Prototype Starter Kit</h2>
        <p>Your prototype starts here. Use the page templates in <code>docs/templates/</code> to build pages.</p>

        <h3>Available page types</h3>
        <ul>
          <li><strong>List page</strong> — table with search, pagination, row actions (<code>docs/templates/list-page.md</code>)</li>
          <li><strong>Detail page</strong> — tabs, key-value cards, related entities (<code>docs/templates/detail-page.md</code>)</li>
          <li><strong>Form page</strong> — create/edit with stepped sections (<code>docs/templates/form-page.md</code>)</li>
          <li><strong>Dashboard page</strong> — analytics cards, summary tables (<code>docs/templates/dashboard-page.md</code>)</li>
          <li><strong>Catalog page</strong> — filterable card grid with categories (<code>docs/templates/catalog-page.md</code>)</li>
        </ul>

        <h3>Quick start</h3>
        <p>Tell your AI coding assistant what you need:</p>
        <KCodeBlock
          id="quick-start"
          :code="examplePrompt"
          language="text"
          is-single-line
        />
      </div>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { KButton, KCard, KCodeBlock } from '@kong/kongponents'
import { AddIcon } from '@kong/icons'
import AppPageHeader from '@/components/AppPageHeader.vue'

const examplePrompt = `Create a list page for API Keys with columns: name, status, created date. Include search and a create button.`
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.welcome-content {
  h2 {
    font-size: $kui-font-size-60;
    font-weight: $kui-font-weight-bold;
    margin: $kui-space-0 $kui-space-0 $kui-space-40;
  }

  h3 {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-semibold;
    margin: $kui-space-70 $kui-space-0 $kui-space-40;
  }

  p {
    color: $kui-color-text-neutral;
    line-height: $kui-line-height-40;
    margin: $kui-space-0 $kui-space-0 $kui-space-40;
  }

  ul {
    color: $kui-color-text-neutral;
    line-height: $kui-line-height-50;
    padding-left: $kui-space-80;
  }

  code {
    background-color: $kui-color-background-neutral-weakest;
    border-radius: $kui-border-radius-20;
    font-size: $kui-font-size-30;
    padding: $kui-space-10 $kui-space-20;
  }
}
</style>
