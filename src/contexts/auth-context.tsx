"use client";

import type { User, UserRole } from '@/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LOCAL_STORAGE_USERS_KEY, MASTER_ADMIN_USN, MASTER_ADMIN_PASSWORD, MASTER_ADMIN_NAME } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usn: string, password?: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useLocalStorage<User[]>(LOCAL_STORAGE_USERS_KEY, []);
  const router = useRouter();

  const initializeMasterAdmin = useCallback(() => {
    const masterAdminExists = users.some(user => user.usn === MASTER_ADMIN_USN);
    if (!masterAdminExists) {
      const masterAdmin: User = {
        id: MASTER_ADMIN_USN,
        usn: MASTER_ADMIN_USN,
        password: MASTER_ADMIN_PASSWORD, // In a real app, hash this password
        role: 'master-admin',
        semester: 'N/A',
        name: MASTER_ADMIN_NAME,
      };
      setUsers([...users, masterAdmin]);
    }
  }, [users, setUsers]);


  useEffect(() => {
    initializeMasterAdmin();
    // Attempt to load user from session storage or local storage
    const storedUserJson = sessionStorage.getItem('currentUser');
    if (storedUserJson) {
      const storedUser = JSON.parse(storedUserJson) as User;
      // Validate against users in localStorage
      const validatedUser = users.find(u => u.usn === storedUser.usn);
      if (validatedUser) {
        setCurrentUser(validatedUser);
      } else {
        // User in session storage is not in our users list, possibly removed
        sessionStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, [users, initializeMasterAdmin]);

  const login = async (usn: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const upperUsn = usn.toUpperCase();
    const user = users.find(u => u.usn === upperUsn);

    if (user && (!user.password || user.password === password)) { // If no password set, or password matches
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      setIsLoading(false);
      router.push('/dashboard');
      toast({ title: "Login Successful", description: `Welcome back, ${user.name || user.usn}!` });
      return true;
    }
    setIsLoading(false);
    toast({ title: "Login Failed", description: "Invalid USN or password.", variant: "destructive" });
    return false;
  };

  const register = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    setIsLoading(true);
    const upperUsn = userData.usn.toUpperCase();
    if (users.some(u => u.usn === upperUsn)) {
      setIsLoading(false);
      toast({ title: "Registration Failed", description: "USN already exists.", variant: "destructive" });
      return false;
    }
    
    const newUser: User = { 
      ...userData, 
      id: upperUsn, 
      usn: upperUsn, 
      // Ensure password is set, even if empty string, if role is student
      // For admins, password can be optional initially
      password: userData.password || (userData.role === 'student' ? "" : undefined),
    };
    setUsers([...users, newUser]);
    // Optionally log in the user directly after registration
    // await login(newUser.usn, newUser.password); 
    setIsLoading(false);
    toast({ title: "Registration Successful", description: "You can now log in." });
    router.push('/login');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    router.push('/login');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const updateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    // Also update in the main users list
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
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

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};