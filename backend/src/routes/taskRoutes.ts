import express from 'express';
import {
    createTask,
    getTasksForUser,
    getTaskById,
    updateTask,
    deleteTask,
    createTaskAssignmentMeta,
    getTaskAssignmentsMetaByAdmin,
    deleteTaskAssignmentMetaAndTasks
} from '@/controllers/taskController';
// import { requireAuth, requireAdmin } from '@/middleware/authMiddleware'; // Example

const router = express.Router();

// --- Task Assignment Meta Routes ---
// TODO: Secure with requireAdmin or similar middleware
router.post('/assignments/meta', createTaskAssignmentMeta);
router.get('/assignments/meta/admin/:adminUsn', getTaskAssignmentsMetaByAdmin);
router.delete('/assignments/meta/:metaId', deleteTaskAssignmentMetaAndTasks);


// --- Task Routes ---
// TODO: Secure with appropriate middleware
router.post('/', createTask); // Creates tasks for users based on criteria (meta or direct)
router.get('/user/:usn', getTasksForUser); // Get tasks for a specific user
router.get('/:taskId', getTaskById);
router.patch('/:taskId', updateTask); // Update task status, submission file etc.
router.delete('/:taskId', deleteTask); // Delete a specific task instance (less common)


export default router;
