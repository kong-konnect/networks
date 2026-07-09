# Design Tokens Reference

This document lists all design tokens used in the AI Gateway Prototype, extracted from the codebase.

---

## TypeScript Imports

Import from `@kong/design-tokens`:

```typescript
import {
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_ICON_SIZE_40,
  KUI_SPACE_60
} from '@kong/design-tokens'
```

---

## Color Tokens

### Text Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_COLOR_TEXT` | `--kui-color-text` | Base text color |
| `KUI_COLOR_TEXT_NEUTRAL` | `--kui-color-text-neutral` | Secondary/muted text |
| `KUI_COLOR_TEXT_NEUTRAL_WEAK` | `--kui-color-text-neutral-weak` | Lighter muted text |
| `KUI_COLOR_TEXT_NEUTRAL_STRONG` | `--kui-color-text-neutral-strong` | Darker muted text |
| `KUI_COLOR_TEXT_NEUTRAL_STRONGER` | `--kui-color-text-neutral-stronger` | Even darker text |
| `KUI_COLOR_TEXT_NEUTRAL_STRONGEST` | `--kui-color-text-neutral-strongest` | Darkest muted text |
| `KUI_COLOR_TEXT_PRIMARY` | `--kui-color-text-primary` | Primary/link color |
| `KUI_COLOR_TEXT_INVERSE` | `--kui-color-text-inverse` | Light text on dark bg |
| `KUI_COLOR_TEXT_SUCCESS` | `--kui-color-text-success` | Success state |
| `KUI_COLOR_TEXT_WARNING` | `--kui-color-text-warning` | Warning state |
| `KUI_COLOR_TEXT_DANGER` | `--kui-color-text-danger` | Error/danger state |
| `KUI_COLOR_TEXT_INFO` | `--kui-color-text-info` | Info state |
| `KUI_COLOR_TEXT_INFO_STRONG` | `--kui-color-text-info-strong` | Strong info |
| `KUI_COLOR_TEXT_DISABLED` | `--kui-color-text-disabled` | Disabled text |
| `KUI_COLOR_TEXT_DECORATIVE_AQUA` | `--kui-color-text-decorative-aqua` | Accent color (most used) |
| `KUI_COLOR_TEXT_DECORATIVE_PURPLE` | `--kui-color-text-decorative-purple` | Purple accent |
| `KUI_COLOR_TEXT_DECORATIVE_PURPLE_STRONG` | `--kui-color-text-decorative-purple-strong` | Strong purple |

### Background Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_COLOR_BACKGROUND` | `--kui-color-background` | Base background (white) |
| `KUI_COLOR_BACKGROUND_PRIMARY` | `--kui-color-background-primary` | Primary bg |
| `KUI_COLOR_BACKGROUND_PRIMARY_STRONGEST` | `--kui-color-background-primary-strongest` | Strong primary bg |
| `KUI_COLOR_BACKGROUND_PRIMARY_WEAKEST` | `--kui-color-background-primary-weakest` | Weak primary bg |
| `KUI_COLOR_BACKGROUND_NEUTRAL_WEAKEST` | `--kui-color-background-neutral-weakest` | Lightest gray bg |
| `KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER` | `--kui-color-background-neutral-weaker` | Light gray bg |
| `KUI_COLOR_BACKGROUND_DANGER` | `--kui-color-background-danger` | Error bg |
| `KUI_COLOR_BACKGROUND_DISABLED` | `--kui-color-background-disabled` | Disabled bg |
| `KUI_COLOR_BACKGROUND_TRANSPARENT` | `--kui-color-background-transparent` | Transparent |
| `KUI_COLOR_BACKGROUND_INFO_WEAKEST` | `--kui-color-background-info-weakest` | Info bg |
| `KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST` | `--kui-color-background-decorative-purple-weakest` | Purple accent bg |

### Border Colors

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_COLOR_BORDER` | `--kui-color-border` | Standard borders |
| `KUI_COLOR_BORDER_PRIMARY` | `--kui-color-border-primary` | Primary/focus borders |
| `KUI_COLOR_BORDER_DECORATIVE_PURPLE` | `--kui-color-border-decorative-purple` | Decorative borders |

---

## Spacing Tokens

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `KUI_SPACE_0` | `--kui-space-0` | 0px | Reset |
| `KUI_SPACE_20` | `--kui-space-20` | 4px | Tight spacing |
| `KUI_SPACE_30` | `--kui-space-30` | 6px | Small spacing |
| `KUI_SPACE_40` | `--kui-space-40` | 8px | Default gap |
| `KUI_SPACE_50` | `--kui-space-50` | 12px | Medium spacing |
| `KUI_SPACE_60` | `--kui-space-60` | 16px | Standard padding |
| `KUI_SPACE_70` | `--kui-space-70` | 20px | Large spacing |
| `KUI_SPACE_80` | `--kui-space-80` | 24px | Section spacing |
| `KUI_SPACE_AUTO` | `--kui-space-auto` | auto | Auto spacing |

---

## Icon Size Tokens

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `KUI_ICON_SIZE_30` | `--kui-icon-size-30` | 18px | Small icons |
| `KUI_ICON_SIZE_40` | `--kui-icon-size-40` | 24px | Default icons (most used) |
| `KUI_ICON_SIZE_50` | `--kui-icon-size-50` | 32px | Large icons |
| `KUI_ICON_SIZE_60` | `--kui-icon-size-60` | 48px | Extra large icons |

---

## Typography Tokens

### Font Family

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_FONT_FAMILY_TEXT` | `--kui-font-family-text` | UI/body text |
| `KUI_FONT_FAMILY_CODE` | `--kui-font-family-code` | Monospace/code |

### Font Size

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `KUI_FONT_SIZE_20` | `--kui-font-size-20` | 11px | Extra small |
| `KUI_FONT_SIZE_30` | `--kui-font-size-30` | 12px | Small/caption |
| `KUI_FONT_SIZE_40` | `--kui-font-size-40` | 14px | Body (default) |
| `KUI_FONT_SIZE_50` | `--kui-font-size-50` | 16px | Large body |
| `KUI_FONT_SIZE_60` | `--kui-font-size-60` | 18px | Heading |

### Font Weight

| Token | CSS Variable | Value | Usage |
|-------|--------------|-------|-------|
| `KUI_FONT_WEIGHT_REGULAR` | `--kui-font-weight-regular` | 400 | Normal text |
| `KUI_FONT_WEIGHT_SEMIBOLD` | `--kui-font-weight-semibold` | 600 | Emphasis |
| `KUI_FONT_WEIGHT_BOLD` | `--kui-font-weight-bold` | 700 | Strong emphasis |

### Line Height

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_LINE_HEIGHT_20` | `--kui-line-height-20` | Tight line height |
| `KUI_LINE_HEIGHT_30` | `--kui-line-height-30` | Default (for 12px font) |
| `KUI_LINE_HEIGHT_40` | `--kui-line-height-40` | Default (for 14px font) |

---

## Border Tokens

### Border Width

| Token | CSS Variable | Value |
|-------|--------------|-------|
| `KUI_BORDER_WIDTH_0` | `--kui-border-width-0` | 0px |
| `KUI_BORDER_WIDTH_10` | `--kui-border-width-10` | 1px |
| `KUI_BORDER_WIDTH_20` | `--kui-border-width-20` | 2px |

### Border Radius

| Token | CSS Variable | Value |
|-------|--------------|-------|
| `KUI_BORDER_RADIUS_20` | `--kui-border-radius-20` | 4px |
| `KUI_BORDER_RADIUS_30` | `--kui-border-radius-30` | 6px |
| `KUI_BORDER_RADIUS_40` | `--kui-border-radius-40` | 8px |
| `KUI_BORDER_RADIUS_CIRCLE` | `--kui-border-radius-circle` | 50% |

---

## Shadow Tokens

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_SHADOW` | `--kui-shadow` | Default shadow |
| `KUI_SHADOW_BORDER` | `--kui-shadow-border` | Border-like shadow |
| `KUI_SHADOW_BORDER_PRIMARY` | `--kui-shadow-border-primary` | Primary border shadow |
| `KUI_SHADOW_BORDER_PRIMARY_WEAK` | `--kui-shadow-border-primary-weak` | Weak primary shadow |
| `KUI_SHADOW_BORDER_PRIMARY_STRONGEST` | `--kui-shadow-border-primary-strongest` | Strong primary shadow |
| `KUI_SHADOW_BORDER_DANGER` | `--kui-shadow-border-danger` | Danger border shadow |
| `KUI_SHADOW_BORDER_DANGER_STRONG` | `--kui-shadow-border-danger-strong` | Strong danger shadow |
| `KUI_SHADOW_BORDER_DISABLED` | `--kui-shadow-border-disabled` | Disabled shadow |
| `KUI_SHADOW_FOCUS` | `--kui-shadow-focus` | Focus ring shadow |

---

## Animation Tokens

| Token | CSS Variable | Usage |
|-------|--------------|-------|
| `KUI_ANIMATION_DURATION_20` | `--kui-animation-duration-20` | Transition duration |

---

## Usage Patterns

### CSS with Fallback (Recommended)
```scss
.element {
  color: var(--kui-color-text-neutral, #6c7489);
  padding: var(--kui-space-60);
  border-radius: var(--kui-border-radius-30);
}
```

### TypeScript for Dynamic Values
```typescript
<IconComponent
  :size="KUI_ICON_SIZE_40"
  :color="KUI_COLOR_TEXT_DECORATIVE_AQUA"
/>
```

### SCSS Variables (via import)
```scss
@use "@kong/design-tokens/tokens/scss/variables" as *;

.element {
  font-size: $kui-font-size-40;
  background: $kui-color-background-neutral-weakest;
}
```

---

## Most Used Tokens in Codebase

| Token | Count | Category |
|-------|-------|----------|
| `KUI_ICON_SIZE_40` | 92 | Icons |
| `KUI_COLOR_TEXT_DECORATIVE_AQUA` | 71 | Colors |
| `KUI_COLOR_TEXT_NEUTRAL` | 26 | Colors |
| `KUI_ICON_SIZE_30` | 18 | Icons |
| `KUI_SPACE_40` | 8 | Spacing |
| `KUI_COLOR_TEXT_PRIMARY` | 6 | Colors |
