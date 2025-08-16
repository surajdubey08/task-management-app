import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, addMonths, subMonths } from 'date-fns';
import { tasksApi } from '../services/api';
import CalendarTaskCard from './CalendarTaskCard';

import WeekView from './WeekView';
import DayView from './DayView';
import toast from 'react-hot-toast';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day

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

  // Get calendar days for current month
  const getCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
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
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
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
        <span className="ml-3 text-gray-600">Loading calendar...</span>
      </div>
    );
  }

  // Render different views based on selection
  if (view === 'week') {
    return <WeekView view={view} setView={setView} />;
  }

  if (view === 'day') {
    return <DayView view={view} setView={setView} />;
  }

  // Default to month view
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

        {/* View Toggle */}
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

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-48 text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 h-full">
          {getCalendarDays().map((date) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date) && !isCurrentDay;

            return (
              <div
                key={date.toISOString()}
                className={`border-r border-b border-gray-200 dark:border-gray-700 p-1 transition-colors flex flex-col ${
                  isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${isPastDay ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                style={{ minHeight: '140px', height: '140px' }}
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
                {/* Date Number */}
                <div className={`text-sm font-medium mb-1 flex-shrink-0 ${
                  isCurrentDay
                    ? 'text-blue-600 dark:text-blue-400'
                    : isPastDay
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {isCurrentDay ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {format(date, 'd')}
                    </div>
                  ) : (
                    format(date, 'd')
                  )}
                </div>

                {/* Tasks for this date */}
                <div className="flex-1 overflow-hidden">
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 2).map((task) => (
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

                    {dayTasks.length > 2 && (
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400 font-medium px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        style={{ fontSize: '9px', lineHeight: '1.2' }}
                        title={`Click to see all ${dayTasks.length} tasks for ${format(date, 'MMM d')}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open modal with all tasks for this date
                          alert(`${dayTasks.length} tasks on ${format(date, 'MMM d, yyyy')}:\n\n${dayTasks.map(t => `• ${t.title}`).join('\n')}`);
                        }}
                      >
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};

export default CalendarView;
