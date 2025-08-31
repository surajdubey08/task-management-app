import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Tag, 
  CheckSquare, 
  Plus, 
  Home, 
  Grid,
  Settings,
  LogOut,
  Keyboard
} from 'lucide-react';
import { Command } from 'cmdk';
import { useTasks, useUsers, useCategories } from '../hooks/useQueryHooks';
import { useAuth } from '../contexts/AuthContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Data queries
  const { data: tasks = [] } = useTasks();
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setSearch('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = useCallback((value) => {
    const [type, action, id] = value.split(':');
    
    switch (type) {
      case 'navigate':
        navigate(action);
        break;
      case 'task':
        if (action === 'view') {
          navigate(`/tasks/${id}`);
        } else if (action === 'edit') {
          navigate(`/tasks/${id}/edit`);
        }
        break;
      case 'user':
        if (action === 'view') {
          navigate(`/users/${id}/edit`);
        }
        break;
      case 'category':
        if (action === 'view') {
          navigate(`/categories/${id}/edit`);
        }
        break;
      case 'create':
        navigate(`/${action}/new`);
        break;
      case 'auth':
        if (action === 'logout') {
          logout();
        }
        break;
      default:
        break;
    }
    
    onClose();
  }, [navigate, logout, onClose]);

  if (!isOpen) return null;

  const navigationItems = [
    { icon: Home, label: 'Dashboard', value: 'navigate:/', keywords: 'home dashboard overview' },
    { icon: CheckSquare, label: 'All Tasks', value: 'navigate:/tasks', keywords: 'tasks todo list' },
    { icon: Grid, label: 'Kanban Board', value: 'navigate:/kanban', keywords: 'kanban board columns' },
    { icon: User, label: 'Users', value: 'navigate:/users', keywords: 'users team people' },
    { icon: Tag, label: 'Categories', value: 'navigate:/categories', keywords: 'categories tags labels' },
  ];

  const createItems = [
    { icon: Plus, label: 'Create Task', value: 'create:tasks', keywords: 'new task create add' },
    { icon: Plus, label: 'Create User', value: 'create:users', keywords: 'new user create add' },
    { icon: Plus, label: 'Create Category', value: 'create:categories', keywords: 'new category create add' },
  ];

  const authItems = [
    { icon: Settings, label: 'Settings', value: 'navigate:/settings', keywords: 'settings preferences config' },
    { icon: LogOut, label: 'Logout', value: 'auth:logout', keywords: 'logout sign out exit' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4">
        <Command 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="h-5 w-5 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="w-full py-4 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 text-lg"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-gray-400 ml-4">
              <Keyboard className="h-3 w-3" />
              <span>⌘K</span>
            </div>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-gray-300" />
                <p>No results found.</p>
              </div>
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
              {navigationItems.map((item) => (
                <Command.Item
                  key={item.value}
                  value={`${item.value} ${item.keywords}`}
                  onSelect={() => handleSelect(item.value)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}\n            </Command.Group>

            {/* Create Actions */}
            <Command.Group heading="Create" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mt-4">
              {createItems.map((item) => (
                <Command.Item
                  key={item.value}
                  value={`${item.value} ${item.keywords}`}
                  onSelect={() => handleSelect(item.value)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Recent Tasks */}
            {tasks.length > 0 && (
              <Command.Group heading="Recent Tasks" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mt-4">
                {tasks.slice(0, 5).map((task) => (
                  <Command.Item
                    key={`task-${task.id}`}
                    value={`task ${task.title} ${task.description || ''}`}
                    onSelect={() => handleSelect(`task:view:${task.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="truncate font-medium">{task.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {task.categoryName && (
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {task.categoryName}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : task.status === 'InProgress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {task.status}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Users */}
            {users.length > 0 && (
              <Command.Group heading="Users" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mt-4">
                {users.slice(0, 5).map((user) => (
                  <Command.Item
                    key={`user-${user.id}`}
                    value={`user ${user.name} ${user.email} ${user.department || ''}`}
                    onSelect={() => handleSelect(`user:view:${user.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                  >
                    <User className="h-4 w-4" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                    </div>
                    {user.department && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {user.department}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Command.Group heading="Categories" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mt-4">
                {categories.slice(0, 5).map((category) => (
                  <Command.Item
                    key={`category-${category.id}`}
                    value={`category ${category.name} ${category.description || ''}`}
                    onSelect={() => handleSelect(`category:view:${category.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                  >
                    <Tag className="h-4 w-4" />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate font-medium">{category.name}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Settings & Auth */}
            <Command.Group heading="Account" className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mt-4">
              {authItems.map((item) => (
                <Command.Item
                  key={item.value}
                  value={`${item.value} ${item.keywords}`}
                  onSelect={() => handleSelect(item.value)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-900/50 aria-selected:text-blue-700 dark:aria-selected:text-blue-300"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Navigate with ↑↓ arrows</span>
              <span>Enter to select • Esc to close</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;