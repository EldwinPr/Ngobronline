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

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return json(
      { error: 'Invalid username or password.' },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) {
    return json(
      { error: 'Invalid username or password.' },
      { status: 401 }
    );
  }

  const headers = new Headers();
  headers.append('Set-Cookie', `session=${user.id}; Path=/; HttpOnly`);

  return json(
    {
      ok: true,
      user: {
        id: user.id,
        username: user.username
      }
    },
    { status: 200, headers }
  );
};
