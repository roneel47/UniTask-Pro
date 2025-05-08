import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
// import { v4 as uuidv4 } from 'uuid'; // Not strictly needed if MongoDB handles _id
import { findUserByUsn, addUser, getUsers } from '@/services/dataService';
import type { User, UserRole, Semester } from '@/types';
import { MASTER_ADMIN_USN, MASTER_ADMIN_PASSWORD_PLAIN, MASTER_ADMIN_NAME } from '@/lib/constants';

// Ensure Master Admin exists
const initializeMasterAdmin = async () => {
  try {
    const masterAdminExists = await findUserByUsn(MASTER_ADMIN_USN);
    if (!masterAdminExists) {
      const hashedPassword = await bcrypt.hash(MASTER_ADMIN_PASSWORD_PLAIN, 10);
      const masterAdminData = {
        id: MASTER_ADMIN_USN, // Explicitly setting id to USN for consistency
        usn: MASTER_ADMIN_USN,
        password: hashedPassword,
        role: 'master-admin' as UserRole,
        semester: 'N/A' as Semester,
        name: MASTER_ADMIN_NAME,
      };
      await addUser(masterAdminData);
      console.log('Master admin initialized in MongoDB.');
    }
  } catch (error) {
    console.error("Error initializing master admin:", error);
  }
};

// Call initializeMasterAdmin when the application starts.
// This might be better placed in server.ts after DB connection. For now, here.
// To ensure it runs after DB connection, we can wrap it or call it in server.ts
if (process.env.NODE_ENV !== 'test') { // Avoid running during tests if they mock DB
    initializeMasterAdmin();
}


export const registerUser = async (req: Request, res: Response) => {
  const { usn, password, name, role, semester } = req.body;

  if (!usn || !password || !name || !role || !semester) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (role === 'master-admin') {
    return res.status(403).json({ message: 'Cannot register as Master Admin.' });
  }
  
  const existingUser = await findUserByUsn(usn);
  if (existingUser) {
    return res.status(409).json({ message: 'USN already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserPayload: Omit<User, 'id'> & {id:string} = {
      id: usn.toUpperCase(), // Using USN as ID
      usn: usn.toUpperCase(),
      password: hashedPassword,
      name,
      role: role as UserRole,
      semester: semester as Semester,
    };
    const createdUser = await addUser(newUserPayload);
    res.status(201).json({ message: 'User registered successfully', userId: createdUser.id });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { usn, password } = req.body;

  if (!usn) {
    return res.status(400).json({ message: 'USN is required' });
  }

  const user = await findUserByUsn(usn);
  if (!user) {
    return res.status(401).json({ message: 'Invalid USN or password' });
  }

  if (user.password) {
      if (!password) {
          return res.status(401).json({ message: 'Password is required for this user.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid USN or password' });
      }
  } else {
      if(password && password !== "") {
        return res.status(401).json({message: 'Password not set for this user, but one was provided.'})
      }
  }
  
  const { password: _, ...userWithoutPassword } = user; 
  res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
};
