import { ref, computed } from 'vue'

/**
 * Generic demo state composable.
 *
 * Use this to define demo/sample data for your prototype and toggle between
 * different states (empty, populated, error) for design reviews.
 *
 * Usage:
 *   const demo = useDemoState()
 *   const items = computed(() => demo.isPopulated.value ? SAMPLE_DATA : [])
 *
 * Works with StateSwitcher — register states so reviewers can toggle:
 *   const { register } = useStateSwitcher()
 *   register(
 *     [{ key: 'populated', label: 'Populated' }, { key: 'empty', label: 'Empty' }],
 *     'populated',
 *     (value) => demo.setState(value as 'populated' | 'empty' | 'error')
 *   )
 */

export type DemoStateKey = 'populated' | 'empty' | 'error' | 'loading'

const currentState = ref<DemoStateKey>('populated')

export function useDemoState() {
  const setState = (state: DemoStateKey) => {
    currentState.value = state
  }

  const isPopulated = computed(() => currentState.value === 'populated')
  const isEmpty = computed(() => currentState.value === 'empty')
  const isError = computed(() => currentState.value === 'error')
  const isLoading = computed(() => currentState.value === 'loading')

  return {
    currentState,
    setState,
    isPopulated,
    isEmpty,
    isError,
    isLoading,
  }
}
