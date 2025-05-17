"use client";

import React from "react";
import Image from "next/image";
import { Logo } from "@/components/layout/logo";

export function SideboardOnboardingContent() {
  return (
    <div className="flex h-full flex-col bg-white text-gray-900 border-r border-gray-200">
      {/* Logo at the top */}
      <div className="p-8">
        <div className="flex items-center">
          <Logo width={150} height={40} className="h-10 w-auto" linkTo="/" />
        </div>
      </div>

      {/* Content in the middle */}
      <div className="flex-1 p-8">
        <h1 style={{
            fontFamily: "'Cabinet Grotesk', sans-serif",
            fontWeight: 700,
          }}
          className="text-2xl text-gray-900"
        >
          Simplified property management. Designed to streamline your rentals.
        </h1>
        <p className="mt-4 text-gray-600">Find peace your of mind.</p>
      </div>

      {/* Image taking up 1/3 of the height and full width */}
      <div className="h-1/3 p-4">
        <Image src="/images/hero-gradient.webp"
          alt="Property management illustration"
          className="h-full w-full object-cover rounded-lg"
          width={500}
          height={300}
        />
      </div>
    </div>
  );
}
