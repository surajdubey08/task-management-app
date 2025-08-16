import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ column, tasks, index }) => {
  const getColumnColor = (status) => {
    const colorMap = {
      0: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', border: 'border-yellow-300', text: 'text-yellow-800 dark:text-yellow-200' }, // Pending
      1: { bg: 'bg-blue-100 dark:bg-blue-900/20', border: 'border-blue-300', text: 'text-blue-800 dark:text-blue-200' }, // In Progress
      2: { bg: 'bg-green-100 dark:bg-green-900/20', border: 'border-green-300', text: 'text-green-800 dark:text-green-200' }, // Completed
      3: { bg: 'bg-red-100 dark:bg-red-900/20', border: 'border-red-300', text: 'text-red-800 dark:text-red-200' }, // Cancelled
    };
    return colorMap[status] || colorMap[0];
  };

  const getColumnIcon = (status) => {
    const iconMap = {
      0: '⏳', // Pending
      1: '🔄', // In Progress
      2: '✅', // Completed
      3: '❌', // Cancelled
    };
    return iconMap[status] || '📋';
  };

  const colors = getColumnColor(column.status);
  const icon = getColumnIcon(column.status);

  return (
    <div className="flex flex-col h-full min-w-80 max-w-80">
      {/* Column Header */}
      <div className={`
        rounded-lg p-4 mb-4 border-2 ${colors.bg} ${colors.border}
        flex items-center justify-between flex-shrink-0
      `}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className={`font-bold text-lg ${colors.text}`}>
              {column.title}
            </h3>
            <p className={`text-sm ${colors.text} opacity-75`}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Add Task Button */}
        <Link
          to="/tasks/new"
          className={`
            p-2 rounded-lg transition-all duration-200 hover:scale-110
            ${colors.text} hover:bg-white/20 dark:hover:bg-black/20
          `}
          title="Add new task"
        >
          <Plus size={20} />
        </Link>
      </div>

      {/* Droppable Area - No Scrollbars */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-3 rounded-lg transition-all duration-200
              ${snapshot.isDraggingOver
                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 border-dashed'
                : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent'
              }
            `}
            style={{ minHeight: '400px' }}
          >
            {/* Task Cards */}
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  index={index}
                />
              ))}
            </div>

            {provided.placeholder}

            {/* Empty State */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <div className="text-6xl mb-4 opacity-50">
                  {icon}
                </div>
                <p className="text-sm text-center">
                  No tasks in {column.title.toLowerCase()}
                </p>
                <p className="text-xs text-center mt-1 opacity-75">
                  Drag tasks here or create a new one
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
