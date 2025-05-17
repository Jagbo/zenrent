# ZenRent Color System

This document provides a breakdown of the color system used throughout the ZenRent application, organized by UI component type.

## Color Palette (from tailwind.config.js)

### Primary Colors
- **Primary**: `#0f172a` (Dark slate blue)
  - **Foreground**: `#f8fafc` (Very light blue/white)

### Secondary Colors
- **Secondary**: `#f1f5f9` (Light blue/gray)
  - **Foreground**: `#0f172a` (Dark slate blue)

### Semantic Colors
- **Destructive**: `#ef4444` (Red)
  - **Foreground**: `#f8fafc` (Very light blue/white)
- **Muted**: `#f1f5f9` (Light blue/gray)
  - **Foreground**: `#64748b` (Slate gray)
- **Accent**: `#f1f5f9` (Light blue/gray)
  - **Foreground**: `#0f172a` (Dark slate blue)

### Neutral Colors
- **Background**: `#ffffff` (White)
- **Foreground**: `#0f172a` (Dark slate blue)
- **Border**: `rgb(229 231 235)` (Light gray - zinc-200)
- **Ring**: `rgb(161 161 170)` (Medium gray - zinc-400)
- **Card**: `#ffffff` (White)
  - **Foreground**: `#0f172a` (Dark slate blue)

## Usage by Component Type

### Buttons
Buttons use several color variants:
- **Default**: Primary background with primary-foreground text
- **Destructive**: Destructive background with destructive-foreground text
- **Outline**: Background color with border, hover uses accent colors
- **Secondary**: Secondary background with secondary-foreground text
- **Ghost**: Transparent background, hover uses accent colors
- **Link**: Primary text color with underline on hover

### Backgrounds
- **Page Background**: Background color (`#ffffff`)
- **Card Background**: Card color (`#ffffff`)
- **Secondary Sections**: Secondary color (`#f1f5f9`)
- **Muted Areas**: Muted color (`#f1f5f9`)

### Text
- **Primary Text**: Foreground color (`#0f172a`)
- **Secondary Text**: Secondary-foreground (`#0f172a`)
- **Muted Text**: Muted-foreground (`#64748b`)
- **Destructive Text**: Destructive color (`#ef4444`)

### Charts
The chart component uses a theming system with light and dark variants. Chart elements use:
- **Axis Text**: Muted-foreground
- **Grid Lines**: Border color at 50% opacity
- **Tooltip Cursor**: Border color
- **Background Elements**: Muted color

## Best Practices

1. Use semantic color names rather than raw hex values
2. Follow the established patterns for component variants
3. Maintain consistent contrast ratios for accessibility
4. Use the theming system for charts and data visualizations

## Example Usage

```tsx
// Button with default styling (primary colors)
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Card with default background
<Card>
  <CardContent>Content goes here</CardContent>
</Card>
``` 