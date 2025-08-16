import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Filter, Search, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, usersApi, categoriesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import TaskCard from '../components/TaskCard';

const Tasks = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    categoryId: '',
    search: '',
  });

  // Read URL parameters and set initial filters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const initialFilters = {
      status: searchParams.get('status') || '',
      userId: searchParams.get('userId') || '',
      categoryId: searchParams.get('categoryId') || '',
      search: searchParams.get('search') || '',
    };
    setFilters(initialFilters);
  }, [location.search]);

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
              <List size={16} />
              List View
            </div>
            <Link
              to="/kanban"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Grid size={16} />
              Kanban
            </Link>
          </div>

          {/* Add Task Button */}
          <Link to="/tasks/new" className="btn btn-primary">
            <Plus size={20} />
            New Task
          </Link>
        </div>
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
                className="form-input"
                style={{ paddingLeft: '4rem' }}
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
