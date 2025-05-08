import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import { initializeDataFiles } from './services/dataService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize data files (users.json, tasks.json etc.)
initializeDataFiles();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('UniTask Pro Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
