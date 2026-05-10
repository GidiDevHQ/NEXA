import { useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../services/api';
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    usersAPI.getMyProfile()
      .then(response => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = async (credentials) => {
    try {
      const response = await authAPI.signIn(credentials);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Sign in failed'
      };
    }
  };

  const signUp = async (userData) => {
    try {
      const response = await authAPI.signUp(userData);
      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Sign up failed'
      };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};