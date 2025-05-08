import type { Request, Response } from 'express';
import { 
    getTasks as getAllTasks, 
    findTaskById, 
    addTasks as addTasksToData,
    updateTask as updateTaskData, 
    deleteTask as deleteTaskData,
    getTaskAssignmentsMeta as getAllTaskAssignmentsMeta,
    findTaskAssignmentMetaById,
    addTaskAssignmentMeta as addTaskAssignmentMetaData,
    deleteTaskAssignmentMeta as deleteTaskAssignmentMetaDataService,
    getUsers,
    getTasksByMetaId
} from '@/services/dataService';
import type { Task, TaskAssignmentMeta, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// --- Task Assignment Meta Controllers ---

export const createTaskAssignmentMeta = (req: Request, res: Response) => {
    const { title, description, dueDate, assignedToSemester, assignedToTarget, assigningAdminUsn } = req.body;

    if (!title || !description || !dueDate || !assignedToSemester || !assignedToTarget || !assigningAdminUsn) {
        return res.status(400).json({ message: 'Missing required fields for task assignment meta.' });
    }
    // TODO: Validate assigningAdminUsn is a valid admin

    const newMeta: TaskAssignmentMeta = {
        id: uuidv4(),
        title,
        description,
        dueDate, // Expecting ISO string
        assignedToSemester,
        assignedToTarget, // 'all' or specific USN
        assigningAdminUsn,
        createdAt: new Date().toISOString(),
    };
    addTaskAssignmentMetaData(newMeta);
    res.status(201).json(newMeta);
};

export const getTaskAssignmentsMetaByAdmin = (req: Request, res: Response) => {
    const { adminUsn } = req.params;
    // TODO: Validate adminUsn belongs to the authenticated user if not master-admin
    const metas = getAllTaskAssignmentsMeta().filter(meta => meta.assigningAdminUsn === adminUsn);
    res.status(200).json(metas);
};

export const deleteTaskAssignmentMetaAndTasks = (req: Request, res: Response) => {
    const { metaId } = req.params;
    // TODO: Add authorization check (only admin who created it or master-admin)
    const success = deleteTaskAssignmentMetaDataService(metaId); // This service fn should also delete linked tasks
    if (success) {
        res.status(200).json({ message: 'Task assignment meta and associated tasks deleted.' });
    } else {
        res.status(404).json({ message: 'Task assignment meta not found.' });
    }
};


// --- Task Controllers ---

export const createTask = async (req: Request, res: Response) => {
    const { title, description, dueDate, assignedToSemester, assignedToUsn, assigningAdminUsn, taskAssignmentMetaId } = req.body;
    
    if (!title || !description || !dueDate || !assignedToSemester || !assigningAdminUsn || !taskAssignmentMetaId) {
        return res.status(400).json({ message: 'Missing required fields for task.' });
    }
    
    // TODO: Validate assigningAdminUsn is a valid admin (and matches authenticated user if applicable)
    // TODO: Validate taskAssignmentMetaId exists

    const allUsers = getUsers();
    const tasksToCreate: Task[] = [];
    const now = new Date().toISOString();

    if (assignedToUsn === 'all') {
        const targetUsers = allUsers.filter(u => u.semester === assignedToSemester && u.role === 'student');
        targetUsers.forEach(user => {
            tasksToCreate.push({
                id: uuidv4(),
                title,
                description,
                dueDate,
                status: 'To Be Started',
                assignedToUsn: user.usn,
                assignedToSemester,
                assigningAdminUsn,
                taskAssignmentMetaId,
                createdAt: now,
                updatedAt: now,
            });
        });
        // Also create a generic 'all' task template if needed by system design
        // For now, focusing on individual assignments from 'all' meta
    } else {
        const targetUser = allUsers.find(u => u.usn.toUpperCase() === assignedToUsn.toUpperCase() && u.semester === assignedToSemester);
        if (targetUser) {
            tasksToCreate.push({
                id: uuidv4(),
                title,
                description,
                dueDate,
                status: 'To Be Started',
                assignedToUsn: targetUser.usn,
                assignedToSemester,
                assigningAdminUsn,
                taskAssignmentMetaId,
                createdAt: now,
                updatedAt: now,
            });
        } else {
            return res.status(404).json({ message: `User ${assignedToUsn} in semester ${assignedToSemester} not found.` });
        }
    }
    
    if (tasksToCreate.length > 0) {
        addTasksToData(tasksToCreate);
        res.status(201).json(tasksToCreate);
    } else {
        // This case might occur if "all" was selected but no matching students were found for that semester
        res.status(200).json({ message: "No matching users found to assign tasks to for the given criteria.", tasks: [] });
    }
};


export const getTasksForUser = (req: Request, res: Response) => {
    const { usn } = req.params;
    // TODO: Authorization: User can only get their own tasks, or admin can get any.
    const userTasks = getAllTasks().filter(task => task.assignedToUsn.toUpperCase() === usn.toUpperCase());
    // Also include tasks assigned to 'all' for the user's semester that might not have been individualized yet
    // This depends on backend strategy: either individualize all 'all' tasks upon creation,
    // or dynamically combine them here. Current frontend context suggests individualization.
    res.status(200).json(userTasks);
};

export const getTaskById = (req: Request, res: Response) => {
    const task = findTaskById(req.params.taskId);
    if (task) {
        // TODO: Authorization check
        res.status(200).json(task);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

export const updateTask = (req: Request, res: Response) => {
    const { taskId } = req.params;
    const updates = req.body as Partial<Task>;
    // TODO: Authorization check (e.g., student can only update status to 'In Progress'/'Completed' or submit file)
    // Admin can update more fields or status to 'Done'.
    
    // Prevent direct update of certain fields by client if necessary
    delete updates.id;
    delete updates.createdAt;
    delete updates.assigningAdminUsn;
    delete updates.assignedToSemester; 
    // assignedToUsn probably shouldn't be changed either after creation

    const updatedTask = updateTaskData(taskId, updates);
    if (updatedTask) {
        res.status(200).json(updatedTask);
    } else {
        res.status(404).json({ message: 'Task not found or update failed' });
    }
};

export const deleteTask = (req: Request, res: Response) => {
    const { taskId } = req.params;
    // TODO: Authorization (e.g., only master-admin or admin who created it via meta)
    // Usually tasks are deleted when their parent TaskAssignmentMeta is deleted.
    const success = deleteTaskData(taskId);
    if (success) {
        res.status(200).json({ message: 'Task deleted successfully' });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};
