<template>
  <KDropdown
    class="proto-account-dropdown"
    :kpop-attributes="{ placement: 'bottom-end' }"
    width="240px"
  >
    <button
      class="account-dropdown-trigger"
      type="button"
      aria-label="Account menu"
    >
      <span class="account-avatar">{{ initials }}</span>
    </button>

    <template #items>
      <div class="account-dropdown-header">
        <div class="account-dropdown-user-name">{{ email }}</div>
        <div class="account-dropdown-org-row">
          <span class="account-dropdown-org-name">{{ organizationName }}</span>
          <KCopy
            class="account-dropdown-org-copy"
            copy-tooltip="Copy organization ID"
            format="hidden"
            :text="organizationId"
          />
        </div>
      </div>

      <KDropdownItem has-divider>
        <CoinIcon decorative />
        Personal access tokens
      </KDropdownItem>
      <KDropdownItem>
        <ProfileIcon decorative />
        My profile
      </KDropdownItem>

      <KDropdownItem has-divider>
        <TourIcon decorative />
        Restart tour
      </KDropdownItem>

      <KDropdownItem
        v-if="isNewNav"
        data-testid="account-dropdown-switch-to-legacy"
        @click="switchToLegacy"
      >
        <RedoIcon decorative />
        Return to classic view
      </KDropdownItem>
      <KDropdownItem
        v-else
        data-testid="account-dropdown-switch-to-new"
        @click="switchToNew"
      >
        <SparklesIcon decorative />
        Try the new navigation
      </KDropdownItem>

      <KDropdownItem has-divider>
        <LogoutIcon decorative />
        Log out
      </KDropdownItem>
    </template>
  </KDropdown>
</template>

<script setup lang="ts">
import { KDropdown, KDropdownItem, KCopy } from '@kong/kongponents'
import {
  CoinIcon,
  ProfileIcon,
  TourIcon,
  RedoIcon,
  SparklesIcon,
  LogoutIcon,
} from '@kong/icons'
import { useNavVersion } from '@/composables'

const props = defineProps({
  initials: { type: String, default: 'M' },
  email: { type: String, default: 'designer@kong.example' },
  organizationName: { type: String, default: 'Kong Design' },
  organizationId: { type: String, default: '00000000-0000-0000-0000-000000000000' },
})

const { isNewNav, switchToLegacy, switchToNew } = useNavVersion()
</script>

<style scoped lang="scss">
@use "@kong/design-tokens/tokens/scss/variables" as *;

.proto-account-dropdown {
  display: flex;
}

// Trigger button — matches new-nav production AccountDropdown.account-dropdown-button
.account-dropdown-trigger {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: $kui-border-radius-20;
  cursor: pointer;
  display: flex;
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

.account-avatar {
  align-items: center;
  background-color: var(--kong-ui-account-dropdown-background, #9396fc);
  border-radius: $kui-border-radius-round;
  color: var(--kong-ui-account-dropdown-color, $kui-color-text);
  display: flex;
  font-size: 9px;
  font-weight: $kui-font-weight-semibold;
  height: $kui-icon-size-40;
  justify-content: center;
  line-height: 16px;
  text-transform: uppercase;
  width: $kui-icon-size-40;
}

// Dropdown header — matches production
.account-dropdown-header {
  display: flex;
  flex-direction: column;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-medium;
  gap: $kui-space-20;
  line-height: $kui-line-height-20;
  padding: $kui-space-50 $kui-space-60;
}

.account-dropdown-user-name {
  color: $kui-color-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-dropdown-org-row {
  display: flex;
  gap: $kui-space-20;
  justify-content: space-between;
}

.account-dropdown-org-name {
  color: $kui-color-text-neutral;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-dropdown-org-copy {
  margin-top: -6px;
}
</style>
