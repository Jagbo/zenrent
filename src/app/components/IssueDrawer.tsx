import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { addIssueComment, getIssueDetails, IIssueComment } from "../../lib/issueService";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Define interface for activity log entries
interface IActivityLog {
  id: string;
  issue_id: string;
  user_id?: string;
  tenant_id?: string;
  activity_type: string;
  description: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

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

export const IssueDrawer: React.FC<IssueDrawerProps> = ({
  isOpen,
  issue,
  onClose,
}) => {
  const [comment, setComment] = useState("");
  const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<IIssueComment[]>([]);
  const [activities, setActivities] = useState<IActivityLog[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const router = useRouter();

  // Update currentStatus and fetch comments when issue changes
  useEffect(() => {
    if (issue) {
      setCurrentStatus(issue.status);
      fetchIssueComments();
      fetchActivityLogs();
    }
  }, [issue]);
  
  // Fetch activity logs for the current issue
  const fetchActivityLogs = async () => {
    if (!issue) return;
    
    try {
      const issueId = issue.id.toString();
      console.log('Fetching activity logs for issue ID:', issueId);
      
      const { data: activityData, error: activityError } = await supabase
        .from("issue_activity_log")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });
      
      if (activityError) {
        console.error("Error fetching activity logs:", activityError);
        // Create default activity on error
        setActivities([{
          id: `default-${issue.id}`,
          issue_id: issueId,
          activity_type: 'issue_created',
          description: 'Issue was reported',
          created_at: issue.reported || new Date().toISOString()
        }]);
        return;
      }
      
      if (activityData && activityData.length > 0) {
        setActivities(activityData);
      } else {
        // Create default activity if none found
        setActivities([{
          id: `default-${issue.id}`,
          issue_id: issueId,
          activity_type: 'issue_created',
          description: 'Issue was reported',
          created_at: issue.reported || new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setActivities([]);
    }
  };
  
  // Fetch comments for the current issue
  const fetchIssueComments = async () => {
    if (!issue) return;
    
    try {
      const issueId = issue.id.toString();
      console.log('Fetching comments for issue ID:', issueId);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from("issue_comments")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });
      
      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        setComments([]);
        return;
      }
      
      setComments(commentsData || []);
    } catch (error) {
      console.error("Error fetching issue comments:", error);
      setComments([]);
    }
  };

  if (!isOpen || !issue) return null;

  // Status options
  const statusOptions = ["Open", "In Progress", "Todo", "Done", "Closed"];

  // Helper to determine if the issue is a PropertyIssue
  const isPropertyIssue = (issue: Issue): issue is PropertyIssue => {
    return typeof issue.id === "number";
  };

  // Helper to determine priority display classes
  const getPriorityColor = (priority: string) => {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority === "high") return "bg-red-100 text-red-800";
    if (lowerPriority === "medium") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  // Helper to determine status display classes
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "open" || lowerStatus === "todo")
      return "bg-yellow-100 text-yellow-800";
    if (lowerStatus === "in progress") return "bg-blue-100 text-blue-800";
    if (lowerStatus === "done" || lowerStatus === "closed")
      return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleAddComment = async () => {
    if (!issue || !comment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create a temporary comment for immediate display
      const tempComment: IIssueComment = {
        id: `temp-${Date.now()}`,
        issue_id: issue.id.toString(),
        comment: comment.trim(),
        user_id: user?.id,
        is_internal: false,
        created_at: new Date().toISOString()
      };
      
      // Add to local state immediately for better UX
      setComments(prevComments => [...prevComments, tempComment]);
      
      // Clear comment input
      setComment("");
      
      // Use the issue ID directly - no hardcoded mappings needed
      const issueId = issue.id.toString();
      console.log('Adding comment for issue ID:', issueId);
      
      // Add comment directly to the database
      const { data, error } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: issueId,
          comment: comment.trim(),
          user_id: user?.id,
          is_internal: false
        })
        .select()
        .single();
      
      // Check if we got an error response from the function
      if (data && data.error) {
        console.error('Function returned error:', data);
        throw new Error(data.error);
      }
      
      if (error) {
        console.error("Error calling RPC function:", error);
        toast.error("Failed to save comment");
        // Remove the temporary comment if saving failed
        setComments(prevComments => prevComments.filter(c => c.id !== tempComment.id));
        return;
      }
      
      // Show success message
      toast.success("Comment added successfully");
      
      // Refresh comments to get the real data with a slight delay to ensure DB consistency
      setTimeout(() => {
        fetchIssueComments();
        
        // Also try to get all comments as a fallback
        supabase
          .from("issue_comments")
          .select("*")
          .order("created_at", { ascending: true })
          .then(({ data: allComments, error: allCommentsError }) => {
            if (allCommentsError) {
              console.error("Error fetching all comments:", allCommentsError);
            } else if (allComments && allComments.length > 0) {
              console.log('All comments after adding:', allComments);
              // Show all comments for debugging purposes
              setComments(allComments);
            }
          });
      }, 1000);
      
      // Refresh the page to ensure all data is up to date
      router.refresh();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding your comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setIsStatusSelectOpen(false);
      return;
    }
    
    setIsUpdatingStatus(true);
    setCurrentStatus(newStatus);
    setIsStatusSelectOpen(false);
    
    try {
      const issueId = issue.id.toString();
      
      // Update the issue status in the database
      const { error: updateError } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId);
      
      if (updateError) {
        console.error('Error updating status:', updateError);
        throw updateError;
      }
      
      // Log the status change
      const { error: logError } = await supabase
        .from('issue_activity_log')
        .insert({
          issue_id: issueId,
          activity_type: 'status_change',
          description: 'Issue status changed',
          old_value: currentStatus,
          new_value: newStatus
        });
      
      if (logError) {
        console.error('Error logging status change:', logError);
      }
      
      // Add the new activity to the local state
      const newActivity: IActivityLog = {
        id: `temp-${Date.now()}`,
        issue_id: issueId,
        activity_type: 'status_change',
        description: 'Issue status changed',
        old_value: currentStatus,
        new_value: newStatus,
        created_at: new Date().toISOString()
      };
      
      setActivities(prev => [...prev, newActivity]);
      
      toast.success(`Status updated to ${newStatus}`);
      
      // Refresh activity logs after a short delay
      setTimeout(() => {
        fetchActivityLogs();
      }, 1000);
      
      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to update status');
      // Revert to the previous status
      setCurrentStatus(currentStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <BaseDrawer isOpen={isOpen} onClose={onClose} title="Issue Details">
      <div>
        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${getPriorityColor(issue.priority)}`}
        >
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
                <span onClick={() => setIsStatusSelectOpen(!isStatusSelectOpen)}
                  className={`mt-2 inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 cursor-pointer ${getStatusColor(currentStatus)}`}
                >
                  {currentStatus}
                </span>

                {isStatusSelectOpen && (
                  <div className="absolute z-10 mt-1 w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      {statusOptions.map((status) => (
                        <div key={status}
                          className={`block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${status === currentStatus ? "bg-gray-50 font-medium" : ""} ${isUpdatingStatus ? "opacity-50 pointer-events-none" : ""}`}
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
              <h3 className="text-sm font-medium text-gray-500">
                Reported Date
              </h3>
              <p className="mt-2 text-sm text-gray-900">{issue.reported}</p>
            </div>

            {/* Only show assignee if it exists */}
            {!isPropertyIssue(issue) && issue.assignedTo ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Assigned To
                </h3>
                <p className="mt-2 text-sm text-gray-900">{issue.assignedTo}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Assigned To
                </h3>
                <p className="mt-2 text-sm text-gray-500">Unassigned</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 text-sm text-gray-900">
              {/* Show actual issue description if available, otherwise show appropriate message */}
              {(issue as any).description || 
               (isPropertyIssue(issue) ? 
                 "No detailed description provided for this maintenance issue." : 
                 "No detailed description provided for this issue."
               )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Activity</h3>
            <ul className="mt-2 space-y-4" data-component-name="IssueDrawer">
              {/* Real activity logs from database */}
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <li key={activity.id} className="bg-gray-50 p-3 rounded-lg" data-component-name="IssueDrawer">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {activity.user_id ? 'Staff' : (activity.tenant_id ? 'Tenant' : 'System')}
                      </span>
                      <span className="text-gray-500">
                        {new Date(activity.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">
                      {activity.activity_type === 'status_change' ? (
                        <span className="status-activity">
                          Issue status changed from {activity.old_value || 'Not Set'} to {activity.new_value}
                        </span>
                      ) : activity.activity_type === 'issue_created' ? (
                        'Issue was reported'
                      ) : (
                        activity.description
                      )}
                    </p>
                  </li>
                ))
              ) : (
                <li className="bg-gray-50 p-3 rounded-lg text-center text-gray-500" data-component-name="IssueDrawer">
                  No activity recorded
                </li>
              )}
              
              {/* Real comments from database */}
              {comments && comments.length > 0 && (
                comments.map((comment) => (
                  <li key={comment.id} className="bg-gray-50 p-3 rounded-lg" data-component-name="IssueDrawer">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold">
                        {comment.user_id ? 'Staff' : (comment.tenant_id ? 'Tenant' : 'System')}
                      </span>
                      <span className="text-gray-500">
                        {new Date(comment.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.comment}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-4">
        <div className="flex space-x-3">
          <div className="flex-grow">
            <label htmlFor="comment" className="sr-only">
              Add comment
            </label>
            <textarea rows={3}
              name="comment"
              id="comment"
              className="block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring-[#D9E8FF]/80 sm:text-sm"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end space-x-3">
          <button type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-[#D9E8FF] px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-[#C8D7EE] focus:outline-none focus:ring-2 focus:ring-[#D9E8FF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleAddComment}
            disabled={!comment.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Add Comment'}
          </button>
        </div>
      </div>
    </BaseDrawer>
  );
};
