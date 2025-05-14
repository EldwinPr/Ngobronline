import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// PATCH: Deactivate a specific public key
export const PATCH: RequestHandler = async ({ params }) => {
  try {
    const { userId, keyId } = params; // Get userId and keyId from route parameters

    if (!userId || typeof userId !== 'string') {
      return json({ ok: false, error: 'User ID is required.' }, { status: 400 });
    }
    if (!keyId || typeof keyId !== 'string') {
      return json({ ok: false, error: 'Public Key ID is required.' }, { status: 400 });
    }
    const publicKeyToDeactivate = await prisma.publicKey.findUnique({
      where: {
        id: keyId,
      },
    });

    if (!publicKeyToDeactivate) {
        return json({ ok: false, error: 'Public key not found.' }, { status: 404 });
    }

    if (publicKeyToDeactivate.userId !== userId) {
        return json({ ok: false, error: 'Public key does not belong to the specified user.' }, { status: 403 });
    }

    if (!publicKeyToDeactivate.isActive) {
        return json({ ok: true, message: 'Public key is already inactive.', publicKey: publicKeyToDeactivate });
    }
    const updatedPublicKey = await prisma.publicKey.update({
      where: {
        id: keyId,
      },
      data: {
        isActive: false,
      },
    });

    return json({ ok: true, message: 'Public key deactivated successfully.', publicKey: updatedPublicKey });

  } catch (err: any) {
    console.error('Failed to deactivate public key:', err);
    if (err.code === 'P2025') {
        return json({ ok: false, error: 'Public key not found or does not belong to user.' }, { status: 404 });
    }
    return json({ ok: false, error: 'Failed to deactivate public key.' }, { status: 500 });
  }
};
