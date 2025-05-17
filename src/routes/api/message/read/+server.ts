import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { messageIds } = await request.json();
    
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return json({ error: 'Valid messageIds array is required' }, { status: 400 });
    }
    
    // Update all messages to READ status
    const result = await prisma.message.updateMany({
      where: { 
        id: { in: messageIds },
        status: 'DELIVERED'
      },
      data: { status: 'READ' }
    });
    
    return json({ 
      ok: true, 
      updatedCount: result.count 
    });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return json({ error: 'Failed to update message status' }, { status: 500 });
  }
};