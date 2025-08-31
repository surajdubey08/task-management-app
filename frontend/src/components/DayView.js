import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, isSameDay, isToday, addDays, subDays } from 'date-fns';
import { tasksApi } from '../services/api';
import CalendarTaskCard from './CalendarTaskCard';
import CreateTaskModal from './CreateTaskModal';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const DayView = ({ view, setView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery(
    ['tasks'],
    () => tasksApi.getAll().then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update task mutation for drag-and-drop
  const updateTaskMutation = useMutation(
    ({ taskId, updateData }) => tasksApi.update(taskId, updateData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast.success('Task rescheduled successfully');
      },
      onError: (error) => {
        console.error('Task update failed:', error);
        toast.error('Failed to reschedule task');
      },
    }
  );

  // Delete task mutation
  const deleteTaskMutation = useMutation(
    (taskId) => tasksApi.delete(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        toast.success('Task deleted successfully');
      },
      onError: (error) => {
        console.error('Task deletion failed:', error);
        toast.error('Failed to delete task');
      },
    }
  );

  // Get tasks for current date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  // Handle task reschedule via drag-and-drop
  const handleTaskReschedule = (taskId, newDate) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updateData = {
      ...task,
      dueDate: format(newDate, 'yyyy-MM-dd'),
    };

    updateTaskMutation.mutate({ taskId, updateData });
  };

  // Handle task deletion
  const handleDeleteTask = (taskId) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Navigation functions
  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 2: return 'bg-red-100 border-red-300 text-red-800';
      case 1: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 0: return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'border-l-gray-400'; // Pending
      case 1: return 'border-l-blue-500'; // In Progress
      case 2: return 'border-l-green-500'; // Completed
      case 3: return 'border-l-red-500'; // Cancelled
      default: return 'border-l-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading day view...</span>
      </div>
    );
  }

  const dayTasks = getTasksForDate(currentDate);
  const isCurrentDay = isToday(currentDate);

  // Group tasks by status
  const tasksByStatus = {
    pending: dayTasks.filter(task => task.status === 0),
    inProgress: dayTasks.filter(task => task.status === 1),
    completed: dayTasks.filter(task => task.status === 2),
    cancelled: dayTasks.filter(task => task.status === 3),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon size={28} className="text-blue-500" />
            Calendar View
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Plan and track your tasks by timeline
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['month', 'week', 'day'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  view === viewType
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <h2 className={`text-xl font-semibold min-w-64 text-center ${
            isCurrentDay 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
            {isCurrentDay && (
              <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Today
              </span>
            )}
          </h2>
          
          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Today
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Day Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {dayTasks.length > 0 ? (
          <div className="p-6">
            {/* Task Summary */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {tasksByStatus.pending.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {tasksByStatus.inProgress.length}
                </div>
                <div className="text-sm text-blue-500 dark:text-blue-400">In Progress</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {tasksByStatus.completed.length}
                </div>
                <div className="text-sm text-green-500 dark:text-green-400">Completed</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {tasksByStatus.cancelled.length}
                </div>
                <div className="text-sm text-red-500 dark:text-red-400">Cancelled</div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-6">
              {/* Pending Tasks */}
              {tasksByStatus.pending.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Pending Tasks ({tasksByStatus.pending.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tasksByStatus.pending.map((task) => (
                      <div key={task.id} className="min-h-0">
                        <CalendarTaskCard
                          task={task}
                          onReschedule={handleTaskReschedule}
                          getPriorityColor={getPriorityColor}
                          getStatusColor={getStatusColor}
                          onDelete={handleDeleteTask}
                          isCompact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Tasks */}
              {tasksByStatus.inProgress.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    In Progress Tasks ({tasksByStatus.inProgress.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tasksByStatus.inProgress.map((task) => (
                      <div key={task.id} className="min-h-0">
                        <CalendarTaskCard
                          task={task}
                          onReschedule={handleTaskReschedule}
                          getPriorityColor={getPriorityColor}
                          getStatusColor={getStatusColor}
                          onDelete={handleDeleteTask}
                          isCompact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {tasksByStatus.completed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Completed Tasks ({tasksByStatus.completed.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {tasksByStatus.completed.map((task) => (
                      <div key={task.id} className="min-h-0">
                        <CalendarTaskCard
                          task={task}
                          onReschedule={handleTaskReschedule}
                          getPriorityColor={getPriorityColor}
                          getStatusColor={getStatusColor}
                          onDelete={handleDeleteTask}
                          isCompact={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <CalendarIcon size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tasks for {format(currentDate, 'MMMM d, yyyy')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isCurrentDay 
                ? "You have a clear schedule today. Time to relax or plan ahead!"
                : "No tasks scheduled for this date. Click 'Add Task' to create one."
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus size={20} />
              Add Task for This Day
            </button>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          initialDueDate={currentDate}
        />
      )}
    </div>
  );
};

export default DayView;
