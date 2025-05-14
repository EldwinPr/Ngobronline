import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

// POST: Add a new public key to a user
export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const { userId } = params; // Get userId from the route parameter
    const { publicKeyString } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return json({ ok: false, error: 'User ID is required.' }, { status: 400 });
    }

    if (!publicKeyString || typeof publicKeyString !== 'string' || publicKeyString.length === 0) {
      return json({ ok: false, error: 'Valid publicKeyString is required.' }, { status: 400 });
    }

    // Optional: Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    // Optional: Check if the public key already exists for this user to prevent duplicates
    const existingKey = await prisma.publicKey.findFirst({
      where: {
        userId: userId,
        key: publicKeyString,
      },
    });

    if (existingKey) {
      // Decide how to handle: error, or return existing, or update existing (e.g., ensure it's active)
      return json({ ok: false, error: 'This public key already exists for this user.' }, { status: 409 });
    }

    const newPublicKey = await prisma.publicKey.create({
      data: {
        key: publicKeyString,
        userId: userId,
        // isActive defaults to true as per schema
      },
    });

    return json({ ok: true, publicKey: newPublicKey }, { status: 201 });

  } catch (err: any) {
    console.error('Failed to add public key:', err);
    // More specific error handling (e.g., Prisma errors) could be added here
    return json({ ok: false, error: 'Failed to add public key.' }, { status: 500 });
  }
};

// GET: Get all public keys for a user
export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { userId } = params; // Get userId from the route parameter
    const showAll = url.searchParams.get('all') === 'true'; // e.g., /api/users/[userId]/publickeys?all=true

    if (!userId || typeof userId !== 'string') {
      return json({ ok: false, error: 'User ID is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            publicKeys: {
                where: showAll ? undefined : { isActive: true }, // Filter by active unless 'all=true'
                select: {
                    id: true,
                    key: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc', // Or your preferred order
                },
            },
        },
    });

    if (!user) {
      return json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    return json({ ok: true, publicKeys: user.publicKeys });

  } catch (err: any) {
    console.error('Failed to fetch public keys:', err);
    return json({ ok: false, error: 'Failed to fetch public keys.' }, { status: 500 });
  }
};
