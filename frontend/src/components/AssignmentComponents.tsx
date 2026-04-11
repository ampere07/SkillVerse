import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Assignment, TabType } from '../pages/Assignments';

interface AssignmentListProps {
  assignments: Assignment[];
  activeTab: TabType;
  getSubmissionStatus: (assignment: Assignment) => string;
  getDaysUntilDue: (dueDate: string) => number;
  onNavigate: (classroomId: string, postId: string) => void;
}

export function AssignmentList({ assignments, activeTab, getSubmissionStatus, getDaysUntilDue, onNavigate }: AssignmentListProps) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'todo':
        return 'No pending assignments';
      case 'dueToday':
        return 'No assignments due today';
      case 'missing':
        return 'No missing assignments';
      default:
        return 'No assignments';
    }
  };

  const groupAssignmentsByDueDate = () => {
    if (activeTab === 'missing') {
      return { 'Overdue': assignments };
    }

    const groups: { [key: string]: Assignment[] } = {};

    if (activeTab === 'dueToday') {
      return { 'Due Today': assignments };
    }

    assignments.forEach(assignment => {
      if (!assignment.dueDate) {
        if (!groups['No due date']) {
          groups['No due date'] = [];
        }
        groups['No due date'].push(assignment);
      } else {
        const daysUntilDue = getDaysUntilDue(assignment.dueDate);
        const now = new Date();
        const due = new Date(assignment.dueDate);
        const endOfThisWeek = new Date(now);
        endOfThisWeek.setDate(now.getDate() + (7 - now.getDay()));
        const endOfNextWeek = new Date(endOfThisWeek);
        endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

        if (due <= endOfThisWeek) {
          if (!groups['This week']) {
            groups['This week'] = [];
          }
          groups['This week'].push(assignment);
        } else if (due <= endOfNextWeek) {
          if (!groups['Next week']) {
            groups['Next week'] = [];
          }
          groups['Next week'].push(assignment);
        } else {
          if (!groups['Later']) {
            groups['Later'] = [];
          }
          groups['Later'].push(assignment);
        }
      }
    });

    return groups;
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: '#757575' }}>{getEmptyMessage()}</p>
      </div>
    );
  }

  const groupedAssignments = groupAssignmentsByDueDate();

  return (
    <div className="space-y-4">
      {Object.entries(groupedAssignments).map(([groupName, groupAssignments]) => (
        <AssignmentGroup
          key={groupName}
          title={groupName}
          assignments={groupAssignments}
          getSubmissionStatus={getSubmissionStatus}
          getDaysUntilDue={getDaysUntilDue}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

interface AssignmentGroupProps {
  title: string;
  assignments: Assignment[];
  getSubmissionStatus: (assignment: Assignment) => string;
  getDaysUntilDue: (dueDate: string) => number;
  onNavigate: (classroomId: string, postId: string) => void;
}

export function AssignmentGroup({ title, assignments, getSubmissionStatus, getDaysUntilDue, onNavigate }: AssignmentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-lg px-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: '#212121' }}>{title}</span>
          <span className="text-sm px-2 py-0.5 bg-gray-100 rounded-full" style={{ color: '#757575' }}>
            {assignments.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: '#757575' }} strokeWidth={1.5} />
        )}
      </button>

      {isExpanded && (
        <div className="pb-4 space-y-3">
          {assignments.map((assignment) => {
            const status = getSubmissionStatus(assignment);
            const daysUntilDue = assignment.dueDate ? getDaysUntilDue(assignment.dueDate) : null;

            return (
              <AssignmentCard
                key={assignment._id}
                assignment={assignment}
                status={status}
                daysUntilDue={daysUntilDue}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AssignmentCardProps {
  assignment: Assignment;
  status: string;
  daysUntilDue: number | null;
  onNavigate: (classroomId: string, postId: string) => void;
}

export function AssignmentCard({ assignment, status, daysUntilDue, onNavigate }: AssignmentCardProps) {
  const getDueDateDisplay = () => {
    if (!assignment.dueDate) return null;

    const dueDate = new Date(assignment.dueDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    };

    return dueDate.toLocaleDateString('en-US', options);
  };

  const handleClick = () => {
    onNavigate(assignment.classroom._id, assignment._id);
  };

  const dueDateDisplay = getDueDateDisplay();

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
        <FileText className="w-5 h-5" style={{ color: '#1B5E20' }} strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium mb-1" style={{ color: '#212121' }}>{assignment.title}</h4>
        <p className="text-xs mb-1" style={{ color: '#757575' }}>{assignment.classroom.name}</p>
        {dueDateDisplay && (
          <p className="text-xs" style={{ color: '#757575' }}>Posted {dueDateDisplay}</p>
        )}
      </div>
    </div>
  );
}

export function AssignmentsSkeleton() {
  const pulse = "animate-pulse bg-gray-200 rounded-lg";
  
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* Tabs & Filter Header */}
      <div className="border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex px-4 sm:px-6 py-4 gap-8">
          <div className={`h-4 w-16 ${pulse}`} />
          <div className={`h-4 w-20 ${pulse}`} />
          <div className={`h-4 w-16 ${pulse}`} />
        </div>
        <div className="p-3 sm:pr-6">
          <div className={`h-10 w-48 ${pulse}`} />
        </div>
      </div>

      <div className="p-6 space-y-8">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`h-5 w-32 ${pulse}`} />
              <div className={`h-5 w-8 rounded-full ${pulse}`} />
            </div>
            
            {[1, 2, 3].map((card) => (
              <div key={card} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${pulse}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-1/3 ${pulse}`} />
                  <div className={`h-3 w-1/4 ${pulse}`} />
                  <div className={`h-3 w-1/5 ${pulse}`} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
