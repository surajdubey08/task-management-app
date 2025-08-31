import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { tasksApi } from '../services/api';
import KanbanColumn from './KanbanColumn';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const KanbanBoard = () => {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const queryClient = useQueryClient();




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



  // Update task status mutation - optimized for drag and drop
  const updateTaskMutation = useMutation(
    ({ taskId, updateData }) => {
      console.log(`Updating task ${taskId} with data:`, updateData);
      return tasksApi.update(taskId, updateData);
    },
    {
      onSuccess: (_, variables) => {
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
      onError: (error) => {
        // Revert optimistic update on backend failure
        refetch();

        // Show detailed error message from backend
        const errorMessage = error.response?.data || error.message || 'Failed to update task';

        // Show simple error message
        toast.error(errorMessage, {
          duration: 4000,
          style: {
            maxWidth: '400px',
            fontSize: '14px',
          },
          position: 'top-center',
        });
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

  // Simple drag handling without dependency validation
  const handleDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area or same position
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    const task = tasks.find(t => t.id.toString() === draggableId);

    if (!sourceColumn || !destColumn || !task) {
      return;
    }

    const newStatus = destColumn.status;

    // Update UI immediately
    const newColumns = columns.map(column => {
      if (column.id === source.droppableId) {
        const newTaskIds = [...column.taskIds];
        newTaskIds.splice(source.index, 1);
        return { ...column, taskIds: newTaskIds };
      } else if (column.id === destination.droppableId) {
        const newTaskIds = [...column.taskIds];
        newTaskIds.splice(destination.index, 0, draggableId);
        return { ...column, taskIds: newTaskIds };
      }
      return column;
    });

    setColumns(newColumns);

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
  }, [columns, tasks, updateTaskMutation]);

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
        <div className="flex gap-6 pb-6 h-full overflow-x-auto overflow-y-hidden">
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
