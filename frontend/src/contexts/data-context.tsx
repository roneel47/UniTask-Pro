"use client";

import type { Task, User, TaskStatus, TaskAssignmentMeta } from '@/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/config';

interface DataContextType {
  users: User[];
  tasks: Task[];
  taskAssignmentsMeta: TaskAssignmentMeta[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchTaskAssignmentsMeta: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'submissionFile'>) => Promise<Task[] | null>; // Returns array of created tasks
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User | null>;
  getTasksForCurrentUser: () => Task[];
  getUsersByFilter: (role?: User['role'], semester?: User['semester'], usnSearch?: string) => User[];
  addTaskAssignmentMeta: (metaData: Omit<TaskAssignmentMeta, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TaskAssignmentMeta | null>;
  deleteTaskAssignmentMetaAndTasks: (metaId: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Centralized API fetch function
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if using token-based auth
      // 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
    console.error(`API Error (${endpoint}):`, errorData.message);
    toast({ title: "API Error", description: errorData.message || "An unexpected error occurred.", variant: "destructive" });
    throw new Error(errorData.message || `API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUser: updateAuthCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignmentsMeta, setTaskAssignmentsMeta] = useState<TaskAssignmentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWithLoading = useCallback(async <T,>(fetchFn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    try {
      return await fetchFn();
    } catch (error) {
      // Error is already toasted by fetchApi
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!currentUser) return;
    const fetchedTasks = await fetchWithLoading(() => fetchApi<Task[]>(`/tasks/user/${currentUser.usn}`));
    if (fetchedTasks) setTasks(fetchedTasks);
  }, [currentUser, fetchWithLoading]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'master-admin') return;
    const fetchedUsers = await fetchWithLoading(() => fetchApi<User[]>('/users'));
    if (fetchedUsers) setUsers(fetchedUsers);
  }, [currentUser, fetchWithLoading]);

  const fetchTaskAssignmentsMeta = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return; // Only regular admins create/view their own meta assignments for now
    const fetchedMetas = await fetchWithLoading(() => fetchApi<TaskAssignmentMeta[]>(`/tasks/assignments/meta/admin/${currentUser.usn}`));
    if (fetchedMetas) setTaskAssignmentsMeta(fetchedMetas);
  }, [currentUser, fetchWithLoading]);
  
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      if (currentUser.role === 'master-admin') fetchUsers();
      if (currentUser.role === 'admin') fetchTaskAssignmentsMeta();
    } else {
      // Clear data if user logs out
      setTasks([]);
      setUsers([]);
      setTaskAssignmentsMeta([]);
    }
  }, [currentUser, fetchTasks, fetchUsers, fetchTaskAssignmentsMeta]);


  const addTaskAssignmentMeta = async (metaData: Omit<TaskAssignmentMeta, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignmentMeta | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master-admin')) return null;
    
    const newMeta = await fetchWithLoading(() => fetchApi<TaskAssignmentMeta>('/tasks/assignments/meta', {
      method: 'POST',
      body: JSON.stringify(metaData),
    }));

    if (newMeta) {
      setTaskAssignmentsMeta(prev => [...prev, newMeta]);
      toast({ title: "Task Assignment Created", description: `Meta for "${newMeta.title}" created.` });
    }
    return newMeta;
  };
  
  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'submissionFile'>): Promise<Task[] | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master-admin')) return null;
    
    const createdTasks = await fetchWithLoading(() => fetchApi<Task[]>('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData), 
    }));
    
    if (createdTasks) {
      await fetchTasks(); // Refresh task list for current user
      toast({ title: "Tasks Assigned", description: `Tasks for "${taskData.title}" assigned.` });
    }
    return createdTasks;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    const updatedTask = await fetchWithLoading(() => fetchApi<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }));

    if (updatedTask) {
      setTasks(prevTasks => prevTasks.map(t => (t._id === taskId ? updatedTask : t))); // Match on _id
      toast({ title: "Task Updated", description: `Task "${updatedTask.title}" updated.` });
    }
    return updatedTask;
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<Task | null> => {
    return updateTask(taskId, { status: newStatus });
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    const success = await fetchWithLoading(async () => {
      await fetchApi<void>(`/tasks/${taskId}`, { method: 'DELETE' });
      return true;
    });
    if (success) {
      setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId)); // Match on _id
      toast({ title: "Task Deleted" });
      return true;
    }
    return false;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const success = await fetchWithLoading(async () => {
      await fetchApi<void>(`/users/${userId}`, { method: 'DELETE' }); // userId here is USN
      return true;
    });

    if (success) {
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId)); // userId here is USN
      await fetchTasks(); // Refresh tasks if user's tasks were deleted
      toast({ title: "User Deleted" });
      return true;
    }
    return false;
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const updatedUser = await fetchWithLoading(() => fetchApi<User>(`/users/${userId}`, { // userId here is USN
      method: 'PATCH',
      body: JSON.stringify(updates),
    }));

    if (updatedUser) {
      setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? updatedUser : u))); // userId here is USN
      if (currentUser?.id === userId) { // userId here is USN
        updateAuthCurrentUser(updatedUser); 
      }
      toast({ title: "User Updated", description: `User ${updatedUser.usn} updated.` });
    }
    return updatedUser;
  };

  const deleteTaskAssignmentMetaAndTasks = async (metaId: string): Promise<boolean> => {
    const success = await fetchWithLoading(async () => {
      await fetchApi<void>(`/tasks/assignments/meta/${metaId}`, { method: 'DELETE' });
      return true;
    });

    if (success) {
      setTaskAssignmentsMeta(prev => prev.filter(m => m._id !== metaId)); // Match on _id
      await fetchTasks(); // Refresh tasks as associated tasks are deleted on backend
      toast({ title: "Assignment Deleted", description: `Assignment and its tasks removed.`});
      return true;
    }
    return false;
  };

  const getTasksForCurrentUser = useCallback((): Task[] => {
    return tasks; // Tasks state is already filtered for the current user by fetchTasks
  }, [tasks]);

  const getUsersByFilter = useCallback((role?: User['role'], semester?: User['semester'], usnSearch?: string): User[] => {
    return users.filter(user => {
      const roleMatch = role ? user.role === role : true;
      const semesterMatch = semester ? user.semester === semester : true;
      const usnMatch = usnSearch ? user.usn.toUpperCase().includes(usnSearch.toUpperCase()) : true;
      return roleMatch && semesterMatch && usnMatch;
    });
  }, [users]);

  return (
    <DataContext.Provider value={{ 
      users, 
      tasks,
      taskAssignmentsMeta,
      isLoading,
      fetchTasks,
      fetchUsers,
      fetchTaskAssignmentsMeta,
      addTask, 
      updateTask,
      updateTaskStatus,
      deleteTask,
      deleteUser,
      updateUser,
      getTasksForCurrentUser,
      getUsersByFilter,
      addTaskAssignmentMeta,
      deleteTaskAssignmentMetaAndTasks
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
