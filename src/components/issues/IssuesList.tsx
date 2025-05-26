"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ChevronDown } from "lucide-react";
import { IssueDrawer } from "../../app/components/IssueDrawer";

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

export function IssuesList({ issues }: { issues: Issue[] }) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleIssue = (issueId: string) => {
    setSelectedIssues((current) =>
      current.includes(issueId)
        ? current.filter((id) => id !== issueId)
        : [...current, issueId],
    );
  };

  const toggleAll = () => {
    setSelectedIssues((current) =>
      current.length === issues.length
        ? []
        : issues.map((issue) => issue.id),
    );
  };

  const getStatusColor = (status: Issue["status"]) => {
    switch (status) {
      case "Todo":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Backlog":
        return "bg-yellow-100 text-yellow-800";
      case "Done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  // Remove mock issues data - use only real data from props
  const displayIssues = issues || [];

  if (displayIssues.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No maintenance issues have been reported for this property yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input placeholder="Filter tasks..." className="max-w-sm" />
        <Button variant="outline" className="gap-2">
          Status <ChevronDown className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="gap-2">
          Priority <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={selectedIssues.length === displayIssues.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="min-w-[300px]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayIssues.map((issue) => (
              <TableRow key={issue.id}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="p-0">
                  <div className="flex items-center justify-center h-full px-4 py-3">
                    <Checkbox checked={selectedIssues.includes(issue.id)}
                      onCheckedChange={() => toggleIssue(issue.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </TableCell>
                <TableCell className="p-0">
                  <div className="px-4 py-3 h-full w-full"
                    onClick={() => openDrawer(issue)}
                  >
                    <div className="font-medium">{issue.title}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{issue.id}</span>
                      <Badge variant="secondary"
                        className={getTypeColor(issue.type)}
                      >
                        {issue.type}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="p-0">
                  <div className="px-4 py-3 h-full w-full"
                    onClick={() => openDrawer(issue)}
                  >
                    <Badge variant="secondary"
                      className={getStatusColor(issue.status)}
                    >
                      {issue.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="p-0">
                  <div className="px-4 py-3 h-full w-full"
                    onClick={() => openDrawer(issue)}
                  >
                    {issue.priority}
                  </div>
                </TableCell>
                <TableCell className="p-0">
                  <div className="flex items-center justify-center h-full px-4 py-3">
                    <Button variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <IssueDrawer issue={selectedIssue}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIssue(null);
        }}
      />
    </div>
  );
}
