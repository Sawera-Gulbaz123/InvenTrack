// src/components/ui/ExportMenu.jsx

import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiChevronDown } from 'react-icons/fi';
import ReportBuilder from './ReportBuilder';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const ExportMenu = ({ data, columns, filename, pdfTitle }) => {
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [builderOpen,  setBuilderOpen]  = useState(false);
  const [activeFormat, setActiveFormat] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFormatClick = (format) => {
    setActiveFormat(format);
    setMenuOpen(false);
    setBuilderOpen(true);
  };

  const handleExport = (selectedColumns) => {
    if (activeFormat === 'csv')   exportToCSV(selectedColumns, data, filename);
    if (activeFormat === 'excel') exportToExcel(selectedColumns, data, filename);
    if (activeFormat === 'pdf')   exportToPDF(selectedColumns, data, filename, pdfTitle);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiDownload size={16} />
          Export
          <FiChevronDown size={14} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="p-1">
              <p className="text-xs text-gray-400 px-3 py-1.5 font-medium uppercase tracking-wide">
                Download as
              </p>
              {[
                { format: 'csv',   icon: '📄', label: 'CSV File',   sub: 'Comma separated'     },
                { format: 'excel', icon: '📊', label: 'Excel File', sub: 'Spreadsheet (.xlsx)' },
                { format: 'pdf',   icon: '📋', label: 'PDF Report', sub: 'Formatted document'  },
              ].map(opt => (
                <button
                  key={opt.format}
                  onClick={() => handleFormatClick(opt.format)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ReportBuilder
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        columns={columns}
        onExport={handleExport}
        exportFormat={activeFormat}
        title={pdfTitle}
      />
    </>
  );
};

export default ExportMenu;