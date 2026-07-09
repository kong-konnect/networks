# Sync Guide: Keeping Shims Updated with Production

This guide documents how to keep the prototype's component shims in sync with the production source code.

## Shim-to-Production File Mapping

| Prototype Shim | Production Source |
|----------------|------------------|
| `src/components/EntityBaseTable.vue` | `public-ui-components/packages/entities/entities-shared/src/components/entity-base-table/EntityBaseTable.vue` |
| `src/components/EntityBaseForm.vue` | `public-ui-components/packages/entities/entities-shared/src/components/entity-base-form/EntityBaseForm.vue` |
| `src/components/EntityFormSection.vue` | `public-ui-components/packages/entities/entities-shared/src/components/entity-form-section/EntityFormSection.vue` |
| `src/components/EntityFormBlock.vue` | `public-ui-components/packages/entities/entities-shared/src/components/entity-form-block/EntityFormBlock.vue` |

## Page Pattern References

| Pattern | Production Reference |
|---------|---------------------|
| List pages | `konnect-ui-apps/apps/event-gateway/src/pages/` (most current) |
| Form pages | `konnect-ui-apps/apps/ai-manager/src/pages/` (AI-specific) |
| Detail pages | `konnect-ui-apps/apps/gateway-manager/src/pages/` (most comprehensive) |
| Sidebar/shell | `shared-ui-components/packages/core/konnect-app-shell/` |
| Route forms | `public-ui-components/packages/entities/entities-routes/` |

## When to Sync

Check for updates when:
- A new version of `@kong-ui-public/entities-shared` is released
- Production codebases make significant changes to page patterns
- New Kongponents are released that affect the shims
- Quarterly review (minimum)

## How to Sync

### 1. Check for prop/slot/event changes

```bash
# Compare EntityBaseTable props
diff <(grep -A2 'defineProps' src/components/EntityBaseTable.vue) \
     <(grep -A2 'defineProps' ../public-ui-components/packages/entities/entities-shared/src/components/entity-base-table/EntityBaseTable.vue)
```

### 2. Review production changelog

Check the `public-ui-components` repo for:
- New props added to entity components
- Breaking changes in component APIs
- New shared components that should be shimmed

### 3. Update shim

When updating a shim:
1. Read the production component thoroughly
2. Add new props/slots/events that are relevant for prototyping
3. Skip production features that require API dependencies (axios, fetch URLs, etc.)
4. Update `docs/component-shims.md` with the new API surface
5. Test that existing pages still work after the update

### 4. Update documentation

After syncing:
- Update `docs/component-shims.md` with any new props/events
- Update `docs/templates/*.md` if page patterns changed
- Update memory files if conventions changed

## What NOT to Sync

- API integration logic (axios, fetch URLs, API configs)
- i18n implementation (prototype uses hardcoded English strings)
- Test utilities and test-specific code
- Build/CI configuration
- Pinia store integration (prototype uses composables)

## Design Token Updates

When `@kong/design-tokens` is updated:
1. Run `npm update @kong/design-tokens`
2. Check `docs/tokens.md` for any new tokens
3. Search for hardcoded values that could now use new tokens
4. Verify build passes: `npm run build`
