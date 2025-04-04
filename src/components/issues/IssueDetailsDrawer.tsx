"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";

type Issue = {
  id: string;
  title: string;
  type: "Bug" | "Documentation" | "Feature";
  status: "Todo" | "In Progress" | "Backlog" | "Done";
  priority: "Low" | "Medium" | "High";
  property?: string;
  reported?: string;
  assignedTo?: string;
};

type IssueDetailsDrawerProps = {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
};

export function IssueDetailsDrawer({
  issue,
  open,
  onClose,
}: IssueDetailsDrawerProps) {
  if (!issue) return null;

  const getTypeColor = (type: Issue["type"]) => {
    switch (type) {
      case "Bug":
        return "bg-red-100 text-red-800";
      case "Documentation":
        return "bg-purple-100 text-purple-800";
      case "Feature":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: Issue["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAssignedToColor = (assignedTo: string) => {
    switch (assignedTo) {
      case "JS":
        return "bg-blue-100 text-blue-800";
      case "RW":
        return "bg-green-100 text-green-800";
      case "SJ":
        return "bg-purple-100 text-purple-800";
      case "MA":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
              <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                <div className="px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-base font-semibold text-gray-900">
                      Issue #{issue.id}
                    </DialogTitle>
                    <div className="ml-3 flex h-7 items-center">
                      <button type="button"
                        onClick={onClose}
                        className="relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-d9e8ff-80 focus:ring-offset-2 focus:outline-hidden"
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {issue.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {issue.property}
                      </p>
                    </div>

                    {/* Status and Type */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary"
                        className={getTypeColor(issue.type)}
                      >
                        {issue.type}
                      </Badge>
                      <Badge variant="secondary"
                        className={getPriorityColor(issue.priority)}
                      >
                        {issue.priority}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Status
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {issue.status}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Reported
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {issue.reported}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Assigned To
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full ${getAssignedToColor(issue.assignedTo || "?")} flex items-center justify-center text-xs font-medium`}
                          >
                            {issue.assignedTo}
                          </span>
                          <span className="text-sm text-gray-900">
                            {issue.assignedTo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
