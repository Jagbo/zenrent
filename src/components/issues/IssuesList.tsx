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

const mockIssues: Issue[] = [
  {
    id: "TASK-8782",
    title:
      "You can't compress the program without quantifying the open-source SSD...",
    type: "Documentation",
    status: "In Progress",
    priority: "Medium",
    property: "Frontend",
    reported: "2024-03-20",
    assignedTo: "JS",
  },
  {
    id: "TASK-7878",
    title:
      "Try to calculate the EXE feed, maybe it will index the multi-byte pixel!",
    type: "Documentation",
    status: "Backlog",
    priority: "Medium",
    property: "Backend",
    reported: "2024-03-19",
    assignedTo: "RW",
  },
  {
    id: "TASK-7839",
    title: "We need to bypass the neural TCP card!",
    type: "Bug",
    status: "Todo",
    priority: "High",
    property: "API",
    reported: "2024-03-18",
    assignedTo: "SJ",
  },
];

export function IssuesList() {
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
      current.length === mockIssues.length
        ? []
        : mockIssues.map((issue) => issue.id),
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
                <Checkbox checked={selectedIssues.length === mockIssues.length}
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
            {mockIssues.map((issue) => (
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
