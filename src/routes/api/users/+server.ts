import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        publicKeys: { // Include the related public keys
          select: {
            id: true,       // Select the ID of the public key
            key: true,      // Select the public key string
            isActive: true, // Select the active status of the key
            createdAt: true // Optionally, include createdAt or updatedAt if needed
          },
          where: {
            isActive: true // Optional: Only fetch active public keys by default
          },
          orderBy: {
            createdAt: 'desc' // Optional: Order keys, e.g., newest first
          }
        }
      }
    });
    return json({ ok: true, users: users });

  } catch (err) {
    console.error('Failed to fetch users:', err); // Added more context to the error log
    return json({ ok: false, error: 'Failed to fetch users.' }, { status: 500 });
  }
};
