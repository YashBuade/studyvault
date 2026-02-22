# StudyVault Design System
## Premium, Google-Inspired Design Language

### Design Philosophy
- **Clarity First**: Every element has a clear purpose
- **Generous Whitespace**: Breathing room enhances comprehension
- **Subtle Depth**: Elevation through shadow, not visual noise
- **Micro-interactions**: Smooth, purposeful feedback
- **Accessibility**: WCAG AAA contrast and keyboard navigation
- **Performance**: Clean CSS, optimized animations

---

## Color System

### Primary Palette
- **Primary Blue**: `#3B82F6` (RGB: 59 130 246)
- **Primary Hover**: `#2563EB` (RGB: 37 99 235)
- **Primary Light**: `#DBEAFE` (RGB: 219 234 254)
- **Primary Soft**: `#EFF6FF` (RGB: 239 245 255)

### Semantic Colors
- **Success**: `#10B981` (RGB: 16 185 129)
- **Warning**: `#F59E0B` (RGB: 245 158 11)
- **Error**: `#EF4444` (RGB: 239 68 68)
- **Info**: `#3B82F6` (RGB: 59 130 246)

### Neutral Scale (Light Mode)
- **Text Primary**: `#0F172A` (RGB: 15 23 42)
- **Text Secondary**: `#475569` (RGB: 71 85 105)
- **Text Tertiary**: `#64748B` (RGB: 100 116 139)
- **Text Disabled**: `#94A3B8` (RGB: 148 163 184)
- **Border**: `#E2E8F0` (RGB: 226 232 240)
- **Surface**: `#FFFFFF` (RGB: 255 255 255)
- **Surface Elevated**: `#F8FAFC` (RGB: 248 250 252)
- **Background**: `#FAFAFA` (RGB: 250 250 250)

### Neutral Scale (Dark Mode)
- **Text Primary**: `#F8FAFC` (RGB: 248 250 252)
- **Text Secondary**: `#CBD5E1` (RGB: 203 213 225)
- **Text Tertiary**: `#94A3B8` (RGB: 148 163 184)
- **Text Disabled**: `#475569` (RGB: 71 85 105)
- **Border**: `#334155` (RGB: 51 65 85)
- **Surface**: `#0F172A` (RGB: 15 23 42)
- **Surface Elevated**: `#1E293B` (RGB: 30 41 59)
- **Background**: `#030712` (RGB: 3 7 18)

---

## Typography System

### Font Family
- **Primary**: Inter, system-ui, sans-serif
- **Code**: 'Fira Code' or 'Monaco'

### Scale Hierarchy
```
Display:   48px, 600 font-weight, -1.2px letter-spacing
Headline:  36px, 600 font-weight, -0.5px letter-spacing
Title:     28px, 600 font-weight, normal letter-spacing
Subtitle:  22px, 500 font-weight, 0.15px letter-spacing
Body Large: 18px, 400 font-weight, 0.5px letter-spacing
Body:      16px, 400 font-weight, 0.5px letter-spacing
Label:     14px, 500 font-weight, 0.1px letter-spacing
Small:     12px, 400 font-weight, 0.4px letter-spacing
Tiny:      11px, 500 font-weight, 0.5px letter-spacing
```

### Line Height
- Display: 1.2
- Headlines: 1.3
- Body text: 1.5
- Labels: 1.4

---

## Spacing System

**Base unit: 4px**

```
xs:    4px    (0.25rem)
sm:    8px    (0.5rem)
md:   16px    (1rem)
lg:   24px    (1.5rem)
xl:   32px    (2rem)
2xl:  48px    (3rem)
3xl:  64px    (4rem)
4xl:  80px    (5rem)
```

**Usage:**
- Button padding: `md` horizontal, `sm`/`md` vertical
- Card padding: `lg` to `xl`
- Section margins: `2xl` to `3xl`
- Component gaps: `sm` to `md`

---

## Border Radius

```
sm:   6px    (0.375rem)
md:  10px    (0.625rem)
lg:  16px    (1rem)
xl:  24px    (1.5rem)
full: 9999px
```

**Usage:**
- Inputs & Buttons: `md` (10px)
- Cards: `lg` (16px)
- Large containers: `xl` (24px)
- Avatars: `full`

---

## Elevation & Shadows

### Light Mode Shadows
```
sm:  0 1px 2px rgb(0 0 0 / 0.05)
md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
hover: 0 20px 25px -5px rgb(0 0 0 / 0.15)
```

### Dark Mode Shadows
```
sm:  0 1px 3px rgb(0 0 0 / 0.12), 0 1px 2px rgb(0 0 0 / 0.24)
md:  0 3px 6px rgb(0 0 0 / 0.15), 0 2px 4px rgb(0 0 0 / 0.12)
lg:  0 10px 20px rgb(0 0 0 / 0.19), 0 6px 6px rgb(0 0 0 / 0.23)
xl:  0 15px 35px rgb(0 0 0 / 0.2), 0 8px 12px rgb(0 0 0 / 0.15)
hover: 0 15px 35px rgb(0 0 0 / 0.25)
```

---

## Motion & Easing

### Duration
- `fast`: 150ms (micro-interactions, hover states)
- `base`: 200ms (standard transitions)
- `slow`: 300ms (page transitions)
- `slower`: 500ms (complex animations)

### Easing Curves
```
ease-out-cubic:    cubic-bezier(0.16, 1, 0.3, 1)
ease-in-out:       cubic-bezier(0.4, 0, 0.2, 1)
ease-in-cubic:     cubic-bezier(0.52, 0, 0.74, 1)
ease-out-bounce:   cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Common Animations
- **Hover Scale**: 1.02x with `ease-out-cubic`
- **Press Scale**: 0.98x with `ease-in-cubic`
- **Fade In**: `opacity 0→1, transform translateY(8px)→0`
- **Slide In**: `transform translateX/Y` with `ease-out-cubic`

---

## Component Patterns

### Buttons
**Primary Button:**
- Background: Primary Blue, hover: darken to Primary Hover
- Padding: `12px 24px` (md px, sm/md py)
- Border radius: `md` (10px)
- Font: 14px, 500, letter-spacing 0.1px
- Shadow on hover: `lg`
- State: Disabled opacity 50%

**Ghost Button:**
- Background: transparent, hover: subtle bg (light/dark adaptive)
- Border: none
- Text: Primary color
- Smooth transition: `ease-in-out`

### Input Fields
**Standard Input:**
- Background: Surface + light tint (light) or elevated surface (dark)
- Border: 1px solid Border color
- Padding: `12px 16px`
- Font: 16px, 400
- Border radius: `md` (10px)
- Focus: Blue ring (2px, 4px offset), border blue
- Error: Red border, red focus ring
- Height: 44px (ensures mobile tap target)

### Cards
**Default Card:**
- Background: Surface
- Border: 1px solid Border
- Border radius: `lg` (16px)
- Padding: `24px`
- Shadow: `sm` (light mode), `md` (dark mode)
- Hover: subtle shadow increase

### Navigation
- Height: 64px (desktop), 56px (mobile)
- Background: Surface with subtle backdrop blur
- Border bottom: 1px solid Border
- Item padding: `12px 16px`

---

## Authentication Design

### Login/Signup Layout
- **Two-column on desktop**: Left column gradient bg (55%), right form (45%)
- **Single column on mobile**: Stacked layout
- **Max width form**: 420px
- **Left column**: Logo, headline, supporting text, trust signals

### Form Fields
- Field group spacing: `md` (16px)
- Label size: 14px, 500 weight
- Input height: 44px
- Helper text: 12px, secondary color
- Error message: 12px, error color with icon
- Password strength indicator on signup

### Google Sign-In Button
- Height: 40px
- Background: White (light) / adjusted (dark mode)
- Border: 1px solid border
- Border radius: `sm` (6px)
- Icon + text center-aligned
- Standard Google branding

---

## Responsiveness

### Breakpoints
```
xs: 0px     (mobile)
sm: 640px   (portrait tablet)
md: 768px   (landscape tablet)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
2xl: 1536px (ultra-wide)
```

### Mobile-First Approach
- Base styles work on mobile
- Add `md:` and `lg:` modifiers for larger screens
- Padding: `sm`/`md` on mobile, `lg`/`xl` on desktop
- Typography: Scale down on mobile

---

## Accessibility Standards
- **Contrast Ratio**: Minimum 7:1 for text (WCAG AAA)
- **Focus States**: Visible 2px ring on all interactive elements
- **Keyboard Navigation**: All inputs/buttons accessible via Tab
- **Semantic HTML**: Use proper heading hierarchy
- **ARIA Labels**: On icons and interactive elements
- **Touch Targets**: Minimum 44px height/width

---

## Dark Mode Implementation
1. Define dual color tokens in CSS variables
2. Apply `.dark` class on root element
3. Backgrounds: Slightly lighter in dark (not pure #000)
4. Surfaces: Elevated when needed for contrast
5. Text: Reduced opacity for secondary text
6. Borders: Subtle, slightly brighter on dark
7. Shadows: Softer in dark mode
8. All transitions smooth between modes

---

## Implementation Notes
- Use CSS variables for all design tokens
- Leverage Tailwind for consistency
- Components inherit spacing from parent context
- Never hardcode colors; use token variables
- Test all changes in both light and dark modes
- Use `transition-all duration-200` for smooth state changes

