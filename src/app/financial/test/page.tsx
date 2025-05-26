"use client";

import React from "react";
import { SidebarLayout } from "../../components/sidebar-layout";

console.log('[ALT TEST] Test page file being loaded');

export default function TestPage() {
  console.log('[ALT TEST] Test component rendering');
  
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">ALTERNATIVE TEST PAGE</h1>
          <p className="mt-4">
            This is a test page at /financial/test to check if routing works in a different location.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
