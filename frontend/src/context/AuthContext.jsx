import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartpark_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const savedToken = localStorage.getItem('smartpark_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.warn('Authentication token invalid or expired.');
      localStorage.removeItem('smartpark_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('smartpark_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Invalid email or password.'
      };
    }
  };

  const registerCivilian = async (name, email, phone, password, vehicle_number) => {
    try {
      const res = await api.post('/auth/register/civilian', {
        name,
        email,
        phone,
        password,
        vehicle_number,
        role: 'civilian'
      });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('smartpark_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Registration failed.'
      };
    }
  };

  const registerOwner = async (ownerData) => {
    try {
      const res = await api.post('/auth/register/owner', ownerData);
      const { access_token, user: userData } = res.data;
      localStorage.setItem('smartpark_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Owner registration failed.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartpark_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/auth/me', data);
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register: registerCivilian,
      registerCivilian,
      registerOwner,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
