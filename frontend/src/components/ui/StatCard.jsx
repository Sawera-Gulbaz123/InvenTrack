// src/components/ui/StatCard.jsx

import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorMap = {
    blue:   'bg-blue-100   dark:bg-blue-900   text-blue-600   dark:text-blue-400',
    green:  'bg-green-100  dark:bg-green-900  text-green-600  dark:text-green-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    red:    'bg-red-100    dark:bg-red-900    text-red-600    dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-full ${colorMap[color] || colorMap.blue}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;