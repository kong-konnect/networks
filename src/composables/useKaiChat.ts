import { ref } from 'vue'

// Launch state for the shared KAi surface (KaiChat.vue), mounted once in AppLayout.
//  - 'network-setup'    → from the Networks empty-state prompt (creates a network)
//  - 'add-connectivity' → from an existing network's Actions (adds to that network)
//  - 'ask'              → the ADVISOR: answers questions and walks you through the hard
//                         decisions (which connectivity, CIDR sizing, cloud-side steps,
//                         errors). Reachable from "Ask KAi" everywhere. Does NOT build.
export type KaiChatMode = 'network-setup' | 'add-connectivity' | 'ask'

// Seeds the advisor with the right starter questions for where the user is.
export type KaiTopic = 'general' | 'connection-method' | 'cidr' | 'ram-share' | 'dns-type' | 'error'

export interface KaiChatLaunch {
  mode: KaiChatMode
  prompt?: string
  networkId?: string
  topic?: KaiTopic
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
