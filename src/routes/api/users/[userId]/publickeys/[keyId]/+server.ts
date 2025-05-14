import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// PATCH: Deactivate a specific public key for the authenticated user
export const PATCH: RequestHandler = async ({ params, locals }) => {
  // 1) Authentication
  const authUser = locals.user;
  if (!authUser) {
    return json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { userId, keyId } = params;
  // 2) Authorization & parameter checks
  if (authUser.id !== userId) {
    return json({ ok: false, error: 'Cannot modify keys for another user' }, { status: 403 });
  }
  if (!keyId) {
    return json({ ok: false, error: 'Public key ID is required' }, { status: 400 });
  }

  try {
    // 3) Fetch the existing key
    const existingKey = await prisma.publicKey.findUnique({
      where: { id: keyId }
    });
    if (!existingKey) {
      return json({ ok: false, error: 'Public key not found' }, { status: 404 });
    }
    if (existingKey.userId !== authUser.id) {
      return json({ ok: false, error: 'Public key does not belong to user' }, { status: 403 });
    }
    if (!existingKey.isActive) {
      return json({
        ok: true,
        message: 'Public key already inactive',
        publicKey: existingKey
      });
    }

    // 4) Deactivate the key
    const updatedKey = await prisma.publicKey.update({
      where: { id: keyId },
      data: { isActive: false }
    });

    return json({
      ok: true,
      message: 'Public key deactivated successfully',
      publicKey: updatedKey
    });
  } catch (err: any) {
    console.error('Error deactivating public key:', err);
    // Handle “not found” from Prisma
    if (err.code === 'P2025') {
      return json({
        ok: false,
        error: 'Public key not found or not accessible'
      }, { status: 404 });
    }
    return json({
      ok: false,
      error: 'Failed to deactivate public key'
    }, { status: 500 });
  }
};