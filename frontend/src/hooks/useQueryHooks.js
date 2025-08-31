import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI, usersAPI, categoriesAPI, taskCommentsAPI, taskActivitiesAPI } from '../services/api';
import { toast } from 'react-hot-toast';

// Query Keys
export const queryKeys = {
  tasks: ['tasks'],
  task: (id) => ['tasks', id],
  tasksByUser: (userId) => ['tasks', 'user', userId],
  tasksByCategory: (categoryId) => ['tasks', 'category', categoryId],
  tasksByStatus: (status) => ['tasks', 'status', status],
  taskComments: (taskId) => ['tasks', taskId, 'comments'],
  taskActivities: (taskId) => ['tasks', taskId, 'activities'],
  users: ['users'],
  user: (id) => ['users', id],
  categories: ['categories'],
  category: (id) => ['categories', id],
  analytics: ['analytics'],
  dashboardStats: ['analytics', 'dashboard'],
};

// Task Hooks
export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: [...queryKeys.tasks, filters],
    queryFn: () => tasksAPI.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useTask = (id) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => tasksAPI.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: (newTask) => {
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      
      // Optimistically add to cache
      queryClient.setQueryData(queryKeys.task(newTask.id), newTask);
      
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => tasksAPI.update(id, data),
    onSuccess: (updatedTask) => {
      // Update specific task in cache
      queryClient.setQueryData(queryKeys.task(updatedTask.id), updatedTask);
      
      // Invalidate tasks list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksAPI.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.task(deletedId) });
      
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
    },
  });
};

// User Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersAPI.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => usersAPI.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersAPI.create,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.setQueryData(queryKeys.user(newUser.id), newUser);
      toast.success('User created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => usersAPI.update(id, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersAPI.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.user(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });
};

// Category Hooks
export const useCategories = (activeOnly = false) => {
  return useQuery({
    queryKey: [...queryKeys.categories, { activeOnly }],
    queryFn: () => categoriesAPI.getAll(activeOnly),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useCategory = (id) => {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => categoriesAPI.getById(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesAPI.create,
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.setQueryData(queryKeys.category(newCategory.id), newCategory);
      toast.success('Category created successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }) => categoriesAPI.update(id, data),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(queryKeys.category(updatedCategory.id), updatedCategory);
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update category';
      toast.error(message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: categoriesAPI.delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.category(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success('Category deleted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    },
  });
};

// Task Comments Hooks
export const useTaskComments = (taskId) => {
  return useQuery({
    queryKey: queryKeys.taskComments(taskId),
    queryFn: () => taskCommentsAPI.getByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateTaskComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, ...data }) => taskCommentsAPI.create(taskId, data),
    onSuccess: (newComment, { taskId }) => {
      // Add optimistic update
      queryClient.setQueryData(queryKeys.taskComments(taskId), (old) => {
        return old ? [...old, newComment] : [newComment];
      });
      
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add comment';
      toast.error(message);
    },
  });
};

// Task Activities Hooks
export const useTaskActivities = (taskId) => {
  return useQuery({
    queryKey: queryKeys.taskActivities(taskId),
    queryFn: () => taskActivitiesAPI.getByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Optimistic Updates Helper
export const useOptimisticTaskUpdate = () => {
  const queryClient = useQueryClient();
  
  const updateTaskOptimistically = (taskId, updates) => {
    // Update single task
    queryClient.setQueryData(queryKeys.task(taskId), (old) => {
      return old ? { ...old, ...updates } : null;
    });
    
    // Update task in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.tasks, exact: false },
      (old) => {
        if (!old) return old;
        return old.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
      }
    );
  };
  
  return { updateTaskOptimistically };
};

// Prefetch helpers
export const usePrefetchTask = () => {
  const queryClient = useQueryClient();
  
  const prefetchTask = (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.task(id),
      queryFn: () => tasksAPI.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  return { prefetchTask };
};

// Bulk operations
export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tasksAPI.bulkUpdate,
    onSuccess: () => {
      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      toast.success('Tasks updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update tasks';
      toast.error(message);
    },
  });
};

// Analytics Hooks
export const useTaskAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'tasks'],
    queryFn: async () => {
      // Mock analytics data - replace with actual API call
      const tasks = await tasksAPI.getAll();
      
      const analytics = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 2).length,
        inProgressTasks: tasks.filter(t => t.status === 1).length,
        pendingTasks: tasks.filter(t => t.status === 0).length,
        completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 2).length / tasks.length * 100).toFixed(1) : 0,
        
        // Weekly data for charts
        weeklyData: (() => {
          const weeks = [];
          const now = new Date();
          
          for (let i = 6; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekTasks = tasks.filter(task => {
              const taskDate = new Date(task.createdAt);
              return taskDate >= weekStart && taskDate <= weekEnd;
            });
            
            weeks.push({
              week: `W${i === 0 ? 'Current' : i + 1}`,
              date: weekStart.toISOString().split('T')[0],
              total: weekTasks.length,
              completed: weekTasks.filter(t => t.status === 2).length,
              inProgress: weekTasks.filter(t => t.status === 1).length,
              pending: weekTasks.filter(t => t.status === 0).length
            });
          }
          
          return weeks;
        })()
      };
      
      return analytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};