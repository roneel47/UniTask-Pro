import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '@/controllers/userController';
// import { requireMasterAdmin } from '@/middleware/authMiddleware'; // Example of auth middleware

const router = express.Router();

// TODO: Secure these routes with proper authentication and authorization middleware
// For example, router.get('/', requireMasterAdmin, getUsers);

router.get('/', getUsers);
router.get('/:userId', getUserById);
router.patch('/:userId', updateUser);
router.delete('/:userId', deleteUser);


export default router;
