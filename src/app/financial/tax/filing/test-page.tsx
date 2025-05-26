"use client";

import React from "react";
import { SidebarLayout } from "../../../components/sidebar-layout";

console.log('[SIMPLE TEST] TaxFiling test page file being loaded');

export default function TaxFiling() {
  console.log('[SIMPLE TEST] TaxFiling component rendering');
  
  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900">SIMPLE TEST PAGE</h1>
          <p className="mt-4">
            If you can see this, the test filing/page.tsx file is being loaded and rendered correctly.
          </p>
          <p className="mt-4">
            Check the console logs to see if this file was properly parsed and loaded.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
