# Chart Color System

The ZenRent application uses a theming system for charts that supports both light and dark modes. This document outlines the color usage in charts and data visualizations.

## Chart Component Design

The chart component in ZenRent is built on top of Recharts with a custom theming system. Charts are styled through a combination of:

1. Base styling (applied to all charts)
2. Theme-specific styling (light/dark mode)
3. Data series colors (configurable per chart)

## Base Chart Styling

The base chart styling applies these default colors:

```css
[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground /* Axis text uses muted foreground */
[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 /* Grid lines use border color at 50% opacity */
[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border /* Tooltip cursor uses border color */
[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border /* Polar grid uses border color */
[&_.recharts-radial-bar-background-sector]:fill-muted /* Background sectors use muted color */
[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted /* Tooltip cursor rectangle uses muted color */
[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border /* Reference lines use border color */
```

## Data Series Colors

Chart data series colors are configurable through the chart config, which supports both static colors and theme-aware colors:

```typescript
type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }                         // Static color
    | { color?: never; theme: Record<keyof typeof THEMES, string> }  // Theme-aware color
  )
}
```

### Example Color Scheme for Data Visualization

For consistent data visualization, we recommend using the following color scheme for data series:

| Data Type | Light Mode | Dark Mode | Usage |
|-----------|------------|-----------|-------|
| Primary Series | `#0f172a` | `#f1f5f9` | Main data series, key metrics |
| Secondary Series | `#64748b` | `#94a3b8` | Supporting data, comparisons |
| Success/Positive | `#22c55e` | `#4ade80` | Positive trends, completions |
| Warning/Attention | `#eab308` | `#facc15` | Items needing attention |
| Danger/Negative | `#ef4444` | `#f87171` | Negative trends, errors |

## Chart Tooltip and Legend Styling

Tooltips and legends use consistent styling:

- **Tooltip Background**: Background color (`#ffffff` in light mode)
- **Tooltip Text**: Foreground color (`#0f172a` in light mode)
- **Tooltip Border**: Border color (`#e5e7eb` in light mode)
- **Legend Text**: Muted foreground (`#64748b` in light mode)

## Best Practices for Chart Colors

1. Use contrasting colors for different data series to ensure they're visually distinct
2. Ensure adequate contrast between data series colors and the chart background
3. Use semantic colors consistently (e.g., red for negative values, green for positive)
4. Support both light and dark modes with appropriate color adjustments
5. Limit the number of colors in a single chart (ideally 5-7 maximum)

## Example Usage

```tsx
<ChartContainer
  config={{
    revenue: {
      label: "Revenue",
      theme: {
        light: "#0f172a", // Primary color in light mode
        dark: "#f8fafc"   // Primary color in dark mode
      }
    },
    expenses: {
      label: "Expenses",
      theme: {
        light: "#64748b", // Secondary color in light mode
        dark: "#94a3b8"   // Secondary color in dark mode
      }
    },
    profit: {
      label: "Profit",
      theme: {
        light: "#22c55e", // Success color in light mode
        dark: "#4ade80"   // Success color in dark mode
      }
    }
  }}
>
  {/* Chart content */}
</ChartContainer>
``` 