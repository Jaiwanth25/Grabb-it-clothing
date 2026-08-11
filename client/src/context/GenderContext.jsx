import React, { createContext, useContext, useState, useEffect } from 'react';

const GenderContext = createContext();

export const GenderProvider = ({ children }) => {
  const [gender, setGender] = useState(() => {
    return localStorage.getItem('grabb_it_gender') || 'men';
  });

  useEffect(() => {
    localStorage.setItem('grabb_it_gender', gender);
  }, [gender]);

  const switchGender = (newGender) => {
    if (newGender === 'men' || newGender === 'women') {
      setGender(newGender);
    }
  };

  return (
    <GenderContext.Provider value={{ gender, setGender: switchGender }}>
      {children}
    </GenderContext.Provider>
  );
};

export const useGender = () => useContext(GenderContext);
