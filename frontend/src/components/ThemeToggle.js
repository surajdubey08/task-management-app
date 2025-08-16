
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-9 w-16 items-center justify-center rounded-full 
        bg-gray-200 dark:bg-gray-700 transition-colors duration-200 
        hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        dark:focus:ring-offset-gray-800 ${className}
      `}
      aria-label="Toggle theme"
    >
      <div
        className={`
          absolute left-1 top-1 h-7 w-7 rounded-full bg-white dark:bg-gray-800 
          shadow-md transition-transform duration-200 ease-in-out flex items-center justify-center
          ${isDark ? 'translate-x-7' : 'translate-x-0'}
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-blue-500" />
        ) : (
          <Sun size={14} className="text-yellow-500" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
