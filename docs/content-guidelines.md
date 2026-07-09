# Kong UI Content Guidelines (Quick Reference)

> Condensed from **Kong UI Content Guidelines v1.0.6**. Follow these rules for ALL user-facing copy in the prototype.

---

## Style and Voice

- **Brand personality**: Confident, clear, technical
- **Tone**: Approachable but not overly playful. Clear and confident without being sterile or condescending.
- **No "please"** in instructions. Just tell the user what to do.
- **Second person voice** ("you") — not passive voice.
- **No slang, idioms, or emojis** in the UI.
- **No humor** — we're not trying to be funny or whimsical.
- **Plain language** — explain what something is AND why it matters. No unnecessary jargon.

---

## Sentence Case (Critical)

Use **sentence case** for ALL UI text. Only capitalize:
1. The first word of a sentence/phrase
2. Proper nouns (Kong product names)

### Kong proper nouns (always capitalized)
- Kong Konnect, Kong Ingress Controller, Konnect Plus, Konnect Enterprise
- Kong Gateway Enterprise, Gateway Manager, Mesh Manager, Konnect Vault
- Dev Portal*, Service Catalog*, Advanced Analytics*

### Common nouns (lowercase unless starting a sentence)
- analytics, certificate, control plane, data plane, gateway, gateway service
- plugin, route, service, upstream, vault, endpoint, health check
- model, provider, consumer, policy, agent, vector store

> Items with * are proper nouns ONLY when referring to the specific Kong product.

---

## Punctuation and Symbols

| Rule | Do | Don't |
|------|-----|-------|
| Full sentences | End with a period. | Missing period |
| Oxford comma | "services, routes, and plugins" | "services, routes and plugins" |
| Ampersands | Use "and" | Use "&" (except in extremely space-constrained nav) |
| Em dashes | Use — (not - or --) for asides | Use hyphens for asides |
| Exclamation points | Rarely, only for welcoming/celebratory moments | "Let's configure your first route!" |
| Colons after labels | No colon | "Name:" |
| Numbers 0-9 | Spell out in descriptive copy ("up to three routes") | "up to 3 routes" |
| Numbers 10+ | Use digits | Spell out |
| Numbers > 999 | Use comma separator: 5,900 | 5900 |

---

## Dates and Times

- **UI display**: "Apr 2, 2025" or "Apr 2, 2025, 10:56 AM"
- **With timezone** (analytics/tracing): "Apr 2, 2025 (UTC-5)"
- **Exports/logs**: ISO 8601 "2025-04-02T14:00:00Z"
- **Never**: "04/02/2025" or ISO format in general UI

---

## UI Component Copy

### Error messages
- Explain the issue clearly
- Suggest next steps when possible
- Hide raw technical details — translate to user-friendly terms
- Use full sentences with periods

### Empty states
- **L1** (top-level product): What it is, why you'd use it, value statements
- **L2** (sub-product/feature): One sentence — what it does and why
- **L3** (sub-capability, no data): Short title + one sentence
- Start sentences with a verb. Be concise, scannable, action-oriented.

### Tooltips
- Explain what something is AND why it's important
- Use full sentences with periods
- Ideal: 1-2 sentences, 100 characters or less (max 250 for complex concepts)
- Don't just repeat the label name

### Input placeholders
- Show a sample format: "e.g., my-service-name" or "e.g., example@domain.com"
- Don't use "Enter a name" — that adds no value beyond the label

### Help text
- Reserve for essential information only
- Use full sentences, 1 sentence, 100 characters or less
- Don't add if placeholder/tooltip is sufficient

### Buttons
- Use action verbs: "Add", "Create", "Save", "Edit", "Delete", "Configure"
- Don't use: "Submit", "Go", "OK"
- Don't use "please" in button-adjacent text

### Links (standalone)
- Start with a verb: "Learn more", "View documentation", "View advanced settings"
- Don't use just nouns: "Settings", "Documentation"

### Links (within text)
- Apply link to descriptive phrase, not "click here"

### Actions menus
- Use verbs: "View details", "Copy ID", "Edit", "Delete"
- Don't use just nouns: "Details", "Settings"

### Form field labels
- Use concise, descriptive nouns: "Name", "URL", "ID"
- No colons after labels
- No verbs in labels: "Name" not "Enter a name"

---

## Common Copy Conventions

- **"Third-party"** in sentences; "3rd-party" only in space-constrained UI
- **"Copy"** when pasting elsewhere; **"Duplicate"** when replicating an object in the UI
- **Pricing**: "$XX per resource" (spell out "per")
- **login** (noun) / **log in** (verb)
- **setup** (noun) / **set up** (verb)
- **email** (not e-mail)
- **endpoint** (one word)
- **health check** (no hyphen)
- **e.g.,** and **i.e.,** (with trailing comma)
- **real-time** (hyphenated when used as adjective)

---

## Quick Checklist for New Copy

- [ ] Sentence case? (no Title Case for common nouns)
- [ ] Full sentences end with periods?
- [ ] No "please"?
- [ ] Active voice, second person ("you")?
- [ ] Oxford comma in lists of 3+?
- [ ] "and" not "&"?
- [ ] Tooltips explain what AND why, with periods?
- [ ] Placeholders show example format ("e.g., ...")?
- [ ] Buttons use action verbs?
- [ ] No colons after form labels?
- [ ] No exclamation points (unless welcoming moment)?
- [ ] Plain language, no jargon?
