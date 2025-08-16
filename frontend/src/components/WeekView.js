import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import { tasksApi } from '../services/api';
import CalendarTaskCard from './CalendarTaskCard';

import toast from 'react-hot-toast';

const WeekView = ({ view, setView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Get week days
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // Get tasks for a specific date
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
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
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
        <span className="ml-3 text-gray-600">Loading week view...</span>
      </div>
    );
  }

  const weekDays = getWeekDays();

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

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-48 text-center">
            Week of {format(weekDays[0], 'MMM d, yyyy')}
          </h2>
          
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          This Week
        </button>
      </div>

      {/* Week Grid */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
                isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                isToday(day) 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Week Days Content */}
        <div className="grid grid-cols-7 h-full">
          {weekDays.map((date) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className={`border-r border-gray-200 dark:border-gray-700 last:border-r-0 p-3 transition-colors ${
                  isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                style={{ minHeight: '400px' }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-800');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-800');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-800');
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) {
                    handleTaskReschedule(parseInt(taskId), date);
                  }
                }}
              >
                {/* Tasks for this date */}
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <CalendarTaskCard
                      key={task.id}
                      task={task}
                      onReschedule={handleTaskReschedule}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      onDelete={handleDeleteTask}
                      isCompact={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};

export default WeekView;
