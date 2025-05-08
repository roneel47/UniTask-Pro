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
  password?: string; // Store hashed in a real app
  role: UserRole;
  semester: string; // '1'-'8' for students, 'N/A' for admins not tied to a semester
  name?: string; // Optional: full name
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string format
  status: TaskStatus;
  assignedToUsn: string | "all"; // Specific USN or 'all' for semester-wide
  assignedToSemester: string; // Semester '1'-'8' or 'N/A'
  assigningAdminUsn: string; // USN of the admin who created the task
  submissionFile?: string; // Path or name of the submitted file
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

// Represents a unique task assignment created by an admin
// Used for the "My Assignments" page for admins
export interface TaskAssignmentMeta {
  id: string; // Unique ID for this assignment instance (e.g., combination of admin USN + task title + timestamp)
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