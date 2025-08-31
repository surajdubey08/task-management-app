import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Move,
  User,
  Tag,
  Calendar,
  Trash2,
  Settings,
  ArrowRight,
  X,
  AlertTriangle,
  Users,
  Edit3,
  Clock,
  Target,
  XCircle
} from 'lucide-react';
import { useUpdateTask, useDeleteTask } from '../../hooks/useQueryHooks';
import toast from 'react-hot-toast';

const BulkOperations = ({ 
  selectedTasks, 
  onClearSelection, 
  users, 
  categories,
  onOperationComplete 
}) => {
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationType, setOperationType] = useState(null);
  const [operationData, setOperationData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const selectedTasksArray = Array.from(selectedTasks);
  const selectedCount = selectedTasksArray.length;

  // Status options for bulk operations
  const statusOptions = [
    { value: 0, label: 'Pending', icon: Clock, color: 'bg-gray-100 text-gray-800' },
    { value: 1, label: 'In Progress', icon: ArrowRight, color: 'bg-blue-100 text-blue-800' },
    { value: 2, label: 'Completed', icon: Target, color: 'bg-green-100 text-green-800' },
    { value: 3, label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 0, label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 1, label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 2, label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  // Handle bulk operation execution
  const executeBulkOperation = async () => {
    if (selectedCount === 0) return;

    setIsProcessing(true);
    
    try {
      switch (operationType) {
        case 'status':
          await bulkUpdateStatus(operationData.status);
          break;
        case 'assignee':
          await bulkUpdateAssignee(operationData.assigneeId);
          break;
        case 'category':
          await bulkUpdateCategory(operationData.categoryId);
          break;
        case 'priority':
          await bulkUpdatePriority(operationData.priority);
          break;
        case 'dueDate':
          await bulkUpdateDueDate(operationData.dueDate);
          break;
        case 'delete':
          await bulkDelete();
          break;
        default:
          throw new Error('Unknown operation type');
      }
      
      toast.success(`Successfully updated ${selectedCount} task(s)`);
      setShowOperationModal(false);
      onClearSelection();
      onOperationComplete?.();
      
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Failed to complete bulk operation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk update functions
  const bulkUpdateStatus = async (newStatus) => {
    const promises = selectedTasksArray.map(taskId => 
      updateTaskMutation.mutateAsync({
        id: taskId,
        status: newStatus
      })
    );
    await Promise.all(promises);
  };

  const bulkUpdateAssignee = async (assigneeId) => {
    const promises = selectedTasksArray.map(taskId => 
      updateTaskMutation.mutateAsync({
        id: taskId,
        assignedUserId: assigneeId
      })
    );
    await Promise.all(promises);
  };

  const bulkUpdateCategory = async (categoryId) => {
    const promises = selectedTasksArray.map(taskId => 
      updateTaskMutation.mutateAsync({
        id: taskId,
        categoryId: categoryId
      })
    );
    await Promise.all(promises);
  };

  const bulkUpdatePriority = async (priority) => {
    const promises = selectedTasksArray.map(taskId => 
      updateTaskMutation.mutateAsync({
        id: taskId,
        priority: priority
      })
    );
    await Promise.all(promises);
  };

  const bulkUpdateDueDate = async (dueDate) => {
    const promises = selectedTasksArray.map(taskId => 
      updateTaskMutation.mutateAsync({
        id: taskId,
        dueDate: dueDate
      })
    );
    await Promise.all(promises);
  };

  const bulkDelete = async () => {
    const promises = selectedTasksArray.map(taskId => 
      deleteTaskMutation.mutateAsync(taskId)
    );
    await Promise.all(promises);
  };

  // Operation handlers
  const handleOperationClick = (type, data = {}) => {
    setOperationType(type);
    setOperationData(data);
    
    if (type === 'status' && data.status !== undefined) {
      // Direct status change
      setOperationData({ status: data.status });
      setShowOperationModal(true);
    } else {
      setShowOperationModal(true);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      {/* Bulk Operations Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} task{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Actions */}
          <button
            onClick={() => handleOperationClick('status', { status: 1 })}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            Move to Progress
          </button>
          
          <button
            onClick={() => handleOperationClick('status', { status: 2 })}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
          >
            <Target className="h-4 w-4" />
            Mark Complete
          </button>

          {/* More Options */}
          <button
            onClick={() => setShowOperationModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            More Options
          </button>

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </motion.div>

      {/* Bulk Operations Modal */}
      <AnimatePresence>
        {showOperationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bulk Operations ({selectedCount} tasks)
                </h3>
                <button
                  onClick={() => setShowOperationModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Status Update */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Move className="h-5 w-5" />
                    Change Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.value}
                          onClick={() => {
                            setOperationType('status');
                            setOperationData({ status: status.value });
                          }}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            operationType === 'status' && operationData.status === status.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee Update */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Change Assignee
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={operationType === 'assignee' ? (operationData.assigneeId || '') : ''}
                      onChange={(e) => {
                        setOperationType('assignee');
                        setOperationData({ assigneeId: e.target.value ? parseInt(e.target.value) : null });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select assignee...</option>
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category Update */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Change Category
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={operationType === 'category' ? (operationData.categoryId || '') : ''}
                      onChange={(e) => {
                        setOperationType('category');
                        setOperationData({ categoryId: e.target.value ? parseInt(e.target.value) : null });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      <option value="">No category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Priority Update */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Change Priority
                  </h4>
                  <div className="flex gap-2">
                    {priorityOptions.map((priority) => (
                      <button
                        key={priority.value}
                        onClick={() => {
                          setOperationType('priority');
                          setOperationData({ priority: priority.value });
                        }}
                        className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                          operationType === 'priority' && operationData.priority === priority.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className={`block px-2 py-1 rounded text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date Update */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Change Due Date
                  </h4>
                  <input
                    type="date"
                    value={operationType === 'dueDate' ? (operationData.dueDate || '') : ''}
                    onChange={(e) => {
                      setOperationType('dueDate');
                      setOperationData({ dueDate: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Delete Operation */}
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Delete Tasks
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone. {selectedCount} task{selectedCount > 1 ? 's' : ''} will be permanently deleted.
                  </p>
                  <button
                    onClick={() => {
                      setOperationType('delete');
                      setOperationData({});
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      operationType === 'delete'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-red-200 dark:border-red-600 hover:border-red-300 dark:hover:border-red-500 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete {selectedCount} task{selectedCount > 1 ? 's' : ''}
                    </div>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowOperationModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={executeBulkOperation}
                  disabled={!operationType || isProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkOperations;