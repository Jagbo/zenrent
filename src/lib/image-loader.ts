/**
 * Custom image loader for Next.js
 * This allows us to define specific loading strategies for different types of images
 */

import { ImageLoaderProps } from 'next/image';

/**
 * Default image loader that passes through the URL
 * 
 * This is useful for local images in the public directory
 * that don't need additional processing
 */
export const defaultImageLoader = ({ src }: ImageLoaderProps): string => {
  return src;
};

/**
 * Loader for optimized local images
 * 
 * This can be customized if you implement any server-side
 * image optimization routes
 */
export const localImageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  // If the image is already in a CDN or external source, return it directly
  if (src.startsWith('http') || src.startsWith('https') || src.startsWith('//')) {
    return src;
  }
  
  // For local images in the public folder
  return src;
};

/**
 * Helper function to determine if we should skip image optimization
 * for certain images
 */
export const shouldUnoptimize = (src: string): boolean => {
  // Skip optimization for SVGs, which don't need it
  if (src.endsWith('.svg')) {
    return true;
  }
  
  // Skip optimization for small icons and logos
  if (src.includes('/logo/') || src.includes('/icons/')) {
    return true;
  }
  
  return false;
}; 