import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import urlRoutes from './routes/url';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// URL-related API and redirect routes
app.use('/api/user', userRoutes);
app.use('/', urlRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 