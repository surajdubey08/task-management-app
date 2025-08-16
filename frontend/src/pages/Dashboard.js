import React from 'react';
import { useQuery } from 'react-query';
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
  ArrowDownRight
} from 'lucide-react';
import { tasksApi, usersApi, categoriesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard = () => {
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery(
    'dashboard-tasks',
    () => tasksApi.getAll().then(res => res.data)
  );

  const { data: users, isLoading: usersLoading } = useQuery(
    'dashboard-users',
    () => usersApi.getAll().then(res => res.data)
  );

  // eslint-disable-next-line no-unused-vars
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'dashboard-categories',
    () => categoriesApi.getAll().then(res => res.data)
  );

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
      change: '+23%',
      changeType: 'increase',
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
    },
    {
      name: 'Team Members',
      value: users?.length || 0,
      change: '+2',
      changeType: 'increase',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.changeType === 'increase' ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={stat.name}
              className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${stat.bgColor} border border-gray-200/50 dark:border-gray-700/50`}
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
                <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>

              {/* Subtle background pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Icon className="w-full h-full" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
            </div>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors duration-200"
            >
              View all
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {recentTasks.length > 0 ? (
            <div className="space-y-4">
              {recentTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 2 ? 'bg-green-500' :
                    task.status === 1 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {task.description}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tasks yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Get started by creating your first task and begin organizing your workflow.
              </p>
              <Link
                to="/tasks/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus size={20} />
                Create Your First Task
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          to="/tasks/new"
          className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Plus className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <h3 className="text-xl font-bold mb-2">Create Task</h3>
            <p className="text-blue-100">Add a new task and assign it to team members</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Plus className="w-full h-full" />
          </div>
        </Link>

        <Link
          to="/users/new"
          className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <h3 className="text-xl font-bold mb-2">Add Team Member</h3>
            <p className="text-green-100">Invite new members to collaborate</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Users className="w-full h-full" />
          </div>
        </Link>

        <Link
          to="/categories/new"
          className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white hover:from-orange-600 hover:to-red-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Tag className="h-6 w-6" />
              </div>
              <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <h3 className="text-xl font-bold mb-2">New Category</h3>
            <p className="text-orange-100">Organize tasks with custom labels</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Tag className="w-full h-full" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
