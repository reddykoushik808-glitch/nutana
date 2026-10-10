import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Shop } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, shop: Shop) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = async () => {
    try {
      const data = await api.get<{ user: User; shop: Shop }>('/auth/me');
      setUser(data.user);
      setShop(data.shop);
    } catch {
      setUser(null);
      setShop(null);
      api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = (token: string, user: User, shop: Shop) => {
    api.setToken(token);
    setUser(user);
    setShop(shop);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setShop(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
