"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon 
} from "@heroicons/react/24/solid";

type TaxStatusProps = {
  title: string;
  status?: "up-to-date" | "due-soon" | "overdue";
  dueDate?: string | null;
};

export function TaxStatusCard({ 
  title, 
  status = "up-to-date", 
  dueDate = null 
}: TaxStatusProps) {
  
  const getStatusIcon = () => {
    switch (status) {
      case "up-to-date":
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
      case "due-soon":
        return <ClockIcon className="w-8 h-8 text-amber-500" />;
      case "overdue":
        return <ExclamationCircleIcon className="w-8 h-8 text-red-500" />;
      default:
        return <CheckCircleIcon className="w-8 h-8 text-green-500" />;
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case "up-to-date":
        return "Up to date";
      case "due-soon":
        return `Due ${dueDate ? `by ${dueDate}` : "soon"}`;
      case "overdue":
        return `Overdue ${dueDate ? `since ${dueDate}` : ""}`;
      default:
        return "Up to date";
    }
  };
  
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="px-6 py-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className={`mt-1 text-sm ${
              status === "up-to-date" ? "text-green-600" :
              status === "due-soon" ? "text-amber-600" :
              "text-red-600"
            }`}>
              {getStatusText()}
            </p>
          </div>
          <div>
            {getStatusIcon()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
