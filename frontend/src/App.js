// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider }   from './context/AuthContext';
import ProtectedRoute     from './components/ui/ProtectedRoute';
import Layout             from './components/layout/Layout';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Products     from './pages/Products';
import Categories   from './pages/Categories';
import Suppliers    from './pages/Suppliers';
import Transactions from './pages/Transactions';
import Users        from './pages/Users';
import Settings     from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute adminOnly={true}><Layout><Users /></Layout></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute adminOnly={true}><Layout><Settings /></Layout></ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;