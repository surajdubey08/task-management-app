import React from 'react';
import { useQuery } from 'react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, User, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tasksApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TaskComments from '../components/TaskComments';
import TaskActivity from '../components/TaskActivity';
import TaskDependencies from '../components/TaskDependencies';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: task, isLoading, error, refetch } = useQuery(
    ['task', id],
    () => tasksApi.getById(id).then(res => res.data),
    {
      enabled: !!id,
    }
  );

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
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task details..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load task details" onRetry={refetch} />;
  }

  if (!task) {
    return <ErrorMessage message="Task not found" />;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="btn btn-outline"
        >
          <ArrowLeft size={20} />
          Back to Tasks
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
        <Link
          to={`/tasks/${task.id}/edit`}
          className="btn btn-primary ml-auto"
        >
          <Edit size={20} />
          Edit Task
        </Link>
      </div>

      <div className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main task details */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{task.title}</h2>
                <div className="flex gap-3 mb-4">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>
              </div>

              {task.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Task Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="text-gray-400" size={20} />
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Assigned to:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{task.userName}</p>
                      </div>
                    </div>

                    {task.categoryName && (
                      <div className="flex items-center gap-3">
                        <Tag className="text-gray-400" size={20} />
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                          <p className="font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: task.categoryColor }}
                            />
                            {task.categoryName}
                          </p>
                        </div>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="text-gray-400" size={20} />
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Due date:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(task.dueDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="text-gray-400" size={20} />
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(task.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="text-gray-400" size={20} />
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Last updated:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(task.updatedAt)}</p>
                      </div>
                    </div>

                    {task.completedAt && (
                      <div className="flex items-center gap-3">
                        <Clock className="text-gray-400" size={20} />
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Completed:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{formatDate(task.completedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies section */}
            <div className="card mt-8">
              <TaskDependencies taskId={task.id} currentUserId={1} />
            </div>

            {/* Comments section */}
            <div className="card mt-8">
              <TaskComments taskId={task.id} currentUserId={1} />
            </div>
          </div>

          {/* Activity sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <TaskActivity taskId={task.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
