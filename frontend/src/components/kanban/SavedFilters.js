import React from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  Bookmark,
  Trash2,
  Filter,
  Star,
  Eye
} from 'lucide-react';

const SavedFilters = ({ 
  savedFilters = [], 
  onLoadFilter, 
  onDeleteFilter, 
  currentFilters 
}) => {
  if (savedFilters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No saved filters yet</p>
        <p className="text-xs">Save your current filters to quickly access them later</p>
      </div>
    );
  }

  return (
    <div className=\"space-y-3\">
      <h4 className=\"font-medium text-gray-900 dark:text-white flex items-center gap-2\">
        <Bookmark className=\"h-4 w-4\" />
        Saved Filters
      </h4>
      
      <div className=\"space-y-2\">
        {savedFilters.map((filter, index) => (
          <motion.div
            key={filter.id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className=\"flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors\"
          >
            <div className=\"flex-1\">
              <div className=\"flex items-center gap-2\">
                <Star className=\"h-4 w-4 text-yellow-500\" />
                <span className=\"font-medium text-gray-900 dark:text-white\">
                  {filter.name}
                </span>
              </div>
              <p className=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">
                {filter.description || 'Custom filter settings'}
              </p>
            </div>
            
            <div className=\"flex items-center gap-2\">
              <button
                onClick={() => onLoadFilter(filter)}
                className=\"p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors\"
                title=\"Apply filter\"
              >
                <Eye className=\"h-4 w-4\" />
              </button>
              
              <button
                onClick={() => onDeleteFilter(filter.id || index)}
                className=\"p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors\"
                title=\"Delete filter\"
              >
                <Trash2 className=\"h-4 w-4\" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SavedFilters;