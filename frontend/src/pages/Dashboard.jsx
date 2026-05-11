// src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  FiPackage, FiTag, FiTruck,
  FiAlertTriangle, FiDollarSign,
  FiArrowUp, FiArrowDown, FiTrendingUp
} from 'react-icons/fi';
import { dashboardAPI, productAPI } from '../api';
import StatCard       from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PrintButton    from '../components/ui/PrintButton';

const PIE_COLORS = [
  '#3b82f6','#10b981','#f59e0b',
  '#ef4444','#8b5cf6','#06b6d4',
  '#ec4899','#84cc16'
];

const Dashboard = () => {
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes] = await Promise.all([
        dashboardAPI.getStats(),
        productAPI.getAll(),
      ]);
      setStats(sRes.data);
      setProducts(pRes.data);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = products.reduce((acc, product) => {
    const name     = product.category?.name || 'Uncategorized';
    const existing = acc.find(i => i.name === name);
    if (existing) existing.stock += product.quantity;
    else acc.push({ name, stock: product.quantity });
    return acc;
  }, []);

  const fmt = (v) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(v);

  return (
    <div className="space-y-6">

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Welcome back! Here's what's happening with your inventory.
          </p>
        </div>
        <div className="no-print">
          <PrintButton />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products"   value={stats?.total_products    || 0} icon={FiPackage}       color="blue"   subtitle="Items in inventory" />
        <StatCard title="Categories"       value={stats?.total_categories  || 0} icon={FiTag}           color="purple" subtitle="Product categories" />
        <StatCard title="Suppliers"        value={stats?.total_suppliers   || 0} icon={FiTruck}         color="green"  subtitle="Active suppliers" />
        <StatCard title="Low Stock Alerts" value={stats?.low_stock_count   || 0} icon={FiAlertTriangle} color="red"    subtitle="Items need restocking" />
      </div>

      {/* Stock Value */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

  {/* Stock Value at selling price */}
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-3">
    <div className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
      <FiDollarSign size={22} />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Stock Value (Sell)</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {fmt(stats?.total_stock_value || 0)}
      </p>
    </div>
  </div>

  {/* Stock Value at cost price */}
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-3">
    <div className="p-3 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full">
      <FiDollarSign size={22} />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Stock Value (Cost)</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
        {fmt(stats?.total_cost_value || 0)}
      </p>
    </div>
  </div>

  {/* Potential Profit */}
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-3">
    <div className={`p-3 rounded-full ${
      (stats?.total_profit_value || 0) >= 0
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
        : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
    }`}>
      <FiTrendingUp size={22} />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Potential Profit</p>
      <p className={`text-xl font-bold ${
        (stats?.total_profit_value || 0) >= 0
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-red-600'
      }`}>
        {fmt(stats?.total_profit_value || 0)}
      </p>
    </div>
  </div>
</div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Stock Levels by Category
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px', border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                    backgroundColor: '#1f2937', color: '#f9fafb'
                  }}
                />
                <Bar dataKey="stock" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              No product data available
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Stock Distribution
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData} cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="stock" nameKey="name"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px', border: 'none',
                    backgroundColor: '#1f2937', color: '#f9fafb'
                  }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => (
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Recent Transactions
        </h2>
        {stats?.recent_transactions?.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_transactions.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    t.transaction_type === 'IN'
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                  }`}>
                    {t.transaction_type === 'IN'
                      ? <FiArrowDown size={14} />
                      : <FiArrowUp   size={14} />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                      {t.product?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  t.transaction_type === 'IN' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {t.transaction_type === 'IN' ? '+' : '-'}{t.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400">
            No transactions yet
          </div>
        )}
      </div>

      {/* Low Stock Table */}
      {products.filter(p => p.quantity <= p.low_stock_threshold).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="text-red-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Low Stock Alerts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Current Stock</th>
                  <th className="pb-3 font-medium">Threshold</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products
                  .filter(p => p.quantity <= p.low_stock_threshold)
                  .map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 font-medium text-gray-800 dark:text-gray-100">{p.name}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{p.category?.name || '—'}</td>
                      <td className="py-3 font-bold text-red-600">{p.quantity}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{p.low_stock_threshold}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;