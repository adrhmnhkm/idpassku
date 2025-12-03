import { Response } from 'express';
import { prisma } from '../../utils/prisma';
import { AuthRequest } from '../../middlewares/auth';

export async function listItemsHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const items = await prisma.vaultItem.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json({ items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createItemHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { name, username, ciphertext } = req.body;

    if (!ciphertext) {
      return res.status(400).json({ message: 'ciphertext is required' });
    }

    const item = await prisma.vaultItem.create({
      data: {
        userId,
        name: name || 'Unnamed',
        username: username || '',
        ciphertext,
      },
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateItemHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, username, ciphertext, version } = req.body;

    if (!ciphertext) {
      return res.status(400).json({ message: 'ciphertext is required' });
    }

    const existing = await prisma.vaultItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const newVersion = typeof version === 'number' ? version + 1 : existing.version + 1;

    const updated = await prisma.vaultItem.update({
      where: { id },
      data: {
        name: name || existing.name,
        username: username || existing.username,
        ciphertext,
        version: newVersion,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function deleteItemHandler(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = await prisma.vaultItem.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await prisma.vaultItem.delete({ where: { id } });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
