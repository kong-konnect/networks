<template>
  <header class="kong-ui-app-navbar">
    <div class="header-content">
      <div class="navbar-content">
        <!-- Left Side (empty — hidden via CSS when empty) -->
        <div class="navbar-content-left" />

        <!-- Center: Search (on phablet+ widths) -->
        <div class="navbar-content-center">
          <div class="phablet-search-container">
            <button
              class="kong-ui-konnect-ksearch"
              type="button"
            >
              <div class="search-left">
                <SearchIcon
                  decorative
                  :size="KUI_ICON_SIZE_40"
                />
                <div class="search-text">
                  Search Konnect
                </div>
              </div>
              <div class="search-right">
                <div class="keyboard-shortcut mac">
                  <kbd class="search-command" />
                  <kbd>K</kbd>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Right Side: KAI, Help, Notifications, Account -->
        <div class="navbar-content-right">
          <!-- DrWhoToggleButton (Ask KAI) -->
          <button
            class="ask-kai-button"
            type="button"
          >
            <SparklesIcon
              decorative
              :size="KUI_ICON_SIZE_30"
            />
            <span>Ask KAI</span>
          </button>

          <!-- FeedbackDropdown trigger -->
          <div class="feedback-dropdown">
            <button
              class="feedback-dropdown-btn"
              type="button"
              aria-label="Feedback"
            >
              <FeedbackIcon decorative />
            </button>
          </div>

          <!-- HelpDropdown trigger -->
          <button
            class="help-dropdown-btn"
            type="button"
            aria-label="Help"
          >
            <HelpIcon decorative />
          </button>

          <!-- NotificationsDropdown trigger -->
          <button
            class="notifications-dropdown-trigger"
            type="button"
            aria-label="Notifications"
          >
            <NotificationIcon
              decorative
            />
          </button>

          <!-- AccountDropdown -->
          <div class="account-dropdown legacy-account-dropdown">
            <AccountDropdown />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FeedbackIcon, HelpIcon, NotificationIcon, SearchIcon, SparklesIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import AccountDropdown from './AccountDropdown.vue'

const props = defineProps({
  topOffset: {
    type: Number,
    default: 0,
  },
  leftOffset: {
    type: Number,
    default: 240,
  },
})

const headerStyles = computed(() => ({
  top: props.topOffset ? `${props.topOffset}px` : '0',
  left: props.leftOffset ? `${props.leftOffset}px` : '0',
}))
</script>

<style lang="scss" scoped>
@use "@kong/design-tokens/tokens/scss/variables" as *;

// Production layout variables
$navbar-height: 60px;
$header-item-gap: $kui-space-60;

.kong-ui-app-navbar {
  background: var(--kong-ui-app-navbar-background, $kui-color-background-inverse);
  left: 0;
  position: fixed;
  right: 0;
  top: v-bind('headerStyles.top');
  z-index: 3;
  left: v-bind('headerStyles.left');

  .header-content {
    align-items: center;
    display: flex;
    height: $navbar-height;
    justify-content: space-between;
    padding: $kui-space-0 $kui-space-60;
  }

  .navbar-content {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-40;
    height: 100%;
    justify-content: space-between;
    width: 100%;

    &-left,
    &-center,
    &-right {
      align-items: center;
      display: flex;
      gap: $header-item-gap;
      height: 100%;
    }

    // Production: hide left when empty
    &-left {
      flex: 1;
      justify-content: flex-start;

      &:empty {
        display: none !important;
      }
    }

    // Production: center takes remaining space, visually offset
    &-center {
      flex: 1;
      justify-content: center;

      @media (min-width: $kui-breakpoint-tablet) {
        margin-left: -30px;
      }
    }

    // Production: right doesn't stretch — just fits its content
    &-right {
      flex: 0 1 auto;
      justify-content: flex-end;
    }
  }
}

// Phablet search container — matches production KonnectAppShell.vue
.phablet-search-container {
  align-items: center;
  display: flex;
  justify-content: center;
  width: 100%;
}

// KonnectKsearch — matches production konnect-ksearch/KonnectKsearch.vue
.kong-ui-konnect-ksearch {
  align-items: center;
  background-color: rgba(255, 255, 255, 0.16);
  border: $kui-border-width-10 solid rgba(255, 255, 255, 0.16);
  border-radius: $kui-border-radius-30;
  color: $kui-color-text-inverse;
  cursor: pointer;
  display: flex;
  font-size: $kui-font-size-30;
  justify-content: space-between;
  max-width: 440px;
  min-width: 140px;
  padding: $kui-space-40 $kui-space-50;
  transition: background-color 0.2s ease-in-out;
  user-select: none;
  width: 100%;

  &:hover,
  &:focus-visible {
    background-color: rgba(255, 255, 255, 0.20);
  }

  &:focus-visible {
    box-shadow: $kui-navigation-shadow-focus;
    outline: none;
  }

  .search-left {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
  }

  .search-text {
    font-family: $kui-font-family-text;
    line-height: 1;
    padding-right: $kui-space-30;
    white-space: nowrap;
  }

  .search-right {
    align-items: center;
    display: flex;
    gap: $kui-space-40;

    .keyboard-shortcut {
      align-items: center;
      background-color: rgba(255, 255, 255, 0.20);
      border-radius: $kui-border-radius-20;
      display: flex;
      gap: $kui-space-30;
      line-height: 1;
      padding: $kui-space-20 $kui-space-30;

      .search-command:before,
      kbd {
        font-family: $kui-font-family-text;
        font-size: $kui-font-size-30;
      }

      .search-command:before {
        content: 'Ctrl';
      }

      &.mac {
        gap: $kui-space-10;

        .search-command:before {
          content: '\2318';
          line-height: 0;
          position: relative;
        }
      }
    }
  }
}

// DrWhoToggleButton — matches production dr-who/DrWhoToggleButton.vue
.ask-kai-button {
  align-items: center;
  background: linear-gradient(219.69deg, #FF834029 0%, #8D40FF29 74.54%);
  border: none;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-inverse;
  cursor: pointer;
  display: inline-flex;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-semibold;
  gap: $kui-space-20;
  height: $kui-icon-size-50;
  line-height: $kui-line-height-20;
  padding: $kui-space-20 $kui-space-40;
  position: relative;

  &::before {
    background: linear-gradient(41.48deg, #FF8340 0.76%, #8D40FF 74.11%);
    border-radius: $kui-border-radius-20;
    content: '';
    inset: 0;
    mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    padding: 1px;
    position: absolute;
  }
}

// FeedbackDropdown — matches production global-ui/FeedbackDropdown.vue
.feedback-dropdown {
  align-items: center;
  display: flex;

  .feedback-dropdown-btn {
    background-color: transparent;
    border: none;
    color: $kui-color-text-neutral-weak;
    cursor: pointer;
    height: $kui-icon-size-50;
    padding: $kui-space-0;

    &:focus-visible {
      border-radius: $kui-border-radius-round;
      outline: 1px solid $kui-color-text-neutral-weak;
      outline-offset: 2px;
    }
  }
}

// HelpDropdown trigger — matches production global-ui/HelpDropdown.vue
.help-dropdown-btn {
  align-items: center;
  background-color: transparent;
  border: none;
  box-shadow: none;
  color: $kui-color-text-neutral-weak;
  cursor: pointer;
  display: flex;
  font-weight: $kui-font-weight-regular;
  height: 24px;
  padding: 0;
  position: relative;

  &:focus-visible {
    border-radius: $kui-border-radius-round;
    outline: 1px solid $kui-color-text-neutral-weak;
    outline-offset: 2px;
  }
}

// NotificationsDropdown trigger — matches production konnect-notifications/NotificationsDropdown.vue
.notifications-dropdown-trigger {
  align-items: center;
  background-color: $kui-color-background-transparent;
  border: none;
  color: $kui-color-text-neutral-weak;
  cursor: pointer;
  display: flex;
  padding: $kui-space-0;
  position: relative;

  &:focus-visible {
    border-radius: $kui-border-radius-round;
    outline: 1px solid $kui-color-text-neutral-weak;
    outline-offset: 2px;
  }
}

// AccountDropdown — matches production navbar/AccountDropdown.vue
.account-dropdown {
  display: flex;
  margin-right: $kui-space-20;

  .account-dropdown-btn {
    align-items: center;
    background-color: var(--kong-ui-account-dropdown-background, #9396FC);
    border: none;
    border-radius: $kui-border-radius-round;
    color: var(--kong-ui-account-dropdown-color, $kui-color-text);
    cursor: pointer;
    display: flex;
    font-size: $kui-font-size-20;
    height: 24px;
    justify-content: center;
    padding: $kui-space-0;
    user-select: none;
    width: 24px;

    &:focus-visible {
      border-radius: $kui-border-radius-round;
      outline: 1px solid #bee2ff;
      outline-offset: 2px;
    }
  }
}
</style>
