import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AdminContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(false);

  const adminLogin = async (email, password, adminSecret) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, {
        email,
        password,
        admin_secret: adminSecret
      });
      
      // Check if 2FA is required
      if (response.data.requires_2fa) {
        return { requires_2fa: true };
      }
      
      const { access_token, user } = response.data;
      localStorage.setItem('admin_token', access_token);
      setAdminToken(access_token);
      setAdmin(user);
      
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLoginWith2FA = async (email, password, adminSecret, totpCode) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login-2fa`, {
        email,
        password,
        admin_secret: adminSecret,
        totp_code: totpCode
      });
      
      const { access_token, user } = response.data;
      localStorage.setItem('admin_token', access_token);
      setAdminToken(access_token);
      setAdmin(user);
      
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAdmin = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    
    try {
      const response = await axios.get(`${API}/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmin(response.data);
      setAdminToken(token);
      return true;
    } catch (error) {
      localStorage.removeItem('admin_token');
      setAdmin(null);
      setAdminToken(null);
      return false;
    }
  }, []);

  const adminLogout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setAdminToken(null);
  };

  const adminApi = useCallback(async (method, endpoint, data = null) => {
    const config = {
      method,
      url: `${API}${endpoint}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    };
    
    if (data) {
      if (data instanceof FormData) {
        config.data = data;
      } else {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    const response = await axios(config);
    return response.data;
  }, [adminToken]);

  return (
    <AdminContext.Provider value={{
      admin,
      adminToken,
      isLoading,
      adminLogin,
      adminLoginWith2FA,
      adminLogout,
      verifyAdmin,
      adminApi
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
