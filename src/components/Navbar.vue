<template>
  <header class="kong-ui-app-navbar" data-testid="kong-ui-app-navbar">
    <!-- Left: Kong logo + org menu — production GlobalAppNavbar.navbar-logo-container -->
    <div class="navbar-logo-container">
      <div class="navbar-logo-wrap">
        <GruceLogo class="navbar-logo" />
      </div>

      <button class="org-menu" type="button" aria-label="Organization">
        <span class="org-avatar">{{ orgInitial }}</span>
        <span class="org-name">{{ organizationName }}</span>
        <UnfoldMoreIcon decorative :size="16" />
      </button>
    </div>

    <!-- Right: utility controls — production GlobalAppNavbar.navbar-controls-container -->
    <div class="navbar-controls-container">
      <button class="ask-kai-btn" type="button" aria-label="Ask KAi" @click="openKaiChat({ mode: 'ask' })">
        <svg
          class="ask-kai-icon"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.3337 8.05814V8.28545C10.4755 8.28545 9.70686 10.7705 9.70686 12.798H9.48227C9.48227 10.7705 8.58245 8.28545 5.85547 8.28545V8.05814C8.99831 8.05814 9.48227 5.57309 9.48227 3.54561H9.70686C9.70686 5.57309 10.1988 8.05814 13.3337 8.05814ZM4.85785 7.36886C4.85785 6.21543 5.29544 4.80169 6.9212 4.80169V4.67264C5.1375 4.67264 4.85785 3.2589 4.85785 2.10547H4.73034C4.73034 3.2589 4.45503 4.67264 2.66699 4.67264V4.80169C4.21885 4.80169 4.73034 6.21543 4.73034 7.36886H4.85785ZM6.14092 9.41028H6.03225C6.03225 10.3929 5.79751 11.5976 4.27391 11.5976V11.7076C5.59611 11.7076 6.03225 12.9124 6.03225 13.8949H6.14092C6.14092 12.9124 6.51331 11.7076 7.89926 11.7076V11.5976C6.37928 11.5976 6.14092 10.3929 6.14092 9.41028Z"
            fill="url(#kai-sparkle-gradient)"
          />
          <defs>
            <linearGradient
              id="kai-sparkle-gradient"
              gradientUnits="userSpaceOnUse"
              x1="2.62219"
              x2="12.6125"
              y1="13.8949"
              y2="1.48866"
            >
              <stop stop-color="#FF723C" />
              <stop offset="1" stop-color="#6F28FF" />
            </linearGradient>
          </defs>
        </svg>
        <span class="ask-kai-text">Ask KAi</span>
      </button>

      <button class="header-icon-btn" type="button" aria-label="Help">
        <HelpOutlineIcon decorative :size="KUI_ICON_SIZE_30" />
      </button>

      <button class="header-icon-btn" type="button" aria-label="Notifications">
        <NotificationOutlineIcon decorative :size="KUI_ICON_SIZE_30" />
      </button>

      <button class="header-icon-btn" type="button" aria-label="Region">
        <div class="region-icon-wrap">
          <FlagUsIcon decorative :size="12" />
        </div>
      </button>

      <AccountDropdown
        :initials="userInitials"
        :email="userEmail"
        :organization-name="organizationName"
        :organization-id="organizationId"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HelpOutlineIcon, NotificationOutlineIcon, UnfoldMoreIcon, FlagUsIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import GruceLogo from './GruceLogo.vue'
import AccountDropdown from './AccountDropdown.vue'
import { useKaiChat } from '@/composables/useKaiChat'

const { openKaiChat } = useKaiChat()

const props = defineProps({
  organizationName: { type: String, default: 'Kong Design' },
  organizationId: { type: String, default: '00000000-0000-0000-0000-000000000000' },
  userEmail: { type: String, default: 'designer@kong.example' },
  userInitials: { type: String, default: 'M' },
})

const orgInitial = computed(() => props.organizationName.charAt(0).toUpperCase())
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

$navbar-height: 60px;

// Production GlobalAppNavbar — light bg, full-width, border-bottom
.kong-ui-app-navbar {
  align-items: center;
  background: $kui-color-background-neutral-weakest;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  box-sizing: border-box;
  display: flex;
  height: $navbar-height;
  justify-content: space-between;
  left: 0;
  padding: $kui-space-0 $kui-space-50;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 4;
}

.navbar-logo-container {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: $kui-space-50;
  padding: $kui-space-40 $kui-space-0;
}

.navbar-logo-wrap {
  align-items: center;
  display: flex;
  padding: $kui-space-10;
}

.navbar-logo {
  height: 20px;
  width: auto;
}

// Org menu button — bordered chip with avatar + name + caret
.org-menu {
  align-items: center;
  background: transparent;
  border: $kui-border-width-10 solid $kui-color-border;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text;
  cursor: pointer;
  display: flex;
  font-family: $kui-font-family-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-medium;
  gap: $kui-space-30;
  overflow: hidden;
  padding: $kui-space-30;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: $kui-color-background-neutral-weaker;
  }

  &:focus-visible {
    box-shadow: $kui-shadow-focus;
    outline: none;
  }
}

.org-avatar {
  align-items: center;
  background-color: $kui-color-background-primary-weaker;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text;
  display: flex;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold;
  height: 20px;
  justify-content: center;
  min-width: 20px;
  text-transform: uppercase;
  width: 20px;
}

.org-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-controls-container {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: $kui-space-10;
}

// Ask KAi — gradient text, transparent bg
.ask-kai-btn {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: $kui-border-radius-20;
  cursor: pointer;
  display: inline-flex;
  gap: $kui-space-20;
  padding: $kui-space-40;
  transition: background-color 0.15s ease-in-out;

  &:hover {
    background-color: $kui-color-background-neutral-weaker;
  }

  &:focus-visible {
    box-shadow: $kui-shadow-focus;
    outline: none;
  }
}

.ask-kai-icon {
  flex-shrink: 0;
}

.ask-kai-text {
  background: linear-gradient(70.43deg, #6f28ff 0%, #ff723c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-family: $kui-font-family-text;
  font-feature-settings: 'liga' off, 'clig' off;
  font-size: $kui-font-size-20;
  font-style: normal;
  font-weight: $kui-font-weight-semibold;
  line-height: $kui-line-height-20;
  white-space: nowrap;
}

.header-icon-btn {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  cursor: pointer;
  display: flex;
  padding: $kui-space-40;
  transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out;

  &:hover {
    background-color: $kui-color-background-neutral-weaker;
    color: $kui-color-text;
  }

  &:focus-visible {
    box-shadow: $kui-shadow-focus;
    outline: none;
  }
}

.region-icon-wrap {
  align-items: center;
  display: flex;
  padding: $kui-space-10;
}
</style>
