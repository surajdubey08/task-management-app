import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Calendar, User, Tag, Edit, Eye, AlertCircle, Clock, Link2, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { taskDependenciesApi } from '../services/api';

const KanbanCard = ({ task, index }) => {
  // Check if task is blocked (only for pending tasks)
  const { data: canStart = true, isLoading: isCheckingDeps } = useQuery(
    ['taskCanStart', task.id],
    () => taskDependenciesApi.canTaskStart(task.id).then(res => res.data),
    {
      enabled: task.status === 0, // Only check for pending tasks
      staleTime: 5000, // Cache for 5 seconds (even shorter for edge cases)
      refetchOnWindowFocus: true, // Refetch when window gains focus
      refetchInterval: 30000, // Refetch every 30 seconds to catch edge cases
      retry: 2,
    }
  );

  const getPriorityColor = (priority) => {
    const priorityMap = {
      0: 'border-l-green-400 bg-green-50 dark:bg-green-900/20', // Low
      1: 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20', // Medium
      2: 'border-l-orange-400 bg-orange-50 dark:bg-orange-900/20', // High
      3: 'border-l-red-400 bg-red-50 dark:bg-red-900/20', // Critical
    };
    return priorityMap[priority] || priorityMap[1];
  };

  const getPriorityIcon = (priority) => {
    const priorityMap = {
      0: { icon: Clock, color: 'text-green-500' }, // Low
      1: { icon: Clock, color: 'text-yellow-500' }, // Medium
      2: { icon: AlertCircle, color: 'text-orange-500' }, // High
      3: { icon: AlertCircle, color: 'text-red-500' }, // Critical
    };
    return priorityMap[priority] || priorityMap[1];
  };

  const getPriorityLabel = (priority) => {
    const priorityMap = {
      0: 'Low',
      1: 'Medium', 
      2: 'High',
      3: 'Critical',
    };
    return priorityMap[priority] || 'Medium';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return dateString;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const priorityInfo = getPriorityIcon(task.priority);
  const PriorityIcon = priorityInfo.icon;

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 p-4 mb-3 
            transition-all duration-200 hover:shadow-md cursor-pointer
            ${getPriorityColor(task.priority)}
            ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''}
          `}
        >
          {/* Task Title */}
          <div className="mb-3">
            <Link
              to={`/tasks/${task.id}`}
              className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 block"
              onClick={(e) => e.stopPropagation()}
            >
              {task.title}
            </Link>
          </div>

          {/* Task Description */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Priority Badge and Dependency Indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color} bg-gray-100 dark:bg-gray-700`}>
              <PriorityIcon size={12} />
              <span>{getPriorityLabel(task.priority)}</span>
            </div>
            {(task.hasDependencies || task.hasBlockedTasks) && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/20" title="Has dependencies">
                <Link2 size={12} />
                <span>Deps</span>
              </div>
            )}
            {task.status === 0 && !canStart && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20" title="Task is blocked by dependencies">
                <Lock size={12} />
                <span>Blocked</span>
              </div>
            )}
          </div>

          {/* Task Meta Information */}
          <div className="space-y-2">
            {/* Assignee */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <User size={12} className="text-blue-500" />
              <span className="truncate">{task.userName}</span>
            </div>

            {/* Category */}
            {task.categoryName && (
              <div className="flex items-center gap-2 text-xs">
                <Tag size={12} className="text-purple-500" />
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium truncate"
                  style={{
                    color: task.categoryColor,
                    backgroundColor: `${task.categoryColor}20`
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: task.categoryColor }}
                  />
                  {task.categoryName}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={`flex items-center gap-2 text-xs ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                <Calendar size={12} />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue(task.dueDate) && (
                  <span className="text-red-500 font-medium">Overdue</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-1">
              <Link
                to={`/tasks/${task.id}`}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye size={14} />
              </Link>
              <Link
                to={`/tasks/${task.id}/edit`}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit size={14} />
              </Link>
            </div>
            
            {/* Task ID */}
            <span className="text-xs text-gray-400">#{task.id}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
