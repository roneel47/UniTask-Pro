// Frontend types should ideally mirror backend responses.
// If backend sends _id and a separate id field (e.g. USN for User.id), reflect that.

export type UserRole = "student" | "admin" | "master-admin";

export type TaskStatus =
  | "To Be Started"
  | "In Progress"
  | "Completed"
  | "Submitted"
  | "Done";

export interface User {
  _id?: string; // MongoDB ObjectId as string
  id: string;    // This is the USN, used as the primary key in frontend logic/components
  usn: string;
  password?: string; // Not typically sent to frontend
  role: UserRole;
  semester: string; 
  name?: string; 
  createdAt?: string; 
  updatedAt?: string;
}

export interface Task {
  _id: string; // MongoDB ObjectId as string, now the primary unique ID for a task
  id: string; // This should be the same as _id for tasks, for consistency in dnd draggableId
  title: string;
  description: string;
  dueDate: string; // ISO string format
  status: TaskStatus;
  assignedToUsn: string; 
  assignedToSemester: string; 
  assigningAdminUsn: string; 
  submissionFile?: string; 
  taskAssignmentMetaId: string; // ObjectId as string
  createdAt: string; 
  updatedAt: string; 
}

export interface TaskAssignmentMeta {
  _id: string; // MongoDB ObjectId as string
  id: string;  // This should be the same as _id for meta items
  title: string;
  description: string;
  dueDate: string; // ISO string
  assignedToSemester: string;
  assignedToTarget: string; 
  assigningAdminUsn: string;
  createdAt: string; 
  updatedAt?: string;
}

export const TASK_STATUS_COLUMNS: TaskStatus[] = [
  "To Be Started",
  "In Progress",
  "Completed",
  "Submitted",
  "Done",
];

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "N/A"] as const;
export type Semester = typeof SEMESTERS[number];

export const USER_ROLES_OPTIONS: UserRole[] = ["student", "admin", "master-admin"];
