import { useState, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import { Clock, User, AlertCircle, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const CalendarTaskCard = ({ task, onReschedule, getPriorityColor, getStatusColor, onDelete, isCompact = true }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate dropdown position and close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const calculatePosition = () => {
      if (buttonRef.current && showDropdown) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 128; // min-w-32 = 128px
        const dropdownHeight = 120; // approximate height

        let left = buttonRect.left;
        let top = buttonRect.bottom + 4; // 4px margin

        // Adjust if dropdown would go off right edge
        if (left + dropdownWidth > window.innerWidth) {
          left = buttonRect.right - dropdownWidth;
        }

        // Adjust if dropdown would go off bottom edge
        if (top + dropdownHeight > window.innerHeight) {
          top = buttonRect.top - dropdownHeight - 4;
        }

        setDropdownPosition({ top, left });
      }
    };

    if (showDropdown) {
      calculatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', calculatePosition);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [showDropdown]);

  // Handle drag start
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Get priority icon and text
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 2: return { icon: AlertCircle, text: 'High', color: 'text-red-600' };
      case 1: return { icon: Clock, text: 'Medium', color: 'text-yellow-600' };
      case 0: return { icon: Clock, text: 'Low', color: 'text-green-600' };
      default: return { icon: Clock, text: 'Normal', color: 'text-gray-600' };
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'In Progress';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const priorityInfo = getPriorityInfo(task.priority);
  const PriorityIcon = priorityInfo.icon;

  // Handle delete
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete && onDelete(task.id);
    }
    setShowDropdown(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative bg-white dark:bg-gray-700 rounded border-l-4 shadow-sm text-xs
        hover:shadow-md transition-all duration-200 cursor-move
        ${getStatusColor(task.status)}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${task.status === 2 ? 'opacity-75' : ''}
        ${isCompact ? 'p-1' : 'p-3'}
      `}
      style={isCompact ?
        { minHeight: '24px', fontSize: '10px', lineHeight: '1.2' } :
        { minHeight: '80px', fontSize: '12px', lineHeight: '1.4' }
      }
    >
      {/* Task Title */}
      <div className={`flex items-start justify-between gap-1 ${isCompact ? '' : 'mb-2'}`}>
        <Link
          to={`/tasks/${task.id}`}
          className={`font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate flex-1 leading-tight ${
            isCompact ? 'text-xs' : 'text-sm'
          }`}
          onClick={(e) => e.stopPropagation()}
          title={task.title}
          style={isCompact ? { fontSize: '10px' } : { fontSize: '13px' }}
        >
          {task.title}
        </Link>

        {/* Actions Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className={`rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0 ${
              isCompact ? 'p-0.5' : 'p-1'
            }`}
          >
            <MoreVertical size={isCompact ? 8 : 12} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Dropdown Portal */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-32"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999
          }}
        >
          <Link
            to={`/tasks/${task.id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
            }}
          >
            <Eye size={14} />
            View
          </Link>
          <Link
            to={`/tasks/${task.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(false);
            }}
          >
            <Edit size={14} />
            Edit
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg w-full text-left"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Task Meta Information */}
      <div className={`flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ${
        isCompact ? 'mt-0.5' : 'mt-2'
      }`}>
        {/* Assignee */}
        {task.userName && (
          <div className={`flex items-center ${isCompact ? 'gap-0.5' : 'gap-1'}`}>
            <User size={isCompact ? 6 : 10} />
            <span
              className={`truncate ${isCompact ? 'max-w-8' : 'max-w-20'} text-xs`}
              style={{ fontSize: isCompact ? '9px' : '11px' }}
            >
              {task.userName.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Priority Badge */}
        <div className={`flex items-center ${isCompact ? 'gap-0.5' : 'gap-1'} ${priorityInfo.color}`}>
          <PriorityIcon size={isCompact ? 6 : 10} />
          <span
            className="text-xs font-medium"
            style={{ fontSize: isCompact ? '9px' : '11px' }}
          >
            {isCompact ? priorityInfo.text.charAt(0) : priorityInfo.text}
          </span>
        </div>
      </div>


    </div>
  );
};

export default CalendarTaskCard;
