# ZenRent Styling Guide

## Overview

This document outlines the comprehensive styling system for ZenRent, a property management platform. The design system ensures consistency across all components and provides guidelines for maintaining visual coherence throughout the application.

## Design System Architecture

ZenRent uses a modern, component-based design system built on:
- **Tailwind CSS 4.0** for utility-first styling
- **Headless UI** for accessible component primitives
- **Radix UI** for complex interactive components
- **shadcn/ui** component library (New York style)
- **Custom CSS variables** for theme management

## Typography

### Font Stack

#### Primary Font: Inter
- **Usage**: Body text, UI elements, general content
- **Implementation**: Google Fonts via Next.js font optimization
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Variable**: `--font-inter`

```css
font-family: var(--font-inter), Arial, sans-serif;
```

#### Display Font: Cabinet Grotesk
- **Usage**: Headings, titles, emphasis text, bold elements
- **Implementation**: Local font files (.otf format)
- **Weights**: 100-900 (complete family)
- **Variable**: `--font-cabinet`

```css
font-family: var(--font-cabinet), sans-serif;
```

### Typography Classes

```css
/* Headings automatically use Cabinet Grotesk */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-cabinet), sans-serif;
  font-weight: 700;
}

/* Title font utility */
.title-font {
  font-family: var(--font-cabinet), sans-serif;
  font-weight: 800;
}

/* Bold text uses Cabinet Grotesk instead of Inter Bold */
b, strong, .font-bold, .font-semibold {
  font-family: var(--font-cabinet), sans-serif;
}
```

### Font Hierarchy

| Element | Font | Weight | Size (Desktop) | Size (Mobile) |
|---------|------|--------|----------------|---------------|
| H1 | Cabinet Grotesk | 800 | 3xl (30px) | 2xl (24px) |
| H2 | Cabinet Grotesk | 700 | 2xl (24px) | xl (20px) |
| H3 | Cabinet Grotesk | 700 | xl (20px) | lg (18px) |
| Body | Inter | 400 | base (16px) | sm (14px) |
| Small | Inter | 400 | sm (14px) | xs (12px) |
| Button | Inter | 600 | sm (14px) | sm (14px) |

## Color System

### Brand Colors

#### Primary Palette
```css
/* Light Blue Accent */
--color-d9e8ff: #D9E8FF;
--color-d9e8ff-80: rgba(217, 232, 255, 0.8);
--color-d9e8ff-50: rgba(217, 232, 255, 0.5);
--color-d9e8ff-20: rgba(217, 232, 255, 0.2);
--color-d9e8ff-10: rgba(217, 232, 255, 0.1);

/* Dark Primary */
--btn-bg-primary: #740748;
```

#### Semantic Colors
```css
/* Background */
--background: #F9F7F7; /* Light warm gray */
--foreground: oklch(0.13 0.028 261.692); /* Dark text */

/* Cards & Surfaces */
--card: white;
--card-foreground: oklch(0.13 0.028 261.692);

/* Interactive Elements */
--primary: oklch(0.21 0.034 264.665); /* Dark blue-gray */
--primary-foreground: oklch(0.985 0.002 247.839); /* Near white */

/* Secondary */
--secondary: oklch(0.967 0.003 264.542); /* Light gray */
--secondary-foreground: oklch(0.21 0.034 264.665);

/* Borders */
--border: oklch(0.928 0.006 264.531); /* Light gray border */
--input: oklch(0.928 0.006 264.531);

/* Status Colors */
--destructive: oklch(0.577 0.245 27.325); /* Red */
--muted: oklch(0.967 0.003 264.542); /* Muted gray */
--accent: oklch(0.967 0.003 264.542); /* Accent gray */
```

#### Chart Colors
```css
--color-chart-1: #E9823F; /* Orange */
--color-chart-2: #29A3BE; /* Teal */
--color-chart-3: #4264CB; /* Blue */
--color-chart-4: #F5A623; /* Yellow */
--color-chart-5: #E95D3F; /* Red-orange */
```

### Color Usage Guidelines

| Use Case | Color | Class | Hex |
|----------|-------|-------|-----|
| Primary CTA | Light Blue | `bg-d9e8ff` | #D9E8FF |
| Secondary CTA | Dark Primary | `bg-[#740748]` | #740748 |
| Success | Green | `bg-green-600` | - |
| Warning | Amber | `bg-amber-500` | - |
| Error | Red | `bg-red-600` | - |
| Info | Blue | `bg-blue-600` | - |

## Component Styling

### Buttons

#### Primary Button (Light Blue)
```tsx
<button className="px-4 py-2 bg-[#D9E8FF] rounded-md text-sm font-medium text-black hover:bg-[#C8D7EE]">
  Primary Action
</button>
```

#### Secondary Button (Dark)
```tsx
<button className="px-4 py-2 bg-[#740748] rounded-md text-sm font-medium text-white hover:bg-[#5a0538]">
  Secondary Action
</button>
```

#### Button Variants
- **Solid**: Default style with background color
- **Outline**: Border with transparent background
- **Ghost**: No background, hover state only
- **Link**: Text-only with underline

### Cards

#### Standard Card
```tsx
<div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### Stats Card
```tsx
<div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
  <h3 className="text-sm font-cabinet-grotesk-bold text-gray-500">Metric Name</h3>
  <p className="mt-2 text-4xl font-bold text-gray-900">Value</p>
</div>
```

### Forms

#### Input Fields
```tsx
<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
```

#### Labels
```tsx
<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
  Field Label
</label>
```

### Navigation

#### Sidebar Items
```tsx
<Link className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:py-2 sm:text-sm/5">
  <Icon className="h-5 w-5" />
  <span>Navigation Item</span>
</Link>
```

#### Tab Navigation
```tsx
<button className="group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10">
  <span>Tab Name</span>
  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF503E]" />
</button>
```

## Icons

### Icon Libraries

#### Primary: Heroicons
- **Usage**: Main UI icons, navigation, actions
- **Style**: Outline (24px) and Solid (20px) variants
- **Import**: `@heroicons/react/24/outline` or `@heroicons/react/20/solid`

```tsx
import { HomeIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
```

#### Secondary: Lucide React
- **Usage**: Additional icons, charts, specialized UI
- **Style**: Consistent stroke-based design
- **Import**: `lucide-react`

```tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
```

#### Tertiary: Radix Icons
- **Usage**: Component-specific icons (from Radix UI)
- **Import**: `@radix-ui/react-icons`

### Icon Sizing Standards

| Context | Size | Class |
|---------|------|-------|
| Navigation | 20px | `h-5 w-5` |
| Buttons | 16px | `h-4 w-4` |
| Large Actions | 24px | `h-6 w-6` |
| Status Indicators | 12px | `h-3 w-3` |

### Icon Color Guidelines

```css
/* Default icon colors */
.icon-default { color: var(--color-zinc-500); }
.icon-active { color: var(--color-zinc-700); }
.icon-muted { color: var(--color-zinc-400); }
.icon-primary { color: var(--primary); }
.icon-destructive { color: var(--destructive); }
```

## Layout & Spacing

### Container Widths
```css
.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
```

### Spacing Scale
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Border Radius
```css
--radius: 0.625rem; /* 10px - Primary radius */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```

## Dark Mode Support

### CSS Variables for Dark Mode
```css
.dark {
  --background: oklch(0.13 0.028 261.692);
  --foreground: oklch(0.985 0.002 247.839);
  --card: oklch(0.13 0.028 261.692);
  --card-foreground: oklch(0.985 0.002 247.839);
  /* ... additional dark mode variables */
}
```

### Dark Mode Classes
- Use `dark:` prefix for dark mode variants
- Ensure sufficient contrast ratios
- Test all interactive states in both modes

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile-First Approach
- Default styles target mobile
- Use `sm:`, `md:`, `lg:` prefixes for larger screens
- Ensure touch targets are minimum 44px

## Accessibility

### Color Contrast
- **Normal text**: Minimum 4.5:1 ratio
- **Large text**: Minimum 3:1 ratio
- **Interactive elements**: Minimum 3:1 ratio

### Focus States
```css
.focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Screen Reader Support
- Use semantic HTML elements
- Provide `aria-label` for icon-only buttons
- Ensure proper heading hierarchy

## Animation & Transitions

### Standard Transitions
```css
.transition-default {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}
```

### Hover States
- Subtle color changes (10-20% opacity shift)
- Scale transforms for interactive elements
- Smooth transitions (200ms duration)

## Component Library Integration

### shadcn/ui Components
- **Style**: "new-york" variant
- **Base Color**: Gray
- **CSS Variables**: Enabled
- **Icon Library**: Lucide

### Headless UI Components
- Used for complex interactions (dialogs, dropdowns)
- Styled with Tailwind classes
- Consistent with design system colors

## Best Practices

### CSS Organization
1. Use CSS variables for theme values
2. Prefer utility classes over custom CSS
3. Group related styles together
4. Use consistent naming conventions

### Component Styling
1. Extract reusable patterns into components
2. Use TypeScript for prop validation
3. Implement proper error states
4. Ensure keyboard navigation works

### Performance
1. Use CSS-in-JS sparingly
2. Leverage Tailwind's purging
3. Optimize font loading
4. Minimize layout shifts

## File Structure

```
src/
├── app/
│   ├── globals.css          # Global styles & CSS variables
│   ├── fonts.ts            # Font configurations
│   └── components/         # App-specific components
├── components/
│   └── ui/                 # Reusable UI components
└── styles/
    └── globals.css         # Additional global styles
```

## Implementation Checklist

### Fonts
- [x] Cabinet Grotesk loaded and configured
- [x] Inter loaded via Google Fonts
- [x] Font variables properly set
- [x] Bold text uses Cabinet Grotesk

### Colors
- [x] CSS variables defined
- [x] Brand colors implemented
- [x] Dark mode support
- [x] Chart colors configured

### Components
- [x] Button variants implemented
- [x] Card components styled
- [x] Form elements consistent
- [x] Navigation components styled

### Icons
- [x] Heroicons integrated
- [x] Lucide React available
- [x] Consistent sizing
- [x] Proper color usage

## Maintenance

### Regular Reviews
- Audit color usage quarterly
- Check accessibility compliance
- Update component documentation
- Review performance metrics

### Version Control
- Document breaking changes
- Maintain component changelog
- Test across browsers
- Validate responsive behavior

---

*This styling guide should be updated as the design system evolves. Last updated: [Current Date]*