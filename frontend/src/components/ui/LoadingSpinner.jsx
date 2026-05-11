// src/components/ui/LoadingSpinner.jsx

import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="ml-3 text-gray-500 dark:text-gray-400">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;