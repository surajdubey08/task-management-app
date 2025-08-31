import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Grid, 
  List, 
  Filter, 
  Search, 
  Users, 
  Calendar,
  Tag,
  MoreHorizontal,
  Settings,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Columns,
  SortAsc,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks, useUsers, useCategories } from '../hooks/useQueryHooks';
import EnhancedKanbanBoard from '../components/kanban/EnhancedKanbanBoard';
import KanbanFilters from '../components/kanban/KanbanFilters';
import BulkOperations from '../components/kanban/BulkOperations';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const KanbanView = () => {
  const [filters, setFilters] = useState({
    search: '',
    assignedUsers: [],
    categories: [],
    priority: null,
    dueDate: null,
    showCompleted: true
  });
  
  const [viewSettings, setViewSettings] = useState({
    showFilters: false,
    swimlanes: 'none', // 'none', 'user', 'category', 'priority'
    groupBy: 'status', // 'status', 'assignee', 'category'
    compactMode: false,
    showTaskCounts: true,
    autoRefresh: true
  });
  
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkOperationMode, setBulkOperationMode] = useState(false);

  // Data queries
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Search filter - enhanced to search in multiple fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.userName?.toLowerCase().includes(searchLower) ||
        task.categoryName?.toLowerCase().includes(searchLower)
      );
    }
    
    // Advanced text filters
    if (filters.advanced?.title) {
      const titleSearch = filters.advanced.title.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(titleSearch)
      );
    }
    
    if (filters.advanced?.description) {
      const descSearch = filters.advanced.description.toLowerCase();
      filtered = filtered.filter(task => 
        task.description?.toLowerCase().includes(descSearch)
      );
    }
    
    // User filter
    if (filters.assignedUsers && filters.assignedUsers.length > 0) {
      filtered = filtered.filter(task => {
        if (filters.assignedUsers.includes('unassigned')) {
          return !task.assignedUserId || filters.assignedUsers.includes(task.assignedUserId);
        }
        return filters.assignedUsers.includes(task.assignedUserId);
      });
    }
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(task => {
        if (filters.categories.includes('uncategorized')) {
          return !task.categoryId || filters.categories.includes(task.categoryId);
        }
        return filters.categories.includes(task.categoryId);
      });
    }
    
    // Priority filter - support multiple priorities
    if (filters.priority !== null && filters.priority !== undefined) {
      if (Array.isArray(filters.priorities) && filters.priorities.length > 0) {
        filtered = filtered.filter(task => filters.priorities.includes(task.priority));
      } else {
        filtered = filtered.filter(task => task.priority === filters.priority);
      }
    }
    
    // Status filter - support multiple statuses
    if (filters.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(task => filters.statuses.includes(task.status));
    }
    
    // Due date filter with enhanced options
    if (filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.dueDate) {
        case 'overdue':
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) < today && task.status !== 2
          );
          break;
        case 'today':
          filtered = filtered.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });
          break;
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(today.getDate() + 7);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= weekEnd
          );
          break;
        case 'month':
          const monthEnd = new Date(today);
          monthEnd.setMonth(today.getMonth() + 1);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) <= monthEnd
          );
          break;
        case 'no-date':
          filtered = filtered.filter(task => !task.dueDate);
          break;
      }
    }
    
    // Date range filters
    if (filters.dueDateRange?.start || filters.dueDateRange?.end) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        
        if (filters.dueDateRange.start) {
          const startDate = new Date(filters.dueDateRange.start);
          if (dueDate < startDate) return false;
        }
        
        if (filters.dueDateRange.end) {
          const endDate = new Date(filters.dueDateRange.end);
          if (dueDate > endDate) return false;
        }
        
        return true;
      });
    }
    
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      filtered = filtered.filter(task => {
        const createdDate = new Date(task.createdAt);
        
        if (filters.createdDateRange.start) {
          const startDate = new Date(filters.createdDateRange.start);
          if (createdDate < startDate) return false;
        }
        
        if (filters.createdDateRange.end) {
          const endDate = new Date(filters.createdDateRange.end);
          if (createdDate > endDate) return false;
        }
        
        return true;
      });
    }
    
    // Boolean filters
    if (filters.isOverdue === true) {
      filtered = filtered.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 2
      );
    }
    
    if (filters.hasAttachments === true) {
      filtered = filtered.filter(task => 
        task.attachments && task.attachments.length > 0
      );
    }
    
    // Show completed filter
    if (!filters.showCompleted) {
      filtered = filtered.filter(task => task.status !== 2);
    }
    
    return filtered;
  }, [tasks, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      pending: filteredTasks.filter(t => t.status === 0).length,
      inProgress: filteredTasks.filter(t => t.status === 1).length,
      completed: filteredTasks.filter(t => t.status === 2).length,
      overdue: filteredTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 2
      ).length
    };
  }, [filteredTasks]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle view settings changes
  const handleViewSettingChange = (setting, value) => {
    setViewSettings(prev => ({ ...prev, [setting]: value }));
  };

  // Handle bulk operations
  const handleBulkOperation = (operation, data) => {
    if (selectedTasks.size === 0) return;
    
    // The actual implementation is now handled by BulkOperations component
    console.log('Bulk operation:', operation, 'for tasks:', Array.from(selectedTasks), 'data:', data);
  };

  // Handle bulk operation completion
  const handleBulkOperationComplete = () => {
    // Refresh data after bulk operations
    refetchTasks();
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!viewSettings.autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchTasks();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [viewSettings.autoRefresh, refetchTasks]);

  if (tasksLoading) {
    return <LoadingSpinner message="Loading Kanban board...\" />;
  }

  if (tasksError) {
    return <ErrorMessage message="Failed to load tasks\" onRetry={refetchTasks} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Kanban Board 📋
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{stats.total} tasks</span>
              <span>•</span>
              <span>{stats.pending} pending</span>
              <span>•</span>
              <span>{stats.inProgress} in progress</span>
              <span>•</span>
              <span>{stats.completed} completed</span>
              {stats.overdue > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {stats.overdue} overdue
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Bulk Operations Component */}
          <AnimatePresence>
            {bulkOperationMode && selectedTasks.size > 0 && (
              <BulkOperations
                selectedTasks={selectedTasks}
                onClearSelection={() => {
                  setSelectedTasks(new Set());
                  setBulkOperationMode(false);
                }}
                users={users}
                categories={categories}
                onOperationComplete={handleBulkOperationComplete}
              />
            )}
          </AnimatePresence>
          
          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewSettingChange('showFilters', !viewSettings.showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewSettings.showFilters
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            
            <button
              onClick={() => setBulkOperationMode(!bulkOperationMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkOperationMode
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Bulk Select
            </button>
            
            <button
              onClick={() => handleViewSettingChange('autoRefresh', !viewSettings.autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewSettings.autoRefresh
                  ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${viewSettings.autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </button>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Link
              to="/tasks"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <List size={16} />
              List View
            </Link>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
              <Grid size={16} />
              Kanban
            </div>
          </div>
          
          {/* Add Task Button */}
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            <span>New Task</span>
          </Link>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {viewSettings.showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <KanbanFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              users={users}
              categories={categories}
              viewSettings={viewSettings}
              onViewSettingChange={handleViewSettingChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Kanban Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <EnhancedKanbanBoard
          tasks={filteredTasks}
          users={users}
          categories={categories}
          viewSettings={viewSettings}
          selectedTasks={selectedTasks}
          onTaskSelection={setSelectedTasks}
          bulkOperationMode={bulkOperationMode}
          onBulkOperation={handleBulkOperation}
        />
      </div>
    </div>
  );
};

export default KanbanView;