import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { listItemsHandler, createItemHandler, updateItemHandler, deleteItemHandler } from './vault.controller';

export const vaultRouter = Router();

vaultRouter.use(requireAuth);

vaultRouter.get('/items', listItemsHandler);
vaultRouter.post('/items', createItemHandler);
vaultRouter.put('/items/:id', updateItemHandler);
vaultRouter.delete('/items/:id', deleteItemHandler);
