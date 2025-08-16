import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { tasksApi, taskDependenciesApi } from '../services/api';
import KanbanColumn from './KanbanColumn';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const KanbanBoard = () => {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Compact error message function
  const showCompactError = (title, details) => {
    toast.error(
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm">{title}</div>
          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
            {details.split('\n').slice(0, 2).join(', ')}
          </div>
        </div>
      </div>,
      {
        duration: 4000,
        style: {
          maxWidth: '350px',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
        },
        position: 'top-right',
      }
    );
  };


  // Define the columns structure
  const columnDefinitions = [
    { id: 'pending', title: 'Pending', status: 0 },
    { id: 'in-progress', title: 'In Progress', status: 1 },
    { id: 'completed', title: 'Completed', status: 2 },
    { id: 'cancelled', title: 'Cancelled', status: 3 },
  ];

  // Fetch tasks with optimized settings
  const { data: tasksData, isLoading, error, refetch } = useQuery(
    'kanban-tasks',
    () => tasksApi.getAll().then(res => res.data),
    {
      refetchInterval: 60000, // Refresh every 60 seconds (reduced frequency)
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  );

  // Check if task can be moved to new status with proper error handling
  const checkTaskCanMove = async (taskId, newStatus) => {
    try {
      // Only check dependencies for In Progress (1) and Completed (2) statuses
      if (newStatus === 1 || newStatus === 2) {
        console.log(`Checking dependencies for task ${taskId} moving to status ${newStatus}`);

        // Make both API calls and wait for both to complete
        const [canStartResponse, reasonsResponse] = await Promise.all([
          taskDependenciesApi.canTaskStart(taskId),
          taskDependenciesApi.getBlockingReasons(taskId)
        ]);

        const canStart = canStartResponse.data;
        const reasons = reasonsResponse.data;

        console.log(`Task ${taskId} canStart: ${canStart}, reasons:`, reasons);

        if (!canStart && reasons.length > 0) {
          return { canMove: false, reasons };
        }
      }
      return { canMove: true, reasons: [] };
    } catch (error) {
      console.error('Error checking task dependencies:', error);
      // Be more conservative - if we can't check, don't allow risky moves
      if (newStatus === 1 || newStatus === 2) {
        return { canMove: false, reasons: ['Unable to verify dependencies. Please try again.'] };
      }
      return { canMove: true, reasons: [] };
    }
  };

  // Update task status mutation - optimized for drag and drop
  const updateTaskMutation = useMutation(
    ({ taskId, updateData }) => {
      console.log(`Updating task ${taskId} with data:`, updateData);
      return tasksApi.update(taskId, updateData);
    },
    {
      onSuccess: (data, variables) => {
        console.log(`Successfully updated task ${variables.taskId}`);

        // Invalidate related queries to ensure fresh data for ALL tasks
        // This is important because changing one task's status can affect other tasks' blocking status
        queryClient.invalidateQueries('kanban-tasks');
        queryClient.invalidateQueries('tasks');

        // Invalidate all dependency-related queries
        queryClient.invalidateQueries(['taskCanStart']);
        queryClient.invalidateQueries(['taskDependencies']);

        // Don't show success toast for drag operations to avoid spam
        // toast.success('Task updated successfully');
      },
      onError: (error, variables) => {
        console.error('Task update failed:', error);

        // Revert optimistic update on backend failure
        refetch();

        // Show detailed error message from backend
        const errorMessage = error.response?.data || error.message || 'Failed to update task';

        // Check if it's a dependency error for special formatting
        if (errorMessage.includes('dependent tasks would become invalid') ||
            errorMessage.includes('blocked by dependencies')) {
          const parts = errorMessage.split(':');
          const title = parts[0] || 'Cannot update task';
          const details = parts.slice(1).join(':').trim() || errorMessage;
          showCompactError(title, details);
        } else {
          toast.error(errorMessage, {
            duration: 4000,
            style: {
              maxWidth: '350px',
            }
          });
        }
      },
    }
  );



  // Organize tasks by status when data changes
  useEffect(() => {
    if (tasksData) {
      setTasks(tasksData);

      // Initialize columns with tasks
      const initialColumns = columnDefinitions.map(colDef => ({
        ...colDef,
        taskIds: tasksData
          .filter(task => task.status === colDef.status)
          .map(task => task.id.toString())
      }));

      setColumns(initialColumns);
    }
  }, [tasksData]);



  // Handle drag end with smooth UX and dependency validation
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (!sourceColumn || !destColumn || !task) {
      return;
    }

    const newStatus = destColumn.status;

    // Validate SYNCHRONOUSLY first - no async here
    setIsValidating(true);

    // Check dependencies synchronously using the existing dependency check
    checkTaskCanMove(task.id, newStatus)
      .then(({ canMove, reasons }) => {
        if (!canMove) {
          const statusNames = { 0: 'Pending', 1: 'In Progress', 2: 'Completed', 3: 'Cancelled' };
          const errorMessage = `Cannot move "${task.title}" to ${statusNames[newStatus]}`;
          const reasonsList = reasons.join('\n• ');

          // Show compact error message
          showCompactError(errorMessage, reasonsList);
          setIsValidating(false);
          return; // Don't make any changes - card stays in place
        }

        // If validation passes, THEN update UI optimistically
        const newColumns = columns.map(column => {
          if (column.id === source.droppableId) {
            // Remove from source column
            const newTaskIds = [...column.taskIds];
            newTaskIds.splice(source.index, 1);
            return { ...column, taskIds: newTaskIds };
          } else if (column.id === destination.droppableId) {
            // Add to destination column
            const newTaskIds = [...column.taskIds];
            newTaskIds.splice(destination.index, 0, draggableId);
            return { ...column, taskIds: newTaskIds };
          }
          return column;
        });

        // Update local state after validation passes
        setColumns(newColumns);

        // Update task in local tasks array
        const updatedTasks = tasks.map(t =>
          t.id.toString() === draggableId
            ? { ...t, status: newStatus }
            : t
        );
        setTasks(updatedTasks);

        // Update backend
        const updateData = {
          title: task.title,
          description: task.description || '',
          status: newStatus,
          priority: task.priority,
          dueDate: task.dueDate,
          userId: task.userId || 1,
          categoryId: task.categoryId,
        };

        updateTaskMutation.mutate({ taskId: task.id, updateData });
        setIsValidating(false);
      })
      .catch(error => {
        console.error('Error during drag operation:', error);

        // Show detailed error message if available
        const errorMessage = error.response?.data || error.message || 'Unable to verify dependencies. Please try again.';
        showCompactError('Failed to move task', errorMessage);
        setIsValidating(false);
      });
  }, [columns, tasks, updateTaskMutation, checkTaskCanMove]);

  // Get tasks for a specific column
  const getTasksForColumn = (column) => {
    return column.taskIds
      .map(taskId => tasks.find(task => task.id.toString() === taskId))
      .filter(Boolean); // Remove any undefined tasks
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Kanban board..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load tasks" onRetry={refetch} />;
  }

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          {columns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksForColumn(column)}
              index={index}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
