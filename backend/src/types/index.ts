import type { ObjectId } from 'mongoose';

export type UserRole = "student" | "admin" | "master-admin";

export type TaskStatus =
  | "To Be Started"
  | "In Progress"
  | "Completed"
  | "Submitted"
  | "Done";

// Base User interface, used by frontend and as a base for Mongoose document
export interface User {
  _id?: ObjectId | string; // MongoDB primary key, optional here for payloads
  id: string; // USN, used as a consistent identifier across systems
  usn: string;
  password?: string; // Hashed password
  role: UserRole;
  semester: string; 
  name?: string; 
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Base Task interface
export interface Task {
  _id?: ObjectId | string; // MongoDB primary key
  id?: string; // Potentially a virtual or a duplicate of _id.toString() if needed by frontend.
                // Backend services will primarily use _id.
  title: string;
  description: string;
  dueDate: string | Date; // ISO string format or Date object
  status: TaskStatus;
  assignedToUsn: string; // Not 'all' in individual tasks
  assignedToSemester: string; 
  assigningAdminUsn: string; 
  submissionFile?: string; 
  taskAssignmentMetaId: ObjectId | string; // Link to the TaskAssignmentMeta _id
  createdAt?: string | Date; // ISO string format or Date
  updatedAt?: string | Date; // ISO string format or Date
}

// Base TaskAssignmentMeta interface
export interface TaskAssignmentMeta {
  _id?: ObjectId | string; // MongoDB primary key
  id?: string; // Similar to Task.id, virtual or duplicate if needed
  title: string;
  description: string;
  dueDate: string | Date;
  assignedToSemester: string;
  assignedToTarget: string; // "all" or specific USN
  assigningAdminUsn: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
