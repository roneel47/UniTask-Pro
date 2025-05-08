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
  addTask: (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'submissionFile'>) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>; // This might be removed if tasks are deleted via meta
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User | null>;
  getTasksForCurrentUser: () => Task[];
  getUsersByFilter: (role?: User['role'], semester?: User['semester'], usnSearch?: string) => User[];
  addTaskAssignmentMeta: (metaData: Omit<TaskAssignmentMeta, 'id' | 'createdAt'>) => Promise<TaskAssignmentMeta | null>;
  deleteTaskAssignmentMetaAndTasks: (metaId: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUser: updateAuthCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignmentsMeta, setTaskAssignmentsMeta] = useState<TaskAssignmentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Default to false, set true during fetches

  const fetchWithLoading = async <T,>(fetchFn: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await fetchFn();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!currentUser) return;
    await fetchWithLoading(async () => {
      const fetchedTasks = await fetchApi<Task[]>(`/tasks/user/${currentUser.usn}`);
      setTasks(fetchedTasks);
    });
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'master-admin') return;
    await fetchWithLoading(async () => {
      const fetchedUsers = await fetchApi<User[]>('/users');
      setUsers(fetchedUsers);
    });
  }, [currentUser]);

  const fetchTaskAssignmentsMeta = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return; // Only regular admins for now
    await fetchWithLoading(async () => {
        const fetchedMetas = await fetchApi<TaskAssignmentMeta[]>(`/tasks/assignments/meta/admin/${currentUser.usn}`);
        setTaskAssignmentsMeta(fetchedMetas);
    });
  }, [currentUser]);
  
  const addTaskAssignmentMeta = async (metaData: Omit<TaskAssignmentMeta, 'id' | 'createdAt'>): Promise<TaskAssignmentMeta | null> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master-admin')) return null; // Ensure admin rights
    return fetchWithLoading(async () => {
      const newMeta = await fetchApi<TaskAssignmentMeta>('/tasks/assignments/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaData),
      });
      setTaskAssignmentsMeta(prev => [...prev, newMeta]);
      toast({ title: "Task Assignment Created", description: `Assignment "${newMeta.title}" meta entry created.` });
      return newMeta;
    });
  };
  
  // This function now primarily creates the *tasks for users* based on an existing meta or a new one.
  // The meta creation should ideally happen first or be part of this flow if it's a new assignment.
  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'submissionFile'>): Promise<Task | null> => {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'master-admin')) return null;
      // Expect taskData to include taskAssignmentMetaId if linking to an existing meta.
      // The backend /tasks endpoint will handle creating tasks for users based on the meta.
      return fetchWithLoading(async () => {
          const createdTasks = await fetchApi<Task[]>('/tasks', { // Assuming POST /tasks creates tasks for users
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData), 
          });
          // After tasks are created, refresh the current user's task list
          await fetchTasks();
          toast({ title: "Tasks Assigned", description: `Tasks for "${taskData.title}" have been assigned to users.` });
          return createdTasks.length > 0 ? createdTasks[0] : null; // Return one example
      });
  };


  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    return fetchWithLoading(async () => {
      const updatedTask = await fetchApi<Task>(`/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setTasks(prevTasks => prevTasks.map(t => (t.id === taskId ? updatedTask : t)));
      toast({ title: "Task Updated", description: `Task "${updatedTask.title}" updated.` });
      return updatedTask;
    });
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<Task | null> => {
    return updateTask(taskId, { status: newStatus });
  };

  // deleteTask might be deprecated or only used by master-admin directly.
  // Usually, tasks are deleted via deleteTaskAssignmentMetaAndTasks.
  const deleteTask = async (taskId: string): Promise<boolean> => {
    return fetchWithLoading(async () => {
      await fetchApi<void>(`/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      toast({ title: "Task Deleted" });
      return true;
    });
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    return fetchWithLoading(async () => {
      await fetchApi<void>(`/users/${userId}`, { method: 'DELETE' });
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      // Also refetch tasks as this user's tasks are deleted on backend
      await fetchTasks(); 
      toast({ title: "User Deleted" });
      return true;
    });
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
    return fetchWithLoading(async () => {
      const updatedUser = await fetchApi<User>(`/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? updatedUser : u)));
      if (currentUser?.id === userId) {
        updateAuthCurrentUser(updatedUser); // Update current user in AuthContext
      }
      toast({ title: "User Updated", description: `User ${updatedUser.usn} updated.` });
      return updatedUser;
    });
  };

  const deleteTaskAssignmentMetaAndTasks = async (metaId: string): Promise<boolean> => {
    return fetchWithLoading(async () => {
      await fetchApi<void>(`/tasks/assignments/meta/${metaId}`, { method: 'DELETE' });
      setTaskAssignmentsMeta(prev => prev.filter(m => m.id !== metaId));
      // Tasks are deleted on backend, so refresh local task list
      await fetchTasks();
      toast({ title: "Assignment Deleted", description: `Assignment and its tasks removed.`});
      return true;
    });
  };


  const getTasksForCurrentUser = useCallback((): Task[] => {
    if (!currentUser) return [];
    // This now relies on tasks state which is fetched for the current user
    return tasks;
  }, [currentUser, tasks]);


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
