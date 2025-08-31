import React from 'react';
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
                      className={`text-xs font-medium ${\n                        stat.changeType === 'increase' \n                          ? 'text-green-600' \n                          : 'text-red-600'\n                      }`}\n                    >\n                      {stat.change}\n                    </span>\n                  </div>\n                </div>\n                <div className={`p-3 rounded-lg ${stat.bgColor} dark:${stat.bgColor}/20`}>\n                  <Icon className={`h-6 w-6 ${stat.color} dark:${stat.color}`} />\n                </div>\n              </div>\n            </motion.div>\n          );\n        })}\n      </div>\n    </DashboardWidget>\n  );\n};\n\nexport const TaskStatusWidget = ({ onRefresh, className = '' }) => {\n  const { data: tasks = [], isLoading, error } = useTasks();\n  const { statusData } = useChartData(tasks);\n\n  return (\n    <DashboardWidget\n      title=\"Task Status Distribution\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"medium\"\n      className={className}\n    >\n      <TaskStatusChart data={statusData} />\n    </DashboardWidget>\n  );\n};\n\nexport const TaskPriorityWidget = ({ onRefresh, className = '' }) => {\n  const { data: tasks = [], isLoading, error } = useTasks();\n  const { priorityData } = useChartData(tasks);\n\n  return (\n    <DashboardWidget\n      title=\"Task Priority Breakdown\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"medium\"\n      className={className}\n    >\n      <TaskPriorityChart data={priorityData} />\n    </DashboardWidget>\n  );\n};\n\nexport const RecentTasksWidget = ({ onRefresh, className = '' }) => {\n  const { data: tasks = [], isLoading, error } = useTasks();\n  \n  const recentTasks = tasks\n    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))\n    .slice(0, 5);\n\n  return (\n    <DashboardWidget\n      title=\"Recent Tasks\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"medium\"\n      className={className}\n    >\n      <div className=\"space-y-3\">\n        {recentTasks.map((task, index) => (\n          <motion.div\n            key={task.id}\n            initial={{ opacity: 0, x: -20 }}\n            animate={{ opacity: 1, x: 0 }}\n            transition={{ delay: index * 0.1 }}\n            className=\"flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer\"\n          >\n            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status).replace('text-', 'bg-')}`} />\n            <div className=\"flex-1 min-w-0\">\n              <p className=\"font-medium text-gray-900 dark:text-white truncate\">\n                {task.title}\n              </p>\n              <div className=\"flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400\">\n                <span>{task.userName}</span>\n                <span>•</span>\n                <span>{formatRelativeTime(task.createdAt)}</span>\n              </div>\n            </div>\n            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>\n              {task.status}\n            </div>\n          </motion.div>\n        ))}\n      </div>\n    </DashboardWidget>\n  );\n};\n\nexport const TeamProductivityWidget = ({ onRefresh, className = '' }) => {\n  const { data: users = [], isLoading, error } = useUsers();\n  const { data: tasks = [] } = useTasks();\n  \n  const teamData = users.map(user => {\n    const userTasks = tasks.filter(task => task.userId === user.id);\n    return {\n      name: user.name,\n      completedTasks: userTasks.filter(task => task.status === 'Completed').length,\n      inProgressTasks: userTasks.filter(task => task.status === 'InProgress').length,\n      totalTasks: userTasks.length,\n    };\n  }).slice(0, 6);\n\n  return (\n    <DashboardWidget\n      title=\"Team Productivity\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"large\"\n      className={className}\n    >\n      <TeamProductivityChart data={teamData} />\n    </DashboardWidget>\n  );\n};\n\nexport const CategoryDistributionWidget = ({ onRefresh, className = '' }) => {\n  const { data: tasks = [], isLoading, error } = useTasks();\n  const { categoryData } = useChartData(tasks);\n\n  return (\n    <DashboardWidget\n      title=\"Category Distribution\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"medium\"\n      className={className}\n    >\n      <CategoryDistributionChart data={categoryData} />\n    </DashboardWidget>\n  );\n};\n\nexport const UpcomingDeadlinesWidget = ({ onRefresh, className = '' }) => {\n  const { data: tasks = [], isLoading, error } = useTasks();\n  \n  const upcomingTasks = tasks\n    .filter(task => task.dueDate && task.status !== 'Completed')\n    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))\n    .slice(0, 5);\n\n  return (\n    <DashboardWidget\n      title=\"Upcoming Deadlines\"\n      isLoading={isLoading}\n      error={error?.message}\n      onRefresh={onRefresh}\n      size=\"medium\"\n      className={className}\n    >\n      <div className=\"space-y-3\">\n        {upcomingTasks.length > 0 ? (\n          upcomingTasks.map((task, index) => {\n            const daysUntilDue = Math.ceil(\n              (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)\n            );\n            const isOverdue = daysUntilDue < 0;\n            const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;\n            \n            return (\n              <motion.div\n                key={task.id}\n                initial={{ opacity: 0, y: 10 }}\n                animate={{ opacity: 1, y: 0 }}\n                transition={{ delay: index * 0.1 }}\n                className={`flex items-center gap-3 p-3 rounded-lg ${\n                  isOverdue \n                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'\n                    : isUrgent\n                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'\n                    : 'bg-gray-50 dark:bg-gray-700/50'\n                }`}\n              >\n                <Calendar className={`h-4 w-4 ${\n                  isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-gray-500'\n                }`} />\n                <div className=\"flex-1 min-w-0\">\n                  <p className=\"font-medium text-gray-900 dark:text-white truncate\">\n                    {task.title}\n                  </p>\n                  <div className=\"flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400\">\n                    <span>{task.userName}</span>\n                    <span>•</span>\n                    <span className={`${\n                      isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-yellow-600 font-medium' : ''\n                    }`}>\n                      {isOverdue \n                        ? `${Math.abs(daysUntilDue)} days overdue`\n                        : daysUntilDue === 0\n                        ? 'Due today'\n                        : `${daysUntilDue} days left`\n                      }\n                    </span>\n                  </div>\n                </div>\n                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>\n                  {task.priority}\n                </div>\n              </motion.div>\n            );\n          })\n        ) : (\n          <div className=\"text-center text-gray-500 dark:text-gray-400 py-8\">\n            <Calendar className=\"h-8 w-8 mx-auto mb-2 opacity-50\" />\n            <p>No upcoming deadlines</p>\n          </div>\n        )}\n      </div>\n    </DashboardWidget>\n  );\n};"