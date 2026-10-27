import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Compatibility flag; credential remains HttpOnly.
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const versionAtStart = authVersion.current;

    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        // Do not let an older /auth/me request overwrite a successful login/register.
        if (!mounted.current || versionAtStart !== authVersion.current) return;
        if (res.data.success) {
          setUser(res.data.user);
          setToken('cookie');
        }
      } catch {
        if (!mounted.current || versionAtStart !== authVersion.current) return;
        setUser(null);
        setToken(null);
      } finally {
        if (mounted.current && versionAtStart === authVersion.current) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted.current = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      authVersion.current += 1;
      setToken('cookie');
      setUser(res.data.user);
      setLoading(false);
      return res.data.user;
    }
    return null;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      authVersion.current += 1;
      setToken('cookie');
      setUser(res.data.user);
      setLoading(false);
      return res.data.user;
    }
    return null;
  };

  const logout = async () => {
    authVersion.current += 1;
    try { await api.post('/auth/logout'); } catch { /* session may already be expired */ }
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }));

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setToken('cookie');
      }
    } catch {
      authVersion.current += 1;
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout, updateUser, refreshProfile,
      isAuthenticated: !!user,
      isUser: user?.role === 'user',
      isOwner: user?.role === 'owner',
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
