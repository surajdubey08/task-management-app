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
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // User filter
    if (filters.assignedUsers.length > 0) {
      filtered = filtered.filter(task => 
        filters.assignedUsers.includes(task.assignedUserId)
      );
    }
    
    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(task => 
        filters.categories.includes(task.categoryId)
      );
    }
    
    // Priority filter
    if (filters.priority !== null) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    // Due date filter
    if (filters.dueDate) {
      const today = new Date();
      const filterDate = new Date(today);
      
      switch (filters.dueDate) {
        case 'overdue':
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) < today && task.status !== 2
          );
          break;
        case 'today':
          filterDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) <= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() + 7);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) <= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() + 1);
          filtered = filtered.filter(task => 
            task.dueDate && new Date(task.dueDate) <= filterDate
          );
          break;
      }
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
    
    // Implement bulk operations
    console.log('Bulk operation:', operation, 'for tasks:', Array.from(selectedTasks), 'data:', data);
    
    // Clear selection after operation
    setSelectedTasks(new Set());
    setBulkOperationMode(false);
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
    return <LoadingSpinner message=\"Loading Kanban board...\" />;
  }

  if (tasksError) {
    return <ErrorMessage message=\"Failed to load tasks\" onRetry={refetchTasks} />;
  }

  return (
    <div className=\"h-full flex flex-col\">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className=\"flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6\"
      >
        <div className=\"flex items-center gap-4\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900 dark:text-white mb-2\">
              Kanban Board 📋
            </h1>
            <div className=\"flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400\">
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
                  <span className=\"text-red-600 dark:text-red-400 font-medium\">
                    {stats.overdue} overdue
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className=\"flex items-center gap-3\">
          {/* Bulk Operations */}
          <AnimatePresence>
            {bulkOperationMode && selectedTasks.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className=\"flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2\"
              >
                <CheckSquare className=\"h-4 w-4 text-blue-600\" />
                <span className=\"text-sm font-medium text-blue-900 dark:text-blue-100\">
                  {selectedTasks.size} selected
                </span>
                <button
                  onClick={() => handleBulkOperation('move', { status: 1 })}
                  className=\"text-xs bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-1 rounded\"
                >
                  Move to Progress
                </button>
                <button
                  onClick={() => handleBulkOperation('move', { status: 2 })}
                  className=\"text-xs bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 px-2 py-1 rounded\"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => setSelectedTasks(new Set())}
                  className=\"text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300\"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* View Controls */}
          <div className=\"flex items-center gap-2\">
            <button
              onClick={() => handleViewSettingChange('showFilters', !viewSettings.showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewSettings.showFilters
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className=\"h-4 w-4\" />
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
              <CheckSquare className=\"h-4 w-4\" />
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
          <div className=\"flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1\">
            <Link
              to=\"/tasks\"
              className=\"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors\"
            >
              <List size={16} />
              List View
            </Link>
            <div className=\"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm\">
              <Grid size={16} />
              Kanban
            </div>
          </div>
          
          {/* Add Task Button */}
          <Link
            to=\"/tasks/new\"
            className=\"inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl\"
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
            className=\"mb-6\"
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
      <div className=\"flex-1 min-h-0 overflow-hidden\">
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