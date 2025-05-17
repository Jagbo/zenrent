"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon
} from "@heroicons/react/24/solid";
import { format, parseISO } from "date-fns";

type Submission = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  submittedDate: string;
  status: "Accepted" | "Pending" | "Rejected";
  reference?: string;
  taxYear?: string;
};

type SubmissionHistoryTableProps = {
  submissions: Submission[];
  isLoading: boolean;
};

export function SubmissionHistoryTable({ 
  submissions, 
  isLoading 
}: SubmissionHistoryTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Accepted":
        return (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            <CheckIcon className="mr-1 h-3 w-3" />
            Accepted
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
            <ClockIcon className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            <ExclamationCircleIcon className="mr-1 h-3 w-3" />
            Rejected
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
  
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-white px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Submission History</h2>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
            <p>Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <DocumentDuplicateIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p>No tax submissions found</p>
            <p className="text-sm mt-2">When you submit tax returns, they will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {submission.taxYear}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(submission.periodStart)} - {formatDate(submission.periodEnd)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(submission.submittedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.reference || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
