import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Link2, Plus, X, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { taskDependenciesApi, tasksApi } from '../services/api';

const TaskDependencies = ({ taskId, currentUserId = 1 }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dependencyType, setDependencyType] = useState(0); // 0 = BlockedBy, 1 = Blocks
  const queryClient = useQueryClient();

  // Fetch task with dependencies
  const { data: taskWithDeps, isLoading, error } = useQuery(
    ['taskDependencies', taskId],
    () => taskDependenciesApi.getTaskWithDependencies(taskId).then(res => res.data),
    {
      enabled: !!taskId,
    }
  );

  // Fetch all tasks for dependency selection
  const { data: allTasks } = useQuery(
    'allTasks',
    () => tasksApi.getAll().then(res => res.data),
    {
      enabled: showAddForm,
    }
  );

  // Create dependency mutation
  const createDependencyMutation = useMutation(
    (data) => taskDependenciesApi.create(taskId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taskDependencies', taskId]);
        queryClient.invalidateQueries(['taskActivities', taskId]);
        setShowAddForm(false);
        setSelectedTaskId('');
        toast.success('Dependency added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add dependency');
      },
    }
  );

  // Delete dependency mutation
  const deleteDependencyMutation = useMutation(
    (dependencyId) => taskDependenciesApi.delete(dependencyId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['taskDependencies', taskId]);
        queryClient.invalidateQueries(['taskActivities', taskId]);
        toast.success('Dependency removed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove dependency');
      },
    }
  );

  const handleAddDependency = (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    createDependencyMutation.mutate({
      dependentTaskId: parseInt(selectedTaskId),
      dependencyType: dependencyType,
      createdByUserId: currentUserId,
    });
  };

  const handleDeleteDependency = (dependencyId) => {
    if (window.confirm('Are you sure you want to remove this dependency?')) {
      deleteDependencyMutation.mutate(dependencyId);
    }
  };

  const getStatusIcon = (status) => {
    const statusMap = {
      0: { icon: Clock, color: 'text-yellow-500' }, // Pending
      1: { icon: Clock, color: 'text-blue-500' }, // In Progress
      2: { icon: CheckCircle, color: 'text-green-500' }, // Completed
      3: { icon: X, color: 'text-red-500' }, // Cancelled
    };
    return statusMap[status] || statusMap[0];
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      0: 'Pending',
      1: 'In Progress',
      2: 'Completed',
      3: 'Cancelled',
    };
    return statusMap[status] || 'Unknown';
  };

  const availableTasks = allTasks?.filter(task => 
    task.id !== taskId && 
    !taskWithDeps?.blockedBy?.some(dep => dep.dependentTaskId === task.id) &&
    !taskWithDeps?.blocks?.some(dep => dep.taskId === task.id)
  ) || [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Failed to load dependencies
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 size={20} className="text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Dependencies
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <Plus size={16} />
          Add Dependency
        </button>
      </div>

      {/* Task Status Warning */}
      {!taskWithDeps?.canStart && taskWithDeps?.blockingReasons?.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                This task cannot start yet
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {taskWithDeps.blockingReasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Dependency Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAddDependency} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dependency Type
              </label>
              <select
                value={dependencyType}
                onChange={(e) => setDependencyType(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={0}>This task is blocked by...</option>
                <option value={1}>This task blocks...</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Choose a task...</option>
                {availableTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    #{task.id} - {task.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!selectedTaskId || createDependencyMutation.isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createDependencyMutation.isLoading ? 'Adding...' : 'Add Dependency'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedTaskId('');
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dependencies List */}
      <div className="space-y-4">
        {/* Blocked By */}
        {taskWithDeps?.blockedBy?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Blocked By ({taskWithDeps.blockedBy.length})
            </h4>
            <div className="space-y-2">
              {taskWithDeps.blockedBy.map((dependency) => {
                const statusInfo = getStatusIcon(dependency.dependentTaskStatus);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={dependency.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon size={16} className={statusInfo.color} />
                      <div>
                        <Link
                          to={`/tasks/${dependency.dependentTaskId}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          #{dependency.dependentTaskId} - {dependency.dependentTaskTitle}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {getStatusLabel(dependency.dependentTaskStatus)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDependency(dependency.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      title="Remove dependency"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blocks */}
        {taskWithDeps?.blocks?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ArrowRight size={16} className="text-blue-500" />
              Blocks ({taskWithDeps.blocks.length})
            </h4>
            <div className="space-y-2">
              {taskWithDeps.blocks.map((dependency) => {
                const statusInfo = getStatusIcon(dependency.taskStatus);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={dependency.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon size={16} className={statusInfo.color} />
                      <div>
                        <Link
                          to={`/tasks/${dependency.taskId}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          #{dependency.taskId} - {dependency.taskTitle}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Status: {getStatusLabel(dependency.taskStatus)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDependency(dependency.id)}
                      className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                      title="Remove dependency"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!taskWithDeps?.blockedBy?.length && !taskWithDeps?.blocks?.length) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Link2 size={48} className="mx-auto mb-3 opacity-50" />
            <p>No dependencies configured</p>
            <p className="text-sm mt-1">Add dependencies to manage task relationships</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDependencies;
