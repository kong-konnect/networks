import { computed, ref } from 'vue'

export type NavVersion = 'new' | 'legacy'

const STORAGE_KEY = 'starter-kit:nav-version'

const readStoredVersion = (): NavVersion => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'legacy' ? 'legacy' : 'new'
  } catch {
    return 'new'
  }
}

const navVersion = ref<NavVersion>(readStoredVersion())

const writeStoredVersion = (value: NavVersion): void => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // no-op (private mode / storage full)
  }
}

export function useNavVersion() {
  const isNewNav = computed(() => navVersion.value === 'new')
  const isLegacyNav = computed(() => navVersion.value === 'legacy')

  const setNavVersion = (version: NavVersion): void => {
    navVersion.value = version
    writeStoredVersion(version)
  }

  const switchToLegacy = (): void => setNavVersion('legacy')
  const switchToNew = (): void => setNavVersion('new')

  return {
    navVersion,
    isNewNav,
    isLegacyNav,
    setNavVersion,
    switchToLegacy,
    switchToNew,
  }
}
