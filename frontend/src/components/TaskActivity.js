import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { 
  Activity, 
  Plus, 
  Edit, 
  ArrowRight, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import { taskActivitiesApi } from '../services/api';

const TaskActivity = ({ taskId }) => {
  const { data: activities, isLoading, error } = useQuery(
    ['taskActivities', taskId],
    async () => {
      const response = await taskActivitiesApi.getByTaskId(taskId);
      return response.data;
    },
    {
      enabled: !!taskId,
    }
  );

  const getActivityIcon = (activityType) => {
    const iconMap = {
      0: Plus, // Created
      1: Edit, // StatusChanged
      2: AlertCircle, // PriorityChanged
      3: User, // AssigneeChanged
      4: Calendar, // DueDateChanged
      5: Tag, // CategoryChanged
      6: Edit, // TitleChanged
      7: Edit, // DescriptionChanged
      8: MessageCircle, // Commented
    };
    return iconMap[activityType] || Activity;
  };

  const getActivityColor = (activityType) => {
    const colorMap = {
      0: 'text-green-500', // Created
      1: 'text-blue-500', // StatusChanged
      2: 'text-orange-500', // PriorityChanged
      3: 'text-purple-500', // AssigneeChanged
      4: 'text-red-500', // DueDateChanged
      5: 'text-indigo-500', // CategoryChanged
      6: 'text-gray-500', // TitleChanged
      7: 'text-gray-500', // DescriptionChanged
      8: 'text-blue-500', // Commented
    };
    return colorMap[activityType] || 'text-gray-500';
  };

  const getActivityDescription = (activity) => {
    const { activityType, description, oldValue, newValue, userName } = activity;
    
    const baseDescription = description || 'Unknown activity';
    
    if (oldValue && newValue && oldValue !== newValue) {
      return (
        <span>
          {baseDescription}: <span className="font-medium">{oldValue}</span>
          <ArrowRight size={14} className="inline mx-1" />
          <span className="font-medium">{newValue}</span>
        </span>
      );
    }
    
    return baseDescription;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Failed to load activity log
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={20} className="text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity Log ({activities?.length || 0})
        </h3>
      </div>

      <div className="space-y-4">
        {activities?.map((activity, index) => {
          const IconComponent = getActivityIcon(activity.activityType);
          const iconColor = getActivityColor(activity.activityType);
          
          return (
            <div key={activity.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${iconColor}`}>
                <IconComponent size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
                
                {/* Add a connecting line for all but the last item */}
                {index < activities.length - 1 && (
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 ml-4 mt-2"></div>
                )}
              </div>
            </div>
          );
        })}
        
        {activities?.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity size={48} className="mx-auto mb-3 opacity-50" />
            <p>No activity recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskActivity;
