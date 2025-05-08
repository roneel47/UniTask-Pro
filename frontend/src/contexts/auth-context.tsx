"use client";

import type { User, UserRole } from '@/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';


interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usn: string, password?: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: User) => void; // For local updates if needed by profile page, etc.
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserJson = sessionStorage.getItem('currentUser');
    if (storedUserJson) {
      try {
        const storedUser = JSON.parse(storedUserJson) as User;
        // Optionally: Validate session with a quick backend check here
        // e.g., fetch('/api/auth/validate-session').then(res => if (!res.ok) logout());
        setCurrentUser(storedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        sessionStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usn: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usn, password }),
      });
      const data = await response.json();

      if (response.ok && data.user) {
        setCurrentUser(data.user);
        sessionStorage.setItem('currentUser', JSON.stringify(data.user));
        setIsLoading(false);
        router.push('/dashboard');
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.name || data.user.usn}!` });
        return true;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({ title: "Login Failed", description: error.message || "Invalid USN or password.", variant: "destructive" });
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        toast({ title: "Registration Successful", description: "You can now log in." });
        router.push('/login');
        return true;
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({ title: "Registration Failed", description: error.message || "Could not register user.", variant: "destructive" });
      return false;
    }
  };

  const logout = () => {
    // Optionally, call a backend logout endpoint if session management is server-side
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updateCurrentUser = (updatedUser: User) => {
    // This is primarily for optimistic UI updates or client-side profile changes.
    // Backend is the source of truth. Any critical update should refetch or be pushed.
    setCurrentUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAuthenticated: !!currentUser, 
      isLoading, 
      login, 
      register, 
      logout,
      updateCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
