/**
 * This file provides a compatibility layer for @inertiajs/react imports
 * It re-exports components and hooks from our compatibility layer
 */

// Re-export components and hooks from our compatibility layer
export { Link, Head, usePage, useForm } from './components/inertia-compat'
export { Inertia } from './lib/inertia-adapter'

// Mock other exports as needed
export const router = {
  on: (event: string, callback: Function) => {
    // Mock implementation
    return {
      off: () => {
        // Mock cleanup
      }
    }
  }
}

// Add type definitions for compatibility
export type InertiaLinkProps = {
  href: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
  data?: Record<string, any>;
  replace?: boolean;
  preserveScroll?: boolean;
  preserveState?: boolean | ((props: object) => boolean);
  only?: string[];
  headers?: Record<string, string>;
  [key: string]: any;
} 