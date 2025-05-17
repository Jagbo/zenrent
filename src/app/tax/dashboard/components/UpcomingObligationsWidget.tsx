"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  ExclamationCircleIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/solid";
import { formatDistanceToNow, format, parseISO } from "date-fns";

type Obligation = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: "Open" | "Overdue" | "Fulfilled";
  taxYear?: string;
};

type UpcomingObligationsProps = {
  obligations: Obligation[];
  isLoading: boolean;
};

export function UpcomingObligationsWidget({ 
  obligations, 
  isLoading 
}: UpcomingObligationsProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            <ClockIcon className="mr-1 h-3 w-3" />
            Upcoming
          </span>
        );
      case "Overdue":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <ExclamationCircleIcon className="mr-1 h-3 w-3" />
            Overdue
          </span>
        );
      case "Fulfilled":
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMM yyyy");
    } catch (error) {
      return dateString;
    }
  };
  
  const getTimeRemaining = (dueDate: string) => {
    try {
      const date = parseISO(dueDate);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown";
    }
  };
  
  const getTaxTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "vat":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <span className="text-sm font-semibold">VAT</span>
          </div>
        );
      case "income":
      case "incometax":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-700">
            <span className="text-sm font-semibold">IT</span>
          </div>
        );
      case "selfassessment":
      case "sa":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <span className="text-sm font-semibold">SA</span>
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-50 text-gray-700">
            <span className="text-sm font-semibold">TAX</span>
          </div>
        );
    }
  };
  
  return (
    <Card className="border border-gray-200 shadow-sm h-full">
      <CardHeader className="bg-white px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Obligations</h2>
      </CardHeader>
      <CardContent className="px-6 py-5">
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p>Loading obligations...</p>
          </div>
        ) : obligations.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>No upcoming tax obligations found</p>
            <p className="text-sm mt-2">When you have tax obligations, they will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {obligations.map((obligation) => (
              <li key={obligation.id} className="py-4 flex items-start">
                <div className="mr-4 flex-shrink-0">
                  {getTaxTypeIcon(obligation.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {obligation.type} {obligation.taxYear ? `(${obligation.taxYear})` : ''}
                    </p>
                    {getStatusBadge(obligation.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Period: {formatDate(obligation.periodStart)} - {formatDate(obligation.periodEnd)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(obligation.dueDate)} <span className="text-xs">({getTimeRemaining(obligation.dueDate)})</span>
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
