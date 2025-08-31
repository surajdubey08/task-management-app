import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Bookmark,
  Settings
} from 'lucide-react';

const AdvancedSearch = ({ 
  filters, 
  onFilterChange, 
  users, 
  categories, 
  onSaveFilter, 
  savedFilters = [],
  onLoadFilter 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [advancedFilters, setAdvancedFilters] = useState({
    title: '',
    description: '',
    assignee: '',
    category: '',
    priority: [],
    status: [],
    dateRange: {
      created: { start: '', end: '' },
      due: { start: '', end: '' },
      updated: { start: '', end: '' }
    },
    tags: [],
    hasAttachments: null,
    isOverdue: null,
    completionDateRange: { start: '', end: '' }
  });

  const statusOptions = [
    { value: 0, label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
    { value: 1, label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: ArrowUp },
    { value: 2, label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 3, label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  const priorityOptions = [
    { value: 0, label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 1, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 2, label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'No Due Date', value: 'no-date' }
  ];

  // Handle search input changes
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    onFilterChange({ search: value });
  };

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (key, value) => {
    const newFilters = { ...advancedFilters, [key]: value };
    setAdvancedFilters(newFilters);
    applyAdvancedFilters(newFilters);
  };

  // Apply advanced filters to the main filter state
  const applyAdvancedFilters = (advanced) => {
    const mainFilters = { ...filters };
    
    // Apply text filters
    if (advanced.title || advanced.description) {
      mainFilters.advanced = {
        ...mainFilters.advanced,
        title: advanced.title,
        description: advanced.description
      };
    }
    
    // Apply assignee filter
    if (advanced.assignee) {
      mainFilters.assignedUsers = [parseInt(advanced.assignee)];
    }
    
    // Apply category filter
    if (advanced.category) {
      mainFilters.categories = [parseInt(advanced.category)];
    }
    
    // Apply priority filter
    if (advanced.priority.length > 0) {
      mainFilters.priorities = advanced.priority;
    }
    
    // Apply status filter
    if (advanced.status.length > 0) {
      mainFilters.statuses = advanced.status;
    }
    
    // Apply date filters
    if (advanced.dateRange.due.start || advanced.dateRange.due.end) {
      mainFilters.dueDateRange = advanced.dateRange.due;
    }
    
    if (advanced.dateRange.created.start || advanced.dateRange.created.end) {
      mainFilters.createdDateRange = advanced.dateRange.created;
    }
    
    // Apply boolean filters
    if (advanced.isOverdue !== null) {
      mainFilters.isOverdue = advanced.isOverdue;
    }
    
    if (advanced.hasAttachments !== null) {
      mainFilters.hasAttachments = advanced.hasAttachments;
    }
    
    onFilterChange(mainFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setAdvancedFilters({
      title: '',
      description: '',
      assignee: '',
      category: '',
      priority: [],
      status: [],
      dateRange: {
        created: { start: '', end: '' },
        due: { start: '', end: '' },
        updated: { start: '', end: '' }
      },
      tags: [],
      hasAttachments: null,
      isOverdue: null,
      completionDateRange: { start: '', end: '' }
    });
    onFilterChange({
      search: '',
      assignedUsers: [],
      categories: [],
      priority: null,
      dueDate: null,
      showCompleted: true
    });
  };

  // Check if any advanced filters are active
  const hasAdvancedFilters = useMemo(() => {
    return advancedFilters.title || 
           advancedFilters.description || 
           advancedFilters.assignee || 
           advancedFilters.category || 
           advancedFilters.priority.length > 0 || 
           advancedFilters.status.length > 0 || 
           advancedFilters.dateRange.due.start || 
           advancedFilters.dateRange.due.end ||
           advancedFilters.dateRange.created.start || 
           advancedFilters.dateRange.created.end ||
           advancedFilters.isOverdue !== null ||
           advancedFilters.hasAttachments !== null;
  }, [advancedFilters]);

  // Handle array filter changes (priority, status)
  const handleArrayFilterChange = (key, value) => {
    const current = advancedFilters[key];
    const newArray = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    handleAdvancedFilterChange(key, newArray);
  };

  // Handle date range changes
  const handleDateRangeChange = (category, type, value) => {
    const newDateRange = {
      ...advancedFilters.dateRange,
      [category]: {
        ...advancedFilters.dateRange[category],
        [type]: value
      }
    };
    handleAdvancedFilterChange('dateRange', newDateRange);
  };

  // Apply date preset
  const applyDatePreset = (preset) => {
    const today = new Date();
    let filterValue = null;
    
    switch (preset) {
      case 'today':
        filterValue = 'today';
        break;
      case 'week':
        filterValue = 'week';
        break;
      case 'month':
        filterValue = 'month';
        break;
      case 'overdue':
        filterValue = 'overdue';
        break;
      case 'no-date':
        filterValue = 'no-date';
        break;
    }
    
    onFilterChange({ ...filters, dueDate: filterValue });
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or assignee..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            {(searchQuery || hasAdvancedFilters) && (
              <button
                onClick={clearAllFilters}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-colors ${
                isExpanded || hasAdvancedFilters
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Advanced filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Date Presets */}
      <div className="flex flex-wrap gap-2">
        {datePresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyDatePreset(preset.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              filters.dueDate === preset.value
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6"
          >
            {/* Text Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title Contains
                </label>
                <input
                  type="text"
                  value={advancedFilters.title}
                  onChange={(e) => handleAdvancedFilterChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Search in titles..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description Contains
                </label>
                <input
                  type="text"
                  value={advancedFilters.description}
                  onChange={(e) => handleAdvancedFilterChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Search in descriptions..."
                />
              </div>
            </div>

            {/* Selection Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignee
                </label>
                <select
                  value={advancedFilters.assignee}
                  onChange={(e) => handleAdvancedFilterChange('assignee', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any assignee</option>
                  <option value="unassigned">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={advancedFilters.category}
                  onChange={(e) => handleAdvancedFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any category</option>
                  <option value="uncategorized">Uncategorized</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-select Filters */}
            <div className="space-y-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => handleArrayFilterChange('priority', priority.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        advancedFilters.priority.includes(priority.value)
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700'
                          : `${priority.color} border-gray-200 dark:border-gray-600 hover:bg-opacity-80`
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => handleArrayFilterChange('status', status.value)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                          advancedFilters.status.includes(status.value)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700'
                            : `${status.color} border-gray-200 dark:border-gray-600 hover:bg-opacity-80`
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Date Ranges</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={advancedFilters.dateRange.due.start}
                      onChange={(e) => handleDateRangeChange('due', 'start', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={advancedFilters.dateRange.due.end}
                      onChange={(e) => handleDateRangeChange('due', 'end', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Created Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Created Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={advancedFilters.dateRange.created.start}
                      onChange={(e) => handleDateRangeChange('created', 'start', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={advancedFilters.dateRange.created.end}
                      onChange={(e) => handleDateRangeChange('created', 'end', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Additional Filters</h4>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.isOverdue === true}
                    onChange={(e) => handleAdvancedFilterChange('isOverdue', e.target.checked ? true : null)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Overdue tasks only</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={advancedFilters.hasAttachments === true}
                    onChange={(e) => handleAdvancedFilterChange('hasAttachments', e.target.checked ? true : null)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Has attachments</span>
                </label>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset All
              </button>
              
              <div className="flex gap-2">
                {onSaveFilter && (
                  <button
                    onClick={() => onSaveFilter(advancedFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Filter
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {(searchQuery || hasAdvancedFilters || filters.assignedUsers?.length > 0 || filters.categories?.length > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <Filter className="h-4 w-4" />
          <span>Filters active</span>
          {searchQuery && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Search: "{searchQuery}"
            </span>
          )}
          {hasAdvancedFilters && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
              Advanced filters
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedSearch;