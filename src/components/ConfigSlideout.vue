<template>
  <KSlideout
    :visible="visible"
    :title="title"
    data-testid="config-slideout"
    @close="$emit('close')"
  >
    <div class="cfg-slideout">
      <p class="cfg-slideout-desc">{{ description }}</p>
      <div class="cfg-slideout-bar">
        <span class="cfg-slideout-label">Format</span>
        <KSelect
          v-model="selected"
          :items="formatItems"
          appearance="select"
          :width="'150px'"
          data-testid="config-slideout-format"
        />
      </div>
      <KCodeBlock
        id="config-slideout-code"
        :code="activeCode"
        :language="activeLang"
        theme="dark"
        data-testid="config-slideout-code"
      />
    </div>
  </KSlideout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { KSlideout, KSelect, KCodeBlock } from '@kong/kongponents'

interface Format {
  label: string
  value: string
  code: string
  language: string
}

const props = withDefaults(defineProps<{
  visible: boolean
  title: string
  formats: Format[]
  description?: string
}>(), {
  description: 'A read-only copy of this configuration. Provision it from the API, Terraform, or curl, or save it to your pipeline.',
})

defineEmits<{ (e: 'close'): void }>()

const selected = ref(props.formats[0]?.value ?? 'json')
const formatItems = computed(() => props.formats.map(f => ({ label: f.label, value: f.value })))
const active = computed(() => props.formats.find(f => f.value === selected.value) ?? props.formats[0])
const activeCode = computed(() => active.value?.code ?? '')
const activeLang = computed(() => active.value?.language ?? 'json')
</script>

<style scoped lang="scss">
.cfg-slideout {
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;
}

.cfg-slideout-desc {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-40;
  margin: $kui-space-0;
}

.cfg-slideout-bar {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
}

.cfg-slideout-label {
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
}
</style>
