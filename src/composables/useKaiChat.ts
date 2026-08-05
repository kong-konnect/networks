import { ref } from 'vue'

// Launch state for the shared KAi conversational setup surface (KaiChat.vue),
// mounted once in AppLayout and opened from either entry point:
//  - 'network-setup'    → from the Networks empty-state prompt (creates a network)
//  - 'add-connectivity' → from an existing network's Actions (adds to that network)
export type KaiChatMode = 'network-setup' | 'add-connectivity'

export interface KaiChatLaunch {
  mode: KaiChatMode
  prompt?: string
  networkId?: string
}

const isOpen = ref(false)
const launch = ref<KaiChatLaunch | null>(null)

export function useKaiChat() {
  const openKaiChat = (opts: KaiChatLaunch) => {
    launch.value = opts
    isOpen.value = true
  }
  const closeKaiChat = () => {
    isOpen.value = false
  }
  return { isOpen, launch, openKaiChat, closeKaiChat }
}
