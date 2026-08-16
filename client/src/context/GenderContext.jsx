import React, { createContext, useContext, useState, useEffect } from 'react';

const GenderContext = createContext();

export const GenderProvider = ({ children }) => {
  const [gender, setGender] = useState('men');

  useEffect(() => {
    localStorage.setItem('grabb_it_gender', 'men');
  }, [gender]);

  const switchGender = () => {
    setGender('men');
  };

  return (
    <GenderContext.Provider value={{ gender: 'men', setGender: switchGender }}>
      {children}
    </GenderContext.Provider>
  );
};

export const useGender = () => useContext(GenderContext);
