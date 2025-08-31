import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Tag, 
  AlertCircle, 
  Clock, 
  CheckSquare,
  MoreHorizontal,
  MessageSquare,
  Paperclip
} from 'lucide-react';

const EnhancedTaskCard = ({ 
  task, 
  users, 
  categories, 
  isSelected, 
  onSelection, 
  bulkOperationMode,
  compactMode = false,
  isDragging = false 
}) => {
  const assignedUser = users?.find(user => user.id === task.assignedUserId);
  const category = categories?.find(cat => cat.id === task.categoryId);
  
  // Calculate due date status
  const getDueDateStatus = () => {
    if (!task.dueDate) return null;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { type: 'overdue', text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600 bg-red-50' };
    } else if (diffDays === 0) {
      return { type: 'today', text: 'Due today', color: 'text-orange-600 bg-orange-50' };
    } else if (diffDays <= 3) {
      return { type: 'urgent', text: `${diffDays} days left`, color: 'text-yellow-600 bg-yellow-50' };
    }
    return null;
  };

  const dueDateStatus = getDueDateStatus();
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 0: return 'bg-green-500'; // Low
      case 1: return 'bg-yellow-500'; // Medium
      case 2: return 'bg-orange-500'; // High
      case 3: return 'bg-red-500'; // Critical
      default: return 'bg-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 0: return 'Low';
      case 1: return 'Medium';
      case 2: return 'High';
      case 3: return 'Critical';
      default: return 'None';
    }
  };

  const handleSelection = (e) => {
    e.stopPropagation();
    onSelection(task.id, !isSelected);
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-white dark:bg-gray-800 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
        isDragging 
          ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50' 
          : 'border-gray-200 dark:border-gray-700'
      } ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' 
          : ''
      } ${
        compactMode ? 'p-3' : 'p-4'
      }`}
    >
      {/* Priority indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(task.priority)} rounded-l-xl`} />
      
      {/* Selection checkbox for bulk operations */}
      {bulkOperationMode && (
        <div className="absolute top-2 right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelection}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}
      
      {/* Task header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 dark:text-white ${
            compactMode ? 'text-sm' : 'text-base'
          } line-clamp-2`}>
            {task.title}
          </h3>
          {!compactMode && task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        {!bulkOperationMode && (
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Task metadata */}
      <div className="space-y-2">
        {/* Category */}
        {category && (
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-gray-400" />
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${category.color}20`, 
                color: category.color 
              }}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </span>
          </div>
        )}
        
        {/* Due date */}
        {task.dueDate && (
          <div className="flex items-center gap-2">
            <Calendar className={`h-3 w-3 ${dueDateStatus ? dueDateStatus.color.split(' ')[0] : 'text-gray-400'}`} />
            <span className={`text-xs ${dueDateStatus ? dueDateStatus.color : 'text-gray-600 dark:text-gray-400'}`}>
              {dueDateStatus ? dueDateStatus.text : new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {/* Assigned user */}
        {assignedUser && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {assignedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {assignedUser.name}
              </span>
            </div>
          </div>
        )}
        
        {/* Priority badge */}
        {task.priority > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-3 w-3 ${getPriorityColor(task.priority).replace('bg-', 'text-')}`} />
            <span className={`text-xs font-medium ${getPriorityColor(task.priority).replace('bg-', 'text-')}`}>
              {getPriorityLabel(task.priority)} Priority
            </span>
          </div>
        )}
      </div>
      
      {/* Task footer */}
      {!compactMode && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-400">
            {/* Comments count */}
            {task.commentsCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{task.commentsCount}</span>
              </div>
            )}
            
            {/* Attachments count */}
            {task.attachmentsCount > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span className="text-xs">{task.attachmentsCount}</span>
              </div>
            )}
          </div>
          
          {/* Created date */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
      
      {/* Drag indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-xl border-2 border-blue-400 border-dashed pointer-events-none"
        />
      )}
    </motion.div>
  );
};

export default EnhancedTaskCard;