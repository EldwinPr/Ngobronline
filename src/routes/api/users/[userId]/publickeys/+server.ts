import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// POST: Add a new public key for the authenticated user
export const POST: RequestHandler = async ({ request, params, locals }) => {
  const authUser = locals.user;
  if (!authUser) {
    return json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }
  if (authUser.id !== params.userId) {
    return json({ ok: false, error: 'Cannot add key for another user' }, { status: 403 });
  }

  let payload: { publicKeyString?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { publicKeyString } = payload;
  if (typeof publicKeyString !== 'string' || !publicKeyString.trim()) {
    return json({ ok: false, error: 'Valid publicKeyString is required.' }, { status: 400 });
  }

  // Prevent duplicates
  const existing = await prisma.publicKey.findFirst({
    where: { userId: authUser.id, key: publicKeyString }
  });
  if (existing) {
    return json({ ok: false, error: 'This public key already exists.' }, { status: 409 });
  }

  const newKey = await prisma.publicKey.create({
    data: { userId: authUser.id, key: publicKeyString }
  });

  return json({ ok: true, publicKey: newKey }, { status: 201 });
};

// GET: List a user's public keys (active only, unless ?all=true)
export const GET: RequestHandler = async ({ params, url, locals }) => {
  const authUser = locals.user;
  if (!authUser) {
    return json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }
  if (authUser.id !== params.userId) {
    return json({ ok: false, error: 'Cannot fetch keys for another user' }, { status: 403 });
  }

  const showAll = url.searchParams.get('all') === 'true';
  const publicKeys = await prisma.publicKey.findMany({
    where: {
      userId: authUser.id,
      ...(showAll ? {} : { isActive: true })
    },
    select: {
      id: true,
      key: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return json({ ok: true, publicKeys });
};