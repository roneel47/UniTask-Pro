export type UserRole = "student" | "admin" | "master-admin";

export type TaskStatus =
  | "To Be Started"
  | "In Progress"
  | "Completed"
  | "Submitted"
  | "Done";

export interface User {
  id: string; // USN
  usn: string;
  password?: string; // Hashed password
  role: UserRole;
  semester: string; 
  name?: string; 
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string format
  status: TaskStatus;
  assignedToUsn: string | "all"; 
  assignedToSemester: string; 
  assigningAdminUsn: string; 
  submissionFile?: string; 
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
  taskAssignmentMetaId?: string; // Link to the TaskAssignmentMeta
}

export interface TaskAssignmentMeta {
  id: string; 
  title: string;
  description: string;
  dueDate: string;
  assignedToSemester: string;
  assignedToTarget: string; // "all" or specific USN
  assigningAdminUsn: string;
  createdAt: string;
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
