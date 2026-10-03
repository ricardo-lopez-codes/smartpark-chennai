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

  const registerCivilian = async (name, email, phone, password, vehicle_number, vehicle_type = 'CAR') => {
    try {
      console.log('[API] Registering civilian account...');
      let res;
      try {
        res = await api.post('/auth/register/civilian', {
          name,
          email,
          phone,
          password,
          vehicle_number,
          vehicle_type,
          role: 'civilian'
        });
      } catch (err1) {
        if (err1.response?.status === 404) {
          console.warn('[API] /auth/register/civilian returned 404, retrying /auth/register');
          res = await api.post('/auth/register', {
            name,
            email,
            phone,
            password,
            vehicle_number,
            vehicle_type,
            role: 'civilian'
          });
        } else {
          throw err1;
        }
      }
      const { access_token, user: userData } = res.data;
      localStorage.setItem('smartpark_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error('[API ERROR] registerCivilian failed:', err.response?.status, err.response?.data);
      return {
        success: false,
        error: err.response?.data?.detail || 'Registration failed.'
      };
    }
  };

  const registerOwner = async (ownerData) => {
    try {
      console.log('[API] Registering owner account...', ownerData.company_name);
      let res;
      try {
        res = await api.post('/auth/register/owner', { ...ownerData, role: 'owner' });
      } catch (err1) {
        if (err1.response?.status === 404) {
          console.warn('[API] /auth/register/owner returned 404, retrying /auth/register');
          res = await api.post('/auth/register', { ...ownerData, role: 'owner' });
        } else {
          throw err1;
        }
      }
      const { access_token, user: userData } = res.data;
      localStorage.setItem('smartpark_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error('[API ERROR] registerOwner failed:', err.response?.status, err.response?.data);
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
      updateProfile,
      refreshUser: fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
