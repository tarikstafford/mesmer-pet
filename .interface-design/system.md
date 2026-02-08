# Mesmer Design System

## Direction

**Enchanted Storybook** — Warm as candlelight, mysterious as twilight, wonder-inducing as discovering something truly alive. This is a magical tome where creatures come to life, not a clinical pet simulator.

## Feel

Caring for actual magical beings in an enchanted menagerie. Stats aren't numbers—they're vitality signs of living souls. Every interaction should feel like you're nurturing a mystical companion, not managing game data.

---

## Color System

### Foundations

```css
/* Base Surfaces — Warm parchment world */
--parchment: #fdfaf5;           /* Primary background — aged paper */
--parchment-deep: #f9f5ed;      /* Slightly deeper — layered paper */
--parchment-rich: #f4ede0;      /* Card surfaces — well-loved pages */

/* Text — Warm ink */
--ink: #3d2f1f;                 /* Primary text — rich sepia */
--ink-soft: #6b5d4f;            /* Secondary text — faded ink */
--ink-whisper: #9a8a7a;         /* Tertiary text — gentle note */

/* Borders — Subtle definition */
--border-faint: rgba(139, 108, 76, 0.12);  /* Barely visible */
--border-soft: rgba(139, 108, 76, 0.18);   /* Gentle structure */
--border-warm: rgba(139, 108, 76, 0.25);   /* Defined edges */
```

### Magical Essence Colors

```css
/* Vitality — Living warmth */
--ember: #f59e42;               /* Health, energy, life force */
--ember-glow: #ffc875;          /* Highlights and shimmer */
--ember-dim: #d68536;           /* Low vitality warning */

/* Enchantment — Magical energy */
--lavender: #b8a3d9;            /* Magic, mystery, wonder */
--lavender-bright: #d4c4f0;     /* Active magic shimmer */
--lavender-deep: #9880c2;       /* Deep enchantment */

/* Affection — Bonds and care */
--rose: #f4a5ae;                /* Happiness, bonds, love */
--rose-bright: #ffc4cd;         /* Joy and delight */
--rose-deep: #e88896;           /* Strong connection */

/* Growth — Nurturing energy */
--moss: #9fc088;                /* Growth, feeding, care */
--moss-bright: #c0dbaf;         /* Flourishing life */
--moss-deep: #7ea76a;           /* Steady nurturing */

/* Mystic — Bioluminescent glow */
--cyan: #6fc6c5;                /* Energy, curiosity, vitality */
--cyan-bright: #9ae0df;         /* Sparkle and wonder */
--cyan-deep: #51aba9;           /* Deep magic */

/* Legendary — Ancient power */
--gold: #daa55f;                /* Legendary traits, achievements */
--gold-bright: #f0c785;         /* Radiant shine */
--gold-deep: #c18d47;           /* Deep treasure */
```

### Semantic Colors

```css
/* Success — Gentle celebration */
--success-bg: #e8f5e3;
--success-border: #9fc088;
--success-text: #4a6e3e;

/* Warning — Soft concern */
--warning-bg: #fef3e8;
--warning-border: #f59e42;
--warning-text: #8b5a1f;

/* Critical — Urgent care needed */
--critical-bg: #fee;
--critical-border: #e88896;
--critical-text: #8b2f3a;

/* Info — Mystical knowledge */
--info-bg: #f0edfa;
--info-border: #b8a3d9;
--info-text: #4a3d6b;
```

---

## Typography

**Font:** System UI with warmth — '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "San Francisco", sans-serif'

### Scale

```css
--text-xs: 0.75rem;      /* 12px — whispers, captions */
--text-sm: 0.875rem;     /* 14px — body text */
--text-base: 1rem;       /* 16px — primary reading */
--text-lg: 1.125rem;     /* 18px — emphasis */
--text-xl: 1.25rem;      /* 20px — small headings */
--text-2xl: 1.5rem;      /* 24px — section titles */
--text-3xl: 1.875rem;    /* 30px — page titles */
--text-4xl: 2.25rem;     /* 36px — hero headings */
```

### Weights

- **400** — Regular body text
- **500** — Medium emphasis, labels
- **600** — Semibold headings, important
- **700** — Bold headlines, CTAs

---

## Spacing

Base unit: **4px**

Common values: 8, 12, 16, 20, 24, 32, 40, 48, 64

Use organic spacing — not everything needs to be perfectly aligned. Slight variations feel hand-crafted.

---

## Depth Strategy

**Soft Inner Shadows + Warm Glows** — No harsh drop shadows. Everything feels pressed into parchment or glowing with gentle magic.

```css
/* Pressed Paper — Subtle depth */
--shadow-inset: inset 0 1px 3px rgba(139, 108, 76, 0.08);

/* Gentle Lift — Cards and panels */
--shadow-sm: 0 1px 3px rgba(139, 108, 76, 0.08),
             0 1px 2px rgba(139, 108, 76, 0.06);

/* Floating Elements */
--shadow-md: 0 2px 8px rgba(139, 108, 76, 0.12),
             0 1px 3px rgba(139, 108, 76, 0.08);

/* Enchanted Glow — Interactive elements */
--glow-ember: 0 0 16px rgba(245, 158, 66, 0.2);
--glow-lavender: 0 0 16px rgba(184, 163, 217, 0.2);
--glow-rose: 0 0 16px rgba(244, 165, 174, 0.2);
```

---

## Border Radius

Organic, hand-crafted feel:

- Small elements: **8px**
- Cards: **16px**
- Buttons: **12px**
- Large panels: **20px**
- Orbs and circles: **9999px**

---

## Signature Component: Vitality Orbs

Replace all progress bars with glowing vitality orbs. Each stat becomes a living indicator:

### Structure

```jsx
<div className="vitality-orb">
  <div className="orb-glow" /> {/* Animated pulse */}
  <div className="orb-fill" style={{ width: `${value}%` }} />
  <div className="orb-label">
    <span className="stat-name">Health</span>
    <span className="stat-value">{value}</span>
  </div>
</div>
```

### States

- **Healthy (70-100):** Bright glow, gentle pulse
- **Moderate (40-69):** Steady glow, slower pulse
- **Low (< 40):** Dim glow, urgent pulse
- **Critical:** Ember dims to almost out

---

## Component Patterns

### Cards

```css
background: var(--parchment-rich);
border: 1.5px solid var(--border-soft);
border-radius: 16px;
box-shadow: var(--shadow-sm);
padding: 24px;
```

### Buttons — Primary (Magical Action)

```css
background: linear-gradient(135deg, var(--lavender), var(--lavender-deep));
color: white;
border-radius: 12px;
padding: 12px 24px;
font-weight: 600;
box-shadow: 0 0 12px rgba(184, 163, 217, 0.3);
transition: all 0.2s ease;

&:hover {
  box-shadow: var(--glow-lavender);
  transform: translateY(-1px);
}
```

### Buttons — Nurture (Care Action)

```css
background: linear-gradient(135deg, var(--moss), var(--moss-deep));
/* Similar pattern */
```

### Pet Stat Display

Each stat gets:
1. Icon (emoji or symbol)
2. Name in warm ink
3. Vitality orb (not progress bar)
4. Gentle glow matching stat type

---

## Key Principles

1. **No harsh contrasts** — Everything transitions smoothly
2. **Living elements** — Subtle animations make stats feel alive
3. **Warm everywhere** — Even whites have cream/amber tint
4. **Borders whisper** — Never shout for attention
5. **Glow, don't shadow** — Light emanates, doesn't cast darkness
6. **Organic spacing** — Slight variations feel crafted

---

## Implementation Notes

- Replace all `bg-white` with `bg-[var(--parchment)]` or equivalent
- Replace all progress bars with vitality orb components
- Add subtle pulse animations to health indicators
- Use warm gradients for important actions
- Inner shadows for depth, glows for magic
