import { ref } from 'vue'

// Shared show/loading behaviour for the contextual KAi cards (Summarize / Configure).
// Keeps every KAi entry point consistent: a brief "summarizing…" state, then the result.
export function useKaiPanel(delay = 1000) {
  const shown = ref(false)
  const loading = ref(false)

  const run = () => {
    shown.value = true
    loading.value = true
    window.setTimeout(() => { loading.value = false }, delay)
  }
  const close = () => { shown.value = false }

  return { shown, loading, run, close }
}
