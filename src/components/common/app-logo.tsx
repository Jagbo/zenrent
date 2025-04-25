"use client";

import { Logo } from "../layout/logo";

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'square';
  withLink?: boolean;
  linkTo?: string;
  className?: string;
}

/**
 * AppLogo component provides consistent logo styling across the application
 * with preset sizes and configuration
 */
export function AppLogo({
  size = 'medium',
  variant = 'default',
  withLink = true,
  linkTo = '/dashboard',
  className,
}: AppLogoProps) {
  // Define size presets
  const sizes = {
    small: { width: 80, height: 32, className: "h-8 w-auto" },
    medium: { width: 120, height: 48, className: "h-10 w-auto" },
    large: { width: 180, height: 72, className: "h-12 w-auto" },
  };

  const { width, height, className: sizeClassName } = sizes[size];
  
  return (
    <Logo
      width={width}
      height={height}
      className={className || sizeClassName}
      variant={variant}
      withLink={withLink}
      linkTo={linkTo}
    />
  );
} 