import React, { createContext, useContext, useState, useEffect } from 'react';

const GenderContext = createContext();

export const GenderProvider = ({ children }) => {
  const [gender, setGenderState] = useState(() => {
    try {
      const saved = localStorage.getItem('grabb_it_gender');
      return (saved === 'women' || saved === 'men') ? saved : 'men';
    } catch (e) {
      return 'men';
    }
  });

  const setGender = (newGender) => {
    const valid = (newGender === 'women' || newGender === 'men') ? newGender : 'men';
    setGenderState(valid);
    try {
      localStorage.setItem('grabb_it_gender', valid);
    } catch (e) {}
  };

  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
};

export const useGender = () => useContext(GenderContext);
