"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { PlusIcon } from "@heroicons/react/24/solid";
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

const columns = [
  { id: "todo", title: "Open", color: "yellow" },
  { id: "in-progress", title: "In Progress", color: "blue" },
  { id: "backlog", title: "Backlog", color: "gray" },
  { id: "done", title: "Resolved", color: "green" },
];

interface IssuesBoardProps {
  issues: Issue[];
  onUpdateIssues?: (issues: Issue[]) => void;
}

export function IssuesBoard({
  issues: initialIssues,
  onUpdateIssues,
}: IssuesBoardProps) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Update issues when props change
  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

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

  const getIssuesByStatus = (status: string) => {
    const statusMap: { [key: string]: Issue["status"] } = {
      todo: "Todo",
      "in-progress": "In Progress",
      backlog: "Backlog",
      done: "Done",
    };
    return issues.filter((issue) => issue.status === statusMap[status]) || [];
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedIssue(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;

    const statusMap: { [key: string]: Issue["status"] } = {
      todo: "Todo",
      "in-progress": "In Progress",
      backlog: "Backlog",
      done: "Done",
    };

    const updatedIssues = [...issues];
    const sourceItems = getIssuesByStatus(sourceCol);
    const [movedItem] = sourceItems.splice(result.source.index, 1);

    // Update the item's status if moving to a different column
    const updatedItem = {
      ...movedItem,
      status: statusMap[destCol],
    };

    // Find the index where we should insert the item
    const itemsInDestination = getIssuesByStatus(destCol);

    // Remove the moved item from its original position
    const itemIndex = updatedIssues.findIndex((i) => i.id === movedItem.id);
    if (itemIndex !== -1) {
      updatedIssues.splice(itemIndex, 1);
    }

    // Find the position to insert the item
    let insertAtIndex = updatedIssues.findIndex(
      (i) => i.status === statusMap[destCol],
    );
    if (insertAtIndex === -1) {
      insertAtIndex = updatedIssues.length;
    } else {
      insertAtIndex += result.destination.index;
    }

    // Insert the item at the new position
    updatedIssues.splice(insertAtIndex, 0, updatedItem);

    setIssues(updatedIssues);
    onUpdateIssues?.(updatedIssues);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <span className={`w-3 h-3 rounded-full bg-${column.color}-400 mr-2`}
                  ></span>
                  {column.title}
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {getIssuesByStatus(column.id).length}
                  </span>
                </h4>
                <button className="text-gray-500 hover:text-gray-700">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {getIssuesByStatus(column.id).map((issue, index) => (
                      <Draggable key={issue.id}
                        draggableId={issue.id}
                        index={index}
                      >
                        {(provided) => (
                          <div ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 rounded-md border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleIssueClick(issue)}
                          >
                            <div className="flex justify-between items-start">
                              {/* <span className="text-xs font-medium text-gray-500">#{issue.id}</span> */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}
                              >
                                {issue.priority}
                              </span>
                            </div>
                            <h5 className="mt-2 text-sm font-medium text-gray-900">
                              {issue.title}
                            </h5>
                            <p className="mt-1 text-xs text-gray-500">
                              {issue.property}
                            </p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-xs text-gray-500">
                                {issue.reported}
                              </span>
                              <div className="flex items-center">
                                <span className={`w-6 h-6 rounded-full ${getAssignedToColor(issue.assignedTo || "?")} flex items-center justify-center text-xs font-medium`}
                                >
                                  {issue.assignedTo}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <IssueDrawer issue={selectedIssue}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </>
  );
}
