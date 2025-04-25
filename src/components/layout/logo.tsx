"use client";

import Image from "next/image";
import Link from "next/link";
import { defaultImageLoader } from "@/lib/image-loader";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  linkTo?: string;
  variant?: 'default' | 'square';
  withLink?: boolean;
}

export function Logo({ 
  width = 120, 
  height = 48, 
  className = "h-auto w-auto object-contain", 
  linkTo = "/dashboard",
  variant = 'default',
  withLink = true
}: LogoProps) {
  // Choose the appropriate logo file based on variant
  const logoPath = variant === 'square' 
    ? "/images/logo/zenrent-square-logo.png"
    : "/images/logo/zenrent-logo.png";

  const logoComponent = (
    <Image 
      src={logoPath}
      alt="ZenRent Logo"
      width={width}
      height={height}
      className={className}
      priority
      unoptimized
      loader={defaultImageLoader}
    />
  );

  if (withLink && linkTo) {
    return (
      <Link href={linkTo} className="flex items-center">
        {logoComponent}
      </Link>
    );
  }

  return logoComponent;
} 