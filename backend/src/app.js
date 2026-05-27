import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
