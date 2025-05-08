import mongoose from 'mongoose';
import type { User as UserType, UserRole, Semester } from '@/types';
import { SEMESTERS, USER_ROLES_OPTIONS } from '@/types';

export interface IUserDocument extends UserType, mongoose.Document {
  id: string; // Overriding Mongoose _id is possible but tricky, using `id` as a virtual or separate field
}

const userSchema = new mongoose.Schema<IUserDocument>({
  id: { type: String, required: true, unique: true, index: true }, // USN, used as primary identifier
  usn: { type: String, required: true, unique: true, uppercase: true, index: true },
  password: { type: String }, // Hashed
  name: { type: String },
  role: { type: String, enum: USER_ROLES_OPTIONS, required: true },
  semester: { type: String, enum: SEMESTERS, required: true },
}, { 
  timestamps: true, // Adds createdAt and updatedAt
  // Mongoose typically uses _id. If 'id' is crucial for frontend/logic, ensure it's set.
  // Here, we're defining `id` as a path in the schema.
});

// Ensure `id` is set to `usn` if not provided, for consistency with previous system.
// This might be better handled in the service layer during user creation.
// userSchema.pre('save', function(next) {
//   if (!this.id) {
//     this.id = this.usn;
//   }
//   next();
// });

const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;
