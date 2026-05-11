// src/components/layout/Layout.jsx

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiTag, FiTruck,
  FiRepeat, FiMenu, FiX, FiUsers,
  FiLogOut, FiUser, FiShield,
  FiSun, FiMoon, FiSettings
} from 'react-icons/fi';
import { useAuth }      from '../../context/AuthContext';
import LowStockBanner   from '../ui/LowStockBanner';
import useDarkMode      from '../../hooks/useDarkMode';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location                      = useLocation();
  const { user, logout, isAdmin }     = useAuth();

  // Dark mode hook — manages toggle and localStorage
  const { darkMode, toggleDarkMode }  = useDarkMode();

  const navItems = [
  { path: '/',             label: 'Dashboard',    icon: FiGrid     },
  { path: '/products',     label: 'Products',     icon: FiPackage  },
  { path: '/categories',   label: 'Categories',   icon: FiTag      },
  { path: '/suppliers',    label: 'Suppliers',    icon: FiTruck    },
  { path: '/transactions', label: 'Transactions', icon: FiRepeat   },
  ...(isAdmin ? [
    { path: '/users',    label: 'Users',    icon: FiUsers    },
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ] : []),
];

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-white dark:bg-gray-800
        shadow-lg border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto
      `}>

        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FiPackage className="text-blue-600 text-2xl" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-lg">
              InvenTrack
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 dark:text-gray-400"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon     = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={18} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
              <FiUser className="text-blue-600 dark:text-blue-400" size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {user?.username}
              </p>
              <span className={`text-xs font-medium inline-flex items-center gap-1 ${
                user?.role === 'admin'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-400'
              }`}>
                {user?.role === 'admin' && <FiShield size={10} />}
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600 dark:text-gray-300"
            >
              <FiMenu size={24} />
            </button>
            <h1 className="text-base font-semibold text-gray-700 dark:text-gray-200">
              Inventory Management System
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Live
              </span>
            </div>

            {/* ── DARK MODE TOGGLE ── */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Show sun in dark mode (to switch to light) */}
              {/* Show moon in light mode (to switch to dark) */}
              {darkMode
                ? <FiSun  size={18} className="text-amber-400" />
                : <FiMoon size={18} />
              }
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Logout"
            >
              <FiLogOut size={16} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Low Stock Banner */}
        <LowStockBanner />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;