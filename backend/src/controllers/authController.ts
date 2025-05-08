import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { findUserByUsn, addUser, saveUsers, getUsers } from '@/services/dataService';
import type { User, UserRole, Semester } from '@/types';
import { MASTER_ADMIN_USN, MASTER_ADMIN_PASSWORD_PLAIN, MASTER_ADMIN_NAME } from '@/lib/constants';

// Ensure Master Admin exists
const initializeMasterAdmin = async () => {
  const users = getUsers();
  const masterAdminExists = users.some(user => user.usn === MASTER_ADMIN_USN);
  if (!masterAdminExists) {
    const hashedPassword = await bcrypt.hash(MASTER_ADMIN_PASSWORD_PLAIN, 10);
    const masterAdmin: User = {
      id: MASTER_ADMIN_USN, // Use USN as ID for simplicity here
      usn: MASTER_ADMIN_USN,
      password: hashedPassword,
      role: 'master-admin',
      semester: 'N/A',
      name: MASTER_ADMIN_NAME,
    };
    addUser(masterAdmin);
    console.log('Master admin initialized.');
  }
};
initializeMasterAdmin();


export const registerUser = async (req: Request, res: Response) => {
  const { usn, password, name, role, semester } = req.body;

  if (!usn || !password || !name || !role || !semester) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (role === 'master-admin') {
    return res.status(403).json({ message: 'Cannot register as Master Admin.' });
  }
  
  const existingUser = findUserByUsn(usn);
  if (existingUser) {
    return res.status(409).json({ message: 'USN already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: usn.toUpperCase(), // Using USN as ID
      usn: usn.toUpperCase(),
      password: hashedPassword,
      name,
      role: role as UserRole,
      semester: semester as Semester,
    };
    addUser(newUser);
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { usn, password } = req.body;

  if (!usn) { // Password can be optional as per original frontend logic
    return res.status(400).json({ message: 'USN is required' });
  }

  const user = findUserByUsn(usn);
  if (!user) {
    return res.status(401).json({ message: 'Invalid USN or password' });
  }

  // If user has a password, validate it. Otherwise, allow login if password field was empty.
  if (user.password) {
      if (!password) {
          return res.status(401).json({ message: 'Password is required for this user.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid USN or password' });
      }
  } else {
      // User has no password set. Allow login if provided password was also empty/undefined.
      // Or, if original logic allowed login with any password if user.password is not set.
      // For stricter security: if user.password is undefined, it means it was never set,
      // so they can't login until an admin sets one, or if system allows passwordless for certain roles.
      // Given the prompt's previous logic, we allow login if user has no password and no password was provided.
      if(password && password !== "") { // If user has no password, but one was provided
        return res.status(401).json({message: 'Password not set for this user, but one was provided.'})
      }
  }
  
  // Return user data without password
  const { password: _, ...userWithoutPassword } = user; 
  res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
};
