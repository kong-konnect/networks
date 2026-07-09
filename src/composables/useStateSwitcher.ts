import { reactive, onUnmounted } from 'vue'

export interface StateOption {
  key: string
  label: string
}

export interface SwitcherInstance {
  states: StateOption[]
  currentValue: string
  callback: ((value: string) => void) | null
}

const switchers = reactive<Map<string, SwitcherInstance>>(new Map())

export function useStateSwitcher() {
  const register = (
    options: StateOption[],
    value: string,
    onUpdate: (value: string) => void,
    id = 'default',
  ) => {
    switchers.set(id, {
      states: options,
      currentValue: value,
      callback: onUpdate,
    })
    onUnmounted(() => {
      switchers.delete(id)
    })
  }

  const unregister = (id: string) => {
    switchers.delete(id)
  }

  const setValue = (value: string, id = 'default') => {
    const instance = switchers.get(id)
    if (instance) {
      instance.currentValue = value
      instance.callback?.(value)
    }
  }

  const syncValue = (value: string, id = 'default') => {
    const instance = switchers.get(id)
    if (instance) {
      instance.currentValue = value
    }
  }

  return {
    switchers,
    // Keep backward-compat getters for single-switcher pages
    get states() {
      return switchers.get('default')?.states ?? []
    },
    get currentValue() {
      return switchers.get('default')?.currentValue ?? ''
    },
    register,
    unregister,
    setValue,
    syncValue,
  }
}
