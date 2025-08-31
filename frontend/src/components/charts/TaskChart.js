import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

const COLORS = {
  Pending: '#f59e0b',
  InProgress: '#3b82f6',
  Completed: '#10b981',
  Cancelled: '#6b7280',
};

const PRIORITY_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444',
};

export const TaskStatusChart = ({ data, className = '' }) => {
  const chartData = Object.entries(data || {}).map(([status, count]) => ({
    status,
    count,
    fill: COLORS[status] || '#6b7280',
  }));

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ status, count, percent }) => 
              `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TaskPriorityChart = ({ data, className = '' }) => {
  const chartData = Object.entries(data || {}).map(([priority, count]) => ({
    priority,
    count,
    fill: PRIORITY_COLORS[priority] || '#6b7280',
  }));

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="priority" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TaskCompletionTrendChart = ({ data, className = '' }) => {
  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Completed Tasks"
          />
          <Line 
            type="monotone" 
            dataKey="created" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Created Tasks"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TeamProductivityChart = ({ data, className = '' }) => {
  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="completedTasks" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981"
            fillOpacity={0.6}
            name="Completed Tasks"
          />
          <Area 
            type="monotone" 
            dataKey="inProgressTasks" 
            stackId="1"
            stroke="#3b82f6" 
            fill="#3b82f6"
            fillOpacity={0.6}
            name="In Progress Tasks"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryDistributionChart = ({ data, className = '' }) => {
  const chartData = data?.map((item, index) => ({
    ...item,
    fill: item.color || `hsl(${index * 45}, 70%, 50%)`,
  })) || [];

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={5}
            dataKey="taskCount"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [value, 'Tasks']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const WeeklyProgressChart = ({ data, className = '' }) => {
  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="planned" fill="#e5e7eb" name="Planned" />
          <Bar dataKey="completed" fill="#10b981" name="Completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom hook for chart data
export const useChartData = (tasks = []) => {
  const statusData = React.useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    return counts;
  }, [tasks]);

  const priorityData = React.useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    return counts;
  }, [tasks]);

  const categoryData = React.useMemo(() => {
    const categoryMap = new Map();
    tasks.forEach(task => {
      if (task.categoryName && task.categoryColor) {
        const existing = categoryMap.get(task.categoryName) || {
          name: task.categoryName,
          color: task.categoryColor,
          taskCount: 0,
        };
        existing.taskCount += 1;
        categoryMap.set(task.categoryName, existing);
      }
    });
    return Array.from(categoryMap.values());
  }, [tasks]);

  return {
    statusData,
    priorityData,
    categoryData,
  };
};