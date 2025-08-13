import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent absolute top-0 left-0"></div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
