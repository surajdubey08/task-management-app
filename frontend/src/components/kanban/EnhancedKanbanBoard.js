import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreHorizontal, 
  Plus, 
  Users, 
  Calendar,
  AlertCircle,
  Clock,
  CheckSquare,
  User,
  Tag,
  Zap
} from 'lucide-react';
import { useUpdateTask } from '../../hooks/useQueryHooks';
import EnhancedTaskCard from './EnhancedTaskCard';
import toast from 'react-hot-toast';

const EnhancedKanbanBoard = ({ 
  tasks, 
  users, 
  categories, 
  viewSettings, 
  selectedTasks, 
  onTaskSelection, 
  bulkOperationMode,
  onBulkOperation 
}) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const updateTaskMutation = useUpdateTask();

  // Column definitions
  const columnDefinitions = [
    { 
      id: 'pending', 
      title: 'Pending', 
      status: 0, 
      color: 'bg-gray-100 dark:bg-gray-800',
      headerColor: 'bg-gray-50 dark:bg-gray-700',
      accentColor: 'border-gray-300 dark:border-gray-600'
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      status: 1, 
      color: 'bg-blue-50 dark:bg-blue-900/20',
      headerColor: 'bg-blue-100 dark:bg-blue-900/40',
      accentColor: 'border-blue-300 dark:border-blue-600'
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      status: 2, 
      color: 'bg-green-50 dark:bg-green-900/20',
      headerColor: 'bg-green-100 dark:bg-green-900/40',
      accentColor: 'border-green-300 dark:border-green-600'
    },
    { 
      id: 'cancelled', 
      title: 'Cancelled', 
      status: 3, 
      color: 'bg-red-50 dark:bg-red-900/20',
      headerColor: 'bg-red-100 dark:bg-red-900/40',
      accentColor: 'border-red-300 dark:border-red-600'
    }
  ];

  // Group tasks by swimlanes if enabled
  const groupedTasks = useMemo(() => {
    if (viewSettings.swimlanes === 'none') {
      return { default: tasks };
    }

    const groups = {};
    
    tasks.forEach(task => {
      let groupKey = 'unassigned';
      
      switch (viewSettings.swimlanes) {
        case 'user':
          if (task.assignedUserId) {
            const user = users.find(u => u.id === task.assignedUserId);
            groupKey = user ? user.name : 'Unassigned';
          } else {
            groupKey = 'Unassigned';
          }
          break;
        case 'category':
          if (task.categoryId) {
            const category = categories.find(c => c.id === task.categoryId);
            groupKey = category ? category.name : 'Uncategorized';
          } else {
            groupKey = 'Uncategorized';
          }
          break;
        case 'priority':
          const priorityLabels = { 0: 'Low Priority', 1: 'Medium Priority', 2: 'High Priority' };
          groupKey = priorityLabels[task.priority] || 'No Priority';
          break;
        default:
          groupKey = 'default';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [tasks, viewSettings.swimlanes, users, categories]);

  // Get tasks for a specific column and swimlane
  const getTasksForColumn = useCallback((column, swimlane = 'default') => {
    const swimlaneTasks = groupedTasks[swimlane] || [];
    return swimlaneTasks.filter(task => task.status === column.status);
  }, [groupedTasks]);

  // Handle drag end
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    setDraggedTask(null);

    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    const [destColumnId] = destination.droppableId.split('-');
    const destColumn = columnDefinitions.find(col => col.id === destColumnId);
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (!destColumn || !task) {
      return;
    }

    const newStatus = destColumn.status;
    
    // Show optimistic update
    toast.loading('Updating task...', { id: `update-${task.id}` });

    // Update task status
    updateTaskMutation.mutate(
      {
        id: task.id,
        ...task,
        status: newStatus
      },
      {
        onSuccess: () => {
          toast.success('Task updated successfully', { id: `update-${task.id}` });
        },
        onError: (error) => {
          toast.error('Failed to update task', { id: `update-${task.id}` });
          console.error('Error updating task:', error);
        }
      }
    );
  }, [tasks, updateTaskMutation, columnDefinitions]);

  // Handle drag start
  const handleDragStart = useCallback((start) => {
    const task = tasks.find(t => t.id.toString() === start.draggableId);
    setDraggedTask(task);
  }, [tasks]);

  // Handle task selection for bulk operations
  const handleTaskSelection = useCallback((taskId, isSelected) => {
    if (!bulkOperationMode) return;
    
    const newSelection = new Set(selectedTasks);
    if (isSelected) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    onTaskSelection(newSelection);
  }, [bulkOperationMode, selectedTasks, onTaskSelection]);

  // Render swimlane header
  const renderSwimlaneHeader = (swimlaneName, tasksCount) => {
    if (viewSettings.swimlanes === 'none') return null;
    
    const getIcon = () => {
      switch (viewSettings.swimlanes) {
        case 'user': return <User className=\"h-4 w-4\" />;
        case 'category': return <Tag className=\"h-4 w-4\" />;
        case 'priority': return <Zap className=\"h-4 w-4\" />;
        default: return null;
      }
    };

    return (
      <div className=\"flex items-center justify-between mb-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600\">
        <div className=\"flex items-center gap-2\">
          {getIcon()}
          <h3 className=\"font-semibold text-gray-900 dark:text-white\">
            {swimlaneName}
          </h3>
          <span className=\"text-sm text-gray-500 dark:text-gray-400\">
            ({tasksCount} tasks)
          </span>
        </div>
      </div>
    );
  };

  // Render column header
  const renderColumnHeader = (column, tasksCount) => (
    <div className={`p-4 ${column.headerColor} border-b ${column.accentColor}`}>
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center gap-2\">
          <h3 className=\"font-semibold text-gray-900 dark:text-white\">
            {column.title}
          </h3>
          {viewSettings.showTaskCounts && (
            <span className=\"bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium\">
              {tasksCount}
            </span>
          )}
        </div>
        <button className=\"p-1 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors\">
          <MoreHorizontal className=\"h-4 w-4 text-gray-500\" />
        </button>
      </div>
      
      {/* Quick add button */}
      <button className=\"mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500\">
        <Plus className=\"h-4 w-4\" />
        Add task
      </button>
    </div>
  );

  return (
    <div className=\"h-full overflow-hidden\">
      <DragDropContext 
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
      >
        <div className=\"h-full space-y-6\">
          {Object.entries(groupedTasks).map(([swimlaneName, swimlaneTasks]) => (
            <div key={swimlaneName} className=\"space-y-4\">
              {renderSwimlaneHeader(swimlaneName, swimlaneTasks.length)}
              
              <div className=\"flex gap-6 h-auto min-h-96 overflow-x-auto pb-4\">
                {columnDefinitions.map((column) => {
                  const columnTasks = getTasksForColumn(column, swimlaneName);
                  const droppableId = viewSettings.swimlanes === 'none' 
                    ? column.id 
                    : `${column.id}-${swimlaneName}`;
                  
                  return (
                    <motion.div
                      key={droppableId}
                      layout
                      className={`flex-shrink-0 w-80 ${column.color} rounded-xl border ${column.accentColor} shadow-sm overflow-hidden`}
                    >
                      {renderColumnHeader(column, columnTasks.length)}
                      
                      <Droppable droppableId={droppableId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-4 min-h-32 transition-all duration-300 ease-in-out ${
                              snapshot.isDraggingOver
                                ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-300 ring-opacity-50 scale-105'
                                : 'scale-100'
                            }`}
                          >
                            <AnimatePresence>
                              {columnTasks.map((task, index) => (
                                <Draggable
                                  key={task.id}
                                  draggableId={task.id.toString()}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <motion.div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      layout
                                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                      animate={{ 
                                        opacity: 1, 
                                        y: 0, 
                                        scale: snapshot.isDragging ? 1.05 : 1,
                                        rotate: snapshot.isDragging ? 2 : 0,
                                        zIndex: snapshot.isDragging ? 1000 : 1
                                      }}
                                      exit={{ 
                                        opacity: 0, 
                                        y: -20, 
                                        scale: 0.9,
                                        transition: { duration: 0.2 }
                                      }}
                                      whileHover={!snapshot.isDragging ? { 
                                        y: -4, 
                                        scale: 1.02,
                                        transition: { duration: 0.2 }
                                      } : {}}
                                      className={`mb-3 transform transition-all duration-200 ${
                                        snapshot.isDragging
                                          ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-75 cursor-grabbing'
                                          : 'cursor-grab hover:shadow-lg'
                                      }`}
                                      style={{
                                        ...provided.draggableProps.style,
                                        transform: snapshot.isDragging 
                                          ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.05)`
                                          : provided.draggableProps.style?.transform
                                      }}
                                    >
                                      <EnhancedTaskCard
                                        task={task}
                                        users={users}
                                        categories={categories}
                                        isSelected={selectedTasks.has(task.id)}
                                        onSelection={handleTaskSelection}
                                        bulkOperationMode={bulkOperationMode}
                                        compactMode={viewSettings.compactMode}
                                        isDragging={snapshot.isDragging}
                                      />
                                    </motion.div>
                                  )}
                                </Draggable>
                              ))}
                            </AnimatePresence>
                            {provided.placeholder}
                            
                            {/* Drop zone indicator */}
                            {snapshot.isDraggingOver && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className=\"border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center text-blue-600 dark:text-blue-400 text-sm font-medium\"
                              >
                                Drop task here
                              </motion.div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Drag preview overlay */}
      {draggedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className=\"fixed top-4 right-4 z-50 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg p-3 shadow-lg\"
        >
          <div className=\"flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100\">
            <div className=\"w-2 h-2 bg-blue-500 rounded-full animate-pulse\" />
            Dragging: {draggedTask.title}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedKanbanBoard;