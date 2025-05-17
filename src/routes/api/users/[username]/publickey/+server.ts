import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const GET: RequestHandler = async ({ params }) => {
  try {
    // Get the username from the route params
    const { username } = params;
    
    if (!username) {
      return json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // Query the database for the user and their active public key
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        activePublicKey: true
      }
    });
    
    // If user not found, return 404
    if (!user) {
      return json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the public key
    return json({
      username: user.username,
      publicKey: user.activePublicKey
    });
    
  } catch (error) {
    console.error('Error retrieving public key:', error);
    return json(
      { error: 'Failed to retrieve public key' },
      { status: 500 }
    );
  }
};