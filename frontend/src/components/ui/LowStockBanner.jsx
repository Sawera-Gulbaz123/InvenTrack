// src/components/ui/LowStockBanner.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { productAPI } from '../../api';

const LowStockBanner = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dismissed,     setDismissed]     = useState(false);

  useEffect(() => { fetchLowStock(); }, []);

  const fetchLowStock = async () => {
    try {
      const res = await productAPI.getAll({ low_stock: true });
      setLowStockItems(res.data);
    } catch (err) {
      console.error('Failed to fetch low stock items');
    }
  };

  if (dismissed || lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <FiAlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
          <span className="text-amber-800 dark:text-amber-300 font-medium text-sm">
            Low Stock Alert:
          </span>
          <span className="text-amber-700 dark:text-amber-400 text-sm">
            {lowStockItems.slice(0, 3).map(p => p.name).join(', ')}
            {lowStockItems.length > 3 && (
              <span className="font-medium"> and {lowStockItems.length - 3} more</span>
            )}
            {' '}need restocking.
          </span>
          <Link
            to="/products"
            className="text-amber-800 dark:text-amber-300 underline text-sm font-medium hover:text-amber-900 dark:hover:text-amber-200"
          >
            View Products →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0 transition-colors"
        >
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default LowStockBanner;