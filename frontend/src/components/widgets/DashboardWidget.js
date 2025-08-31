import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
  Settings,
  Download,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const DashboardWidget = ({
  id,
  title,
  children,
  className = '',
  isLoading = false,
  error = null,
  onRefresh,
  onRemove,
  onSettings,
  onExport,
  canResize = true,
  canRemove = true,
  size = 'medium', // small, medium, large
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-2',
    large: 'col-span-3 row-span-2',
    full: 'col-span-full row-span-3',
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    onRefresh?.();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(id);
  };

  const handleSettings = (e) => {
    e.stopPropagation();
    onSettings?.(id);
  };

  const handleExport = (e) => {
    e.stopPropagation();
    onExport?.(id);
  };

  const currentSize = isExpanded ? 'full' : size;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700',
        'relative overflow-hidden group hover:shadow-xl transition-all duration-200',
        sizeClasses[currentSize],
        isExpanded && 'fixed inset-4 z-50 !col-span-1 !row-span-1',
        className
      )}
      {...props}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {isLoading && (
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {canResize && (
                  <button
                    onClick={handleToggleExpand}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {isExpanded ? (
                      <>
                        <Minimize2 className="h-4 w-4" />
                        Minimize
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" />
                        Expand
                      </>
                    )}
                  </button>
                )}

                {onSettings && (
                  <button
                    onClick={handleSettings}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                )}

                {onExport && (
                  <button
                    onClick={handleExport}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                )}

                {canRemove && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                    <button
                      onClick={handleRemove}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4 h-full overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-red-500 dark:text-red-400">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm mt-1">{error}</p>
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Resize Handle */}
      {canResize && (
        <div className="absolute bottom-2 right-2 w-3 h-3 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity">
          <div className="w-full h-full bg-gray-400 dark:bg-gray-500 rounded-tl-lg cursor-se-resize" />
        </div>
      )}

      {/* Close overlay for expanded mode */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
          onClick={handleToggleExpand}
        />
      )}
    </motion.div>
  );
};

export default DashboardWidget;