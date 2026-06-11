'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const SpecContext = createContext({
  specMode: false,
  toggleSpecMode: () => {},
  activeSpec: null,
  setActiveSpec: () => {},
});

export function SpecProvider({ children }) {
  const [specMode, setSpecMode] = useState(false);
  const [activeSpec, setActiveSpec] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('__spec_mode_enabled');
    if (saved === 'true') {
      setSpecMode(true);
    }
  }, []);

  const toggleSpecMode = () => {
    setSpecMode(prev => {
      const next = !prev;
      localStorage.setItem('__spec_mode_enabled', String(next));
      if (!next) setActiveSpec(null); // Clear active when turning off
      return next;
    });
  };

  return (
    <SpecContext.Provider value={{ specMode, toggleSpecMode, activeSpec, setActiveSpec }}>
      {children}
    </SpecContext.Provider>
  );
}

export function useSpec() {
  return useContext(SpecContext);
}
