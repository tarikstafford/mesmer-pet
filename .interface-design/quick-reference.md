# Quick Design Reference

## Color Usage at a Glance

### Primary Actions
```tsx
// Main CTAs, primary buttons
background: 'linear-gradient(135deg, var(--lavender), var(--lavender-deep))'
boxShadow: 'var(--glow-lavender)'
```

### Nurture Actions (Feed, Care)
```tsx
background: 'linear-gradient(135deg, var(--moss), var(--moss-deep))'
boxShadow: 'var(--glow-moss)'
```

### Affection/Social (Breeding, Friends)
```tsx
background: 'linear-gradient(135deg, var(--rose), var(--rose-deep))'
boxShadow: 'var(--glow-rose)'
```

### Energy/Activity
```tsx
background: 'linear-gradient(135deg, var(--cyan), var(--cyan-deep))'
boxShadow: 'var(--glow-cyan)'
```

### Legendary/Special
```tsx
background: 'linear-gradient(135deg, var(--gold), var(--gold-deep))'
boxShadow: 'var(--glow-gold)'
```

### Health/Critical
```tsx
background: 'linear-gradient(135deg, var(--ember), var(--ember-dim))'
boxShadow: 'var(--glow-ember)'
```

---

## Component Patterns

### Card
```tsx
<div className="p-6 rounded-2xl" style={{
  background: 'var(--parchment-rich)',
  border: '1.5px solid var(--border-soft)',
  boxShadow: 'var(--shadow-sm)'
}}>
```

### Button — Primary
```tsx
<button className="px-6 py-3 text-white rounded-xl hover:scale-105 transition-all" style={{
  background: 'linear-gradient(135deg, var(--lavender), var(--lavender-deep))',
  boxShadow: 'var(--glow-lavender)'
}}>
  Action Text
</button>
```

### Button — Secondary
```tsx
<button className="px-6 py-3 rounded-xl hover:scale-105 transition-all" style={{
  background: 'var(--parchment-deep)',
  border: '1.5px solid var(--border-soft)',
  color: 'var(--ink)'
}}>
  Action Text
</button>
```

### Success Message
```tsx
<div className="p-4 rounded-2xl" style={{
  background: 'rgba(159, 192, 136, 0.15)',
  border: '1.5px solid var(--moss)',
  boxShadow: 'var(--glow-moss)'
}}>
  Success message
</div>
```

### Error/Warning Message
```tsx
<div className="p-4 rounded-2xl" style={{
  background: 'rgba(244, 165, 174, 0.15)',
  border: '1.5px solid var(--rose-deep)',
  boxShadow: 'var(--glow-rose)'
}}>
  Error message
</div>
```

### Vitality Orb
```tsx
import VitalityOrb from '@/components/VitalityOrb'

<VitalityOrb
  stat="health"      // 'health' | 'happiness' | 'energy' | 'hunger'
  value={85}
  label="Health"
  icon="❤️"
/>
```

---

## Text Styling

### Heading (Large)
```tsx
<h1 className="text-4xl font-bold" style={{
  background: 'linear-gradient(135deg, var(--lavender), var(--rose))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
}}>
  Enchanted Heading
</h1>
```

### Heading (Standard)
```tsx
<h2 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
  Section Title
</h2>
```

### Body Text
```tsx
<p style={{ color: 'var(--ink-soft)' }}>
  Body content
</p>
```

### Caption/Meta
```tsx
<span className="text-sm" style={{ color: 'var(--ink-whisper)' }}>
  Caption text
</span>
```

---

## Badge Patterns

### Legendary Trait
```tsx
<span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{
  background: 'linear-gradient(135deg, rgba(218,165,95,0.2), rgba(240,199,133,0.2))',
  border: '1px solid var(--gold)',
  color: 'var(--gold-deep)'
}}>
  🌟 Legendary
</span>
```

### Rare Trait
```tsx
<span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{
  background: 'rgba(184,163,217,0.15)',
  border: '1px solid var(--lavender)',
  color: 'var(--lavender-deep)'
}}>
  Rare Trait
</span>
```

### Common Trait
```tsx
<span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{
  background: 'var(--parchment-deep)',
  border: '1px solid var(--border-soft)',
  color: 'var(--ink-soft)'
}}>
  Common Trait
</span>
```

---

## Animations

### Pulse Glow (Healthy)
```css
animation: pulse-glow 2s ease-in-out infinite;

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
```

### Pulse Urgent (Low Health)
```css
animation: pulse-urgent 1s ease-in-out infinite;

@keyframes pulse-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Hover Scale
```tsx
className="hover:scale-105 transition-all"
```

---

## Spacing Scale

Use these values for consistent spacing:

- **8px** — Tight gaps (icons, inline elements)
- **12px** — Small gaps (list items, badges)
- **16px** — Default gap (cards, sections)
- **20px** — Medium gap (card internal padding)
- **24px** — Large gap (section padding)
- **32px** — XL gap (major sections)
- **48px** — XXL gap (page sections)

---

## Border Radius

- **8px** — Small elements (badges, small buttons)
- **12px** — Buttons, inputs
- **16px** — Cards, panels
- **20px** — Large panels, modals
- **9999px** — Pills, orbs, circular elements

---

## Enchanted Language Replacements

Use this language to reinforce the magical world:

| Old (Generic) | New (Enchanted) |
|--------------|----------------|
| Create Pet | Summon Companion |
| Feed Pet | Nurture |
| Chat | Commune |
| Your Pets | Your Companions |
| Pet List | Menagerie |
| Breed Pets | Breed Companions |
| Learn Breeding | Breeding Lore |
| Health Points | Vitality |
| Stats | Life Signs |
| Skills | Mystical Abilities |
| Marketplace | Enchanted Bazaar |
| Friends | Fellow Keepers |

---

## Common Mistakes to Avoid

❌ **Don't:** Use pure white (`#ffffff`) or pure black (`#000000`)
✅ **Do:** Use parchment tones and warm ink

❌ **Don't:** Use harsh borders or thick strokes
✅ **Do:** Use subtle borders with low opacity

❌ **Don't:** Use dramatic shadows
✅ **Do:** Use soft inner shadows + gentle glows

❌ **Don't:** Use generic labels like "Submit" or "Click Here"
✅ **Do:** Use enchanted language that fits the world

❌ **Don't:** Mix harsh clinical colors with warm parchment
✅ **Do:** Keep everything warm and cohesive

---

## Testing Checklist

When implementing new components, verify:

- [ ] Background is warm parchment variant (not white)
- [ ] Text uses ink variants (not black/gray-900)
- [ ] Borders are subtle (not harsh)
- [ ] Interactive elements have glows (not hard shadows)
- [ ] Hover states scale up slightly (1.05)
- [ ] Transitions are smooth (all 0.2s or similar)
- [ ] Language is enchanted (not generic)
- [ ] Colors have semantic meaning (not decorative)

---

## Browser DevTools Tip

To see the design system in action, inspect any element and check the computed styles. All CSS variables are defined in `globals.css` and can be seen in DevTools.

```
var(--parchment)       → #fdfaf5
var(--lavender)        → #b8a3d9
var(--glow-lavender)   → 0 0 16px rgba(184, 163, 217, 0.2)
```
