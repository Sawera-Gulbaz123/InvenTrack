// src/hooks/useDarkMode.js
// Custom hook that manages dark mode state
// Separated into its own hook so any component can use it

import { useState, useEffect } from 'react';

const useDarkMode = () => {
  // Read saved preference from localStorage on first load
  // If nothing saved, check system preference
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ims_darkmode');

    // If user has previously set a preference, use it
    if (saved !== null) return saved === 'true';

    // Otherwise check their OS/browser preference
    // window.matchMedia detects system dark mode setting
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement; // the <html> element

    if (darkMode) {
      // Adding 'dark' class triggers all Tailwind dark: classes
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save preference so it persists across browser sessions
    localStorage.setItem('ims_darkmode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return { darkMode, toggleDarkMode };
};

export default useDarkMode;