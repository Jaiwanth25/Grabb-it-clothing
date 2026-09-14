import React, { createContext, useContext, useState, useEffect } from 'react';

const GenderContext = createContext();

export const GenderProvider = ({ children }) => {
  const [gender] = useState('men');

  const setGender = () => {
    try {
      localStorage.setItem('grabb_it_gender', 'men');
    } catch (e) {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('grabb_it_gender', 'men');
    } catch (e) {}
  }, []);

  return (
    <GenderContext.Provider value={{ gender: 'men', setGender }}>
      {children}
    </GenderContext.Provider>
  );
};

export const useGender = () => useContext(GenderContext);
