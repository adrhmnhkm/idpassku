import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './modules/auth/auth.routes';
import { vaultRouter } from './modules/vault/vault.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost and chrome extensions
    if (origin.startsWith('http://localhost') || origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/vault', vaultRouter);

export default app;
