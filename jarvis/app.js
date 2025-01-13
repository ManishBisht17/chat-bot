import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import aiRouter from './routes/aiRoute.js';

// Create Express app
const app = express();

// Middleware Configuration
app.use(cors());

// Body parser configuration
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});


// Routes
app.use('/ai', aiRouter);

// Health check endpoint

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});




export default app;