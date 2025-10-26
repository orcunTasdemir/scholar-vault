"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api, User, LoginResponse } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username?: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("auth_token");
      if (storedToken) {
        try {
          const userData = await api.getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(userData);
        } catch {
          localStorage.removeItem("auth_token");
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response: LoginResponse = await api.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("auth_token", response.token);
  };

  const register = async (
    email: string,
    password: string,
    username?: string
  ) => {
    const user = await api.register(email, password, username);
    await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading }}
    >
      {className ? <div className={className}>{children}</div> : children}{" "}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context == undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
