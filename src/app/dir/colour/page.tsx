import React from 'react';

type ColorCategory = {
  title: string;
  description: string;
  colors: {
    name: string;
    variable: string;
    light: string;
    dark: string;
    description: string;
    mappedTo?: string;
  }[];
};

export default function ColourPage() {
  const colorCategories: ColorCategory[] = [
    {
      title: "Primary Colors",
      description: "The main brand colors used throughout the application for primary elements.",
      colors: [
        {
          name: "Primary",
          variable: "--primary",
          light: "oklch(0.21 0.034 264.665)",
          dark: "oklch(0.985 0.002 247.839)",
          description: "Main brand color used for primary buttons, key actions, and important UI elements."
        },
        {
          name: "Primary Foreground",
          variable: "--primary-foreground",
          light: "oklch(0.985 0.002 247.839)",
          dark: "oklch(0.21 0.034 264.665)",
          description: "Text color used on primary-colored elements to ensure readability."
        },
      ]
    },
    {
      title: "Secondary Colors",
      description: "Used for secondary elements and actions in the interface.",
      colors: [
        {
          name: "Secondary",
          variable: "--secondary",
          light: "oklch(0.967 0.003 264.542)",
          dark: "oklch(0.278 0.033 256.848)",
          description: "Used for secondary buttons, less prominent actions, and background highlights."
        },
        {
          name: "Secondary Foreground",
          variable: "--secondary-foreground",
          light: "oklch(0.21 0.034 264.665)",
          dark: "oklch(0.985 0.002 247.839)",
          description: "Text color used on secondary-colored elements."
        },
      ]
    },
    {
      title: "Accent Colors",
      description: "Used for highlighting and accenting UI elements.",
      colors: [
        {
          name: "Accent",
          variable: "--accent",
          light: "oklch(0.967 0.003 264.542)",
          dark: "oklch(0.278 0.033 256.848)",
          description: "Used for hover states, highlighting active items, and decorative accents."
        },
        {
          name: "Accent Foreground",
          variable: "--accent-foreground",
          light: "oklch(0.21 0.034 264.665)",
          dark: "oklch(0.985 0.002 247.839)",
          description: "Text color used on accent-colored elements."
        },
      ]
    },
    {
      title: "Destructive Colors",
      description: "Used for destructive actions and error states.",
      colors: [
        {
          name: "Destructive",
          variable: "--destructive",
          light: "oklch(0.577 0.245 27.325)",
          dark: "oklch(0.396 0.141 25.723)",
          description: "Used for delete buttons, error messages, and other destructive actions."
        },
        {
          name: "Destructive Foreground",
          variable: "--destructive-foreground",
          light: "oklch(0.577 0.245 27.325)",
          dark: "oklch(0.637 0.237 25.331)",
          description: "Text color used on destructive elements."
        },
      ]
    },
    {
      title: "Background & Surface Colors",
      description: "Used for UI surfaces and backgrounds.",
      colors: [
        {
          name: "Background",
          variable: "--background",
          light: "oklch(1 0 0)",
          dark: "oklch(0.13 0.028 261.692)",
          description: "Main background color of the application."
        },
        {
          name: "Foreground",
          variable: "--foreground",
          light: "oklch(0.13 0.028 261.692)",
          dark: "oklch(0.985 0.002 247.839)",
          description: "Main text color used on the background."
        },
        {
          name: "Card",
          variable: "--card",
          light: "white",
          dark: "oklch(0.13 0.028 261.692)",
          description: "Background color for card elements."
        },
        {
          name: "Card Foreground",
          variable: "--card-foreground",
          light: "oklch(0.13 0.028 261.692)",
          dark: "oklch(0.985 0.002 247.839)",
          description: "Text color used on card elements."
        },
        {
          name: "Muted",
          variable: "--muted",
          light: "oklch(0.967 0.003 264.542)",
          dark: "oklch(0.278 0.033 256.848)",
          description: "Used for muted backgrounds like secondary containers."
        },
        {
          name: "Muted Foreground",
          variable: "--muted-foreground",
          light: "oklch(0.551 0.027 264.364)",
          dark: "oklch(0.707 0.022 261.325)",
          description: "Used for muted text like placeholders and secondary text."
        },
      ]
    },
    {
      title: "Chart Colors",
      description: "Used for data visualization in charts and graphs. The primary palette consists of 5 colors, with additional chart colors mapped to this core set.",
      colors: [
        {
          name: "Chart 1",
          variable: "--chart-1",
          light: "oklch(0.646 0.222 41.116)",
          dark: "oklch(0.488 0.243 264.376)",
          description: "Primary chart color, used for main data series. Also mapped to chart-6."
        },
        {
          name: "Chart 2",
          variable: "--chart-2",
          light: "oklch(0.6 0.118 184.704)",
          dark: "oklch(0.696 0.17 162.48)",
          description: "Secondary chart color, used for comparison data. Also mapped to chart-7."
        },
        {
          name: "Chart 3",
          variable: "--chart-3",
          light: "oklch(0.398 0.07 227.392)",
          dark: "oklch(0.769 0.188 70.08)",
          description: "Tertiary chart color, used for additional data series."
        },
        {
          name: "Chart 4",
          variable: "--chart-4",
          light: "oklch(0.828 0.189 84.429)",
          dark: "oklch(0.627 0.265 303.9)",
          description: "Used for 4th data series in charts. Also mapped to chart-9."
        },
        {
          name: "Chart 5",
          variable: "--chart-5",
          light: "oklch(0.769 0.188 70.08)",
          dark: "oklch(0.645 0.246 16.439)",
          description: "Used for 5th data series in charts. Also mapped to chart-8."
        },
        {
          name: "Chart 6",
          variable: "--chart-6",
          light: "Maps to chart-1",
          dark: "Maps to chart-1",
          description: "Maps to chart-1 for a consolidated color palette.",
          mappedTo: "--chart-1"
        },
        {
          name: "Chart 7",
          variable: "--chart-7",
          light: "Maps to chart-2",
          dark: "Maps to chart-2",
          description: "Maps to chart-2 for a consolidated color palette.",
          mappedTo: "--chart-2"
        },
        {
          name: "Chart 8",
          variable: "--chart-8",
          light: "Maps to chart-5",
          dark: "Maps to chart-5",
          description: "Maps to chart-5 for a consolidated color palette.",
          mappedTo: "--chart-5"
        },
        {
          name: "Chart 9",
          variable: "--chart-9",
          light: "Maps to chart-4",
          dark: "Maps to chart-4",
          description: "Maps to chart-4 for a consolidated color palette.",
          mappedTo: "--chart-4"
        },
      ]
    },
    {
      title: "Chart Data Series Colors",
      description: "Specific chart data series are mapped to the core chart color palette for consistent visualization across the application.",
      colors: [
        {
          name: "Income",
          variable: "--color-income",
          light: "Maps to chart-1",
          dark: "Maps to chart-1",
          description: "Used for income data in financial charts.",
          mappedTo: "--chart-1"
        },
        {
          name: "Expenses",
          variable: "--color-expenses",
          light: "Maps to chart-2",
          dark: "Maps to chart-2",
          description: "Used for expense data in financial charts.",
          mappedTo: "--chart-2"
        },
        {
          name: "Rent",
          variable: "--color-rent",
          light: "Maps to chart-1",
          dark: "Maps to chart-1",
          description: "Used for rental income data in financial charts.",
          mappedTo: "--chart-1"
        },
        {
          name: "Fees",
          variable: "--color-fees",
          light: "Maps to chart-2",
          dark: "Maps to chart-2",
          description: "Used for fees and deposits data in financial charts.",
          mappedTo: "--chart-2"
        },
        {
          name: "Maintenance",
          variable: "--color-maintenance",
          light: "Maps to chart-5",
          dark: "Maps to chart-5",
          description: "Used for maintenance costs in expense charts.",
          mappedTo: "--chart-5"
        },
        {
          name: "Utilities",
          variable: "--color-utilities",
          light: "Maps to chart-1",
          dark: "Maps to chart-1",
          description: "Used for utilities costs in expense charts.",
          mappedTo: "--chart-1"
        },
        {
          name: "Taxes",
          variable: "--color-taxes",
          light: "Maps to chart-2",
          dark: "Maps to chart-2",
          description: "Used for property tax data in expense charts.",
          mappedTo: "--chart-2"
        },
        {
          name: "Insurance",
          variable: "--color-insurance",
          light: "Maps to chart-3",
          dark: "Maps to chart-3",
          description: "Used for insurance costs in expense charts.",
          mappedTo: "--chart-3"
        },
        {
          name: "Other",
          variable: "--color-other",
          light: "Maps to chart-4",
          dark: "Maps to chart-4",
          description: "Used for other miscellaneous data in charts.",
          mappedTo: "--chart-4"
        },
      ]
    },
    {
      title: "UI Element Colors",
      description: "Used for borders, inputs, and other UI elements.",
      colors: [
        {
          name: "Border",
          variable: "--border",
          light: "oklch(0.928 0.006 264.531)",
          dark: "oklch(0.278 0.033 256.848)",
          description: "Used for borders throughout the application."
        },
        {
          name: "Input",
          variable: "--input",
          light: "oklch(0.928 0.006 264.531)",
          dark: "oklch(0.278 0.033 256.848)",
          description: "Used for input field borders."
        },
        {
          name: "Ring",
          variable: "--ring",
          light: "oklch(0.707 0.022 261.325)",
          dark: "oklch(0.446 0.03 256.802)",
          description: "Used for focus rings on interactive elements."
        },
      ]
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Colour System</h1>
      
      <div className="mb-6">
        <p className="text-lg mb-4">
          ZenRent uses a consistent color system across the application to ensure a cohesive visual experience.
          Colors are defined using OKLCH color space for better perceptual uniformity and are designed to work well in both light and dark modes.
        </p>
      </div>

      <div className="grid gap-12">
        {colorCategories.map((category, index) => (
          <div key={index} className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">{category.title}</h2>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.colors.map((color, colorIndex) => (
                <div key={colorIndex} className={`border rounded-lg overflow-hidden ${color.mappedTo ? 'opacity-70' : ''}`}>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{color.name}</h3>
                      <code className="text-xs bg-muted p-1 rounded">{color.variable}</code>
                    </div>
                    <p className="text-sm text-muted-foreground">{color.description}</p>
                    {color.mappedTo && (
                      <div className="mt-1 text-xs flex items-center space-x-1">
                        <span className="text-muted-foreground">Maps to:</span>
                        <code className="bg-muted p-1 rounded">{color.mappedTo}</code>
                      </div>
                    )}
                  </div>
                  
                  {!color.mappedTo && (
                    <div className="flex border-t">
                      <div className="flex-1 p-3 flex flex-col">
                        <div 
                          className="h-12 w-full rounded mb-2" 
                          style={{ background: color.light }}
                        />
                        <div className="text-xs">
                          <div>Light</div>
                          <code className="text-muted-foreground">{color.light}</code>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-3 flex flex-col border-l bg-zinc-900">
                        <div 
                          className="h-12 w-full rounded mb-2" 
                          style={{ background: color.dark }}
                        />
                        <div className="text-xs text-white">
                          <div>Dark</div>
                          <code className="text-zinc-400">{color.dark}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold">Color Usage Guidelines</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-medium mb-2">Buttons</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Primary actions: Use primary colors for CTA buttons</li>
              <li>Secondary actions: Use secondary colors for less important actions</li>
              <li>Destructive actions: Use destructive colors for delete/remove actions</li>
              <li>Ghost/plain buttons: Use for tertiary actions without strong visual emphasis</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">Background & Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Main content areas: Use background color</li>
              <li>Cards and containers: Use card color for elevated surfaces</li>
              <li>Secondary containers: Use muted color for subtly differentiated areas</li>
              <li>Text hierarchy: Use foreground for primary text, muted-foreground for secondary text</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-2">Charts & Data Visualization</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use chart colors 1-5 for all data visualizations</li>
              <li>Variables chart-6 through chart-9 map to the core palette (chart-1 through chart-5)</li>
              <li>Specific data series have dedicated color variables (e.g., --color-income, --color-expenses)</li>
              <li>Maintain consistent semantic meaning of colors (e.g., income is always chart-1)</li>
              <li>Ensure sufficient contrast between adjacent chart elements</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
} 