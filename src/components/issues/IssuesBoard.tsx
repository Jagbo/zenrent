"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Issue = {
  id: string;
  title: string;
  type: "Bug" | "Documentation" | "Feature";
  status: "Todo" | "In Progress" | "Backlog" | "Done";
  priority: "Low" | "Medium" | "High";
};

const mockIssues: Issue[] = [
  {
    id: "TASK-8782",
    title: "You can't compress the program without quantifying the open-source SSD...",
    type: "Documentation",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "TASK-7878",
    title: "Try to calculate the EXE feed, maybe it will index the multi-byte pixel!",
    type: "Documentation",
    status: "Backlog",
    priority: "Medium",
  },
  {
    id: "TASK-7839",
    title: "We need to bypass the neural TCP card!",
    type: "Bug",
    status: "Todo",
    priority: "High",
  },
];

const columns = [
  { id: "todo", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "backlog", title: "Backlog" },
  { id: "done", title: "Done" },
];

export function IssuesBoard() {
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

  const getIssuesByStatus = (status: string) => {
    return mockIssues.filter(
      (issue) => issue.status.toLowerCase().replace(" ", "-") === status
    );
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{column.title}</h3>
            <Badge variant="secondary" className="bg-gray-100">
              {getIssuesByStatus(column.id).length}
            </Badge>
          </div>
          <div className="space-y-3">
            {getIssuesByStatus(column.id).map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{issue.id}</span>
                      <Badge
                        variant="secondary"
                        className={getTypeColor(issue.type)}
                      >
                        {issue.type}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-100">
                        {issue.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 