import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link2, Plus, X } from 'lucide-react';
import { tasksApi } from '../services/api';

const TaskDependencySelector = ({ 
  selectedDependencies = [], 
  onDependenciesChange, 
  currentTaskId = null,
  label = "Dependencies" 
}) => {
  const [showSelector, setShowSelector] = useState(false);

  // Fetch all tasks for dependency selection
  const { data: allTasks = [] } = useQuery(
    'allTasks',
    () => tasksApi.getAll().then(res => res.data),
    {
      enabled: showSelector,
    }
  );

  // Filter out current task and already selected dependencies
  const availableTasks = allTasks.filter(task => 
    task.id !== currentTaskId && 
    !selectedDependencies.some(dep => dep.taskId === task.id)
  );

  const addDependency = (taskId, dependencyType) => {
    const task = allTasks.find(t => t.id === parseInt(taskId));
    if (task) {
      const newDependency = {
        taskId: task.id,
        taskTitle: task.title,
        dependencyType: dependencyType,
        tempId: Date.now() // Temporary ID for frontend tracking
      };
      onDependenciesChange([...selectedDependencies, newDependency]);
    }
  };

  const removeDependency = (tempId) => {
    onDependenciesChange(selectedDependencies.filter(dep => dep.tempId !== tempId));
  };

  const getDependencyTypeLabel = (type) => {
    return type === 0 ? 'Blocked by' : 'Blocks';
  };

  const getDependencyTypeColor = (type) => {
    return type === 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Selected Dependencies */}
      {selectedDependencies.length > 0 && (
        <div className="space-y-2">
          {selectedDependencies.map((dependency) => (
            <div 
              key={dependency.tempId} 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Link2 size={16} className="text-purple-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dependency.taskTitle}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getDependencyTypeColor(dependency.dependencyType)}`}>
                    {getDependencyTypeLabel(dependency.dependencyType)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeDependency(dependency.tempId)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Remove dependency"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Dependency Button */}
      <button
        type="button"
        onClick={() => setShowSelector(!showSelector)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
      >
        <Plus size={16} />
        Add Dependency
      </button>

      {/* Dependency Selector */}
      {showSelector && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dependency Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Blocked By */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    This task is blocked by:
                  </h4>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addDependency(e.target.value, 0); // BlockedBy
                        e.target.value = '';
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Choose a task...</option>
                    {availableTasks.map(task => (
                      <option key={`blocked-${task.id}`} value={task.id}>
                        #{task.id} - {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blocks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    This task blocks:
                  </h4>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addDependency(e.target.value, 1); // Blocks
                        e.target.value = '';
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Choose a task...</option>
                    {availableTasks.map(task => (
                      <option key={`blocks-${task.id}`} value={task.id}>
                        #{task.id} - {task.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSelector(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedDependencies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No dependencies configured. Add dependencies to manage task relationships.
        </p>
      )}
    </div>
  );
};

export default TaskDependencySelector;
