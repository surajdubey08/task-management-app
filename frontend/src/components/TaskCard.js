import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const TaskCard = ({ task, onDelete }) => {
  const getStatusBadge = (status) => {
    const statusMap = {
      0: { label: 'Pending', className: 'badge-pending' },
      1: { label: 'In Progress', className: 'badge-in-progress' },
      2: { label: 'Completed', className: 'badge-completed' },
      3: { label: 'Cancelled', className: 'badge-cancelled' },
    };
    const statusInfo = statusMap[status] || statusMap[0];
    return <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      0: { label: 'Low', className: 'badge-low' },
      1: { label: 'Medium', className: 'badge-medium' },
      2: { label: 'High', className: 'badge-high' },
      3: { label: 'Critical', className: 'badge-critical' },
    };
    const priorityInfo = priorityMap[priority] || priorityMap[1];
    return <span className={`badge ${priorityInfo.className}`}>{priorityInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        task.status === 2 ? 'bg-green-500' :
        task.status === 1 ? 'bg-blue-500' :
        task.status === 3 ? 'bg-red-500' : 'bg-yellow-500'
      }`} />

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Link
              to={`/tasks/${task.id}`}
              className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block mb-3 line-clamp-2"
            >
              {task.title}
            </Link>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
          </div>
          <div className="flex gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link
              to={`/tasks/${task.id}/edit`}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg transition-all duration-200"
              title="Edit task"
            >
              <Edit size={14} />
            </Link>
            <button
              onClick={() => onDelete(task.id)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg transition-all duration-200"
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User size={14} className="text-indigo-500 dark:text-indigo-400" />
              <span className="font-medium">{task.userName}</span>
            </div>
          </div>

          {task.categoryName && (
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-purple-500 dark:text-purple-400" />
              <span
                className="inline-flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-full"
                style={{
                  color: task.categoryColor,
                  backgroundColor: `${task.categoryColor}20`
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: task.categoryColor }}
                />
                {task.categoryName}
              </span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className={`${
                new Date(task.dueDate) < new Date() && task.status !== 2
                  ? 'text-red-500'
                  : 'text-green-500'
              }`} />
              <span className={`font-medium ${
                new Date(task.dueDate) < new Date() && task.status !== 2
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                Due: {formatDate(task.dueDate)}
              </span>
            </div>
          )}

          {task.completedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-blue-500 dark:text-blue-400" />
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Completed: {formatDate(task.completedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
