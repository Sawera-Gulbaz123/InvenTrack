// src/components/ui/EmptyState.jsx

import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ message = 'No data found' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500">
      <FiInbox size={48} className="mb-3" />
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
};

export default EmptyState;