import React from 'react';
import { 
  Search, 
  Users, 
  Tag, 
  Calendar, 
  Filter, 
  X,
  ChevronDown,
  AlertCircle,
  Clock,
  Columns,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdvancedSearch from './AdvancedSearch';

const KanbanFilters = ({ 
  filters, 
  onFilterChange, 
  users, 
  categories, 
  viewSettings, 
  onViewSettingChange 
}) => {
  const priorityOptions = [
    { value: 0, label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 1, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 2, label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const dueDateOptions = [
    { value: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-red-600' },
    { value: 'today', label: 'Due Today', icon: Clock, color: 'text-orange-600' },
    { value: 'week', label: 'This Week', icon: Calendar, color: 'text-blue-600' },
    { value: 'month', label: 'This Month', icon: Calendar, color: 'text-purple-600' }
  ];

  const swimlaneOptions = [
    { value: 'none', label: 'No Swimlanes' },
    { value: 'user', label: 'By Assignee' },
    { value: 'category', label: 'By Category' },
    { value: 'priority', label: 'By Priority' }
  ];

  const handleUserFilterChange = (userId) => {
    const newUsers = filters.assignedUsers.includes(userId)
      ? filters.assignedUsers.filter(id => id !== userId)
      : [...filters.assignedUsers, userId];
    onFilterChange({ assignedUsers: newUsers });
  };

  const handleCategoryFilterChange = (categoryId) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ categories: newCategories });
  };

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      assignedUsers: [],
      categories: [],
      priority: null,
      dueDate: null,
      showCompleted: true
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.assignedUsers.length > 0 || 
    filters.categories.length > 0 || 
    filters.priority !== null || 
    filters.dueDate !== null || 
    !filters.showCompleted;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
    >
      {/* Advanced Search Component */}
      <AdvancedSearch
        filters={filters}
        onFilterChange={onFilterChange}
        users={users}
        categories={categories}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Search and Quick Filters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Quick Filters
          </h3>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Due Date Quick Filters */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Due Date
            </label>
            <div className="flex flex-wrap gap-2">
              {dueDateOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = filters.dueDate === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ 
                      dueDate: isSelected ? null : option.value 
                    })}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${isSelected ? 'text-blue-600' : option.color}`} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Show Completed Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Completed Tasks
            </label>
            <button
              onClick={() => onFilterChange({ showCompleted: !filters.showCompleted })}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filters.showCompleted
                  ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {filters.showCompleted ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {filters.showCompleted ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>

        {/* Assignment and Category Filters */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Assignment & Categories
          </h3>
          
          {/* Assigned Users */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Users
            </label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {users.map((user) => {
                const isSelected = filters.assignedUsers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserFilterChange(user.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-blue-600' : 'bg-gray-400'
                    }`} />
                    <span className="truncate">{user.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      {user.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Categories */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isSelected = filters.categories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryFilterChange(category.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => {
                const isSelected = filters.priority === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ 
                      priority: isSelected ? null : option.value 
                    })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                        : `${option.color} hover:opacity-80`
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* View Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Columns className="h-4 w-4" />
            View Settings
          </h3>
          
          {/* Swimlanes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Swimlanes
            </label>
            <div className="relative">
              <select
                value={viewSettings.swimlanes}
                onChange={(e) => onViewSettingChange('swimlanes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                {swimlaneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* View Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Options
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Compact Mode</span>
                <button
                  onClick={() => onViewSettingChange('compactMode', !viewSettings.compactMode)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    viewSettings.compactMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    viewSettings.compactMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Task Counts</span>
                <button
                  onClick={() => onViewSettingChange('showTaskCounts', !viewSettings.showTaskCounts)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    viewSettings.showTaskCounts ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    viewSettings.showTaskCounts ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {hasActiveFilters && (
            <span>Active filters applied</span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default KanbanFilters;