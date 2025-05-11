import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
  const { username, password } = await request.json();

  if (!username || !password) {
    return json(
      { error: 'Username and password are required.' },
      { status: 400 }
    );
  }

  // 1) Find user
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return json(
      { error: 'Invalid username or password.' },
      { status: 401 }
    );
  }

  // 2) Compare passwords
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) {
    return json(
      { error: 'Invalid username or password.' },
      { status: 401 }
    );
  }

  // 3) Success – return basic user info
  return json(
    {
      ok: true,
      user: {
        id: user.id,
        username: user.username
      }
    },
    { status: 200 }
  );
};
