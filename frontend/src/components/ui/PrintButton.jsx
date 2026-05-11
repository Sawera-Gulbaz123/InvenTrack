// src/components/ui/PrintButton.jsx

import React from 'react';
import { FiPrinter } from 'react-icons/fi';

const PrintButton = ({ label = 'Print' }) => {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
    >
      <FiPrinter size={16} />
      {label}
    </button>
  );
};

export default PrintButton;