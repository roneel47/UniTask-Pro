import mongoose from 'mongoose';
import type { Task as TaskType, TaskStatus } from '@/types';
import { TASK_STATUS_COLUMNS } from '@/types';

export interface ITaskDocument extends TaskType, mongoose.Document {}

const taskSchema = new mongoose.Schema<ITaskDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: TASK_STATUS_COLUMNS, required: true, default: 'To Be Started' },
  assignedToUsn: { type: String, required: true, index: true }, 
  assignedToSemester: { type: String, required: true, index: true },
  assigningAdminUsn: { type: String, required: true, index: true },
  submissionFile: { type: String },
  taskAssignmentMetaId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskAssignmentMeta', index: true },
}, { timestamps: true });

const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
export default Task;
