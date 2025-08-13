import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, usersApi, categoriesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TaskCard from '../components/TaskCard';

const Tasks = () => {
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    categoryId: '',
    search: '',
  });

  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error, refetch } = useQuery(
    ['tasks', filters],
    () => {
      const params = {};
      if (filters.status !== '') params.status = parseInt(filters.status);
      if (filters.userId) params.userId = parseInt(filters.userId);
      if (filters.categoryId) params.categoryId = parseInt(filters.categoryId);
      return tasksApi.getAll(params).then(res => res.data);
    }
  );

  const { data: users } = useQuery('users', () => usersApi.getAll().then(res => res.data));
  const { data: categories } = useQuery('categories', () => categoriesApi.getAll().then(res => res.data));

  const deleteTaskMutation = useMutation(
    (taskId) => tasksApi.delete(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        toast.success('Task deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete task');
      },
    }
  );

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const filteredTasks = tasks?.filter(task => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.userName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  if (isLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load tasks" onRetry={refetch} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link to="/tasks/new" className="btn btn-primary">
          <Plus size={20} />
          New Task
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} />
          <h3 className="font-medium">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="0">Pending</option>
              <option value="1">In Progress</option>
              <option value="2">Completed</option>
              <option value="3">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">User</label>
            <select
              className="form-select"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            >
              <option value="">All Users</option>
              {users?.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories?.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.status || filters.userId || filters.categoryId
              ? 'Try adjusting your filters or create a new task.'
              : 'Get started by creating your first task.'}
          </p>
          <Link to="/tasks/new" className="btn btn-primary">
            <Plus size={20} />
            Create Task
          </Link>
        </div>
      )}
    </div>
  );
};

export default Tasks;
