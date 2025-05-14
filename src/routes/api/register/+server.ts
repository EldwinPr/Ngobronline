import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password, publicKeyString } = await request.json();

    if (
      typeof username !== 'string' ||
      username.length < 3 ||
      username.length > 30
    ) {
      return json({ error: 'Username must be 3–30 characters' }, { status: 400 });
    }

    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 100
    ) {
      return json({ error: 'Password must be 8–100 characters' }, { status: 400 });
    }

    if (
      typeof publicKeyString !== 'string' ||
      publicKeyString.length === 0
    ) {
      return json({ error: 'Valid publicKeyString is required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username,
        hashedPassword,
        publicKeys: {
          create: [
            {
              key: publicKeyString,
            },
          ],
        },
      },
    });

    return json(
      { ok: true, user: { id: user.id, username: user.username } },
      { status: 201 }
    );
  } catch (err: any) {
    if (
      err.code === 'P2002' &&
      err.meta?.target?.includes('username')
    ) {
      return json({ error: 'Username already taken' }, { status: 409 });
    }
    console.error('Registration error:', err);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
