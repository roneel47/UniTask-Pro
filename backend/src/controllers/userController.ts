import type { Request, Response } from 'express';
import { 
    getUsers as getAllUsersService, 
    findUserById as findUserByIdService, 
    updateUser as updateUserDataService, 
    deleteUser as deleteUserDataService,
    findUserByUsn
} from '@/services/dataService';
import type { User } from '@/types';
import { MASTER_ADMIN_USN } from '@/lib/constants';
// import mongoose from 'mongoose'; // Not needed directly here if IDs are strings (USNs)

// Placeholder for auth middleware if ever implemented properly
// const isMasterAdmin = (req: Request, res: Response, next: Function) => { next(); };

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersService();
    // Mongoose returns _id, and we use 'id' (USN) as primary.
    // Frontend expects 'id'. If User model has 'id' path, it's fine.
    // .lean() in service returns plain objects, password should be excluded if present.
    const usersWithoutPasswords = users.map(({ password, ...userWithoutPassword }) => userWithoutPassword);
    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  // Assuming userId param is the 'id' (USN) field from User model
  const { userId } = req.params;
  try {
    const user = await findUserByIdService(userId); // findUserByIdService should handle querying by 'id' (USN)
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { userId } = req.params; // This is 'id' (USN)
  const updates = req.body as Partial<User>;

  try {
    const userToUpdate = await findUserByIdService(userId);
    if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found to update.' });
    }

    if (userToUpdate.usn === MASTER_ADMIN_USN && updates.role && updates.role !== 'master-admin') {
        return res.status(403).json({ message: "Cannot change Master Admin's role." });
    }
    // Add logic to prevent user from changing their own role if needed, based on actual acting user from auth.

    if (updates.password) {
      // Password updates should ideally go through a separate, more secure endpoint (e.g., /auth/change-password)
      // For now, if provided, it should be hashed by a dedicated service or here before saving.
      // This example omits password hashing for brevity in this specific update function, assuming it's handled or disallowed.
      delete updates.password; 
      // If password change is allowed here, hash it:
      // if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await updateUserDataService(userId, updates); // updateUser service should query by 'id' (USN)
    if (updatedUser) {
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } else {
      // This case might not be reached if findUserByIdService already checks existence
      res.status(404).json({ message: 'User not found or update failed' });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error updating user." });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { userId } = req.params; // This is 'id' (USN)

  try {
    const userToDelete = await findUserByIdService(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (userToDelete.usn === MASTER_ADMIN_USN) {
      return res.status(403).json({ message: 'Cannot delete Master Admin.' });
    }
    // Add logic to prevent user from deleting themselves, based on actual acting user.

    const success = await deleteUserDataService(userId); // deleteUser service should query by 'id' (USN)
    if (success) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      // This case might not be reached if findUserByIdService already checks existence
      res.status(404).json({ message: 'User not found or delete failed' });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error deleting user." });
  }
};
