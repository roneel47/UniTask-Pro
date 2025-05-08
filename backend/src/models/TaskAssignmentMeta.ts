import mongoose from 'mongoose';
import type { TaskAssignmentMeta as TaskAssignmentMetaType } from '@/types';

export interface ITaskAssignmentMetaDocument extends TaskAssignmentMetaType, mongoose.Document {}

const taskAssignmentMetaSchema = new mongoose.Schema<ITaskAssignmentMetaDocument>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  assignedToSemester: { type: String, required: true },
  assignedToTarget: { type: String, required: true }, // "all" or specific USN
  assigningAdminUsn: { type: String, required: true, index: true },
}, { timestamps: true });

const TaskAssignmentMeta = mongoose.model<ITaskAssignmentMetaDocument>('TaskAssignmentMeta', taskAssignmentMetaSchema);
export default TaskAssignmentMeta;
