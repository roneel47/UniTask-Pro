"use client";

import type { Task, User, TaskStatus, TaskAssignmentMeta } from '@/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { 
  LOCAL_STORAGE_TASKS_KEY, 
  LOCAL_STORAGE_USERS_KEY, 
  LOCAL_STORAGE_TASK_ASSIGNMENTS_META_KEY 
} from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { formatISO } from 'date-fns';

interface DataContextType {
  users: User[];
  tasks: Task[];
  taskAssignmentsMeta: TaskAssignmentMeta[];
  isLoading: boolean;
  fetchTasks: () => void;
  addTask: (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, currentColumnId?: string) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User | null>;
  getTasksForCurrentUser: () => Task[];
  getTasksByAdmin: (adminUsn: string) => Task[];
  getUsersByFilter: (role?: User['role'], semester?: User['semester'], usnSearch?: string) => User[];
  addTaskAssignmentMeta: (meta: Omit<TaskAssignmentMeta, 'id' | 'createdAt'>) => Promise<TaskAssignmentMeta | null>;
  deleteTaskAssignmentMetaAndTasks: (metaId: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [storedUsers, setStoredUsers] = useLocalStorage<User[]>(LOCAL_STORAGE_USERS_KEY, []);
  const [storedTasks, setStoredTasks] = useLocalStorage<Task[]>(LOCAL_STORAGE_TASKS_KEY, []);
  const [storedTaskAssignmentsMeta, setStoredTaskAssignmentsMeta] = useLocalStorage<TaskAssignmentMeta[]>(LOCAL_STORAGE_TASK_ASSIGNMENTS_META_KEY, []);
  
  const [users, setUsers] = useState<User[]>(storedUsers);
  const [tasks, setTasks] = useState<Task[]>(storedTasks);
  const [taskAssignmentsMeta, setTaskAssignmentsMeta] = useState<TaskAssignmentMeta[]>(storedTaskAssignmentsMeta);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => setUsers(storedUsers), [storedUsers]);
  useEffect(() => setTasks(storedTasks), [storedTasks]);
  useEffect(() => setTaskAssignmentsMeta(storedTaskAssignmentsMeta), [storedTaskAssignmentsMeta]);

  const fetchTasks = useCallback(() => {
    setIsLoading(true);
    // Simulating API call delay
    setTimeout(() => {
      // Retroactive task assignment for new/updated students
      if (currentUser && currentUser.role === 'student' && currentUser.semester !== 'N/A') {
        const userTasks = storedTasks.filter(task => task.assignedToUsn === currentUser.usn);
        const semesterWideTasks = storedTasks.filter(
          task => task.assignedToSemester === currentUser.semester && task.assignedToUsn === 'all'
        );
        
        semesterWideTasks.forEach(semesterTask => {
          const userAlreadyHasTask = userTasks.some(ut => ut.title === semesterTask.title && ut.assigningAdminUsn === semesterTask.assigningAdminUsn);
          if (!userAlreadyHasTask) {
            const newTaskForUser: Task = {
              ...semesterTask,
              id: `${currentUser.usn}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Ensure unique ID
              assignedToUsn: currentUser.usn, // Specifically assign to this user
              status: 'To Be Started',
              createdAt: formatISO(new Date()),
              updatedAt: formatISO(new Date()),
            };
            setStoredTasks(prevTasks => [...prevTasks, newTaskForUser]);
          }
        });
      }
      setTasks(storedTasks);
      setIsLoading(false);
    }, 500);
  }, [currentUser, storedTasks, setStoredTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, currentUser]);


  const addTask = async (taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Task | null> => {
    if (!currentUser || currentUser.role === 'student') {
      toast({ title: "Error", description: "Only admins can create tasks.", variant: "destructive" });
      return null;
    }
    
    const newTasks: Task[] = [];
    const now = formatISO(new Date());

    if (taskData.assignedToUsn === 'all') {
      // Assign to all users in the specified semester
      const targetUsers = storedUsers.filter(u => u.semester === taskData.assignedToSemester && u.role === 'student');
      targetUsers.forEach(user => {
        newTasks.push({
          ...taskData,
          id: `${user.usn}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          status: 'To Be Started',
          assignedToUsn: user.usn, // Assign specifically to this user
          createdAt: now,
          updatedAt: now,
        });
      });
      // Also add a generic 'all' task for future users in that semester (or if no users currently)
       newTasks.push({
        ...taskData,
        id: `all-${taskData.assignedToSemester}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        status: 'To Be Started',
        assignedToUsn: 'all', // Keep the 'all' marker for this generic task
        createdAt: now,
        updatedAt: now,
      });

    } else {
      // Assign to a specific user
      const targetUser = storedUsers.find(u => u.usn === taskData.assignedToUsn);
      if (!targetUser) {
        toast({ title: "Error", description: `User ${taskData.assignedToUsn} not found.`, variant: "destructive" });
        return null;
      }
      newTasks.push({
        ...taskData,
        id: `${targetUser.usn}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        status: 'To Be Started',
        createdAt: now,
        updatedAt: now,
      });
    }
    
    setStoredTasks(prevTasks => [...prevTasks, ...newTasks]);
    toast({ title: "Task Created", description: `Task "${taskData.title}" assigned.` });
    return newTasks[0]; // Return the first created task as a sample
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    let updatedTask: Task | null = null;
    setStoredTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          updatedTask = { ...task, ...updates, updatedAt: formatISO(new Date()) };
          return updatedTask;
        }
        return task;
      })
    );
    if (updatedTask) toast({ title: "Task Updated", description: `Task "${updatedTask.title}" has been updated.` });
    return updatedTask;
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<Task | null> => {
    return updateTask(taskId, { status: newStatus });
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    const taskToDelete = storedTasks.find(t => t.id === taskId);
    setStoredTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" removed.` });
    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (currentUser?.usn === userId || userId === MASTER_ADMIN_USN) {
      toast({ title: "Error", description: "Cannot delete self or Master Admin.", variant: "destructive" });
      return false;
    }
    const userToDelete = storedUsers.find(u => u.id === userId);
    setStoredUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    // Also delete tasks assigned TO this user
    setStoredTasks(prevTasks => prevTasks.filter(task => task.assignedToUsn !== userId));
    // Also delete tasks assigned BY this user if they were an admin
    if (userToDelete?.role !== 'student') {
      setStoredTasks(prevTasks => prevTasks.filter(task => task.assigningAdminUsn !== userId));
      setStoredTaskAssignmentsMeta(prevMeta => prevMeta.filter(meta => meta.assigningAdminUsn !== userId));
    }
    if (userToDelete) toast({ title: "User Deleted", description: `User ${userToDelete.usn} and their tasks removed.` });
    return true;
  };
  
  const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
    let updatedUser: User | null = null;
    setStoredUsers(prevUsers =>
      prevUsers.map(user => {
        if (user.id === userId) {
          updatedUser = { ...user, ...updates };
          // If role changed from admin to student, ensure semester is set (e.g., to '1' or a default)
          if (user.role !== 'student' && updatedUser.role === 'student' && updatedUser.semester === 'N/A') {
            updatedUser.semester = '1'; 
          }
          // If role changed from student to admin, set semester to N/A
          if (user.role === 'student' && updatedUser.role !== 'student') {
            updatedUser.semester = 'N/A';
          }
          return updatedUser;
        }
        return user;
      })
    );
    if (updatedUser) {
        toast({ title: "User Updated", description: `User ${updatedUser.usn} details updated.` });
        if(currentUser?.id === updatedUser.id) { // if current user is updated
            const { updateCurrentUser } = useAuth();
            updateCurrentUser(updatedUser);
        }
    }
    return updatedUser;
  };


  const getTasksForCurrentUser = useCallback((): Task[] => {
    if (!currentUser) return [];
    return tasks.filter(task => task.assignedToUsn === currentUser.usn);
  }, [currentUser, tasks]);

  const getTasksByAdmin = useCallback((adminUsn: string): Task[] => {
    return tasks.filter(task => task.assigningAdminUsn === adminUsn);
  }, [tasks]);

  const getUsersByFilter = useCallback((role?: User['role'], semester?: User['semester'], usnSearch?: string): User[] => {
    return users.filter(user => {
      const roleMatch = role ? user.role === role : true;
      const semesterMatch = semester ? user.semester === semester : true;
      const usnMatch = usnSearch ? user.usn.toUpperCase().includes(usnSearch.toUpperCase()) : true;
      return roleMatch && semesterMatch && usnMatch;
    });
  }, [users]);

  const addTaskAssignmentMeta = async (metaData: Omit<TaskAssignmentMeta, 'id' | 'createdAt'>): Promise<TaskAssignmentMeta | null> => {
    const newMeta: TaskAssignmentMeta = {
      ...metaData,
      id: `${metaData.assigningAdminUsn}-${metaData.title}-${Date.now()}`,
      createdAt: formatISO(new Date()),
    };
    setStoredTaskAssignmentsMeta(prevMeta => [...prevMeta, newMeta]);
    return newMeta;
  };

  const deleteTaskAssignmentMetaAndTasks = async (metaId: string): Promise<boolean> => {
    const metaToDelete = storedTaskAssignmentsMeta.find(m => m.id === metaId);
    if (!metaToDelete) return false;

    // Delete all tasks associated with this meta assignment
    // This needs careful matching logic based on how tasks are created from meta
    // Assuming tasks are linked by title, assigningAdminUsn, assignedToSemester, and assignedToTarget (original target)
    setStoredTasks(prevTasks => prevTasks.filter(task => 
      !(task.title === metaToDelete.title &&
        task.assigningAdminUsn === metaToDelete.assigningAdminUsn &&
        task.assignedToSemester === metaToDelete.assignedToSemester &&
        // This check is tricky if individual tasks were created.
        // For simplicity, if it was an 'all' assignment, delete all specific tasks for that semester from that admin.
        // If it was a specific USN assignment, this meta might represent that one task series.
        // This part might need refinement based on exact creation logic.
        (metaToDelete.assignedToTarget === 'all' ? true : task.assignedToUsn === metaToDelete.assignedToTarget) 
      )
    ));
    
    setStoredTaskAssignmentsMeta(prevMeta => prevMeta.filter(m => m.id !== metaId));
    toast({ title: "Assignment Deleted", description: `Assignment "${metaToDelete.title}" and its tasks removed.`});
    return true;
  };


  return (
    <DataContext.Provider value={{ 
      users, 
      tasks,
      taskAssignmentsMeta,
      isLoading,
      fetchTasks,
      addTask, 
      updateTask,
      updateTaskStatus,
      deleteTask,
      deleteUser,
      updateUser,
      getTasksForCurrentUser,
      getTasksByAdmin,
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