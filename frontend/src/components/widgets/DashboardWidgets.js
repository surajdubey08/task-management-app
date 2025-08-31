import React from 'react';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Settings,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import { 
  TaskStatusChart, 
  TaskPriorityChart, 
  TaskCompletionTrendChart,
  TeamProductivityChart,
  CategoryDistributionChart,
  useChartData 
} from '../charts/TaskChart';
import { useTasks, useUsers, useCategories } from '../../hooks/useQueryHooks';
import { formatRelativeTime, getStatusColor, getPriorityColor } from '../../lib/utils';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';

export const StatsWidget = ({ title, data, onRefresh, className = '' }) => {
  const stats = [
    {
      name: 'Total Tasks',
      value: data?.totalTasks || 0,
      change: '+12%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Completed',
      value: data?.completedTasks || 0,
      change: '+8%',
      changeType: 'increase',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'In Progress',
      value: data?.inProgressTasks || 0,
      change: '-2%',
      changeType: 'decrease',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Overdue',
      value: data?.overdueTasks || 0,
      change: '+5%',
      changeType: 'increase',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <DashboardWidget
      title={title}
      onRefresh={onRefresh}
      size="large"
      className={className}
    >
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.changeType === 'increase' ? TrendingUp : TrendingDown;
          
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <ChangeIcon
                      size={14}
                      className={`${
                        stat.changeType === 'increase' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        stat.changeType === 'increase' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} dark:${stat.bgColor}/20`}>
                  <Icon className={`h-6 w-6 ${stat.color} dark:${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardWidget>
  );
};

export const TaskStatusWidget = ({ onRefresh, className = '' }) => {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { statusData } = useChartData(tasks);

  return (
    <DashboardWidget
      title="Task Status Distribution"
      isLoading={isLoading}
      error={error?.message}
      onRefresh={onRefresh}
      size="medium"
      className={className}
    >
      <TaskStatusChart data={statusData} />
    </DashboardWidget>
  );
};

export const TaskPriorityWidget = ({ onRefresh, className = '' }) => {
  const { data: tasks = [], isLoading, error } = useTasks();
  const { priorityData } = useChartData(tasks);

  return (
    <DashboardWidget
      title="Task Priority Breakdown"
      isLoading={isLoading}
      error={error?.message}
      onRefresh={onRefresh}
      size="medium"
      className={className}
    >
      <TaskPriorityChart data={priorityData} />
    </DashboardWidget>
  );
};

export const RecentTasksWidget = ({ onRefresh, className = '' }) => {
  const { data: tasks = [], isLoading, error } = useTasks();
  
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <DashboardWidget
      title="Recent Tasks"
      isLoading={isLoading}
      error={error?.message}
      onRefresh={onRefresh}
      size="medium"
      className={className}
    >
      <div className="space-y-3">
        {recentTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status).replace('text-', 'bg-')}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {task.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{task.userName}</span>
                <span>•</span>
                <span>{formatRelativeTime(task.createdAt)}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardWidget>
  );
};

// Main DashboardWidgets component with drag-and-drop grid layout
const DashboardWidgets = ({ 
  tasks, 
  users, 
  categories, 
  analytics, 
  layout = [], 
  onLayoutChange,
  className = '' 
}) => {
  const [currentLayout, setCurrentLayout] = React.useState(layout);
  const [isEditMode, setIsEditMode] = React.useState(false);

  // Default layout configuration
  const defaultLayouts = {
    lg: [
      { i: 'stats', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
      { i: 'status-chart', x: 0, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'priority-chart', x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'recent-tasks', x: 0, y: 7, w: 6, h: 4, minW: 4, minH: 3 },
    ]
  };

  // Calculate task statistics
  const taskStats = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0
      };
    }

    const now = new Date();
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 2).length,
      inProgressTasks: tasks.filter(task => task.status === 1).length,
      overdueTasks: tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < now && task.status !== 2
      ).length
    };
  }, [tasks]);

  // Handle layout changes
  const handleLayoutChange = React.useCallback((newLayout, newLayouts) => {
    setCurrentLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayouts);
    }
  }, [onLayoutChange]);

  // Handle refresh for individual widgets
  const handleRefresh = React.useCallback((widgetId) => {
    console.log(`Refreshing widget: ${widgetId}`);
    // Implement refresh logic for specific widgets
  }, []);

  // Widget components mapping
  const widgets = {
    'stats': (
      <StatsWidget 
        key="stats"
        title="Task Statistics"
        data={taskStats}
        onRefresh={() => handleRefresh('stats')}
      />
    ),
    'status-chart': (
      <TaskStatusWidget 
        key="status-chart"
        onRefresh={() => handleRefresh('status-chart')}
      />
    ),
    'priority-chart': (
      <TaskPriorityWidget 
        key="priority-chart"
        onRefresh={() => handleRefresh('priority-chart')}
      />
    ),
    'recent-tasks': (
      <RecentTasksWidget 
        key="recent-tasks"
        onRefresh={() => handleRefresh('recent-tasks')}
      />
    )
  };

  return (
    <div className={`relative ${className}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={defaultLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
      >
        {Object.entries(widgets).map(([key, widget]) => (
          <div key={key}>
            {widget}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardWidgets;