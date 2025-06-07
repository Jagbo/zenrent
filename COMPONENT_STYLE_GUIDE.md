# ZenRent Component Style Guide

## Overview

This guide establishes consistent patterns for all ZenRent dashboard components to ensure a cohesive user experience and maintainable codebase.

## Design Principles

### 1. **Consistency First**
- Use established patterns across all components
- Maintain consistent spacing, colors, and typography
- Follow the same interaction patterns

### 2. **Accessibility by Default**
- Include proper ARIA labels and roles
- Ensure keyboard navigation works
- Maintain proper color contrast
- Use semantic HTML elements

### 3. **Performance Conscious**
- Minimize re-renders with proper memoization
- Use efficient data fetching patterns
- Implement proper loading states

## Color System

### Primary Brand Colors
```css
/* Primary Brand Blue */
--color-primary: #D9E8FF;
--color-primary-hover: #C8D7EE;
--color-primary-focus: #D9E8FF;

/* Dark Primary */
--color-dark-primary: #740748;

/* Background */
--color-background: #F9F7F7;

/* Text Colors */
--color-text-primary: #1F2937;    /* gray-800 */
--color-text-secondary: #6B7280;  /* gray-500 */
--color-text-muted: #9CA3AF;      /* gray-400 */
```

### Usage Guidelines
- **Primary Actions**: Use `bg-[#D9E8FF]` with `hover:bg-[#C8D7EE]`
- **Secondary Actions**: Use `bg-white` with `border-gray-300`
- **Destructive Actions**: Use `bg-red-600` with `hover:bg-red-700`
- **Text**: Use `text-gray-900` for primary, `text-gray-600` for secondary

## Typography

### Font Hierarchy
```css
/* Headings - Use Cabinet Grotesk */
.heading-xl { font-family: var(--font-cabinet); font-size: 2.25rem; font-weight: 700; }
.heading-lg { font-family: var(--font-cabinet); font-size: 1.875rem; font-weight: 700; }
.heading-md { font-family: var(--font-cabinet); font-size: 1.5rem; font-weight: 600; }
.heading-sm { font-family: var(--font-cabinet); font-size: 1.25rem; font-weight: 600; }

/* Body Text - Use Inter */
.text-lg { font-family: var(--font-inter); font-size: 1.125rem; font-weight: 400; }
.text-base { font-family: var(--font-inter); font-size: 1rem; font-weight: 400; }
.text-sm { font-family: var(--font-inter); font-size: 0.875rem; font-weight: 400; }
.text-xs { font-family: var(--font-inter); font-size: 0.75rem; font-weight: 400; }
```

### Implementation
```tsx
// ✅ DO: Use proper heading hierarchy
<h1 className="text-2xl font-bold text-gray-900 font-cabinet-grotesk">
  Dashboard Overview
</h1>

// ✅ DO: Use consistent body text
<p className="text-sm text-gray-600">
  Last updated 5 minutes ago
</p>

// ❌ DON'T: Mix font families inconsistently
<h2 className="text-lg font-medium">Title</h2> // Missing font-cabinet-grotesk
```

## Component Patterns

### 1. **Button Components**

#### Primary Button
```tsx
<button
  type="button"
  className="inline-flex items-center rounded-md border border-transparent bg-[#D9E8FF] px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-[#C8D7EE] focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  disabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Save Changes'}
</button>
```

#### Secondary Button
```tsx
<button
  type="button"
  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  Cancel
</button>
```

### 2. **Input Components**

#### Text Input
```tsx
<input
  type="text"
  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#D9E8FF] transition-colors sm:text-sm"
  placeholder="Enter value..."
/>
```

#### Select Input
```tsx
<select
  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:border-[#D9E8FF] transition-colors sm:text-sm"
>
  <option value="">Select option</option>
</select>
```

### 3. **Card Components**

#### Standard Card
```tsx
<div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
  <div className="px-4 py-5 sm:p-6">
    <h3 className="text-lg font-semibold text-gray-900 font-cabinet-grotesk mb-2">
      Card Title
    </h3>
    <p className="text-sm text-gray-600">
      Card content goes here
    </p>
  </div>
</div>
```

#### Stat Card
```tsx
<div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
  <div className="p-5">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">
            Metric Name
          </dt>
          <dd className="text-lg font-semibold text-gray-900 font-cabinet-grotesk">
            {value}
          </dd>
        </dl>
      </div>
    </div>
  </div>
</div>
```

### 4. **Modal/Drawer Components**

#### Drawer Header
```tsx
<div className="px-4 pt-5 pb-4 sm:px-6 border-b border-gray-200 bg-white">
  <div className="flex items-start justify-between">
    <h3 className="text-lg font-semibold text-gray-900 font-cabinet-grotesk">
      {title}
    </h3>
    <button
      type="button"
      className="ml-3 flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2 transition-colors"
      onClick={onClose}
      aria-label="Close drawer"
    >
      <XMarkIcon className="h-5 w-5" />
    </button>
  </div>
</div>
```

## State Management Patterns

### 1. **Loading States**
```tsx
// ✅ DO: Show loading states consistently
{isLoading ? (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9E8FF]"></div>
  </div>
) : (
  <DataComponent />
)}
```

### 2. **Error States**
```tsx
// ✅ DO: Provide helpful error messages
{error ? (
  <div className="rounded-md bg-red-50 p-4 border border-red-200">
    <div className="flex">
      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          Unable to load data
        </h3>
        <p className="mt-1 text-sm text-red-700">
          Please try again or contact support if the problem persists.
        </p>
      </div>
    </div>
  </div>
) : (
  <DataComponent />
)}
```

### 3. **Empty States**
```tsx
// ✅ DO: Show helpful empty states
{data.length === 0 ? (
  <div className="text-center py-12">
    <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">
      No items found
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Get started by creating a new item.
    </p>
    <div className="mt-6">
      <button
        type="button"
        className="inline-flex items-center rounded-md bg-[#D9E8FF] px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-[#C8D7EE]"
      >
        Create Item
      </button>
    </div>
  </div>
) : (
  <DataList />
)}
```

## Supabase Integration Patterns

### 1. **Data Fetching**
```tsx
// ✅ DO: Use consistent error handling
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[ComponentName] Database error:', error);
      setError('Failed to load data');
      return;
    }
    
    setData(data || []);
  } catch (error) {
    console.error('[ComponentName] Unexpected error:', error);
    setError('An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};
```

### 2. **Data Mutations**
```tsx
// ✅ DO: Provide user feedback for mutations
const handleSave = async (formData) => {
  try {
    setSubmitting(true);
    
    const { data, error } = await supabase
      .from('table_name')
      .insert(formData)
      .select()
      .single();
    
    if (error) {
      console.error('[ComponentName] Save error:', error);
      toast.error('Failed to save changes');
      return;
    }
    
    toast.success('Changes saved successfully');
    onSuccess(data);
  } catch (error) {
    console.error('[ComponentName] Unexpected error:', error);
    toast.error('An unexpected error occurred');
  } finally {
    setSubmitting(false);
  }
};
```

## Accessibility Guidelines

### 1. **Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Use proper tab order with `tabIndex` when needed
- Implement focus management for modals/drawers

### 2. **Screen Reader Support**
```tsx
// ✅ DO: Provide proper labels
<button
  type="button"
  aria-label="Close dialog"
  onClick={onClose}
>
  <XMarkIcon className="h-5 w-5" />
</button>

// ✅ DO: Use semantic HTML
<main role="main">
  <h1>Dashboard</h1>
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading">Statistics</h2>
    {/* stats content */}
  </section>
</main>
```

### 3. **Color Contrast**
- Ensure all text meets WCAG AA standards (4.5:1 ratio)
- Don't rely solely on color to convey information
- Test with color blindness simulators

## Performance Guidelines

### 1. **Component Optimization**
```tsx
// ✅ DO: Memoize expensive components
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Component implementation
});

// ✅ DO: Use proper dependency arrays
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 2. **Data Fetching**
```tsx
// ✅ DO: Implement proper caching
const { data, error, isLoading } = useSWR(
  ['dashboard-stats', userId],
  () => getDashboardStats(userId),
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  }
);
```

## Testing Guidelines

### 1. **Component Testing**
```tsx
// ✅ DO: Test user interactions
test('should submit form when valid data is provided', async () => {
  const mockOnSubmit = jest.fn();
  render(<FormComponent onSubmit={mockOnSubmit} />);
  
  await user.type(screen.getByLabelText(/title/i), 'Test Title');
  await user.click(screen.getByRole('button', { name: /save/i }));
  
  expect(mockOnSubmit).toHaveBeenCalledWith({
    title: 'Test Title'
  });
});
```

### 2. **Accessibility Testing**
```tsx
// ✅ DO: Test accessibility
test('should be accessible', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## File Organization

### 1. **Component Structure**
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── common/             # Common business components
│   │   ├── UserAvatar.tsx
│   │   └── SearchBar.tsx
│   └── feature/            # Feature-specific components
│       ├── IssueDrawer.tsx
│       └── PropertyCard.tsx
```

### 2. **Import Organization**
```tsx
// ✅ DO: Organize imports consistently
// React imports
import React, { useState, useEffect } from 'react';

// Third-party imports
import { toast } from 'react-hot-toast';

// Internal imports
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Type imports
import type { User } from '@/types/user';
```

## Code Quality Standards

### 1. **TypeScript Usage**
```tsx
// ✅ DO: Define proper interfaces
interface ComponentProps {
  title: string;
  onSave: (data: FormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// ✅ DO: Use proper return types
const Component: React.FC<ComponentProps> = ({
  title,
  onSave,
  isLoading = false,
  className = ''
}) => {
  // Component implementation
};
```

### 2. **Error Boundaries**
```tsx
// ✅ DO: Wrap components in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <FeatureComponent />
</ErrorBoundary>
```

## Maintenance Guidelines

### 1. **Regular Reviews**
- Review components monthly for consistency
- Update patterns when new requirements emerge
- Refactor components that don't follow guidelines

### 2. **Documentation**
- Document complex component logic
- Update this guide when patterns change
- Include examples for new patterns

### 3. **Version Control**
- Use descriptive commit messages
- Include component changes in PR descriptions
- Tag releases with component updates

## Conclusion

Following these guidelines ensures that ZenRent components are:
- **Consistent** across the application
- **Accessible** to all users
- **Performant** and scalable
- **Maintainable** over time

When in doubt, refer to existing components that follow these patterns or consult this guide for the recommended approach.