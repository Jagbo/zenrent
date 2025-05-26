"use client";

import React from "react";
import { SidebarLayout } from "../../../components/sidebar-layout";

console.log('[DIRECT TEST] Tax direct-test page file being loaded');

export default function DirectTestPage() {
  console.log('[DIRECT TEST] Tax direct-test component rendering');
  
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">DIRECT TEST PAGE</h1>
          <p className="mt-4">
            This is a test page at /financial/tax/direct-test to check if routing works at the same level as other tax pages.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
