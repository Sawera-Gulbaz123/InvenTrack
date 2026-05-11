// src/context/AuthContext.jsx
// Global authentication state shared across all components
// Any component can call useAuth() to get user info or logout

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create the context object
const AuthContext = createContext(null);

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider = ({ children }) => {
  // user holds: { username, role, access_token }
  // Initialized from localStorage so login persists on refresh
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ims_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── SESSION TIMEOUT ────────────────────────────────────────────
  // Tracks a timer — resets on every user action
  // If 30 minutes pass with no action, auto logout
  let timeoutRef = React.useRef(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        logout(true); // true = timeout logout
      }, SESSION_TIMEOUT_MS);
    }
  }, [user]);

  // Listen to mouse, keyboard, and touch events to reset timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // Start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, resetTimer]);

  // ── VERIFY TOKEN ON APP LOAD ───────────────────────────────────
  // When app loads, check if stored token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      const stored = localStorage.getItem('ims_user');
      if (!stored) { setLoading(false); return; }

      try {
        const parsed = JSON.parse(stored);
        // Call /api/auth/me to verify token is still valid
        await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.access_token}` }
        });
        setUser(parsed);
      } catch {
        // Token expired or invalid — clear it
        localStorage.removeItem('ims_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────
  const login = async (username, password) => {
    // OAuth2 requires form data, not JSON
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const res = await axios.post(`${API_BASE}/api/auth/login`, formData);

    const userData = {
      username:     res.data.username,
      role:         res.data.role,
      access_token: res.data.access_token,
    };

    // Save to state and localStorage
    setUser(userData);
    localStorage.setItem('ims_user', JSON.stringify(userData));

    return userData;
  };

  // ── LOGOUT ─────────────────────────────────────────────────────
  const logout = async (timedOut = false) => {
    try {
      if (user?.access_token) {
        await axios.post(`${API_BASE}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${user.access_token}` }
        });
      }
    } catch {
      // Even if logout API call fails, clear local state
    }

    localStorage.removeItem('ims_user');
    setUser(null);

    if (timedOut) {
      // Redirect with message that session expired
      navigate('/login?reason=timeout');
    } else {
      navigate('/login');
    }
  };

  // ── HELPERS ────────────────────────────────────────────────────
  const isAdmin  = user?.role === 'admin';
  const isViewer = user?.role === 'viewer';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isViewer, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — any component calls useAuth() instead of useContext(AuthContext)
export const useAuth = () => useContext(AuthContext);