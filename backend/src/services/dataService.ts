import fs from 'fs';
import path from 'path';
import type { User, Task, TaskAssignmentMeta } from '@/types';
import { USERS_DATA_PATH, TASKS_DATA_PATH, TASK_ASSIGNMENTS_META_DATA_PATH } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

const dataDir = path.dirname(USERS_DATA_PATH);

export const initializeDataFiles = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(USERS_DATA_PATH)) {
    fs.writeFileSync(USERS_DATA_PATH, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(TASKS_DATA_PATH)) {
    fs.writeFileSync(TASKS_DATA_PATH, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(TASK_ASSIGNMENTS_META_DATA_PATH)) {
    fs.writeFileSync(TASK_ASSIGNMENTS_META_DATA_PATH, JSON.stringify([], null, 2));
  }
};


// Generic read and write functions
const readData = <T>(filePath: string): T[] => {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData) as T[];
  } catch (error) {
    console.error(`Error reading data from ${filePath}:`, error);
    return [];
  }
};

const writeData = <T>(filePath: string, data: T[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing data to ${filePath}:`, error);
  }
};

// User functions
export const getUsers = (): User[] => readData<User>(USERS_DATA_PATH);
export const saveUsers = (users: User[]): void => writeData<User>(USERS_DATA_PATH, users);
export const findUserByUsn = (usn: string): User | undefined => getUsers().find(u => u.usn.toUpperCase() === usn.toUpperCase());
export const findUserById = (id: string): User | undefined => getUsers().find(u => u.id === id);
export const addUser = (user: User): User => {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
};
export const updateUser = (id: string, updates: Partial<User>): User | null => {
  let users = getUsers();
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) return null;
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  return users[userIndex];
};
export const deleteUser = (id: string): boolean => {
  let users = getUsers();
  const initialLength = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length < initialLength) {
    saveUsers(users);
    // Also delete tasks assigned TO this user and BY this user if admin
    const userToDelete = getUsers().find(u => u.id === id); // Get user details before deletion
    let tasks = getTasks();
    tasks = tasks.filter(task => task.assignedToUsn !== id);
    if (userToDelete && userToDelete.role !== 'student') {
        tasks = tasks.filter(task => task.assigningAdminUsn !== id);
        let metas = getTaskAssignmentsMeta();
        metas = metas.filter(meta => meta.assigningAdminUsn !== id);
        saveTaskAssignmentsMeta(metas);
    }
    saveTasks(tasks);
    return true;
  }
  return false;
};

// Task functions
export const getTasks = (): Task[] => readData<Task>(TASKS_DATA_PATH);
export const saveTasks = (tasks: Task[]): void => writeData<Task>(TASKS_DATA_PATH, tasks);
export const findTaskById = (id: string): Task | undefined => getTasks().find(t => t.id === id);
export const addTasks = (newTasks: Task[]): Task[] => {
  const tasks = getTasks();
  tasks.push(...newTasks);
  saveTasks(tasks);
  return newTasks;
};
export const updateTask = (id: string, updates: Partial<Task>): Task | null => {
  let tasks = getTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return null;
  tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[taskIndex];
};
export const deleteTask = (id: string): boolean => {
  let tasks = getTasks();
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  if (tasks.length < initialLength) {
    saveTasks(tasks);
    return true;
  }
  return false;
};
export const getTasksByMetaId = (metaId: string): Task[] => {
    return getTasks().filter(task => task.taskAssignmentMetaId === metaId);
};


// TaskAssignmentMeta functions
export const getTaskAssignmentsMeta = (): TaskAssignmentMeta[] => readData<TaskAssignmentMeta>(TASK_ASSIGNMENTS_META_DATA_PATH);
export const saveTaskAssignmentsMeta = (metas: TaskAssignmentMeta[]): void => writeData<TaskAssignmentMeta>(TASK_ASSIGNMENTS_META_DATA_PATH, metas);
export const findTaskAssignmentMetaById = (id: string): TaskAssignmentMeta | undefined => getTaskAssignmentsMeta().find(m => m.id === id);
export const addTaskAssignmentMeta = (meta: TaskAssignmentMeta): TaskAssignmentMeta => {
  const metas = getTaskAssignmentsMeta();
  metas.push(meta);
  saveTaskAssignmentsMeta(metas);
  return meta;
};
export const deleteTaskAssignmentMeta = (id: string): boolean => {
  let metas = getTaskAssignmentsMeta();
  const initialLength = metas.length;
  metas = metas.filter(m => m.id !== id);
  if (metas.length < initialLength) {
    saveTaskAssignmentsMeta(metas);
    // Also delete associated tasks
    let tasks = getTasks();
    tasks = tasks.filter(task => task.taskAssignmentMetaId !== id);
    saveTasks(tasks);
    return true;
  }
  return false;
};
