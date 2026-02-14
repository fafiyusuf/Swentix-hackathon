import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check token validity on mount
    const validateToken = async () => {
      if (token) {
        try {
          const username = localStorage.getItem('username');
          setUser({ username });
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, [token]);

  const login = (tokenData, username) => {
    localStorage.setItem('access_token', tokenData.access_token);
    localStorage.setItem('token_type', tokenData.token_type);
    localStorage.setItem('expires_in', tokenData.expires_in);
    localStorage.setItem('username', username);
    setToken(tokenData.access_token);
    setUser({ username });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('expires_in');
    localStorage.removeItem('username');
    localStorage.removeItem('rememberedUsername');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
};