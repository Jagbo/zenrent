"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  PlusIcon, 
  DocumentTextIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  DocumentArrowDownIcon,
  ChartBarIcon
} from "@heroicons/react/24/solid";
import { useState } from "react";

type QuickActionsPanelProps = {
  taxType: "all" | "vat" | "income" | "selfassessment";
};

export function QuickActionsPanel({ taxType }: QuickActionsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };
  
  // Define actions based on tax type
  const getActions = () => {
    const commonActions = [
      {
        icon: <DocumentTextIcon className="w-5 h-5 mr-2" />,
        label: "View Tax Calendar",
        action: () => console.log("View tax calendar"),
        href: "/tax/calendar"
      },
      {
        icon: <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />,
        label: "Refresh Obligations",
        action: handleRefresh,
        disabled: isRefreshing
      }
    ];
    
    switch (taxType) {
      case "vat":
        return [
          {
            icon: <PlusIcon className="w-5 h-5 mr-2" />,
            label: "Submit VAT Return",
            action: () => console.log("Submit VAT return"),
            href: "/tax/vat/submit"
          },
          {
            icon: <ChartBarIcon className="w-5 h-5 mr-2" />,
            label: "View VAT Reports",
            action: () => console.log("View VAT reports"),
            href: "/tax/vat/reports"
          },
          ...commonActions
        ];
      case "income":
        return [
          {
            icon: <PlusIcon className="w-5 h-5 mr-2" />,
            label: "Submit Income Tax",
            action: () => console.log("Submit income tax"),
            href: "/tax/income/submit"
          },
          {
            icon: <DocumentDuplicateIcon className="w-5 h-5 mr-2" />,
            label: "View Property Income",
            action: () => console.log("View property income"),
            href: "/tax/income/property"
          },
          ...commonActions
        ];
      case "selfassessment":
        return [
          {
            icon: <PlusIcon className="w-5 h-5 mr-2" />,
            label: "Submit Self Assessment",
            action: () => console.log("Submit self assessment"),
            href: "/tax/selfassessment/submit"
          },
          {
            icon: <DocumentArrowDownIcon className="w-5 h-5 mr-2" />,
            label: "Download Tax Summary",
            action: () => console.log("Download tax summary"),
          },
          ...commonActions
        ];
      default:
        return [
          {
            icon: <PlusIcon className="w-5 h-5 mr-2" />,
            label: "Submit New Return",
            action: () => console.log("Submit new return"),
            href: "/tax/submit"
          },
          ...commonActions
        ];
    }
  };
  
  const actions = getActions();
  
  return (
    <Card className="border border-gray-200 shadow-sm h-full">
      <CardHeader className="bg-white px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <div className="space-y-4">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`w-full flex items-center justify-between px-4 py-3 bg-[#F9F7F7] hover:bg-gray-100 rounded-md text-[#330015] font-medium transition-colors ${
                action.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={action.action}
              disabled={action.disabled}
              {...(action.href ? { onClick: () => window.location.href = action.href } : {})}
            >
              <span className="flex items-center">
                {action.icon}
                {action.label}
              </span>
              <span className="text-gray-400">&rarr;</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
