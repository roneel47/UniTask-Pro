import type { Request, Response } from 'express';
import { 
    getTasks as getAllTasksService,
    getTasksByAssignedUsn,
    findTaskById as findTaskByIdService, 
    addTasks as addTasksToDataService,
    updateTask as updateTaskDataService, 
    deleteTask as deleteTaskDataService,
    getTaskAssignmentsMetaByAdmin as getTaskAssignmentsMetaByAdminService,
    findTaskAssignmentMetaById as findTaskAssignmentMetaByIdService,
    addTaskAssignmentMeta as addTaskAssignmentMetaDataService,
    deleteTaskAssignmentMeta as deleteTaskAssignmentMetaDataService,
    getUsers as getUsersService,
    getTasksByMetaId as getTasksByMetaIdService
} from '@/services/dataService';
import type { Task, TaskAssignmentMeta, User } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // Still useful for frontend if expecting string IDs not ObjectIds for some cases
import mongoose from 'mongoose';


// --- Task Assignment Meta Controllers ---

export const createTaskAssignmentMeta = async (req: Request, res: Response) => {
    const { title, description, dueDate, assignedToSemester, assignedToTarget, assigningAdminUsn } = req.body;

    if (!title || !description || !dueDate || !assignedToSemester || !assignedToTarget || !assigningAdminUsn) {
        return res.status(400).json({ message: 'Missing required fields for task assignment meta.' });
    }
    // TODO: Validate assigningAdminUsn is a valid admin from DB

    const newMetaPayload = {
        title,
        description,
        dueDate: new Date(dueDate), // Ensure it's a Date object for MongoDB
        assignedToSemester,
        assignedToTarget,
        assigningAdminUsn,
    };
    try {
        const createdMeta = await addTaskAssignmentMetaDataService(newMetaPayload);
        res.status(201).json(createdMeta);
    } catch (error) {
        console.error("Error creating task assignment meta:", error);
        res.status(500).json({ message: "Server error while creating task assignment meta." });
    }
};

export const getTaskAssignmentsMetaByAdmin = async (req: Request, res: Response) => {
    const { adminUsn } = req.params;
    try {
        const metas = await getTaskAssignmentsMetaByAdminService(adminUsn);
        res.status(200).json(metas);
    } catch (error) {
        console.error("Error fetching task assignments meta:", error);
        res.status(500).json({ message: "Server error while fetching task assignments." });
    }
};

export const deleteTaskAssignmentMetaAndTasks = async (req: Request, res: Response) => {
    const { metaId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(metaId)) {
        return res.status(400).json({ message: 'Invalid meta ID format.' });
    }
    try {
        const success = await deleteTaskAssignmentMetaDataService(metaId);
        if (success) {
            res.status(200).json({ message: 'Task assignment meta and associated tasks deleted.' });
        } else {
            res.status(404).json({ message: 'Task assignment meta not found.' });
        }
    } catch (error) {
        console.error("Error deleting task assignment meta:", error);
        res.status(500).json({ message: "Server error while deleting task assignment." });
    }
};


// --- Task Controllers ---

export const createTask = async (req: Request, res: Response) => {
    const { title, description, dueDate, assignedToSemester, assignedToUsn, assigningAdminUsn, taskAssignmentMetaId } = req.body;
    
    if (!title || !description || !dueDate || !assignedToSemester || !assigningAdminUsn || !taskAssignmentMetaId) {
        return res.status(400).json({ message: 'Missing required fields for task.' });
    }
    if (!mongoose.Types.ObjectId.isValid(taskAssignmentMetaId)) {
        return res.status(400).json({ message: 'Invalid task assignment meta ID format.' });
    }

    try {
        const allUsers = await getUsersService();
        const tasksToCreate: Omit<Task, 'id' | '_id' | 'createdAt' | 'updatedAt'>[] = []; // Prepare data for Mongoose
        const now = new Date();

        const metaExists = await findTaskAssignmentMetaByIdService(taskAssignmentMetaId);
        if (!metaExists) {
            return res.status(404).json({ message: `Task Assignment Meta with ID ${taskAssignmentMetaId} not found.`})
        }

        if (assignedToUsn === 'all') {
            const targetUsers = allUsers.filter(u => u.semester === assignedToSemester && u.role === 'student');
            targetUsers.forEach(user => {
                tasksToCreate.push({
                    title,
                    description,
                    dueDate: new Date(dueDate),
                    status: 'To Be Started',
                    assignedToUsn: user.usn,
                    assignedToSemester,
                    assigningAdminUsn,
                    taskAssignmentMetaId, // This will be ObjectId
                });
            });
        } else {
            const targetUser = allUsers.find(u => u.usn.toUpperCase() === assignedToUsn.toUpperCase() && u.semester === assignedToSemester);
            if (targetUser) {
                tasksToCreate.push({
                    title,
                    description,
                    dueDate: new Date(dueDate),
                    status: 'To Be Started',
                    assignedToUsn: targetUser.usn,
                    assignedToSemester,
                    assigningAdminUsn,
                    taskAssignmentMetaId,
                });
            } else {
                return res.status(404).json({ message: `User ${assignedToUsn} in semester ${assignedToSemester} not found.` });
            }
        }
        
        if (tasksToCreate.length > 0) {
            const createdTasks = await addTasksToDataService(tasksToCreate as Task[]); // Cast because Mongoose will add id, _id etc.
            res.status(201).json(createdTasks);
        } else {
            res.status(200).json({ message: "No matching users found to assign tasks to.", tasks: [] });
        }
    } catch (error) {
        console.error("Error creating tasks:", error);
        res.status(500).json({ message: "Server error while creating tasks." });
    }
};


export const getTasksForUser = async (req: Request, res: Response) => {
    const { usn } = req.params;
    try {
        const userTasks = await getTasksByAssignedUsn(usn);
        res.status(200).json(userTasks);
    } catch (error) {
        console.error("Error fetching tasks for user:", error);
        res.status(500).json({ message: "Server error fetching user tasks." });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }
    try {
        const task = await findTaskByIdService(taskId);
        if (task) {
            res.status(200).json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error("Error fetching task by ID:", error);
        res.status(500).json({ message: "Server error fetching task." });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }
    const updates = req.body as Partial<Task>;
    
    delete updates.id; // MongoDB _id is immutable, frontend might send 'id'
    delete (updates as any)._id; // Ensure _id is not in updates
    delete updates.createdAt;
    // Fields like assigningAdminUsn, assignedToSemester, taskAssignmentMetaId typically shouldn't be changed here.

    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate) as any; // Ensure Date type for MongoDB

    try {
        const updatedTask = await updateTaskDataService(taskId, updates);
        if (updatedTask) {
            res.status(200).json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found or update failed' });
        }
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Server error updating task." });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }
    try {
        const success = await deleteTaskDataService(taskId);
        if (success) {
            res.status(200).json({ message: 'Task deleted successfully' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Server error deleting task." });
    }
};
