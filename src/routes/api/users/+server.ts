import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, publicKey: true }
    });

    // Parse the JWK string into an object
    const parsed = users.map((u) => ({
      id: u.id,
      username: u.username,
      publicKey: JSON.parse(u.publicKey)
    }));

    return json({ ok: true, users: parsed });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Failed to fetch users.' }, { status: 500 });
  }
};
