import { useState, useEffect } from 'react'
import { BaseDrawer } from './BaseDrawer'

// Define Issue interface for the property page
export interface PropertyIssue {
  id: number;
  title: string;
  priority: string;
  status: string;
  reported: string;
}

// Define Issue interface for the issues page (dashboard)
export interface DashboardIssue {
  id: string;
  title: string;
  type?: "Bug" | "Documentation" | "Feature";
  status: "Todo" | "In Progress" | "Backlog" | "Done";
  priority: "Low" | "Medium" | "High";
  property?: string;
  reported?: string;
  assignedTo?: string;
}

// Union type to handle both issue types
export type Issue = PropertyIssue | DashboardIssue;

interface IssueDrawerProps {
  isOpen: boolean;
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDrawer: React.FC<IssueDrawerProps> = ({ isOpen, issue, onClose }) => {
  const [comment, setComment] = useState('');
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  // Update currentStatus when issue changes
  useEffect(() => {
    if (issue) {
      setCurrentStatus(issue.status);
    }
  }, [issue]);

  if (!isOpen || !issue) return null;

  // Status options
  const statusOptions = ["Open", "In Progress", "Todo", "Done", "Closed"];

  // Helper to determine if the issue is a PropertyIssue
  const isPropertyIssue = (issue: Issue): issue is PropertyIssue => {
    return typeof issue.id === 'number';
  };

  // Helper to determine priority display classes
  const getPriorityColor = (priority: string) => {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority === 'high') return 'bg-red-100 text-red-800';
    if (lowerPriority === 'medium') return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  // Helper to determine status display classes
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'open' || lowerStatus === 'todo') return 'bg-yellow-100 text-yellow-800';
    if (lowerStatus === 'in progress') return 'bg-blue-100 text-blue-800';
    if (lowerStatus === 'done' || lowerStatus === 'closed') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleAddComment = () => {
    // Here you would typically save the comment to your backend
    console.log('Adding comment:', comment);
    setComment('');
    // You could also add the comment to the local state if needed
  };

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setIsStatusSelectOpen(false);
    // Here you would typically update the status in your backend
    console.log('Status changed to:', newStatus);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Details"
    >
      <div>
        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${getPriorityColor(issue.priority)}`}>
          {issue.priority} Priority
        </span>
        
        <h2 className="mt-3 text-xl font-bold text-gray-900">{issue.title}</h2>
        
        {/* Show property info if available (for dashboard issues) */}
        {!isPropertyIssue(issue) && issue.property && (
          <p className="mt-1 text-sm text-gray-500">{issue.property}</p>
        )}
        
        <div className="mt-4 space-y-6">
          {/* Status, Reported Date, and Assigned To in a row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="relative">
                <span 
                  onClick={() => setIsStatusSelectOpen(!isStatusSelectOpen)}
                  className={`mt-2 inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 cursor-pointer ${getStatusColor(currentStatus)}`}
                >
                  {currentStatus}
                </span>
                
                {isStatusSelectOpen && (
                  <div className="absolute z-10 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      {statusOptions.map((status) => (
                        <div
                          key={status}
                          className={`block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${status === currentStatus ? 'bg-gray-50 font-medium' : ''}`}
                          onClick={() => handleStatusChange(status)}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reported Date</h3>
              <p className="mt-2 text-sm text-gray-900">{issue.reported}</p>
            </div>
            
            {/* Only show assignee if it exists */}
            {!isPropertyIssue(issue) && issue.assignedTo ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                <p className="mt-2 text-sm text-gray-900">{issue.assignedTo}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                <p className="mt-2 text-sm text-gray-500">Unassigned</p>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 text-sm text-gray-900">
              Detailed description would go here. For now, this is a placeholder for the issue description.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Activity</h3>
            <ul className="mt-2 space-y-4">
              <li className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">System</span>
                  <span className="text-gray-500">Today, 10:30 AM</span>
                </div>
                <p className="mt-1 text-sm status-activity">Issue status changed to {currentStatus}</p>
              </li>
              <li className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">John Doe</span>
                  <span className="text-gray-500">Yesterday, 3:45 PM</span>
                </div>
                <p className="mt-1 text-sm">Added a comment: "Will inspect this issue tomorrow morning."</p>
              </li>
              <li className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold">System</span>
                  <span className="text-gray-500">{issue.reported}</span>
                </div>
                <p className="mt-1 text-sm">Issue was reported</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 mt-6 pt-4">
        <div className="flex space-x-3">
          <div className="flex-grow">
            <label htmlFor="comment" className="sr-only">Add comment</label>
            <textarea
              rows={3}
              name="comment"
              id="comment"
              className="block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            onClick={handleAddComment}
            disabled={!comment.trim()}
          >
            Add Comment
          </button>
        </div>
      </div>
    </BaseDrawer>
  );
}; 