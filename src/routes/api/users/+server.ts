import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        activePublicKey: true,
      }
    });
    return json({ ok: true, users: users });

  } catch (err) {
    console.error('Failed to fetch users:', err); // Added more context to the error log
    return json({ ok: false, error: 'Failed to fetch users.' }, { status: 500 });
  }
};
