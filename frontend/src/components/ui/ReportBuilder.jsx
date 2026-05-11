// src/components/ui/ReportBuilder.jsx

import React, { useState } from 'react';
import { FiDownload, FiX, FiCheck } from 'react-icons/fi';

const ReportBuilder = ({ isOpen, onClose, columns, onExport, exportFormat, title }) => {
  const [selected, setSelected] = useState(
    () => columns.reduce((acc, col) => ({ ...acc, [col.key]: col.defaultOn }), {})
  );

  if (!isOpen) return null;

  const toggle     = (key) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  const selectAll  = () => setSelected(columns.reduce((acc, col) => ({ ...acc, [col.key]: true  }), {}));
  const selectNone = () => setSelected(columns.reduce((acc, col) => ({ ...acc, [col.key]: false }), {}));

  const handleExport = () => {
    const selectedCols = columns.filter(col => selected[col.key]);
    if (selectedCols.length === 0) { alert('Select at least one column'); return; }
    onExport(selectedCols);
    onClose();
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const formatLabel   = { csv: '📄 CSV', excel: '📊 Excel', pdf: '📋 PDF' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 z-10">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Customize Report
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Select columns for your {formatLabel[exportFormat]} export
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <FiX size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCount} of {columns.length} selected
          </span>
          <div className="flex gap-2">
            <button onClick={selectAll}  className="text-xs text-blue-600 hover:underline">Select All</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={selectNone} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Clear All</button>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {columns.map(col => (
            <label
              key={col.key}
              onClick={() => toggle(col.key)}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer border transition-colors ${
                selected[col.key]
                  ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                selected[col.key] ? 'bg-blue-600' : 'border-2 border-gray-300 dark:border-gray-500'
              }`}>
                {selected[col.key] && <FiCheck size={10} className="text-white" />}
              </div>
              <span className={`text-sm ${
                selected[col.key]
                  ? 'text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {col.label}
              </span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiDownload size={15} />
            Export {formatLabel[exportFormat]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;