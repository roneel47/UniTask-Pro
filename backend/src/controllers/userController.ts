import type { Request, Response } from 'express';
import { getUsers as getAllUsers, findUserById, updateUser as updateUserData, deleteUser as deleteUserData, findUserByUsn } from '@/services/dataService';
import type { User } from '@/types';
import { MASTER_ADMIN_USN } from '@/lib/constants';

// Middleware to check if current user is Master Admin (example, needs actual auth implementation)
// For now, this is a placeholder. In a real app, use JWT or session-based auth.
const isMasterAdmin = (req: Request, res: Response, next: Function) => {
  // This is a mock authentication check. Replace with real authentication.
  // const actingUserUsn = req.headers['x-user-usn'] as string; 
  // const actingUser = findUserByUsn(actingUserUsn);
  // if (actingUser && actingUser.role === 'master-admin') {
  //   next();
  // } else {
  //   res.status(403).json({ message: 'Forbidden: Master Admin access required.' });
  // }
  // For now, allow all for easier testing of CRUD, but secure this in production!
  next(); 
};


export const getUsers = (req: Request, res: Response) => {
  // TODO: Add proper authentication and authorization check here
  // For now, assuming only master admin calls this as per frontend logic
  const users = getAllUsers().map(({ password, ...userWithoutPassword }) => userWithoutPassword);
  res.status(200).json(users);
};

export const getUserById = (req: Request, res: Response) => {
  const user = findUserById(req.params.userId);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const updateUser = (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body as Partial<User>;

  // Prevent changing Master Admin's role or own role if not allowed
  const userToUpdate = findUserById(userId);
  if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found to update.' });
  }

  // Example: Mock acting user (replace with actual auth)
  // const actingUserUsn = req.headers['x-user-usn'] as string || MASTER_ADMIN_USN; 
  // if ((userId === actingUserUsn || userToUpdate.usn === MASTER_ADMIN_USN) && updates.role && updates.role !== userToUpdate.role) {
  //     if (userToUpdate.usn === MASTER_ADMIN_USN && updates.role !== 'master-admin') {
  //       return res.status(403).json({ message: "Cannot change Master Admin's role." });
  //     }
  //     // if (userId === actingUserUsn) { // Disallow changing own role
  //     //  return res.status(403).json({ message: "Cannot change your own role."});
  //     // }
  // }
  
  // Prevent changing password through this endpoint if 'password' field is present.
  // Password changes should go through a dedicated endpoint or auth flow.
  if (updates.password) {
    delete updates.password; 
  }

  const updatedUser = updateUserData(userId, updates);
  if (updatedUser) {
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found or update failed' });
  }
};

export const deleteUser = (req: Request, res: Response) => {
  const { userId } = req.params;
   const userToDelete = findUserById(userId);

  if (!userToDelete) {
    return res.status(404).json({ message: 'User not found.' });
  }
  if (userToDelete.usn === MASTER_ADMIN_USN) {
    return res.status(403).json({ message: 'Cannot delete Master Admin.' });
  }
  // Example: Mock acting user
  // const actingUserUsn = req.headers['x-user-usn'] as string || MASTER_ADMIN_USN;
  // if (userId === actingUserUsn) {
  //   return res.status(403).json({ message: 'Cannot delete yourself.' });
  // }

  const success = deleteUserData(userId);
  if (success) {
    res.status(200).json({ message: 'User deleted successfully' });
  } else {
    res.status(404).json({ message: 'User not found or delete failed' });
  }
};


// Attach middleware for routes that need it
// Example: router.get('/', isMasterAdmin, getUsers);
// For simplicity, middleware isn't attached directly in this controller file
// but should be done in the userRoutes.ts file.
