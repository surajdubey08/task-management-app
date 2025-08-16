import React from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { tasksApi, usersApi, categoriesApi, taskDependenciesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: task, isLoading: taskLoading } = useQuery(
    ['task', id],
    () => tasksApi.getById(id).then(res => res.data),
    {
      enabled: !!id,
      onSuccess: (data) => {
        reset({
          title: data.title,
          description: data.description || '',
          userId: data.userId,
          categoryId: data.categoryId || '',
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : '',
        });
      },
    }
  );

  const { data: users, isLoading: usersLoading } = useQuery(
    'users',
    () => usersApi.getAll().then(res => res.data)
  );

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => categoriesApi.getAll(true).then(res => res.data)
  );

  // Check if task can be moved to new status
  const checkTaskCanMove = async (newStatus) => {
    try {
      // Only check dependencies for In Progress (1) and Completed (2) statuses
      if (newStatus === 1 || newStatus === 2) {
        console.log(`Checking dependencies for task ${id} moving to status ${newStatus}`);

        // Make both API calls and wait for both to complete
        const [canStartResponse, reasonsResponse] = await Promise.all([
          taskDependenciesApi.canTaskStart(id),
          taskDependenciesApi.getBlockingReasons(id)
        ]);

        const canStart = canStartResponse.data;
        const reasons = reasonsResponse.data;

        console.log(`Task ${id} canStart: ${canStart}, reasons:`, reasons);

        if (!canStart && reasons.length > 0) {
          return { canMove: false, reasons };
        }
      }
      return { canMove: true, reasons: [] };
    } catch (error) {
      console.error('Error checking task dependencies:', error);
      // Be more conservative - if we can't check, don't allow risky moves
      if (newStatus === 1 || newStatus === 2) {
        return { canMove: false, reasons: ['Unable to verify dependencies. Please try again.'] };
      }
      return { canMove: true, reasons: [] };
    }
  };

  const updateTaskMutation = useMutation(
    async (data) => {
      // Check dependencies if status is being changed
      if (data.status !== task.status) {
        const { canMove, reasons } = await checkTaskCanMove(data.status);

        if (!canMove) {
          const statusNames = { 0: 'Pending', 1: 'In Progress', 2: 'Completed', 3: 'Cancelled' };

          throw new Error(`Cannot change status to ${statusNames[data.status]}:\n\n${reasons.join('\n')}`);
        }
      }

      return tasksApi.update(id, data);
    },
    {
      onSuccess: () => {
        toast.success('Task updated successfully');
        navigate(`/tasks/${id}`);
      },
      onError: (error) => {
        const errorMessage = error.response?.data || error.message || 'Failed to update task';

        // Check if it's a dependency error for special formatting
        if (errorMessage.includes('dependent tasks would become invalid') ||
            errorMessage.includes('blocked by dependencies')) {
          const parts = errorMessage.split(':');
          const title = parts[0] || 'Cannot update task';
          const details = parts.slice(1).join(':').trim() || errorMessage;

          // Show compact error
          toast.error(
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{title}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {details.split('\n').slice(0, 2).join(', ')}
                </div>
              </div>
            </div>,
            {
              duration: 4000,
              style: {
                maxWidth: '350px',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
              },
              position: 'top-right',
            }
          );
        } else {
          toast.error(errorMessage, {
            duration: 4000,
            style: {
              maxWidth: '350px',
            }
          });
        }
      },
    }
  );

  const onSubmit = (data) => {
    const taskData = {
      ...data,
      userId: parseInt(data.userId),
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      status: parseInt(data.status),
      priority: parseInt(data.priority),
      dueDate: data.dueDate || null,
    };
    updateTaskMutation.mutate(taskData);
  };

  if (taskLoading || usersLoading || categoriesLoading) {
    return <LoadingSpinner message="Loading task data..." />;
  }

  if (!task) {
    return <ErrorMessage message="Task not found" />;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/tasks/${id}`)}
          className="btn btn-outline"
        >
          <ArrowLeft size={20} />
          Back to Task
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows={4}
                {...register('description')}
              />
            </div>

            <div>
              <label className="form-label">Assigned User *</label>
              <select
                className="form-select"
                {...register('userId', { required: 'User is required' })}
              >
                <option value="">Select a user</option>
                {users?.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.userId && (
                <p className="text-red-500 text-sm mt-1">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                {...register('categoryId')}
              >
                <option value="">Select a category</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                className="form-select"
                {...register('status')}
              >
                <option value="0">Pending</option>
                <option value="1">In Progress</option>
                <option value="2">Completed</option>
                <option value="3">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                {...register('priority')}
              >
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Due Date</label>
              <input
                type="datetime-local"
                className="form-input"
                {...register('dueDate')}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={updateTaskMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={20} />
              {updateTaskMutation.isLoading ? 'Updating...' : 'Update Task'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/tasks/${id}`)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTask;
