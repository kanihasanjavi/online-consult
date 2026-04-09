import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('mediconsult_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem('mediconsult_token') || null
  );

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('mediconsult_user', JSON.stringify(userData));
    localStorage.setItem('mediconsult_token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mediconsult_user');
    localStorage.removeItem('mediconsult_token');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('mediconsult_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
