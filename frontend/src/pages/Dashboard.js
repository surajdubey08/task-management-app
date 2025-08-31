
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Users,
  Tag,
  Plus,
  Clock,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  BarChart3,
  TrendingUp,
  Maximize2,
  Grid3X3,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, useUsers, useCategories, useTaskAnalytics } from '../hooks/useQueryHooks';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import DashboardWidgets from '../components/widgets/DashboardWidgets';
import TaskChart from '../components/charts/TaskChart';
import { PerformanceAnalytics } from '../services/analytics';

const Dashboard = () => {
  const [dashboardLayout, setDashboardLayout] = useState([
    { i: 'stats', x: 0, y: 0, w: 12, h: 2 },
    { i: 'chart', x: 0, y: 2, w: 8, h: 4 },
    { i: 'recent', x: 8, y: 2, w: 4, h: 4 },
    { i: 'actions', x: 0, y: 6, w: 12, h: 2 }
  ]);
  const [showWidgetMode, setShowWidgetMode] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('status');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Data queries using TanStack Query hooks
  const { data: tasks, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useUsers();
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { data: analytics, refetch: refetchAnalytics } = useTaskAnalytics();

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchTasks();
      refetchUsers();
      refetchCategories();
      refetchAnalytics?.();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, refetchTasks, refetchUsers, refetchCategories, refetchAnalytics]);

  // Manual refresh function
  const handleManualRefresh = () => {
    refetchTasks();
    refetchUsers();
    refetchCategories();
    refetchAnalytics?.();
    setLastRefresh(new Date());
  };

  // Load dashboard layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        setDashboardLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Failed to parse saved layout:', error);
      }
    }
  }, []);

  // Save layout when it changes
  const handleLayoutChange = (newLayout) => {
    setDashboardLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };

  if (tasksLoading || usersLoading || categoriesLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (tasksError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const recentTasks = tasks?.slice(0, 6) || [];
  const taskStats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 0).length || 0,
    inProgress: tasks?.filter(t => t.status === 1).length || 0,
    completed: tasks?.filter(t => t.status === 2).length || 0,
  };

  // Performance analytics
  const performanceMetrics = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return {};
    
    return {
      completionRate: PerformanceAnalytics.calculateTaskCompletionRate(tasks),
      productivityScore: PerformanceAnalytics.calculateProductivityScore(tasks),
      teamMetrics: PerformanceAnalytics.getTeamProductivityMetrics(tasks, users || []),
      weeklyTrends: PerformanceAnalytics.getWeeklyTrends(tasks),
      insights: PerformanceAnalytics.generateInsights(tasks)
    };
  }, [tasks, users]);

  const stats = [
    {
      name: 'Total Tasks',
      value: taskStats.total,
      change: '+12%',
      changeType: 'increase',
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    {
      name: 'In Progress',
      value: taskStats.inProgress,
      change: '+8%',
      changeType: 'increase',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    },
    {
      name: 'Completed',
      value: taskStats.completed,
      change: `${performanceMetrics.completionRate || 0}%`,
      changeType: 'increase',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
    },
    {
      name: 'Productivity',
      value: `${performanceMetrics.productivityScore || 0}%`,
      change: 'Score',
      changeType: performanceMetrics.productivityScore > 70 ? 'increase' : 'decrease',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Header with Widget Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowWidgetMode(!showWidgetMode)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              showWidgetMode 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {showWidgetMode ? <Grid3X3 size={18} /> : <Maximize2 size={18} />}
            <span>{showWidgetMode ? 'Widget Mode' : 'Layout Mode'}</span>
          </motion.button>
          
          {/* Auto-refresh toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              autoRefresh 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              autoRefresh ? 'bg-white animate-pulse' : 'bg-gray-400'
            }`} />
            <span>Auto-refresh</span>
          </motion.button>
          
          {/* Manual refresh button */}
          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            className="p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
            title="Refresh data"
          >
            <RefreshCw size={18} />
          </motion.button>
          
          {/* Last refresh indicator */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            <span>Create Task</span>
          </Link>
          <Link
            to="/tasks?view=calendar"
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
          >
            <Calendar size={18} />
            <span>View Calendar</span>
          </Link>
        </div>
      </motion.div>

      {/* Widget Mode Dashboard */}
      {showWidgetMode ? (
        <DashboardWidgets 
          tasks={tasks || []}
          users={users || []}
          categories={categories || []}
          analytics={analytics}
          layout={dashboardLayout}
          onLayoutChange={handleLayoutChange}
        />
      ) : (
        <>
          {/* Enhanced Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const ChangeIcon = stat.changeType === 'increase' ? ArrowUpRight : ArrowDownRight;
              return (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${stat.bgColor} border border-gray-200/50 dark:border-gray-700/50 cursor-pointer group`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {stat.name}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1">
                        <ChangeIcon
                          size={16}
                          className={`${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}
                        />
                        <span className={`text-sm font-medium ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
                      </div>
                    </div>
                    <motion.div 
                      className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </motion.div>
                  </div>

                  {/* Subtle background pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity duration-200">
                    <Icon className="w-full h-full" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Charts and Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Analytics Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Task Analytics
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onChange={(e) => setSelectedChartType(e.target.value)}
                    value={selectedChartType}
                  >
                    <option value="status">Task Status</option>
                    <option value="priority">Priority Distribution</option>
                    <option value="category">Category Breakdown</option>
                    <option value="trend">Completion Trend</option>
                    <option value="team">Team Productivity</option>
                  </select>
                  <Link
                    to="/analytics"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200"
                  >
                    View Details
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
              <TaskChart 
                data={tasks || []} 
                analytics={analytics}
                chartType={selectedChartType}
                className="h-80"
              />
            </motion.div>

            {/* Quick Analytics Summary */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Quick Insights
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Completion Rate */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Completion Rate
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                
                {/* Productivity Score */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Productivity Score
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {Math.min(100, Math.round((taskStats.completed * 20) + (taskStats.inProgress * 10)))}%
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Based on completed and active tasks
                  </div>
                </div>
                
                {/* Pending Tasks Alert */}
                {taskStats.pending > 5 && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        High Pending Tasks
                      </span>
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      You have {taskStats.pending} pending tasks
                    </div>
                  </div>
                )}
                
                {/* Team Size */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Active Team Members
                    </span>
                    <span className="text-lg font-bold text-purple-600">
                      {users?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Quick Actions Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {[
              {
                to: '/tasks/new',
                icon: Plus,
                title: 'Create Task',
                description: 'Add a new task and assign it to team members',
                gradient: 'from-blue-500 to-purple-600',
                hoverGradient: 'hover:from-blue-600 hover:to-purple-700',
                textColor: 'text-blue-100'
              },
              {
                to: '/users/new',
                icon: Users,
                title: 'Add Team Member',
                description: 'Invite new members to collaborate',
                gradient: 'from-green-500 to-emerald-600',
                hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
                textColor: 'text-green-100'
              },
              {
                to: '/categories/new',
                icon: Tag,
                title: 'New Category',
                description: 'Organize tasks with custom labels',
                gradient: 'from-orange-500 to-red-600',
                hoverGradient: 'hover:from-orange-600 hover:to-red-700',
                textColor: 'text-orange-100'
              }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={action.to}
                    className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} rounded-2xl p-6 text-white ${action.hoverGradient} transition-all duration-300 hover:shadow-2xl block`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div 
                          className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                          whileHover={{ rotate: 5, scale: 1.1 }}
                        >
                          <Icon className="h-6 w-6" />
                        </motion.div>
                        <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                      <p className={action.textColor}>{action.description}</p>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 group-hover:opacity-20 transition-opacity duration-200">
                      <Icon className="w-full h-full" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
