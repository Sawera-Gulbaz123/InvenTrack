// src/pages/Settings.jsx
// Backup and Import page — admin only

import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  FiDownload, FiUpload, FiDatabase,
  FiFileText, FiAlertTriangle, FiCheck,
  FiFile
} from 'react-icons/fi';
import api from '../api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.NODE_ENV === 'production'
  ? ''
  : 'http://localhost:8000';

// ── Download helper ──────────────────────────────────────────────
const downloadFile = async (url, filename, setLoading) => {
  try {
    setLoading(true);

    // Get token for auth header
    const stored = localStorage.getItem('ims_user');
    const token  = stored ? JSON.parse(stored).access_token : null;

    const response = await fetch(`${API_BASE}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Download failed');
    }

    // Get filename from response headers if available
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      const match = disposition.match(/filename=([^;]+)/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const url2 = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url2;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url2);

    toast.success(`${filename} downloaded ✅`);
  } catch (err) {
    toast.error(err.message || 'Download failed');
  } finally {
    setLoading(false);
  }
};


// ── Section Card ─────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, color, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);


// ── Import Result Display ─────────────────────────────────────────
const ImportResult = ({ result }) => {
  if (!result) return null;
  return (
    <div className={`mt-4 p-4 rounded-lg border ${
      result.skipped > 0
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <FiCheck className="text-green-600" size={16} />
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          Import Complete
        </span>
      </div>
      <div className="text-sm space-y-1">
        <p className="text-green-700 dark:text-green-400">
          ✅ {result.created} records created
        </p>
        {result.skipped > 0 && (
          <p className="text-yellow-700 dark:text-yellow-400">
            ⚠️ {result.skipped} records skipped
          </p>
        )}
      </div>
      {result.errors && result.errors.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Issues:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {result.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ── MAIN SETTINGS PAGE ───────────────────────────────────────────
const Settings = () => {
  const { isAdmin }  = useAuth();

  // Backup loading states
  const [sqlLoading,   setSqlLoading]   = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  // Import states
  const [importingProducts,     setImportingProducts]     = useState(false);
  const [importingTransactions, setImportingTransactions] = useState(false);
  const [productResult,         setProductResult]         = useState(null);
  const [transactionResult,     setTransactionResult]     = useState(null);

  const productFileRef     = useRef(null);
  const transactionFileRef = useRef(null);

  // ── Backup handlers ──
  const handleSQLBackup = () => {
    downloadFile('/api/backup/sql', 'backup.sql', setSqlLoading);
  };

  const handleExcelBackup = () => {
    downloadFile('/api/backup/excel', 'backup.xlsx', setExcelLoading);
  };

  // ── Template download handlers ──
  const handleProductTemplate = () => {
    downloadFile('/api/backup/template/products', 'products_template.xlsx', () => {});
  };

  const handleTransactionTemplate = () => {
    downloadFile('/api/backup/template/transactions', 'transactions_template.xlsx', () => {});
  };

  // ── Import handlers ──
  const handleImportProducts = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportingProducts(true);
      setProductResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const stored = localStorage.getItem('ims_user');
      const token  = stored ? JSON.parse(stored).access_token : null;

      const response = await fetch(`${API_BASE}/api/backup/import/products`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Import failed');
      }

      setProductResult(result);
      toast.success(`Import complete — ${result.created} products added`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImportingProducts(false);
      if (productFileRef.current) productFileRef.current.value = '';
    }
  };

  const handleImportTransactions = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportingTransactions(true);
      setTransactionResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const stored = localStorage.getItem('ims_user');
      const token  = stored ? JSON.parse(stored).access_token : null;

      const response = await fetch(`${API_BASE}/api/backup/import/transactions`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Import failed');
      }

      setTransactionResult(result);
      toast.success(`Import complete — ${result.created} transactions added`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImportingTransactions(false);
      if (transactionFileRef.current) transactionFileRef.current.value = '';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <FiAlertTriangle className="text-red-500 mb-3" size={40} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Admin Only</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          You need admin privileges to access settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Database backup, data import, and system settings
        </p>
      </div>

      {/* ── BACKUP SECTION ── */}
      <SectionCard
        title="Database Backup"
        icon={FiDatabase}
        color="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Download a complete backup of your inventory database.
          Store it somewhere safe regularly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* SQL Backup */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDatabase className="text-blue-600" size={18} />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                SQL Backup
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Full database dump (.sql). Use this to restore your database
              completely. Best for deployment migration.
            </p>
            <button
              onClick={handleSQLBackup}
              disabled={sqlLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              <FiDownload size={15} />
              {sqlLoading ? 'Generating...' : 'Download .sql'}
            </button>
          </div>

          {/* Excel Backup */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="text-green-600" size={18} />
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Excel Backup
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              All tables exported to Excel sheets. Human-readable format,
              easy to audit or share with others.
            </p>
            <button
              onClick={handleExcelBackup}
              disabled={excelLoading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
            >
              <FiDownload size={15} />
              {excelLoading ? 'Generating...' : 'Download .xlsx'}
            </button>
          </div>
        </div>

        {/* Backup tip */}
        <div className="mt-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
          <FiAlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={14} />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Tip:</strong> Take a SQL backup before making major changes
            or before deploying updates. Keep at least 3 recent backups.
          </p>
        </div>
      </SectionCard>

      {/* ── IMPORT PRODUCTS SECTION ── */}
      <SectionCard
        title="Import Products from Excel"
        icon={FiUpload}
        color="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Bulk add products by uploading an Excel file.
          Download the template first to see the correct format.
        </p>

        {/* Required columns info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Required columns in your Excel file:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['name', 'price', 'cost_price', 'quantity',
              'low_stock_threshold', 'sku', 'category',
              'supplier', 'description'].map(col => (
              <span
                key={col}
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  col === 'name'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {col}
                {col === 'name' ? ' *' : ''}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">* required</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Download template */}
          <button
            onClick={handleProductTemplate}
            className="flex items-center justify-center gap-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm"
          >
            <FiFile size={15} />
            Download Template
          </button>

          {/* Upload file */}
          <button
            onClick={() => productFileRef.current?.click()}
            disabled={importingProducts}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            <FiUpload size={15} />
            {importingProducts ? 'Importing...' : 'Upload & Import'}
          </button>

          <input
            type="file"
            ref={productFileRef}
            onChange={handleImportProducts}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>

        <ImportResult result={productResult} />
      </SectionCard>

      {/* ── IMPORT TRANSACTIONS SECTION ── */}
      <SectionCard
        title="Import Transactions from Excel"
        icon={FiUpload}
        color="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Bulk import stock movements. Products must already exist in the system.
          Stock quantities will be updated automatically.
        </p>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Required columns:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['product', 'type', 'quantity', 'note'].map(col => (
              <span
                key={col}
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  col !== 'note'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {col}
                {col !== 'note' ? ' *' : ''}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            * required. Type must be IN or OUT
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleTransactionTemplate}
            className="flex items-center justify-center gap-2 border border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm"
          >
            <FiFile size={15} />
            Download Template
          </button>

          <button
            onClick={() => transactionFileRef.current?.click()}
            disabled={importingTransactions}
            className="flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
          >
            <FiUpload size={15} />
            {importingTransactions ? 'Importing...' : 'Upload & Import'}
          </button>

          <input
            type="file"
            ref={transactionFileRef}
            onChange={handleImportTransactions}
            accept=".xlsx,.xls"
            className="hidden"
          />
        </div>

        <ImportResult result={transactionResult} />
      </SectionCard>

    </div>
  );
};

export default Settings;