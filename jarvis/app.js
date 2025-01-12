import dotenv from 'dotenv';
import express from 'express';
import aiRouter from  './routes/aiRoute.js';
import cors from 'cors';

const app = express();
app.use(cors());


dotenv.config();


app.use(express.json());

app.use('/ai' ,aiRouter)

export default app;

